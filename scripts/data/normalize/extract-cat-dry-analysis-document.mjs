import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const defaultDocumentPath = "C:/Users/NIOstb/Desktop/photo_foods_nutritail/ΑΝΑΛΥΣΗ ΞΗΡΑΣ ΓΑΤΑΣ.docx";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/cat_dry_analysis_document_extract_v2.csv",
  review: "data/review/cat_dry_analysis_document_extract_review.csv",
  report: "reports/cat_dry_analysis_document_extract.md",
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
  return [...xml.matchAll(/<w:p[\s\S]*?<\/w:p>/g)]
    .map((match) =>
      decodeXml(
        match[0]
          .replace(/<w:tab\s*\/>/g, " ")
          .replace(/<w:br\s*\/>/g, "\n")
          .match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)
          ?.map((token) => token.replace(/<[^>]+>/g, ""))
          .join("") ?? "",
      )
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
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
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bProplan\b/g, "PRO PLAN")
    .replace(/\bOptirenal\b/g, "Optirenal")
    .replace(/\bGemon\b/g, "Gemon");
}

function numberValue(value) {
  const match = String(value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!match) return "";
  return String(Number(match[0]));
}

function percentLine(blockParagraphs, labelPattern) {
  for (const paragraph of blockParagraphs) {
    const match = paragraph.match(new RegExp(`${labelPattern}\\s*:?\\s*(\\d+(?:[,.]\\d+)?)\\s*%`, "iu"));
    const value = numberValue(match?.[1] ?? "");
    if (value) return value;
  }
  return "";
}

function isHeading(value) {
  const text = cleanText(value);
  return /^(?:PROPLAN|GEMON)\b/i.test(text) && text.length < 90;
}

function sectionParagraphs(paragraphs, startIndex) {
  const nextHeadingIndex = paragraphs.findIndex(
    (paragraph, index) => index > startIndex && isHeading(paragraph),
  );
  return paragraphs.slice(startIndex + 1, nextHeadingIndex === -1 ? paragraphs.length : nextHeadingIndex);
}

function brandFromHeading(heading) {
  return /^PROPLAN/i.test(heading) ? "Purina Pro Plan" : "Gemon";
}

function formulaNameFromHeading(heading) {
  return titleCase(
    heading
      .replace(/^PROPLAN\b/i, "PRO PLAN")
      .replace(/ΣΟΛΟΜΟΣ/iu, "Salmon")
      .replace(/ΓΑΛΟΠΟΥΛΑ/iu, "Turkey")
      .replace(/ΚΟΥΝΕΛΙ/iu, "Rabbit"),
  );
}

function inferLifeStage(formulaName) {
  return /kitten/i.test(formulaName) ? "kitten" : "adult";
}

function tagsFor(formulaName, blockText) {
  const text = `${formulaName} ${blockText}`.toLowerCase();
  const tags = ["cat", "dry"];
  if (text.includes("sterilised") || text.includes("sterilized") || text.includes("στειρω")) {
    tags.push("sterilised", "weight_control");
  }
  if (text.includes("light")) tags.push("weight_control");
  if (text.includes("urinary") || text.includes("ουροποιη")) tags.push("urinary");
  if (text.includes("kitten")) tags.push("kitten");
  if (text.includes("salmon") || text.includes("σολομ")) tags.push("salmon", "fish");
  if (text.includes("tuna") || text.includes("τόνος")) tags.push("tuna", "fish");
  if (text.includes("cod") || text.includes("μπακαλιάρ")) tags.push("cod", "fish");
  if (text.includes("chicken") || text.includes("κοτόπουλ")) tags.push("chicken");
  if (text.includes("turkey") || text.includes("γαλοπούλ")) tags.push("turkey");
  if (text.includes("rabbit") || text.includes("κουνέλι")) tags.push("rabbit");
  if (text.includes("rice") || text.includes("ρύζι")) tags.push("rice");
  if (text.includes("hair") || text.includes("τριχόπτωση")) tags.push("skin_coat");
  if (text.includes("πέψη")) tags.push("sensitive_digestion");
  return [...new Set(tags)].join(";");
}

function extractBlocks(paragraphs) {
  const rawBlocks = [];
  for (let index = 0; index < paragraphs.length; index += 1) {
    const heading = cleanText(paragraphs[index]);
    if (!isHeading(heading)) continue;
    const blockParagraphs = sectionParagraphs(paragraphs, index);
    rawBlocks.push({
      heading,
      formulaName: formulaNameFromHeading(heading),
      brand: brandFromHeading(heading),
      descriptionText: blockParagraphs
        .filter((paragraph) => !/^(?:Πρωτεΐνη|Λίπ(?:η|ος)|Ακατέργαστ|Τέφρα|Ασβέστιο|Φώσφορος|Μαγνήσιο)\s*:/iu.test(paragraph))
        .map(cleanText)
        .join(" "),
      blockParagraphs,
    });
  }

  const byKey = new Map();
  const duplicateCounts = new Map();
  for (const block of rawBlocks) {
    const key = slugify(`${block.brand}-${block.formulaName}`);
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

function rowFromBlock(block, sourcePath) {
  const commercialTags = tagsFor(block.formulaName, block.descriptionText);
  const medicalTags = [
    commercialTags.includes("urinary") ? "urinary" : "",
    commercialTags.includes("weight_control") ? "obesity" : "",
    commercialTags.includes("sensitive_digestion") ? "gi_support" : "",
  ].filter(Boolean).join(";");

  return {
    brand: block.brand,
    formula_name: block.formulaName,
    display_name: block.formulaName,
    species: "cat",
    format: "dry",
    life_stage: inferLifeStage(block.formulaName),
    dog_size: "",
    breed_target: "",
    medical_tags: medicalTags,
    commercial_tags: commercialTags,
    ingredient_text: "",
    ingredients: "",
    primary_animal_proteins: commercialTags
      .split(";")
      .filter((tag) => ["salmon", "tuna", "cod", "chicken", "turkey", "rabbit"].includes(tag))
      .join(";"),
    carbohydrate_sources: commercialTags.includes("rice") ? "rice" : "",
    fat_sources: "",
    fiber_sources: "",
    additives_text: "",
    feeding_guide_text: "",
    kcal_per_100g: "",
    kcal_per_kg: "",
    protein_percent: percentLine(block.blockParagraphs, "Πρωτεΐνη"),
    fat_percent: percentLine(block.blockParagraphs, "Λίπ(?:η|ος)"),
    fiber_percent: percentLine(block.blockParagraphs, "(?:Ακατέργαστες\\s+(?:διατροφικές|Φυτικές)\\s+Ίνες)"),
    ash_percent: percentLine(block.blockParagraphs, "(?:Ακατέργαστη\\s+)?Τέφρα"),
    moisture_percent: "",
    calcium_percent: percentLine(block.blockParagraphs, "Ασβέστιο"),
    phosphorus_percent: percentLine(block.blockParagraphs, "Φώσφορος"),
    sodium_percent: "",
    magnesium_percent: percentLine(block.blockParagraphs, "Μαγνήσιο"),
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
      "official_url_required=true",
      "ingredient_backfill_required=true",
      "kcal_backfill_required=true",
      `duplicate_blocks_skipped=${block.duplicateCount}`,
      "Auto-extracted from ΑΝΑΛΥΣΗ ΞΗΡΑΣ ΓΑΤΑΣ.docx; verify against official product page or label before import.",
    ].join("; "),
    formula_key: `${slugify(block.brand)}-${slugify(block.formulaName)}-cat-dry-gr-document`,
    ean: "",
  };
}

function missingFieldsFor(row) {
  const missing = ["ingredient_text", "kcal_per_100g_or_kcal_per_kg", "data_source_url_or_official_evidence"];
  if (!row.fiber_percent) missing.push("fiber_percent");
  for (const field of ["calcium_percent", "phosphorus_percent", "sodium_percent", "magnesium_percent"]) {
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
      "Backfill official composition/ingredients, calories, and missing minerals before admin preview or commit.",
    notes: "This document is useful for formula discovery and partial analysis only; it is not enough for production import.",
  };
}

function renderReport(rows, rawBlockCount, duplicateCount, sourcePath) {
  const coverage = (field) => rows.filter((row) => row[field]).length;
  return `# Cat Dry Analysis Document Extract

Generated: ${new Date().toISOString()}

## Summary

- Source document: ${sourcePath}
- Raw product headings: ${rawBlockCount}
- Extracted formula-level rows: ${rows.length}
- Duplicate blocks skipped: ${duplicateCount}
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Coverage

- Ingredients: 0/${rows.length}
- Protein/fat/fiber: ${rows.filter((row) => row.protein_percent && row.fat_percent && row.fiber_percent).length}/${rows.length}
- Ash: ${coverage("ash_percent")}/${rows.length}
- Calcium/phosphorus: ${rows.filter((row) => row.calcium_percent && row.phosphorus_percent).length}/${rows.length}
- Magnesium: ${coverage("magnesium_percent")}/${rows.length}
- Kcal/ME: 0/${rows.length}
- Official URL: 0/${rows.length}

## Import Decision

All rows are marked needs_review/hold. The document has useful partial analysis, but composition, calories, and official provenance must be backfilled.

## Extracted Formulas

${rows.map((row) => `- ${row.display_name}`).join("\n")}
`;
}

async function main() {
  const sourcePath = process.argv[2] ?? defaultDocumentPath;
  const templateText = await readFile(paths.template, "utf8");
  const headers = parseCsvLine(templateText.split(/\r?\n/)[0] ?? "");
  const documentXml = unzipEntry(await readFile(sourcePath), "word/document.xml");
  const paragraphs = paragraphsFromDocxXml(documentXml);
  const { blocks, rawBlockCount, duplicateCount } = extractBlocks(paragraphs);
  const rows = blocks.map((block) => rowFromBlock(block, sourcePath));

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.review), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(headers, rows), "utf8");
  await writeFile(paths.review, writeCsv(reviewHeaders, rows.map(reviewRow)), "utf8");
  await writeFile(paths.report, renderReport(rows, rawBlockCount, duplicateCount, sourcePath), "utf8");

  console.log(`Cat dry analysis document rows: ${rows.length}`);
  console.log(`Raw product headings: ${rawBlockCount}`);
  console.log(`Duplicate blocks skipped: ${duplicateCount}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
