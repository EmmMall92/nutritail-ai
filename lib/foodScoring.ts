import { getPetLifeStage } from "@/lib/petLifeStage";
import type { Food } from "@/types/food";
import type { Pet } from "@/types/pet";

export type FoodScoreResult = {
  score: number;
  reasons: string[];
};

export function scoreFoodForPet(food: Food, pet: Pet): FoodScoreResult {
  let score = 0;
  const reasons: string[] = [];

  const healthIssues = pet.healthIssues?.map((item) => item.toLowerCase()) ?? [];
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

  if (healthIssues.some((issue) => issue.includes("obesity"))) {
    if (food.healthSupport.includes("weight control")) {
      score += 3;
      reasons.push("Supports weight control.");
    }

    if (food.fat <= 12) {
      score += 2;
      reasons.push("Lower fat level is helpful for weight management.");
    }

    if (food.fiber >= 5) {
      score += 1;
      reasons.push("Higher fiber may support satiety.");
    }
  }

  if (healthIssues.some((issue) => issue.includes("kidney"))) {
    if (food.healthSupport.includes("kidney support")) {
      score += 3;
      reasons.push("Supports kidney health.");
    }

    if (food.phosphorus <= 0.6) {
      score += 2;
      reasons.push("Lower phosphorus is more suitable for kidney support.");
    }

    if (food.sodium <= 0.3) {
      score += 1;
      reasons.push("Moderate sodium level is preferable.");
    }
  }

  if (healthIssues.some((issue) => issue.includes("sensitive"))) {
    if (food.healthSupport.includes("sensitive stomach")) {
      score += 3;
      reasons.push("Supports sensitive digestion.");
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

  if (food.protein >= 24 && food.protein <= 32 && pet.species === "dog") {
    score += 1;
    reasons.push("Protein level is in a solid range for many dogs.");
  }

  if (food.protein >= 30 && pet.species === "cat") {
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