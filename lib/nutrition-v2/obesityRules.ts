import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";

export const OBESITY_SCIENTIFIC_PRINCIPLES = [
  {
    id: "calorie_balance_drives_weight",
    principle:
      "Weight gain and loss are primarily driven by energy balance, with satiety and lean-mass support influencing adherence.",
  },
  {
    id: "sterilisation_can_reduce_energy_need",
    principle:
      "Sterilised pets often need closer portion control and energy monitoring.",
  },
] as const;

export const OBESITY_DECISION_RULES = [
  {
    id: "energy_required_for_portions",
    when: ["weight loss or obesity goal"],
    then: "Require kcal data or transparent estimated kcal before portion guidance.",
  },
  {
    id: "satiety_signals_help",
    when: ["fiber present", "protein adequate"],
    then: "Use as supportive signals, not as substitutes for calorie control.",
  },
] as const;

export const OBESITY_RECOMMENDATION_LOGIC = [
  "Prefer foods with clear kcal, moderate fat, useful protein and fiber/satiety signals.",
  "Ask about treats and current portion when weight control is the goal.",
] as const;

export const OBESITY_CONTRAINDICATIONS = [
  {
    id: "rapid_weight_loss",
    rule:
      "Do not recommend aggressive calorie restriction, especially for cats, without veterinary monitoring.",
  },
] as const;

export const OBESITY_UNCERTAINTY_RULES = [
  {
    id: "missing_weight_or_bcs",
    rule:
      "If weight, ideal weight or body condition is unknown, give only general portion-control guidance.",
  },
] as const;

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function evaluateObesityRules(
  food: Pick<FoodProductV2, "kcal_per_100g" | "commercial_tags" | "medical_tags">,
  nutrients: Pick<FoodNutrientsV2, "protein_percent" | "fat_percent" | "fiber_percent">
) {
  const boosts: string[] = [];
  const cautions: string[] = [];

  if (food.commercial_tags.includes("weight_control") || food.medical_tags.includes("obesity")) {
    boosts.push("weight_control_positioning");
  }
  if (hasNumber(food.kcal_per_100g) && food.kcal_per_100g <= 360) boosts.push("lower_energy_density");
  if (hasNumber(nutrients.fiber_percent) && nutrients.fiber_percent >= 4) boosts.push("satiety_fiber_signal");
  if (hasNumber(nutrients.protein_percent) && nutrients.protein_percent >= 25) boosts.push("lean_mass_support_signal");

  if (!hasNumber(food.kcal_per_100g)) cautions.push("missing_energy_for_weight_control");
  if (hasNumber(nutrients.fat_percent) && nutrients.fat_percent >= 20) cautions.push("higher_fat_density");

  return { boosts, cautions };
}
