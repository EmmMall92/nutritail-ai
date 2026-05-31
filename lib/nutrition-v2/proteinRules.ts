import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";

export type ProteinRuleFinding = {
  type: "strength" | "caution" | "missing";
  code: string;
  message: string;
};

export const PROTEIN_SCIENTIFIC_PRINCIPLES = [
  {
    id: "protein_quality_matters",
    principle:
      "Protein evaluation should consider amount, digestibility signals and source specificity rather than percentage alone.",
  },
  {
    id: "life_stage_changes_need",
    principle:
      "Growth, reproduction and some weight-management plans can increase the importance of adequate protein density.",
  },
  {
    id: "medical_context_changes_interpretation",
    principle:
      "Renal, hepatic and urinary cases require clinical context before a high-protein food is treated as desirable.",
  },
] as const;

export const PROTEIN_DECISION_RULES = [
  {
    id: "missing_protein_blocks_confidence",
    when: ["protein_percent is missing"],
    then: "Do not make confident protein-quality claims.",
  },
  {
    id: "named_animal_sources_improve_transparency",
    when: ["primary animal proteins are named"],
    then: "Raise transparency confidence without claiming clinical superiority.",
  },
  {
    id: "hydrolysed_or_novel_context",
    when: ["food allergy or elimination-trial context"],
    then: "Prefer hydrolysed or carefully selected novel-protein foods under veterinary guidance.",
  },
] as const;

export const PROTEIN_RECOMMENDATION_LOGIC = [
  {
    id: "weight_control",
    logic:
      "For weight control, protein adequacy can support lean mass while kcal and portion control remain primary.",
  },
  {
    id: "growth",
    logic:
      "For puppy/kitten growth, protein should be evaluated alongside energy density and mineral balance.",
  },
] as const;

export const PROTEIN_CONTRAINDICATIONS = [
  {
    id: "renal_disease",
    rule:
      "Do not recommend high-protein foods for renal disease without veterinarian-directed renal diet context.",
  },
  {
    id: "allergy_claims",
    rule:
      "Do not diagnose food allergy from ingredient exposure or symptoms alone.",
  },
] as const;

export const PROTEIN_UNCERTAINTY_RULES = [
  {
    id: "guaranteed_analysis_limits",
    rule:
      "Guaranteed analysis values are label-level values and may not reflect complete amino-acid profile or digestibility.",
  },
] as const;

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function evaluateProteinRules(
  food: Pick<
    FoodProductV2,
    "life_stage" | "primary_animal_proteins" | "ingredient_text" | "medical_tags"
  >,
  nutrients: Pick<FoodNutrientsV2, "protein_percent">
): ProteinRuleFinding[] {
  const findings: ProteinRuleFinding[] = [];

  if (!hasNumber(nutrients.protein_percent)) {
    findings.push({
      type: "missing",
      code: "missing_protein_percent",
      message: "Protein percent is missing, so protein assessment is low confidence.",
    });
    return findings;
  }

  if (nutrients.protein_percent >= 25) {
    findings.push({
      type: "strength",
      code: "moderate_to_high_protein",
      message: "Protein level is useful to consider for maintenance and satiety context.",
    });
  }

  if (food.primary_animal_proteins.length > 0) {
    findings.push({
      type: "strength",
      code: "named_or_detected_animal_proteins",
      message: "Animal protein sources are detectable, improving explanation quality.",
    });
  } else if (food.ingredient_text) {
    findings.push({
      type: "caution",
      code: "low_protein_source_specificity",
      message: "Protein source transparency is limited from the available ingredient text.",
    });
  }

  if (food.medical_tags.includes("renal")) {
    findings.push({
      type: "caution",
      code: "renal_context_requires_vet",
      message: "Renal cases need veterinarian-directed diet selection.",
    });
  }

  return findings;
}
