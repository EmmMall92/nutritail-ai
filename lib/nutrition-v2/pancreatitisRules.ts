import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";

export type PancreatitisFitSignal = {
  type: "boost" | "caution" | "exclude";
  code: string;
  points: number;
  message: string;
};

export type PancreatitisFitInput = {
  food: Pick<FoodProductV2, "medical_tags" | "commercial_tags">;
  nutrients: Pick<FoodNutrientsV2, "fat_percent" | "fiber_percent">;
  positioning: {
    lowFat: boolean;
    digestive: boolean;
    pancreatitis: boolean;
  };
  context: "pancreatitis" | "fat_sensitive";
};

export const PANCREATITIS_SCIENTIFIC_PRINCIPLES = [
  {
    id: "pancreatitis_is_veterinary_context",
    principle:
      "Previous or suspected pancreatitis needs veterinarian-directed diet selection and should not be handled as a routine digestive-food swap.",
  },
  {
    id: "fat_level_is_primary_screen",
    principle:
      "Fat percent is a primary screening field for pancreatitis and fat-sensitive contexts; missing fat data lowers confidence.",
  },
  {
    id: "generic_digestive_is_not_low_fat",
    principle:
      "Digestive or GI positioning is useful only when fat level and low-fat positioning also fit the fat-sensitive context.",
  },
] as const;

export const PANCREATITIS_DECISION_RULES = [
  {
    id: "high_fat_hard_reject",
    when: ["pancreatitis context", "fat_percent is above low-fat range"],
    then: "Hold the food out of recommendations unless a veterinarian specifically directs otherwise.",
  },
  {
    id: "missing_fat_blocks_confidence",
    when: ["pancreatitis or fat-sensitive context", "fat_percent missing"],
    then: "Reduce confidence and avoid confident formula-specific advice.",
  },
  {
    id: "low_fat_digestive_fit",
    when: ["low-fat positioning", "fat_percent is low or moderate-low"],
    then: "Allow a stronger candidate signal while keeping veterinary framing.",
  },
] as const;

export const PANCREATITIS_RECOMMENDATION_LOGIC = [
  "For pancreatitis, prefer clearly low-fat or pancreatic/GI low-fat formulas with declared fat data.",
  "For generic fat sensitivity, use lower-fat candidates cautiously and monitor tolerance.",
  "Do not let ordinary digestive positioning override a high fat percentage.",
] as const;

export const PANCREATITIS_CONTRAINDICATIONS = [
  {
    id: "acute_or_recurrent_pancreatitis",
    rule:
      "Acute, recurrent or diagnosed pancreatitis requires veterinarian involvement before diet changes.",
  },
] as const;

export const PANCREATITIS_UNCERTAINTY_RULES = [
  {
    id: "missing_fat_data",
    rule:
      "Without declared fat percent, pancreatitis and fat-sensitive suitability should stay low-confidence.",
  },
] as const;

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasAnyTag(food: PancreatitisFitInput["food"], values: string[]) {
  return [...food.medical_tags, ...food.commercial_tags].some((tag) => values.includes(tag));
}

export function evaluatePancreatitisFitRules(input: PancreatitisFitInput) {
  const signals: PancreatitisFitSignal[] = [];
  const { context, food, nutrients, positioning } = input;
  const fat = nutrients.fat_percent;
  const strictContext = context === "pancreatitis";
  const taggedForPancreatitis =
    positioning.pancreatitis || hasAnyTag(food, ["pancreatitis", "pancreatic"]);

  signals.push({
    type: "caution",
    code:
      context === "pancreatitis"
        ? "pancreatitis_requires_vet"
        : "fat_sensitive_requires_tolerance_review",
    points: strictContext ? -10 : -4,
    message:
      context === "pancreatitis"
        ? "Pancreatitis history needs veterinarian-directed diet selection."
        : "Fat-sensitive pets need careful tolerance monitoring and gradual transitions.",
  });

  if (!hasNumber(fat)) {
    signals.push({
      type: "caution",
      code:
        context === "pancreatitis"
          ? "pancreatitis_missing_fat"
          : "fat_sensitive_missing_fat",
      points: strictContext ? -24 : -14,
      message:
        "Fat data is missing, so fat-sensitive suitability cannot be checked confidently.",
    });
    return signals;
  }

  if (strictContext && fat > 12) {
    signals.push({
      type: "exclude",
      code: "pancreatitis_high_fat_mismatch",
      points: -100,
      message:
        "Excluded because pancreatitis history should not start from higher-fat foods.",
    });
  } else if (!strictContext && fat >= 16) {
    signals.push({
      type: "exclude",
      code: "fat_sensitive_high_fat_mismatch",
      points: -100,
      message:
        "Excluded because the fat level is high for a fat-sensitive shortlist.",
    });
  } else if (!strictContext && fat > 12) {
    signals.push({
      type: "caution",
      code: "fat_sensitive_moderate_fat_review",
      points: -12,
      message:
        "Fat is not high enough to hard reject, but it needs review for a fat-sensitive pet.",
    });
  }

  if ((positioning.lowFat || taggedForPancreatitis) && fat <= 10) {
    signals.push({
      type: "boost",
      code: "pancreatitis_low_fat_fit",
      points: strictContext ? 18 : 12,
      message:
        "Clear lower-fat positioning and declared fat data support fat-sensitive review.",
    });
  } else if (positioning.digestive && !positioning.lowFat && fat > 10) {
    signals.push({
      type: "caution",
      code: "digestive_not_low_fat_for_pancreatitis",
      points: strictContext ? -20 : -10,
      message:
        "Generic digestive positioning does not replace low-fat fit for pancreatitis or fat-sensitive cases.",
    });
  }

  if (hasNumber(nutrients.fiber_percent) && nutrients.fiber_percent > 8) {
    signals.push({
      type: "caution",
      code: "pancreatitis_high_fiber_review",
      points: -6,
      message:
        "Very high fiber may need individual GI review in a pancreatitis-sensitive context.",
    });
  }

  return signals;
}
