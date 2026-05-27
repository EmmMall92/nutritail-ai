import type { Pet } from "@/types/pet";
import type { PetAnalysis as LivePetAnalysis } from "@/types/pet-analysis";
import type { PetAnalysisHistory } from "@/types/pet-analysis-history";

function finiteNumber(value: number, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function buildPetAnalysisHistoryRecord(
  pet: Pet,
  analysis: LivePetAnalysis
): PetAnalysisHistory {
  return {
    id: crypto.randomUUID(),
    petId: pet.id,
    ownerId: pet.ownerId,
    rer: finiteNumber(analysis.nutrition.rer),
    mer: finiteNumber(analysis.nutrition.der),
    recommendedFoodIds: analysis.recommendedFoods.map((item) => item.food.id),
    notes:
      analysis.advice.length > 0
        ? analysis.advice
            .map((item) => `${item.title}: ${item.description}`)
            .join(" | ")
        : undefined,
    weight: finiteNumber(pet.weight),
    age: finiteNumber(pet.age),
    activityLevel: pet.activityLevel,
    neutered: pet.neutered,
    allergies: pet.allergies ?? [],
    healthIssues: pet.healthIssues ?? [],
    createdAt: new Date().toISOString(),
  };
}
