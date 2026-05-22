import type { Advice } from "@/ai/nutritionAdvice";
import type { NutritionResult } from "@/lib/nutrition";
import type { FoodRecommendation } from "@/types/recommendation";
import type { Pet } from "@/types/pet";

export interface PetAnalysis {
  pet: Pet;
  nutrition: NutritionResult;
  advice: Advice[];
  recommendedFoods: FoodRecommendation[];
}
