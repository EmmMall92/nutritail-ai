import type { FoodImportRowV2, FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";
import { evaluateCarbohydrateRules } from "@/lib/nutrition-v2/carbohydrateRules";
import { evaluateFatRules } from "@/lib/nutrition-v2/fatRules";
import { evaluateProteinRules } from "@/lib/nutrition-v2/proteinRules";

export type FoodEvaluationConfidence = "high" | "medium" | "low";

export type FoodEvaluationFinding = {
  category: "protein" | "fat" | "carbohydrate" | "data_quality";
  type: "strength" | "caution" | "missing";
  code: string;
  message: string;
};

export type FoodEvaluationResult = {
  confidence: FoodEvaluationConfidence;
  strengths: FoodEvaluationFinding[];
  cautions: FoodEvaluationFinding[];
  missing_data: FoodEvaluationFinding[];
  contraindications: FoodEvaluationFinding[];
  recommendation_logic: string[];
};

export const FOOD_EVALUATION_SCIENTIFIC_PRINCIPLES = [
  {
    id: "evaluate_fit_not_absolute_quality",
    principle:
      "Food evaluation should judge fit for the pet, goal and data quality rather than declaring universal best/worst foods.",
  },
  {
    id: "data_quality_controls_confidence",
    principle:
      "Missing kcal, protein, fat, fiber or ingredient data should reduce confidence and may require admin review.",
  },
  {
    id: "medical_claims_need_guardrails",
    principle:
      "Medical conditions change food interpretation and may require veterinary referral before recommendations.",
  },
] as const;

export const FOOD_EVALUATION_DECISION_RULES = [
  {
    id: "separate_strengths_from_cautions",
    when: ["food has both useful signals and risks"],
    then: "Return both strengths and cautions instead of collapsing into one score.",
  },
  {
    id: "missing_core_data_lowers_confidence",
    when: ["kcal, macros or ingredients are missing"],
    then: "Lower confidence and list the exact missing fields.",
  },
  {
    id: "needs_review_is_not_bad",
    when: ["data_quality_status is needs_review"],
    then: "Allow cautious evaluation, but do not surface as verified.",
  },
] as const;

export const FOOD_EVALUATION_RECOMMENDATION_LOGIC = [
  "Use deterministic nutrition findings before LLM phrasing.",
  "Prefer official or label-backed values over estimates.",
  "Explain uncertainty when nutrient values are missing or estimated.",
] as const;

export const FOOD_EVALUATION_CONTRAINDICATIONS = [
  {
    id: "urgent_or_complex_medical_case",
    rule:
      "Do not let generic food scoring override renal, urinary blockage, pancreatitis, diabetes or severe GI red flags.",
  },
] as const;

export const FOOD_EVALUATION_UNCERTAINTY_RULES = [
  {
    id: "estimated_energy",
    rule:
      "Estimated energy can support preview and comparison, but portion advice should mention that it is calculated.",
  },
  {
    id: "retailer_source",
    rule:
      "Retailer-source rows should remain needs_review unless corroborated by official or label evidence.",
  },
] as const;

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function categoryFinding(
  category: FoodEvaluationFinding["category"],
  finding: Omit<FoodEvaluationFinding, "category">
): FoodEvaluationFinding {
  return { category, ...finding };
}

function dataQualityFindings(food: FoodProductV2, nutrients: FoodNutrientsV2) {
  const findings: FoodEvaluationFinding[] = [];

  if (!hasNumber(food.kcal_per_100g) && !hasNumber(food.kcal_per_kg)) {
    findings.push({
      category: "data_quality",
      type: "missing",
      code: "missing_energy",
      message: "Energy density is missing, limiting portion and weight-control guidance.",
    });
  }

  if (!food.ingredient_text && food.ingredients.length === 0) {
    findings.push({
      category: "data_quality",
      type: "missing",
      code: "missing_ingredients",
      message: "Ingredient data is missing, limiting explainability.",
    });
  }

  if (food.data_quality_status !== "verified") {
    findings.push({
      category: "data_quality",
      type: "caution",
      code: "not_verified",
      message: "This row is not verified and should be used with caution.",
    });
  }

  if (food.source_priority === "retailer") {
    findings.push({
      category: "data_quality",
      type: "caution",
      code: "retailer_source",
      message: "Retailer-source nutrition should stay in review until corroborated.",
    });
  }

  if (
    !hasNumber(nutrients.protein_percent) ||
    !hasNumber(nutrients.fat_percent) ||
    !hasNumber(nutrients.fiber_percent)
  ) {
    findings.push({
      category: "data_quality",
      type: "missing",
      code: "missing_core_macros",
      message: "Core macro data is incomplete.",
    });
  }

  return findings;
}

function confidenceFor(findings: FoodEvaluationFinding[]): FoodEvaluationConfidence {
  const missing = findings.filter((finding) => finding.type === "missing").length;
  const cautions = findings.filter((finding) => finding.type === "caution").length;

  if (missing >= 2) return "low";
  if (missing === 1 || cautions >= 3) return "medium";
  return "high";
}

export function evaluateFoodV2(row: Pick<FoodImportRowV2, "food" | "nutrients">) {
  const protein = evaluateProteinRules(row.food, row.nutrients).map((finding) =>
    categoryFinding("protein", finding)
  );
  const fat = evaluateFatRules(row.food, row.nutrients).map((finding) =>
    categoryFinding("fat", finding)
  );
  const carbohydrate = evaluateCarbohydrateRules(row.food, row.nutrients).map(
    (finding) => categoryFinding("carbohydrate", finding)
  );
  const findings = [
    ...protein,
    ...fat,
    ...carbohydrate,
    ...dataQualityFindings(row.food, row.nutrients),
  ];

  const contraindications = findings.filter((finding) =>
    /requires_vet|diabetes|renal|pancreatitis/.test(finding.code)
  );

  return {
    confidence: confidenceFor(findings),
    strengths: findings.filter((finding) => finding.type === "strength"),
    cautions: findings.filter((finding) => finding.type === "caution"),
    missing_data: findings.filter((finding) => finding.type === "missing"),
    contraindications,
    recommendation_logic: [...FOOD_EVALUATION_RECOMMENDATION_LOGIC],
  } satisfies FoodEvaluationResult;
}
