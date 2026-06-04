import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";

export const SENIOR_SCIENTIFIC_PRINCIPLES = [
  {
    id: "senior_is_individual",
    principle:
      "Senior pets differ widely; weight trend, appetite, muscle condition and disease status matter more than age alone.",
  },
  {
    id: "avoid_assuming_light",
    principle:
      "Senior does not automatically mean weight-loss food; some older pets need calorie or protein support.",
  },
  {
    id: "epa_supports_senior_mobility_context",
    principle:
      "Declared EPA is a useful fatty-acid signal for senior mobility, joint, skin and inflammatory-context explanations.",
  },
] as const;

export const SENIOR_DECISION_RULES = [
  {
    id: "ask_weight_trend",
    when: ["senior pet recommendation"],
    then: "Ask whether the pet is gaining, stable or losing weight.",
  },
  {
    id: "senior_with_weight_loss",
    when: ["senior", "weight loss or poor appetite"],
    then: "Recommend veterinary check before diet optimisation.",
  },
  {
    id: "epa_joint_context",
    when: ["senior or joint-support context", "epa_percent or epa_dha_percent exists"],
    then: "Add a cautious mobility/joint-support explanation without claiming treatment; use lower precision when only combined EPA+DHA is available.",
  },
] as const;

export const SENIOR_RECOMMENDATION_LOGIC = [
  "Use senior formulas when they match the pet's weight trend, digestion and medical context.",
  "Use EPA, glucosamine or chondroitin as supportive mobility signals when declared.",
  "Prioritize palatability and monitoring when appetite is reduced.",
] as const;

export const SENIOR_CONTRAINDICATIONS = [
  {
    id: "unexplained_weight_loss",
    rule:
      "Unexplained senior weight loss should not be solved with a casual food swap.",
  },
] as const;

export const SENIOR_UNCERTAINTY_RULES = [
  {
    id: "age_without_context",
    rule:
      "Age alone is insufficient for confident senior nutrition recommendations.",
  },
] as const;

export function evaluateSeniorRules(
  food: Pick<FoodProductV2, "life_stage" | "commercial_tags" | "medical_tags">,
  nutrients: Pick<
    FoodNutrientsV2,
    | "protein_percent"
    | "fat_percent"
    | "epa_percent"
    | "epa_dha_percent"
    | "glucosamine_mgkg"
    | "chondroitin_mgkg"
  >
) {
  const boosts: string[] = [];
  const cautions: string[] = [];

  if (food.life_stage === "senior" || food.commercial_tags.includes("senior")) {
    boosts.push("senior_positioning");
  }
  if (
    typeof nutrients.epa_percent === "number" ||
    typeof nutrients.epa_dha_percent === "number" ||
    typeof nutrients.glucosamine_mgkg === "number" ||
    typeof nutrients.chondroitin_mgkg === "number"
  ) {
    boosts.push("senior_mobility_support_signal");
  }
  if (typeof nutrients.protein_percent !== "number") cautions.push("missing_protein_for_senior_review");
  if (food.medical_tags.includes("renal")) cautions.push("senior_renal_context_requires_vet");

  return { boosts, cautions };
}
