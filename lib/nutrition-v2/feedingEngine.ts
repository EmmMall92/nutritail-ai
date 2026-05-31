import type { FoodImportRowV2 } from "@/types/food-v2";
import { evaluateGiRules } from "@/lib/nutrition-v2/giRules";
import { evaluateGrowthRules } from "@/lib/nutrition-v2/growthRules";
import { evaluateObesityRules } from "@/lib/nutrition-v2/obesityRules";
import { evaluateRenalRules } from "@/lib/nutrition-v2/renalRules";
import { evaluateSeniorRules } from "@/lib/nutrition-v2/seniorRules";
import { evaluateUrinaryRules } from "@/lib/nutrition-v2/urinaryRules";
import { evaluateVitaminMineralRules } from "@/lib/nutrition-v2/vitaminMineralRules";

export type FeedingGoal =
  | "general"
  | "growth"
  | "weight_control"
  | "renal"
  | "urinary"
  | "sensitive_digestion"
  | "senior";

export type FeedingPlanInput = {
  row: Pick<FoodImportRowV2, "food" | "nutrients">;
  goal?: FeedingGoal;
};

export type FeedingPlan = {
  goal: FeedingGoal;
  confidence: "high" | "medium" | "low";
  boosts: string[];
  cautions: string[];
  missing_data: string[];
  safety_notes: string[];
};

export const FEEDING_ENGINE_SCIENTIFIC_PRINCIPLES = [
  {
    id: "goal_specific_feeding",
    principle:
      "Feeding advice should be goal-specific and should separate normal shopping guidance from medical-risk guidance.",
  },
  {
    id: "safety_interrupts_override_recommendations",
    principle:
      "Urgent renal, urinary, pancreatitis, diabetes or severe GI signs override routine food recommendation flow.",
  },
] as const;

export const FEEDING_ENGINE_DECISION_RULES = [
  {
    id: "one_goal_at_a_time",
    when: ["multiple goals"],
    then: "Prioritize the highest-risk medical goal and explain tradeoffs.",
  },
  {
    id: "missing_data_reduces_confidence",
    when: ["critical food data missing"],
    then: "Return lower confidence and list the missing data.",
  },
] as const;

export const FEEDING_ENGINE_RECOMMENDATION_LOGIC = [
  "Run deterministic rules before writing a human answer.",
  "Return safety notes separately from product fit notes.",
  "Ask for one missing detail at a time when confidence is low.",
] as const;

export const FEEDING_ENGINE_CONTRAINDICATIONS = [
  {
    id: "urgent_symptoms",
    rule:
      "Do not provide ordinary feeding plans for urinary obstruction signs, severe vomiting/diarrhea, blood, not eating or acute collapse.",
  },
] as const;

export const FEEDING_ENGINE_UNCERTAINTY_RULES = [
  {
    id: "estimated_or_review_data",
    rule:
      "Rows with estimated or needs_review data should be used cautiously and should not be presented as verified.",
  },
] as const;

function confidenceFor(missing: string[], cautions: string[]) {
  if (missing.length >= 2 || cautions.length >= 5) return "low";
  if (missing.length > 0 || cautions.length >= 2) return "medium";
  return "high";
}

export function planFeedingRecommendation({
  row,
  goal = "general",
}: FeedingPlanInput): FeedingPlan {
  const boosts: string[] = [];
  const cautions: string[] = [];
  const missing_data: string[] = [];
  const safety_notes: string[] = [];

  const minerals = evaluateVitaminMineralRules(row.food, row.nutrients);
  minerals.forEach((finding) => {
    if (finding.type === "strength") boosts.push(finding.code);
    if (finding.type === "caution") cautions.push(finding.code);
    if (finding.type === "missing") missing_data.push(finding.code);
  });

  if (goal === "growth") {
    const result = evaluateGrowthRules(row.food, row.nutrients);
    boosts.push(...result.findings);
    cautions.push(...result.cautions);
  }
  if (goal === "weight_control") {
    const result = evaluateObesityRules(row.food, row.nutrients);
    boosts.push(...result.boosts);
    cautions.push(...result.cautions);
  }
  if (goal === "renal") {
    const result = evaluateRenalRules(row.food, row.nutrients);
    boosts.push(...result.boosts);
    cautions.push(...result.cautions);
    safety_notes.push("renal_goal_requires_veterinary_context");
  }
  if (goal === "urinary") {
    const result = evaluateUrinaryRules(row.food, row.nutrients);
    boosts.push(...result.boosts);
    cautions.push(...result.cautions);
    safety_notes.push("urinary_goal_requires_symptom_screening");
  }
  if (goal === "sensitive_digestion") {
    const result = evaluateGiRules(row.food, row.nutrients);
    boosts.push(...result.boosts);
    cautions.push(...result.cautions);
  }
  if (goal === "senior") {
    const result = evaluateSeniorRules(row.food, row.nutrients);
    boosts.push(...result.boosts);
    cautions.push(...result.cautions);
  }

  if (row.food.data_quality_status !== "verified") cautions.push("food_data_not_verified");
  if (!row.food.kcal_per_100g && !row.food.kcal_per_kg) missing_data.push("missing_energy");
  if (row.food.source_notes?.includes("kcal_estimated=true")) {
    cautions.push("estimated_energy");
  }

  return {
    goal,
    confidence: confidenceFor(missing_data, cautions),
    boosts: [...new Set(boosts)],
    cautions: [...new Set(cautions)],
    missing_data: [...new Set(missing_data)],
    safety_notes: [...new Set(safety_notes)],
  };
}
