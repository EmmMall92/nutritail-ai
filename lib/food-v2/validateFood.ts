import type {
  FoodImportRowV2,
  FoodNutrientsV2,
  FoodProductV2,
  FoodValidationV2,
} from "@/types/food-v2";

type FoodRowLike = {
  food: FoodProductV2;
  nutrients: FoodNutrientsV2;
};

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasArrayValues(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}

function hasNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function hasAnyNutrient(nutrients: FoodNutrientsV2, keys: Array<keyof FoodNutrientsV2>) {
  return keys.some((key) => hasNumber(nutrients[key]));
}

export function detectMissingCriticalFields(row: FoodRowLike) {
  const missing: string[] = [];
  const { food, nutrients } = row;

  if (!hasText(food.brand)) missing.push("brand");
  if (!hasText(food.formula_name)) missing.push("formula_name");
  if (!hasText(food.species)) missing.push("species");
  if (!hasText(food.format)) missing.push("format");
  if (!hasText(food.ingredient_text) && !hasArrayValues(food.ingredients)) {
    missing.push("ingredient_text_or_ingredients");
  }
  if (!hasNumber(nutrients.protein_percent)) missing.push("protein_percent");
  if (!hasNumber(nutrients.fat_percent)) missing.push("fat_percent");
  if (!hasNumber(nutrients.fiber_percent)) missing.push("fiber_percent");
  if (!hasNumber(food.kcal_per_100g) && !hasNumber(food.kcal_per_kg)) {
    missing.push("kcal_per_100g_or_kcal_per_kg");
  }
  if (!hasText(food.data_source_url) && food.source_priority !== "manual_photo") {
    missing.push("data_source_url_or_manual_photo");
  }

  return missing;
}

export function detectImpossibleNutritionValues(
  nutrients: FoodNutrientsV2,
  food?: Pick<FoodProductV2, "format" | "kcal_per_100g">
) {
  const impossible: string[] = [];

  const checks: Array<[keyof FoodNutrientsV2, number, number]> = [
    ["protein_percent", 5, 60],
    ["fat_percent", 2, 45],
    ["fiber_percent", 0, 20],
    ["ash_percent", 0, 20],
    ["calcium_percent", 0, 4],
    ["phosphorus_percent", 0, 3],
    ["sodium_percent", 0, 2],
    ["magnesium_percent", 0, 0.5],
    ["omega3_percent", 0, 5],
    ["omega6_percent", 0, 8],
    ["dha_percent", 0, 3],
    ["epa_percent", 0, 3],
  ];

  for (const [key, min, max] of checks) {
    const value = nutrients[key];
    if (value === null || value === undefined) continue;
    if (!Number.isFinite(value) || value < min || value > max) {
      impossible.push(`${key} outside expected range ${min}-${max}`);
    }
  }

  if (food?.format === "dry" && hasNumber(food.kcal_per_100g)) {
    const kcal = Number(food.kcal_per_100g);
    if (kcal < 200 || kcal > 600) {
      impossible.push("kcal_per_100g outside expected dry food range 200-600");
    }
  }

  return impossible;
}

export function generateCompletenessScore(row: FoodRowLike) {
  const { food, nutrients } = row;
  let score = 0;

  if (hasText(food.ingredient_text) || hasArrayValues(food.ingredients)) {
    score += 15;
  }

  const coreAnalytics: Array<keyof FoodNutrientsV2> = food.format === "wet"
    ? [
        "protein_percent",
        "fat_percent",
        "fiber_percent",
        "ash_percent",
        "moisture_percent",
      ]
    : [
        "protein_percent",
        "fat_percent",
        "fiber_percent",
        "ash_percent",
      ];
  score +=
    (coreAnalytics.filter((key) => hasNumber(nutrients[key])).length /
      coreAnalytics.length) *
    25;

  if (hasNumber(food.kcal_per_100g) || hasNumber(food.kcal_per_kg)) {
    score += 15;
  }

  const minerals: Array<keyof FoodNutrientsV2> = [
    "calcium_percent",
    "phosphorus_percent",
    "sodium_percent",
    "magnesium_percent",
  ];
  score +=
    (minerals.filter((key) => hasNumber(nutrients[key])).length / minerals.length) *
    25;

  const functionalNutrients: Array<keyof FoodNutrientsV2> = [
    "omega3_percent",
    "omega6_percent",
    "dha_percent",
    "epa_percent",
    "taurine_mgkg",
    "l_carnitine_mgkg",
    "glucosamine_mgkg",
    "chondroitin_mgkg",
  ];
  score +=
    (functionalNutrients.filter((key) => hasNumber(nutrients[key])).length /
      functionalNutrients.length) *
    5;

  const micronutrients: Array<keyof FoodNutrientsV2> = [
    "vitamin_a_iukg",
    "vitamin_d3_iukg",
    "vitamin_e_mgkg",
    "iron_mgkg",
    "zinc_mgkg",
    "copper_mgkg",
    "manganese_mgkg",
    "iodine_mgkg",
    "selenium_mgkg",
  ];
  if (hasText(food.additives_text) || hasAnyNutrient(nutrients, micronutrients)) {
    score += 5;
  }

  if (food.source_priority === "official") score += 10;
  else if (food.source_priority === "retailer") score += 6;
  else if (food.source_priority === "manual_photo") score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function validateFoodImportRow(
  row: Omit<FoodImportRowV2, "validation"> | FoodImportRowV2
): FoodValidationV2 {
  const missingFields = detectMissingCriticalFields(row);
  const impossibleValues = detectImpossibleNutritionValues(
    row.nutrients,
    row.food
  );
  const warnings: string[] = [];
  const conflicts: string[] = [];

  if (row.food.data_quality_status === "verified" && row.food.source_priority !== "official") {
    conflicts.push("verified status should be backed by an official source");
  }

  if (row.food.life_stage === "unknown") warnings.push("life_stage is unknown");
  if (row.food.format === "wet" && !hasNumber(row.nutrients.moisture_percent)) {
    warnings.push("wet food should include moisture_percent when available");
  }
  if (row.food.source_priority === "manual_photo") {
    warnings.push("manual photo rows require human verification before publish");
  }
  if (row.food.source_notes?.includes("kcal_estimated=true")) {
    warnings.push("kcal_per_100g is estimated from modified Atwater factors");
  }

  const completenessScore = generateCompletenessScore(row);

  return {
    is_importable: missingFields.length === 0 && impossibleValues.length === 0,
    completeness_score: completenessScore,
    missing_fields: missingFields,
    warnings,
    impossible_values: impossibleValues,
    conflicts,
  };
}
