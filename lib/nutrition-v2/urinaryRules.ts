import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";

export const URINARY_SCIENTIFIC_PRINCIPLES = [
  {
    id: "urinary_requires_condition_specificity",
    principle:
      "Urinary diet logic depends on species, symptoms, stone/crystal type and veterinary diagnosis.",
  },
  {
    id: "male_cat_blockage_is_urgent",
    principle:
      "Possible urinary obstruction in cats is an emergency signal and should interrupt shopping-mode recommendations.",
  },
] as const;

export const URINARY_DECISION_RULES = [
  {
    id: "blockage_escalation",
    when: ["cat", "straining", "little/no urine", "pain", "blood"],
    then: "Stop food comparison and direct urgent veterinary care.",
  },
  {
    id: "urinary_food_needs_minerals",
    when: ["urinary recommendation"],
    then: "Check magnesium, phosphorus, sodium and veterinary positioning.",
  },
] as const;

export const URINARY_RECOMMENDATION_LOGIC = [
  "For non-urgent urinary support, prefer clearly urinary-positioned formulas with strong source quality.",
  "Mention hydration and veterinary follow-up rather than mineral-only reasoning.",
] as const;

export const URINARY_CONTRAINDICATIONS = [
  {
    id: "suspected_obstruction",
    rule:
      "Do not recommend a food as a substitute for urgent care when obstruction signs are present.",
  },
] as const;

export const URINARY_UNCERTAINTY_RULES = [
  {
    id: "unknown_stone_type",
    rule:
      "Without diagnosis or stone/crystal type, urinary food advice must stay cautious.",
  },
] as const;

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function evaluateUrinaryRules(
  food: Pick<FoodProductV2, "species" | "medical_tags" | "source_priority">,
  nutrients: Pick<FoodNutrientsV2, "magnesium_percent" | "phosphorus_percent" | "sodium_percent">
) {
  const boosts: string[] = [];
  const cautions: string[] = [];

  if (food.medical_tags.includes("urinary")) boosts.push("urinary_formula_positioning");
  if (!hasNumber(nutrients.magnesium_percent)) cautions.push("missing_magnesium_for_urinary_review");
  if (!hasNumber(nutrients.phosphorus_percent)) cautions.push("missing_phosphorus_for_urinary_review");
  if (food.source_priority !== "official") cautions.push("urinary_claim_needs_strong_source");

  return { boosts, cautions };
}
