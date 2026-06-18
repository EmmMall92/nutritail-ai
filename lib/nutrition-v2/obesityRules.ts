import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";
import type { Pet } from "@/types/pet";

export type ObesityFitSignal = {
  type: "boost" | "caution" | "exclude";
  code: string;
  points: number;
  message: string;
};

export type ObesityFitInput = {
  food: Pick<FoodProductV2, "kcal_per_100g">;
  nutrients: Pick<FoodNutrientsV2, "protein_percent" | "fat_percent" | "fiber_percent">;
  pet: Pick<Pet, "activityLevel" | "neutered"> & {
    healthIssues?: string[];
  };
  goal: "general" | "weight_control" | "sterilised" | "senior";
  positioning: {
    weightControl: boolean;
    active: boolean;
  };
};

export const OBESITY_SCIENTIFIC_PRINCIPLES = [
  {
    id: "calorie_balance_drives_weight",
    principle:
      "Weight gain and loss are primarily driven by energy balance, with satiety and lean-mass support influencing adherence.",
  },
  {
    id: "sterilisation_can_reduce_energy_need",
    principle:
      "Sterilised pets often need closer portion control and energy monitoring.",
  },
] as const;

export const OBESITY_DECISION_RULES = [
  {
    id: "energy_required_for_portions",
    when: ["weight loss or obesity goal"],
    then: "Require kcal data or transparent estimated kcal before portion guidance.",
  },
  {
    id: "satiety_signals_help",
    when: ["fiber present", "protein adequate"],
    then: "Use as supportive signals, not as substitutes for calorie control.",
  },
] as const;

export const OBESITY_RECOMMENDATION_LOGIC = [
  "Prefer foods with clear kcal, moderate fat, useful protein and fiber/satiety signals.",
  "Ask about treats and current portion when weight control is the goal.",
  "Do not let active/performance formulas outrank weight-control formulas for sedentary or sterilised pets.",
] as const;

export const OBESITY_CONTRAINDICATIONS = [
  {
    id: "rapid_weight_loss",
    rule:
      "Do not recommend aggressive calorie restriction, especially for cats, without veterinary monitoring.",
  },
] as const;

export const OBESITY_UNCERTAINTY_RULES = [
  {
    id: "missing_weight_or_bcs",
    rule:
      "If weight, ideal weight or body condition is unknown, give only general portion-control guidance.",
  },
] as const;

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function evaluateObesityRules(
  food: Pick<FoodProductV2, "kcal_per_100g" | "commercial_tags" | "medical_tags">,
  nutrients: Pick<FoodNutrientsV2, "protein_percent" | "fat_percent" | "fiber_percent">
) {
  const boosts: string[] = [];
  const cautions: string[] = [];

  if (food.commercial_tags.includes("weight_control") || food.medical_tags.includes("obesity")) {
    boosts.push("weight_control_positioning");
  }
  if (hasNumber(food.kcal_per_100g) && food.kcal_per_100g <= 360) boosts.push("lower_energy_density");
  if (hasNumber(nutrients.fiber_percent) && nutrients.fiber_percent >= 4) boosts.push("satiety_fiber_signal");
  if (hasNumber(nutrients.protein_percent) && nutrients.protein_percent >= 25) boosts.push("lean_mass_support_signal");

  if (!hasNumber(food.kcal_per_100g)) cautions.push("missing_energy_for_weight_control");
  if (hasNumber(nutrients.fat_percent) && nutrients.fat_percent >= 20) cautions.push("higher_fat_density");

  return { boosts, cautions };
}

function normalizedHealthText(healthIssues: string[] | undefined) {
  return (healthIssues ?? []).join(" ").toLowerCase();
}

export function isObesityOrWeightLossContext(input: {
  goal: ObesityFitInput["goal"];
  pet: ObesityFitInput["pet"];
}) {
  const healthText = normalizedHealthText(input.pet.healthIssues);

  return (
    input.goal === "weight_control" ||
    /obesity|overweight|weight|loss|bcs|παχ|βαρ/.test(healthText)
  );
}

export function evaluateObesityFitRules(input: ObesityFitInput) {
  const signals: ObesityFitSignal[] = [];
  const { food, goal, nutrients, pet, positioning } = input;
  const weightLossContext = isObesityOrWeightLossContext({ goal, pet });

  if (!weightLossContext) return signals;

  if (positioning.weightControl) {
    signals.push({
      type: "boost",
      code: "obesity_weight_control_positioning",
      points: 18,
      message: "Positioned for weight control or satiety.",
    });
  }

  if (hasNumber(food.kcal_per_100g)) {
    if (food.kcal_per_100g <= 335) {
      signals.push({
        type: "boost",
        code: "obesity_lower_energy_density",
        points: 14,
        message: "Lower calorie density is useful for weight-loss planning.",
      });
    } else if (food.kcal_per_100g <= 360) {
      signals.push({
        type: "boost",
        code: "obesity_moderate_energy_density",
        points: 8,
        message: "Moderate calorie density can fit a controlled weight plan.",
      });
    } else if (food.kcal_per_100g >= 385) {
      signals.push({
        type: "caution",
        code: "obesity_energy_density_high",
        points: food.kcal_per_100g >= 405 ? -22 : -14,
        message: "Calories look high for a weight-loss shortlist.",
      });
    }
  } else {
    signals.push({
      type: "caution",
      code: "obesity_missing_energy",
      points: -14,
      message: "Weight-loss recommendations need calorie data.",
    });
  }

  if (hasNumber(nutrients.fiber_percent) && nutrients.fiber_percent >= 5) {
    signals.push({
      type: "boost",
      code: "obesity_satiety_fiber",
      points: 8,
      message: "Fiber level can support satiety during calorie control.",
    });
  }

  if (hasNumber(nutrients.protein_percent) && nutrients.protein_percent >= 25) {
    signals.push({
      type: "boost",
      code: "obesity_lean_mass_support",
      points: 6,
      message: "Protein level helps support lean-mass-aware weight control.",
    });
  }

  if (hasNumber(nutrients.fat_percent) && nutrients.fat_percent >= 16) {
    signals.push({
      type: "caution",
      code: "obesity_fat_high",
      points: nutrients.fat_percent >= 18 ? -18 : -10,
      message: "Fat looks high for a weight-loss goal.",
    });
  }

  if (
    !positioning.weightControl &&
    positioning.active &&
    pet.activityLevel !== "high"
  ) {
    signals.push({
      type: "exclude",
      code: "obesity_active_formula_mismatch",
      points: -100,
      message:
        "Excluded because active/performance food does not fit this weight-loss context.",
    });
  }

  if (
    !positioning.weightControl &&
    hasNumber(food.kcal_per_100g) &&
    food.kcal_per_100g >= 390 &&
    hasNumber(nutrients.fat_percent) &&
    nutrients.fat_percent >= 16
  ) {
    signals.push({
      type: "exclude",
      code: "obesity_high_energy_high_fat",
      points: -100,
      message:
        "Excluded because high calories and high fat conflict with the weight-loss goal.",
    });
  }

  return signals;
}
