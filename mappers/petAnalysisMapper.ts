import type { DbPetAnalysis } from "@/types/db/db-pet-analysis";
import type { PetAnalysisHistory } from "@/types/pet-analysis-history";

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

export function mapDbPetAnalysisToPetAnalysisHistory(
  db: DbPetAnalysis
): PetAnalysisHistory {
  return {
    id: db.id,
    petId: db.pet_id,
    ownerId: db.owner_id,
    rer: db.rer,
    mer: db.mer,
    recommendedFoodIds: normalizeStringArray(db.recommended_food_ids),
    notes: db.notes ?? undefined,
    weight: db.weight ?? undefined,
    age: db.age ?? undefined,
    activityLevel: db.activity_level ?? undefined,
    neutered: db.neutered ?? undefined,
    allergies: normalizeStringArray(db.allergies),
    healthIssues: normalizeStringArray(db.health_issues),
    foodScore: db.food_score ?? null,
    matchedFoodId: db.matched_food_id ?? null,
    matchedFoodName: db.matched_food_name ?? null,
    feedingGramsPerDay: db.feeding_grams_per_day ?? null,
    weightGoal: db.weight_goal ?? null,
    createdAt: db.created_at,
  };
}

export function mapPetAnalysisHistoryToDbPetAnalysis(
  analysis: PetAnalysisHistory
): DbPetAnalysis {
  return {
    id: analysis.id,
    pet_id: analysis.petId,
    owner_id: analysis.ownerId,
    rer: analysis.rer,
    mer: analysis.mer,
    recommended_food_ids: analysis.recommendedFoodIds,
    notes: analysis.notes ?? null,
    weight: analysis.weight ?? null,
    age: analysis.age ?? null,
    activity_level: analysis.activityLevel ?? null,
    neutered: analysis.neutered ?? null,
    allergies: analysis.allergies ?? [],
    health_issues: analysis.healthIssues ?? [],
    created_at: analysis.createdAt,
  };
}
