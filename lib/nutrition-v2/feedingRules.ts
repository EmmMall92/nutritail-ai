import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";
import type { Pet } from "@/types/pet";

export type FeedingFitGoal =
  | "general"
  | "premium"
  | "value"
  | "weight_control"
  | "sensitive_digestion"
  | "allergy"
  | "urinary"
  | "renal"
  | "growth"
  | "sterilised"
  | "senior";

export type FeedingFitSignal = {
  type: "boost" | "caution" | "exclude";
  code: string;
  points: number;
  message: string;
};

export type FeedingFitInput = {
  food: Pick<FoodProductV2, "kcal_per_100g">;
  nutrients: Pick<FoodNutrientsV2, "fat_percent" | "fiber_percent">;
  pet: Pick<Pet, "activityLevel" | "neutered"> & {
    healthIssues?: string[];
  };
  goal: FeedingFitGoal;
  positioning: {
    active: boolean;
    weightControl: boolean;
  };
};

export const FEEDING_SCIENTIFIC_PRINCIPLES = [
  {
    id: "calorie_target_is_individual",
    principle:
      "Daily feeding advice should start from the pet's weight, life stage, activity, neuter status and body-condition goal.",
  },
  {
    id: "neutered_pets_need_calorie_awareness",
    principle:
      "Neutered or low-activity pets are more weight-sensitive, so calorie density, fat level and treat calories matter.",
  },
  {
    id: "active_pets_need_energy_context",
    principle:
      "Working and highly active pets may need more energy-dense formulas, but that logic should not spill into sedentary pets.",
  },
] as const;

export const FEEDING_DECISION_RULES = [
  {
    id: "weight_sensitive_foods_prefer_moderate_energy",
    when: ["neutered pet", "low activity", "weight-control goal"],
    then: "Prefer moderate kcal density, moderate fat and clear weight-control positioning.",
  },
  {
    id: "active_foods_require_active_context",
    when: ["active or performance formula", "pet is not high activity"],
    then: "Penalize or hold the food because the feeding context does not match.",
  },
  {
    id: "high_activity_foods_can_use_more_energy",
    when: ["high activity pet", "active or performance formula"],
    then: "Allow higher kcal and fat as a useful signal when there is no weight-loss goal.",
  },
] as const;

export const FEEDING_RECOMMENDATION_LOGIC = [
  "Separate maintenance, loss and gain goals before ranking foods.",
  "Use lower kcal and moderate fat as first-line signals for sterilised or weight-prone pets.",
  "Use active/performance positioning only when activity is genuinely high.",
] as const;

export const FEEDING_CONTRAINDICATIONS = [
  {
    id: "active_formula_for_weight_sensitive_pet",
    rule:
      "Do not shortlist active/performance formulas for sterilised, low-activity or weight-control pets unless there is a strong counter-signal.",
  },
] as const;

export const FEEDING_UNCERTAINTY_RULES = [
  {
    id: "missing_energy_limits_portions",
    rule:
      "If kcal is missing, confidence for portion and weight-control advice should drop.",
  },
] as const;

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizedHealthText(healthIssues: string[] | undefined) {
  return (healthIssues ?? []).join(" ").toLowerCase();
}

function isWeightGainContext(healthText: string) {
  return /weight gain|gain weight|needs? to gain|underweight|muscle gain|gain muscle/.test(
    healthText
  );
}

export function isWeightSensitiveFeedingContext(input: {
  goal: FeedingFitGoal;
  pet: FeedingFitInput["pet"];
}) {
  const healthText = normalizedHealthText(input.pet.healthIssues);
  if (isWeightGainContext(healthText)) return false;

  return (
    input.goal === "sterilised" ||
    input.goal === "weight_control" ||
    input.pet.neutered ||
    input.pet.activityLevel === "low" ||
    /weight control|weight loss|loss|lose weight|obesity|overweight|sterilis|neuter/.test(
      healthText
    )
  );
}

export function isStrictWeightControlFeedingContext(input: {
  goal: FeedingFitGoal;
  pet: FeedingFitInput["pet"];
}) {
  const healthText = normalizedHealthText(input.pet.healthIssues);
  if (isWeightGainContext(healthText)) return false;

  return (
    input.goal === "weight_control" ||
    /weight control|weight loss|loss|lose weight|obesity|overweight/.test(healthText) ||
    (input.goal === "sterilised" &&
      (input.pet.neutered || input.pet.activityLevel === "low"))
  );
}

export function evaluateFeedingFitRules(input: FeedingFitInput) {
  const signals: FeedingFitSignal[] = [];
  const { food, goal, nutrients, pet, positioning } = input;
  const weightSensitive = isWeightSensitiveFeedingContext({ goal, pet });
  const strictWeightContext = isStrictWeightControlFeedingContext({ goal, pet });
  const activityText = normalizedHealthText(pet.healthIssues);
  const weightGainContext = isWeightGainContext(activityText);
  const highActivity =
    pet.activityLevel === "high" ||
    /working|sport|agility|hunting|hunt|training|running|runs|swim|swimming|mountain|canicross|κυνηγ|εκπαιδευ|τρεχ|κολυμπ|βουνο|βουνό|δουλευ/.test(
      activityText
    );

  if (weightSensitive) {
    if (positioning.weightControl) {
      signals.push({
        type: "boost",
        code: "sterilised_fit",
        points: 14,
        message: "Useful weight-aware positioning for a sterilised pet.",
      });
    }

    if (hasNumber(food.kcal_per_100g) && food.kcal_per_100g <= 350) {
      signals.push({
        type: "boost",
        code: "lower_calorie_weight_sensitive",
        points: strictWeightContext ? 12 : 10,
        message: "Lower calorie density fits a sterilised or weight-prone pet.",
      });
    } else if (hasNumber(food.kcal_per_100g) && food.kcal_per_100g <= 380) {
      signals.push({
        type: "boost",
        code: "acceptable_energy_neutered",
        points: 4,
        message: "Calories look acceptable for a sterilised pet.",
      });
    }

    if (hasNumber(nutrients.fiber_percent) && nutrients.fiber_percent >= 4) {
      signals.push({
        type: "boost",
        code: "fiber_supports_satiety",
        points: 5,
        message: "Fiber level can help satiety in a calorie-aware plan.",
      });
    }

    if (hasNumber(food.kcal_per_100g) && food.kcal_per_100g > 385) {
      const penalty = food.kcal_per_100g > 405 ? -24 : -16;
      signals.push({
        type: "caution",
        code: "energy_dense_neutered",
        points: penalty,
        message: "Energy density may be high for a sterilised pet.",
      });
    }

    if (hasNumber(nutrients.fat_percent) && nutrients.fat_percent >= 16) {
      const penalty = nutrients.fat_percent >= 18 ? -20 : -12;
      signals.push({
        type: "caution",
        code: "fat_dense_neutered",
        points: penalty,
        message: "Fat looks high for a sterilised or weight-prone pet.",
      });
    } else if (
      strictWeightContext &&
      hasNumber(nutrients.fat_percent) &&
      nutrients.fat_percent >= 14.5 &&
      !positioning.weightControl
    ) {
      signals.push({
        type: "caution",
        code: "moderately_fatty_weight_sensitive",
        points: -8,
        message:
          "Fat is not low enough to be a first pick for a sterilised or weight-control case.",
      });
    }

    if (
      strictWeightContext &&
      !positioning.weightControl &&
      hasNumber(food.kcal_per_100g) &&
      food.kcal_per_100g >= 382 &&
      hasNumber(nutrients.fat_percent) &&
      nutrients.fat_percent >= 16
    ) {
      signals.push({
        type: "exclude",
        code: "high_energy_fat_weight_sensitive",
        points: -100,
        message:
          "Excluded because calories and fat are too high for a first weight-control shortlist.",
      });
    }

    if (
      goal === "sterilised" &&
      !positioning.weightControl &&
      pet.activityLevel !== "high" &&
      hasNumber(food.kcal_per_100g) &&
      food.kcal_per_100g >= 370 &&
      hasNumber(nutrients.fat_percent) &&
      nutrients.fat_percent >= 15
    ) {
      signals.push({
        type: "exclude",
        code: "sterilised_high_energy_fat_mismatch",
        points: -100,
        message:
          "Excluded because this is too energy-dense for a sterilised maintenance shortlist.",
      });
    }
  }

  if (goal === "weight_control") {
    if (positioning.weightControl) {
      signals.push({
        type: "boost",
        code: "weight_goal_fit",
        points: 20,
        message: "Positioned for weight control.",
      });
    }

    if (!positioning.weightControl && hasNumber(food.kcal_per_100g) && food.kcal_per_100g > 380) {
      signals.push({
        type: "caution",
        code: "higher_calorie_weight_goal",
        points: food.kcal_per_100g > 400 ? -24 : -16,
        message: "Calories look high for a weight-control goal.",
      });
    }
  }

  if (positioning.active && highActivity && !strictWeightContext) {
    signals.push({
      type: "boost",
      code: "active_formula_activity_fit",
      points: 14,
      message: "Active/performance positioning fits a highly active pet.",
    });

    if (hasNumber(food.kcal_per_100g) && food.kcal_per_100g >= 380) {
      signals.push({
        type: "boost",
        code: "energy_density_for_active_pet",
        points: 8,
        message: "Higher calorie density can fit a high-activity pet.",
      });
    }

    if (hasNumber(nutrients.fat_percent) && nutrients.fat_percent >= 16) {
      signals.push({
        type: "boost",
        code: "fat_level_for_active_pet",
        points: 5,
        message: "Fat level can support higher energy needs in an active pet.",
      });
    }
  }

  if (highActivity && !strictWeightContext && !positioning.weightControl) {
    if (hasNumber(food.kcal_per_100g) && food.kcal_per_100g >= 380) {
      signals.push({
        type: "boost",
        code: "energy_density_for_high_activity",
        points: 6,
        message: "Energy density can support a high-activity pet.",
      });
    }

    if (hasNumber(nutrients.fat_percent) && nutrients.fat_percent >= 16) {
      signals.push({
        type: "boost",
        code: "fat_supports_high_activity",
        points: 4,
        message: "Fat level can help cover higher activity energy needs.",
      });
    }
  }

  if (highActivity && !strictWeightContext && positioning.weightControl && !positioning.active) {
    signals.push({
      type: weightGainContext ? "exclude" : "caution",
      code: "weight_control_formula_for_active_pet",
      points: weightGainContext ? -100 : -24,
      message:
        "Weight-control positioning may underserve a highly active pet unless weight loss is the goal.",
    });

    if (
      weightGainContext ||
      (hasNumber(food.kcal_per_100g) && food.kcal_per_100g <= 355) ||
      (hasNumber(nutrients.fat_percent) && nutrients.fat_percent <= 12)
    ) {
      signals.push({
        type: "exclude",
        code: "light_formula_for_high_activity_pet",
        points: -100,
        message:
          "Excluded because light/sterilised energy positioning is a poor first choice for a high-activity pet.",
      });
    }
  }

  if (positioning.active && !highActivity) {
    const activePenalty = strictWeightContext ? -34 : -24;
    signals.push({
      type: "caution",
      code: "active_formula_for_neutered_pet",
      points: activePenalty,
      message:
        "Active/performance positioning is not ideal for a sterilised low-to-normal activity pet.",
    });

    if (
      strictWeightContext &&
      !positioning.weightControl &&
      (food.kcal_per_100g == null ||
        food.kcal_per_100g > 370 ||
        (nutrients.fat_percent ?? 0) >= 14.5)
    ) {
      signals.push({
        type: "exclude",
        code: "active_formula_for_weight_sensitive_pet",
        points: -100,
        message:
          "Excluded because active/performance food is a poor first choice for this sterilised or weight-control context.",
      });
    }
  }

  return signals;
}
