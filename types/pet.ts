export type PetSpecies = "dog" | "cat";

export type PetActivityLevel = "low" | "normal" | "high";

export type PetLifeStage = "young" | "adult" | "senior";

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: PetSpecies;
  breed: string;
  age: number;
  weight: number;
  activityLevel: PetActivityLevel;
  neutered: boolean;
  allergies?: string[];
  healthIssues?: string[];
}