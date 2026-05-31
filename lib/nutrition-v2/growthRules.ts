import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";

export const GROWTH_SCIENTIFIC_PRINCIPLES = [
  {
    id: "growth_is_not_maximum_speed",
    principle:
      "Healthy growth aims for controlled, appropriate growth rather than maximum speed.",
  },
  {
    id: "large_breed_mineral_control",
    principle:
      "Large and giant-breed puppies need careful energy and calcium/phosphorus review.",
  },
] as const;

export const GROWTH_DECISION_RULES = [
  {
    id: "puppy_food_for_puppies",
    when: ["pet is puppy or kitten"],
    then: "Prefer matching growth life-stage foods unless veterinarian directs otherwise.",
  },
  {
    id: "large_breed_puppy_requires_mineral_data",
    when: ["large/giant puppy", "calcium or phosphorus missing"],
    then: "Ask for label/official data before confident recommendation.",
  },
] as const;

export const GROWTH_RECOMMENDATION_LOGIC = [
  "Prioritize life-stage match, controlled kcal density and mineral completeness.",
  "Avoid encouraging overfeeding for faster growth.",
] as const;

export const GROWTH_CONTRAINDICATIONS = [
  {
    id: "adult_food_for_growth",
    rule:
      "Do not recommend adult maintenance food as the default for puppies or kittens.",
  },
] as const;

export const GROWTH_UNCERTAINTY_RULES = [
  {
    id: "unknown_size",
    rule:
      "If adult size is unknown, ask for breed/expected adult weight before large-breed puppy advice.",
  },
] as const;

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function evaluateGrowthRules(
  food: Pick<FoodProductV2, "species" | "life_stage" | "dog_size" | "kcal_per_100g">,
  nutrients: Pick<FoodNutrientsV2, "calcium_percent" | "phosphorus_percent">
) {
  const findings: string[] = [];
  const cautions: string[] = [];

  if (["puppy", "kitten", "all_life_stages"].includes(food.life_stage)) {
    findings.push("growth_life_stage_signal");
  }

  if (
    food.life_stage === "puppy" &&
    ["large", "giant"].includes(food.dog_size ?? "") &&
    (!hasNumber(nutrients.calcium_percent) || !hasNumber(nutrients.phosphorus_percent))
  ) {
    cautions.push("large_breed_puppy_missing_ca_p");
  }

  if (food.life_stage === "puppy" && hasNumber(food.kcal_per_100g) && food.kcal_per_100g > 430) {
    cautions.push("high_energy_density_for_growth_review");
  }

  return { findings, cautions };
}
