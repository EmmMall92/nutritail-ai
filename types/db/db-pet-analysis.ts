export type DbPetAnalysis = {
  id: string;
  pet_id: string;
  owner_id: string;
  rer: number;
  mer: number;
  recommended_food_ids: string[];
  notes: string | null;
  weight: number | null;
  age: number | null;
  activity_level: string | null;
  neutered: boolean | null;
  allergies: string[];
  health_issues: string[];
  created_at: string;
};