export type PetAnalysisHistory = {
  id: string;
  petId: string;
  ownerId: string;
  rer: number;
  mer: number;
  recommendedFoodIds: string[];
  notes?: string;
  createdAt: string;
};