import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const defaultDocumentPath = "C:/Users/NIOstb/Desktop/photo_foods_nutritail/Unica Natura.docx";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/unica_natura_document_extract_v2.csv",
  review: "data/review/unica_natura_document_extract_review.csv",
  report: "reports/unica_natura_document_extract.md",
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

function numberValue(value) {
  const match = String(value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!match) return "";
  return String(Number(match[0]));
}

function percentAfter(text, labelPattern) {
  const match = text.match(new RegExp(`${labelPattern}[^0-9]{0,50}(\\d+(?:[,.]\\d+)?)\\s*%`, "iu"));
  return numberValue(match?.[1] ?? "");
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

function isHeading(value) {
  const text = cleanText(value);
  return /^Unico\s+(?:Indoor|Outdoor)\b/i.test(text);
}

function sectionParagraphs(paragraphs, startIndex) {
  const nextHeadingIndex = paragraphs.findIndex(
    (paragraph, index) => index > startIndex && isHeading(paragraph),
  );
  return paragraphs.slice(startIndex + 1, nextHeadingIndex === -1 ? paragraphs.length : nextHeadingIndex);
}

function titleCase(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bUnico\b/g, "Unico")
    .replace(/\bIndoor\b/g, "Indoor")
    .replace(/\bOutdoor\b/g, "Outdoor");
}

function tagsFor(formulaName, ingredients, blockText) {
  const text = `${formulaName} ${blockText} ${ingredients.join(" ")}`.toLowerCase();
  const tags = ["cat", "dry", "gluten_free"];
  if (text.includes("indoor") || text.includes("εσωτερ")) tags.push("indoor");
  if (text.includes("outdoor") || text.includes("εξωτερ")) tags.push("outdoor");
  if (text.includes("στειρω")) tags.push("sterilised");
  if (text.includes("τριχόμπαλ")) tags.push("hairball");
  if (text.includes("πέψη") || text.includes("πεπτικ")) tags.push("sensitive_digestion");
  if (text.includes("duck") || text.includes("πάπια")) tags.push("duck");
  if (text.includes("prosciutto") || text.includes("χοιριν")) tags.push("pork");
  if (text.includes("cod") || text.includes("μπακαλιάρ") || text.includes("σολομ")) tags.push("fish");
  if (text.includes("salmon") || text.includes("σολομ")) tags.push("salmon");
  if (text.includes("chicken") || text.includes("κοτόπουλ")) tags.push("chicken");
  if (text.includes("lamb") || text.includes("αρν")) tags.push("lamb");
  if (text.includes("ρύζι") || text.includes("rice")) tags.push("rice");
  if (text.includes("αραβόσιτ") || text.includes("corn")) tags.push("corn");
  if (text.includes("μπιζε") || text.includes("pea")) tags.push("pea");
  return [...new Set(tags)].join(";");
}

function extractBlocks(paragraphs) {
  const rawBlocks = [];
  for (let index = 0; index < paragraphs.length; index += 1) {
    const heading = cleanText(paragraphs[index]);
    if (!isHeading(heading)) continue;
    const blockParagraphs = sectionParagraphs(paragraphs, index);
    const blockText = cleanText(blockParagraphs.join(" "));
    const analysisText = extractInlineSection(
      blockText,
      /Αναλυτικά\s+συστατικά\s*:/iu,
      /(?:Σύνθεση|Unico\s+(?:Indoor|Outdoor)|\* Σου υπενθυμίζουμε)/iu,
    );
    const compositionText = extractInlineSection(
      blockText,
      /Σύνθεση\s*:/iu,
      /(?:\* ισοδύναμο|\* Σου υπενθυμίζουμε|Unico\s+(?:Indoor|Outdoor))/iu,
    );

    rawBlocks.push({
      formulaName: titleCase(heading),
      heading,
      blockText,
      descriptionText: cleanText(blockParagraphs.slice(0, 2).join(" ")),
      analysisText,
      compositionText,
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

function rowFromBlock(block, sourcePath) {
  const ingredients = splitIngredients(block.compositionText);
  const commercialTags = tagsFor(block.formulaName, ingredients, block.blockText);
  return {
    brand: "Unica Natura",
    formula_name: block.formulaName,
    display_name: `Unica Natura ${block.formulaName}`,
    species: "cat",
    format: "dry",
    life_stage: "all_life_stages",
    dog_size: "",
    breed_target: "",
    medical_tags: [
      commercialTags.includes("hairball") ? "hairball" : "",
      commercialTags.includes("sensitive_digestion") ? "gi_support" : "",
    ].filter(Boolean).join(";"),
    commercial_tags: commercialTags,
    ingredient_text: block.compositionText,
    ingredients: ingredients.length ? JSON.stringify(ingredients) : "",
    primary_animal_proteins: ingredients.filter((item) => /(πάπια|duck|κοτόπουλ|chicken|χοιριν|pork|σολομ|salmon|μπακαλιάρ|cod|αρν|lamb)/iu.test(item)).join(";"),
    carbohydrate_sources: ingredients.filter((item) => /(ρύζι|rice|αραβόσιτ|corn|μπιζε|pea|φασόλια|beans)/iu.test(item)).join(";"),
    fat_sources: ingredients.filter((item) => /(λίπος|λιναρόσπορος|fat|oil|flax)/iu.test(item)).join(";"),
    fiber_sources: ingredients.filter((item) => /(ίνες|πολτός|yucca|γιούκα|orange|μήλου|carrot|καρότα)/iu.test(item)).join(";"),
    additives_text: "",
    feeding_guide_text: "",
    kcal_per_100g: "",
    kcal_per_kg: "",
    protein_percent: percentAfter(block.analysisText, "Πρωτεΐνη"),
    fat_percent: percentAfter(block.analysisText, "Λιπαρά"),
    fiber_percent: "",
    ash_percent: percentAfter(block.analysisText, "τέφρα"),
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
      "official_url_required=true",
      "kcal_backfill_required=true",
      "minerals_backfill_required=true",
      `duplicate_blocks_skipped=${block.duplicateCount}`,
      "Auto-extracted from Unica Natura.docx; verify against official Unica Natura source or label before import.",
    ].join("; "),
    formula_key: `unica-natura-${slugify(block.formulaName)}-cat-dry-gr-document`,
    ean: "",
  };
}

function missingFieldsFor(row) {
  const missing = [];
  if (!row.ingredient_text) missing.push("ingredient_text");
  if (!row.fiber_percent) missing.push("fiber_percent");
  if (!row.kcal_per_kg) missing.push("kcal_per_100g_or_kcal_per_kg");
  if (!row.data_source_url) missing.push("data_source_url_or_official_evidence");
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
      "Backfill missing composition/nutrients from official Unica Natura source or label, then preview in Food V2 before commit.",
    notes: row.ingredient_text
      ? "Composition was extracted, but calories, fiber, and minerals still need official review."
      : "Only formula description and partial analysis were found; composition is required before admin preview.",
  };
}

function renderReport(rows, rawBlockCount, duplicateCount, sourcePath) {
  const coverage = (field) => rows.filter((row) => row[field]).length;
  return `# Unica Natura Document Extract

Generated: ${new Date().toISOString()}

## Summary

- Source document: ${sourcePath}
- Raw product headings: ${rawBlockCount}
- Extracted formula-level rows: ${rows.length}
- Duplicate blocks skipped: ${duplicateCount}
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Coverage

- Ingredients: ${coverage("ingredient_text")}/${rows.length}
- Protein/fat/ash: ${rows.filter((row) => row.protein_percent && row.fat_percent && row.ash_percent).length}/${rows.length}
- Fiber: 0/${rows.length}
- Kcal/ME: 0/${rows.length}
- Calcium/phosphorus: 0/${rows.length}
- Sodium/magnesium: 0/${rows.length}
- Official URL: 0/${rows.length}

## Import Decision

All rows are marked needs_review/hold. The document is useful for formula discovery and partial nutrients, but it is not import-ready without composition/nutrient backfill.

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

  console.log(`Unica Natura document rows: ${rows.length}`);
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
