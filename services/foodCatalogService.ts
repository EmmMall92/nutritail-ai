import { supabaseFoodRepository } from "@/repositories/supabaseFoodRepository";
import { supabaseFoodV2RecommendationRepository } from "@/repositories/supabaseFoodV2RecommendationRepository";
import type { Food } from "@/types/food";

async function withFoodV2Fallback(
  legacyFoods: Promise<Food[]>,
  foodV2Foods: Promise<Food[]>
) {
  const [legacy, foodV2] = await Promise.all([
    legacyFoods,
    foodV2Foods.catch((error) => {
      console.error("Food V2 recommendation fetch failed:", error);
      return [];
    }),
  ]);

  return [...legacy, ...foodV2];
}

export const foodCatalogService = {
  async getAllFoods() {
    return withFoodV2Fallback(
      supabaseFoodRepository.getAll(),
      supabaseFoodV2RecommendationRepository.getAll()
    );
  },

  async getFoodsBySpecies(species: "dog" | "cat") {
    return withFoodV2Fallback(
      supabaseFoodRepository.getBySpecies(species),
      supabaseFoodV2RecommendationRepository.getBySpecies(species)
    );
  },

  async getFoodById(foodId: string) {
    return supabaseFoodRepository.getById(foodId);
  },
};
