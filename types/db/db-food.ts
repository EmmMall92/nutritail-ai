export interface DbFood {
  id: string;
  brand: string;
  name: string;
  species: "dog" | "cat";
  life_stage: "young" | "adult" | "senior" | "all";
  activity_support: "low" | "normal" | "high" | "all";
  health_support: string[];
  protein: number;
  fat: number;
  fiber: number;
  sodium: number;
  magnesium: number;
  calcium: number;
  phosphorus: number;
  ingredients: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
  kcal_per_100g?: number | null;
protein_percent?: number | null;
fat_percent?: number | null;
fiber_percent?: number | null;
sodium_percent?: number | null;
magnesium_percent?: number | null;
calcium_percent?: number | null;
phosphorus_percent?: number | null;
}