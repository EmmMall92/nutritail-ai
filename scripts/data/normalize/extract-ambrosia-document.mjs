import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const defaultDocumentPath = "C:/Users/NIOstb/Desktop/photo_foods_nutritail/ambrosia text.odt";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/ambrosia_document_extract_v2.csv",
  review: "data/review/ambrosia_document_extract_review.csv",
  report: "reports/ambrosia_document_extract.md",
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

function formulaNameFromHeading(heading) {
  return titleCase(
    cleanText(heading)
      .replace(/^AMBROSIA\s+/iu, "")
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

function numberValue(value) {
  const match = String(value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!match) return "";
  return String(Number(match[0]));
}

function percentNear(text, keywords) {
  for (const keyword of keywords) {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${escapedKeyword}[^0-9]{0,50}(\\d+(?:[,.]\\d+)?)\\s*%`, "iu"));
    const value = numberValue(match?.[1] ?? "");
    if (value) return value;
  }
  return "";
}

function kcalPerKg(text) {
  const match = text.match(
    /(?:\u03b5\u03bd\u03ad\u03c1\u03b3\u03b5\u03b9\u03b1|\u03bc\u03b5\u03c4\u03b1\u03b2\u03bf\u03bb\u03b9\u03c3\u03c4\u03ad\u03b1|\u03bc\u03b5\u03c4\u03b1\u03b2\u03bf\u03bb\u03af\u03c3\u03b9\u03bc\u03b7|metabolic|metabolizable|energy)[^0-9]{0,40}(\d+(?:[,.]\d+)?)\s*kcal\s*\/?\s*kg/iu,
  );
  return numberValue(match?.[1] ?? "");
}

function exactPercent(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = numberValue(match?.[1] ?? "");
    if (value) return value;
  }
  return "";
}

function proteinPercent(text) {
  return exactPercent(text, [
    /\u03c0\u03c1\u03c9\u03c4\u03b5[^\d]{0,30}(\d+(?:[,.]\d+)?)\s*%/iu,
    /\u03c0\u03c1\u03c9.?0?\u03c4\u03b5[^\d]{0,30}(\d+(?:[,.]\d+)?)\s*%/iu,
    /\u03b1\u03b6\u03c9\u03c4[^\d]{0,50}(\d+(?:[,.]\d+)?)\s*%/iu,
    /(?:total\s+)?protein[^\d]{0,30}(\d+(?:[,.]\d+)?)\s*%/iu,
  ]);
}

function fatPercent(text) {
  return exactPercent(text, [
    /\u03b1\u03ba\u03b1\u03c4\u03ad\u03c1\u03b3\u03b1\u03c3\u03c4\u03bf\s+\u03bb[^\d]{0,25}(\d+(?:[,.]\d+)?)\s*%/iu,
    /(?:^|[,.;]\s*)\u03bb\u03af\u03c0\u03bf\u03c2[^\d]{0,20}(\d+(?:[,.]\d+)?)\s*%/iu,
    /(?:^|[,.;]\s*)\u03bb\u03b9\u03c0\u03b1\u03c1[^\d]{0,20}(\d+(?:[,.]\d+)?)\s*%/iu,
    /\u03bf\u03bb\u03b9\u03ba[^\d]{0,30}\u03bb\u03b9\u03c0\u03b1\u03c1[^\d]{0,30}(\d+(?:[,.]\d+)?)\s*%/iu,
    /(?:^|[,.;]\s*)(?:total\s+)?fats?[^\d]{0,20}(\d+(?:[,.]\d+)?)\s*%/iu,
  ]);
}

function fiberPercent(text) {
  return exactPercent(text, [
    /\u03af\u03bd\u03b5\u03c2[^\d]{0,20}(\d+(?:[,.]\d+)?)\s*%/iu,
    /\u03b9\u03bd[^\d]{0,30}(\d+(?:[,.]\d+)?)\s*%/iu,
    /(?:fibers?|fibres?|fibrous\s+substances)[^\d]{0,30}(\d+(?:[,.]\d+)?)\s*%/iu,
  ]);
}

function mgKgFor(text, labels) {
  for (const label of labels) {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${escapedLabel}[\\s\\S]{0,30}?(\\d+(?:[,.]\\d+)?)\\s*mg\\s*\\/?\\s*kg`, "iu"));
    const value = numberValue(match?.[1] ?? "");
    if (value) return value;
  }
  return "";
}

function isHeading(value) {
  const text = cleanText(value);
  if (!text.startsWith("AMBROSIA ")) return false;
  return text.length < 90;
}

function isCompositionLabel(value) {
  const text = cleanText(value).replace(/:$/, "").toLowerCase();
  return text.startsWith("\u03c3\u03cd\u03bd\u03b8\u03b5\u03c3\u03b7:") ||
    text.startsWith("\u03c3\u03c5\u03c3\u03c4\u03b1\u03c4\u03b9\u03ba\u03ac:") ||
    text.startsWith("composition:") ||
    text.startsWith("ingredients:") ||
    text.includes("\u03c3\u03cd\u03bd\u03b8\u03b5\u03c3\u03b7:") ||
    text.includes("\u03c3\u03c5\u03c3\u03c4\u03b1\u03c4\u03b9\u03ba\u03ac:") ||
    text.includes("composition:") ||
    text.includes("ingredients:") ||
    [
    "\u03c3\u03cd\u03bd\u03b8\u03b5\u03c3\u03b7",
    "\u03c3\u03c5\u03c3\u03c4\u03b1\u03c4\u03b9\u03ba\u03ac",
  ].includes(text);
}

function isAnalysisLabel(value) {
  const text = cleanText(value).replace(/:$/, "").toLowerCase();
  return (
    text.includes("\u03b1\u03bd\u03ac\u03bb\u03c5\u03c3\u03b7") ||
    text.includes("\u03b1\u03bd\u03b1\u03bb\u03c5\u03c4\u03b9\u03ba") ||
    text.includes("chemical analysis") ||
    text.includes("detailed analysis") ||
    text.includes("analysis:") ||
    text === "analysis"
  );
}

function hasGreekText(value) {
  return /[\u0370-\u03ff]/u.test(value);
}

function shouldSkipHeading(paragraphs, startIndex) {
  const heading = cleanText(paragraphs[startIndex]);
  const next = cleanText(paragraphs[startIndex + 1] ?? "");
  return !hasGreekText(heading) && !hasGreekText(next);
}

function sectionParagraphs(paragraphs, startIndex) {
  const nextHeadingIndex = paragraphs.findIndex(
    (paragraph, index) => index > startIndex && isHeading(paragraph),
  );
  return paragraphs.slice(startIndex + 1, nextHeadingIndex === -1 ? paragraphs.length : nextHeadingIndex);
}

function sectionLabelPattern(sectionType) {
  if (sectionType === "composition") {
    return /(?:\u03a3\u03cd\u03bd\u03b8\u03b5\u03c3\u03b7|\u03a3\u03c5\u03c3\u03c4\u03b1\u03c4\u03b9\u03ba\u03ac|Composition|Ingredients)\s*:/iu;
  }
  return /(?:\u0391\u03bd\u03ac\u03bb\u03c5\u03c3\u03b7|\u0391\u03bd\u03b1\u03bb\u03c5\u03c4\u03b9\u03ba\u03ac\s+\u03c3\u03c5\u03c3\u03c4\u03b1\u03c4\u03b9\u03ba\u03ac|Chemical\s+Analysis|Detailed\s+Analysis|Analysis)\s*:/iu;
}

function trimInlineSection(text, sectionType) {
  const stopPattern =
    sectionType === "composition"
      ? /(?:\u0391\u03bd\u03ac\u03bb\u03c5\u03c3\u03b7|\u0391\u03bd\u03b1\u03bb\u03c5\u03c4\u03b9\u03ba\u03ac\s+\u03c3\u03c5\u03c3\u03c4\u03b1\u03c4\u03b9\u03ba\u03ac|Chemical\s+Analysis|Detailed\s+Analysis|Analysis)\s*:/iu
      : /(?:\u03a0\u03a1\u039f\u03a3\u0398\u0395\u03a4\u0399\u039a\u0391|ADDITIVES|\u0392\u0399\u03a4\u0391\u039c\u0399\u039d\u0395\u03a3|Additives\s+per)/iu;
  const stopMatch = text.match(stopPattern);
  return cleanText(stopMatch ? text.slice(0, stopMatch.index) : text);
}

function readSection(blockParagraphs, labelPredicate, sectionType) {
  const labelIndex = blockParagraphs.findIndex((paragraph) => labelPredicate(paragraph));
  if (labelIndex === -1) return "";

  const pieces = [];
  const labelParagraph = cleanText(blockParagraphs[labelIndex]);
  const labelMatch = labelParagraph.match(sectionLabelPattern(sectionType));
  if (labelMatch?.index != null) {
    const inlineValue = trimInlineSection(
      labelParagraph.slice(labelMatch.index + labelMatch[0].length),
      sectionType,
    );
    if (inlineValue) pieces.push(inlineValue);
  }

  for (let index = labelIndex + 1; index < blockParagraphs.length; index += 1) {
    const paragraph = cleanText(blockParagraphs[index]);
    if (isHeading(paragraph) || isCompositionLabel(paragraph) || isAnalysisLabel(paragraph)) break;
    if (/^(?:\u03a0\u03a1\u039f\u03a3\u0398\u0395\u03a4\u0399\u039a\u0391|ADDITIVES|\u0392\u0399\u03a4\u0391\u039c\u0399\u039d\u0395\u03a3|Complete holistic|ambrosia,|Meet all|Recommended by veterinarians|Ingredients:|Composition:|Analysis:|Chemical Analysis:)/iu.test(paragraph)) break;
    if (paragraph === ":") continue;
    pieces.push(paragraph.replace(/^:\s*/, ""));
  }

  return cleanText(pieces.join(" "));
}

function extractBlocks(paragraphs) {
  const rawBlocks = [];
  for (let index = 0; index < paragraphs.length; index += 1) {
    const heading = cleanText(paragraphs[index]);
    if (!isHeading(heading)) continue;
    if (shouldSkipHeading(paragraphs, index)) continue;
    const blockParagraphs = sectionParagraphs(paragraphs, index);
    const ingredientText = readSection(blockParagraphs, isCompositionLabel, "composition");
    const analysisText = readSection(blockParagraphs, isAnalysisLabel, "analysis");
    if (!ingredientText || !analysisText) continue;

    rawBlocks.push({
      formulaName: formulaNameFromHeading(heading),
      heading,
      ingredientText,
      analysisText,
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

function inferLifeStage(text) {
  const value = text.toLowerCase();
  if (value.includes("puppy") || value.includes("growth") || value.includes("κουταβ")) return "puppy";
  if (value.includes("senior")) return "senior";
  return "adult";
}

function inferDogSize(text) {
  const value = text.toLowerCase();
  if (value.includes("large") || value.includes("μεγαλοσωμ")) return "large";
  if (value.includes("mini") || value.includes("small") || value.includes("μικροσωμ")) return "small";
  return "all";
}

function tagsFor(formulaName, ingredients) {
  const text = `${formulaName} ${ingredients.join(" ")}`.toLowerCase();
  const tags = ["dog", "dry", "grain_free", "hypoallergenic"];
  if (text.includes("puppy") || text.includes("growth") || text.includes("κουταβ")) tags.push("puppy");
  if (text.includes("senior")) tags.push("senior");
  if (text.includes("sterilized") || text.includes("στειρω")) tags.push("sterilised", "weight_control");
  if (text.includes("large") || text.includes("μεγαλοσωμ")) tags.push("large_breed");
  if (text.includes("mini") || text.includes("small") || text.includes("μικροσωμ")) tags.push("small_breed");
  if (text.includes("κοτόπουλ") || text.includes("chicken")) tags.push("chicken");
  if (text.includes("γαλοπούλ") || text.includes("turkey")) tags.push("turkey");
  if (text.includes("σολομ") || text.includes("πέστροφα") || text.includes("ψάρ") || text.includes("σκουμπρ") || text.includes("fish")) tags.push("fish");
  if (text.includes("πάπια") || text.includes("duck")) tags.push("duck");
  if (text.includes("ελάφι") || text.includes("venison")) tags.push("venison");
  if (text.includes("βουβάλι") || text.includes("buffalo")) tags.push("buffalo");
  if (text.includes("αρν") || text.includes("lamb")) tags.push("lamb");
  if (text.includes("πατάτα") || text.includes("potato")) tags.push("potato");
  if (text.includes("αρακά")) tags.push("pea");
  return [...new Set(tags)].join(";");
}

function rowFromBlock(block, sourcePath) {
  const ingredients = splitIngredients(block.ingredientText);
  const kcalKg = kcalPerKg(block.analysisText);

  return {
    brand: "Ambrosia",
    formula_name: block.formulaName,
    display_name: `Ambrosia ${block.formulaName}`,
    species: "dog",
    format: "dry",
    life_stage: inferLifeStage(block.formulaName),
    dog_size: inferDogSize(block.formulaName),
    breed_target: "",
    medical_tags: tagsFor(block.formulaName, ingredients).includes("weight_control") ? "obesity" : "",
    commercial_tags: tagsFor(block.formulaName, ingredients),
    ingredient_text: block.ingredientText,
    ingredients: JSON.stringify(ingredients),
    primary_animal_proteins: ingredients.filter((item) => /(κοτόπουλ|γαλοπούλ|σολομ|ψάρ|πέστροφα|πάπια|ελάφι|βουβάλι|αρν|σκουμπρ|chicken|turkey|fish|duck|venison|lamb)/iu.test(item)).join(";"),
    carbohydrate_sources: ingredients.filter((item) => /(πατάτα|αρακά|κουκιά|potato|peas?)/iu.test(item)).join(";"),
    fat_sources: ingredients.filter((item) => /(λίπος|λάδι|έλαιο|λιναρόσπορος|fat|oil)/iu.test(item)).join(";"),
    fiber_sources: ingredients.filter((item) => /(τεύτλ|πικραλίδα|κιχωρίου|FOS|MOS|beet|chicory)/iu.test(item)).join(";"),
    additives_text: "",
    feeding_guide_text: "",
    kcal_per_100g: kcalKg ? String(Math.round((Number(kcalKg) / 10) * 10) / 10) : "",
    kcal_per_kg: kcalKg,
    protein_percent: proteinPercent(block.analysisText),
    fat_percent: fatPercent(block.analysisText),
    fiber_percent: fiberPercent(block.analysisText),
    ash_percent: percentNear(block.analysisText, [
      "\u03c4\u03ad\u03c6\u03c1\u03b1",
      "\u03b1\u03bd\u03cc\u03c1\u03b3\u03b1\u03bd",
      "ash",
      "minerals",
    ]),
    moisture_percent: percentNear(block.analysisText, ["\u03c5\u03b3\u03c1\u03b1\u03c3\u03af\u03b1", "moisture"]),
    calcium_percent: percentNear(block.analysisText, ["\u03b1\u03c3\u03b2\u03ad\u03c3\u03c4\u03b9\u03bf", "calcium", "\\bCa\\b"]),
    phosphorus_percent: percentNear(block.analysisText, ["\u03c6\u03ce\u03c3\u03c6\u03bf\u03c1\u03bf\u03c2", "phosphorus", "\\bP\\b"]),
    sodium_percent: "",
    magnesium_percent: "",
    potassium_percent: "",
    omega3_percent: percentNear(block.analysisText, ["\u03a9\u03bc\u03ad\u03b3\u03b1-3", "\u03a93", "omega-3"]),
    omega6_percent: percentNear(block.analysisText, ["\u03a9\u03bc\u03ad\u03b3\u03b1-6", "\u03a96", "omega-6"]),
    dha_percent: "",
    epa_percent: "",
    taurine_mgkg: "",
    l_carnitine_mgkg: mgKgFor(block.ingredientText, ["L-Carnitine", "L-Καρνιτίνη"]),
    glucosamine_mgkg: mgKgFor(block.ingredientText, ["Γλυκοζαμίνη", "Glucosamine"]),
    chondroitin_mgkg: mgKgFor(block.ingredientText, ["Χονδροϊτίνη", "Chondroitin"]),
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
      "sodium_magnesium_backfill_required=true",
      `duplicate_blocks_skipped=${block.duplicateCount}`,
      "Auto-extracted from ambrosia text.odt; verify against official Ambrosia source or label before import.",
    ].join("; "),
    formula_key: `ambrosia-${slugify(block.formulaName)}-dog-dry-gr-document`,
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
      "Attach official Ambrosia URL, verify kcal/nutrients against official page or label, backfill sodium/magnesium if available, then preview in Food V2 before commit.",
    notes: "Document extraction includes formula-level dedupe and strong nutrition coverage, but rows stay in review until source provenance is linked.",
  };
}

function renderReport(rows, rawBlockCount, duplicateCount, sourcePath) {
  const coverage = (field) => rows.filter((row) => row[field]).length;
  return `# Ambrosia Document Extract

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
- Omega 3 / Omega 6: ${rows.filter((row) => row.omega3_percent && row.omega6_percent).length}/${rows.length}
- Kcal/ME: ${coverage("kcal_per_kg")}/${rows.length}
- Sodium/magnesium: 0/${rows.length}
- Official URL: 0/${rows.length}

## Import Decision

All rows are marked needs_review. The document has useful composition and analytical data, but official URLs and sodium/magnesium still need review/backfill.

## Extracted Formulas

${rows.map((row) => `- ${row.display_name}`).join("\n")}
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

  console.log(`Ambrosia document rows: ${rows.length}`);
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
