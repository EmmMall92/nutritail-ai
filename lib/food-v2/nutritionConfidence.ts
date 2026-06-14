import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";

export type FoodV2NutritionConfidenceLevel =
  | "strong_data"
  | "usable_incomplete"
  | "estimated_or_review"
  | "caution_missing_core"
  | "limited_data";

export type FoodV2NutritionConfidence = {
  level: FoodV2NutritionConfidenceLevel;
  label: string;
  score: number;
  missing_core_fields: string[];
  missing_mineral_fields: string[];
  missing_optional_fields: string[];
  estimated_fields: string[];
  notes: string[];
};

function hasNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function sourceNotesInclude(food: FoodProductV2, token: string) {
  return String(food.source_notes ?? "").toLowerCase().includes(token);
}

function estimatedFields(food: FoodProductV2) {
  const fields: string[] = [];

  if (sourceNotesInclude(food, "kcal_estimated=true")) {
    fields.push("kcal_per_100g");
  }

  return fields;
}

export function getFoodV2NutritionConfidence(
  food: FoodProductV2,
  nutrients: FoodNutrientsV2
): FoodV2NutritionConfidence {
  const coreFields = {
    kcal_per_100g: food.kcal_per_100g,
    protein_percent: nutrients.protein_percent,
    fat_percent: nutrients.fat_percent,
    fiber_percent: nutrients.fiber_percent,
  };
  const mineralFields = {
    calcium_percent: nutrients.calcium_percent,
    phosphorus_percent: nutrients.phosphorus_percent,
    sodium_percent: nutrients.sodium_percent,
    magnesium_percent: nutrients.magnesium_percent,
  };
  const optionalFields = {
    ash_percent: nutrients.ash_percent,
    moisture_percent: nutrients.moisture_percent,
    omega3_percent: nutrients.omega3_percent,
    omega6_percent: nutrients.omega6_percent,
    epa_percent: nutrients.epa_percent,
    dha_percent: nutrients.dha_percent,
    epa_dha_percent: nutrients.epa_dha_percent,
  };

  const missingCore = Object.entries(coreFields)
    .filter(([, value]) => !hasNumber(value))
    .map(([key]) => key);
  const missingMinerals = Object.entries(mineralFields)
    .filter(([, value]) => !hasNumber(value))
    .map(([key]) => key);
  const missingOptional = Object.entries(optionalFields)
    .filter(([, value]) => !hasNumber(value))
    .map(([key]) => key);
  const estimated = estimatedFields(food);

  let score = 0;
  score += (Object.keys(coreFields).length - missingCore.length) * 15;
  score += (Object.keys(mineralFields).length - missingMinerals.length) * 7;
  score += (Object.keys(optionalFields).length - missingOptional.length) * 2;
  score -= estimated.length * 10;

  const notes: string[] = [];

  if (food.data_quality_status === "verified") {
    score += 10;
    notes.push("Verified row.");
  } else if (food.data_quality_status === "needs_review") {
    score += 4;
    notes.push("Needs review.");
  }

  if (food.source_priority === "official") {
    score += 8;
    notes.push("Official source.");
  } else if (food.source_priority === "manual_photo") {
    score += 6;
    notes.push("Label/photo source.");
  } else if (food.source_priority === "retailer") {
    score += 4;
    notes.push("Retailer source.");
  }

  if (estimated.length > 0) {
    notes.push(`Estimated fields: ${estimated.join(", ")}.`);
  }

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));

  if (missingCore.length >= 2) {
    return {
      level: "caution_missing_core",
      label: "Caution: missing core nutrition",
      score: boundedScore,
      missing_core_fields: missingCore,
      missing_mineral_fields: missingMinerals,
      missing_optional_fields: missingOptional,
      estimated_fields: estimated,
      notes,
    };
  }

  if (estimated.length > 0 && boundedScore >= 45) {
    return {
      level: "estimated_or_review",
      label: "Usable with estimated values",
      score: boundedScore,
      missing_core_fields: missingCore,
      missing_mineral_fields: missingMinerals,
      missing_optional_fields: missingOptional,
      estimated_fields: estimated,
      notes,
    };
  }

  if (boundedScore >= 80 && missingCore.length === 0 && missingMinerals.length <= 1) {
    return {
      level: "strong_data",
      label: "Strong nutrition data",
      score: boundedScore,
      missing_core_fields: missingCore,
      missing_mineral_fields: missingMinerals,
      missing_optional_fields: missingOptional,
      estimated_fields: estimated,
      notes,
    };
  }

  if (boundedScore >= 55 && missingCore.length <= 1) {
    return {
      level: "usable_incomplete",
      label: "Usable but incomplete data",
      score: boundedScore,
      missing_core_fields: missingCore,
      missing_mineral_fields: missingMinerals,
      missing_optional_fields: missingOptional,
      estimated_fields: estimated,
      notes,
    };
  }

  return {
    level: "limited_data",
    label: "Limited nutrition data",
    score: boundedScore,
    missing_core_fields: missingCore,
    missing_mineral_fields: missingMinerals,
    missing_optional_fields: missingOptional,
    estimated_fields: estimated,
    notes,
  };
}
