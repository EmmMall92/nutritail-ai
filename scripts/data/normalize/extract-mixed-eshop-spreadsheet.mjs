import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const sourceDirectory = "C:/Users/NIOstb/Desktop/photo_foods_nutritail";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/mixed_eshop_spreadsheet_extract_v2.csv",
  review: "data/review/mixed_eshop_spreadsheet_extract_review.csv",
  report: "reports/mixed_eshop_spreadsheet_extract.md",
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

function removePackSize(value) {
  return cleanText(value.replace(/\b\d+(?:[,.]\d+)?\s*(?:kg|gr|g)\b/giu, "").replace(/\s+/g, " "));
}

function numberValue(value) {
  const match = String(value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!match) return "";
  return String(Number(match[0]));
}

function boundedPercent(value, min, max) {
  if (!value) return "";
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) return "";
  return value;
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

function normalizeBrand(value, title) {
  const raw = cleanText(value);
  const brand = raw || cleanText(title).split(/\s+/u)[0] || "Unknown";
  return brand
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bAcana\b/g, "ACANA")
    .replace(/\bAatu\b/g, "AATU")
    .replace(/\bOrijen\b/g, "ORIJEN")
    .replace(/\bPurina\b/g, "Purina")
    .replace(/\bGemon\b/g, "Gemon")
    .replace(/\bRoyal Canin\b/g, "Royal Canin")
    .replace(/\bHill'S\b/g, "Hill's")
    .replace(/\bNature'S Food\b/g, "Nature's Food")
    .replace(/\bSam'S Field\b/g, "Sam's Field")
    .replace(/\bBelcnado\b/g, "Belcando")
    .replace(/\bDr\. Clauders\b/g, "Dr. Clauder's");
}

function normalizeSpecies(value, title) {
  const text = normalizedText(`${value} ${title}`);
  if (text.includes("γατα") || text.includes("ξ“ξ‘ξ¤ξ‘") || text.includes("cat") || text.includes("kitten")) return "cat";
  if (text.includes("σκυλος") || text.includes("ξ£ξξ¥ξ›ξξ£") || text.includes("dog") || text.includes("puppy")) return "dog";
  return "";
}

function normalizeFormat(value, title) {
  const text = normalizedText(`${value} ${title}`);
  if (text.includes("ξηρα") || text.includes("ξυξ·οξ±") || text.includes("ξυξ·οξη") || text.includes("dry")) {
    return "dry";
  }
  if (text.includes("barf") || text.includes("raw")) return "raw";
  if (
    text.includes("κονσερβα") ||
    text.includes("ξξξξ£ξ•ξ΅ξ’ξ‘") ||
    text.includes("φακελα") ||
    text.includes("ξ¦ξ‘ξξ•ξ›ξ‘") ||
    text.includes("pouch") ||
    text.includes("σαλαμ") ||
    text.includes("ξ£ξ‘ξ›ξ‘ξ")
  ) {
    return "wet";
  }
  return "";
}

function normalizeLifeStage(value, title) {
  const text = normalizedText(`${value} ${title}`);
  if (text.includes("puppy") || text.includes("kitten") || text.includes("junior")) {
    return text.includes("kitten") ? "kitten" : "puppy";
  }
  if (text.includes("senior") || text.includes("ageing")) return "senior";
  if (text.includes("all life")) return "all_life_stages";
  return "adult";
}

function normalizeDogSize(value, title, species) {
  if (species !== "dog") return "";
  const text = normalizedText(`${value} ${title}`);
  if (text.includes("mini") || text.includes("small") || text.includes("μικρο")) return "small";
  if (text.includes("medium") || text.includes("μεσαι")) return "medium";
  if (text.includes("large") || text.includes("maxi") || text.includes("μεγαλ")) return "large";
  if (text.includes("giant")) return "giant";
  return "all";
}

function recordAt(row) {
  return {
    code: row[1] ?? "",
    title: row[2] ?? "",
    seo: row[3] ?? "",
    detail: row[4] ?? "",
    short: row[5] ?? "",
    brand: row[6] ?? "",
    weight: row[8] ?? "",
    species: row[10] ?? "",
    form: row[13] ?? "",
    age: row[14] ?? "",
    quality: row[15] ?? "",
    size: row[16] ?? "",
    category1: row[17] ?? "",
    category2: row[18] ?? "",
    category3: row[19] ?? "",
    category4: row[20] ?? "",
    category5: row[21] ?? "",
    category6: row[22] ?? "",
  };
}

function recordsFromSheet(rows) {
  return rows
    .slice(1)
    .map(recordAt)
    .filter((record) => record.title || record.detail || record.seo);
}

function tagsFor(record, species, format, ingredients) {
  const text = normalizedText(`${Object.values(record).join(" ")} ${ingredients.join(" ")}`);
  const tags = [species, format].filter(Boolean);
  for (const [needle, tag] of [
    ["sterility", "sterilised"],
    ["στειρω", "sterilised"],
    ["puppy", "puppy"],
    ["kitten", "kitten"],
    ["senior", "senior"],
    ["light", "weight_control"],
    ["low fat", "weight_control"],
    ["urinary", "urinary"],
    ["hairball", "hairball"],
    ["sensitive", "sensitive_digestion"],
    ["hypoallergenic", "hypoallergenic"],
    ["monoprotein", "single_protein"],
    ["grain free", "grain_free"],
    ["gluten free", "gluten_free"],
    ["maintenance", "maintenance"],
    ["κοτοπουλο", "chicken"],
    ["γαλοπουλα", "turkey"],
    ["παπια", "duck"],
    ["σολομ", "salmon"],
    ["τονο", "tuna"],
    ["μοσχ", "beef"],
    ["βοδιν", "beef"],
    ["χοιριν", "pork"],
    ["αρν", "lamb"],
    ["ψαρ", "fish"],
    ["ρυζ", "rice"],
    ["πατατ", "potato"],
    ["αρακα", "pea"],
    ["καλαμποκ", "corn"],
    ["σιταρ", "wheat"],
  ]) {
    if (text.includes(needle)) tags.push(tag);
  }
  return [...new Set(tags)].join(";");
}

function rowCompleteness(row) {
  return [
    "ingredient_text",
    "protein_percent",
    "fat_percent",
    "fiber_percent",
    "ash_percent",
    "moisture_percent",
    "kcal_per_kg",
  ].filter((field) => row[field]).length;
}

function rowFromRecord(record, sourcePath, sheetName) {
  const notesText = cleanText(`${record.seo} ${record.detail} ${record.short}`);
  const ingredientText = extractInlineSection(
    notesText,
    /(?:Σύνθεση|Συνθεση|Συστατικά|Συστατικα)\s*:/iu,
    /(?:Αναλυτικά|Αναλυτικα|Ανάλυση|Αναλυση|Πρόσθετα|Προσθετα|Βιτ\.|$)/iu,
  );
  const analysisText = extractInlineSection(
    notesText,
    /(?:Αναλυτικά\s+συστατικά|Αναλυτικα\s+συστατικα|Ανάλυση|Αναλυση)\s*:/iu,
    /(?:Σύνθεση|Συνθεση|Πρόσθετα|Προσθετα|Βιτ\.|$)/iu,
  );
  const ingredients = splitIngredients(ingredientText);
  const brand = normalizeBrand(record.brand, record.title);
  const formulaName = removePackSize(record.title);
  const species = normalizeSpecies(record.species, record.title);
  const format = normalizeFormat(record.form, `${record.title} ${notesText}`);
  const kcalKg = kcalPerKg(notesText);
  const commercialTags = tagsFor(record, species, format, ingredients);

  return {
    brand,
    formula_name: formulaName,
    display_name: `${brand} ${formulaName}`.replace(new RegExp(`^${brand}\\s+${brand}\\s+`, "i"), `${brand} `),
    species,
    format,
    life_stage: normalizeLifeStage(record.age, record.title),
    dog_size: normalizeDogSize(record.size, record.title, species),
    breed_target: "",
    medical_tags: [
      commercialTags.includes("weight_control") ? "obesity" : "",
      commercialTags.includes("urinary") ? "urinary" : "",
      commercialTags.includes("single_protein") || commercialTags.includes("hypoallergenic") ? "allergy" : "",
      commercialTags.includes("sensitive_digestion") ? "gi_support" : "",
    ]
      .filter(Boolean)
      .join(";"),
    commercial_tags: commercialTags,
    ingredient_text: ingredientText,
    ingredients: ingredients.length ? JSON.stringify(ingredients) : "",
    primary_animal_proteins: ingredients
      .filter((item) => /(κοτοπουλ|πουλερ|γαλοπουλ|παπια|σολομ|τονο|μοσχ|βοδιν|χοιριν|αρν|ψαρ|chicken|turkey|duck|salmon|tuna|beef|pork|lamb|fish)/iu.test(item))
      .join(";"),
    carbohydrate_sources: ingredients
      .filter((item) => /(ρυζ|καλαμποκ|σιταρ|πατατ|αρακα|κριθαρι|rice|corn|wheat|potato|pea|barley)/iu.test(item))
      .join(";"),
    fat_sources: ingredients.filter((item) => /(λιπ|ελαι|λάδι|λαδι|ιχθυελαιο|fat|oil)/iu.test(item)).join(";"),
    fiber_sources: ingredients.filter((item) => /(ιν|ίν|πολπ|τευτλ|beet|fiber|fibre)/iu.test(item)).join(";"),
    additives_text: extractInlineSection(notesText, /(?:Πρόσθετα|Προσθετα)(?:\s+ανά\s+κιλό|\s+ανα\s+κιλο)?\s*:/iu, /(?:\*Σου|$)/iu),
    feeding_guide_text: "",
    kcal_per_100g: kcalKg ? String(Math.round((Number(kcalKg) / 10) * 10) / 10) : "",
    kcal_per_kg: kcalKg,
    protein_percent: boundedPercent(
      percentValue(analysisText, ["Πρωτεΐνη", "Πρωτείνη", "Πρωτεϊνη", "Ακατέργαστη Πρωτεΐνη", "Protein"]),
      3,
      70,
    ),
    fat_percent: boundedPercent(
      percentValue(analysisText, ["Λιπαρά", "Λίπος", "Ολικές Λιπαρές Ουσίες", "Fat"]),
      0,
      50,
    ),
    fiber_percent: boundedPercent(
      percentValue(analysisText, ["Ίνες", "Ινες", "Φυτικές Ίνες", "Ολικές Ινώδεις Ουσίες", "Fiber"]),
      0,
      30,
    ),
    ash_percent: boundedPercent(percentValue(analysisText, ["Τέφρα", "Ολική Τέφρα", "Ακατέργαστη Τέφρα", "Ash"]), 0, 30),
    moisture_percent: boundedPercent(percentValue(analysisText, ["Υγρασία", "Moisture"]), 0, 90),
    calcium_percent: boundedPercent(percentValue(analysisText, ["Ασβέστιο", "Calcium"]), 0, 8),
    phosphorus_percent: boundedPercent(percentValue(analysisText, ["Φώσφορος", "Phosphorus"]), 0, 8),
    sodium_percent: boundedPercent(percentValue(analysisText, ["Νάτριο", "Sodium"]), 0, 5),
    magnesium_percent: boundedPercent(percentValue(analysisText, ["Μαγνήσιο", "Magnesium"]), 0, 3),
    potassium_percent: "",
    omega3_percent: percentValue(analysisText, ["Ωμέγα 3", "Ωμέγα-3", "Omega 3", "Omega-3"]),
    omega6_percent: percentValue(analysisText, ["Ωμέγα 6", "Ωμέγα-6", "Omega 6", "Omega-6"]),
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
      `source_code=${record.code}`,
      `source_form=${record.form}`,
      "mixed_catalog_rows=true",
      "formula_level_dedupe=true",
      "official_url_required=true",
      "Auto-extracted from ESHOP dog/cat spreadsheet; verify against official source or label before import.",
    ].join("; "),
    formula_key: `${slugify(brand)}-${slugify(formulaName)}-${species || "unknown"}-${format || "unknown"}-gr-spreadsheet`,
    ean: "",
  };
}

function isFoodRecord(record) {
  const species = normalizeSpecies(record.species, record.title);
  const format = normalizeFormat(record.form, `${record.title} ${record.seo} ${record.detail} ${record.short}`);
  return Boolean(species && format && record.title);
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
    format: row.format,
    status: "needs_review",
    missing_fields: missingFieldsFor(row),
    evidence_path: row.source_notes.match(/source_document=([^;]+)/)?.[1] ?? "",
    duplicate_blocks_skipped: row.source_notes.match(/duplicate_blocks_skipped=(\d+)/)?.[1] ?? "0",
    recommended_action:
      "Attach official URL or label photo, verify extracted nutrients/ingredients, then preview in Food V2 before commit.",
    notes: "Mixed dog/cat e-shop spreadsheet extraction; rows stay in review because provenance is uploaded spreadsheet only.",
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

function renderReport(rows, rawRows, skippedRows, sourcePath) {
  const coverage = (field) => rows.filter((row) => row[field]).length;
  return `# Mixed Eshop Spreadsheet Extract

Generated: ${new Date().toISOString()}

## Summary

- Source spreadsheet: ${sourcePath}
- Raw spreadsheet rows: ${rawRows}
- Non-food rows skipped: ${skippedRows}
- Extracted formula-level rows after dedupe: ${rows.length}
- Duplicate pack/formula rows skipped: ${rawRows - skippedRows - rows.length}
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

All rows are marked needs_review/hold. This spreadsheet is useful for broad dog/cat catalog discovery and some label-like nutrition text, but official URLs/provenance are still required before import.
`;
}

async function resolveSourcePath() {
  if (process.argv[2]) return process.argv[2];
  const files = await readdir(sourceDirectory);
  const file = files.find((name) => name.startsWith("ESHOP - ") && name.endsWith(".xlsx"));
  if (!file) throw new Error(`Could not find ESHOP mixed spreadsheet in ${sourceDirectory}`);
  return path.join(sourceDirectory, file);
}

async function main() {
  const sourcePath = await resolveSourcePath();
  const templateText = await readFile(paths.template, "utf8");
  const headers = parseCsvLine(templateText.split(/\r?\n/)[0] ?? "");
  const entries = zipEntries(await readFile(sourcePath));
  const strings = sharedStrings(entries);
  const [sheet] = workbookSheets(entries);
  const records = recordsFromSheet(sheetRows(entries, sheet.path, strings));
  const foodRecords = records.filter(isFoodRecord);
  const rows = dedupeRows(foodRecords.map((record) => rowFromRecord(record, sourcePath, sheet.name)));

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.review), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(headers, rows), "utf8");
  await writeFile(paths.review, writeCsv(reviewHeaders, rows.map(reviewRow)), "utf8");
  await writeFile(paths.report, renderReport(rows, records.length, records.length - foodRecords.length, sourcePath), "utf8");

  console.log(`Mixed eshop spreadsheet rows: ${rows.length}`);
  console.log(`Raw spreadsheet rows: ${records.length}`);
  console.log(`Non-food rows skipped: ${records.length - foodRecords.length}`);
  console.log(`Duplicate pack/formula rows skipped: ${foodRecords.length - rows.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
