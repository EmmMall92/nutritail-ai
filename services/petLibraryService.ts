import { supabasePetRepository } from "@/repositories/supabasePetRepository";
import type { Pet } from "@/types/pet";

export const petLibraryService = {
  async getPetsByOwner(ownerId: string): Promise<Pet[]> {
    return supabasePetRepository.getAllByOwner(ownerId);
  },

  async savePet(pet: Pet): Promise<Pet> {
    return supabasePetRepository.save(pet);
  },

  async deletePet(petId: string): Promise<void> {
    return supabasePetRepository.delete(petId);
  },
};