import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  template: "data/templates/nutritail-food-v2-template.csv",
  output: "data/imports/royal_canin_cat_photo_pilot_v2.csv",
  review: "data/review/royal_canin_cat_photo_pilot_review.csv",
  report: "reports/royal_canin_cat_photo_pilot.md",
};

const photoRoot = "C:/Users/NIOstb/Desktop/photo_foods_nutritail";

const rows = [
  {
    formula_name: "Digestive Care",
    folder: "royal adult digestive care cat",
    formula_key: "royal-canin-digestive-care-cat-dry-gr-photo",
    commercial_tags: "sensitive_digestion;rice;corn;fish",
    medical_tags: "gi_support",
    ingredient_text:
      "Απομονωμένη αφυδατωμένη πρωτεΐνη, σιτάλευρο, αφυδατωμένο ψάρι, ρύζι, ζωικά λίπη, αφυδατωμένη πρωτεΐνη πουλερικών, υδρολυμένες ζωικές πρωτεΐνες, γλουτένη καλαμποκιού, καλαμπόκαλευρο, φυτικές ίνες, πούλπα κιχωρίου, ανόργανα συστατικά, έλαιο σόγιας, ιχθυέλαιο, φρουκτο-ολιγοσακχαρίτες, ψύλλιο.",
    protein_percent: "38",
    fat_percent: "15",
    fiber_percent: "2.4",
  },
  {
    formula_name: "Hair & Skin Care",
    folder: "royal adult hair & skin care cat",
    formula_key: "royal-canin-hair-skin-care-cat-dry-gr-photo",
    commercial_tags: "skin_coat;chicken;rice;corn;fish",
    medical_tags: "",
    ingredient_text:
      "Αφυδατωμένη πρωτεΐνη πουλερικών, ζωικά λίπη, απομονωμένη φυτική πρωτεΐνη, ρύζι, φυτικές ίνες, άλευρο σιταριού, γλουτένη καλαμποκιού, υδρολυμένες ζωικές πρωτεΐνες, γλουτένη σίτου, καλαμπόκι, πούλπα κιχωρίου, ιχθυέλαιο, ανόργανα συστατικά, σογιέλαιο, έλαιο βοράγου, ψύλλιο, υδρολυμένα καρκινοειδή, υδρολυμένος χόνδρος.",
    protein_percent: "33",
    fat_percent: "22",
    fiber_percent: "5",
  },
  {
    formula_name: "Hairball Care",
    folder: "royal adult hairball care cat",
    formula_key: "royal-canin-hairball-care-cat-dry-gr-photo",
    commercial_tags: "hairball;chicken;rice;corn;fish",
    medical_tags: "",
    ingredient_text:
      "Αφυδατωμένη πρωτεΐνη πουλερικών, απομονωμένη φυτική πρωτεΐνη, καλαμπόκι, φυτικές ίνες, ρύζι, ζωικά λίπη, αφυδατωμένες ζωικές πρωτεΐνες, σιτάλευρο, γλουτένη καλαμποκιού, υδρολυμένες ζωικές πρωτεΐνες, πούλπα κιχωρίου, ιχθυέλαιο, ανόργανα συστατικά, ψύλλιο, σογιέλαιο, φρουκτο-ολιγοσακχαρίτες.",
    protein_percent: "34",
    fat_percent: "15",
    fiber_percent: "6.9",
  },
  {
    formula_name: "Savour Exigent",
    folder: "royal adult savour exigent cat",
    formula_key: "royal-canin-savour-exigent-cat-dry-gr-photo",
    commercial_tags: "exigent;palatability;rice;corn;chicken;fish",
    medical_tags: "",
    ingredient_text:
      "Καλαμπόκι, αφυδατωμένη πρωτεΐνη πουλερικών, ρύζι, απομονωμένη φυτική πρωτεΐνη, ζωικά λίπη, γλουτένη καλαμποκιού, υδρολυμένες ζωικές πρωτεΐνες, φυτικές ίνες, άλευρο σίτου, πούλπα κιχωρίου, ανόργανα συστατικά, ιχθυέλαιο, σογιέλαιο, φρουκτο-ολιγοσακχαρίτες, έλαιο βοράγου.",
    protein_percent: "33",
    fat_percent: "16",
    fiber_percent: "3.1",
  },
  {
    formula_name: "Urinary Care",
    folder: "royal adult urinary care cat",
    formula_key: "royal-canin-urinary-care-cat-dry-gr-photo",
    commercial_tags: "urinary;rice;corn;chicken;fish",
    medical_tags: "urinary",
    ingredient_text:
      "Αφυδατωμένη πρωτεΐνη πουλερικών, καλαμπόκι, απομονωμένη φυτική πρωτεΐνη, ρύζι, σιτάλευρο, ζωικά λίπη, γλουτένη καλαμποκιού, υδρολυμένες ζωικές πρωτεΐνες, πούλπα κιχωρίου, ανόργανα συστατικά, σογιέλαιο, ιχθυέλαιο, άλευρο σίτου, φρουκτο-ολιγοσακχαρίτες.",
    protein_percent: "33",
    fat_percent: "13",
    fiber_percent: "5",
  },
];

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

function writeCsv(headers, csvRows) {
  return `${headers.join(",")}\n${csvRows
    .map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(","))
    .join("\n")}\n`;
}

function v2Row(row) {
  const evidencePath = `${photoRoot}/${row.folder}`;
  const displayName = `Royal Canin ${row.formula_name}`;

  return {
    brand: "Royal Canin",
    formula_name: row.formula_name,
    display_name: displayName,
    species: "cat",
    format: "dry",
    life_stage: "adult",
    dog_size: "",
    breed_target: "",
    medical_tags: row.medical_tags,
    commercial_tags: row.commercial_tags,
    ingredient_text: row.ingredient_text,
    ingredients: "",
    primary_animal_proteins: "",
    carbohydrate_sources: "",
    fat_sources: "",
    fiber_sources: "",
    additives_text: "",
    feeding_guide_text: "",
    kcal_per_100g: "",
    kcal_per_kg: "",
    protein_percent: row.protein_percent,
    fat_percent: row.fat_percent,
    fiber_percent: row.fiber_percent,
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
    source_notes: `market=GR; basis=as-fed; source_tier=pack_photo; evidence_path=${evidencePath}; transcription=manual_from_photo; qa_required=true`,
    formula_key: row.formula_key,
    ean: "",
  };
}

function reviewRow(row) {
  return {
    formula_key: row.formula_key,
    brand: "Royal Canin",
    formula_name: row.formula_name,
    species: "cat",
    status: "needs_review",
    missing_fields:
      "kcal_per_100g_or_kcal_per_kg|ash_percent|moisture_percent|calcium_percent|phosphorus_percent|sodium_percent|magnesium_percent|barcode_or_ean",
    evidence_path: `${photoRoot}/${row.folder}`,
    recommended_action:
      "Verify ingredient transcription, add calories/minerals/barcode from label or official page, then preview in Food V2 before commit.",
    notes: "Pilot row extracted from local Royal Canin photo set; not production-ready.",
  };
}

function renderReport() {
  return `# Royal Canin Cat Photo Pilot

Generated: ${new Date().toISOString()}

## Summary

- Pilot rows: ${rows.length}
- Species: cat
- Brand: Royal Canin
- Output CSV: ${paths.output}
- Review CSV: ${paths.review}

## Decision

These rows prove that the local photo evidence can be converted into Food V2 rows, but they should remain needs_review until calories, minerals, EAN/barcode, and ingredient transcription are verified.

## Extracted Formulas

${rows.map((row) => `- Royal Canin ${row.formula_name}`).join("\n")}
`;
}

async function main() {
  const templateText = await readFile(paths.template, "utf8");
  const headers = parseCsvLine(templateText.split(/\r?\n/)[0] ?? "");
  const outputRows = rows.map(v2Row);
  const reviewRows = rows.map(reviewRow);

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.review), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(headers, outputRows), "utf8");
  await writeFile(paths.review, writeCsv(reviewHeaders, reviewRows), "utf8");
  await writeFile(paths.report, renderReport(), "utf8");

  console.log(`Royal Canin cat pilot rows: ${rows.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.review}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
