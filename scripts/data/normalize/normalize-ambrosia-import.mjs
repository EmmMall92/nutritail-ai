import { readFile, writeFile } from "node:fs/promises";

const paths = {
  raw: "data/raw/ambrosia/ambrosia-products-el.json",
  jsonMaster: "data/imports/nutritail_foods_euuk_v1.json",
  csvMirror: "data/imports/nutritail_foods_euuk_v1.csv",
  missingPhotoQueue: "data/imports/nutritail_foods_missing_photo_queue.csv",
};

const csvHeaders = [
  "brand",
  "name",
  "species",
  "life_stage",
  "size",
  "tags",
  "ingredients",
  "kcal_per_100g",
  "protein_percent",
  "fat_percent",
  "fiber_percent",
  "sodium_percent",
  "magnesium_percent",
  "calcium_percent",
  "phosphorus_percent",
  "data_quality_status",
  "data_source_url",
  "data_notes",
];

const missingHeaders = [
  "formula_key",
  "brand",
  "name",
  "species",
  "market",
  "missing_fields",
  "data_source_url",
  "priority",
  "notes",
];

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formulaKey(row, market = "GR") {
  return slugify(`${row.brand}-${row.name}-${row.species}-${market}`);
}

function csvEscape(value) {
  if (value == null) return "";
  const text = Array.isArray(value) ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "");
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function writeCsv(headers, rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

function normalizeLifeStage(candidateStages) {
  if (candidateStages?.includes("senior")) return "senior";
  if (candidateStages?.includes("growth")) return "young";
  return "adult";
}

function tagsFor(row, lifeStage) {
  const tags = ["dry", "official_source"];
  if (lifeStage === "senior") tags.push("senior");
  if (lifeStage === "young") tags.push("puppy", "growth");
  if (lifeStage === "adult") tags.push("adult");
  return tags;
}

function normalizeAmbrosiaRow(row) {
  const lifeStage = normalizeLifeStage(row.candidate_life_stages);
  const name = row.title.replace(/\s*&\s*/g, " & ").replace(/\s+/g, " ").trim();
  return {
    brand: "Ambrosia",
    name,
    species: "dog",
    life_stage: lifeStage,
    size: "all_breeds",
    tags: tagsFor(row, lifeStage),
    ingredients: row.ingredients,
    kcal_per_100g: row.kcal_per_100g,
    protein_percent: row.protein_percent,
    fat_percent: row.fat_percent,
    fiber_percent: row.fiber_percent,
    sodium_percent: null,
    magnesium_percent: null,
    calcium_percent: row.calcium_percent,
    phosphorus_percent: row.phosphorus_percent,
    data_quality_status: "partial",
    data_source_url: row.source_url,
    data_notes: [
      "market=GR",
      "basis=as-fed",
      "source_tier=official",
      "source_kind=product_page",
      `moisture=${row.moisture_percent}`,
      "form=dry",
      "note=Ambrosia official Greek product page; sodium_percent and magnesium_percent not published.",
    ].join("; "),
  };
}

function isSafeDogDryCandidate(row) {
  return (
    row.brand === "Ambrosia" &&
    row.candidate_species === "dog" &&
    row.candidate_form === "dry" &&
    row.missing_core_fields.length === 0
  );
}

async function main() {
  const raw = JSON.parse(await readFile(paths.raw, "utf8"));
  const jsonRows = JSON.parse(await readFile(paths.jsonMaster, "utf8"));
  const missingRows = parseCsv(await readFile(paths.missingPhotoQueue, "utf8"));

  const existingFoodKeys = new Set(jsonRows.map((row) => formulaKey(row, row.data_notes?.match(/market=([^;]+)/)?.[1] ?? "EUUK")));
  const existingMissingKeys = new Set(missingRows.map((row) => row.formula_key));
  const candidates = raw.products.filter(isSafeDogDryCandidate).map(normalizeAmbrosiaRow);
  const appendedRows = [];

  for (const row of candidates) {
    const key = formulaKey(row);
    if (existingFoodKeys.has(key)) continue;

    jsonRows.push(row);
    appendedRows.push(row);
    existingFoodKeys.add(key);

    if (!existingMissingKeys.has(key)) {
      missingRows.push({
        formula_key: key,
        brand: row.brand,
        name: row.name,
        species: row.species,
        market: "GR",
        missing_fields: JSON.stringify(["sodium_percent", "magnesium_percent"]),
        data_source_url: row.data_source_url,
        priority: "medium",
        notes: "Official Ambrosia GR page lacks sodium and magnesium percentages; backfill from label photo or official sheet.",
      });
      existingMissingKeys.add(key);
    }
  }

  await writeFile(paths.jsonMaster, `${JSON.stringify(jsonRows, null, 2)}\n`, "utf8");
  await writeFile(paths.csvMirror, writeCsv(csvHeaders, jsonRows), "utf8");
  await writeFile(paths.missingPhotoQueue, writeCsv(missingHeaders, missingRows), "utf8");

  console.log(`Ambrosia safe dog dry candidates: ${candidates.length}`);
  console.log(`Appended food rows: ${appendedRows.length}`);
  console.log(`Total food rows: ${jsonRows.length}`);
  console.log(`Missing-photo queue rows: ${missingRows.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
