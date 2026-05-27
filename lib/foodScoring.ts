import { getPetLifeStage } from "@/lib/petLifeStage";
import {
  foodSupportsCondition,
  hasPetCondition,
} from "@/lib/petConditionSignals";
import type { Food } from "@/types/food";
import type { Pet } from "@/types/pet";

export type FoodScoreResult = {
  score: number;
  reasons: string[];
};

function hasPositiveNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function scoreFoodForPet(food: Food, pet: Pet): FoodScoreResult {
  let score = 0;
  const reasons: string[] = [];

  const allergies = pet.allergies?.map((item) => item.toLowerCase()) ?? [];
  const petLifeStage = getPetLifeStage(pet);

  if (food.species === pet.species) {
    score += 1;
    reasons.push("Matches the correct species.");
  }

  if (food.lifeStage === "all" || food.lifeStage === petLifeStage) {
    score += 2;
    reasons.push(`Appropriate for ${petLifeStage} life stage.`);
  }

  if (food.activitySupport === "all" || food.activitySupport === pet.activityLevel) {
    score += 1;
    reasons.push(`Suitable for ${pet.activityLevel} activity level.`);
  }

  if (hasPetCondition(pet.healthIssues, "weight")) {
    if (foodSupportsCondition(food, "weight")) {
      score += 3;
      reasons.push("Supports weight control.");
    }

    if (hasPositiveNumber(food.fat) && food.fat <= 12) {
      score += 2;
      reasons.push("Lower fat level is helpful for weight management.");
    }

    if (hasPositiveNumber(food.fiber) && food.fiber >= 5) {
      score += 1;
      reasons.push("Higher fiber may support satiety.");
    }
  }

  if (hasPetCondition(pet.healthIssues, "kidney")) {
    if (foodSupportsCondition(food, "kidney")) {
      score += 3;
      reasons.push("Supports kidney health.");
    }

    if (hasPositiveNumber(food.phosphorus) && food.phosphorus <= 0.6) {
      score += 2;
      reasons.push("Lower phosphorus is more suitable for kidney support.");
    }

    if (hasPositiveNumber(food.sodium) && food.sodium <= 0.3) {
      score += 1;
      reasons.push("Moderate sodium level is preferable.");
    }
  }

  if (hasPetCondition(pet.healthIssues, "digestive")) {
    if (foodSupportsCondition(food, "digestive")) {
      score += 3;
      reasons.push("Supports sensitive digestion.");
    }
  }

  if (hasPetCondition(pet.healthIssues, "urinary")) {
    if (foodSupportsCondition(food, "urinary")) {
      score += 3;
      reasons.push("Supports urinary health needs.");
    }
  }

  if (petLifeStage === "senior" && food.lifeStage === "senior") {
    score += 2;
    reasons.push("Specifically formulated for senior pets.");
  }

  if (allergies.length > 0) {
    const hasAllergen = allergies.some((allergy) =>
      food.ingredients.some((ingredient) =>
        ingredient.toLowerCase().includes(allergy)
      )
    );

    if (!hasAllergen) {
      score += 2;
      reasons.push("Does not contain the declared allergens.");
    }
  }

  if (
    hasPositiveNumber(food.protein) &&
    food.protein >= 24 &&
    food.protein <= 32 &&
    pet.species === "dog"
  ) {
    score += 1;
    reasons.push("Protein level is in a solid range for many dogs.");
  }

  if (hasPositiveNumber(food.protein) && food.protein >= 30 && pet.species === "cat") {
    score += 1;
    reasons.push("Protein level is appropriate for many cats.");
  }

  if (petLifeStage === "young" && food.lifeStage === "young") {
    score += 2;
    reasons.push("Better aligned with growth-stage nutritional needs.");
  }

  return {
    score,
    reasons,
  };
}
