import type { Food } from "@/types/food";
import type { RecommendationRuleSignal } from "@/lib/recommendationRuleEngine";

export interface FoodRecommendation {
  food: Food;
  score: number;
  reasons: string[];
  nutritionScore: number;
  nutritionReasons: string[];
  ruleSignals?: RecommendationRuleSignal[];
}
