import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const defaultDocumentPath = "C:/Users/NIOstb/Desktop/photo_foods_nutritail/BELCANDO.docx";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/belcando_document_extract_v2.csv",
  review: "data/review/belcando_document_extract_review.csv",
  report: "reports/belcando_document_extract.md",
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
  return [...xml.matchAll(/<w:p[\s\S]*?<\/w:p>/g)]
    .map((match) =>
      decodeXml(
        [...match[0].matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
          .map((textMatch) => textMatch[1])
          .join("")
          .replace(/\s+/g, " ")
          .trim(),
      ),
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
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isHeading(value) {
  const text = cleanText(value);
  return /BELCANDO/i.test(text) && text.length < 90;
}

function canonicalFormulaName(heading) {
  return titleCase(
    cleanText(heading)
      .replace(/\b(?:\d+(?:[,.]\d+)?\s*)?(?:kg|gr|g)\b/giu, "")
      .replace(/\b\u0394\u0395\u0399\u0393\u039c\u0391\b/giu, "")
      .replace(/\b\u0434\u0435\u0438\u0446\u043b\u0430\b/giu, "")
      .replace(/\s+/g, " "),
  );
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
    .map((ingredient) => cleanText(ingredient))
    .filter((ingredient) => {
      const key = ingredient.toLowerCase();
      if (!ingredient || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function numberValue(value) {
  const match = String(value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!match) return "";
  return String(Number(match[0]));
}

function percentAfter(text, labelPattern) {
  const match = text.match(new RegExp(`${labelPattern}[^0-9]{0,45}(\\d+(?:[,.]\\d+)?)\\s*%`, "iu"));
  return numberValue(match?.[1] ?? "");
}

function mgKgAfter(text, labelPattern) {
  const match = text.match(new RegExp(`${labelPattern}[^0-9]{0,45}(\\d+(?:[,.]\\d+)?)\\s*mg`, "iu"));
  return numberValue(match?.[1] ?? "");
}

function sectionValue(paragraph, labelPattern, stopPattern) {
  const match = paragraph.match(labelPattern);
  if (!match?.index && match?.index !== 0) return "";
  const start = match.index + match[0].length;
  const value = paragraph.slice(start);
  const stop = value.match(stopPattern);
  return cleanText(stop?.index != null ? value.slice(0, stop.index) : value);
}

function sectionParagraphs(paragraphs, startIndex) {
  const nextHeadingIndex = paragraphs.findIndex(
    (paragraph, index) => index > startIndex && isHeading(paragraph),
  );
  return paragraphs.slice(startIndex + 1, nextHeadingIndex === -1 ? paragraphs.length : nextHeadingIndex);
}

function readBlockSection(blockParagraphs, labelPattern, stopPattern) {
  for (const paragraph of blockParagraphs) {
    const value = sectionValue(cleanText(paragraph), labelPattern, stopPattern);
    if (value) return value;
  }
  return "";
}

function readLeadingBlockSection(blockParagraphs, labelPattern, stopPattern) {
  for (const paragraph of blockParagraphs) {
    const text = cleanText(paragraph);
    if (!labelPattern.test(text)) continue;
    const value = sectionValue(text, labelPattern, stopPattern);
    if (value) return value;
  }
  return "";
}

function extractBlocks(paragraphs) {
  const rawBlocks = [];
  for (let index = 0; index < paragraphs.length; index += 1) {
    const heading = cleanText(paragraphs[index]);
    if (!isHeading(heading)) continue;
    const blockParagraphs = sectionParagraphs(paragraphs, index);
    const ingredientText = readBlockSection(
      blockParagraphs,
      /(?:\u03a3\u03cd\u03bd\u03b8\u03b5\u03c3\u03b7|Composition)\s*:/iu,
      /(?:\u0391\u03bd\u03b1\u03bb\u03c5\u03c4\u03b9\u03ba\u03ac|\u03a0\u03c1\u03cc\u03c3\u03b8\u03b5\u03c4\u03b5\u03c2|\u0394\u03b9\u03b1\u03c4\u03c1\u03bf\u03c6\u03b9\u03ba\u03ad\u03c2|Analytical|Additives)\s*:/iu,
    );
    const analysisText = readLeadingBlockSection(
      blockParagraphs,
      /^(?:\u0391\u03bd\u03b1\u03bb\u03c5\u03c4\u03b9\u03ba\u03ac\s+\u03c3\u03c5\u03c3\u03c4\u03b1\u03c4\u03b9\u03ba\u03ac|Analytical\s+constituents)\s*:?/iu,
      /(?:\u03a0\u03c1\u03cc\u03c3\u03b8\u03b5\u03c4\u03b5\u03c2|\u0394\u03b9\u03b1\u03c4\u03c1\u03bf\u03c6\u03b9\u03ba\u03ad\u03c2|Additives)\s*:/iu,
    );
    if (!ingredientText || !analysisText) continue;

    rawBlocks.push({
      formulaName: canonicalFormulaName(heading),
      heading,
      descriptionText: blockParagraphs
        .filter((paragraph) => !/(?:\u03a3\u03cd\u03bd\u03b8\u03b5\u03c3\u03b7|\u0391\u03bd\u03b1\u03bb\u03c5\u03c4\u03b9\u03ba\u03ac|\u03a0\u03c1\u03cc\u03c3\u03b8\u03b5\u03c4\u03b5\u03c2|\u0394\u03b9\u03b1\u03c4\u03c1\u03bf\u03c6\u03b9\u03ba\u03ad\u03c2)\s*:/iu.test(paragraph))
        .map(cleanText)
        .join(" "),
      ingredientText,
      analysisText,
      additivesText: blockParagraphs
        .filter((paragraph) =>
          /(?:\u03a0\u03c1\u03cc\u03c3\u03b8\u03b5\u03c4\u03b5\u03c2|\u0394\u03b9\u03b1\u03c4\u03c1\u03bf\u03c6\u03b9\u03ba\u03ad\u03c2|Vitamin|Vitamini|\u0392\u03b9\u03c4\u03b1\u03bc\u03af\u03bd\u03b7)/iu.test(paragraph),
        )
        .map(cleanText)
        .join(" "),
    });
  }

  const byKey = new Map();
  const duplicateCounts = new Map();
  for (const block of rawBlocks) {
    const key = slugify(block.formulaName);
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

function inferLifeStage(formulaName) {
  const value = formulaName.toLowerCase();
  if (value.includes("puppy")) return "puppy";
  if (value.includes("senior")) return "senior";
  return "adult";
}

function inferDogSize(formulaName, descriptionText) {
  const text = `${formulaName} ${descriptionText}`.toLowerCase();
  if (text.includes("\u03b1\u03bd\u03b5\u03be\u03b1\u03c1\u03c4\u03ae\u03c4\u03c9\u03c2 \u03bc\u03b5\u03b3\u03ad\u03b8\u03bf\u03c5\u03c2") || text.includes("\u03ba\u03ac\u03b8\u03b5 \u03c3\u03ba\u03cd\u03bb\u03bf")) return "all";
  if (text.includes("finest") || text.includes("\u03bc\u03b9\u03ba\u03c1\u03cc\u03c3\u03c9\u03bc")) return "small";
  if (text.includes("large") || text.includes("\u03bc\u03b5\u03b3\u03b1\u03bb\u03cc\u03c3\u03c9\u03bc") || text.includes("\u03bc\u03b5\u03b3\u03ac\u03bb\u03bf\u03c5 \u03bc\u03b5\u03b3\u03ad\u03b8\u03bf\u03c5\u03c2")) return "large";
  if (text.includes("medium") || text.includes("\u03bc\u03b5\u03c3\u03b1\u03af")) return "medium";
  return "all";
}

function tagsFor(formulaName, ingredients) {
  const text = `${formulaName} ${ingredients.join(" ")}`.toLowerCase();
  const tags = ["dog", "dry"];
  if (text.includes("puppy")) tags.push("puppy");
  if (text.includes("senior")) tags.push("senior");
  if (text.includes("light")) tags.push("weight_control");
  if (text.includes("sensitive")) tags.push("sensitive_digestion");
  if (text.includes("grain") || text.includes("\u03c3\u03b9\u03c4\u03b7\u03c1")) tags.push("grain_free");
  if (text.includes("rice") || text.includes("\u03c1\u03cd\u03b6\u03b9")) tags.push("rice");
  if (text.includes("corn") || text.includes("\u03b1\u03c1\u03b1\u03b2\u03cc\u03c3\u03b9\u03c4")) tags.push("corn");
  if (text.includes("potato") || text.includes("\u03b3\u03b5\u03c9\u03bc\u03ae\u03bb")) tags.push("potato");
  if (text.includes("poultry") || text.includes("\u03c0\u03bf\u03c5\u03bb\u03b5\u03c1")) tags.push("chicken");
  if (text.includes("duck") || text.includes("\u03c0\u03ac\u03c0\u03b9")) tags.push("duck");
  if (text.includes("lamb") || text.includes("\u03b1\u03c1\u03bd")) tags.push("lamb");
  if (text.includes("salmon") || text.includes("\u03c3\u03bf\u03bb")) tags.push("salmon", "fish");
  if (text.includes("fish") || text.includes("\u03c8\u03ac\u03c1")) tags.push("fish");
  if (text.includes("turkey") || text.includes("\u03b3\u03b1\u03bb\u03bf\u03c0")) tags.push("turkey");
  if (text.includes("beef") || text.includes("\u03bc\u03bf\u03c3\u03c7")) tags.push("beef");
  return [...new Set(tags)].join(";");
}

function rowFromBlock(block, sourcePath) {
  const ingredients = splitIngredients(block.ingredientText);
  const tags = tagsFor(block.formulaName, ingredients);

  return {
    brand: "Belcando",
    formula_name: block.formulaName,
    display_name: block.formulaName,
    species: "dog",
    format: "dry",
    life_stage: inferLifeStage(block.formulaName),
    dog_size: inferDogSize(block.formulaName, block.descriptionText),
    breed_target: "",
    medical_tags: tags.includes("weight_control") ? "obesity" : "",
    commercial_tags: tags,
    ingredient_text: block.ingredientText,
    ingredients: JSON.stringify(ingredients),
    primary_animal_proteins: ingredients
      .filter((item) => /(\u03c0\u03bf\u03c5\u03bb\u03b5\u03c1|\u03c0\u03ac\u03c0\u03b9|\u03b1\u03c1\u03bd|\u03c3\u03bf\u03bb|\u03c8\u03ac\u03c1|\u03b3\u03b1\u03bb\u03bf\u03c0|\u03bc\u03bf\u03c3\u03c7|poultry|duck|lamb|salmon|fish|turkey|beef)/iu.test(item))
      .join(";"),
    carbohydrate_sources: ingredients
      .filter((item) => /(\u03c1\u03cd\u03b6\u03b9|\u03b1\u03c1\u03b1\u03b2\u03cc\u03c3\u03b9\u03c4|\u03b2\u03c1\u03ce\u03bc|\u03b3\u03b5\u03c9\u03bc\u03ae\u03bb|\u03b1\u03bc\u03ac\u03c1\u03b1\u03bd\u03c4|rice|corn|oat|potato|amaranth)/iu.test(item))
      .join(";"),
    fat_sources: ingredients.filter((item) => /(\u03bb\u03af\u03c0\u03bf\u03c2|\u03ad\u03bb\u03b1\u03b9\u03b1|\u03bb\u03ac\u03b4\u03b9|fat|oil)/iu.test(item)).join(";"),
    fiber_sources: ingredients.filter((item) => /(\u03c4\u03b5\u03cd\u03c4\u03bb|\u03c7\u03b1\u03c1\u03bf\u03cd\u03c0|beet|carob)/iu.test(item)).join(";"),
    additives_text: block.additivesText,
    feeding_guide_text: "",
    kcal_per_100g: "",
    kcal_per_kg: "",
    protein_percent: percentAfter(block.analysisText, "\u03a0\u03c1\u03c9\u03c4\u03b5"),
    fat_percent: percentAfter(block.analysisText, "\u039f\u03bb\u03b9\u03ba[^\u0025]{0,20}\u03bb\u03b9\u03c0\u03b1\u03c1"),
    fiber_percent: percentAfter(block.analysisText, "\u039f\u03bb\u03b9\u03ba[^\u0025]{0,20}\u03b9\u03bd"),
    ash_percent: percentAfter(block.analysisText, "\u039f\u03bb\u03b9\u03ba[^\u0025]{0,20}\u03c4\u03ad\u03c6\u03c1"),
    moisture_percent: percentAfter(block.analysisText, "\u03a5\u03b3\u03c1\u03b1\u03c3"),
    calcium_percent: percentAfter(block.analysisText, "\u0391\u03c3\u03b2\u03ad\u03c3\u03c4"),
    phosphorus_percent: percentAfter(block.analysisText, "\u03a6\u03ce\u03c3\u03c6\u03bf\u03c1"),
    sodium_percent: percentAfter(block.analysisText, "\u039d\u03ac\u03c4\u03c1"),
    magnesium_percent: "",
    potassium_percent: "",
    omega3_percent: "",
    omega6_percent: "",
    dha_percent: "",
    epa_percent: "",
    taurine_mgkg: "",
    l_carnitine_mgkg: mgKgAfter(block.additivesText, "L-\u039a\u03b1\u03c1\u03bd\u03b9\u03c4"),
    glucosamine_mgkg: "",
    chondroitin_mgkg: "",
    vitamin_a_iukg: mgKgAfter(block.additivesText, "\u0392\u03b9\u03c4\u03b1\u03bc\u03af\u03bd\u03b7\\s*A"),
    vitamin_d3_iukg: mgKgAfter(block.additivesText, "\u0392\u03b9\u03c4\u03b1\u03bc\u03af\u03bd\u03b7\\s*D3"),
    vitamin_e_mgkg: mgKgAfter(block.additivesText, "\u0392\u03b9\u03c4\u03b1\u03bc\u03af\u03bd\u03b7\\s*\u0395"),
    iron_mgkg: mgKgAfter(block.additivesText, "\u03a3\u03af\u03b4\u03b7\u03c1"),
    zinc_mgkg: mgKgAfter(block.additivesText, "\u03a8\u03b5\u03c5\u03b4\u03ac\u03c1\u03b3\u03c5\u03c1"),
    copper_mgkg: mgKgAfter(block.additivesText, "\u03a7\u03b1\u03bb\u03ba"),
    manganese_mgkg: mgKgAfter(block.additivesText, "\u039c\u03b1\u03b3\u03b3\u03ac\u03bd"),
    iodine_mgkg: mgKgAfter(block.additivesText, "\u0399\u03ce\u03b4\u03b9\u03bf"),
    selenium_mgkg: mgKgAfter(block.additivesText, "\u03a3\u03b5\u03bb\u03ae\u03bd"),
    data_quality_status: "needs_review",
    data_source_url: "",
    source_priority: "unknown",
    source_notes: [
      "market=GR",
      "basis=as-fed",
      "source_tier=uploaded_document",
      `source_document=${sourcePath.replace(/\\/g, "/")}`,
      "formula_level_dedupe=true",
      "pack_size_rows_collapsed=true",
      "official_url_required=true",
      "kcal_backfill_required=true",
      "magnesium_backfill_required=true",
      `duplicate_blocks_skipped=${block.duplicateCount}`,
      "Auto-extracted from BELCANDO.docx; verify against official Belcando source or label before import.",
    ].join("; "),
    formula_key: `belcando-${slugify(block.formulaName)}-dog-dry-gr-document`,
    ean: "",
  };
}

function missingFieldsFor(row) {
  const missing = [];
  if (!row.kcal_per_kg) missing.push("kcal_per_100g_or_kcal_per_kg");
  if (!row.data_source_url) missing.push("data_source_url_or_official_evidence");
  if (!row.magnesium_percent) missing.push("magnesium_percent");
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
      "Attach official Belcando URL, backfill kcal/ME and magnesium if available, then preview in Food V2 before commit.",
    notes: "Document extraction collapses pack sizes and samples to formula-level rows. Keep in review until source provenance is linked.",
  };
}

function renderReport(rows, rawBlockCount, duplicateCount, sourcePath) {
  const coverage = (field) => rows.filter((row) => row[field]).length;
  return `# Belcando Document Extract

Generated: ${new Date().toISOString()}

## Summary

- Source document: ${sourcePath}
- Raw complete product blocks: ${rawBlockCount}
- Extracted formula-level rows: ${rows.length}
- Duplicate pack/sample blocks skipped: ${duplicateCount}
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Coverage

- Ingredients: ${coverage("ingredient_text")}/${rows.length}
- Protein/fat/fiber: ${rows.filter((row) => row.protein_percent && row.fat_percent && row.fiber_percent).length}/${rows.length}
- Ash/moisture: ${rows.filter((row) => row.ash_percent && row.moisture_percent).length}/${rows.length}
- Calcium/phosphorus/sodium: ${rows.filter((row) => row.calcium_percent && row.phosphorus_percent && row.sodium_percent).length}/${rows.length}
- Kcal/ME: 0/${rows.length}
- Magnesium: 0/${rows.length}
- Official URL: 0/${rows.length}

## Import Decision

All rows are marked needs_review. The document has strong analytical constituents and sodium coverage, but official URLs, calories, and magnesium still need review/backfill.

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

  console.log(`Belcando document rows: ${rows.length}`);
  console.log(`Raw complete product blocks: ${rawBlockCount}`);
  console.log(`Duplicate pack/sample blocks skipped: ${duplicateCount}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
