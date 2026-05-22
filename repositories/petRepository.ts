import type { Pet } from "@/types/pet";
import {
  deletePetFromLibrary,
  getSavedPets,
  savePetToLibrary,
} from "@/lib/storage";

export const petRepository = {
  getAllByOwner(ownerId: string): Pet[] {
    return getSavedPets(ownerId);
  },

  save(pet: Pet): void {
    savePetToLibrary(pet);
  },

  delete(petId: string): void {
    deletePetFromLibrary(petId);
  },
};