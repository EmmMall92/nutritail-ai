import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";
import { hasLongChainOmega3Signal } from "@/lib/nutrition-v2/fatRules";

export const RENAL_SCIENTIFIC_PRINCIPLES = [
  {
    id: "renal_is_veterinary_context",
    principle:
      "Kidney disease diet choice depends on diagnosis, stage, appetite, body condition and monitoring.",
  },
  {
    id: "phosphorus_is_key_signal",
    principle:
      "Phosphorus is a key nutrient to review in renal diet context.",
  },
  {
    id: "epa_dha_are_supportive_not_prescriptive",
    principle:
      "EPA/DHA can be useful supportive signals in renal-support context, but they do not replace renal diagnosis, staging, phosphorus control or veterinary supervision.",
  },
] as const;

export const RENAL_DECISION_RULES = [
  {
    id: "refer_for_diagnosed_renal",
    when: ["user mentions renal, kidney, creatinine, CKD"],
    then: "Use veterinary referral framing and avoid OTC certainty.",
  },
  {
    id: "missing_phosphorus_blocks_renal_confidence",
    when: ["phosphorus missing"],
    then: "Do not make confident renal suitability claims.",
  },
  {
    id: "epa_dha_supports_renal_context",
    when: ["renal formula or renal question", "epa_percent or dha_percent exists"],
    then: "Mention EPA/DHA as supportive fatty-acid evidence while keeping veterinary supervision language.",
  },
] as const;

export const RENAL_RECOMMENDATION_LOGIC = [
  "Prioritize veterinarian-prescribed renal formulas when kidney disease is diagnosed.",
  "Use EPA/DHA as supportive context only after renal positioning, phosphorus and sodium are reviewed.",
  "Discuss appetite and weight trend as safety context before diet switching.",
] as const;

export const RENAL_CONTRAINDICATIONS = [
  {
    id: "poor_appetite_or_weight_loss",
    rule:
      "Renal pet with poor appetite, vomiting or weight loss should be directed to a veterinarian promptly.",
  },
] as const;

export const RENAL_UNCERTAINTY_RULES = [
  {
    id: "no_lab_values",
    rule:
      "Without diagnosis/stage/lab context, only general guidance is appropriate.",
  },
] as const;

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function evaluateRenalRules(
  food: Pick<FoodProductV2, "medical_tags" | "source_priority">,
  nutrients: Pick<
    FoodNutrientsV2,
    "phosphorus_percent" | "protein_percent" | "sodium_percent" | "epa_percent" | "dha_percent"
  >
) {
  const boosts: string[] = [];
  const cautions: string[] = [];

  if (food.medical_tags.includes("renal")) boosts.push("renal_formula_positioning");
  if (hasLongChainOmega3Signal(nutrients)) boosts.push("epa_dha_renal_support_signal");
  if (!hasNumber(nutrients.phosphorus_percent)) cautions.push("missing_phosphorus_for_renal_review");
  if (!food.medical_tags.includes("renal") && hasNumber(nutrients.protein_percent) && nutrients.protein_percent >= 30) {
    cautions.push("high_protein_not_renal_default");
  }
  if (food.source_priority !== "official") cautions.push("renal_claim_needs_strong_source");

  return { boosts, cautions };
}
