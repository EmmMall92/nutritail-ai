export interface DbPet {
  id: string;
  owner_id: string;
  name: string;
  species: "dog" | "cat";
  breed: string;
  age: number;
  weight: number;
  activity_level: "low" | "normal" | "high";
  neutered: boolean;
  allergies: string[];
  health_issues: string[];
  created_at: string;
  updated_at: string;
}