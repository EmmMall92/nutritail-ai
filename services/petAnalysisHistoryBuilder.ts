import type { Pet } from "@/types/pet";
import type { PetAnalysis as LivePetAnalysis } from "@/types/pet-analysis";
import type { PetAnalysisHistory } from "@/types/pet-analysis-history";

function finiteNumberOrFallback(value: unknown, fallback: number): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function finiteOptionalNumber(value: unknown): number | undefined {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

export function buildPetAnalysisHistoryRecord(
  pet: Pet,
  analysis: LivePetAnalysis
): PetAnalysisHistory {
  return {
    id: crypto.randomUUID(),
    petId: pet.id,
    ownerId: pet.ownerId,
    rer: finiteNumberOrFallback(analysis.nutrition.rer, 0),
    mer: finiteNumberOrFallback(analysis.nutrition.der, 0),
    recommendedFoodIds: analysis.recommendedFoods.map((item) => item.food.id),
    notes:
      analysis.advice.length > 0
        ? analysis.advice
            .map((item) => `${item.title}: ${item.description}`)
            .join(" | ")
        : undefined,
    weight: finiteOptionalNumber(pet.weight),
    age: finiteOptionalNumber(pet.age),
    activityLevel: pet.activityLevel,
    neutered: pet.neutered,
    allergies: pet.allergies ?? [],
    healthIssues: pet.healthIssues ?? [],
    createdAt: new Date().toISOString(),
  };
}
