import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const photoRoot = "C:/Users/NIOstb/Desktop/photo_foods_nutritail";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/royal_canin_dog_photo_batch_v2.csv",
  review: "data/review/royal_canin_dog_photo_batch_review.csv",
  report: "reports/royal_canin_dog_photo_batch.md",
};

const reviewHeaders = [
  "formula_key",
  "brand",
  "formula_name",
  "species",
  "status",
  "missing_fields",
  "evidence_path",
  "image_count",
  "recommended_action",
  "notes",
];

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

function csvEscape(value) {
  if (value == null) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(headers, rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(","))
    .join("\n")}\n`;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      ["xsmall", "xs"].includes(word.toLowerCase())
        ? "X-Small"
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function formulaNameFromFolder(folderName) {
  return titleCase(folderName.replace(/^royal\s+/i, ""));
}

function lifeStageFor(name) {
  const text = name.toLowerCase();
  if (text.includes("puppy")) return "puppy";
  if (text.includes("ageing") || text.includes("senior")) return "senior";
  return "adult";
}

function dogSizeFor(name) {
  const text = name.toLowerCase();
  if (text.includes("xsmall")) return "mini";
  if (text.includes("mini") || text.includes("chihuahua") || text.includes("shih") || text.includes("yorkshire")) {
    return "mini";
  }
  if (text.includes("medium") || text.includes("bulldog") || text.includes("french bulldog") || text.includes("cavalier")) {
    return "medium";
  }
  if (text.includes("giant")) return "giant";
  if (text.includes("maxi") || text.includes("large")) return "large";
  return "";
}

function breedTargetFor(name) {
  const text = name.toLowerCase();
  const breeds = [
    ["cavalier king charles", "Cavalier King Charles"],
    ["chihuahua", "Chihuahua"],
    ["french bulldog", "French Bulldog"],
    ["bulldog", "Bulldog"],
    ["miniature schnauzer", "Miniature Schnauzer"],
    ["shih tzu", "Shih Tzu"],
    ["west highland white terrier", "West Highland White Terrier"],
    ["yorkshire terrier", "Yorkshire Terrier"],
  ];

  return breeds.find(([needle]) => text.includes(needle))?.[1] ?? "";
}

function commercialTagsFor(name) {
  const text = name.toLowerCase();
  const tags = ["dog"];

  if (text.includes("puppy")) tags.push("puppy");
  if (text.includes("ageing")) tags.push("senior");
  if (text.includes("sterilised")) tags.push("sterilised");
  if (text.includes("light weight")) tags.push("weight_control");
  if (text.includes("digestive")) tags.push("sensitive_digestion");
  if (text.includes("coat")) tags.push("skin_coat");
  if (text.includes("exigent")) tags.push("exigent");
  if (text.includes("xsmall") || text.includes("mini") || text.includes("chihuahua") || text.includes("shih") || text.includes("yorkshire")) {
    tags.push("small_breed");
  }
  if (text.includes("medium")) tags.push("medium_breed");
  if (text.includes("maxi") || text.includes("giant")) tags.push("large_breed");
  if (breedTargetFor(name)) tags.push("breed_specific");

  return [...new Set(tags)].join(";");
}

function medicalTagsFor(name) {
  const text = name.toLowerCase();
  const tags = [];

  if (text.includes("light weight")) tags.push("obesity");
  if (text.includes("digestive")) tags.push("gi_support");

  return tags.join(";");
}

async function dogPhotoFolders() {
  const entries = await readdir(photoRoot, { withFileTypes: true });
  const folders = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!entry.name.toLowerCase().startsWith("royal ")) continue;
    if (entry.name.toLowerCase().includes(" cat")) continue;

    const folderPath = path.join(photoRoot, entry.name);
    const files = await readdir(folderPath, { withFileTypes: true });
    const imageFiles = [];

    for (const file of files) {
      if (!file.isFile()) continue;
      if (!/\.(jpe?g|png|webp)$/i.test(file.name)) continue;
      const filePath = path.join(folderPath, file.name);
      imageFiles.push({
        name: file.name,
        path: filePath,
        stats: await stat(filePath),
      });
    }

    folders.push({
      folder_name: entry.name,
      folder_path: folderPath.replace(/\\/g, "/"),
      image_count: imageFiles.length,
    });
  }

  return folders.sort((a, b) => a.folder_name.localeCompare(b.folder_name));
}

function v2Row(folder) {
  const formulaName = formulaNameFromFolder(folder.folder_name);
  const formulaKey = `royal-canin-${slugify(formulaName)}-dog-dry-gr-photo`;

  return {
    brand: "Royal Canin",
    formula_name: formulaName,
    display_name: `Royal Canin ${formulaName}`,
    species: "dog",
    format: "dry",
    life_stage: lifeStageFor(folder.folder_name),
    dog_size: dogSizeFor(folder.folder_name),
    breed_target: breedTargetFor(folder.folder_name),
    medical_tags: medicalTagsFor(folder.folder_name),
    commercial_tags: commercialTagsFor(folder.folder_name),
    ingredient_text: "",
    ingredients: "",
    primary_animal_proteins: "",
    carbohydrate_sources: "",
    fat_sources: "",
    fiber_sources: "",
    additives_text: "",
    feeding_guide_text: "",
    kcal_per_100g: "",
    kcal_per_kg: "",
    protein_percent: "",
    fat_percent: "",
    fiber_percent: "",
    ash_percent: "",
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
    source_priority: "manual_photo",
    source_notes: `market=GR; basis=as-fed; source_tier=pack_photo; evidence_path=${folder.folder_path}; image_count=${folder.image_count}; extraction_scope=identity_only; nutrition_transcription_required=true`,
    formula_key: formulaKey,
    ean: "",
  };
}

function reviewRow(folder) {
  const formulaName = formulaNameFromFolder(folder.folder_name);
  const formulaKey = `royal-canin-${slugify(formulaName)}-dog-dry-gr-photo`;

  return {
    formula_key: formulaKey,
    brand: "Royal Canin",
    formula_name: formulaName,
    species: "dog",
    status: "needs_review",
    missing_fields:
      "ingredient_text|kcal_per_100g_or_kcal_per_kg|protein_percent|fat_percent|fiber_percent|ash_percent|moisture_percent|calcium_percent|phosphorus_percent|sodium_percent|magnesium_percent|barcode_or_ean",
    evidence_path: folder.folder_path,
    image_count: folder.image_count,
    recommended_action:
      "Transcribe ingredients and analytical constituents from pack photos, add calories/minerals/barcode where visible or from official page, then preview in Food V2 before commit.",
    notes: "Batch row extracted from Royal Canin dog photo-set identity; nutrition transcription still required.",
  };
}

function renderReport(folders) {
  const byLifeStage = folders.reduce((acc, folder) => {
    const stage = lifeStageFor(folder.folder_name);
    acc[stage] = (acc[stage] ?? 0) + 1;
    return acc;
  }, {});
  const bySize = folders.reduce((acc, folder) => {
    const size = dogSizeFor(folder.folder_name) || "unknown";
    acc[size] = (acc[size] ?? 0) + 1;
    return acc;
  }, {});

  const countLines = (counts) =>
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, count]) => `- ${label}: ${count}`)
      .join("\n");

  return `# Royal Canin Dog Photo Batch

Generated: ${new Date().toISOString()}

## Summary

- Batch rows: ${folders.length}
- Species: dog
- Brand: Royal Canin
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## By Life Stage

${countLines(byLifeStage)}

## By Dog Size

${countLines(bySize)}

## Decision

This batch extracts formula identity and review metadata from local Royal Canin dog photo-set folders. Rows intentionally remain needs_review because nutrition values and ingredient text still require manual transcription or OCR QA from the evidence photos.

## Extracted Formulas

${folders.map((folder) => `- Royal Canin ${formulaNameFromFolder(folder.folder_name)} (${folder.image_count} images)`).join("\n")}
`;
}

async function main() {
  const templateText = await readFile(paths.template, "utf8");
  const headers = parseCsvLine(templateText.split(/\r?\n/)[0] ?? "");
  const folders = await dogPhotoFolders();
  const outputRows = folders.map(v2Row);
  const reviewRows = folders.map(reviewRow);

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.review), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(headers, outputRows), "utf8");
  await writeFile(paths.review, writeCsv(reviewHeaders, reviewRows), "utf8");
  await writeFile(paths.report, renderReport(folders), "utf8");

  console.log(`Royal Canin dog photo batch rows: ${folders.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
