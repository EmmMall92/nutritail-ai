import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const defaultSpreadsheetName = "Ξηρές σκύλου - Eshop.xlsx";
const defaultSpreadsheetPath = `C:/Users/NIOstb/Desktop/photo_foods_nutritail/${defaultSpreadsheetName}`;

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/dog_dry_eshop_spreadsheet_extract_v2.csv",
  review: "data/review/dog_dry_eshop_spreadsheet_extract_review.csv",
  report: "reports/dog_dry_eshop_spreadsheet_extract.md",
};

const reviewHeaders = [
  "formula_key",
  "brand",
  "formula_name",
  "species",
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
  if (eocdOffset === -1) throw new Error("Could not find XLSX central directory.");
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  let centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  for (let entryIndex = 0; entryIndex < totalEntries; entryIndex += 1) {
    if (buffer.readUInt32LE(centralDirectoryOffset) !== 0x02014b50) {
      throw new Error("Invalid XLSX central directory entry.");
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

function sharedStrings(entries) {
  const xml = entries.get("xl/sharedStrings.xml");
  if (!xml) return [];
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    decodeXml(
      [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
        .map((textMatch) => textMatch[1])
        .join("")
        .replace(/\s+/g, " ")
        .trim(),
    ),
  );
}

function workbookSheets(entries) {
  const workbook = entries.get("xl/workbook.xml") ?? "";
  const rels = entries.get("xl/_rels/workbook.xml.rels") ?? "";
  const relationshipTargets = new Map(
    [...rels.matchAll(/<Relationship\b([^>]+)>/g)].map((match) => {
      const attrs = Object.fromEntries([...match[1].matchAll(/(\w+)="([^"]*)"/g)].map((attr) => [attr[1], attr[2]]));
      const target = attrs.Target?.replace(/^\/?xl\//u, "") ?? "";
      return [attrs.Id, target.startsWith("xl/") ? target : `xl/${target}`];
    }),
  );
  return [...workbook.matchAll(/<sheet\b([^>]+)>/g)].map((match) => {
    const attrs = Object.fromEntries([...match[1].matchAll(/([\w:]+)="([^"]*)"/g)].map((attr) => [attr[1], attr[2]]));
    return { name: decodeXml(attrs.name ?? ""), path: relationshipTargets.get(attrs["r:id"]) ?? "" };
  });
}

function columnIndex(cellRef) {
  const letters = cellRef.match(/[A-Z]+/u)?.[0] ?? "A";
  return [...letters].reduce((sum, letter) => sum * 26 + (letter.charCodeAt(0) - 64), 0) - 1;
}

function sheetRows(entries, sheetPath, strings) {
  const xml = entries.get(sheetPath);
  if (!xml) return [];
  return [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const values = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = Object.fromEntries([...cellMatch[1].matchAll(/(\w+)="([^"]*)"/g)].map((attr) => [attr[1], attr[2]]));
      const index = columnIndex(attrs.r ?? "A1");
      const raw = cellMatch[2].match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
      const inline = cellMatch[2].match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? "";
      values[index] = attrs.t === "s" ? strings[Number(raw)] ?? "" : decodeXml(inline || raw);
    }
    return values.map((value) => cleanText(value));
  });
}

function cleanText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function keyText(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/κοτόπουλο/gu, " chicken ")
    .replace(/γαλοπούλα/gu, " turkey ")
    .replace(/μοσχάρι|βοδινό/gu, " beef ")
    .replace(/χοιρινό/gu, " pork ")
    .replace(/πάπια/gu, " duck ")
    .replace(/σολομό|σολομός/gu, " salmon ")
    .replace(/τόνο|τόνος|τοννος/gu, " tuna ")
    .replace(/αρνί/gu, " lamb ")
    .replace(/ψάρι/gu, " fish ")
    .replace(/ρύζι/gu, " rice ")
    .replace(/πατάτα/gu, " potato ")
    .replace(/λαχανικά|λαχανικα/gu, " vegetables ")
    .replace(/\s+/g, " ");
}

function removePackSize(value) {
  return cleanText(value.replace(/\b\d+(?:[,.]\d+)?\s*(?:kg|gr|g)\b/giu, "").replace(/\s+/g, " "));
}

function numberValue(value) {
  const match = String(value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!match) return "";
  return String(Number(match[0]));
}

function percentValue(text, labels) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${escaped}\\s*(?:-|:)?\\s*(\\d+(?:[,.]\\d+)?)\\s*%`, "iu"));
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
  const perKg = text.match(/(\d+(?:[,.]\d+)?)\s*kcal\s*\/?\s*kg/iu);
  if (perKg) return String(Number(perKg[1].replace(",", ".")));
  const per100g = text.match(/(\d+(?:[,.]\d+)?)\s*kcal\s*\/?\s*100\s*g/iu);
  if (per100g) return String(Number(per100g[1].replace(",", ".")) * 10);
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
    if (char === "," && depth === 0 && !decimalComma) {
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
      const key = ingredient.toLowerCase();
      if (!ingredient || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeBrand(value, title) {
  const raw = cleanText(value);
  if (raw) {
    return raw
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
      .replace(/\bGemon\b/g, "Gemon")
      .replace(/\bViozois\b/g, "Viozois")
      .replace(/\bMovex\b/g, "Movex")
      .replace(/Hill'S/g, "Hill's")
      .replace(/Sam'S Field/g, "Sam's Field")
      .replace(/Belcnado/g, "Belcando")
      .replace(/Aatu/g, "AATU")
      .replace(/Dr\. Clauders/g, "Dr. Clauder's");
  }
  return cleanText(title).split(/\s+/u)[0] || "Unknown";
}

function normalizeLifeStage(value, title) {
  const text = `${value} ${title}`.toLowerCase();
  if (text.includes("puppy")) return "puppy";
  if (text.includes("senior")) return "senior";
  return "adult";
}

function normalizeDogSize(value, title) {
  const text = `${value} ${title}`.toLowerCase();
  if (text.includes("small") || text.includes("mini") || text.includes("μικρόσωμ")) return "small";
  if (text.includes("medium") || text.includes("μεσα")) return "medium";
  if (text.includes("large") || text.includes("μεγαλ")) return "large";
  return "all";
}

function tagsFor(record, ingredients) {
  const text = `${Object.values(record).join(" ")} ${ingredients.join(" ")}`.toLowerCase();
  const tags = ["dog", "dry"];
  for (const [needle, tag] of [
    ["sterility", "sterilised"],
    ["στειρω", "sterilised"],
    ["puppy", "puppy"],
    ["senior", "senior"],
    ["light", "weight_control"],
    ["low fat", "weight_control"],
    ["monoprotein", "single_protein"],
    ["grain free", "grain_free"],
    ["gluten free", "gluten_free"],
    ["maintenance", "maintenance"],
    ["κοτόπουλο", "chicken"],
    ["γαλοπούλα", "turkey"],
    ["πάπια", "duck"],
    ["σολομ", "salmon"],
    ["τόνο", "tuna"],
    ["μοσχ", "beef"],
    ["βοδιν", "beef"],
    ["χοιριν", "pork"],
    ["αρν", "lamb"],
    ["ρύζι", "rice"],
    ["πατάτα", "potato"],
    ["αρακά", "pea"],
    ["καλαμπόκι", "corn"],
    ["σιτάρι", "wheat"],
  ]) {
    if (text.includes(needle)) tags.push(tag);
  }
  return [...new Set(tags)].join(";");
}

function recordsFromSheet(rows) {
  const headers = rows[0] ?? [];
  return rows
    .slice(1)
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])))
    .filter((record) => record["ΤΙΤΛΟΣ ESHOP"] || record["Περιγραφή είδους"]);
}

function rowCompleteness(row) {
  return [
    "ingredient_text",
    "protein_percent",
    "fat_percent",
    "fiber_percent",
    "ash_percent",
    "kcal_per_kg",
  ].filter((field) => row[field]).length;
}

function rowFromRecord(record, sourcePath, sheetName) {
  const title = record["ΤΙΤΛΟΣ ESHOP"] || record["Περιγραφή είδους"] || "";
  const notesText = `${record["ΠΕΡΙΓΡΑΦΗ SEO"]} ${record["ΑΝΑΛΥΤΙΚΗ ΠΕΡΙΓΡΑΦΗ"]} ${record["ΣΥΝΤΟΜΗ ΠΕΡΙΓΡΑΦΗ"]}`;
  const ingredientText = extractInlineSection(
    notesText,
    /Σύνθεση\s*:/iu,
    /(?:Πρόσθετα|Βιτ\.|Αναλυτικά|$)/iu,
  );
  const analysisText = extractInlineSection(
    notesText,
    /Αναλυτικά\s+συστατικά\s*:/iu,
    /(?:Σύνθεση|Πρόσθετα|Βιτ\.|$)/iu,
  );
  const ingredients = splitIngredients(ingredientText);
  const brand = normalizeBrand(record["ΚΑΤΑΣΚΕΥΑΣΤΗΣ"], title);
  const formulaName = removePackSize(title);
  const kcalKg = kcalPerKg(notesText);
  const commercialTags = tagsFor(record, ingredients);

  return {
    brand,
    formula_name: formulaName,
    display_name: `${brand} ${formulaName}`.replace(new RegExp(`^${brand}\\s+${brand}\\s+`, "i"), `${brand} `),
    species: "dog",
    format: "dry",
    life_stage: normalizeLifeStage(record["ΗΛΙΚΙΑ "] ?? "", title),
    dog_size: normalizeDogSize(record["ΜΕΓΕΘΟΣ"] ?? "", title),
    breed_target: "",
    medical_tags: [
      commercialTags.includes("weight_control") ? "obesity" : "",
      commercialTags.includes("single_protein") ? "allergy" : "",
      commercialTags.includes("grain_free") || commercialTags.includes("gluten_free") ? "gi_support" : "",
    ].filter(Boolean).join(";"),
    commercial_tags: commercialTags,
    ingredient_text: ingredientText,
    ingredients: ingredients.length ? JSON.stringify(ingredients) : "",
    primary_animal_proteins: ingredients.filter((item) => /(κοτόπουλ|πουλερ|γαλοπούλ|πάπια|σολομ|τόν|μοσχ|βοδιν|χοιριν|αρν|chicken|turkey|duck|salmon|tuna|beef|pork|lamb)/iu.test(item)).join(";"),
    carbohydrate_sources: ingredients.filter((item) => /(ρύζι|καλαμπόκι|σιτάρι|πατάτα|αρακά|κριθάρι|rice|corn|wheat|potato|pea|barley)/iu.test(item)).join(";"),
    fat_sources: ingredients.filter((item) => /(λίπη|έλαια|λάδι|ιχθυέλαιο|fat|oil)/iu.test(item)).join(";"),
    fiber_sources: ingredients.filter((item) => /(ίνες|πούλπα|τεύτλων|beet|fiber|fibre)/iu.test(item)).join(";"),
    additives_text: extractInlineSection(notesText, /Πρόσθετα\s+ανά\s+κιλό\s*:/iu, /(?:\*Σου|$)/iu),
    feeding_guide_text: "",
    kcal_per_100g: kcalKg ? String(Math.round((Number(kcalKg) / 10) * 10) / 10) : "",
    kcal_per_kg: kcalKg,
    protein_percent: boundedPercent(percentValue(analysisText, ["Πρωτείνη", "Πρωτεΐνη", "Πρωτεϊνη"]), 5, 60),
    fat_percent: boundedPercent(percentValue(analysisText, ["Λιπαρά", "Λίπος"]), 2, 45),
    fiber_percent: boundedPercent(percentValue(analysisText, ["Ίνες", "Ινες", "Ακατέργαστες ίνες"]), 0, 25),
    ash_percent: boundedPercent(percentValue(analysisText, ["Τέφρα", "Ακατέργαστη τέφρα"]), 0, 25),
    moisture_percent: boundedPercent(percentValue(analysisText, ["Υγρασία"]), 0, 20),
    calcium_percent: boundedPercent(percentValue(analysisText, ["Ασβέστιο"]), 0, 5),
    phosphorus_percent: boundedPercent(percentValue(analysisText, ["Φώσφορος"]), 0, 5),
    sodium_percent: boundedPercent(percentValue(analysisText, ["Νάτριο"]), 0, 5),
    magnesium_percent: boundedPercent(percentValue(analysisText, ["Μαγνήσιο"]), 0, 2),
    potassium_percent: "",
    omega3_percent: percentValue(analysisText, ["Ωμέγα-3", "Ω3", "Omega-3"]),
    omega6_percent: percentValue(analysisText, ["Ωμέγα-6", "Ω6", "Omega-6"]),
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
      "source_tier=uploaded_spreadsheet",
      `source_document=${sourcePath.replace(/\\/g, "/")}`,
      `source_sheet=${sheetName}`,
      `source_code=${record["Κωδικός είδους"] ?? ""}`,
      "dry_dog_rows_only=true",
      "formula_level_dedupe=true",
      "official_url_required=true",
      "Auto-extracted from Ξηρές σκύλου - Eshop.xlsx; verify against official source or label before import.",
    ].join("; "),
    formula_key: `${slugify(brand)}-${slugify(keyText(formulaName))}-dog-dry-gr-spreadsheet`,
    ean: "",
  };
}

function isDryDogRecord(record) {
  const text = `${record["ΕΙΔΟΣ"]} ${record["Περιγραφή είδους"]} ${record["ΤΙΤΛΟΣ ESHOP"]}`.toLowerCase();
  return text.includes("ξηρα") || text.includes("ξηρή") || text.includes("dry");
}

function dedupeRows(rows) {
  const byKey = new Map();
  const duplicateCounts = new Map();
  for (const row of rows) {
    const existing = byKey.get(row.formula_key);
    if (!existing || rowCompleteness(row) > rowCompleteness(existing)) {
      byKey.set(row.formula_key, row);
    }
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
    status: "needs_review",
    missing_fields: missingFieldsFor(row),
    evidence_path: row.source_notes.match(/source_document=([^;]+)/)?.[1] ?? "",
    duplicate_blocks_skipped: row.source_notes.match(/duplicate_blocks_skipped=(\d+)/)?.[1] ?? "0",
    recommended_action:
      "Attach official URL or label photo, verify extracted nutrients/ingredients, then preview in Food V2 before commit.",
    notes: "Dry dog e-shop spreadsheet extraction; rows stay in review because provenance is uploaded spreadsheet only.",
  };
}

function renderReport(rows, rawRows, skippedRows, sourcePath) {
  const coverage = (field) => rows.filter((row) => row[field]).length;
  const byBrand = rows.reduce((acc, row) => {
    acc[row.brand] = (acc[row.brand] ?? 0) + 1;
    return acc;
  }, {});
  const renderCounts = (counts) =>
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, count]) => `- ${label}: ${count}`)
      .join("\n");

  return `# Dog Dry Eshop Spreadsheet Extract

Generated: ${new Date().toISOString()}

## Summary

- Source spreadsheet: ${sourcePath}
- Raw spreadsheet rows: ${rawRows}
- Non-dry rows skipped: ${skippedRows}
- Extracted formula-level rows after dedupe: ${rows.length}
- Duplicate pack/formula rows skipped: ${rawRows - skippedRows - rows.length}
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Coverage

- Ingredients: ${coverage("ingredient_text")}/${rows.length}
- Protein/fat/fiber: ${rows.filter((row) => row.protein_percent && row.fat_percent && row.fiber_percent).length}/${rows.length}
- Ash: ${coverage("ash_percent")}/${rows.length}
- Kcal/ME: ${coverage("kcal_per_kg")}/${rows.length}
- Official URL: 0/${rows.length}

## By Brand

${renderCounts(byBrand)}

## Import Decision

All rows are marked needs_review/hold. This spreadsheet includes useful dog dry product discovery plus some label-like nutrition text, but official URLs/provenance are still required before import.
`;
}

async function main() {
  const sourcePath = process.argv[2] ?? defaultSpreadsheetPath;
  const templateText = await readFile(paths.template, "utf8");
  const headers = parseCsvLine(templateText.split(/\r?\n/)[0] ?? "");
  const entries = zipEntries(await readFile(sourcePath));
  const strings = sharedStrings(entries);
  const [sheet] = workbookSheets(entries);
  const records = recordsFromSheet(sheetRows(entries, sheet.path, strings));
  const dryRecords = records.filter(isDryDogRecord);
  const rows = dedupeRows(dryRecords.map((record) => rowFromRecord(record, sourcePath, sheet.name)));

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.review), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(headers, rows), "utf8");
  await writeFile(paths.review, writeCsv(reviewHeaders, rows.map(reviewRow)), "utf8");
  await writeFile(paths.report, renderReport(rows, records.length, records.length - dryRecords.length, sourcePath), "utf8");

  console.log(`Dog dry eshop spreadsheet rows: ${rows.length}`);
  console.log(`Raw spreadsheet rows: ${records.length}`);
  console.log(`Non-dry rows skipped: ${records.length - dryRecords.length}`);
  console.log(`Duplicate pack/formula rows skipped: ${dryRecords.length - rows.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
