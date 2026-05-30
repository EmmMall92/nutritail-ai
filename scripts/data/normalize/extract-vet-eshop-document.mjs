import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const defaultDocumentPath = "C:/Users/NIOstb/Desktop/photo_foods_nutritail/Περιγραφές Vet Eshop.docx";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/vet_eshop_document_extract_v2.csv",
  review: "data/review/vet_eshop_document_extract_review.csv",
  report: "reports/vet_eshop_document_extract.md",
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
  if (!/^\d{6}/.test(text) || text.length > 140) return false;
  return /(ΞΗΡΑ|ΚΟΝ|POUCH|ROYAL CAT POUCH|ROYAL DOG POUCH)/iu.test(text);
}

function sectionParagraphs(paragraphs, startIndex) {
  const nextHeadingIndex = paragraphs.findIndex(
    (paragraph, index) => index > startIndex && isHeading(paragraph),
  );
  return paragraphs.slice(startIndex + 1, nextHeadingIndex === -1 ? paragraphs.length : nextHeadingIndex);
}

function sourceCodeFromHeading(heading) {
  return heading.match(/^(\d{6})/)?.[1] ?? "";
}

function rawNameFromHeading(heading) {
  return cleanText(
    heading
      .replace(/^\d{6}/, "")
      .replace(/^(?:ΞΗΡΑ|ΚΟΝ)\.(?:ΣΚ|Γ|ΓΑΤ)\.?\s*/iu, "")
      .replace(/^ROYAL\s+(?:CAT|DOG)\s+POUCH\s+/iu, "ROYAL ")
      .replace(/\b\d+(?:[,.]\d+)?\s*(?:kg|k|gr|g)\b/giu, "")
      .replace(/,\s*10%/gu, "")
      .replace(/\s+/g, " "),
  );
}

function brandFromName(name) {
  const value = name.toLowerCase();
  if (value.includes("hills") || value.includes("hill's")) return "Hill's";
  if (value.includes("pro,vet") || value.includes("pro-vet")) return "Pro-Vet";
  if (value.includes("ppvd") || value.includes("proplan") || value.includes("pro plan")) return "Purina Pro Plan Veterinary Diets";
  if (value.includes("dr.clauder")) return "Dr. Clauder's";
  if (value.includes("integra") || value.includes("animonda")) return "Animonda Integra";
  if (value.includes("beaphar")) return "Beaphar";
  return "Royal Canin";
}

function formulaNameFromRaw(rawName, brand) {
  let name = rawName
    .replace(/^ROYAL\s+/iu, "")
    .replace(/^VHN\s+/iu, "")
    .replace(/^VDIET\s+/iu, "")
    .replace(/^HILLS\s+PD\s+/iu, "Prescription Diet ")
    .replace(/^Hill's\s+PD\s+/iu, "Prescription Diet ")
    .replace(/^PRO,VET\s+/iu, "")
    .replace(/^PRO-VET\s+/iu, "")
    .replace(/^PPVD\s+/iu, "")
    .replace(/^Dr\.Clauder's\s+/iu, "")
    .trim();

  if (brand === "Royal Canin") name = `Veterinary ${name}`;
  if (brand === "Pro-Vet") name = `Pro-Vet ${name}`;
  if (brand === "Purina Pro Plan Veterinary Diets") name = `Pro Plan Veterinary Diets ${name}`;
  if (brand === "Hill's") name = `Hill's ${name}`;
  if (brand === "Dr. Clauder's") name = `Dr. Clauder's ${name}`;
  if (brand === "Animonda Integra") name = `Animonda Integra ${name}`;
  if (brand === "Beaphar") name = `Beaphar ${name}`;
  return cleanText(name);
}

function inferSpecies(heading, rawName) {
  const text = `${heading} ${rawName}`.toLowerCase();
  if (text.includes("cat") || text.includes("feline") || text.includes("ΞΗΡΑ.Γ".toLowerCase()) || text.includes(" γ ")) {
    return "cat";
  }
  if (text.includes("dog") || text.includes("canine") || text.includes("σκ")) return "dog";
  return "dog";
}

function inferFormat(heading) {
  const text = heading.toLowerCase();
  if (text.includes("κον") || text.includes("pouch") || text.includes("can ") || text.includes("mousse")) return "wet";
  return "dry";
}

function inferLifeStage(name, text, species) {
  const value = `${name} ${text}`.toLowerCase();
  if (value.includes("puppy")) return "puppy";
  if (value.includes("kitten")) return "kitten";
  if (species === "cat" && value.includes("γάτακια")) return "kitten";
  return "adult";
}

function inferDogSize(name, species) {
  if (species !== "dog") return "";
  const value = name.toLowerCase();
  if (value.includes("small") || value.includes("mini")) return "small";
  return "all";
}

function extractInlineSection(text, labelPattern, stopPattern) {
  const match = text.match(labelPattern);
  if (match?.index == null) return "";
  const value = text.slice(match.index + match[0].length);
  const stop = value.match(stopPattern);
  return cleanText(stop?.index != null ? value.slice(0, stop.index) : value);
}

function compositionText(blockText) {
  return extractInlineSection(
    blockText,
    /(?:Σύνθεση|Συνθεση)\s*:/iu,
    /(?:Αναλυτικά\s+(?:Συστατικά|συστατικά)|Ανάλυση|Πρόσθε|Θρεπτικές|Διατροφικές|Βλέπε|$)/iu,
  );
}

function analysisText(blockText) {
  const detailed = extractInlineSection(blockText, /Ανάλυση\s*:/iu, /(?:Σύνθεση|Πρόσθε|Βλέπε|$)/iu);
  const analytical = extractInlineSection(
    blockText,
    /Αναλυτικά\s+(?:Συστατικά|συστατικά)\s*:/iu,
    /(?:Σύνθεση|Συνθεση|Πρόσθε|Θρεπτικές|Διατροφικές|Βλέπε|$)/iu,
  );
  return cleanText(`${analytical} ${detailed}`);
}

function percentValue(text, labels) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`${escaped}\\s*:?\\s*(\\d+(?:[,.]\\d+)?)\\s*%`, "iu"),
      new RegExp(`${escaped}\\s*\\(\\s*%\\s*\\)\\s*(\\d+(?:[,.]\\d+)?)`, "iu"),
    ];
    for (const pattern of patterns) {
      const value = numberValue(text.match(pattern)?.[1] ?? "");
      if (value) return value;
    }
  }
  return "";
}

function gKgToPercent(text, labels) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${escaped}\\s*:?\\s*(\\d+(?:[,.]\\d+)?)\\s*g`, "iu"));
    const value = numberValue(match?.[1] ?? "");
    if (value) return String(Math.round((Number(value) / 10) * 1000) / 1000);
  }
  return "";
}

function mgKgValue(text, labels) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${escaped}[^0-9]{0,30}(\\d+(?:[,.]\\d+)?)\\s*mg`, "iu"));
    const value = numberValue(match?.[1] ?? "");
    if (value) return value;
  }
  return "";
}

function kcalPerKg(text) {
  const match =
    text.match(/(\d+(?:[,.]\d+)?)\s*kcal\s*\/?\s*kg/iu) ??
    text.match(/(?:Μεταβολιστέα ενέργεια|Ενεργειακή αξία|energy)[\s\S]{0,140}?\(kcal\/kg\)\s*(\d+(?:[,.]\d+)?)/iu) ??
    text.match(/(?:Μεταβολιστέα ενέργεια|Ενεργειακή αξία|energy)[^0-9]{0,80}(\d+(?:[,.]\d+)?)\s*kcal/iu);
  return numberValue(match?.[1] ?? "");
}

function tagsFor(name, description, ingredients, species, format) {
  const text = `${name} ${description} ${ingredients.join(" ")}`.toLowerCase();
  const tags = [species, format, "veterinary"];
  if (text.includes("urinary") || text.includes("struvite") || text.includes("ουρο")) tags.push("urinary");
  if (text.includes("renal") || text.includes("kidney") || text.includes("νεφρ")) tags.push("renal");
  if (text.includes("gastro") || text.includes("intestinal") || text.includes("digestive") || text.includes("διάρροια")) tags.push("sensitive_digestion");
  if (text.includes("hypoallergenic") || text.includes("anallergenic") || text.includes("sensitivity") || text.includes("allerg")) tags.push("allergy");
  if (text.includes("satiety") || text.includes("weight") || text.includes("obesity") || text.includes("metabolic")) tags.push("weight_control");
  if (text.includes("diabetic") || text.includes("diabetes")) tags.push("diabetes");
  if (text.includes("hepatic") || text.includes("liver")) tags.push("hepatic");
  if (text.includes("cardiac")) tags.push("cardiac");
  if (text.includes("mobility") || text.includes("joint")) tags.push("joint_support");
  if (text.includes("skin") || text.includes("derm")) tags.push("skin_coat");
  if (text.includes("puppy")) tags.push("puppy");
  if (text.includes("kitten")) tags.push("kitten");
  if (text.includes("duck") || text.includes("πάπια")) tags.push("duck");
  if (text.includes("chicken") || text.includes("κοτόπουλ")) tags.push("chicken");
  if (text.includes("salmon") || text.includes("σολομ")) tags.push("salmon", "fish");
  if (text.includes("rice") || text.includes("ρύζι")) tags.push("rice");
  if (text.includes("corn") || text.includes("καλαμπόκι") || text.includes("αραβόσιτ")) tags.push("corn");
  if (text.includes("tapioca") || text.includes("ταπιόκα")) tags.push("tapioca");
  return [...new Set(tags)].join(";");
}

function medicalTags(commercialTags) {
  const tags = [];
  if (commercialTags.includes("renal")) tags.push("renal");
  if (commercialTags.includes("urinary")) tags.push("urinary");
  if (commercialTags.includes("allergy")) tags.push("allergy");
  if (commercialTags.includes("sensitive_digestion")) tags.push("gi_support");
  if (commercialTags.includes("weight_control")) tags.push("obesity");
  if (commercialTags.includes("diabetes")) tags.push("diabetes");
  if (commercialTags.includes("hepatic")) tags.push("hepatic");
  return [...new Set(tags)].join(";");
}

function rowCompleteness(row) {
  return [
    "ingredient_text",
    "protein_percent",
    "fat_percent",
    "fiber_percent",
    "ash_percent",
    "kcal_per_kg",
    "calcium_percent",
    "phosphorus_percent",
    "sodium_percent",
    "magnesium_percent",
  ].filter((field) => row[field]).length;
}

function extractBlocks(paragraphs) {
  const rawBlocks = [];
  for (let index = 0; index < paragraphs.length; index += 1) {
    const heading = cleanText(paragraphs[index]);
    if (!isHeading(heading)) continue;
    const blockParagraphs = sectionParagraphs(paragraphs, index);
    const rawName = rawNameFromHeading(heading);
    const brand = brandFromName(rawName);
    const formulaName = formulaNameFromRaw(rawName, brand);
    rawBlocks.push({
      heading,
      rawName,
      brand,
      formulaName,
      sourceCode: sourceCodeFromHeading(heading),
      blockText: cleanText(blockParagraphs.join(" ")),
      duplicateCount: 0,
    });
  }
  return rawBlocks;
}

function rowFromBlock(block, sourcePath) {
  const comp = compositionText(block.blockText);
  const ingredients = splitIngredients(comp);
  const analysis = analysisText(block.blockText);
  const species = inferSpecies(block.heading, block.rawName);
  const format = inferFormat(block.heading);
  const kcalKg = kcalPerKg(analysis);
  const commercialTags = tagsFor(block.formulaName, block.blockText, ingredients, species, format);

  const sodium =
    percentValue(analysis, ["Νάτριο", "Na", "Sodium"]) || gKgToPercent(analysis, ["Νάτριο", "Na", "Sodium"]);
  const magnesium =
    percentValue(analysis, ["Μαγνήσιο", "Mg", "Magnesium"]) || gKgToPercent(analysis, ["Μαγνήσιο", "Mg", "Magnesium"]);

  return {
    brand: block.brand,
    formula_name: block.formulaName,
    display_name: `${block.brand} ${block.formulaName}`.replace(new RegExp(`^${block.brand}\\s+${block.brand}\\s+`, "i"), `${block.brand} `),
    species,
    format,
    life_stage: inferLifeStage(block.formulaName, block.blockText, species),
    dog_size: inferDogSize(block.formulaName, species),
    breed_target: "",
    medical_tags: medicalTags(commercialTags),
    commercial_tags: commercialTags,
    ingredient_text: comp,
    ingredients: ingredients.length ? JSON.stringify(ingredients) : "",
    primary_animal_proteins: ingredients.filter((item) => /(πάπια|duck|πουλερ|poultry|κοτόπουλ|chicken|σολομ|salmon|ψάρι|fish|αυγ|egg|χοιριν|pork)/iu.test(item)).join(";"),
    carbohydrate_sources: ingredients.filter((item) => /(ρύζι|rice|καλαμπόκι|αραβόσιτ|corn|ταπιόκα|tapioca|σιτάρι|wheat|κριθάρι|barley|σόγια|soya|soy)/iu.test(item)).join(";"),
    fat_sources: ingredients.filter((item) => /(λίπη|έλαιο|ιχθυέλαιο|σογιέλαιο|oil|fat)/iu.test(item)).join(";"),
    fiber_sources: ingredients.filter((item) => /(ίνες|πούλπα|τεύτλων|ψύλλιο|FOS|MOS|fructo|beet|psyllium|chicory)/iu.test(item)).join(";"),
    additives_text: extractInlineSection(block.blockText, /(?:Πρόσθετες|Πρόσθετα|Θρεπτικές|Διατροφικές)\s+[^:]{0,40}:/iu, /(?:Αναλυτικά|Ανάλυση|Σύνθεση|Βλέπε|$)/iu),
    feeding_guide_text: "",
    kcal_per_100g: kcalKg ? String(Math.round((Number(kcalKg) / 10) * 10) / 10) : "",
    kcal_per_kg: kcalKg,
    protein_percent: percentValue(analysis, ["Πρωτεΐνη", "Ακατέργαστη πρωτεΐνη", "Πρωτεΐνη (%)"]),
    fat_percent: percentValue(analysis, ["Λιπαρά", "Περιεκτικότητα σε λιπαρές ουσίες", "Ακατέργαστο λίπος", "Λιπαρά (%)"]),
    fiber_percent: percentValue(analysis, ["Ακατέργαστες ινώδεις ουσίες", "Ακατέργαστες διατροφικές ίνες", "Ακατέργαστες ινές", "Ίνες", "Ίνες (%)"]),
    ash_percent: percentValue(analysis, ["Ανόργανη ύλη", "Ακατέργαστη τέφρα", "Τέφρα", "Ανόργανη ύλη (%)"]),
    moisture_percent: percentValue(analysis, ["Υγρασία", "Υγρασία (%)"]),
    calcium_percent: percentValue(analysis, ["Ασβέστιο", "Ασβέστιο (%)", "Calcium"]),
    phosphorus_percent: percentValue(analysis, ["Φωσφόρος", "Φωσφόρος (%)", "Phosphorus"]),
    sodium_percent: sodium,
    magnesium_percent: magnesium,
    potassium_percent: percentValue(analysis, ["Κάλιο", "Κάλιο (%)"]) || gKgToPercent(analysis, ["Κάλιο", "Κ"]),
    omega3_percent: percentValue(analysis, ["ω3", "Ωμέγα 3", "Ω3"]) || gKgToPercent(analysis, ["Ωμέγα 3", "ω3"]),
    omega6_percent: percentValue(analysis, ["ω6", "Ωμέγα 6", "Ω6"]) || gKgToPercent(analysis, ["Ωμέγα 6", "ω6"]),
    dha_percent: "",
    epa_percent: "",
    taurine_mgkg: mgKgValue(analysis, ["Ταυρίνη", "Taurine"]),
    l_carnitine_mgkg: mgKgValue(analysis, ["L-Καρνιτίνη", "L-Carnitine"]),
    glucosamine_mgkg: "",
    chondroitin_mgkg: "",
    vitamin_a_iukg: "",
    vitamin_d3_iukg: "",
    vitamin_e_mgkg: mgKgValue(analysis, ["Βιταμίνη E", "Vitamin E"]),
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
      `source_code=${block.sourceCode}`,
      "official_url_required=true",
      `duplicate_blocks_skipped=${block.duplicateCount}`,
      "Auto-extracted from Περιγραφές Vet Eshop.docx; verify against official veterinary diet source or label before import.",
    ].join("; "),
    formula_key: `${slugify(block.brand)}-${slugify(block.formulaName)}-${species}-${format}-gr-document`,
    ean: "",
  };
}

function dedupeRows(rows) {
  const byKey = new Map();
  const duplicateCounts = new Map();
  for (const row of rows) {
    const existing = byKey.get(row.formula_key);
    if (!existing || rowCompleteness(row) > rowCompleteness(existing)) {
      byKey.set(row.formula_key, row);
    }
    duplicateCounts.set(row.formula_key, (duplicateCounts.get(row.formula_key) ?? 0) + (existing ? 1 : 0));
  }
  return [...byKey.values()].map((row) => ({
    ...row,
    source_notes: row.source_notes.replace(
      /duplicate_blocks_skipped=\d+/,
      `duplicate_blocks_skipped=${duplicateCounts.get(row.formula_key) ?? 0}`,
    ),
  }));
}

function missingFieldsFor(row) {
  const missing = [];
  if (!row.ingredient_text) missing.push("ingredient_text");
  if (!row.kcal_per_kg) missing.push("kcal_per_100g_or_kcal_per_kg");
  if (!row.data_source_url) missing.push("data_source_url_or_official_evidence");
  for (const field of ["protein_percent", "fat_percent", "fiber_percent"]) {
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
      "Attach official veterinary diet URL or label photo, verify formula identity/nutrients, then preview in Food V2 before commit.",
    notes: "Formula-level row deduped from Greek vet eshop document; pack-size variants were not imported separately.",
  };
}

function renderReport(rows, rawBlockCount, sourcePath) {
  const coverage = (field) => rows.filter((row) => row[field]).length;
  const byBrand = rows.reduce((acc, row) => {
    acc[row.brand] = (acc[row.brand] ?? 0) + 1;
    return acc;
  }, {});
  const brandLines = Object.entries(byBrand)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([brand, count]) => `- ${brand}: ${count}`)
    .join("\n");

  return `# Vet Eshop Document Extract

Generated: ${new Date().toISOString()}

## Summary

- Source document: ${sourcePath}
- Raw product headings: ${rawBlockCount}
- Extracted formula-level rows after dedupe: ${rows.length}
- Duplicate pack/formula blocks skipped: ${rawBlockCount - rows.length}
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Coverage

- Ingredients: ${coverage("ingredient_text")}/${rows.length}
- Protein/fat/fiber: ${rows.filter((row) => row.protein_percent && row.fat_percent && row.fiber_percent).length}/${rows.length}
- Ash/moisture: ${rows.filter((row) => row.ash_percent && row.moisture_percent).length}/${rows.length}
- Calcium/phosphorus: ${rows.filter((row) => row.calcium_percent && row.phosphorus_percent).length}/${rows.length}
- Sodium/magnesium: ${rows.filter((row) => row.sodium_percent && row.magnesium_percent).length}/${rows.length}
- Kcal/ME: ${coverage("kcal_per_kg")}/${rows.length}
- Official URL: 0/${rows.length}

## By Brand

${brandLines}

## Import Decision

All rows are marked needs_review/hold. The document has useful veterinary diet descriptions and nutrient data, but official URLs/provenance must be attached before import.
`;
}

async function main() {
  const sourcePath = process.argv[2] ?? defaultDocumentPath;
  const templateText = await readFile(paths.template, "utf8");
  const headers = parseCsvLine(templateText.split(/\r?\n/)[0] ?? "");
  const documentXml = unzipEntry(await readFile(sourcePath), "word/document.xml");
  const paragraphs = paragraphsFromDocxXml(documentXml);
  const blocks = extractBlocks(paragraphs);
  const rows = dedupeRows(blocks.map((block) => rowFromBlock(block, sourcePath)));

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.review), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(headers, rows), "utf8");
  await writeFile(paths.review, writeCsv(reviewHeaders, rows.map(reviewRow)), "utf8");
  await writeFile(paths.report, renderReport(rows, blocks.length, sourcePath), "utf8");

  console.log(`Vet Eshop document rows: ${rows.length}`);
  console.log(`Raw product headings: ${blocks.length}`);
  console.log(`Duplicate pack/formula blocks skipped: ${blocks.length - rows.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
