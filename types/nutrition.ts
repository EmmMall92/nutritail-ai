import type { Pet } from "@/types/pet";
import type { NutritionResult } from "@/lib/nutrition";

export interface PetNutritionSession {
  pet: Pet;
  nutrition: NutritionResult;
}