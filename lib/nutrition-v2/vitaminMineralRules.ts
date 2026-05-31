import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";

export type MineralFinding = {
  type: "strength" | "caution" | "missing";
  code: string;
  message: string;
};

export const VITAMIN_MINERAL_SCIENTIFIC_PRINCIPLES = [
  {
    id: "minerals_matter_for_growth_and_urinary",
    principle:
      "Calcium, phosphorus, sodium and magnesium are high-impact minerals for growth, urinary and renal interpretation.",
  },
  {
    id: "ca_p_ratio_context",
    principle:
      "Calcium and phosphorus should be interpreted together, especially for growing large-breed dogs.",
  },
  {
    id: "micronutrients_support_complete_diets",
    principle:
      "Vitamin and trace-mineral additives support completeness, but individual values rarely justify medical claims alone.",
  },
] as const;

export const VITAMIN_MINERAL_DECISION_RULES = [
  {
    id: "large_breed_growth_needs_ca_p",
    when: ["puppy", "large or giant size"],
    then: "Require calcium and phosphorus before confident growth recommendation.",
  },
  {
    id: "urinary_needs_mineral_context",
    when: ["urinary tag or urinary user goal"],
    then: "Check magnesium, phosphorus, sodium and veterinary positioning before recommendation.",
  },
] as const;

export const VITAMIN_MINERAL_RECOMMENDATION_LOGIC = [
  "Use mineral completeness to decide confidence before explaining urinary, renal or growth suitability.",
  "Treat missing minerals as a data-quality limitation, not as proof that a food is unsuitable.",
] as const;

export const VITAMIN_MINERAL_CONTRAINDICATIONS = [
  {
    id: "growth_without_minerals",
    rule:
      "Do not confidently recommend large-breed puppy foods when calcium and phosphorus are missing.",
  },
  {
    id: "renal_without_phosphorus",
    rule:
      "Do not evaluate renal suitability when phosphorus is missing unless a veterinarian-prescribed renal formula is clearly identified.",
  },
] as const;

export const VITAMIN_MINERAL_UNCERTAINTY_RULES = [
  {
    id: "mineral_absence_is_unknown",
    rule:
      "A missing mineral value means unknown, not zero.",
  },
] as const;

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function calciumPhosphorusRatio(nutrients: FoodNutrientsV2) {
  if (!hasNumber(nutrients.calcium_percent) || !hasNumber(nutrients.phosphorus_percent)) {
    return null;
  }
  if (nutrients.phosphorus_percent <= 0) return null;
  return Math.round((nutrients.calcium_percent / nutrients.phosphorus_percent) * 100) / 100;
}

export function evaluateVitaminMineralRules(
  food: Pick<FoodProductV2, "life_stage" | "dog_size" | "medical_tags">,
  nutrients: FoodNutrientsV2
): MineralFinding[] {
  const findings: MineralFinding[] = [];
  const ratio = calciumPhosphorusRatio(nutrients);

  if (!hasNumber(nutrients.calcium_percent)) {
    findings.push({
      type: "missing",
      code: "missing_calcium_percent",
      message: "Calcium is missing, lowering growth and mineral-balance confidence.",
    });
  }
  if (!hasNumber(nutrients.phosphorus_percent)) {
    findings.push({
      type: "missing",
      code: "missing_phosphorus_percent",
      message: "Phosphorus is missing, lowering renal/growth confidence.",
    });
  }

  if (ratio !== null && ratio >= 1 && ratio <= 2) {
    findings.push({
      type: "strength",
      code: "ca_p_ratio_available",
      message: "Calcium-to-phosphorus context is available for review.",
    });
  } else if (ratio !== null) {
    findings.push({
      type: "caution",
      code: "ca_p_ratio_needs_review",
      message: "Calcium-to-phosphorus ratio needs manual review before confident recommendation.",
    });
  }

  if (
    food.life_stage === "puppy" &&
    ["large", "giant"].includes(food.dog_size ?? "") &&
    (!hasNumber(nutrients.calcium_percent) || !hasNumber(nutrients.phosphorus_percent))
  ) {
    findings.push({
      type: "caution",
      code: "large_breed_puppy_missing_minerals",
      message: "Large-breed puppy assessment needs calcium and phosphorus.",
    });
  }

  if (
    food.medical_tags.includes("urinary") &&
    (!hasNumber(nutrients.magnesium_percent) || !hasNumber(nutrients.sodium_percent))
  ) {
    findings.push({
      type: "missing",
      code: "urinary_minerals_incomplete",
      message: "Urinary interpretation is limited without magnesium and sodium.",
    });
  }

  return findings;
}
