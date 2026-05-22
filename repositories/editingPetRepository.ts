import type { Pet } from "@/types/pet";
import {
  clearEditingPet,
  getEditingPet,
  saveEditingPet,
} from "@/lib/storage";

export const editingPetRepository = {
  get(): Pet | null {
    return getEditingPet();
  },

  save(pet: Pet): void {
    saveEditingPet(pet);
  },

  clear(): void {
    clearEditingPet();
  },
};