import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const defaultDocumentPath = "C:/Users/NIOstb/Desktop/photo_foods_nutritail/PURINA (1) (1).docx";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/purina_cat_chow_document_extract_v2.csv",
  review: "data/review/purina_cat_chow_document_extract_review.csv",
  report: "reports/purina_cat_chow_document_extract.md",
};

const reviewHeaders = [
  "formula_key",
  "brand",
  "formula_name",
  "species",
  "status",
  "missing_fields",
  "evidence_path",
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

  if (eocdOffset === -1) throw new Error("Could not find DOCX central directory.");

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
    .replace(/\?{2,}/g, "")
    .replace(/\s+/g, " ")
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

function stripPackSizes(value) {
  return cleanText(value)
    .replace(/^\d+\)\s*/u, "")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|kgs|gr|g)\b/giu, "")
    .replace(/\s*\/\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function isProductHeading(value) {
  const text = stripPackSizes(value);
  if (!text || /^PURINA|^CAT CHOW$/iu.test(text)) return false;
  if (/^(?:Πρόκειται|Η |Στην |Αναφερόμενοι|Σχεδιασμένη)/iu.test(text)) return false;
  if (/^Αναλυτικά/iu.test(text)) return false;
  return /^[A-Z0-9]/u.test(text);
}

function splitEmbeddedHeading(paragraph) {
  for (const marker of ["4) URINARY", "8) ADULT DUCK"]) {
    const markerIndex = paragraph.indexOf(marker);
    if (markerIndex > 20) {
      return [
        cleanText(paragraph.slice(0, markerIndex)),
        cleanText(paragraph.slice(markerIndex)),
      ];
    }
  }

  const headingMatch = paragraph.match(/\s+\d+\)\s+[A-Z][A-Z\s&]+(?:\d|$)/u);
  if (headingMatch && headingMatch.index && headingMatch.index > 20) {
    return [
      cleanText(paragraph.slice(0, headingMatch.index)),
      cleanText(paragraph.slice(headingMatch.index)),
    ];
  }
  return [paragraph];
}

function normalizeFormulaName(heading) {
  const text = stripPackSizes(heading)
    .replace(/^CAT\s+CHOW\s+/iu, "")
    .replace(/\bSAMLON\b/iu, "Salmon")
    .replace(/\bSTERILISED\b/iu, "Sterilised")
    .replace(/\s+/g, " ")
    .trim();

  return titleCase(text);
}

function inferLifeStage(formulaName, description) {
  const text = `${formulaName} ${description}`.toLowerCase();
  if (text.includes("kitten") || text.includes("γατάκια")) return "kitten";
  if (formulaName.toLowerCase().includes("adult")) return "adult";
  if (text.includes("senior") || text.includes("ηλικιωμένες")) return "senior";
  return "adult";
}

function commercialTagsFor(formulaName, description) {
  const text = `${formulaName} ${description}`.toLowerCase();
  const tags = ["cat", "dry"];

  if (text.includes("kitten") || text.includes("γατάκια")) tags.push("kitten");
  if (text.includes("hairball") || text.includes("τριχόμπαλ")) tags.push("hairball");
  if (
    text.includes("sterilised") ||
    (text.includes("στειρω") && !text.includes("αστείρω"))
  ) {
    tags.push("sterilised", "weight_control");
  }
  if (text.includes("urinary") || text.includes("ουρο")) tags.push("urinary");
  if (text.includes("salmon") || text.includes("σολομ")) tags.push("salmon", "fish");
  if (text.includes("duck") || text.includes("πάπια")) tags.push("duck");
  if (text.includes("chicken") || text.includes("κοτόπουλ")) tags.push("chicken");

  return [...new Set(tags)].join(";");
}

function medicalTagsFor(formulaName, description) {
  const text = `${formulaName} ${description}`.toLowerCase();
  const tags = [];

  if (text.includes("urinary") || text.includes("ουρο")) tags.push("urinary");
  if (text.includes("hairball") || text.includes("τριχο")) tags.push("hairball");
  if (
    text.includes("sterilised") ||
    (text.includes("στειρω") && !text.includes("αστείρω"))
  ) {
    tags.push("obesity");
  }

  return [...new Set(tags)].join(";");
}

function extractBlocks(paragraphs) {
  const normalizedParagraphs = paragraphs.flatMap(splitEmbeddedHeading);
  const blocks = [];

  for (let index = 0; index < normalizedParagraphs.length; index += 1) {
    const heading = normalizedParagraphs[index];
    if (!isProductHeading(heading)) continue;

    const description = normalizedParagraphs[index + 1] ?? "";
    const analysis = normalizedParagraphs[index + 2] ?? "";
    if (!/^Αναλυτικά συστατικά\s*:/iu.test(analysis)) continue;

    const formulaName = normalizeFormulaName(heading);
    if (!formulaName || /^3 In 1/iu.test(formulaName)) continue;

    blocks.push({
      formulaName,
      description,
      analysisText: cleanText(analysis.replace(/^Αναλυτικά συστατικά\s*:\s*/iu, "")),
    });
  }

  const byKey = new Map();
  const duplicates = [];
  for (const block of blocks) {
    const key = slugify(block.formulaName);
    if (byKey.has(key)) {
      duplicates.push(block.formulaName);
      continue;
    }
    byKey.set(key, block);
  }

  return {
    blocks: [...byKey.values()],
    duplicates,
  };
}

function rowFromBlock(block, sourcePath) {
  const formulaKey = `purina-cat-chow-${slugify(block.formulaName)}-cat-dry-gr-document`;

  return {
    brand: "Purina Cat Chow",
    formula_name: block.formulaName,
    display_name: `Purina Cat Chow ${block.formulaName}`,
    species: "cat",
    format: "dry",
    life_stage: inferLifeStage(block.formulaName, block.description),
    dog_size: "all",
    breed_target: "",
    medical_tags: medicalTagsFor(block.formulaName, block.description),
    commercial_tags: commercialTagsFor(block.formulaName, block.description),
    ingredient_text: "",
    ingredients: "",
    primary_animal_proteins: "",
    carbohydrate_sources: "",
    fat_sources: "",
    fiber_sources: "",
    additives_text: "",
    feeding_guide_text: "",
    kcal_per_100g: "",
    kcal_per_kg: "",
    protein_percent: percentFor(block.analysisText, ["Πρωτεΐνη", "Πρωτεΐνες"]),
    fat_percent: percentFor(block.analysisText, ["Λιπαρά", "Λίπος"]),
    fiber_percent: "",
    ash_percent: percentFor(block.analysisText, ["Ακατέργαστη τέφρα", "Τέφρα"]),
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
      "source_tier=uploaded_document",
      `source_document=${sourcePath.replace(/\\/g, "/")}`,
      "composition_required=true",
      "official_url_required=true",
      "kcal_required=true",
      "Auto-extracted from PURINA (1) (1).docx; document lacks composition, so verify against official Purina source or label before import.",
    ].join("; "),
    formula_key: formulaKey,
    ean: "",
  };
}

function missingFieldsFor(row) {
  const missing = [
    "ingredient_text_or_ingredients",
    "fiber_percent",
    "kcal_per_100g_or_kcal_per_kg",
    "data_source_url_or_official_evidence",
    "calcium_percent",
    "phosphorus_percent",
    "sodium_percent",
    "magnesium_percent",
  ];

  return missing.filter((field) => {
    if (field === "ingredient_text_or_ingredients") return true;
    if (field === "kcal_per_100g_or_kcal_per_kg") return true;
    if (field === "data_source_url_or_official_evidence") return true;
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
    recommended_action:
      "Add composition/ingredients, official Purina URL or label evidence, kcal/ME, fiber and minerals, then preview in Food V2 before commit.",
    notes:
      "Document extraction includes partial analytical constituents only. Row is intentionally held from production until composition and source provenance are verified.",
  };
}

function renderReport(rows, duplicates, sourcePath) {
  const nutrientCoverage = (field) => rows.filter((row) => row[field]).length;

  return `# Purina Cat Chow Document Extract

Generated: ${new Date().toISOString()}

## Summary

- Source document: ${sourcePath}
- Extracted unique rows: ${rows.length}
- Duplicate formula blocks skipped: ${duplicates.length}
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Coverage

- Ingredients/composition: 0/${rows.length}
- Protein/fat: ${rows.filter((row) => row.protein_percent && row.fat_percent).length}/${rows.length}
- Fiber: ${nutrientCoverage("fiber_percent")}/${rows.length}
- Ash: ${nutrientCoverage("ash_percent")}/${rows.length}
- Calcium/phosphorus: 0/${rows.length}
- Sodium/magnesium: 0/${rows.length}
- Kcal/ME: 0/${rows.length}
- Official URL: 0/${rows.length}

## Import Decision

All rows are marked needs_review. This document only contains partial analytical constituents and descriptions, not composition/ingredients, calories, or official source URLs.

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
  const { blocks, duplicates } = extractBlocks(paragraphs);
  const rows = blocks.map((block) => rowFromBlock(block, sourcePath));

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.review), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(headers, rows), "utf8");
  await writeFile(paths.review, writeCsv(reviewHeaders, rows.map(reviewRow)), "utf8");
  await writeFile(paths.report, renderReport(rows, duplicates, sourcePath), "utf8");

  console.log(`Purina Cat Chow document rows: ${rows.length}`);
  console.log(`Duplicate formula blocks skipped: ${duplicates.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
