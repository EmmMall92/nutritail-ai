export interface DbPetRecommendation {
  id: string;
  pet_id: string;
  analysis_id: string;
  food_id: string;
  recommendation_score: number;
  nutrition_score: number;
  recommendation_reasons: string[];
  nutrition_reasons: string[];
  created_at: string;
}