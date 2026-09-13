import { readFileSync, writeFileSync } from "node:fs";
import { previewFoodV2Csv } from "@/lib/food-v2/importPreview";

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  throw new Error("Usage: tsx scripts/data/review/preview-food-v2-csv.ts <input.csv> <output.json>");
}

const preview = previewFoodV2Csv(readFileSync(inputPath, "utf8"));
writeFileSync(outputPath, JSON.stringify(preview.summary, null, 2), "utf8");

if (process.argv[4]) {
  const rows = preview.rows.map((row) => ({
    formula_key: row.food.formula_key,
    brand: row.food.brand,
    display_name: row.food.display_name,
    is_importable: row.validation.is_importable,
    completeness_score: row.validation.completeness_score,
    missing_fields: row.validation.missing_fields,
    warnings: row.validation.warnings,
    impossible_values: row.validation.impossible_values,
    conflicts: row.validation.conflicts,
    source_url: row.food.data_source_url,
  }));
  writeFileSync(process.argv[4], JSON.stringify(rows, null, 2), "utf8");
}

console.log(JSON.stringify(preview.summary, null, 2));
