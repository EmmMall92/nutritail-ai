import type { PetActivityLevel, PetSpecies } from "@/types/pet";

export type FoodLifeStage = "young" | "adult" | "senior" | "all";

export interface Food {
  id: string;
  brand: string;
  name: string;

  species: PetSpecies;

  lifeStage: FoodLifeStage;

  activitySupport: PetActivityLevel | "all";

  healthSupport: string[];

  protein: number;
  fat: number;
  fiber: number;
  sodium: number;
  magnesium: number;
  calcium: number;
  phosphorus: number;

  ingredients: string[];

  tags: string[];
  kcalPer100g?: number | null;
  proteinPercent?: number | null;
  fatPercent?: number | null;
  fiberPercent?: number | null;
  sodiumPercent?: number | null;
  magnesiumPercent?: number | null;
  calciumPercent?: number | null;
  phosphorusPercent?: number | null;
  dataQualityStatus?: "needs_review" | "partial" | "verified" | "unknown" | null;
  dataSourceUrl?: string | null;
  dataNotes?: string | null;
}
