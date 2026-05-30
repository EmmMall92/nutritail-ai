import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const sourceDirectory = "C:/Users/NIOstb/Desktop/photo_foods_nutritail";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/schesir_gheda_marketplace_ods_extract_v2.csv",
  review: "data/review/schesir_gheda_marketplace_ods_extract_review.csv",
  report: "reports/schesir_gheda_marketplace_ods_extract.md",
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

function writeCsv(headers, rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(","))
    .join("\n")}\n`;
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function zipEntries(buffer) {
  const entries = new Map();
  let eocdOffset = -1;
  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      eocdOffset = index;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error("Could not find ODS central directory.");
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  let centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  for (let entryIndex = 0; entryIndex < totalEntries; entryIndex += 1) {
    if (buffer.readUInt32LE(centralDirectoryOffset) !== 0x02014b50) {
      throw new Error("Invalid ODS central directory entry.");
    }
    const compressionMethod = buffer.readUInt16LE(centralDirectoryOffset + 10);
    const compressedSize = buffer.readUInt32LE(centralDirectoryOffset + 20);
    const fileNameLength = buffer.readUInt16LE(centralDirectoryOffset + 28);
    const extraLength = buffer.readUInt16LE(centralDirectoryOffset + 30);
    const commentLength = buffer.readUInt16LE(centralDirectoryOffset + 32);
    const localHeaderOffset = buffer.readUInt32LE(centralDirectoryOffset + 42);
    const fileName = buffer
      .subarray(centralDirectoryOffset + 46, centralDirectoryOffset + 46 + fileNameLength)
      .toString("utf8");
    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
    entries.set(
      fileName,
      compressionMethod === 8 ? inflateRawSync(compressed).toString("utf8") : compressed.toString("utf8"),
    );
    centralDirectoryOffset += 46 + fileNameLength + extraLength + commentLength;
  }
  return entries;
}

function cleanText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

function normalizedText(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugify(value) {
  return normalizedText(value)
    .replace(/[^a-z0-9\u0370-\u03ff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function odsTables(content) {
  return [...content.matchAll(/<table:table\b([^>]*)>([\s\S]*?)<\/table:table>/g)].map((match) => {
    const name = decodeXml(match[1].match(/table:name="([^"]*)"/)?.[1] ?? "");
    return { name, xml: match[2] };
  });
}

function cellText(cellXml) {
  const paragraphs = [...cellXml.matchAll(/<text:p\b[^>]*>([\s\S]*?)<\/text:p>/g)].map((match) =>
    decodeXml(match[1].replace(/<[^>]+>/g, " ")),
  );
  return cleanText(paragraphs.join("\n"));
}

function odsRows(tableXml) {
  return [...tableXml.matchAll(/<table:table-row\b[^>]*>([\s\S]*?)<\/table:table-row>/g)].map((rowMatch) => {
    const values = [];
    for (const cellMatch of rowMatch[1].matchAll(/<table:table-cell\b([^>]*)>([\s\S]*?)<\/table:table-cell>/g)) {
      const repeat = Number(cellMatch[1].match(/table:number-columns-repeated="(\d+)"/)?.[1] ?? "1");
      const value = cellText(cellMatch[2]);
      values.push(...Array(Math.min(repeat, 20)).fill(value));
    }
    return values;
  });
}

function numberValue(value) {
  const match = String(value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!match) return "";
  return String(Number(match[0]));
}

function percentValue(text, labels) {
  const searchable = normalizedText(text);
  for (const label of labels) {
    const escaped = normalizedText(label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = searchable.match(new RegExp(`${escaped}\\s*(?:-|:)?\\s*(\\d+(?:[,.]\\d+)?)\\s*%`, "iu"));
    const value = numberValue(match?.[1] ?? "");
    if (value) return value;
  }
  return "";
}

function boundedPercent(value, min, max) {
  if (!value) return "";
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) return "";
  return value;
}

function kcalPerKg(text) {
  const per100g = text.match(/(\d+(?:[,.]\d+)?)\s*(?:kcal|θερμιδ)\s*\/?\s*100\s*g/iu);
  if (per100g) return String(Number(per100g[1].replace(",", ".")) * 10);
  const perKg = text.match(/(\d+(?:[,.]\d+)?)\s*kcal\s*\/?\s*kg/iu);
  if (perKg) return String(Number(perKg[1].replace(",", ".")));
  return "";
}

function extractInlineSection(text, labelPattern, stopPattern) {
  const match = text.match(labelPattern);
  if (match?.index == null) return "";
  const value = text.slice(match.index + match[0].length);
  const stop = value.match(stopPattern);
  return cleanText(stop?.index != null ? value.slice(0, stop.index) : value);
}

function splitIngredients(text) {
  const ingredients = [];
  let current = "";
  let depth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
    const decimalComma = /\d/.test(text[index - 1] ?? "") && /\d/.test(text[index + 1] ?? "");
    if ((char === "," || char === ";") && depth === 0 && !decimalComma) {
      ingredients.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  ingredients.push(current);
  const seen = new Set();
  return ingredients
    .map((ingredient) => cleanText(ingredient).replace(/\.$/, ""))
    .filter((ingredient) => {
      const key = normalizedText(ingredient);
      if (!ingredient || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function removePackSize(value) {
  return cleanText(value.replace(/\b\d+(?:[,.]\d+)?\s*(?:kg|gr|g)\b/giu, "").replace(/\s+/g, " "));
}

function normalizeSpecies(tableName, title, description) {
  const text = normalizedText(`${tableName} ${title} ${description}`);
  if (text.includes("γατα") || text.includes("cat")) return "cat";
  if (text.includes("σκυλος") || text.includes("dog")) return "dog";
  return "";
}

function normalizeFormat(title, description) {
  const text = normalizedText(`${title} ${description}`);
  if (text.includes("ξηρα") || text.includes("ξηρ.")) return "dry";
  if (text.includes("κον.") || text.includes("κονσερβα") || text.includes("υγρη")) return "wet";
  return "";
}

function normalizeLifeStage(title, description, species) {
  const text = normalizedText(`${title} ${description}`);
  if (text.includes("puppy")) return "puppy";
  if (text.includes("kitten")) return "kitten";
  if (text.includes("senior")) return "senior";
  if (text.includes("adult")) return "adult";
  return species === "cat" ? "adult" : "adult";
}

function normalizeBrand(title) {
  const text = normalizedText(title);
  if (text.includes("schesir")) return "Schesir";
  if (text.includes("gheda")) return "Gheda";
  if (text.includes("properform") || text.includes("proper form")) return "Gheda";
  if (text.includes("dog & dog")) return "Dog & Dog";
  if (text.includes("unica classe")) return "Unica Classe";
  if (text.includes("unica natura")) return "Unica Natura";
  if (text.includes("chat & chat")) return "Chat & Chat";
  if (text.includes("koccole")) return "Le Koccole";
  if (text.includes("suavis")) return "Suavis";
  return cleanText(title).split(/\s+/u)[0] || "Unknown";
}

function tagsFor(title, description, ingredients, species, format) {
  const text = normalizedText(`${title} ${description} ${ingredients.join(" ")}`);
  const tags = [species, format].filter(Boolean);
  for (const [needle, tag] of [
    ["steril", "sterilised"],
    ["puppy", "puppy"],
    ["kitten", "kitten"],
    ["mono", "single_protein"],
    ["κοτοπουλ", "chicken"],
    ["τονο", "tuna"],
    ["σολομ", "salmon"],
    ["βοδιν", "beef"],
    ["μοσχ", "beef"],
    ["χοιριν", "pork"],
    ["ψαρ", "fish"],
    ["ρυζ", "rice"],
    ["αρακα", "pea"],
  ]) {
    if (text.includes(needle)) tags.push(tag);
  }
  return [...new Set(tags)].join(";");
}

function rowFromRecord(tableName, row, sourcePath) {
  const sourceCode = row[1] ?? "";
  const sourceDescription = row[2] ?? "";
  const title = row[3] || sourceDescription;
  const notesText = cleanText(`${row[4] ?? ""} ${row[5] ?? ""} ${row[6] ?? ""}`);
  const ingredientText = extractInlineSection(
    notesText,
    /(?:Σύνθεση|Συνθεση)\s*:/iu,
    /(?:Αναλυτικά|Αναλυτικα|Θερμίδες|Θερμιδες|Πρόσθετα|Προσθετα|Καθημερινές|$)/iu,
  );
  const analysisText = extractInlineSection(
    notesText,
    /(?:Αναλυτικά\s+συστατικά|Αναλυτικα\s+συστατικα)\s*:/iu,
    /(?:Σύνθεση|Συνθεση|Θερμίδες|Θερμιδες|Πρόσθετα|Προσθετα|Καθημερινές|$)/iu,
  );
  const ingredients = splitIngredients(ingredientText);
  const species = normalizeSpecies(tableName, title, sourceDescription);
  const format = normalizeFormat(title, sourceDescription);
  const brand = normalizeBrand(title);
  const formulaName = removePackSize(title);
  const kcalKg = kcalPerKg(notesText);
  const commercialTags = tagsFor(title, sourceDescription, ingredients, species, format);

  return {
    brand,
    formula_name: formulaName,
    display_name: `${brand} ${formulaName}`.replace(new RegExp(`^${brand}\\s+${brand}\\s+`, "i"), `${brand} `),
    species,
    format,
    life_stage: normalizeLifeStage(title, sourceDescription, species),
    dog_size: species === "dog" ? "all" : "",
    breed_target: "",
    medical_tags: commercialTags.includes("single_protein") ? "allergy" : "",
    commercial_tags: commercialTags,
    ingredient_text: ingredientText,
    ingredients: ingredients.length ? JSON.stringify(ingredients) : "",
    primary_animal_proteins: ingredients
      .filter((item) => /(κοτοπουλ|τονο|σολομ|μοσχ|βοδιν|χοιριν|ψαρ|chicken|tuna|salmon|beef|pork|fish)/iu.test(item))
      .join(";"),
    carbohydrate_sources: ingredients.filter((item) => /(ρυζ|αρακα|rice|pea)/iu.test(item)).join(";"),
    fat_sources: ingredients.filter((item) => /(λιπ|ελαι|λαδι|fat|oil)/iu.test(item)).join(";"),
    fiber_sources: ingredients.filter((item) => /(ιν|πολπ|fiber|fibre)/iu.test(item)).join(";"),
    additives_text: extractInlineSection(notesText, /(?:Πρόσθετα|Προσθετα|Διατροφικά πρόσθετα)\s*:/iu, /(?:Καθημερινές|Βάρος|$)/iu),
    feeding_guide_text: extractInlineSection(notesText, /(?:Καθημερινές\s+Δοσολογίες|Βάρος\s+γάτας|Βάρος\s+σκύλου)\s*:?/iu, /$/iu),
    kcal_per_100g: kcalKg ? String(Math.round((Number(kcalKg) / 10) * 10) / 10) : "",
    kcal_per_kg: kcalKg,
    protein_percent: boundedPercent(percentValue(analysisText, ["Πρωτεΐνη", "Πρωτεϊνη", "Ακατέργαστη πρωτεΐνη"]), 3, 70),
    fat_percent: boundedPercent(percentValue(analysisText, ["λιπαρές ουσίες", "Λιπαρά", "Λίπος", "έλαια και λίπη"]), 0, 50),
    fiber_percent: boundedPercent(percentValue(analysisText, ["ινώδεις ουσίες", "ίνες", "φυτικές ίνες"]), 0, 30),
    ash_percent: boundedPercent(percentValue(analysisText, ["τέφρα", "ολική τέφρα"]), 0, 30),
    moisture_percent: boundedPercent(percentValue(analysisText, ["υγρασία"]), 0, 90),
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
    data_quality_status: "needs_review",
    data_source_url: "",
    source_priority: "unknown",
    source_notes: [
      "market=GR",
      "basis=as-fed",
      "source_tier=uploaded_ods",
      `source_document=${sourcePath.replace(/\\/g, "/")}`,
      `source_sheet=${tableName}`,
      `source_code=${sourceCode}`,
      "formula_level_dedupe=true",
      "official_url_required=true",
      "Auto-extracted from Schesir/Gheda Marketplace ODS; verify against official source or label before import.",
    ].join("; "),
    formula_key: `${slugify(brand)}-${slugify(formulaName)}-${species || "unknown"}-${format || "unknown"}-gr-ods`,
    ean: "",
  };
}

function isFoodRow(row) {
  return row.brand && row.formula_name && row.species && row.format;
}

function rowCompleteness(row) {
  return ["ingredient_text", "protein_percent", "fat_percent", "fiber_percent", "ash_percent", "moisture_percent"].filter(
    (field) => row[field],
  ).length;
}

function dedupeRows(rows) {
  const byKey = new Map();
  const duplicateCounts = new Map();
  for (const row of rows) {
    const existing = byKey.get(row.formula_key);
    if (!existing || rowCompleteness(row) > rowCompleteness(existing)) byKey.set(row.formula_key, row);
    if (existing) duplicateCounts.set(row.formula_key, (duplicateCounts.get(row.formula_key) ?? 0) + 1);
  }
  return [...byKey.values()].map((row) => ({
    ...row,
    source_notes: `${row.source_notes}; duplicate_blocks_skipped=${duplicateCounts.get(row.formula_key) ?? 0}`,
  }));
}

function missingFieldsFor(row) {
  const missing = [];
  if (!row.ingredient_text) missing.push("ingredient_text");
  if (!row.kcal_per_kg) missing.push("kcal_per_100g_or_kcal_per_kg");
  if (!row.data_source_url) missing.push("data_source_url_or_official_evidence");
  for (const field of ["protein_percent", "fat_percent", "fiber_percent"]) {
    if (!row[field]) missing.push(field);
  }
  return missing.join("|");
}

function reviewRow(row) {
  return {
    formula_key: row.formula_key,
    brand: row.brand,
    formula_name: row.formula_name,
    species: row.species,
    format: row.format,
    status: "needs_review",
    missing_fields: missingFieldsFor(row),
    evidence_path: row.source_notes.match(/source_document=([^;]+)/)?.[1] ?? "",
    duplicate_blocks_skipped: row.source_notes.match(/duplicate_blocks_skipped=(\d+)/)?.[1] ?? "0",
    recommended_action:
      "Attach official URL or label photo, verify extracted nutrients/ingredients, then preview in Food V2 before commit.",
    notes: "Marketplace ODS extraction; rows stay in review because provenance is uploaded ODS only.",
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

function renderReport(rows, rawRows, sourcePath) {
  const coverage = (field) => rows.filter((row) => row[field]).length;
  return `# Schesir/Gheda Marketplace ODS Extract

Generated: ${new Date().toISOString()}

## Summary

- Source ODS: ${sourcePath}
- Raw ODS rows: ${rawRows}
- Extracted formula-level rows after dedupe: ${rows.length}
- Duplicate pack/formula rows skipped: ${rawRows - rows.length}
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Coverage

- Ingredients: ${coverage("ingredient_text")}/${rows.length}
- Protein/fat/fiber: ${rows.filter((row) => row.protein_percent && row.fat_percent && row.fiber_percent).length}/${rows.length}
- Ash: ${coverage("ash_percent")}/${rows.length}
- Moisture: ${coverage("moisture_percent")}/${rows.length}
- Kcal/ME: ${coverage("kcal_per_kg")}/${rows.length}
- Official URL: 0/${rows.length}

## By Species

${renderCounts(countBy(rows, "species"))}

## By Format

${renderCounts(countBy(rows, "format"))}

## By Brand

${renderCounts(countBy(rows, "brand"))}

## Import Decision

All rows are marked needs_review/hold. This ODS contains useful marketplace descriptions and label-like data, but official URLs/provenance are still required before import.
`;
}

async function resolveSourcePath() {
  if (process.argv[2]) return process.argv[2];
  const files = await readdir(sourceDirectory);
  const file = files.find((name) => name.endsWith(".ods"));
  if (!file) throw new Error(`Could not find ODS source in ${sourceDirectory}`);
  return path.join(sourceDirectory, file);
}

async function main() {
  const sourcePath = await resolveSourcePath();
  const templateText = await readFile(paths.template, "utf8");
  const headers = parseCsvLine(templateText.split(/\r?\n/)[0] ?? "");
  const entries = zipEntries(await readFile(sourcePath));
  const content = entries.get("content.xml");
  if (!content) throw new Error("ODS content.xml not found.");
  const rawRows = [];
  for (const table of odsTables(content)) {
    if (table.name.startsWith("_")) continue;
    rawRows.push(...odsRows(table.xml).slice(1).map((row) => ({ tableName: table.name, row })));
  }
  const rows = dedupeRows(rawRows.map(({ tableName, row }) => rowFromRecord(tableName, row, sourcePath)).filter(isFoodRow));

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.review), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(headers, rows), "utf8");
  await writeFile(paths.review, writeCsv(reviewHeaders, rows.map(reviewRow)), "utf8");
  await writeFile(paths.report, renderReport(rows, rawRows.length, sourcePath), "utf8");

  console.log(`Schesir/Gheda marketplace ODS rows: ${rows.length}`);
  console.log(`Raw ODS rows: ${rawRows.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
