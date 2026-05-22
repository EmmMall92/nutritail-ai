import { supabaseFoodRepository } from "@/repositories/supabaseFoodRepository";

export const foodCatalogService = {
  async getAllFoods() {
    return supabaseFoodRepository.getAll();
  },

  async getFoodsBySpecies(species: "dog" | "cat") {
    return supabaseFoodRepository.getBySpecies(species);
  },

  async getFoodById(foodId: string) {
    return supabaseFoodRepository.getById(foodId);
  },
};