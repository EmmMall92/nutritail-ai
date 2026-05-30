import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const defaultDocumentPath = "C:/Users/NIOstb/Desktop/photo_foods_nutritail/ACANA.docx";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/acana_document_extract_v2.csv",
  review: "data/review/acana_document_extract_review.csv",
  report: "reports/acana_document_extract.md",
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

function formulaNameFromHeading(heading) {
  return cleanText(heading)
    .replace(/^\d+\)\s*/u, "")
    .replace(/^ACANA\s+/iu, "")
    .replace(/\bCAT\b/iu, "")
    .replace(/\b\d+(?:[.,]\d+)?\s*KG\b/giu, "")
    .replace(/\s*\/\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function extractSection(text, labels) {
  const labelPattern = labels.join("|");
  const match = text.match(new RegExp(`^(?:${labelPattern})\\s*:?\\s*(.+)$`, "iu"));
  return cleanText(match?.[1] ?? "");
}

function numberValue(value) {
  const match = String(value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!match) return "";
  return String(Number(match[0]));
}

function percentFor(text, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`${escapedLabel}\\s*(\\d+(?:[,.]\\d+)?)\\s*%`, "iu"));
  return numberValue(match?.[1] ?? "");
}

function taurineMgKg(text) {
  const taurinePercent = percentFor(text, "Ταυρίνη");
  if (!taurinePercent) return "";
  return String(Math.round(Number(taurinePercent) * 10000));
}

function combinedEpaDhaNote(text) {
  const match = text.match(/EPA-DHA\s*([0-9]+(?:[,.][0-9]+)?%?(?:\s*-\s*[0-9]+(?:[,.][0-9]+)?%?)?)/iu);
  return match ? `epa_dha_label=${cleanText(match[1])}` : "";
}

function detectTerms(ingredients, terms) {
  return ingredients.filter((ingredient) =>
    terms.some((term) => ingredient.toLowerCase().includes(term.toLowerCase()))
  );
}

function commercialTagsFor(formulaName, ingredients) {
  const text = `${formulaName} ${ingredients.join(" ")}`.toLowerCase();
  const tags = ["cat", "dry", "grain_free", "all_life_stages"];

  if (text.includes("κοτόπουλ")) tags.push("chicken");
  if (text.includes("πάπια")) tags.push("duck");
  if (text.includes("αρν")) tags.push("lamb");
  if (text.includes("ρέγκα") || text.includes("ψάρ") || text.includes("μπακαλιάρ") || text.includes("σαρδέλα")) {
    tags.push("fish");
  }
  if (text.includes("αρακά")) tags.push("pea");

  return [...new Set(tags)].join(";");
}

function rowFromBlock(block, sourcePath) {
  const ingredients = splitIngredients(block.ingredientText);
  const formulaKey = `acana-${slugify(block.formulaName)}-cat-dry-gr-document`;
  const epaDha = combinedEpaDhaNote(block.analysisText);

  return {
    brand: "ACANA",
    formula_name: block.formulaName,
    display_name: `ACANA ${block.formulaName}`,
    species: "cat",
    format: "dry",
    life_stage: "all_life_stages",
    dog_size: "all",
    breed_target: "",
    medical_tags: "",
    commercial_tags: commercialTagsFor(block.formulaName, ingredients),
    ingredient_text: block.ingredientText,
    ingredients: JSON.stringify(ingredients),
    primary_animal_proteins: detectTerms(ingredients, [
      "κοτόπουλ",
      "γαλοπούλ",
      "πάπια",
      "αρν",
      "ρέγκα",
      "βοδιν",
      "χοιριν",
      "βίσω",
      "μπακαλιάρ",
      "σαρδέλα",
      "καλκάνι",
      "πέρκα",
      "πέστροφα",
      "αυγά",
    ]).join(";"),
    carbohydrate_sources: detectTerms(ingredients, ["αρακά", "φακές", "ρεβίθια", "φασόλια"]).join(";"),
    fat_sources: detectTerms(ingredients, ["λίπος", "έλαιο", "ηλιέλαιο"]).join(";"),
    fiber_sources: detectTerms(ingredients, ["κολοκύθα", "φύκια", "δαυκία", "σπανάκι", "άλφα-άλφα"]).join(";"),
    additives_text: "",
    feeding_guide_text: "",
    kcal_per_100g: "",
    kcal_per_kg: "",
    protein_percent: percentFor(block.analysisText, "Πρωτεΐνη"),
    fat_percent: percentFor(block.analysisText, "Λιπαρά"),
    fiber_percent: percentFor(block.analysisText, "Φυτικές ίνες"),
    ash_percent: percentFor(block.analysisText, "Τέφρα"),
    moisture_percent: percentFor(block.analysisText, "Υγρασία"),
    calcium_percent: percentFor(block.analysisText, "Ασβέστιο"),
    phosphorus_percent: percentFor(block.analysisText, "Φώσφορος"),
    sodium_percent: percentFor(block.analysisText, "Νάτριο"),
    magnesium_percent: percentFor(block.analysisText, "Μαγνήσιο"),
    potassium_percent: percentFor(block.analysisText, "Κάλιο"),
    omega3_percent: percentFor(block.analysisText, "Ω3"),
    omega6_percent: percentFor(block.analysisText, "Ω6"),
    dha_percent: "",
    epa_percent: "",
    taurine_mgkg: taurineMgKg(block.analysisText),
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
      epaDha,
      "Auto-extracted from ACANA.docx; verify against official ACANA source or label before import.",
    ]
      .filter(Boolean)
      .join("; "),
    formula_key: formulaKey,
    ean: "",
  };
}

function extractBlocks(paragraphs) {
  const blocks = [];

  for (let index = 0; index < paragraphs.length; index += 1) {
    const heading = paragraphs[index];
    if (!/^\d+\)\s*ACANA\b/iu.test(heading)) continue;

    const formulaName = formulaNameFromHeading(heading);
    const description = paragraphs[index + 1] ?? "";
    const ingredientParagraph = paragraphs.slice(index + 1, index + 8).find((item) => /^Σύνθεση\s*:/iu.test(item));
    const analysisParagraph = paragraphs
      .slice(index + 1, index + 8)
      .find((item) => /^Αναλυτικά συστατικά\s*:/iu.test(item));

    if (!formulaName || !ingredientParagraph || !analysisParagraph) continue;

    blocks.push({
      formulaName,
      description,
      ingredientText: extractSection(ingredientParagraph, ["Σύνθεση"]),
      analysisText: extractSection(analysisParagraph, ["Αναλυτικά συστατικά"]),
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

function reviewRow(row) {
  return {
    formula_key: row.formula_key,
    brand: row.brand,
    formula_name: row.formula_name,
    species: row.species,
    status: "needs_review",
    missing_fields: "kcal_per_100g_or_kcal_per_kg|data_source_url_or_official_evidence",
    evidence_path: row.source_notes.match(/source_document=([^;]+)/)?.[1] ?? "",
    recommended_action:
      "Add official ACANA URL or label evidence, backfill kcal/ME, then preview in Food V2 before commit.",
    notes:
      "Document extraction includes ingredients and analytical constituents. Row is intentionally held from production until calories and source provenance are verified.",
  };
}

function renderReport(rows, duplicates, sourcePath) {
  const nutrientCoverage = (field) => rows.filter((row) => row[field]).length;

  return `# ACANA Document Extract

Generated: ${new Date().toISOString()}

## Summary

- Source document: ${sourcePath}
- Extracted unique rows: ${rows.length}
- Duplicate formula blocks skipped: ${duplicates.length}
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Coverage

- Ingredients: ${nutrientCoverage("ingredient_text")}/${rows.length}
- Protein/fat/fiber: ${rows.filter((row) => row.protein_percent && row.fat_percent && row.fiber_percent).length}/${rows.length}
- Ash/moisture: ${rows.filter((row) => row.ash_percent && row.moisture_percent).length}/${rows.length}
- Calcium/phosphorus: ${rows.filter((row) => row.calcium_percent && row.phosphorus_percent).length}/${rows.length}
- Sodium/magnesium/potassium: ${rows.filter((row) => row.sodium_percent && row.magnesium_percent && row.potassium_percent).length}/${rows.length}
- Omega 3 / Omega 6: ${rows.filter((row) => row.omega3_percent && row.omega6_percent).length}/${rows.length}
- Kcal/ME: 0/${rows.length}
- Official URL: 0/${rows.length}

## Import Decision

All rows are marked needs_review. The document gives strong nutrition and ingredient coverage, but calories and official URLs are missing, so these rows should stay in review until kcal/ME and source provenance are verified.

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

  console.log(`ACANA document rows: ${rows.length}`);
  console.log(`Duplicate formula blocks skipped: ${duplicates.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
