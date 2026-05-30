import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const defaultSpreadsheetPath = "C:/Users/NIOstb/Desktop/photo_foods_nutritail/Gheda-Schesir Σκύλου (Eshop).xlsx";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/gheda_schesir_spreadsheet_extract_v2.csv",
  review: "data/review/gheda_schesir_spreadsheet_extract_review.csv",
  report: "reports/gheda_schesir_spreadsheet_extract.md",
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
  const eocdSignature = 0x06054b50;
  let eocdOffset = -1;
  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === eocdSignature) {
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
    return {
      name: decodeXml(attrs.name ?? ""),
      path: relationshipTargets.get(attrs["r:id"]) ?? "",
    };
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
    .replace(/φιλέτο/gu, " fillet ")
    .replace(/γαλοπούλα/gu, " turkey ")
    .replace(/μοσχάρι/gu, " beef ")
    .replace(/βοδινό/gu, " beef ")
    .replace(/χοιρινό/gu, " pork ")
    .replace(/προσούτο|ζαμπόν/gu, " ham ")
    .replace(/πάπια/gu, " duck ")
    .replace(/σολομό|σολομός/gu, " salmon ")
    .replace(/τόνο|τόνος|τοννος/gu, " tuna ")
    .replace(/αρνί/gu, " lamb ")
    .replace(/μπακαλιάρο|μπακαλιάρος/gu, " cod ")
    .replace(/ψάρι/gu, " fish ")
    .replace(/μήλο/gu, " apple ")
    .replace(/παπάγια/gu, " papaya ")
    .replace(/αλόη/gu, " aloe ")
    .replace(/λαχανικά|λαχανικα/gu, " vegetables ")
    .replace(/αρακά/gu, " pea ")
    .replace(/ρύζι/gu, " rice ")
    .replace(/πατάτα/gu, " potato ")
    .replace(/σε ζελέ/gu, " jelly ")
    .replace(/\s+/g, " ");
}

function removePackSize(value) {
  return cleanText(
    value
      .replace(/\b\d+(?:[,.]\d+)?\s*(?:kg|gr|g)\b/giu, "")
      .replace(/\s+/g, " "),
  );
}

function normalizeBrand(value, title) {
  const text = `${value} ${title}`.toLowerCase();
  if (text.includes("schesir")) return "Schesir";
  if (text.includes("gheda")) return "Gheda";
  if (text.includes("chat & chat")) return "Chat & Chat";
  if (text.includes("koccole")) return "Le Koccole";
  if (text.includes("suavis")) return "Suavis";
  return cleanText(value) || "Gheda/Schesir";
}

function normalizeFormat(value, title) {
  const text = `${value} ${title}`.toLowerCase();
  if (text.includes("ξηρα")) return "dry";
  if (text.includes("κονσερβα") || text.includes("κον.") || text.includes("φακελ") || text.includes("pouch")) return "wet";
  return text.includes("dry") ? "dry" : "wet";
}

function normalizeLifeStage(value, title) {
  const text = `${value} ${title}`.toLowerCase();
  if (text.includes("kitten")) return "kitten";
  if (text.includes("puppy")) return "puppy";
  if (text.includes("senior")) return "senior";
  return "adult";
}

function normalizeDogSize(value, title, species) {
  if (species !== "dog") return "";
  const text = `${value} ${title}`.toLowerCase();
  if (text.includes("small") || text.includes("mini")) return "small";
  if (text.includes("large")) return "large";
  return "all";
}

function kcalPerKg(text) {
  const perKg = text.match(/(\d+(?:[,.]\d+)?)\s*kcal\s*\/?\s*kg/iu);
  if (perKg) return String(Number(perKg[1].replace(",", ".")));
  const per100g = text.match(/(\d+(?:[,.]\d+)?)\s*kcal\s*\/?\s*100\s*g/iu);
  if (per100g) return String(Number(per100g[1].replace(",", ".")) * 10);
  return "";
}

function tagsFor(row, species, format) {
  const text = Object.values(row).join(" ").toLowerCase();
  const tags = [species, format];
  for (const [needle, tag] of [
    ["sterilised", "sterilised"],
    ["sterilized", "sterilised"],
    ["kitten", "kitten"],
    ["puppy", "puppy"],
    ["senior", "senior"],
    ["monoprotein", "single_protein"],
    ["mono", "single_protein"],
    ["gluten free", "gluten_free"],
    ["maintenance", "maintenance"],
    ["urinary", "urinary"],
    ["hairball", "hairball"],
    ["light", "weight_control"],
    ["κοτόπουλο", "chicken"],
    ["γαλοπούλα", "turkey"],
    ["πάπια", "duck"],
    ["σολομ", "salmon"],
    ["τόνο", "tuna"],
    ["μοσχ", "beef"],
    ["βοδιν", "beef"],
    ["χοιριν", "pork"],
    ["ρύζι", "rice"],
    ["αρακά", "pea"],
    ["πατάτα", "potato"],
  ]) {
    if (text.includes(needle)) tags.push(tag);
  }
  return [...new Set(tags)].join(";");
}

function rowCompleteness(row) {
  return ["formula_name", "brand", "species", "format", "kcal_per_kg"].filter((field) => row[field]).length;
}

function rowFromRecord(record, sourcePath, sheetName) {
  const species = sheetName.includes("ΓΑΤ") ? "cat" : "dog";
  const title = record["ΤΙΤΛΟΣ ESHOP"] || record["Περιγραφή είδους"] || "";
  const formulaName = removePackSize(title);
  const brand = normalizeBrand(record["ΚΑΤΑΣΚΕΥΑΣΤΗΣ"], title);
  const format = normalizeFormat(record["ΕΙΔΟΣ"], `${record["Περιγραφή είδους"]} ${title}`);
  const notesText = `${record["ΠΕΡΙΓΡΑΦΗ SEO"]} ${record["ΑΝΑΛΥΤΙΚΗ ΠΕΡΙΓΡΑΦΗ"]} ${record["Σύντομη Περιγραφή"]} ${record["ΣΥΝΤΟΜΗ ΠΕΡΙΓΡΑΦΗ"]}`;
  const kcalKg = kcalPerKg(notesText);
  const commercialTags = tagsFor(record, species, format);
  return {
    brand,
    formula_name: formulaName,
    display_name: `${brand} ${formulaName}`.replace(new RegExp(`^${brand}\\s+${brand}\\s+`, "i"), `${brand} `),
    species,
    format,
    life_stage: normalizeLifeStage(record["ΗΛΙΚΙΑ "] ?? "", title),
    dog_size: normalizeDogSize(record["ΜΕΓΕΘΟΣ"] ?? "", title, species),
    breed_target: "",
    medical_tags: [
      commercialTags.includes("urinary") ? "urinary" : "",
      commercialTags.includes("hairball") ? "hairball" : "",
      commercialTags.includes("weight_control") ? "obesity" : "",
      commercialTags.includes("single_protein") ? "allergy" : "",
    ].filter(Boolean).join(";"),
    commercial_tags: commercialTags,
    ingredient_text: "",
    ingredients: "",
    primary_animal_proteins: commercialTags
      .split(";")
      .filter((tag) => ["chicken", "turkey", "duck", "salmon", "tuna", "beef", "pork"].includes(tag))
      .join(";"),
    carbohydrate_sources: commercialTags
      .split(";")
      .filter((tag) => ["rice", "pea", "potato"].includes(tag))
      .join(";"),
    fat_sources: "",
    fiber_sources: "",
    additives_text: "",
    feeding_guide_text: "",
    kcal_per_100g: kcalKg ? String(Math.round((Number(kcalKg) / 10) * 10) / 10) : "",
    kcal_per_kg: kcalKg,
    protein_percent: "",
    fat_percent: "",
    fiber_percent: "",
    ash_percent: "",
    moisture_percent: "",
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
      "source_tier=uploaded_spreadsheet",
      `source_document=${sourcePath.replace(/\\/g, "/")}`,
      `source_sheet=${sheetName}`,
      `source_code=${record["Κωδικός είδους"] ?? ""}`,
      "formula_level_dedupe=true",
      "official_url_required=true",
      "ingredient_nutrition_backfill_required=true",
      "Auto-extracted from Gheda-Schesir spreadsheet; verify against official source or label before import.",
    ].join("; "),
    formula_key: `${slugify(brand)}-${slugify(keyText(formulaName))}-${species}-${format}-gr-spreadsheet`,
    ean: "",
  };
}

function recordsFromSheet(rows) {
  const headers = rows[0] ?? [];
  return rows
    .slice(1)
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])))
    .filter((record) => record["ΤΙΤΛΟΣ ESHOP"] || record["Περιγραφή είδους"]);
}

function dedupeRows(rows) {
  const duplicateCounts = new Map();
  const byKey = new Map();
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
  const missing = ["ingredient_text", "kcal_per_100g_or_kcal_per_kg", "protein_percent", "fat_percent", "fiber_percent", "data_source_url_or_official_evidence"];
  return missing.filter((field) => {
    if (field === "kcal_per_100g_or_kcal_per_kg") return !row.kcal_per_kg;
    if (field === "data_source_url_or_official_evidence") return !row.data_source_url;
    return !row[field];
  }).join("|");
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
      "Use this as formula discovery/catalog evidence only; attach official URL or label data before Food V2 preview/commit.",
    notes: "Spreadsheet has e-shop titles, categorization and descriptions, but not complete ingredient/nutrition panels.",
  };
}

function renderReport(rows, rawRows, sourcePath) {
  const byBrand = rows.reduce((acc, row) => {
    acc[row.brand] = (acc[row.brand] ?? 0) + 1;
    return acc;
  }, {});
  const byFormat = rows.reduce((acc, row) => {
    const key = `${row.species}/${row.format}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const renderCounts = (counts) =>
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, count]) => `- ${label}: ${count}`)
      .join("\n");

  return `# Gheda / Schesir Spreadsheet Extract

Generated: ${new Date().toISOString()}

## Summary

- Source spreadsheet: ${sourcePath}
- Raw food rows: ${rawRows}
- Extracted formula-level rows after dedupe: ${rows.length}
- Duplicate pack/formula rows skipped: ${rawRows - rows.length}
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Coverage

- Formula/catalog identity: ${rows.length}/${rows.length}
- Kcal/ME: ${rows.filter((row) => row.kcal_per_kg).length}/${rows.length}
- Ingredients: 0/${rows.length}
- Protein/fat/fiber: 0/${rows.length}
- Official URL: 0/${rows.length}

## By Brand

${renderCounts(byBrand)}

## By Species/Format

${renderCounts(byFormat)}

## Import Decision

All rows are marked needs_review/hold. This spreadsheet is useful for catalog/formula discovery and tags, but not production nutrition import without official composition and nutrient backfill.
`;
}

async function main() {
  const sourcePath = process.argv[2] ?? defaultSpreadsheetPath;
  const templateText = await readFile(paths.template, "utf8");
  const headers = parseCsvLine(templateText.split(/\r?\n/)[0] ?? "");
  const entries = zipEntries(await readFile(sourcePath));
  const strings = sharedStrings(entries);
  const sheets = workbookSheets(entries).filter((sheet) => ["ΣΚΥΛΟΣ", "ΓΑΤΑ"].includes(sheet.name));
  const rawRows = [];
  for (const sheet of sheets) {
    for (const record of recordsFromSheet(sheetRows(entries, sheet.path, strings))) {
      rawRows.push(rowFromRecord(record, sourcePath, sheet.name));
    }
  }
  const rows = dedupeRows(rawRows);

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.review), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(headers, rows), "utf8");
  await writeFile(paths.review, writeCsv(reviewHeaders, rows.map(reviewRow)), "utf8");
  await writeFile(paths.report, renderReport(rows, rawRows.length, sourcePath), "utf8");

  console.log(`Gheda / Schesir spreadsheet rows: ${rows.length}`);
  console.log(`Raw food rows: ${rawRows.length}`);
  console.log(`Duplicate pack/formula rows skipped: ${rawRows.length - rows.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
