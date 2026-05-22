import { generateNutritionAdvice } from "@/ai/nutritionAdvice";
import { getNutritionGuidance } from "@/lib/nutrition";
import { getRecommendedFoods } from "@/lib/recommendations";
import type { Pet } from "@/types/pet";

export const petNutritionService = {
  getNutrition(pet: Pet) {
    return getNutritionGuidance(pet);
  },

  getAdvice(pet: Pet) {
    return generateNutritionAdvice(pet);
  },

  getRecommendedFoods(pet: Pet) {
    return getRecommendedFoods(pet);
  },
};