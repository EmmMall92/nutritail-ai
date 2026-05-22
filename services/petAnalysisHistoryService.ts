import { supabasePetAnalysisRepository } from "@/repositories/supabasePetAnalysisRepository";
import type { PetAnalysisHistory } from "@/types/pet-analysis-history";

export const petAnalysisHistoryService = {
  async saveAnalysis(analysis: PetAnalysisHistory) {
    return supabasePetAnalysisRepository.create(analysis);
  },

  async getPetHistory(petId: string) {
    return supabasePetAnalysisRepository.getByPet(petId);
  },
};