import { scoreFoodForPet } from "@/lib/foodScoring";
import {
  foodSupportsCondition,
  hasPetCondition,
} from "@/lib/petConditionSignals";
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

const ALLERGEN_ALIASES: Record<string, string[]> = {
  beef: ["beef", "μοσχα", "mosxari", "moshari"],
  chicken: ["chicken", "κοτοπου", "kotopoulo"],
  dairy: ["dairy", "milk", "γαλα", "gala"],
  egg: ["egg", "αυγ", "avgo"],
  fish: ["fish", "ψαρ", "psari"],
  lamb: ["lamb", "αρν", "arni"],
  pork: ["pork", "χοιρ", "xoirino", "hoirino"],
  salmon: ["salmon", "σολομ", "solomos"],
  soy: ["soy", "soya", "σόγια", "σογια", "sogia"],
  turkey: ["turkey", "γαλοπου", "galopoula"],
  wheat: ["wheat", "σιταρ", "sitar"],
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeSearchTokens(items: string[] | undefined) {
  return Array.from(
    new Set((items ?? []).map(normalizeText).filter(Boolean))
  );
}

function expandAllergenTerms(allergy: string) {
  const normalized = normalizeText(allergy);
  const terms = new Set([normalized]);

  for (const [canonical, aliases] of Object.entries(ALLERGEN_ALIASES)) {
    if (aliases.some((alias) => normalized.includes(normalizeText(alias)))) {
      terms.add(canonical);
      aliases.forEach((alias) => terms.add(normalizeText(alias)));
    }
  }

  return [...terms].filter(Boolean);
}

function containsAllergen(food: Food, allergies: string[]) {
  const lowerIngredients = food.ingredients.map((ingredient) =>
    normalizeText(ingredient)
  );
  const allergenTerms = normalizeSearchTokens(allergies).flatMap(
    expandAllergenTerms
  );

  return allergenTerms.some((allergy) =>
    lowerIngredients.some((ingredient) =>
      ingredient.includes(allergy)
    )
  );
}

function buildReasons(food: Food, pet: Pet): string[] {
  const reasons: string[] = [];
  const petLifeStage = getPetLifeStage(pet);
  const ruleResult = evaluateFoodRecommendationRules(food, pet);
  const allergies = normalizeSearchTokens(pet.allergies);

  if (food.species === pet.species) {
    reasons.push(`Suitable for ${pet.species}s.`);
  }

  if (food.dataNotes?.includes("source=food_v2")) {
    reasons.push(
      food.dataQualityStatus === "verified"
        ? "Uses the normalized Food V2 nutrition dataset."
        : "Uses Food V2 data; keep confidence cautious until fully verified."
    );
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

  if (allergies.length > 0) {
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
  const allergies = normalizeSearchTokens(pet.allergies);

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
