import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const defaultDocumentPath = "C:/Users/NIOstb/Desktop/photo_foods_nutritail/Schesir Dry.odt";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/schesir_dry_document_extract_v2.csv",
  review: "data/review/schesir_dry_document_extract_review.csv",
  report: "reports/schesir_dry_document_extract.md",
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
  if (eocdOffset === -1) throw new Error("Could not find ODT central directory.");

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  let centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  for (let entryIndex = 0; entryIndex < totalEntries; entryIndex += 1) {
    if (buffer.readUInt32LE(centralDirectoryOffset) !== 0x02014b50) {
      throw new Error("Invalid ODT central directory entry.");
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
      throw new Error(`Unsupported ODT compression method: ${compressionMethod}`);
    }
    centralDirectoryOffset += 46 + fileNameLength + extraLength + commentLength;
  }
  throw new Error(`ODT entry not found: ${entryName}`);
}

function paragraphsFromOdtXml(xml) {
  return [...xml.matchAll(/<text:p\b[^>]*>([\s\S]*?)<\/text:p>/g)]
    .map((match) =>
      decodeXml(
        match[1]
          .replace(/<text:line-break\s*\/>/g, "\n")
          .replace(/<[^>]+>/g, "")
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
    .replace(/\s+([/%])/g, "$1")
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
    .replace(/\bDry\b/g, "Dry")
    .replace(/\bCat\b/g, "Cat")
    .replace(/\bKitten\b/g, "Kitten")
    .replace(/\bMaintenance\b/g, "Maintenance")
    .replace(/\bChicken\b/g, "Chicken")
    .replace(/\bSchesir\b/g, "Schesir");
}

function isHeading(value) {
  const text = cleanText(value);
  return /^Schesir\b/i.test(text) && text.length < 90;
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

function kcalPer100g(text) {
  const match = text.match(/(\d+(?:[,.]\d+)?)\s*kcal\s*\/\s*100\s*g/iu);
  return numberValue(match?.[1] ?? "");
}

function mgAfter(text, labelPattern) {
  const match = text.match(new RegExp(`${labelPattern}[^0-9]{0,55}(\\d+(?:[,.]\\d+)?)\\s*mg`, "iu"));
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

function canonicalFormulaName(heading) {
  return titleCase(
    cleanText(heading)
      .replace(/\b\d+(?:[,.]\d+)?\s*(?:kg|gr|g)\b/giu, "")
      .replace(/^Schesir\s+/iu, "")
      .replace(/\s+με\s+κοτόπουλο\b/iu, " Chicken")
      .replace(/\s+/g, " "),
  );
}

function inferSpecies(text) {
  const value = text.toLowerCase();
  if (value.includes("cat") || value.includes("γατ")) return "cat";
  return "dog";
}

function inferFormat(text) {
  const value = text.toLowerCase();
  if (value.includes("υγρή") || value.includes("wet") || value.includes("φακελάκι")) return "wet";
  return "dry";
}

function inferLifeStage(formulaName, blockText) {
  const text = `${formulaName} ${blockText}`.toLowerCase();
  if (formulaName.toLowerCase().includes("kitten") || text.includes("γατάκι")) return "kitten";
  if (text.includes("puppy")) return "puppy";
  if (text.includes("senior")) return "senior";
  return "adult";
}

function inferDogSize(formulaName, blockText, species) {
  if (species !== "dog") return "";
  const text = `${formulaName} ${blockText}`.toLowerCase();
  if (text.includes("small") || text.includes("μικρόσωμ")) return "small";
  if (text.includes("medium") || text.includes("μεσα")) return "medium";
  return "all";
}

function tagsFor(formulaName, ingredients, blockText, species, format) {
  const text = `${formulaName} ${blockText} ${ingredients.join(" ")}`.toLowerCase();
  const tags = [species, format, "monoprotein"];
  if (text.includes("kitten") || text.includes("γατάκι")) tags.push("kitten");
  if (text.includes("sterilised") || text.includes("sterilized") || text.includes("στειρω")) {
    tags.push("sterilised", "weight_control");
  }
  if (text.includes("overweight") || text.includes("υπέρβαρ")) tags.push("weight_control");
  if (text.includes("small") || text.includes("μικρόσωμ")) tags.push("small_breed");
  if (text.includes("medium")) tags.push("medium_breed");
  if (text.includes("chicken") || text.includes("κοτόπουλ")) tags.push("chicken");
  if (text.includes("tuna") || text.includes("τόνο") || text.includes("cod") || text.includes("μπακαλιάρ")) {
    tags.push("fish");
  }
  if (text.includes("rice") || text.includes("ρύζι")) tags.push("rice");
  if (text.includes("corn") || text.includes("maize") || text.includes("αραβόσιτ")) tags.push("corn");
  if (text.includes("potato") || text.includes("πατάτα")) tags.push("potato");
  if (text.includes("pea") || text.includes("μπιζε")) tags.push("pea");
  if (text.includes("allerg")) tags.push("allergy");
  if (text.includes("digest")) tags.push("sensitive_digestion");
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
      /(?:Αναλυτικά\s+(?:συστατικά|στοιχεία)|Ingredients|Details)\s*:/iu,
      /(?:Σύνθεση|Composition|Nutritional supplements|Διατροφικά πρόσθετα)\s*:/iu,
    );
    const compositionText =
      extractInlineSection(
        blockText,
        /(?:Σύνθεση|Composition|Ingredients)\s*:/iu,
        /(?:Διατροφικά πρόσθετα|Nutritional supplements|\* Σου υπενθυμίζουμε|\* We remind)/iu,
      ) ||
      extractInlineSection(
        blockText,
        /Αναλυτικά\s+στοιχεία\s*:/iu,
        /(?:Διατροφικά πρόσθετα|\* Σου υπενθυμίζουμε)/iu,
      );

    if (!analysisText || !compositionText) continue;
    rawBlocks.push({
      formulaName: canonicalFormulaName(heading),
      heading,
      blockText,
      descriptionText: cleanText(blockParagraphs.slice(0, 4).join(" ")),
      analysisText,
      compositionText,
      additivesText: extractInlineSection(
        blockText,
        /(?:Διατροφικά πρόσθετα|Nutritional supplements)\s*:/iu,
        /(?:\* Σου υπενθυμίζουμε|\* We remind)/iu,
      ),
    });
  }

  const byKey = new Map();
  const duplicateCounts = new Map();
  for (const block of rawBlocks) {
    const key = slugify(`${block.formulaName}-${inferSpecies(block.blockText)}-${inferFormat(block.blockText)}`);
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
  const species = inferSpecies(block.blockText);
  const format = inferFormat(block.blockText);
  const ingredients = splitIngredients(block.compositionText);
  const commercialTags = tagsFor(block.formulaName, ingredients, block.blockText, species, format);

  return {
    brand: "Schesir",
    formula_name: block.formulaName,
    display_name: `Schesir ${block.formulaName}`,
    species,
    format,
    life_stage: inferLifeStage(block.formulaName, block.blockText),
    dog_size: inferDogSize(block.formulaName, block.blockText, species),
    breed_target: "",
    medical_tags: [
      commercialTags.includes("weight_control") ? "obesity" : "",
      commercialTags.includes("allergy") ? "allergy" : "",
      commercialTags.includes("sensitive_digestion") ? "gi_support" : "",
    ].filter(Boolean).join(";"),
    commercial_tags: commercialTags,
    ingredient_text: block.compositionText,
    ingredients: JSON.stringify(ingredients),
    primary_animal_proteins: ingredients.filter((item) => /(κοτόπουλ|chicken|τόνος|tuna|μπακαλιάρ|cod|ψάρι|fish)/iu.test(item)).join(";"),
    carbohydrate_sources: ingredients.filter((item) => /(ρύζι|rice|αραβόσιτ|maize|corn|κριθάρι|barley|πατάτα|potato|μπιζε|pea)/iu.test(item)).join(";"),
    fat_sources: ingredients.filter((item) => /(λίπη|ιχθυέλαιο|ηλιέλαιο|oil|fat|λιναρόσπορος)/iu.test(item)).join(";"),
    fiber_sources: ingredients.filter((item) => /(τεύτλων|ραδικιών|FOS|beet|radish|fructo|yucca|γιούκα)/iu.test(item)).join(";"),
    additives_text: block.additivesText,
    feeding_guide_text: "",
    kcal_per_100g: kcalPer100g(block.analysisText),
    kcal_per_kg: kcalPer100g(block.analysisText) ? String(Number(kcalPer100g(block.analysisText)) * 10) : "",
    protein_percent: percentAfter(block.analysisText, "(?:πρωτεΐνη|protein)"),
    fat_percent: percentAfter(block.analysisText, "(?:λιπαρές|fat)"),
    fiber_percent: percentAfter(block.analysisText, "(?:ινώδεις|fiber|fibrous)"),
    ash_percent: percentAfter(block.analysisText, "(?:τέφρα|ash)"),
    moisture_percent: percentAfter(block.analysisText, "(?:υγρασία|moisture|humidity)"),
    calcium_percent: percentAfter(block.analysisText, "(?:ασβέστιο|calcium)"),
    phosphorus_percent: percentAfter(block.analysisText, "(?:φώσφορος|phosphorus)"),
    sodium_percent: percentAfter(block.analysisText, "(?:νάτριο|sodium)"),
    magnesium_percent: percentAfter(block.analysisText, "(?:μαγνήσιο|magnesium)"),
    potassium_percent: percentAfter(block.analysisText, "(?:κάλιο|potassium)"),
    omega3_percent: percentAfter(block.analysisText, "(?:Ωμέγα-?3|Omega-?3|Ωμέγα-?2|Omega-?2)"),
    omega6_percent: percentAfter(block.analysisText, "(?:Ωμέγα-?6|Omega-?6)"),
    dha_percent: "",
    epa_percent: "",
    taurine_mgkg: mgAfter(block.additivesText, "(?:ταυρίνη|taurine)"),
    l_carnitine_mgkg: "",
    glucosamine_mgkg: mgAfter(block.compositionText, "(?:γλουκοζαμίνη|glucosamine)"),
    chondroitin_mgkg: "",
    vitamin_a_iukg: "",
    vitamin_d3_iukg: "",
    vitamin_e_mgkg: mgAfter(block.additivesText, "(?:Vit\\. E|βιταμίνες?\\. E|vitamins?\\. E)"),
    iron_mgkg: mgAfter(block.additivesText, "(?:Fe|σίδηρος|iron)"),
    zinc_mgkg: mgAfter(block.additivesText, "(?:Zn|ψευδάργυρος|zinc)"),
    copper_mgkg: mgAfter(block.additivesText, "(?:Cu|χαλκός|copper)"),
    manganese_mgkg: mgAfter(block.additivesText, "(?:Mn|μαγγάνιο|manganese)"),
    iodine_mgkg: mgAfter(block.additivesText, "(?:II|ιωδικό|iodide)"),
    selenium_mgkg: mgAfter(block.additivesText, "(?:Se|σεληνιώδες|selenium)"),
    data_quality_status: "needs_review",
    data_source_url: "",
    source_priority: "unknown",
    source_notes: [
      "market=GR",
      "basis=as-fed",
      "source_tier=uploaded_document",
      `source_document=${sourcePath.replace(/\\/g, "/")}`,
      "official_url_required=true",
      `duplicate_blocks_skipped=${block.duplicateCount}`,
      "Auto-extracted from Schesir Dry.odt; verify against official Schesir/Gheda source or label before import.",
    ].join("; "),
    formula_key: `schesir-${slugify(block.formulaName)}-${species}-${format}-gr-document`,
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
      "Attach official Schesir/Gheda URL or label photo, verify formula naming/format, then preview in Food V2 before commit.",
    notes: "Uploaded document has strong nutrient coverage; rows stay in review until official provenance is attached.",
  };
}

function renderReport(rows, rawBlockCount, duplicateCount, sourcePath) {
  const coverage = (field) => rows.filter((row) => row[field]).length;
  return `# Schesir Dry Document Extract

Generated: ${new Date().toISOString()}

## Summary

- Source document: ${sourcePath}
- Raw complete product blocks: ${rawBlockCount}
- Extracted formula-level rows: ${rows.length}
- Duplicate blocks skipped: ${duplicateCount}
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Coverage

- Ingredients: ${coverage("ingredient_text")}/${rows.length}
- Protein/fat/fiber: ${rows.filter((row) => row.protein_percent && row.fat_percent && row.fiber_percent).length}/${rows.length}
- Ash/moisture: ${rows.filter((row) => row.ash_percent && row.moisture_percent).length}/${rows.length}
- Calcium/phosphorus: ${rows.filter((row) => row.calcium_percent && row.phosphorus_percent).length}/${rows.length}
- Sodium/magnesium: ${rows.filter((row) => row.sodium_percent && row.magnesium_percent).length}/${rows.length}
- Omega 3 / Omega 6: ${rows.filter((row) => row.omega3_percent && row.omega6_percent).length}/${rows.length}
- Kcal/ME: ${coverage("kcal_per_100g")}/${rows.length}
- Official URL: 0/${rows.length}

## Import Decision

All rows are marked needs_review. The uploaded document includes calories and broad nutrient coverage, but official URLs still need review/backfill.

## Extracted Formulas

${rows.map((row) => `- ${row.display_name} (${row.species}, ${row.format})`).join("\n")}
`;
}

async function main() {
  const sourcePath = process.argv[2] ?? defaultDocumentPath;
  const templateText = await readFile(paths.template, "utf8");
  const headers = parseCsvLine(templateText.split(/\r?\n/)[0] ?? "");
  const documentXml = unzipEntry(await readFile(sourcePath), "content.xml");
  const paragraphs = paragraphsFromOdtXml(documentXml);
  const { blocks, rawBlockCount, duplicateCount } = extractBlocks(paragraphs);
  const rows = blocks.map((block) => rowFromBlock(block, sourcePath));

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.review), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(headers, rows), "utf8");
  await writeFile(paths.review, writeCsv(reviewHeaders, rows.map(reviewRow)), "utf8");
  await writeFile(paths.report, renderReport(rows, rawBlockCount, duplicateCount, sourcePath), "utf8");

  console.log(`Schesir document rows: ${rows.length}`);
  console.log(`Raw complete product blocks: ${rawBlockCount}`);
  console.log(`Duplicate blocks skipped: ${duplicateCount}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
