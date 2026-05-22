import type { Food } from "@/types/food";

export interface FoodRecommendation {
  food: Food;
  score: number;
  reasons: string[];
  nutritionScore: number;
  nutritionReasons: string[];
}