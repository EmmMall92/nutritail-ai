import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const inputPath =
  process.argv[2] ??
  "data/raw/wave1/nutritail_wave1_royal_josera_foods_master.csv";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/wave1_royal_josera_foods_v2.csv",
  review: "data/review/wave1_royal_josera_foods_review.csv",
  report: "reports/wave1_royal_josera_foods_review.md",
};

const reviewHeaders = [
  "formula_key",
  "brand",
  "formula_name",
  "species",
  "status",
  "missing_fields",
  "source_document",
  "recommended_action",
  "notes",
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);

  const headers = (rows[0] ?? []).map((header) => header.replace(/^\uFEFF/, "").trim());
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  );
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
      values.push(current.replace(/^\uFEFF/, "").trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.replace(/^\uFEFF/, "").trim());
  return values;
}

function parseHeader(text) {
  return parseCsvLine(text.split(/\r?\n/)[0] ?? "");
}

function csvEscape(value) {
  if (value == null) return "";
  const text = Array.isArray(value) ? value.join(";") : String(value);
  if (text === "NULL") return "";
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function clean(value) {
  const text = String(value ?? "").trim();
  return text === "NULL" ? "" : text;
}

function splitTags(...values) {
  return [
    ...new Set(
      values
        .flatMap((value) => clean(value).split(/[|;,]/))
        .map((value) => value.trim())
        .filter(Boolean)
    ),
  ];
}

function missingFields(row) {
  const missing = [];
  const core = [
    "brand",
    "product_name",
    "formula_key",
    "species",
    "format",
    "life_stage",
    "ingredients",
    "protein_percent",
    "fat_percent",
    "fiber_percent",
  ];

  for (const field of core) {
    if (!clean(row[field])) missing.push(field);
  }

  if (!clean(row.kcal_per_100g) && !clean(row.kcal_per_kg)) {
    missing.push("kcal_per_100g_or_kcal_per_kg");
  }

  if (!clean(row.source_document)) missing.push("source_document");
  missing.push("data_source_url_or_official_evidence_path");

  return missing;
}

function toV2Row(row) {
  const commercialTags = splitTags(row.health_tags, row.ingredient_tags);
  const sourceDocument = clean(row.source_document);

  return {
    brand: clean(row.brand),
    formula_name: clean(row.product_name),
    display_name: clean(row.product_name),
    species: clean(row.species),
    format: clean(row.format),
    life_stage: clean(row.life_stage),
    dog_size: clean(row.size),
    breed_target: "",
    medical_tags: splitTags(row.medical_tags).join(";"),
    commercial_tags: commercialTags.join(";"),
    ingredient_text: clean(row.ingredients),
    ingredients: "",
    primary_animal_proteins: "",
    carbohydrate_sources: "",
    fat_sources: "",
    fiber_sources: "",
    additives_text: "",
    feeding_guide_text: "",
    kcal_per_100g: clean(row.kcal_per_100g),
    kcal_per_kg: clean(row.kcal_per_kg),
    protein_percent: clean(row.protein_percent),
    fat_percent: clean(row.fat_percent),
    fiber_percent: clean(row.fiber_percent),
    ash_percent: clean(row.ash_percent),
    moisture_percent: clean(row.moisture_percent),
    calcium_percent: clean(row.calcium_percent),
    phosphorus_percent: clean(row.phosphorus_percent),
    sodium_percent: clean(row.sodium_percent),
    magnesium_percent: clean(row.magnesium_percent),
    potassium_percent: clean(row.potassium_percent),
    omega3_percent: clean(row.omega3_percent),
    omega6_percent: clean(row.omega6_percent),
    dha_percent: "",
    epa_percent: "",
    taurine_mgkg: "",
    l_carnitine_mgkg: "",
    glucosamine_mgkg: "",
    chondroitin_mgkg: "",
    vitamin_a_iukg: "",
    vitamin_d3_iukg: "",
    vitamin_e_mgkg: "",
    iron_mgkg: "",
    zinc_mgkg: "",
    copper_mgkg: "",
    manganese_mgkg: "",
    iodine_mgkg: "",
    selenium_mgkg: "",
    data_quality_status: "needs_review",
    data_source_url: "",
    source_priority: "unknown",
    source_notes: `market=GR; basis=as-fed; source_tier=uploaded_document; source_document=${sourceDocument}; ${clean(row.source_notes)}`.trim(),
    formula_key: clean(row.formula_key),
    ean: "",
  };
}

function reviewRow(row) {
  const missing = missingFields(row);
  return {
    formula_key: clean(row.formula_key),
    brand: clean(row.brand),
    formula_name: clean(row.product_name),
    species: clean(row.species),
    status: missing.length > 0 ? "needs_review" : "ready_for_preview",
    missing_fields: missing.join("|"),
    source_document: clean(row.source_document),
    recommended_action:
      "Add official URL or evidence path, verify extracted nutrients against the source document, then preview through Food V2 before commit.",
    notes: clean(row.source_notes),
  };
}

function writeCsv(headers, rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

function renderReport(rows, reviewRows) {
  const speciesCounts = rows.reduce((acc, row) => {
    const key = clean(row.species) || "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const missingKcal = reviewRows.filter((row) =>
    row.missing_fields.includes("kcal_per_100g_or_kcal_per_kg")
  ).length;
  const missingProtein = reviewRows.filter((row) =>
    row.missing_fields.includes("protein_percent")
  ).length;
  const sourceDocuments = [...new Set(rows.map((row) => clean(row.source_document)).filter(Boolean))];

  return `# Wave 1 Royal/Josera Food Review

Generated: ${new Date().toISOString()}

## Summary

- Input rows: ${rows.length}
- Dog rows: ${speciesCounts.dog ?? 0}
- Cat rows: ${speciesCounts.cat ?? 0}
- Rows missing calories: ${missingKcal}
- Rows missing protein: ${missingProtein}
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Source Documents

${sourceDocuments.map((source) => `- ${source}`).join("\n") || "- None recorded"}

## Decision

This file is useful for Food Intelligence Wave 1, but it should stay in review until every imported row has an official URL or a private evidence path. All generated V2 rows are marked needs_review and source_priority=unknown on purpose.
`;
}

async function main() {
  const templateText = await readFile(paths.template, "utf8");
  const headers = parseHeader(templateText);
  const rows = parseCsv(await readFile(inputPath, "utf8"));
  const v2Rows = rows.map(toV2Row);
  const reviewRows = rows.map(reviewRow);

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.review), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });

  await writeFile(paths.output, writeCsv(headers, v2Rows), "utf8");
  await writeFile(paths.review, writeCsv(reviewHeaders, reviewRows), "utf8");
  await writeFile(paths.report, renderReport(rows, reviewRows), "utf8");

  console.log(`Wave 1 rows: ${rows.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
