export type FoodDataQualityStatus =
  | "needs_review"
  | "partial"
  | "verified"
  | "unknown";

export type NormalizedDogLifeStage = "young" | "adult" | "senior" | "all";

export type NormalizedDogSize =
  | "mini"
  | "small"
  | "medium"
  | "large"
  | "giant"
  | "all";

export type FoodValidationSeverity = "error" | "warning";

export interface RawFoodRow {
  id?: unknown;
  brand?: unknown;
  name?: unknown;
  species?: unknown;
  life_stage?: unknown;
  lifeStage?: unknown;
  size?: unknown;
  tags?: unknown;
  ingredients?: unknown;
  kcal_per_100g?: unknown;
  kcalPer100g?: unknown;
  protein_percent?: unknown;
  proteinPercent?: unknown;
  protein?: unknown;
  fat_percent?: unknown;
  fatPercent?: unknown;
  fat?: unknown;
  fiber_percent?: unknown;
  fiberPercent?: unknown;
  fiber?: unknown;
  sodium_percent?: unknown;
  sodiumPercent?: unknown;
  sodium?: unknown;
  magnesium_percent?: unknown;
  magnesiumPercent?: unknown;
  magnesium?: unknown;
  calcium_percent?: unknown;
  calciumPercent?: unknown;
  calcium?: unknown;
  phosphorus_percent?: unknown;
  phosphorusPercent?: unknown;
  phosphorus?: unknown;
  data_quality_status?: unknown;
  dataQualityStatus?: unknown;
  data_source_url?: unknown;
  dataSourceUrl?: unknown;
  data_notes?: unknown;
  dataNotes?: unknown;
  [key: string]: unknown;
}

export interface NormalizedFoodRow {
  id: string | null;
  brand: string | null;
  name: string | null;
  species: "dog" | null;
  life_stage: NormalizedDogLifeStage | null;
  size: NormalizedDogSize | null;
  tags: string[];
  ingredients: string[];
  kcal_per_100g: number | null;
  protein_percent: number | null;
  fat_percent: number | null;
  fiber_percent: number | null;
  sodium_percent: number | null;
  magnesium_percent: number | null;
  calcium_percent: number | null;
  phosphorus_percent: number | null;
  data_quality_status: FoodDataQualityStatus;
  data_source_url: string | null;
  data_notes: string | null;
  completeness_score: number;
}

export interface FoodValidationIssue {
  field: keyof RawFoodRow | keyof NormalizedFoodRow | string;
  message: string;
  severity: FoodValidationSeverity;
}

export interface FoodValidationResult {
  isValid: boolean;
  normalized: NormalizedFoodRow;
  missingCriticalFields: string[];
  impossibleNutritionValues: FoodValidationIssue[];
  warnings: FoodValidationIssue[];
  errors: FoodValidationIssue[];
  completenessScore: number;
}
