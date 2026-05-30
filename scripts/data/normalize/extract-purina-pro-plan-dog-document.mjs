import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const defaultDocumentPath = "C:/Users/NIOstb/Desktop/photo_foods_nutritail/PRO PLAN DOG.docx";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/purina_pro_plan_dog_document_extract_v2.csv",
  review: "data/review/purina_pro_plan_dog_document_extract_review.csv",
  report: "reports/purina_pro_plan_dog_document_extract.md",
};

const reviewHeaders = [
  "formula_key",
  "brand",
  "formula_name",
  "species",
  "status",
  "missing_fields",
  "evidence_path",
  "duplicate_pack_rows_skipped",
  "recommended_action",
  "notes",
];

function csvEscape(value) {
  if (value == null) return "";
  const text = String(value);
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

function unzipEntry(buffer, entryName) {
  const eocdSignature = 0x06054b50;
  let eocdOffset = -1;

  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === eocdSignature) {
      eocdOffset = index;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error("Could not find DOCX central directory.");
  }

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  let centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);

  for (let entryIndex = 0; entryIndex < totalEntries; entryIndex += 1) {
    if (buffer.readUInt32LE(centralDirectoryOffset) !== 0x02014b50) {
      throw new Error("Invalid DOCX central directory entry.");
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

    if (fileName === entryName) {
      const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);

      if (compressionMethod === 0) return compressed.toString("utf8");
      if (compressionMethod === 8) return inflateRawSync(compressed).toString("utf8");
      throw new Error(`Unsupported DOCX compression method: ${compressionMethod}`);
    }

    centralDirectoryOffset += 46 + fileNameLength + extraLength + commentLength;
  }

  throw new Error(`DOCX entry not found: ${entryName}`);
}

function paragraphsFromDocxXml(xml) {
  const paragraphs = [];
  const paragraphMatches = xml.match(/<w:p[\s\S]*?<\/w:p>/g) ?? [];

  for (const paragraphXml of paragraphMatches) {
    let text = "";
    for (const match of paragraphXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)) {
      text += decodeXml(match[1]);
    }

    const cleaned = text.replace(/\s+/g, " ").trim();
    if (cleaned) paragraphs.push(cleaned);
  }

  return paragraphs;
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

function titleCase(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function stripPackSizes(value) {
  return cleanText(value)
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|kgs|k|gr|g)\b/giu, "")
    .replace(/\b\d+\s*\+\s*\d+(?:[.,]\d+)?\s*(?:kg|k)\b/giu, "")
    .replace(/\([^)]*(?:δωρ|free|δρο)[^)]*\)/giu, "")
    .replace(/\b(?:free|δρο|δώρο)\b/giu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formulaNameFromHeading(heading) {
  const normalized = stripPackSizes(heading)
    .replace(/^PLAN\s+/iu, "")
    .replace(/^PRO\s+PLAN\s+/iu, "")
    .replace(/\bSENS\.\s*/giu, "Sensitive ")
    .replace(/\bSTVE\s+DGST\b/giu, "Sensitive Digestion")
    .replace(/\bDIGEST\.\b/giu, "Digestive")
    .replace(/\bDΙGESTIVE\b/giu, "Digestive")
    .replace(/\bLRG\s+ROT\b/giu, "Large Robust")
    .replace(/\bΚΟΤOΠΟΥΛΟ\b/giu, "ΚΟΤΟΠΟΥΛΟ")
    .replace(/\s*&\s*/g, " & ")
    .replace(/\s+/g, " ")
    .trim();

  return titleCase(normalized);
}

function canonicalFormulaKeyName(formulaName) {
  return cleanText(formulaName)
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|k|g|gr)\b/giu, "")
    .replace(/\b(?:salmon|σολομός|σολομοσ)\b/giu, "salmon")
    .replace(/\b(?:chicken|κοτόπουλο|κοτοπουλο)\b/giu, "chicken")
    .replace(/\b(?:lamb|αρνί|αρνι)\b/giu, "lamb")
    .replace(/\b(?:rice|ρύζι|ρυζι)\b/giu, "rice")
    .replace(/\bsmall\s*&\s*mini\b/giu, "small mini")
    .replace(/\bsensitive\s+skin\b/giu, "sensitive skin")
    .replace(/\bsensitive\s+digest(?:ion|ive)?\b/giu, "sensitive digestion")
    .replace(/\badult\s+digestive\b/giu, "adult sensitive digestion")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function splitIngredients(text) {
  const ingredients = [];
  let current = "";
  let depth = 0;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);

    const previous = text[index - 1];
    const next = text[index + 1];
    const decimalComma = /\d/.test(previous ?? "") && /\d/.test(next ?? "");

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
    .map((ingredient) => cleanText(ingredient))
    .filter((ingredient) => {
      const key = ingredient.toLowerCase();
      if (!ingredient || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function extractSection(text, label) {
  const match = text.match(new RegExp(`^${label}\\s*:?\\s*(.*)$`, "iu"));
  return cleanText(match?.[1] ?? "");
}

function numberValue(value) {
  const match = String(value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!match) return "";
  return String(Number(match[0]));
}

function percentFor(text, labels) {
  for (const label of labels) {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${escapedLabel}\\s*:?\\s*(\\d+(?:[,.]\\d+)?)\\s*%`, "iu"));
    const value = numberValue(match?.[1] ?? "");
    if (value) return value;
  }

  return "";
}

function detectTerms(ingredients, terms) {
  return ingredients.filter((ingredient) =>
    terms.some((term) => ingredient.toLowerCase().includes(term.toLowerCase()))
  );
}

function isProductHeading(value) {
  const text = cleanText(value);
  if (/^(?:Σύνθεση|Αναλυτικά|Πρόσθετα|Διατροφικά)/iu.test(text)) return false;
  if (/^(?:Η|Με|Στην|Πρόκειται|Αναφερόμενοι|Σχεδιασμένη)\s/iu.test(text)) return false;
  return /^(?:PRO\s+PLAN|PLAN\s+)/iu.test(text);
}

function findNearbySection(paragraphs, startIndex, label) {
  const nextHeadingIndex = paragraphs.findIndex(
    (paragraph, offset) => offset > startIndex && isProductHeading(paragraph)
  );
  const endIndex = nextHeadingIndex === -1 ? Math.min(paragraphs.length, startIndex + 8) : nextHeadingIndex;
  return paragraphs.slice(startIndex + 1, endIndex).find((paragraph) => new RegExp(`^${label}\\s*:`, "iu").test(paragraph));
}

function inferLifeStage(text) {
  const value = text.toLowerCase();
  if (value.includes("puppy") || value.includes("κουτάβ")) return "puppy";
  if (value.includes("senior")) return "senior";
  return "adult";
}

function inferDogSize(text) {
  const value = text.toLowerCase();
  if (value.includes("large") || value.includes("robust") || value.includes("athletic") || value.includes("μεγαλόσωμ")) {
    return "large";
  }
  if (value.includes("medium") || value.includes("μεσαίου")) return "medium";
  if (value.includes("small") || value.includes("mini") || value.includes("μικρόσωμ")) return "small";
  return "all";
}

function commercialTagsFor(formulaName, description, ingredients) {
  const text = `${formulaName} ${description} ${ingredients.join(" ")}`.toLowerCase();
  const tags = ["dog", "dry"];

  if (text.includes("puppy") || text.includes("κουτάβ")) tags.push("puppy");
  if (text.includes("small") || text.includes("mini") || text.includes("μικρόσωμ")) tags.push("small_breed");
  if (text.includes("medium") || text.includes("μεσαίου")) tags.push("medium_breed");
  if (text.includes("large") || text.includes("robust") || text.includes("athletic") || text.includes("μεγαλόσωμ")) {
    tags.push("large_breed");
  }
  if (text.includes("sensitive")) tags.push("sensitive");
  if (text.includes("skin") || text.includes("επιδερμίδ")) tags.push("skin_coat");
  if (text.includes("digest") || text.includes("πέψη")) tags.push("sensitive_digestion");
  if (text.includes("light") || text.includes("παραπανίσια κιλά")) tags.push("weight_control");
  if (text.includes("κοτόπουλ") || text.includes("chicken")) tags.push("chicken");
  if (text.includes("σολομ") || text.includes("salmon")) tags.push("salmon", "fish");
  if (text.includes("αρν") || text.includes("lamb")) tags.push("lamb");
  if (text.includes("ρύζι") || text.includes("rice")) tags.push("rice");
  if (text.includes("αραβόσιτ") || text.includes("καλαμπόκ")) tags.push("corn");
  if (text.includes("σιτάρι")) tags.push("wheat");

  return [...new Set(tags)].join(";");
}

function medicalTagsFor(formulaName, description) {
  const text = `${formulaName} ${description}`.toLowerCase();
  const tags = [];

  if (text.includes("digest") || text.includes("πέψη")) tags.push("gi_support");
  if (text.includes("light") || text.includes("παραπανίσια κιλά")) tags.push("obesity");
  if (text.includes("sensitive skin") || text.includes("ευαίσθητη επιδερμίδα")) tags.push("allergy");

  return [...new Set(tags)].join(";");
}

function rowFromBlock(block, sourcePath, duplicateCount) {
  const ingredients = splitIngredients(block.ingredientText);
  const formulaKey = `purina-pro-plan-${slugify(canonicalFormulaKeyName(block.formulaName))}-dog-dry-gr-document`;

  return {
    brand: "Purina Pro Plan",
    formula_name: block.formulaName,
    display_name: `Purina Pro Plan ${block.formulaName}`,
    species: "dog",
    format: "dry",
    life_stage: inferLifeStage(`${block.formulaName} ${block.description}`),
    dog_size: inferDogSize(`${block.formulaName} ${block.description}`),
    breed_target: "",
    medical_tags: medicalTagsFor(block.formulaName, block.description),
    commercial_tags: commercialTagsFor(block.formulaName, block.description, ingredients),
    ingredient_text: block.ingredientText,
    ingredients: JSON.stringify(ingredients),
    primary_animal_proteins: detectTerms(ingredients, [
      "κοτόπουλ",
      "πουλερ",
      "σολομ",
      "αρν",
      "αυγό",
      "ιχθυ",
      "chicken",
      "salmon",
      "lamb",
    ]).join(";"),
    carbohydrate_sources: detectTerms(ingredients, [
      "ρύζι",
      "σιτάρι",
      "αραβόσιτ",
      "σόγια",
      "καλαμπόκι",
      "rice",
      "wheat",
      "maize",
    ]).join(";"),
    fat_sources: detectTerms(ingredients, ["λίπος", "έλαιο", "ιχθυέλαιο", "σογιέλαιο"]).join(";"),
    fiber_sources: detectTerms(ingredients, ["τεύτλ", "ζαχαρότευτλ", "σικορέ", "ίνες"]).join(";"),
    additives_text: "",
    feeding_guide_text: "",
    kcal_per_100g: "",
    kcal_per_kg: "",
    protein_percent: percentFor(block.analysisText, ["Πρωτεΐνες", "Ακατέργαστη Πρωτεϊνη", "Ακατέργαστη Πρωτεΐνη", "Πρωτεΐνη"]),
    fat_percent: percentFor(block.analysisText, ["Περιεκτικότητα σε λιπαρές ουσίες", "Λίπος", "Λιπαρά"]),
    fiber_percent: percentFor(block.analysisText, ["Ακατέργαστες διατροφικές ίνες", "Φυτικές Ίνες", "Φυτικές ίνες"]),
    ash_percent: percentFor(block.analysisText, ["Ακατέργαστη τέφρα", "Τέφρα"]),
    moisture_percent: percentFor(block.analysisText, ["Υγρασία"]),
    calcium_percent: percentFor(block.analysisText, ["Ασβέστιο"]),
    phosphorus_percent: percentFor(block.analysisText, ["Φώσφορος"]),
    sodium_percent: percentFor(block.analysisText, ["Νάτριο"]),
    magnesium_percent: percentFor(block.analysisText, ["Μαγνήσιο"]),
    potassium_percent: percentFor(block.analysisText, ["Κάλιο"]),
    omega3_percent: percentFor(block.analysisText, ["Ωμέγα-3", "Ω3"]),
    omega6_percent: percentFor(block.analysisText, ["Ωμέγα-6", "Ω6"]),
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
      "source_tier=uploaded_document",
      `source_document=${sourcePath.replace(/\\/g, "/")}`,
      "official_url_required=true",
      "kcal_required=true",
      `duplicate_pack_rows_skipped=${duplicateCount}`,
      "Auto-extracted from PRO PLAN DOG.docx; verify against official Purina source or label before import.",
    ].join("; "),
    formula_key: formulaKey,
    ean: "",
  };
}

function extractBlocks(paragraphs) {
  const rawBlocks = [];

  for (let index = 0; index < paragraphs.length; index += 1) {
    const heading = paragraphs[index];
    if (!isProductHeading(heading)) continue;

    const formulaName = formulaNameFromHeading(heading);
    const composition = findNearbySection(paragraphs, index, "Σύνθεση");
    const analysis = findNearbySection(paragraphs, index, "Αναλυτικά Συστατικά");
    const description = paragraphs[index + 1] ?? "";

    const ingredientText = extractSection(composition ?? "", "Σύνθεση");
    const analysisText = extractSection(analysis ?? "", "Αναλυτικά Συστατικά");

    if (!formulaName || !ingredientText || !analysisText) continue;
    if (!percentFor(analysisText, ["Πρωτεΐνες", "Ακατέργαστη Πρωτεϊνη", "Ακατέργαστη Πρωτεΐνη", "Πρωτεΐνη"])) continue;
    if (!percentFor(analysisText, ["Περιεκτικότητα σε λιπαρές ουσίες", "Λίπος", "Λιπαρά"])) continue;

    rawBlocks.push({
      formulaName,
      description,
      ingredientText,
      analysisText,
    });
  }

  const byKey = new Map();
  const duplicateCounts = new Map();

  for (const block of rawBlocks) {
    const key = canonicalFormulaKeyName(block.formulaName);
    if (byKey.has(key)) {
      duplicateCounts.set(key, (duplicateCounts.get(key) ?? 0) + 1);
      continue;
    }
    byKey.set(key, block);
    duplicateCounts.set(key, 0);
  }

  return {
    blocks: [...byKey.entries()].map(([key, block]) => ({
      ...block,
      duplicateCount: duplicateCounts.get(key) ?? 0,
    })),
    rawBlockCount: rawBlocks.length,
    duplicateCount: rawBlocks.length - byKey.size,
  };
}

function missingFieldsFor(row) {
  const missing = ["kcal_per_100g_or_kcal_per_kg", "data_source_url_or_official_evidence"];
  for (const field of [
    "fiber_percent",
    "ash_percent",
    "moisture_percent",
    "calcium_percent",
    "phosphorus_percent",
    "sodium_percent",
    "magnesium_percent",
  ]) {
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
    duplicate_pack_rows_skipped: row.source_notes.match(/duplicate_pack_rows_skipped=(\d+)/)?.[1] ?? "0",
    recommended_action:
      "Add official Purina URL or label evidence, backfill kcal/ME and missing minerals, then preview in Food V2 before commit.",
    notes:
      "Document extraction includes formula-level dedupe across pack sizes. Row is intentionally held from production until calories and source provenance are verified.",
  };
}

function renderReport(rows, rawBlockCount, duplicateCount, sourcePath) {
  const nutrientCoverage = (field) => rows.filter((row) => row[field]).length;
  const byStage = rows.reduce((acc, row) => {
    acc[row.life_stage] = (acc[row.life_stage] ?? 0) + 1;
    return acc;
  }, {});
  const bySize = rows.reduce((acc, row) => {
    acc[row.dog_size] = (acc[row.dog_size] ?? 0) + 1;
    return acc;
  }, {});
  const counts = (items) =>
    Object.entries(items)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, count]) => `- ${label}: ${count}`)
      .join("\n");

  return `# Purina Pro Plan Dog Document Extract

Generated: ${new Date().toISOString()}

## Summary

- Source document: ${sourcePath}
- Raw complete product blocks: ${rawBlockCount}
- Extracted formula-level rows: ${rows.length}
- Duplicate pack-size/promo rows skipped: ${duplicateCount}
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Coverage

- Ingredients: ${nutrientCoverage("ingredient_text")}/${rows.length}
- Protein/fat/fiber: ${rows.filter((row) => row.protein_percent && row.fat_percent && row.fiber_percent).length}/${rows.length}
- Ash: ${nutrientCoverage("ash_percent")}/${rows.length}
- Moisture: ${nutrientCoverage("moisture_percent")}/${rows.length}
- Calcium/phosphorus: ${rows.filter((row) => row.calcium_percent && row.phosphorus_percent).length}/${rows.length}
- Sodium/magnesium: ${rows.filter((row) => row.sodium_percent && row.magnesium_percent).length}/${rows.length}
- Omega 3 / Omega 6: ${rows.filter((row) => row.omega3_percent && row.omega6_percent).length}/${rows.length}
- Kcal/ME: 0/${rows.length}
- Official URL: 0/${rows.length}

## By Life Stage

${counts(byStage)}

## By Dog Size

${counts(bySize)}

## Import Decision

All rows are marked needs_review. The document gives useful ingredients and proximate analysis, but calories, official URLs, and many minerals are missing, so these rows should stay in review until official/label evidence is added.

## Extracted Formulas

${rows.map((row) => `- ${row.display_name}`).join("\n")}
`;
}

async function main() {
  const sourcePath = process.argv[2] ?? defaultDocumentPath;
  const templateText = await readFile(paths.template, "utf8");
  const headers = parseCsvLine(templateText.split(/\r?\n/)[0] ?? "");
  const documentBuffer = await readFile(sourcePath);
  const documentXml = unzipEntry(documentBuffer, "word/document.xml");
  const paragraphs = paragraphsFromDocxXml(documentXml);
  const { blocks, rawBlockCount, duplicateCount } = extractBlocks(paragraphs);
  const rows = blocks.map((block) => rowFromBlock(block, sourcePath, block.duplicateCount));

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.review), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(headers, rows), "utf8");
  await writeFile(paths.review, writeCsv(reviewHeaders, rows.map(reviewRow)), "utf8");
  await writeFile(paths.report, renderReport(rows, rawBlockCount, duplicateCount, sourcePath), "utf8");

  console.log(`Purina Pro Plan dog document rows: ${rows.length}`);
  console.log(`Raw complete product blocks: ${rawBlockCount}`);
  console.log(`Duplicate pack-size/promo rows skipped: ${duplicateCount}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
