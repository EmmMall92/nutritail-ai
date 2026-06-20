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
  {
    id: "symptom_pattern_changes_gi_fit",
    principle:
      "Soft stool, gas, vomiting and sensitivity patterns should shift scoring toward digestive positioning, digestible carbohydrates, prebiotics, and measured fiber context.",
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
  {
    id: "digestibility_support_before_generic_food",
    when: ["soft stool", "gas", "morning vomiting", "sensitive stomach"],
    then: "Prefer GI-positioned foods or foods with digestibility-support signals before generic adult foods.",
  },
  {
    id: "fiber_context_must_match_symptom",
    when: ["chronic soft stool or constipation"],
    then: "Use fiber percentage and fiber/prebiotic sources as support signals, not as diagnosis.",
  },
] as const;

export const GI_RECOMMENDATION_LOGIC = [
  "Prefer clear digestive-support formulas or simple tolerated proteins when symptoms are mild and non-urgent.",
  "For soft stool, gas or sensitive stomach, favor digestibility support such as rice, prebiotics, psyllium, beet pulp, chicory, hydrolysed protein or measured moderate fiber.",
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

function allText(
  food: Pick<
    FoodProductV2,
    "medical_tags" | "commercial_tags" | "fiber_sources" | "primary_animal_proteins"
  >
) {
  return [
    ...(food.medical_tags ?? []),
    ...(food.commercial_tags ?? []),
    ...(food.fiber_sources ?? []),
    ...(food.primary_animal_proteins ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

export function evaluateGiRules(
  food: Pick<
    FoodProductV2,
    "medical_tags" | "commercial_tags" | "fiber_sources" | "primary_animal_proteins"
  >,
  nutrients: Pick<FoodNutrientsV2, "fiber_percent">
) {
  const boosts: string[] = [];
  const cautions: string[] = [];
  const text = allText(food);

  if (
    food.medical_tags.includes("gi_support") ||
    food.commercial_tags.includes("sensitive_digestion")
  ) {
    boosts.push("digestive_support_positioning");
  }
  if (food.fiber_sources.length > 0 || typeof nutrients.fiber_percent === "number") {
    boosts.push("fiber_context_available");
  }
  if (/rice|oat|barley|psyllium|beet|chicory|inulin|fos|mos|prebiotic|yeast/.test(text)) {
    boosts.push("digestibility_support_context");
  }
  if (
    typeof nutrients.fiber_percent === "number" &&
    nutrients.fiber_percent >= 2 &&
    nutrients.fiber_percent <= 6
  ) {
    boosts.push("measured_moderate_fiber_context");
  }
  if (
    textIncludesAny(food.primary_animal_proteins, [/hydro/i, /hydroly/i]) ||
    food.medical_tags.includes("allergy")
  ) {
    boosts.push("allergy_or_hydrolysed_context");
  }
  if (typeof nutrients.fiber_percent === "number" && nutrients.fiber_percent > 8) {
    cautions.push("very_high_fiber_for_gi_review");
  }
  if (!food.fiber_sources.length && typeof nutrients.fiber_percent !== "number") {
    cautions.push("missing_fiber_context");
  }

  return { boosts, cautions };
}
