import { scoreFoodForPet } from "@/lib/foodScoring";
import { getPetLifeStage } from "@/lib/petLifeStage";
import { evaluateFoodRecommendationRules } from "@/lib/recommendationRuleEngine";
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
  const healthIssues = pet.healthIssues?.map((h) => h.toLowerCase()) ?? [];
  const petLifeStage = getPetLifeStage(pet);
  const ruleResult = evaluateFoodRecommendationRules(food, pet);

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

  if (healthIssues.some((issue) => issue.includes("obesity"))) {
    if (food.healthSupport.includes("weight control")) {
      reasons.push("Helpful for weight control.");
    }
  }

  if (healthIssues.some((issue) => issue.includes("kidney"))) {
    if (food.healthSupport.includes("kidney support")) {
      reasons.push("Better suited for kidney support.");
    }
  }

  if (healthIssues.some((issue) => issue.includes("sensitive"))) {
    if (food.healthSupport.includes("sensitive stomach")) {
      reasons.push("Designed for sensitive digestion.");
    }
  }

  if ((pet.allergies ?? []).length > 0) {
    reasons.push("Filtered to avoid allergens.");
  }

  for (const signal of ruleResult.signals) {
    if (signal.type === "boost" && !reasons.includes(signal.message)) {
      reasons.push(signal.message);
    }
  }

  return reasons.slice(0, 6);
}

function getRecommendationScore(food: Food, pet: Pet): number {
  let score = 0;

  const healthIssues = pet.healthIssues?.map((h) => h.toLowerCase()) ?? [];
  const petLifeStage = getPetLifeStage(pet);

  if (matchesLifeStage(food, petLifeStage)) score += 2;

  if (
    food.activitySupport === "all" ||
    food.activitySupport === pet.activityLevel
  ) {
    score += 1;
  }

  if (healthIssues.some((issue) => issue.includes("obesity"))) {
    if (food.healthSupport.includes("weight control")) score += 4;
  }

  if (healthIssues.some((issue) => issue.includes("kidney"))) {
    if (food.healthSupport.includes("kidney support")) score += 4;
  }

  if (healthIssues.some((issue) => issue.includes("sensitive"))) {
    if (food.healthSupport.includes("sensitive stomach")) score += 4;
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
    if (evaluateFoodRecommendationRules(food, pet).excluded) return false;

    return true;
  });

  return filteredFoods
    .map((food) => {
      const nutritionScoreResult = scoreFoodForPet(food, pet);
      const recommendationScore = getRecommendationScore(food, pet);
      const ruleResult = evaluateFoodRecommendationRules(food, pet);
      const cautionReasons = ruleResult.signals
        .filter((signal) => signal.type === "caution")
        .map((signal) => signal.message);

      return {
        food,
        score: recommendationScore + ruleResult.suitabilityScore,
        reasons: [...buildReasons(food, pet), ...cautionReasons].slice(0, 8),
        nutritionScore: nutritionScoreResult.score,
        nutritionReasons: nutritionScoreResult.reasons,
        ruleSignals: ruleResult.signals,
      };
    })
    .sort((a, b) => {
      const totalA = a.score + a.nutritionScore;
      const totalB = b.score + b.nutritionScore;
      return totalB - totalA;
    })
    .slice(0, 3);
}
