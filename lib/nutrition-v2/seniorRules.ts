import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";
import type { Pet } from "@/types/pet";

export type SeniorFitSignal = {
  type: "boost" | "caution" | "exclude";
  code: string;
  points: number;
  message: string;
};

export type SeniorFitInput = {
  food: Pick<FoodProductV2, "life_stage" | "kcal_per_100g" | "medical_tags">;
  nutrients: Pick<
    FoodNutrientsV2,
    | "protein_percent"
    | "fat_percent"
    | "fiber_percent"
    | "epa_percent"
    | "epa_dha_percent"
    | "glucosamine_mgkg"
    | "chondroitin_mgkg"
  >;
  pet: Pick<Pet, "activityLevel"> & {
    healthIssues?: string[];
  };
  stage: "puppy" | "kitten" | "adult" | "senior";
  goal: "general" | "weight_control" | "sterilised" | "senior";
  positioning: {
    senior: boolean;
    active: boolean;
    weightControl: boolean;
  };
};

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
  "Do not assume every senior pet needs light food; weight trend and appetite should guide the framing.",
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

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function healthText(healthIssues: string[] | undefined) {
  return (healthIssues ?? []).join(" ").toLowerCase();
}

export function evaluateSeniorFitRules(input: SeniorFitInput) {
  const signals: SeniorFitSignal[] = [];
  const { food, goal, nutrients, pet, positioning, stage } = input;
  const seniorContext = goal === "senior" || stage === "senior";
  const text = healthText(pet.healthIssues);
  const hasMobilityContext = /joint|arthritis|mobility|hip|elbow|αρθρ|ισχι|χιαστ/.test(text);
  const lowActivitySenior = seniorContext && pet.activityLevel === "low";
  const appetiteOrWeightLossConcern = /appetite|anorexia|not eating|weight loss|losing weight|ορεξ|ανορεξ|χανει/.test(text);

  if (!seniorContext && !hasMobilityContext) return signals;

  if (seniorContext && positioning.senior) {
    signals.push({
      type: "boost",
      code: "senior_positioning",
      points: 20,
      message: "Positioned for senior pets.",
    });
  } else if (stage === "senior") {
    signals.push({
      type: "caution",
      code: "adult_formula_for_senior_pet",
      points: -10,
      message: "Adult food is less specific than a senior-positioned formula.",
    });
  }

  if (
    hasNumber(nutrients.epa_percent) ||
    hasNumber(nutrients.epa_dha_percent) ||
    hasNumber(nutrients.glucosamine_mgkg) ||
    hasNumber(nutrients.chondroitin_mgkg)
  ) {
    signals.push({
      type: "boost",
      code: "senior_mobility_support_signal",
      points: hasMobilityContext ? 10 : 6,
      message: "Declared mobility-support nutrients improve senior fit.",
    });
  }

  if (hasNumber(nutrients.protein_percent) && nutrients.protein_percent >= 24) {
    signals.push({
      type: "boost",
      code: "senior_protein_support",
      points: 5,
      message: "Protein level supports senior muscle-condition monitoring.",
    });
  } else if (!hasNumber(nutrients.protein_percent)) {
    signals.push({
      type: "caution",
      code: "senior_missing_protein",
      points: -8,
      message: "Senior recommendations are weaker without protein data.",
    });
  }

  if (lowActivitySenior && positioning.weightControl) {
    signals.push({
      type: "boost",
      code: "senior_low_activity_weight_awareness",
      points: 8,
      message: "Weight-aware positioning can help a low-activity senior pet.",
    });
  }

  if (
    lowActivitySenior &&
    positioning.active &&
    hasNumber(food.kcal_per_100g) &&
    food.kcal_per_100g >= 380
  ) {
    signals.push({
      type: "exclude",
      code: "senior_active_energy_mismatch",
      points: -100,
      message:
        "Excluded because active/high-energy food is not a first pick for a low-activity senior pet.",
    });
  }

  if (
    lowActivitySenior &&
    !positioning.weightControl &&
    hasNumber(nutrients.fat_percent) &&
    nutrients.fat_percent >= 18
  ) {
    signals.push({
      type: "caution",
      code: "senior_low_activity_high_fat",
      points: -12,
      message: "Fat looks high for a low-activity senior pet.",
    });
  }

  if (appetiteOrWeightLossConcern) {
    signals.push({
      type: "caution",
      code: "senior_appetite_weight_loss_vet_context",
      points: -12,
      message:
        "Reduced appetite or unexplained weight loss in senior pets needs veterinary context before food swapping.",
    });
  }

  if (food.medical_tags.includes("renal")) {
    signals.push({
      type: "caution",
      code: "senior_renal_context_requires_vet",
      points: -16,
      message: "Renal-positioned senior choices need veterinarian-directed context.",
    });
  }

  return signals;
}
