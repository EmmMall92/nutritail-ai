import type { FoodNutrientsV2, FoodProductV2, LifeStage, Species } from "@/types/food-v2";

type ActivityLevel = "low" | "normal" | "high";
type WeightGoal = "maintain" | "loss" | "gain";

export type FoodExpertPet = {
  species: Species;
  weightKg?: number | null;
  neutered?: boolean | null;
  activityLevel?: ActivityLevel | string | null;
  lifeStage?: LifeStage | string | null;
  dogSize?: string | null;
  weightGoal?: WeightGoal | string | null;
  allergies?: string[] | null;
  healthIssues?: string[] | null;
};

export type FoodExpertEvaluation = {
  fit: "good_fit" | "needs_caution" | "not_ideal";
  confidence: "high" | "moderate" | "low";
  reasons: string[];
  warnings: string[];
  missingData: string[];
  dailyGrams?: number | null;
};

function normalizedIncludes(values: string[] | null | undefined, terms: string[]) {
  const text = (values ?? []).join(" ").toLowerCase();
  return terms.some((term) => text.includes(term.toLowerCase()));
}

function hasTag(food: FoodProductV2, terms: string[]) {
  return normalizedIncludes(
    [...food.medical_tags, ...food.commercial_tags],
    terms
  );
}

function hasIngredient(food: FoodProductV2, terms: string[]) {
  return normalizedIncludes(food.ingredients, terms);
}

function hasNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function hasDha(nutrients: FoodNutrientsV2) {
  return hasNumber(nutrients.dha_percent);
}

function hasEpa(nutrients: FoodNutrientsV2) {
  return hasNumber(nutrients.epa_percent);
}

function hasLongChainOmega3(nutrients: FoodNutrientsV2) {
  return hasEpa(nutrients) || hasDha(nutrients);
}

export function calculateRER(weightKg: number) {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;
  return Math.round(70 * Math.pow(weightKg, 0.75));
}

export function calculateMER({
  rer,
  species,
  neutered,
  activityLevel,
  lifeStage,
  weightGoal,
}: {
  rer: number;
  species: Species;
  neutered?: boolean | null;
  activityLevel?: ActivityLevel | string | null;
  lifeStage?: LifeStage | string | null;
  weightGoal?: WeightGoal | string | null;
}) {
  let factor = species === "cat" ? 1.2 : 1.6;

  if (neutered) factor -= species === "cat" ? 0.2 : 0.2;
  if (activityLevel === "low") factor -= 0.2;
  if (activityLevel === "high") factor += 0.4;
  if (lifeStage === "puppy" || lifeStage === "kitten") factor += 0.8;
  if (weightGoal === "loss") factor -= 0.25;
  if (weightGoal === "gain") factor += 0.25;

  return Math.round(rer * Math.max(0.8, factor));
}

export function calculateDailyGrams({
  mer,
  kcalPer100g,
}: {
  mer: number;
  kcalPer100g?: number | null;
}) {
  if (!hasNumber(kcalPer100g) || Number(kcalPer100g) <= 0) return null;
  return Math.round((mer / Number(kcalPer100g)) * 100);
}

export function calculateCalciumPhosphorusRatio(
  calcium?: number | null,
  phosphorus?: number | null
) {
  if (!hasNumber(calcium) || !hasNumber(phosphorus) || Number(phosphorus) <= 0) {
    return null;
  }

  return Number((Number(calcium) / Number(phosphorus)).toFixed(2));
}

export function detectAllergyConflicts(
  food: FoodProductV2,
  petAllergies?: string[] | null
) {
  const conflicts: string[] = [];

  for (const allergy of petAllergies ?? []) {
    const normalized = allergy.trim().toLowerCase();
    if (!normalized) continue;
    if (hasIngredient(food, [normalized])) conflicts.push(allergy);
  }

  return conflicts;
}

export function detectMedicalConflicts(
  food: FoodProductV2,
  petHealthIssues?: string[] | null
) {
  const warnings: string[] = [];
  const text = (petHealthIssues ?? []).join(" ").toLowerCase();

  if (text.includes("renal") || text.includes("kidney")) {
    warnings.push("Renal cases require veterinary guidance; review phosphorus and sodium.");
  }
  if (text.includes("pancreatitis") && !hasTag(food, ["low_fat"])) {
    warnings.push("Pancreatitis history needs caution with higher-fat foods.");
  }
  if (text.includes("urinary") && food.species === "cat" && !hasTag(food, ["urinary"])) {
    warnings.push("Urinary-sensitive cats need mineral and veterinary review.");
  }

  return warnings;
}

export function evaluateFoodForPet(
  food: FoodProductV2,
  nutrients: FoodNutrientsV2,
  pet: FoodExpertPet
): FoodExpertEvaluation {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const missingData: string[] = [];

  if (food.species !== pet.species) {
    warnings.push("Species mismatch.");
  } else {
    reasons.push("Species matches the pet.");
  }

  const allergyConflicts = detectAllergyConflicts(food, pet.allergies);
  if (allergyConflicts.length > 0) {
    warnings.push(`Ingredient allergy conflict: ${allergyConflicts.join(", ")}.`);
  }

  warnings.push(...detectMedicalConflicts(food, pet.healthIssues));

  if (pet.weightGoal === "loss") {
    if (hasNumber(food.kcal_per_100g) && Number(food.kcal_per_100g) <= 360) {
      reasons.push("Calorie density may support weight control.");
    } else {
      warnings.push("Weight loss requires calorie review and portion control.");
    }
    if (hasNumber(nutrients.fiber_percent) && Number(nutrients.fiber_percent) >= 4) {
      reasons.push("Fiber level may support satiety.");
    }
    if (hasNumber(nutrients.fat_percent) && Number(nutrients.fat_percent) > 18) {
      warnings.push("Fat appears relatively high for a weight-loss goal.");
    }
  }

  if (food.species === "cat" && normalizedIncludes(pet.healthIssues, ["urinary"])) {
    for (const key of ["magnesium_percent", "sodium_percent", "phosphorus_percent"] as const) {
      if (!hasNumber(nutrients[key])) missingData.push(key);
    }
  }

  if (normalizedIncludes(pet.healthIssues, ["renal", "kidney"])) {
    warnings.push("Do not use this as prescription renal advice; veterinary supervision is required.");
    if (hasLongChainOmega3(nutrients)) {
      reasons.push("EPA/DHA are declared, which can support renal fatty-acid context.");
    }
  }

  if (
    pet.lifeStage === "puppy" ||
    pet.lifeStage === "kitten" ||
    food.life_stage === "puppy" ||
    food.life_stage === "kitten"
  ) {
    const ratio = calculateCalciumPhosphorusRatio(
      nutrients.calcium_percent,
      nutrients.phosphorus_percent
    );
    if (ratio === null) {
      missingData.push("calcium_phosphorus_ratio");
    } else if (ratio < 1 || ratio > 2) {
      warnings.push("Calcium/phosphorus ratio needs growth-stage review.");
    } else {
      reasons.push("Calcium/phosphorus ratio appears reasonable.");
    }
    if (pet.dogSize === "large" || pet.dogSize === "giant") {
      warnings.push("Large breed puppy growth requires extra calcium/phosphorus caution.");
    }
    if (hasDha(nutrients)) {
      reasons.push("DHA is declared, which supports growth-stage brain and vision context.");
    }
  }

  if (pet.lifeStage === "senior" || food.life_stage === "senior") {
    reasons.push("Senior pets may benefit from digestibility and moderate calorie review.");
    if (
      hasEpa(nutrients) ||
      hasNumber(nutrients.glucosamine_mgkg) ||
      hasNumber(nutrients.chondroitin_mgkg)
    ) {
      reasons.push("Joint-support nutrients are present.");
    }
  }

  for (const key of [
    "protein_percent",
    "fat_percent",
    "fiber_percent",
    "calcium_percent",
    "phosphorus_percent",
    "sodium_percent",
    "magnesium_percent",
  ] as const) {
    if (!hasNumber(nutrients[key])) missingData.push(key);
  }
  if (!hasNumber(food.kcal_per_100g)) missingData.push("kcal_per_100g");

  const rer = pet.weightKg ? calculateRER(pet.weightKg) : null;
  const mer =
    rer !== null
      ? calculateMER({
          rer,
          species: pet.species,
          neutered: pet.neutered,
          activityLevel: pet.activityLevel,
          lifeStage: pet.lifeStage,
          weightGoal: pet.weightGoal,
        })
      : null;
  const dailyGrams = mer
    ? calculateDailyGrams({ mer, kcalPer100g: food.kcal_per_100g })
    : null;

  const fit =
    food.species !== pet.species || allergyConflicts.length > 0
      ? "not_ideal"
      : warnings.length > 0
        ? "needs_caution"
        : "good_fit";
  const confidence =
    missingData.length >= 5 ? "low" : missingData.length > 0 ? "moderate" : "high";

  return {
    fit,
    confidence,
    reasons: [...new Set(reasons)],
    warnings: [...new Set(warnings)],
    missingData: [...new Set(missingData)],
    dailyGrams,
  };
}

export function explainFoodMatch(
  food: FoodProductV2,
  nutrients: FoodNutrientsV2,
  pet: FoodExpertPet
) {
  const evaluation = evaluateFoodForPet(food, nutrients, pet);

  return [
    `Fit: ${evaluation.fit}`,
    `Confidence: ${evaluation.confidence}`,
    evaluation.reasons.length > 0
      ? `Good fit: ${evaluation.reasons.join(" ")}`
      : "Good fit: no strong positive signals yet.",
    evaluation.warnings.length > 0
      ? `Needs caution: ${evaluation.warnings.join(" ")}`
      : "Needs caution: none detected from available data.",
    evaluation.missingData.length > 0
      ? `Missing data: ${evaluation.missingData.join(", ")}.`
      : "Missing data: none for core fields.",
  ].join("\n");
}
