import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";

export const GI_SCIENTIFIC_PRINCIPLES = [
  {
    id: "gi_cases_need_history",
    principle:
      "Digestive sensitivity requires symptom duration, severity, transition history and veterinary context.",
  },
  {
    id: "fiber_and_digestibility_signals",
    principle:
      "Fiber sources, prebiotics and hydrolysed/easily digestible protein signals can support GI explanations.",
  },
] as const;

export const GI_DECISION_RULES = [
  {
    id: "red_flags_escalate",
    when: ["blood", "severe vomiting", "severe diarrhea", "not eating", "weight loss"],
    then: "Refer to veterinarian instead of product shopping.",
  },
  {
    id: "transition_first",
    when: ["mild GI issue after food change"],
    then: "Discuss gradual transition and monitoring before declaring intolerance.",
  },
] as const;

export const GI_RECOMMENDATION_LOGIC = [
  "Prefer clear digestive-support formulas or simple tolerated proteins when symptoms are mild and non-urgent.",
  "Explain that food allergy diagnosis needs elimination-trial logic, not guesswork.",
] as const;

export const GI_CONTRAINDICATIONS = [
  {
    id: "acute_severe_gi",
    rule:
      "Severe, persistent or bloody GI signs should not be handled as simple food selection.",
  },
] as const;

export const GI_UNCERTAINTY_RULES = [
  {
    id: "symptoms_are_not_diagnosis",
    rule:
      "Gas, scratching, vomiting or diarrhea do not prove food allergy by themselves.",
  },
] as const;

function textIncludesAny(values: string[], patterns: RegExp[]) {
  return values.some((value) => patterns.some((pattern) => pattern.test(value)));
}

export function evaluateGiRules(
  food: Pick<FoodProductV2, "medical_tags" | "commercial_tags" | "fiber_sources" | "primary_animal_proteins">,
  nutrients: Pick<FoodNutrientsV2, "fiber_percent">
) {
  const boosts: string[] = [];
  const cautions: string[] = [];

  if (food.medical_tags.includes("gi_support") || food.commercial_tags.includes("sensitive_digestion")) {
    boosts.push("digestive_support_positioning");
  }
  if (food.fiber_sources.length > 0 || typeof nutrients.fiber_percent === "number") {
    boosts.push("fiber_context_available");
  }
  if (
    textIncludesAny(food.primary_animal_proteins, [/hydro/i, /υδρο/i]) ||
    food.medical_tags.includes("allergy")
  ) {
    boosts.push("allergy_or_hydrolysed_context");
  }
  if (!food.fiber_sources.length && typeof nutrients.fiber_percent !== "number") {
    cautions.push("missing_fiber_context");
  }

  return { boosts, cautions };
}
