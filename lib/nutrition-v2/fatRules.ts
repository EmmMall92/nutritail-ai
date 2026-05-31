import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";

export type FatRuleFinding = {
  type: "strength" | "caution" | "missing";
  code: string;
  message: string;
};

export const FAT_SCIENTIFIC_PRINCIPLES = [
  {
    id: "fat_is_energy_dense",
    principle:
      "Fat is the most energy-dense macronutrient and strongly affects kcal density and portion size.",
  },
  {
    id: "fat_supports_palability_and_efas",
    principle:
      "Dietary fat supports palatability and supplies essential fatty-acid signals when omega data or fish/oil ingredients are present.",
  },
] as const;

export const FAT_DECISION_RULES = [
  {
    id: "missing_fat_blocks_energy_confidence",
    when: ["fat_percent is missing"],
    then: "Energy estimation and weight-control assessment should stay low confidence.",
  },
  {
    id: "high_fat_caution_for_weight",
    when: ["weight control goal", "fat_percent is elevated"],
    then: "Flag calorie-density caution unless kcal is clearly low.",
  },
] as const;

export const FAT_RECOMMENDATION_LOGIC = [
  {
    id: "skin_coat_context",
    logic:
      "Fish oil, omega-3 and omega-6 signals can be useful for coat/skin explanations without treating them as medical therapy.",
  },
  {
    id: "low_activity_context",
    logic:
      "For low-activity or sterilised pets, fat should be interpreted together with kcal density and fiber.",
  },
] as const;

export const FAT_CONTRAINDICATIONS = [
  {
    id: "pancreatitis",
    rule:
      "Suspected or previous pancreatitis requires veterinarian guidance before recommending higher-fat foods.",
  },
] as const;

export const FAT_UNCERTAINTY_RULES = [
  {
    id: "fat_without_kcal",
    rule:
      "Fat percent without kcal is insufficient for confident portion or weight-control advice.",
  },
] as const;

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function evaluateFatRules(
  food: Pick<FoodProductV2, "fat_sources" | "commercial_tags" | "medical_tags">,
  nutrients: Pick<FoodNutrientsV2, "fat_percent" | "omega3_percent" | "omega6_percent">
): FatRuleFinding[] {
  const findings: FatRuleFinding[] = [];

  if (!hasNumber(nutrients.fat_percent)) {
    findings.push({
      type: "missing",
      code: "missing_fat_percent",
      message: "Fat percent is missing, so calorie-density assessment is limited.",
    });
    return findings;
  }

  if (nutrients.fat_percent <= 12 || food.commercial_tags.includes("weight_control")) {
    findings.push({
      type: "strength",
      code: "weight_control_fat_signal",
      message: "Fat level or product positioning may fit weight-control review.",
    });
  }

  if (nutrients.fat_percent >= 20) {
    findings.push({
      type: "caution",
      code: "high_fat_energy_density",
      message: "Higher fat can increase energy density and needs portion control.",
    });
  }

  if (
    hasNumber(nutrients.omega3_percent) ||
    hasNumber(nutrients.omega6_percent) ||
    food.fat_sources.some((source) => /fish|salmon|herring|oil|ιχθυ/i.test(source))
  ) {
    findings.push({
      type: "strength",
      code: "fatty_acid_support_signal",
      message: "Fatty-acid sources are available for skin/coat explanation.",
    });
  }

  if (food.medical_tags.includes("pancreatitis")) {
    findings.push({
      type: "caution",
      code: "pancreatitis_requires_vet",
      message: "Pancreatitis history needs veterinary diet guidance.",
    });
  }

  return findings;
}
