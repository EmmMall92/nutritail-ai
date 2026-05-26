import type { ImportFoodRow } from "@/types/import-food";
import type { Food } from "@/types/food";
import { normalizeDataQualityStatus } from "@/lib/import/foodNormalizer";
import { validateFoodRow } from "@/lib/import/foodValidation";

function ensureStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array.`);
  }

  const invalid = value.some((item) => typeof item !== "string");
  if (invalid) {
    throw new Error(`${fieldName} must contain only strings.`);
  }

  return value;
}

function ensureNumber(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }

  return value;
}

function ensureString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }

  return value.trim();
}

function optionalNumber(value: unknown, fieldName: string): number | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${fieldName} must be a valid number when provided.`);
  }

  return value;
}

function optionalString(value: unknown, fieldName: string): string | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string when provided.`);
  }

  const trimmed = value.trim();
  return trimmed || null;
}

export function parseImportFoodRow(row: unknown): Food {
  if (typeof row !== "object" || row === null) {
    throw new Error("Each food row must be an object.");
  }

  const data = row as Record<string, unknown>;

  const food: Food = {
    id: ensureString(data.id, "id"),
    brand: ensureString(data.brand, "brand"),
    name: ensureString(data.name, "name"),
    species: ensureString(data.species, "species") as "dog" | "cat",
    lifeStage: ensureString(data.lifeStage, "lifeStage") as
      | "young"
      | "adult"
      | "senior"
      | "all",
    activitySupport: ensureString(data.activitySupport, "activitySupport") as
      | "low"
      | "normal"
      | "high"
      | "all",
    healthSupport: ensureStringArray(data.healthSupport, "healthSupport"),
    protein: ensureNumber(data.protein, "protein"),
    fat: ensureNumber(data.fat, "fat"),
    fiber: ensureNumber(data.fiber, "fiber"),
    sodium: ensureNumber(data.sodium, "sodium"),
    magnesium: ensureNumber(data.magnesium, "magnesium"),
    calcium: ensureNumber(data.calcium, "calcium"),
    phosphorus: ensureNumber(data.phosphorus, "phosphorus"),
    ingredients: ensureStringArray(data.ingredients, "ingredients"),
    tags: ensureStringArray(data.tags, "tags"),
    kcalPer100g: optionalNumber(data.kcalPer100g, "kcalPer100g"),
    proteinPercent: optionalNumber(data.proteinPercent, "proteinPercent"),
    fatPercent: optionalNumber(data.fatPercent, "fatPercent"),
    fiberPercent: optionalNumber(data.fiberPercent, "fiberPercent"),
    sodiumPercent: optionalNumber(data.sodiumPercent, "sodiumPercent"),
    magnesiumPercent: optionalNumber(data.magnesiumPercent, "magnesiumPercent"),
    calciumPercent: optionalNumber(data.calciumPercent, "calciumPercent"),
    phosphorusPercent: optionalNumber(
      data.phosphorusPercent,
      "phosphorusPercent"
    ),
    dataQualityStatus: normalizeDataQualityStatus(data.dataQualityStatus),
    dataSourceUrl: optionalString(data.dataSourceUrl, "dataSourceUrl"),
    dataNotes: optionalString(data.dataNotes, "dataNotes"),
  };

  const validation = validateFoodRow(food as unknown as Record<string, unknown>);
  const blockingIssues = validation.impossibleNutritionValues.filter(
    (issue) => issue.severity === "error"
  );

  if (blockingIssues.length > 0) {
    throw new Error(blockingIssues[0].message);
  }

  return food;
}

export function parseImportFoods(rows: unknown): ImportFoodRow[] {
  if (!Array.isArray(rows)) {
    throw new Error("Import payload must be an array.");
  }

  const parsed = rows.map(parseImportFoodRow);
  const seenIds = new Set<string>();

  for (const food of parsed) {
    if (seenIds.has(food.id)) {
      throw new Error(`Duplicate food id found in import payload: ${food.id}`);
    }

    seenIds.add(food.id);
  }

  return parsed;
}
