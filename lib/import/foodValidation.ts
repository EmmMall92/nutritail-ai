import { normalizeFoodRow } from "@/lib/import/foodNormalizer";
import type {
  FoodValidationIssue,
  FoodValidationResult,
  NormalizedFoodRow,
  RawFoodRow,
} from "@/types/food-dataset";

const CRITICAL_FIELDS: Array<keyof NormalizedFoodRow> = [
  "brand",
  "name",
  "species",
  "life_stage",
  "ingredients",
  "kcal_per_100g",
  "protein_percent",
  "fat_percent",
  "fiber_percent",
  "data_source_url",
];

const NUTRITION_RANGES: Record<
  string,
  { min: number; max: number; unit: string }
> = {
  kcal_per_100g: { min: 150, max: 650, unit: "kcal/100g" },
  protein_percent: { min: 5, max: 60, unit: "%" },
  fat_percent: { min: 2, max: 45, unit: "%" },
  fiber_percent: { min: 0, max: 20, unit: "%" },
  sodium_percent: { min: 0, max: 3, unit: "%" },
  magnesium_percent: { min: 0, max: 1, unit: "%" },
  calcium_percent: { min: 0, max: 3, unit: "%" },
  phosphorus_percent: { min: 0, max: 3, unit: "%" },
};

function asNormalized(row: RawFoodRow | NormalizedFoodRow): NormalizedFoodRow {
  if ("completeness_score" in row) return row as NormalizedFoodRow;

  return normalizeFoodRow(row);
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;

  return value !== null && value !== undefined && value !== "";
}

function issue(
  field: string,
  message: string,
  severity: FoodValidationIssue["severity"] = "warning"
): FoodValidationIssue {
  return { field, message, severity };
}

export function detectMissingCriticalFields(
  row: RawFoodRow | NormalizedFoodRow
): string[] {
  const normalized = asNormalized(row);

  return CRITICAL_FIELDS.filter((field) => !hasValue(normalized[field]));
}

export function detectImpossibleNutritionValues(
  row: RawFoodRow | NormalizedFoodRow
): FoodValidationIssue[] {
  const normalized = asNormalized(row);
  const issues: FoodValidationIssue[] = [];

  Object.entries(NUTRITION_RANGES).forEach(([field, range]) => {
    const value = normalized[field as keyof NormalizedFoodRow];

    if (value === null || value === undefined) return;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      issues.push(issue(field, "Nutrition value must be a valid number.", "error"));
      return;
    }

    if (value < range.min || value > range.max) {
      issues.push(
        issue(
          field,
          `Nutrition value ${value}${range.unit} is outside the expected range ${range.min}-${range.max}${range.unit}.`,
          value <= 0 ? "error" : "warning"
        )
      );
    }
  });

  const calcium = normalized.calcium_percent;
  const phosphorus = normalized.phosphorus_percent;

  if (calcium !== null && phosphorus !== null && phosphorus > 0) {
    const ratio = calcium / phosphorus;
    if (ratio <= 0.4) {
      issues.push(
        issue(
          "calcium_percent",
          "Calcium to phosphorus ratio is too low for a complete dog food row.",
          "error"
        )
      );
    } else if (ratio < 0.5 || ratio > 3) {
      issues.push(
        issue(
          "calcium_percent",
          "Calcium to phosphorus ratio is unusual and should be reviewed.",
          "warning"
        )
      );
    }
  }

  return issues;
}

export function generateFoodCompletenessScore(
  row: RawFoodRow | NormalizedFoodRow
): number {
  const normalized = asNormalized(row);
  let score = 0;

  const coreNutrition = [
    normalized.protein_percent,
    normalized.fat_percent,
    normalized.fiber_percent,
  ];
  score += (coreNutrition.filter(hasValue).length / coreNutrition.length) * 35;

  if (normalized.ingredients.length >= 8) score += 20;
  else if (normalized.ingredients.length >= 5) score += 16;
  else if (normalized.ingredients.length > 0) score += 10;

  if (hasValue(normalized.kcal_per_100g)) score += 15;

  const minerals = [
    normalized.calcium_percent,
    normalized.phosphorus_percent,
    normalized.magnesium_percent,
    normalized.sodium_percent,
  ];
  score += (minerals.filter(hasValue).length / minerals.length) * 20;

  if (normalized.data_quality_status === "verified" && normalized.data_source_url) {
    score += 10;
  } else if (
    normalized.data_quality_status === "partial" &&
    normalized.data_source_url
  ) {
    score += 6;
  } else if (normalized.data_quality_status === "partial") {
    score += 4;
  } else if (
    normalized.data_quality_status === "needs_review" &&
    normalized.data_source_url
  ) {
    score += 2;
  } else if (normalized.data_source_url) {
    score += 1;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function validateFoodRow(row: RawFoodRow): FoodValidationResult {
  const normalized = normalizeFoodRow(row);
  const completenessScore = generateFoodCompletenessScore(normalized);
  const normalizedWithScore: NormalizedFoodRow = {
    ...normalized,
    completeness_score: completenessScore,
  };

  const missingCriticalFields = detectMissingCriticalFields(normalizedWithScore);
  const impossibleNutritionValues =
    detectImpossibleNutritionValues(normalizedWithScore);
  const errors: FoodValidationIssue[] = [
    ...missingCriticalFields.map((field) =>
      issue(field, "Missing critical field.", "error")
    ),
    ...impossibleNutritionValues.filter((item) => item.severity === "error"),
  ];
  const warnings: FoodValidationIssue[] = [
    ...impossibleNutritionValues.filter((item) => item.severity === "warning"),
  ];

  if (row.species !== undefined && normalizedWithScore.species !== "dog") {
    errors.push(issue("species", "Only dog food rows are supported.", "error"));
  }

  return {
    isValid: errors.length === 0,
    normalized: normalizedWithScore,
    missingCriticalFields,
    impossibleNutritionValues,
    warnings,
    errors,
    completenessScore,
  };
}
