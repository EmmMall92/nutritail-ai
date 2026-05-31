import type { FoodFormat, FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";

export type CarbohydrateRuleFinding = {
  type: "strength" | "caution" | "missing";
  code: string;
  message: string;
};

export type CarbohydrateEstimateInput = Pick<
  FoodNutrientsV2,
  "protein_percent" | "fat_percent" | "fiber_percent" | "ash_percent" | "moisture_percent"
> & {
  format?: FoodFormat | null;
};

export const CARBOHYDRATE_SCIENTIFIC_PRINCIPLES = [
  {
    id: "carbohydrates_are_not_only_grains",
    principle:
      "Grain-free does not mean carbohydrate-free; starch can come from potato, peas, legumes or other plant sources.",
  },
  {
    id: "fiber_changes_energy_density",
    principle:
      "Fiber can reduce energy density and support stool quality, but the type and amount matter.",
  },
  {
    id: "nfe_is_estimated_by_difference",
    principle:
      "Soluble carbohydrate is commonly estimated by difference when proximate analysis values are available.",
  },
] as const;

export const CARBOHYDRATE_DECISION_RULES = [
  {
    id: "estimate_by_difference",
    when: ["protein/fat/fiber/ash/moisture are available"],
    then: "Estimate carbohydrate percent by subtracting proximate components from 100.",
  },
  {
    id: "ingredient_context_required",
    when: ["carbohydrate estimate is high"],
    then: "Explain carbohydrate source context rather than ranking by carbohydrate alone.",
  },
] as const;

export const CARBOHYDRATE_RECOMMENDATION_LOGIC = [
  {
    id: "sensitive_digestion",
    logic:
      "Rice, beet pulp, chicory/FOS/MOS and moderate fiber can be useful digestive-support signals when tolerated.",
  },
  {
    id: "allergy_context",
    logic:
      "Avoid framing grains as inherently bad; focus on known individual exposure history and trial design.",
  },
] as const;

export const CARBOHYDRATE_CONTRAINDICATIONS = [
  {
    id: "diabetes",
    rule:
      "Diabetes requires veterinarian-directed diet and monitoring; do not choose foods by carbohydrate estimate alone.",
  },
] as const;

export const CARBOHYDRATE_UNCERTAINTY_RULES = [
  {
    id: "missing_ash_moisture",
    rule:
      "Carbohydrate by difference is low confidence when ash or moisture is missing or defaulted.",
  },
] as const;

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function estimateCarbohydrateByDifference(input: CarbohydrateEstimateInput) {
  if (
    !hasNumber(input.protein_percent) ||
    !hasNumber(input.fat_percent) ||
    !hasNumber(input.fiber_percent) ||
    !hasNumber(input.ash_percent) ||
    !hasNumber(input.moisture_percent)
  ) {
    return null;
  }

  const value =
    100 -
    input.protein_percent -
    input.fat_percent -
    input.fiber_percent -
    input.ash_percent -
    input.moisture_percent;

  return Math.round(value * 10) / 10;
}

export function evaluateCarbohydrateRules(
  food: Pick<
    FoodProductV2,
    "carbohydrate_sources" | "fiber_sources" | "commercial_tags" | "medical_tags"
  >,
  nutrients: Pick<
    FoodNutrientsV2,
    "protein_percent" | "fat_percent" | "fiber_percent" | "ash_percent" | "moisture_percent"
  >
): CarbohydrateRuleFinding[] {
  const findings: CarbohydrateRuleFinding[] = [];
  const carbohydrate = estimateCarbohydrateByDifference(nutrients);

  if (carbohydrate === null) {
    findings.push({
      type: "missing",
      code: "carbohydrate_estimate_unavailable",
      message: "Carbohydrate estimate needs protein, fat, fiber, ash and moisture.",
    });
  } else if (carbohydrate >= 45) {
    findings.push({
      type: "caution",
      code: "higher_estimated_carbohydrate",
      message: "Estimated carbohydrate is higher, so ingredient context matters.",
    });
  }

  if (food.carbohydrate_sources.length > 0) {
    findings.push({
      type: "strength",
      code: "carbohydrate_sources_detected",
      message: "Carbohydrate sources are identifiable for explanation.",
    });
  }

  if (food.fiber_sources.length > 0 || hasNumber(nutrients.fiber_percent)) {
    findings.push({
      type: "strength",
      code: "fiber_context_available",
      message: "Fiber context is available for stool, satiety or digestive-support discussion.",
    });
  }

  if (food.medical_tags.includes("diabetes")) {
    findings.push({
      type: "caution",
      code: "diabetes_requires_vet",
      message: "Diabetes needs veterinary nutrition guidance and monitoring.",
    });
  }

  return findings;
}
