import { scoreFoodForPet } from "@/lib/foodScoring";
import {
  foodSupportsCondition,
  hasPetCondition,
} from "@/lib/petConditionSignals";
import { getPetLifeStage } from "@/lib/petLifeStage";
import { foodCatalogService } from "@/services/foodCatalogService";
import type { Pet } from "@/types/pet";
import type { Food } from "@/types/food";
import type { FoodRecommendation } from "@/types/recommendation";

function matchesLifeStage(
  food: Food,
  petLifeStage: "young" | "adult" | "senior"
) {
  return food.lifeStage === "all" || food.lifeStage === petLifeStage;
}

function containsAllergen(food: Food, allergies: string[]) {
  const lowerIngredients = food.ingredients.map((i) => i.toLowerCase());

  return allergies.some((allergy) =>
    lowerIngredients.some((ingredient) =>
      ingredient.includes(allergy.toLowerCase())
    )
  );
}

function buildReasons(food: Food, pet: Pet): string[] {
  const reasons: string[] = [];
  const petLifeStage = getPetLifeStage(pet);

  if (food.species === pet.species) {
    reasons.push(`Suitable for ${pet.species}s.`);
  }

  if (matchesLifeStage(food, petLifeStage)) {
    reasons.push(`Matches life stage: ${petLifeStage}.`);
  }

  if (
    food.activitySupport === "all" ||
    food.activitySupport === pet.activityLevel
  ) {
    reasons.push(`Supports ${pet.activityLevel} activity level.`);
  }

  if (hasPetCondition(pet.healthIssues, "weight")) {
    if (foodSupportsCondition(food, "weight")) {
      reasons.push("Helpful for weight control.");
    }
  }

  if (hasPetCondition(pet.healthIssues, "kidney")) {
    if (foodSupportsCondition(food, "kidney")) {
      reasons.push("Better suited for kidney support.");
    }
  }

  if (hasPetCondition(pet.healthIssues, "digestive")) {
    if (foodSupportsCondition(food, "digestive")) {
      reasons.push("Designed for sensitive digestion.");
    }
  }

  if (hasPetCondition(pet.healthIssues, "urinary")) {
    if (foodSupportsCondition(food, "urinary")) {
      reasons.push("Supports urinary health needs.");
    }
  }

  if ((pet.allergies ?? []).length > 0) {
    reasons.push("Filtered to avoid allergens.");
  }

  return reasons;
}

function getRecommendationScore(food: Food, pet: Pet): number {
  let score = 0;

  const petLifeStage = getPetLifeStage(pet);

  if (matchesLifeStage(food, petLifeStage)) score += 2;

  if (
    food.activitySupport === "all" ||
    food.activitySupport === pet.activityLevel
  ) {
    score += 1;
  }

  if (hasPetCondition(pet.healthIssues, "weight")) {
    if (foodSupportsCondition(food, "weight")) score += 4;
  }

  if (hasPetCondition(pet.healthIssues, "kidney")) {
    if (foodSupportsCondition(food, "kidney")) score += 4;
  }

  if (hasPetCondition(pet.healthIssues, "digestive")) {
    if (foodSupportsCondition(food, "digestive")) score += 4;
  }

  if (hasPetCondition(pet.healthIssues, "urinary")) {
    if (foodSupportsCondition(food, "urinary")) score += 4;
  }

  if (petLifeStage === "senior" && food.lifeStage === "senior") score += 3;
  if (petLifeStage === "young" && food.lifeStage === "young") score += 3;

  return score;
}

export async function getRecommendedFoods(
  pet: Pet
): Promise<FoodRecommendation[]> {
  const petLifeStage = getPetLifeStage(pet);
  const allergies = pet.allergies ?? [];

  const allFoods = await foodCatalogService.getFoodsBySpecies(pet.species);

  const filteredFoods = allFoods.filter((food) => {
    if (!matchesLifeStage(food, petLifeStage)) return false;
    if (allergies.length > 0 && containsAllergen(food, allergies)) return false;

    return true;
  });

  return filteredFoods
    .map((food) => {
      const nutritionScoreResult = scoreFoodForPet(food, pet);
      const recommendationScore = getRecommendationScore(food, pet);

      return {
        food,
        score: recommendationScore,
        reasons: buildReasons(food, pet),
        nutritionScore: nutritionScoreResult.score,
        nutritionReasons: nutritionScoreResult.reasons,
      };
    })
    .sort((a, b) => {
      const totalA = a.score + a.nutritionScore;
      const totalB = b.score + b.nutritionScore;
      return totalB - totalA;
    })
    .slice(0, 3);
}
