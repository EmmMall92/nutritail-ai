import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const defaultDocumentPath = "C:/Users/NIOstb/Desktop/photo_foods_nutritail/JOSERA ΠΕΡΙΓΡΑΦΕΣ.docx";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/josera_document_extract_v2.csv",
  review: "data/review/josera_document_extract_review.csv",
  report: "reports/josera_document_extract.md",
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
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.replace(/^\uFEFF/, "").trim());
      current = "";
    } else {
      current += char;
    }
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
        .replace(/<[^>]+>/g, " ")
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
    .replace(/\bJosera\b/gi, "Josera")
    .replace(/\bJosicat\b/gi, "JosiCat");
}

function isHeading(value) {
  const text = cleanText(value);
  return /(?:JOSERA|Josera|JosiCat)/.test(text) && text.length < 180;
}

function canonicalFormulaName(heading) {
  const text = cleanText(heading)
    .replace(/^\d+\s*/u, "")
    .replace(/^[^\w]*(?:ΞΗΡΑ\.Γ|нгяа\.ц)?\s*/iu, "")
    .replace(/^POUCH CAT\s+/iu, "")
    .replace(/\b\d+(?:[,.]\d+)?\s*(?:kg|gr|g)\b/giu, "")
    .replace(/\s+/g, " ");
  const joseraIndex = text.search(/(?:JOSERA|Josera|JosiCat)/);
  const name = titleCase(joseraIndex >= 0 ? text.slice(joseraIndex) : text)
    .replace(/&S Almon/g, "& Salmon")
    .replace(/Με Λαδι Σολομου/giu, "Salmon Oil");
  if (/JosiCat .*Sterilised.*Classic|JosiCat .*Classic.*Sterilised/iu.test(name)) {
    return "Josera JosiCat Classic Sterilised";
  }
  return name;
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
  const match = text.match(new RegExp(`${labelPattern}[^0-9]{0,55}(\\d+(?:[,.]\\d+)?)\\s*%`, "iu"));
  return numberValue(match?.[1] ?? "");
}

function cappedPercent(value, maxValue) {
  if (!value) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric > maxValue) return "";
  return value;
}

function mgKgAfter(text, labelPattern) {
  const match = text.match(new RegExp(`${labelPattern}[^0-9]{0,55}(\\d+(?:[,.]\\d+)?)\\s*(?:mg|mcg)\\s*/?\\s*kg`, "iu"));
  return numberValue(match?.[1] ?? "");
}

function kcalPerKg(text) {
  return numberValue(text.match(/(\d+(?:[,.]\d+)?)\s*kcal\s*\/?\s*kg/iu)?.[1] ?? "");
}

function extractInlineSection(text, labelPattern, stopPattern) {
  const match = text.match(labelPattern);
  if (!match?.index && match?.index !== 0) return "";
  const value = text.slice(match.index + match[0].length);
  const stop = value.match(stopPattern);
  return cleanText(stop?.index != null ? value.slice(0, stop.index) : value);
}

function readSection(blockParagraphs, labelPattern, stopPattern) {
  for (const paragraph of blockParagraphs) {
    const value = extractInlineSection(cleanText(paragraph), labelPattern, stopPattern);
    if (value) return value;
  }
  return "";
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

function inferLifeStage(formulaName, descriptionText) {
  const text = `${formulaName} ${descriptionText}`.toLowerCase();
  if (text.includes("kitten") || text.includes("γατάκια") || text.includes("ανάπτυξης")) return "kitten";
  if (text.includes("senior") || text.includes("renal") || text.includes("ηλικιω")) return "senior";
  return "adult";
}

function tagsFor(formulaName, ingredients, descriptionText, format) {
  const text = `${formulaName} ${descriptionText} ${ingredients.join(" ")}`.toLowerCase();
  const tags = ["cat", format];
  if (text.includes("grain free") || text.includes("χωρίς σιτηρά")) tags.push("grain_free");
  if (text.includes("kitten")) tags.push("kitten");
  if (text.includes("sterilised") || text.includes("στειρω")) tags.push("sterilised", "weight_control");
  if (text.includes("renal") || text.includes("νεφρ")) tags.push("renal");
  if (text.includes("hairball") || text.includes("τριχόμπαλ")) tags.push("hairball");
  if (text.includes("hypoallergenic")) tags.push("allergy");
  if (text.includes("sensitive") || text.includes("πεπτικ")) tags.push("sensitive_digestion");
  if (text.includes("urinary") || text.includes("ουροποιη")) tags.push("urinary");
  if (text.includes("poultry") || text.includes("πουλερ")) tags.push("chicken");
  if (text.includes("salmon") || text.includes("σολομ")) tags.push("salmon", "fish");
  if (text.includes("duck") || text.includes("πάπια")) tags.push("duck");
  if (text.includes("trout") || text.includes("πέστροφ")) tags.push("fish");
  if (text.includes("beef") || text.includes("βοδιν")) tags.push("beef");
  if (text.includes("turkey") || text.includes("γαλοπούλ")) tags.push("turkey");
  if (text.includes("rice") || text.includes("ρύζι")) tags.push("rice");
  if (text.includes("corn") || text.includes("καλαμπ")) tags.push("corn");
  if (text.includes("potato") || text.includes("πατάτ")) tags.push("potato");
  return [...new Set(tags)].join(";");
}

function extractBlocks(paragraphs) {
  const rawBlocks = [];
  for (let index = 0; index < paragraphs.length; index += 1) {
    const heading = cleanText(paragraphs[index]);
    if (!isHeading(heading)) continue;
    const blockParagraphs = sectionParagraphs(paragraphs, index);
    const ingredientText = readSection(
      blockParagraphs,
      /(?:Σύνθεση|Composition)\s*:/iu,
      /(?:Αναλυτικά|Διατροφικές|Βάρος|Ημερήσια)/iu,
    );
    const analysisText = readSection(
      blockParagraphs,
      /(?:Αναλυτικά\s+(?:συστατικά|Συστατικά)|Analytical\s+constituents)\s*:/iu,
      /(?:Διατροφικές|Βάρος|Ημερήσια|Για Γατάκια)/iu,
    );
    if (!ingredientText || !analysisText) continue;
    rawBlocks.push({
      formulaName: canonicalFormulaName(heading),
      heading,
      descriptionText: blockParagraphs
        .filter((paragraph) => !/(?:Σύνθεση|Αναλυτικά|Διατροφικές|Βάρος|Ημερήσια|Ποσότητα|\d+\s*-\s*\d+\s*kg|\d+\s*-\s*\d+\s*g|^")/iu.test(paragraph))
        .map(cleanText)
        .join(" "),
      ingredientText,
      analysisText,
      additivesText: blockParagraphs
        .filter((paragraph) => /(?:Διατροφικές|Ταυρίνη|Βιταμίνη|Σίδηρος|Ψευδάργυρος|Χαλκός|Ιώδιο|Σελήνιο)/iu.test(paragraph))
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

function rowFromBlock(block, sourcePath) {
  const ingredients = splitIngredients(block.ingredientText);
  const format = /POUCH/i.test(block.heading) ? "wet" : "dry";
  const kcalKg = kcalPerKg(block.analysisText);
  const tags = tagsFor(block.formulaName, ingredients, block.descriptionText, format);
  return {
    brand: "Josera",
    formula_name: block.formulaName,
    display_name: block.formulaName,
    species: "cat",
    format,
    life_stage: inferLifeStage(block.formulaName, block.descriptionText),
    dog_size: "",
    breed_target: "",
    medical_tags: [
      tags.includes("renal") ? "renal" : "",
      tags.includes("urinary") ? "urinary" : "",
      tags.includes("weight_control") ? "obesity" : "",
      tags.includes("allergy") ? "allergy" : "",
      tags.includes("sensitive_digestion") ? "gi_support" : "",
    ].filter(Boolean).join(";"),
    commercial_tags: tags,
    ingredient_text: block.ingredientText,
    ingredients: JSON.stringify(ingredients),
    primary_animal_proteins: ingredients.filter((item) => /(πουλερ|σολομ|ψαρι|πάπια|βοδιν|γαλοπούλ|poultry|salmon|fish|duck|beef|turkey)/iu.test(item)).join(";"),
    carbohydrate_sources: ingredients.filter((item) => /(ρύζι|καλαμπ|πατάτ|ταπιόκα|μπιζ|rice|corn|potato|tapioca|pea)/iu.test(item)).join(";"),
    fat_sources: ingredients.filter((item) => /(λίπος|λάδι|έλαιο|fat|oil)/iu.test(item)).join(";"),
    fiber_sources: ingredients.filter((item) => /(τεύτλ|κυτταρ|ίνες|κιχωρ|beet|cellulose|chicory|fiber)/iu.test(item)).join(";"),
    additives_text: block.additivesText,
    feeding_guide_text: "",
    kcal_per_100g: kcalKg ? String(Math.round((Number(kcalKg) / 10) * 10) / 10) : "",
    kcal_per_kg: kcalKg,
    protein_percent: percentAfter(block.analysisText, "πρωτε"),
    fat_percent: percentAfter(block.analysisText, "(?:λιπαρά|λιπαρ)"),
    fiber_percent: percentAfter(block.analysisText, "(?:ίνες|ινώδ)"),
    ash_percent: percentAfter(block.analysisText, "(?:τέφρα|τεφρ)"),
    moisture_percent: percentAfter(block.analysisText, "υγρασία"),
    calcium_percent: percentAfter(block.analysisText, "ασβ"),
    phosphorus_percent: percentAfter(block.analysisText, "φ.σφ"),
    sodium_percent: percentAfter(block.analysisText, "νάτριο"),
    magnesium_percent: cappedPercent(percentAfter(block.analysisText, "μαγνήσιο"), 0.3),
    potassium_percent: percentAfter(block.analysisText, "κάλιο"),
    omega3_percent: "",
    omega6_percent: "",
    dha_percent: "",
    epa_percent: "",
    taurine_mgkg: mgKgAfter(block.additivesText, "Ταυρίνη"),
    l_carnitine_mgkg: mgKgAfter(block.additivesText, "L-καρνιτίνη"),
    glucosamine_mgkg: "",
    chondroitin_mgkg: "",
    vitamin_a_iukg: "",
    vitamin_d3_iukg: "",
    vitamin_e_mgkg: "",
    iron_mgkg: mgKgAfter(block.additivesText, "Σίδηρος"),
    zinc_mgkg: mgKgAfter(block.additivesText, "Ψευδάργυρος"),
    copper_mgkg: mgKgAfter(block.additivesText, "Χαλκός"),
    manganese_mgkg: mgKgAfter(block.additivesText, "Μαγγάνιο"),
    iodine_mgkg: mgKgAfter(block.additivesText, "Ιώδιο"),
    selenium_mgkg: mgKgAfter(block.additivesText, "Σελήνιο"),
    data_quality_status: "needs_review",
    data_source_url: "",
    source_priority: "unknown",
    source_notes: [
      "market=GR",
      "basis=as-fed",
      "source_tier=uploaded_document",
      `source_document=${sourcePath.replace(/\\/g, "/")}`,
      "formula_level_dedupe=true",
      "official_url_required=true",
      "kcal_backfill_required_when_missing=true",
      `duplicate_blocks_skipped=${block.duplicateCount}`,
      "Auto-extracted from JOSERA ΠΕΡΙΓΡΑΦΕΣ.docx; verify against official Josera source or label before import.",
    ].join("; "),
    formula_key: `josera-${slugify(block.formulaName)}-cat-${format}-gr-document`,
    ean: "",
  };
}

function missingFieldsFor(row) {
  const missing = [];
  if (!row.kcal_per_kg) missing.push("kcal_per_100g_or_kcal_per_kg");
  if (!row.data_source_url) missing.push("data_source_url_or_official_evidence");
  for (const field of ["sodium_percent", "magnesium_percent"]) {
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
      "Attach official Josera URL, verify nutrients/format, backfill missing kcal/sodium/magnesium if available, then preview in Food V2 before commit.",
    notes: "Uploaded document includes cat dry and pouch formulas. Keep in review until official provenance is linked.",
  };
}

function renderReport(rows, rawBlockCount, duplicateCount, sourcePath) {
  const coverage = (field) => rows.filter((row) => row[field]).length;
  return `# Josera Document Extract

Generated: ${new Date().toISOString()}

## Summary

- Source document: ${sourcePath}
- Raw complete product blocks: ${rawBlockCount}
- Extracted formula-level rows: ${rows.length}
- Duplicate formula blocks skipped: ${duplicateCount}
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Coverage

- Ingredients: ${coverage("ingredient_text")}/${rows.length}
- Protein/fat/fiber: ${rows.filter((row) => row.protein_percent && row.fat_percent && row.fiber_percent).length}/${rows.length}
- Ash: ${coverage("ash_percent")}/${rows.length}
- Calcium/phosphorus: ${rows.filter((row) => row.calcium_percent && row.phosphorus_percent).length}/${rows.length}
- Kcal/ME: ${coverage("kcal_per_kg")}/${rows.length}
- Sodium/magnesium: ${rows.filter((row) => row.sodium_percent && row.magnesium_percent).length}/${rows.length}
- Official URL: 0/${rows.length}

## Import Decision

All rows are marked needs_review. The source has useful cat formula composition and nutrient data, but official URLs and several missing minerals/calories still need review/backfill.

## Extracted Formulas

${rows.map((row) => `- ${row.display_name} (${row.format})`).join("\n")}
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

  console.log(`Josera document rows: ${rows.length}`);
  console.log(`Raw complete product blocks: ${rawBlockCount}`);
  console.log(`Duplicate formula blocks skipped: ${duplicateCount}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
