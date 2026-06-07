import { ingredientProfiles, nutrientProfiles } from "@/lib/food-intelligence/profiles";

export type FoodIntelligenceInput = {
  species?: "dog" | "cat" | string | null;
  life_stage?: string | null;
  dog_size?: string | null;
  ingredient_tags?: string[];
  health_tags?: string[];
  medical_tags?: string[];
  data_quality_status?: string | null;
  source_priority?: string | null;
  nutrients?: {
    kcal_per_100g?: number | null;
    protein_percent?: number | null;
    fat_percent?: number | null;
    fiber_percent?: number | null;
    calcium_percent?: number | null;
    phosphorus_percent?: number | null;
    magnesium_percent?: number | null;
    sodium_percent?: number | null;
    epa_percent?: number | null;
    dha_percent?: number | null;
    epa_dha_percent?: number | null;
  };
};

export type FoodIntelligenceResult = {
  score: number;
  confidence_level: "high" | "medium" | "low";
  sub_scores: {
    protein_quality: number;
    ingredient_quality: number;
    caloric_density: number;
    mineral_balance: number;
    life_stage_suitability: number;
  };
  food_strengths: string[];
  food_cautions: string[];
  best_use_cases: string[];
  not_ideal_cases: string[];
};

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function proteinQuality(input: FoodIntelligenceInput) {
  const protein = input.nutrients?.protein_percent;
  const ingredientTags = input.ingredient_tags ?? [];
  let score = 35;

  if (hasNumber(protein)) {
    if (protein >= 24) score += 25;
    else if (protein >= 18) score += 15;
    else score += 5;
  }

  if (
    ingredientTags.some((tag) =>
      ["chicken", "lamb", "salmon", "duck", "beef", "fish", "turkey"].includes(tag)
    )
  ) {
    score += 20;
  }

  return clamp(score);
}

function ingredientQuality(input: FoodIntelligenceInput) {
  const tags = input.ingredient_tags ?? [];
  let score = 45;

  if (tags.length >= 3) score += 15;
  if (tags.includes("digestive_support")) score += 10;
  if (tags.includes("functional_support")) score += 10;
  if (tags.includes("grain_free")) score += 3;

  return clamp(score);
}

function caloricDensity(input: FoodIntelligenceInput) {
  const kcal = input.nutrients?.kcal_per_100g;
  if (!hasNumber(kcal)) return 45;
  if (kcal < 320) return 65;
  if (kcal <= 410) return 80;
  return 55;
}

function mineralBalance(input: FoodIntelligenceInput) {
  const calcium = input.nutrients?.calcium_percent;
  const phosphorus = input.nutrients?.phosphorus_percent;
  const magnesium = input.nutrients?.magnesium_percent;
  const sodium = input.nutrients?.sodium_percent;
  let score = 35;

  if (hasNumber(calcium)) score += 18;
  if (hasNumber(phosphorus)) score += 18;
  if (hasNumber(magnesium)) score += 12;
  if (hasNumber(sodium)) score += 12;

  if (hasNumber(calcium) && hasNumber(phosphorus) && phosphorus > 0) {
    const ratio = calcium / phosphorus;
    if (ratio >= 1 && ratio <= 2) score += 5;
    if (ratio < 0.8 || ratio > 2.2) score -= 15;
  }

  return clamp(score);
}

function lifeStageSuitability(input: FoodIntelligenceInput) {
  const tags = [...(input.health_tags ?? []), ...(input.medical_tags ?? [])];
  let score = 55;

  if (input.life_stage && input.life_stage !== "unknown") score += 15;
  if (input.life_stage === "puppy" && tags.includes("puppy")) score += 15;
  if (input.life_stage === "kitten" && tags.includes("kitten")) score += 15;
  if (input.life_stage === "senior" && tags.includes("senior")) score += 10;
  if (input.dog_size && input.dog_size !== "unknown") score += 5;

  return clamp(score);
}

function confidence(input: FoodIntelligenceInput, score: number): "high" | "medium" | "low" {
  const nutrients = input.nutrients ?? {};
  const knownCore = [
    nutrients.kcal_per_100g,
    nutrients.protein_percent,
    nutrients.fat_percent,
    nutrients.fiber_percent,
  ].filter(hasNumber).length;
  const verified = input.data_quality_status === "verified";

  if (verified && knownCore >= 4 && score >= 70) return "high";
  if (knownCore >= 3 && input.data_quality_status !== "unknown") return "medium";
  return "low";
}

function strengths(input: FoodIntelligenceInput) {
  const tags = input.ingredient_tags ?? [];
  const result: string[] = [];

  for (const profile of ingredientProfiles) {
    if (tags.includes(profile.tag)) result.push(...profile.strengths);
  }

  for (const profile of nutrientProfiles) {
    const field = profile.field as keyof NonNullable<FoodIntelligenceInput["nutrients"]>;
    if (hasNumber(input.nutrients?.[field])) {
      result.push(`${profile.field}: ${profile.role}`);
    }
  }

  if (input.source_priority === "official") result.push("Backed by official source priority.");
  if (input.data_quality_status === "verified") result.push("Verified Food V2 row.");

  return [...new Set(result)].slice(0, 8);
}

function cautions(input: FoodIntelligenceInput) {
  const tags = input.ingredient_tags ?? [];
  const result: string[] = [];

  for (const profile of ingredientProfiles) {
    if (tags.includes(profile.tag)) result.push(...profile.cautions);
  }

  if (!hasNumber(input.nutrients?.kcal_per_100g)) {
    result.push("Calories are missing, so portion guidance is limited.");
  }
  if (!hasNumber(input.nutrients?.calcium_percent) || !hasNumber(input.nutrients?.phosphorus_percent)) {
    result.push("Calcium/phosphorus data is incomplete for growth or renal-sensitive use.");
  }
  if (input.data_quality_status === "needs_review") {
    result.push("Needs review before confident chatbot claims.");
  }

  return [...new Set(result)].slice(0, 8);
}

function bestUseCases(input: FoodIntelligenceInput) {
  return [
    ...(input.health_tags ?? []),
    ...(input.medical_tags ?? []),
    input.life_stage && input.life_stage !== "unknown" ? input.life_stage : "",
  ].filter(Boolean).slice(0, 8);
}

function notIdealCases(input: FoodIntelligenceInput) {
  const cases: string[] = [];
  const fat = input.nutrients?.fat_percent;

  if (hasNumber(fat) && fat >= 18) cases.push("weight_loss_without_portion_control");
  if (!hasNumber(input.nutrients?.phosphorus_percent)) cases.push("renal_decision_without_phosphorus");
  if (!hasNumber(input.nutrients?.magnesium_percent)) cases.push("urinary_decision_without_magnesium");
  if (input.ingredient_tags?.includes("chicken")) cases.push("chicken_allergy");

  return cases;
}

export function evaluateFoodIntelligence(input: FoodIntelligenceInput): FoodIntelligenceResult {
  const subScores = {
    protein_quality: proteinQuality(input),
    ingredient_quality: ingredientQuality(input),
    caloric_density: caloricDensity(input),
    mineral_balance: mineralBalance(input),
    life_stage_suitability: lifeStageSuitability(input),
  };
  const score = clamp(
    subScores.protein_quality * 0.22 +
      subScores.ingredient_quality * 0.2 +
      subScores.caloric_density * 0.18 +
      subScores.mineral_balance * 0.22 +
      subScores.life_stage_suitability * 0.18
  );

  return {
    score,
    confidence_level: confidence(input, score),
    sub_scores: subScores,
    food_strengths: strengths(input),
    food_cautions: cautions(input),
    best_use_cases: bestUseCases(input),
    not_ideal_cases: notIdealCases(input),
  };
}
