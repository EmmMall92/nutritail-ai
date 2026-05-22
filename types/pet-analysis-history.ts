export type PetAnalysisHistory = {
  id: string;
  petId: string;
  ownerId: string;
  rer: number;
  mer: number;
  recommendedFoodIds: string[];
  notes?: string;
  weight?: number;
  age?: number;
  activityLevel?: string;
  neutered?: boolean;
  allergies: string[];
  healthIssues: string[];
  createdAt: string;
};