import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const defaultDocumentPath = "C:/Users/NIOstb/Desktop/photo_foods_nutritail/aatu barking Heads.docx";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/aatu_barking_heads_document_extract_v2.csv",
  review: "data/review/aatu_barking_heads_document_extract_review.csv",
  report: "reports/aatu_barking_heads_document_extract.md",
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
    .replace(/\bG\.f\./gi, "G.F.")
    .replace(/\bAatu\b/g, "AATU")
    .replace(/\bBarking Heads\b/gi, "Barking Heads");
}

function isHeading(value) {
  const text = cleanText(value);
  if (/TREAT|TREATS|ΛΙΧ/i.test(text)) return false;
  return /(?:AATU|BARKING)/i.test(text) && text.length < 180;
}

function brandFromHeading(heading) {
  return /AATU/i.test(heading) ? "AATU" : "Barking Heads";
}

function canonicalFormulaName(heading) {
  const brand = brandFromHeading(heading);
  let text = cleanText(heading)
    .replace(/^\d+\s*/u, "")
    .replace(/^(?:ΞΗΡΑ\.ΣΚ|ΚΟΝ\.ΣΚ|POUCH DOG|POUCH)\s*/iu, "")
    .replace(/\b\d+(?:[,.]\d+)?\s*(?:kg|gr|g)\b/giu, "")
    .replace(/\s+/g, " ");
  const brandIndex = text.search(brand === "AATU" ? /AATU/i : /BARKING/i);
  if (brandIndex >= 0) text = text.slice(brandIndex);
  text = text
    .replace(/^BARKING\s+HEADS\s+/iu, "Barking Heads ")
    .replace(/^BARKING\s+/iu, "Barking Heads ")
    .replace(/^AATU\s+/iu, "AATU ");
  return titleCase(text).replace(/^Barking Heads Heads\s+/u, "Barking Heads ");
}

function sectionParagraphs(paragraphs, startIndex) {
  const nextHeadingIndex = paragraphs.findIndex(
    (paragraph, index) => index > startIndex && isHeading(paragraph),
  );
  return paragraphs.slice(startIndex + 1, nextHeadingIndex === -1 ? paragraphs.length : nextHeadingIndex);
}

function numberValue(value) {
  const normalized = String(value ?? "").replace(",", ".").replace(/\s+/g, "");
  const match = normalized.match(/\d+(?:\.\d+)?|\.\d+/);
  if (!match) return "";
  return String(Number(match[0]));
}

function percentAfter(text, labelPattern) {
  const match = text.match(new RegExp(`${labelPattern}[^0-9,.]{0,55}(\\d+(?:[,.]\\d+)?|,[0-9]+)\\s*%`, "iu"));
  return numberValue(match?.[1] ?? "");
}

function mgKgAfter(text, labelPattern) {
  const match = text.match(new RegExp(`${labelPattern}[^0-9,.]{0,55}(\\d+(?:[,.]\\d+)?|,[0-9]+)\\s*mg\\s*/?\\s*kg`, "iu"));
  return numberValue(match?.[1] ?? "");
}

function cappedPercent(value, maxValue) {
  if (!value) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric > maxValue) return "";
  return value;
}

function boundedPercent(value, minValue, maxValue) {
  if (!value) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < minValue || numeric > maxValue) return "";
  return value;
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

function inferFormat(heading) {
  return /(?:WET|POUCH|ΚΟΝ\.ΣΚ|400gr|300gr|150gr)/iu.test(heading) ? "wet" : "dry";
}

function inferLifeStage(formulaName, descriptionText) {
  const text = `${formulaName} ${descriptionText}`.toLowerCase();
  if (text.includes("golden years") || text.includes("senior")) return "senior";
  if (text.includes("puppy") || text.includes("puppies") || text.includes("κουτάβ")) return "puppy";
  return "adult";
}

function inferDogSize(formulaName, descriptionText) {
  const text = `${formulaName} ${descriptionText}`.toLowerCase();
  if (text.includes("small")) return "small";
  if (text.includes("large")) return "large";
  return "all";
}

function tagsFor(formulaName, ingredients, descriptionText, format) {
  const text = `${formulaName} ${descriptionText} ${ingredients.join(" ")}`.toLowerCase();
  const tags = ["dog", format];
  if (text.includes("grain free") || text.includes("χωρίς") || text.includes("g.f.")) tags.push("grain_free");
  if (text.includes("puppy") || text.includes("puppies")) tags.push("puppy");
  if (text.includes("fat dog") || text.includes("slim") || text.includes("top light")) tags.push("weight_control");
  if (text.includes("senior") || text.includes("golden years")) tags.push("senior");
  if (text.includes("mono") || text.includes("μονοπρωτε")) tags.push("single_protein");
  if (text.includes("salmon") || text.includes("σολομ")) tags.push("salmon", "fish");
  if (text.includes("trout") || text.includes("πέστροφ")) tags.push("fish");
  if (text.includes("duck") || text.includes("πάπια")) tags.push("duck");
  if (text.includes("chicken") || text.includes("κοτόπουλ")) tags.push("chicken");
  if (text.includes("turkey") || text.includes("γαλοπούλ")) tags.push("turkey");
  if (text.includes("lamb") || text.includes("αρνί")) tags.push("lamb");
  if (text.includes("beef") || text.includes("angus") || text.includes("βοδιν")) tags.push("beef");
  if (text.includes("boar") || text.includes("pork") || text.includes("χοιριν")) tags.push("pork");
  if (text.includes("rice") || text.includes("ρύζι")) tags.push("rice");
  if (text.includes("potato") || text.includes("πατάτ")) tags.push("potato");
  if (text.includes("pea") || text.includes("αρακά")) tags.push("pea");
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
      /(?:Αναλυτικά|Πρόσθετα|Διατροφικά|Βιταμίνες|Δεν περιέχει)/iu,
    );
    const analysisText = readSection(
      blockParagraphs,
      /(?:Αναλυτικά\s+συστατικά|Analytical\s+constituents)\s*:/iu,
      /(?:Πρόσθετα|Διατροφικά|Βιταμίνες|Ιχνοστοιχεία|Δεν περιέχει)/iu,
    );
    if (!ingredientText || !analysisText) continue;
    rawBlocks.push({
      brand: brandFromHeading(heading),
      formulaName: canonicalFormulaName(heading),
      heading,
      descriptionText: blockParagraphs
        .filter((paragraph) => !/(?:Σύνθεση|Αναλυτικά|Πρόσθετα|Διατροφικά|Βιταμίνες|Ιχνοστοιχεία|Δεν περιέχει|^")/iu.test(paragraph))
        .map(cleanText)
        .join(" "),
      ingredientText,
      analysisText,
      additivesText: blockParagraphs
        .filter((paragraph) => /(?:Πρόσθετα|Διατροφικά|Βιταμίνες|Ιχνοστοιχεία|Ψευδάργυρος|Σίδηρος|Χαλκός|Μαγγάνιο|Ιώδιο|Σελήνιο)/iu.test(paragraph))
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
  const format = inferFormat(block.heading);
  const tags = tagsFor(block.formulaName, ingredients, block.descriptionText, format);
  return {
    brand: block.brand,
    formula_name: block.formulaName,
    display_name: block.formulaName,
    species: "dog",
    format,
    life_stage: inferLifeStage(block.formulaName, block.descriptionText),
    dog_size: inferDogSize(block.formulaName, block.descriptionText),
    breed_target: "",
    medical_tags: [
      tags.includes("weight_control") ? "obesity" : "",
      tags.includes("single_protein") ? "allergy" : "",
    ].filter(Boolean).join(";"),
    commercial_tags: tags,
    ingredient_text: block.ingredientText,
    ingredients: JSON.stringify(ingredients),
    primary_animal_proteins: ingredients.filter((item) => /(γαλοπούλ|σολομ|πάπια|κοτόπουλ|αρνί|βοδιν|χοιριν|αγριογούρ|πέστροφ|turkey|salmon|duck|chicken|lamb|beef|pork|boar|trout)/iu.test(item)).join(";"),
    carbohydrate_sources: ingredients.filter((item) => /(γλυκοπατάτα|πατάτα|ρύζι|αρακά|ρεβίθ|ταπιόκα|sweet potato|potato|rice|pea|chickpea|tapioca)/iu.test(item)).join(";"),
    fat_sources: ingredients.filter((item) => /(λίπος|έλαιο|λάδι|ηλιέλαιο|fat|oil)/iu.test(item)).join(";"),
    fiber_sources: ingredients.filter((item) => /(μήλο|ντομάτα|καρότο|κιχώρι|apple|tomato|carrot|chicory)/iu.test(item)).join(";"),
    additives_text: block.additivesText,
    feeding_guide_text: "",
    kcal_per_100g: "",
    kcal_per_kg: "",
    protein_percent: boundedPercent(percentAfter(block.analysisText, "(?:πρωτεΐνη|πρωτεΐνες|πρωτε)"), 5, 60),
    fat_percent: cappedPercent(percentAfter(block.analysisText, "(?:λιπαρά|λίπος|λίπ)"), 40),
    fiber_percent: cappedPercent(percentAfter(block.analysisText, "(?:ίνες|ινώδ)"), 20),
    ash_percent: cappedPercent(percentAfter(block.analysisText, "(?:τέφρα|ανόργανη|ύλη)"), 20),
    moisture_percent: cappedPercent(percentAfter(block.analysisText, "υγρασία"), 90),
    calcium_percent: cappedPercent(percentAfter(block.analysisText, "ασβ"), 5),
    phosphorus_percent: cappedPercent(percentAfter(block.analysisText, "φ.σφ"), 5),
    sodium_percent: "",
    magnesium_percent: "",
    potassium_percent: "",
    omega3_percent: cappedPercent(percentAfter(block.analysisText, "Ωμέγα-?3"), 10),
    omega6_percent: cappedPercent(percentAfter(block.analysisText, "Ωμέγα-?6"), 10),
    dha_percent: "",
    epa_percent: "",
    taurine_mgkg: "",
    l_carnitine_mgkg: mgKgAfter(block.additivesText, "L-Καρνιτίνη"),
    glucosamine_mgkg: mgKgAfter(block.ingredientText, "γλυκοζαμίνη|glucosamine"),
    chondroitin_mgkg: mgKgAfter(block.ingredientText, "χονδροϊτίνη|chondroitin"),
    vitamin_a_iukg: "",
    vitamin_d3_iukg: "",
    vitamin_e_mgkg: mgKgAfter(block.additivesText, "Βιταμίνη E|Βιταμίνη Ε"),
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
      "treats_excluded=true",
      "official_url_required=true",
      "kcal_backfill_required=true",
      "sodium_magnesium_backfill_required=true",
      `duplicate_blocks_skipped=${block.duplicateCount}`,
      "Auto-extracted from aatu barking Heads.docx; verify against official AATU/Barking Heads source or label before import.",
    ].join("; "),
    formula_key: `${slugify(block.brand)}-${slugify(block.formulaName)}-dog-${format}-gr-document`,
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
      "Attach official AATU/Barking Heads URL, verify nutrients/format, backfill kcal/sodium/magnesium if available, then preview in Food V2 before commit.",
    notes: "Treat products are intentionally excluded; rows are formula-level food products only.",
  };
}

function renderReport(rows, rawBlockCount, duplicateCount, sourcePath) {
  const coverage = (field) => rows.filter((row) => row[field]).length;
  return `# AATU / Barking Heads Document Extract

Generated: ${new Date().toISOString()}

## Summary

- Source document: ${sourcePath}
- Raw complete food blocks: ${rawBlockCount}
- Extracted formula-level rows: ${rows.length}
- Duplicate pack/formula blocks skipped: ${duplicateCount}
- Treat products excluded from Food V2 import candidates.
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Coverage

- Ingredients: ${coverage("ingredient_text")}/${rows.length}
- Protein/fat/fiber: ${rows.filter((row) => row.protein_percent && row.fat_percent && row.fiber_percent).length}/${rows.length}
- Ash/moisture: ${rows.filter((row) => row.ash_percent && row.moisture_percent).length}/${rows.length}
- Calcium/phosphorus: ${rows.filter((row) => row.calcium_percent && row.phosphorus_percent).length}/${rows.length}
- Omega 3 / Omega 6: ${rows.filter((row) => row.omega3_percent && row.omega6_percent).length}/${rows.length}
- Kcal/ME: 0/${rows.length}
- Sodium/magnesium: 0/${rows.length}
- Official URL: 0/${rows.length}

## Import Decision

All rows are marked needs_review. The uploaded document has useful composition and analytical data, but official URLs, calories, sodium, and magnesium still need review/backfill.

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

  console.log(`AATU / Barking Heads document rows: ${rows.length}`);
  console.log(`Raw complete food blocks: ${rawBlockCount}`);
  console.log(`Duplicate pack/formula blocks skipped: ${duplicateCount}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
