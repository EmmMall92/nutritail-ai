import { petNutritionService } from "@/services/petNutritionService";
import type { Pet } from "@/types/pet";
import type { PetAnalysis } from "@/types/pet-analysis";

export const petAnalysisService = {
  async analyzePet(pet: Pet): Promise<PetAnalysis> {
    const nutrition = petNutritionService.getNutrition(pet);

    const advice = petNutritionService.getAdvice(pet);

    const recommendedFoods =
      await petNutritionService.getRecommendedFoods(pet);

    return {
      pet,
      nutrition,
      advice,
      recommendedFoods,
    };
  },
};