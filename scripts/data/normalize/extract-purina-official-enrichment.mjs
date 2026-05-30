import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  registry: "data/sources/purina_official_link_registry.csv",
  output: "data/imports/purina_official_enrichment_extract_v2.csv",
  review: "data/review/purina_official_enrichment_extract_review.csv",
  report: "reports/purina_official_enrichment_extract.md",
};

const reviewHeaders = [
  "formula_key",
  "brand",
  "formula_name",
  "species",
  "format",
  "status",
  "missing_fields",
  "evidence_path",
  "duplicate_blocks_skipped",
  "recommended_action",
  "notes",
];

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

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
  const headers = rows[0].map((header) => header.replace(/^\uFEFF/, "").trim());
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function writeCsv(headers, rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(","))
    .join("\n")}\n`;
}

function cleanText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value) {
  return cleanText(
    String(value ?? "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">"),
  );
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0370-\u03ff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "NutriTail Purina official enrichment/1.0",
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status} ${url}`);
  return response.text();
}

function pageText(html) {
  return decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
}

function sectionBetween(text, start, stops) {
  const startIndex = text.indexOf(start);
  if (startIndex === -1) return "";
  const tail = text.slice(startIndex + start.length);
  const stopIndexes = stops.map((stop) => tail.indexOf(stop)).filter((index) => index >= 0);
  const end = stopIndexes.length ? Math.min(...stopIndexes) : tail.length;
  return cleanText(tail.slice(0, end));
}

function sectionBefore(text, start, stop) {
  const stopIndex = text.indexOf(stop);
  if (stopIndex === -1) return "";
  const startIndex = text.lastIndexOf(start, stopIndex - 1);
  if (startIndex === -1) return "";
  return cleanText(text.slice(startIndex + start.length, stopIndex).replace(/^&\s*Διατροφή\s*/i, ""));
}

function numberValue(value) {
  const match = String(value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!match) return "";
  return String(Number(match[0]));
}

function percentValue(text, labels) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${escaped}\\s*:?\\s*(\\d+(?:[,.]\\d+)?)\\s*%`, "iu"));
    const value = numberValue(match?.[1] ?? "");
    if (value) return value;
  }
  return "";
}

function normalizeFormat(title, url) {
  const text = `${title} ${url}`.toLowerCase();
  if (text.includes("dry") || text.includes("ξηρή") || text.includes("ξηρα")) return "dry";
  if (text.includes("wet") || text.includes("pouch") || text.includes("can") || text.includes("υγρή")) return "wet";
  return "";
}

function normalizeLifeStage(title) {
  const text = title.toLowerCase();
  if (text.includes("kitten")) return "kitten";
  if (text.includes("puppy")) return "puppy";
  if (text.includes("senior")) return "senior";
  return "adult";
}

function tagsFor(row, title, ingredientText) {
  const text = `${row.source_group} ${title} ${ingredientText}`.toLowerCase();
  const tags = [row.species, normalizeFormat(title, row.product_url)].filter(Boolean);
  for (const [needle, tag] of [
    ["steril", "sterilised"],
    ["kitten", "kitten"],
    ["puppy", "puppy"],
    ["senior", "senior"],
    ["light", "weight_control"],
    ["urinary", "urinary"],
    ["renal", "renal"],
    ["gastro", "gi_support"],
    ["hypoallergenic", "hypoallergenic"],
    ["chicken", "chicken"],
    ["κοτόπου", "chicken"],
    ["salmon", "salmon"],
    ["σολομ", "salmon"],
    ["turkey", "turkey"],
    ["γαλοπού", "turkey"],
    ["duck", "duck"],
    ["πάπια", "duck"],
    ["lamb", "lamb"],
    ["αρν", "lamb"],
    ["rice", "rice"],
    ["ρύζ", "rice"],
  ]) {
    if (text.includes(needle)) tags.push(tag);
  }
  return [...new Set(tags)].join(";");
}

function medicalTags(title) {
  const text = title.toLowerCase();
  return [
    text.includes("renal") ? "renal" : "",
    text.includes("urinary") ? "urinary" : "",
    text.includes("gastro") ? "gi_support" : "",
    text.includes("hypoallergenic") ? "allergy" : "",
    text.includes("light") ? "obesity" : "",
  ]
    .filter(Boolean)
    .join(";");
}

function rowFromPage(registryRow, text) {
  const extractedIngredientText = sectionBefore(text, "Συστατικά", "Αναλυτικά Συστατικά") ||
    sectionBetween(text, "Συστατικά Υψηλής", ["Αναλυτικά Συστατικά", "Οδηγός Διατροφής"]) ||
    sectionBetween(text, "Συστατικά", ["Αναλυτικά Συστατικά", "Οδηγός Διατροφής"]);
  const ingredientText = /^[.\s]*$/.test(extractedIngredientText) ? "" : extractedIngredientText;
  const analysisText = sectionBetween(text, "Αναλυτικά Συστατικά", ["Διατροφικά Πρόσθετα", "Οδηγός Διατροφής"]);
  const additivesText = sectionBetween(text, "Διατροφικά Πρόσθετα", ["Οδηγός Διατροφής", "Κριτικές"]);
  const feedingText = sectionBetween(text, "Οδηγός Διατροφής", ["Κριτικές", "Μπορεί να σας αρέσει"]);
  const title = registryRow.product_title;
  const format = normalizeFormat(title, registryRow.product_url);
  return {
    brand: registryRow.brand_family,
    formula_name: title,
    display_name: title,
    species: registryRow.species,
    format,
    life_stage: normalizeLifeStage(title),
    dog_size: registryRow.species === "dog" ? "all" : "",
    breed_target: "",
    medical_tags: medicalTags(title),
    commercial_tags: tagsFor(registryRow, title, ingredientText),
    ingredient_text: ingredientText,
    ingredients: "",
    primary_animal_proteins: "",
    carbohydrate_sources: "",
    fat_sources: "",
    fiber_sources: "",
    additives_text: additivesText,
    feeding_guide_text: feedingText,
    kcal_per_100g: "",
    kcal_per_kg: "",
    protein_percent: percentValue(analysisText, ["Περιεκτικότητα σε πρωτεΐνες", "Πρωτεΐνες", "Πρωτεΐνη"]),
    fat_percent: percentValue(analysisText, ["Περιεκτικότητα σε λιπαρές ουσίες", "Λιπαρές ουσίες"]),
    fiber_percent: percentValue(analysisText, ["Ακατέργαστες διατροφικές ίνες", "Ακατέργαστες ίνες"]),
    ash_percent: percentValue(analysisText, ["Ακατέργαστη τέφρα"]),
    moisture_percent: percentValue(analysisText, ["Υγρασία"]),
    calcium_percent: "",
    phosphorus_percent: "",
    sodium_percent: "",
    magnesium_percent: "",
    potassium_percent: "",
    omega3_percent: "",
    omega6_percent: "",
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
    data_quality_status: "partial",
    data_source_url: registryRow.product_url,
    source_priority: "official",
    source_notes: [
      "market=GR",
      "basis=as-fed",
      "source_tier=official",
      "source_kind=product_page",
      `source_group=${registryRow.source_group}`,
      "Auto-extracted from official Purina Greece product page; review before commit.",
    ].join("; "),
    formula_key: `purina-official-${slugify(title)}-${registryRow.species}-${format || "unknown"}-gr`,
    ean: "",
  };
}

function missingFieldsFor(row) {
  const missing = [];
  for (const field of ["ingredient_text", "protein_percent", "fat_percent", "fiber_percent"]) {
    if (!row[field]) missing.push(field);
  }
  if (!row.kcal_per_kg && !row.kcal_per_100g) missing.push("kcal_per_100g_or_kcal_per_kg");
  return missing.join("|");
}

function reviewRow(row) {
  return {
    formula_key: row.formula_key,
    brand: row.brand,
    formula_name: row.formula_name,
    species: row.species,
    format: row.format,
    status: "partial",
    missing_fields: missingFieldsFor(row),
    evidence_path: row.data_source_url,
    duplicate_blocks_skipped: "0",
    recommended_action: "Match to existing/staged Purina formula, verify official nutrients, then preview in Food V2 before commit.",
    notes: "Official Purina page enrichment; calories/minerals may still need backfill.",
  };
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "unknown";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function renderCounts(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => `- ${label}: ${count}`)
    .join("\n");
}

function renderReport(rows) {
  const coverage = (field) => rows.filter((row) => String(row[field] ?? "").trim()).length;
  return `# Purina Official Enrichment Extract

Generated: ${new Date().toISOString()}

## Summary

- Official complete-food product pages processed: ${rows.length}
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Coverage

- Ingredients text: ${coverage("ingredient_text")}/${rows.length}
- Protein/fat/fiber: ${rows.filter((row) => row.protein_percent && row.fat_percent && row.fiber_percent).length}/${rows.length}
- Ash: ${coverage("ash_percent")}/${rows.length}
- Moisture: ${coverage("moisture_percent")}/${rows.length}
- Kcal/ME: ${rows.filter((row) => row.kcal_per_kg || row.kcal_per_100g).length}/${rows.length}
- Official URL: ${coverage("data_source_url")}/${rows.length}

## By Brand

${renderCounts(countBy(rows, "brand"))}

## By Species

${renderCounts(countBy(rows, "species"))}

## Import Decision

Rows are marked partial with official provenance. They should be matched to existing/staged Purina rows and reviewed before any Food V2 commit.
`;
}

async function main() {
  const templateText = await readFile(paths.template, "utf8");
  const headers = templateText.split(/\r?\n/)[0].split(",");
  const registry = parseCsv(await readFile(paths.registry, "utf8")).filter(
    (row) => row.product_scope === "complete_food_candidate",
  );
  const rows = [];
  for (const registryRow of registry) {
    const html = await fetchText(registryRow.product_url);
    rows.push(rowFromPage(registryRow, pageText(html)));
  }

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.review), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(headers, rows), "utf8");
  await writeFile(paths.review, writeCsv(reviewHeaders, rows.map(reviewRow)), "utf8");
  await writeFile(paths.report, renderReport(rows), "utf8");

  console.log(`Purina official enrichment rows: ${rows.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
