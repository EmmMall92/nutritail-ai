import type { PetNutritionSession } from "@/types/nutrition";
import {
  clearPetSession,
  getPetSession,
  savePetSession,
} from "@/lib/storage";

export const sessionRepository = {
  get(): PetNutritionSession | null {
    return getPetSession();
  },

  save(session: PetNutritionSession): void {
    savePetSession(session);
  },

  clear(): void {
    clearPetSession();
  },
};