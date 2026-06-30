import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";

export type GrowthFitSignal = {
  type: "boost" | "caution" | "exclude";
  code: string;
  points: number;
  message: string;
};

export type GrowthFitInput = {
  food: Pick<FoodProductV2, "life_stage" | "kcal_per_100g">;
  nutrients: Pick<
    FoodNutrientsV2,
    "calcium_percent" | "phosphorus_percent" | "dha_percent" | "epa_dha_percent"
  >;
  petStage: "puppy" | "kitten" | "adult" | "senior";
  lifeStageMatches: boolean;
  isLargeBreedDog: boolean;
  positioning: {
    largeBreedGrowth: boolean;
    genericGrowth: boolean;
  };
};

export const GROWTH_SCIENTIFIC_PRINCIPLES = [
  {
    id: "growth_is_not_maximum_speed",
    principle:
      "Healthy growth aims for controlled, appropriate growth rather than maximum speed.",
  },
  {
    id: "large_breed_mineral_control",
    principle:
      "Large and giant-breed puppies need careful energy and calcium/phosphorus review.",
  },
  {
    id: "dha_supports_growth_development",
    principle:
      "Declared DHA is a useful growth-stage signal for brain, learning and visual development context.",
  },
] as const;

export const GROWTH_DECISION_RULES = [
  {
    id: "puppy_food_for_puppies",
    when: ["pet is puppy or kitten"],
    then: "Prefer matching growth life-stage foods unless veterinarian directs otherwise.",
  },
  {
    id: "large_breed_puppy_requires_mineral_data",
    when: ["large/giant puppy", "calcium or phosphorus missing"],
    then: "Ask for label/official data before confident recommendation.",
  },
  {
    id: "dha_boosts_growth_explanation",
    when: ["puppy or kitten formula", "dha_percent exists"],
    then: "Add a growth-development explanation without making medical claims.",
  },
] as const;

export const GROWTH_RECOMMENDATION_LOGIC = [
  "Prioritize life-stage match, controlled kcal density and mineral completeness.",
  "Use declared DHA as a positive growth-stage signal when available.",
  "Avoid encouraging overfeeding for faster growth.",
] as const;

export const GROWTH_CONTRAINDICATIONS = [
  {
    id: "adult_food_for_growth",
    rule:
      "Do not recommend adult maintenance food as the default for puppies or kittens.",
  },
] as const;

export const GROWTH_UNCERTAINTY_RULES = [
  {
    id: "unknown_size",
    rule:
      "If adult size is unknown, ask for breed/expected adult weight before large-breed puppy advice.",
  },
] as const;

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function evaluateGrowthRules(
  food: Pick<FoodProductV2, "species" | "life_stage" | "dog_size" | "kcal_per_100g">,
  nutrients: Pick<
    FoodNutrientsV2,
    "calcium_percent" | "phosphorus_percent" | "dha_percent" | "epa_percent"
  >
) {
  const findings: string[] = [];
  const cautions: string[] = [];

  if (["puppy", "kitten", "all_life_stages"].includes(food.life_stage)) {
    findings.push("growth_life_stage_signal");
  }

  if (
    ["puppy", "kitten", "all_life_stages"].includes(food.life_stage) &&
    hasNumber(nutrients.dha_percent)
  ) {
    findings.push("dha_growth_development_signal");
  }

  if (
    food.life_stage === "puppy" &&
    ["large", "giant"].includes(food.dog_size ?? "") &&
    (!hasNumber(nutrients.calcium_percent) || !hasNumber(nutrients.phosphorus_percent))
  ) {
    cautions.push("large_breed_puppy_missing_ca_p");
  }

  if (food.life_stage === "puppy" && hasNumber(food.kcal_per_100g) && food.kcal_per_100g > 430) {
    cautions.push("high_energy_density_for_growth_review");
  }

  return { findings, cautions };
}

export function evaluateGrowthFitRules(input: GrowthFitInput) {
  const signals: GrowthFitSignal[] = [];
  const { food, nutrients, petStage, positioning } = input;
  const isGrowthPet = petStage === "puppy" || petStage === "kitten";

  if (!isGrowthPet) return signals;

  if (input.lifeStageMatches) {
    signals.push({
      type: "boost",
      code: "growth_life_stage_match",
      points: 10,
      message: `Matches ${petStage} growth life stage.`,
    });
  } else if (petStage === "puppy") {
    signals.push({
      type: "exclude",
      code: "adult_food_for_puppy_growth",
      points: -100,
      message:
        "Excluded because puppy/growth cases need puppy or all-life-stage food before adult options.",
    });
  } else if (petStage === "kitten") {
    signals.push({
      type: "exclude",
      code: "adult_food_for_kitten_growth",
      points: -100,
      message:
        "Excluded because kitten/growth cases need kitten or all-life-stage food before adult options.",
    });
  }

  if (petStage === "puppy" && input.isLargeBreedDog) {
    if (positioning.largeBreedGrowth) {
      signals.push({
        type: "boost",
        code: "large_breed_puppy_fit",
        points: 30,
        message: "Large-breed puppy positioning fits this growth case.",
      });
    } else if (positioning.genericGrowth) {
      signals.push({
        type: "caution",
        code: "generic_puppy_for_large_breed",
        points: -20,
        message:
          "Generic puppy food is less specific than a large-breed puppy formula.",
      });
    }

    if (!hasNumber(nutrients.calcium_percent) || !hasNumber(nutrients.phosphorus_percent)) {
      signals.push({
        type: "caution",
        code: "large_breed_growth_mineral_gap",
        points: -72,
        message:
          "Large-breed puppy first picks need calcium and phosphorus data when mineral-complete options exist.",
      });
    } else {
      const caP = nutrients.calcium_percent / nutrients.phosphorus_percent;
      if (caP >= 1 && caP <= 1.8) {
        signals.push({
          type: "boost",
          code: "large_breed_growth_ca_p_available",
          points: 16,
          message: "Calcium and phosphorus data support growth-stage review.",
        });
      } else {
        signals.push({
          type: "caution",
          code: "large_breed_growth_ca_p_review",
          points: -12,
          message:
            "Calcium/phosphorus balance should be reviewed before confident large-breed puppy advice.",
        });
      }
    }
  }

  if (hasNumber(nutrients.dha_percent) || hasNumber(nutrients.epa_dha_percent)) {
    signals.push({
      type: "boost",
      code: "growth_dha",
      points: 6,
      message: "DHA/EPA-DHA data supports growth reasoning.",
    });
  }

  if (petStage === "puppy" && hasNumber(food.kcal_per_100g) && food.kcal_per_100g > 430) {
    signals.push({
      type: "caution",
      code: "high_energy_density_for_growth_review",
      points: -8,
      message: "Energy density is high enough to review growth feeding portions carefully.",
    });
  }

  return signals;
}
