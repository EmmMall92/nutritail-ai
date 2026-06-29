import type { FoodV2RecommendationGoal } from "@/lib/food-v2/recommendationRanking";
import type { PetActivityLevel, PetSpecies } from "@/types/pet";

const VALID_GOALS = new Set<FoodV2RecommendationGoal>([
  "general",
  "premium",
  "value",
  "weight_control",
  "sensitive_digestion",
  "allergy",
  "urinary",
  "renal",
  "growth",
  "sterilised",
  "senior",
]);

export function stringArrayFromRecommendationValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function numberFromRecommendationValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function recommendationGoalFrom(value: unknown): FoodV2RecommendationGoal {
  const goal = String(value ?? "general").trim() as FoodV2RecommendationGoal;
  return VALID_GOALS.has(goal) ? goal : "general";
}

export function recommendationActivityLevelFrom(value: unknown): PetActivityLevel {
  if (value === "low" || value === "normal" || value === "high") return value;
  return "normal";
}

function coalesceUnknown(...values: unknown[]) {
  return values.find((value) => value !== null && value !== undefined && value !== "");
}

export function normalizeFoodV2RecommendationPetContext(input: {
  pet: Record<string, unknown>;
  body?: Record<string, unknown>;
  species: PetSpecies;
}) {
  const { pet, body = {}, species } = input;

  return {
    species,
    breed: String(coalesceUnknown(pet.breed, body.breed, "")),
    age: numberFromRecommendationValue(
      coalesceUnknown(pet.age, pet.ageYears, body.age, body.ageYears),
      species === "cat" ? 3 : 4
    ),
    weight: numberFromRecommendationValue(
      coalesceUnknown(pet.weight, pet.weightKg, body.weight, body.weightKg),
      species === "cat" ? 4 : 10
    ),
    activityLevel: recommendationActivityLevelFrom(
      coalesceUnknown(
        pet.activityLevel,
        pet.activity_level,
        body.activityLevel,
        body.activity_level
      )
    ),
    neutered: Boolean(coalesceUnknown(pet.neutered, body.neutered, false)),
    allergies: stringArrayFromRecommendationValue(
      coalesceUnknown(pet.allergies, body.allergies)
    ),
    healthIssues: stringArrayFromRecommendationValue(
      coalesceUnknown(pet.healthIssues, pet.health_issues, body.healthIssues, body.health_issues)
    ),
    excludedIngredients: stringArrayFromRecommendationValue(
      coalesceUnknown(
        pet.excludedIngredients,
        pet.excluded_ingredients,
        pet.dislikedIngredients,
        pet.disliked_ingredients,
        body.excludedIngredients,
        body.excluded_ingredients,
        body.dislikedIngredients,
        body.disliked_ingredients
      )
    ),
    preferredProteins: stringArrayFromRecommendationValue(
      coalesceUnknown(
        pet.preferredProteins,
        pet.preferred_proteins,
        pet.preferredFlavors,
        pet.preferred_flavors,
        body.preferredProteins,
        body.preferred_proteins,
        body.preferredFlavors,
        body.preferred_flavors
      )
    ),
  };
}
