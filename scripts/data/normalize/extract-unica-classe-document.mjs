import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const defaultDocumentPath = "C:/Users/NIOstb/Desktop/photo_foods_nutritail/Unica Classe.docx";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/unica_classe_document_extract_v2.csv",
  review: "data/review/unica_classe_document_extract_review.csv",
  report: "reports/unica_classe_document_extract.md",
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
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isHeading(value) {
  const text = cleanText(value);
  return /^Unica Class\s+/iu.test(text) && text.length < 140;
}

function canonicalFormulaName(heading) {
  const firstPackVariant = cleanText(heading).split("/")[0] ?? heading;
  return titleCase(
    firstPackVariant
      .replace(/\b\d+(?:[,.]\d+)?\s*(?:kg|gr|g)\b/giu, "")
      .replace(/\s+/g, " "),
  );
}

function sectionParagraphs(paragraphs, startIndex) {
  const nextHeadingIndex = paragraphs.findIndex(
    (paragraph, index) => index > startIndex && isHeading(paragraph),
  );
  return paragraphs.slice(startIndex + 1, nextHeadingIndex === -1 ? paragraphs.length : nextHeadingIndex);
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

function firstPercent(text) {
  const match = text.match(/^\s*(\d+(?:[,.]\d+)?)\s*%/u);
  return numberValue(match?.[1] ?? "");
}

function cappedPercent(value, maxValue = 10) {
  if (!value) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric > maxValue) return "";
  return value;
}

function mgAfter(text, labelPattern) {
  const match = text.match(new RegExp(`${labelPattern}[^0-9]{0,55}(\\d+(?:[,.]\\d+)?)\\s*(?:mg|IU|MJ)`, "iu"));
  return numberValue(match?.[1] ?? "");
}

function extractInlineSection(text, labelPattern, stopPattern) {
  const match = text.match(labelPattern);
  if (!match?.index && match?.index !== 0) return "";
  const value = text.slice(match.index + match[0].length);
  const stop = value.match(stopPattern);
  return cleanText(stop?.index != null ? value.slice(0, stop.index) : value);
}

function looksLikeIngredientText(text) {
  return /(\u03b6\u03c9\u03b9\u03ba|\u03c0\u03c1\u03c9\u03c4\u03b5|\u03ba\u03bf\u03c4\u03cc\u03c0|\u03b1\u03c1\u03bd|\u03c4\u03cc\u03bd|\u03c3\u03bf\u03bb|\u03c3\u03cc\u03c1\u03b3\u03bf|\u03b1\u03c1\u03b1\u03b2|\u03c1\u03cd\u03b6\u03b9|\u03b3\u03bb\u03bf\u03c5\u03c4\u03ad\u03bd|Yucca)/iu.test(text);
}

function readIngredientText(blockParagraphs) {
  for (const paragraph of blockParagraphs) {
    const text = cleanText(paragraph);
    const value = extractInlineSection(
      text,
      /(?:\u03a3\u03cd\u03bd\u03b8\u03b5\u03c3\u03b7|\u03a3\u03cd\u03bd\u03b5\u03c3\u03b7|\u03a3\u03c5\u03bd\u03b5\u03c3\u03b7)\s*:/iu,
      /(?:\u0391\u03bd\u03b1\u03bb\u03c5\u03c4\u03b9\u03ba\u03ac|\u0394\u03b9\u03b1\u03c4\u03c1\u03bf\u03c6\u03b9\u03ba\u03ac|\* \u03b9\u03c3\u03bf\u03b4\u03cd\u03bd\u03b1\u03bc\u03bf)/iu,
    );
    if (value && looksLikeIngredientText(value)) return value;
  }
  return "";
}

function readAnalysisText(blockParagraphs) {
  for (const paragraph of blockParagraphs) {
    const text = cleanText(paragraph);
    if (/\u0391\u03bd\u03b1\u03bb\u03c5\u03c4\u03b9\u03ba\u03ac\s+\u03c3\u03c5\u03c3\u03c4\u03b1\u03c4\u03b9\u03ba\u03ac\s*:/iu.test(text)) {
      return extractInlineSection(
        text,
        /\u0391\u03bd\u03b1\u03bb\u03c5\u03c4\u03b9\u03ba\u03ac\s+\u03c3\u03c5\u03c3\u03c4\u03b1\u03c4\u03b9\u03ba\u03ac\s*:/iu,
        /(?:\u03a3\u03cd\u03bd\u03b8\u03b5\u03c3\u03b7|\u03a3\u03cd\u03bd\u03b5\u03c3\u03b7|\u0394\u03b9\u03b1\u03c4\u03c1\u03bf\u03c6\u03b9\u03ba\u03ac)/iu,
      );
    }
  }
  return "";
}

function readAdditivesText(blockParagraphs) {
  return blockParagraphs
    .filter((paragraph) => /(\u0394\u03b9\u03b1\u03c4\u03c1\u03bf\u03c6\u03b9\u03ba\u03ac|\u0392\u03b9\u03c4\u03b1\u03bc\u03af\u03bd\u03b7|\u03a7\u03b1\u03bb\u03ba|\u03a8\u03b5\u03c5\u03b4|\u03a3\u03af\u03b4\u03b7\u03c1)/iu.test(paragraph))
    .map(cleanText)
    .join(" ");
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

function inferLifeStage(formulaName) {
  const value = formulaName.toLowerCase();
  if (value.includes("puppy")) return "puppy";
  if (value.includes("senior") || value.includes("longevity")) return "senior";
  return "adult";
}

function inferDogSize(formulaName, descriptionText) {
  const name = formulaName.toLowerCase();
  const description = descriptionText.toLowerCase();
  if (name.includes("mini")) return "small";
  if (name.includes("large")) return "large";
  if (name.includes("medium")) return "medium";
  if (description.includes("\u03cc\u03bb\u03c9\u03bd \u03c4\u03c9\u03bd \u03c6\u03c5\u03bb\u03ce\u03bd") || description.includes("\u03cc\u03bb\u03c9\u03bd \u03c4\u03c9\u03bd \u03bc\u03b5\u03b3\u03b5\u03b8\u03ce\u03bd")) return "all";
  return "all";
}

function tagsFor(formulaName, ingredients) {
  const text = `${formulaName} ${ingredients.join(" ")}`.toLowerCase();
  const tags = ["dog", "dry"];
  if (text.includes("puppy")) tags.push("puppy");
  if (text.includes("senior") || text.includes("longevity")) tags.push("senior");
  if (text.includes("sensitive")) tags.push("sensitive_digestion");
  if (text.includes("tonic")) tags.push("skin_coat");
  if (text.includes("regular")) tags.push("maintenance");
  if (text.includes("equilibrium")) tags.push("balanced");
  if (text.includes("chicken") || text.includes("\u03ba\u03bf\u03c4\u03cc\u03c0")) tags.push("chicken");
  if (text.includes("lamb") || text.includes("\u03b1\u03c1\u03bd")) tags.push("lamb");
  if (text.includes("salmon") || text.includes("\u03c3\u03bf\u03bb")) tags.push("salmon", "fish");
  if (text.includes("tuna") || text.includes("\u03c4\u03cc\u03bd")) tags.push("tuna", "fish");
  if (text.includes("\u03c1\u03cd\u03b6\u03b9")) tags.push("rice");
  if (text.includes("\u03b1\u03c1\u03b1\u03b2") || text.includes("corn")) tags.push("corn");
  return [...new Set(tags)].join(";");
}

function extractBlocks(paragraphs) {
  const blocks = [];
  for (let index = 0; index < paragraphs.length; index += 1) {
    const heading = cleanText(paragraphs[index]);
    if (!isHeading(heading)) continue;
    const blockParagraphs = sectionParagraphs(paragraphs, index);
    const analysisText = readAnalysisText(blockParagraphs);
    if (!analysisText) continue;
    blocks.push({
      formulaName: canonicalFormulaName(heading),
      heading,
      descriptionText: blockParagraphs
        .filter((paragraph) => !/(\u0391\u03bd\u03b1\u03bb\u03c5\u03c4\u03b9\u03ba\u03ac|\u03a3\u03cd\u03bd\u03b8\u03b5\u03c3\u03b7|\u03a3\u03cd\u03bd\u03b5\u03c3\u03b7|\u0394\u03b9\u03b1\u03c4\u03c1\u03bf\u03c6\u03b9\u03ba\u03ac|\* )/iu.test(paragraph))
        .map(cleanText)
        .join(" "),
      ingredientText: readIngredientText(blockParagraphs),
      analysisText,
      additivesText: readAdditivesText(blockParagraphs),
      duplicateCount: heading.includes("/") ? heading.split("/").length - 1 : 0,
    });
  }
  return { blocks, rawBlockCount: blocks.length, duplicateCount: blocks.reduce((sum, block) => sum + block.duplicateCount, 0) };
}

function rowFromBlock(block, sourcePath) {
  const ingredients = splitIngredients(block.ingredientText);
  const tags = tagsFor(block.formulaName, ingredients);
  return {
    brand: "Unica Classe",
    formula_name: block.formulaName,
    display_name: block.formulaName,
    species: "dog",
    format: "dry",
    life_stage: inferLifeStage(block.formulaName),
    dog_size: inferDogSize(block.formulaName, block.descriptionText),
    breed_target: "",
    medical_tags: tags.includes("sensitive_digestion") ? "gi_support" : "",
    commercial_tags: tags,
    ingredient_text: block.ingredientText,
    ingredients: ingredients.length ? JSON.stringify(ingredients) : "",
    primary_animal_proteins: ingredients.filter((item) => /(\u03ba\u03bf\u03c4\u03cc\u03c0|\u03b1\u03c1\u03bd|\u03c4\u03cc\u03bd|\u03c3\u03bf\u03bb|chicken|lamb|tuna|salmon)/iu.test(item)).join(";"),
    carbohydrate_sources: ingredients.filter((item) => /(\u03c3\u03cc\u03c1\u03b3\u03bf|\u03b1\u03c1\u03b1\u03b2|\u03c1\u03cd\u03b6\u03b9|\u03c3\u03af\u03c4\u03bf|corn|rice)/iu.test(item)).join(";"),
    fat_sources: ingredients.filter((item) => /(\u03bb\u03af\u03c0\u03bf\u03c2|\u03b9\u03c7\u03b8\u03c5\u03ad\u03bb\u03b1\u03b9\u03bf|fat|oil)/iu.test(item)).join(";"),
    fiber_sources: ingredients.filter((item) => /(\u03c4\u03b5\u03cd\u03c4\u03bb|\u03c7\u03b1\u03c1\u03bf\u03c5\u03c0|beet|carob)/iu.test(item)).join(";"),
    additives_text: block.additivesText,
    feeding_guide_text: "",
    kcal_per_100g: "",
    kcal_per_kg: "",
    protein_percent: percentAfter(block.analysisText, "(?:\u03c0\u03c1\u03c9\u03c4|\u03a0\u03c1\u03c9\u03c4)") || firstPercent(block.analysisText),
    fat_percent: percentAfter(block.analysisText, "(?:\u039b\u03b9\u03c0\u03b1\u03c1|\u03bb\u03af\u03c0\u03bf\u03c2|\u03bb\u03b9\u03c0)"),
    fiber_percent: percentAfter(block.analysisText, "(?:\u038a\u03bd\u03b5\u03c2|\u03af\u03bd\u03b5\u03c2)"),
    ash_percent: percentAfter(block.analysisText, "(?:\u03a4\u03ad\u03c6\u03c1\u03b1|\u03c4\u03ad\u03c6\u03c1)"),
    moisture_percent: "",
    calcium_percent: cappedPercent(percentAfter(block.analysisText, "\u0391\u03c3\u03b2"), 5),
    phosphorus_percent: cappedPercent(percentAfter(block.analysisText, "\u03a6.\u03c3\u03c6"), 5),
    sodium_percent: "",
    magnesium_percent: "",
    potassium_percent: "",
    omega3_percent: "",
    omega6_percent: "",
    dha_percent: "",
    epa_percent: "",
    taurine_mgkg: "",
    l_carnitine_mgkg: "",
    glucosamine_mgkg: block.ingredientText.includes("\u03b3\u03bb\u03c5\u03ba\u03bf\u03b6\u03b1\u03bc\u03af\u03bd\u03b7") ? "100" : "",
    chondroitin_mgkg: "",
    vitamin_a_iukg: mgAfter(block.additivesText, "\u0392\u03b9\u03c4\u03b1\u03bc\u03af\u03bd\u03b7\\s*\u0391"),
    vitamin_d3_iukg: mgAfter(block.additivesText, "\u0392\u03b9\u03c4\u03b1\u03bc\u03af\u03bd\u03b7\\s*D3"),
    vitamin_e_mgkg: mgAfter(block.additivesText, "\u0392\u03b9\u03c4\u03b1\u03bc\u03af\u03bd\u03b7\\s*\u0395"),
    iron_mgkg: mgAfter(block.additivesText, "\u03c3\u03af\u03b4\u03b7\u03c1"),
    zinc_mgkg: mgAfter(block.additivesText, "\u03c8\u03b5\u03c5\u03b4"),
    copper_mgkg: mgAfter(block.additivesText, "\u03c7\u03b1\u03bb\u03ba"),
    manganese_mgkg: mgAfter(block.additivesText, "\u03bc\u03b1\u03b3\u03b3"),
    iodine_mgkg: mgAfter(block.additivesText, "\u03b9\u03ce\u03b4"),
    selenium_mgkg: mgAfter(block.additivesText, "\u03c3\u03b5\u03bb\u03ae\u03bd"),
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
      "missing_composition_possible=true",
      `duplicate_blocks_skipped=${block.duplicateCount}`,
      "Auto-extracted from Unica Classe.docx; verify against official source or label before import.",
    ].join("; "),
    formula_key: `unica-classe-${slugify(block.formulaName)}-dog-dry-gr-document`,
    ean: "",
  };
}

function missingFieldsFor(row) {
  const missing = [];
  if (!row.ingredient_text) missing.push("ingredient_text");
  if (!row.kcal_per_kg) missing.push("kcal_per_100g_or_kcal_per_kg");
  if (!row.data_source_url) missing.push("data_source_url_or_official_evidence");
  for (const field of ["moisture_percent", "sodium_percent", "magnesium_percent"]) {
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
      "Attach official Unica Classe URL, verify/backfill ingredient composition, kcal/ME, moisture, sodium and magnesium before Food V2 commit.",
    notes: "Some document blocks include analytical values but no usable composition text; keep all rows in hold until manual review.",
  };
}

function renderReport(rows, rawBlockCount, duplicateCount, sourcePath) {
  const coverage = (field) => rows.filter((row) => row[field]).length;
  return `# Unica Classe Document Extract

Generated: ${new Date().toISOString()}

## Summary

- Source document: ${sourcePath}
- Raw formula headings with analysis: ${rawBlockCount}
- Extracted formula-level rows: ${rows.length}
- Pack variants collapsed from slash headings: ${duplicateCount}
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Coverage

- Ingredients/composition: ${coverage("ingredient_text")}/${rows.length}
- Protein/fat/fiber: ${rows.filter((row) => row.protein_percent && row.fat_percent && row.fiber_percent).length}/${rows.length}
- Ash: ${coverage("ash_percent")}/${rows.length}
- Calcium/phosphorus: ${rows.filter((row) => row.calcium_percent && row.phosphorus_percent).length}/${rows.length}
- Kcal/ME: 0/${rows.length}
- Moisture/sodium/magnesium: 0/${rows.length}
- Official URL: 0/${rows.length}

## Import Decision

All rows are marked needs_review. This source is useful for formula names and proximate analysis, but several rows need ingredient composition backfill before any production import.

## Extracted Formulas

${rows.map((row) => `- ${row.display_name}${row.ingredient_text ? "" : " (composition missing)"}`).join("\n")}
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

  console.log(`Unica Classe document rows: ${rows.length}`);
  console.log(`Raw formula headings with analysis: ${rawBlockCount}`);
  console.log(`Pack variants collapsed from slash headings: ${duplicateCount}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
