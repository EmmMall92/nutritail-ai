// Food v2 is a future normalized schema layer. The existing foods table and UI
// remain the production path until the v2 importer/admin preview is added.

export type Species = "dog" | "cat";
export type FoodFormat = "dry" | "wet" | "treat" | "supplement";
export type LifeStage =
  | "puppy"
  | "kitten"
  | "adult"
  | "senior"
  | "all_life_stages"
  | "unknown";
export type DogSize =
  | "mini"
  | "small"
  | "medium"
  | "large"
  | "giant"
  | "all"
  | "unknown";
export type DataQualityStatus = "verified" | "needs_review" | "unknown";
export type SourcePriority =
  | "official"
  | "retailer"
  | "manual_photo"
  | "unknown";

export interface FoodProductV2 {
  id?: string;
  brand: string;
  formula_name: string;
  display_name: string;
  species: Species;
  format: FoodFormat;
  life_stage: LifeStage;
  dog_size?: DogSize | null;
  breed_target?: string | null;
  medical_tags: string[];
  commercial_tags: string[];
  ingredient_text: string | null;
  ingredients: string[];
  primary_animal_proteins: string[];
  carbohydrate_sources: string[];
  fat_sources: string[];
  fiber_sources: string[];
  additives_text?: string | null;
  feeding_guide_text?: string | null;
  kcal_per_100g?: number | null;
  kcal_per_kg?: number | null;
  data_quality_status: DataQualityStatus;
  data_source_url?: string | null;
  source_priority: SourcePriority;
  source_notes?: string | null;
  formula_key: string;
  ean?: string | null;
  is_recommendable?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface FoodNutrientsV2 {
  protein_percent?: number | null;
  fat_percent?: number | null;
  fiber_percent?: number | null;
  ash_percent?: number | null;
  moisture_percent?: number | null;
  calcium_percent?: number | null;
  phosphorus_percent?: number | null;
  sodium_percent?: number | null;
  magnesium_percent?: number | null;
  potassium_percent?: number | null;
  omega3_percent?: number | null;
  omega6_percent?: number | null;
  dha_percent?: number | null;
  epa_percent?: number | null;
  taurine_mgkg?: number | null;
  l_carnitine_mgkg?: number | null;
  glucosamine_mgkg?: number | null;
  chondroitin_mgkg?: number | null;
  vitamin_a_iukg?: number | null;
  vitamin_d3_iukg?: number | null;
  vitamin_e_mgkg?: number | null;
  iron_mgkg?: number | null;
  zinc_mgkg?: number | null;
  copper_mgkg?: number | null;
  manganese_mgkg?: number | null;
  iodine_mgkg?: number | null;
  selenium_mgkg?: number | null;
}

export interface FoodValidationV2 {
  is_importable: boolean;
  completeness_score: number;
  missing_fields: string[];
  warnings: string[];
  impossible_values: string[];
  conflicts: string[];
}

export interface FoodImportRowV2 {
  food: FoodProductV2;
  nutrients: FoodNutrientsV2;
  raw: Record<string, unknown>;
  validation: FoodValidationV2;
  canonical?: {
    canonical_formula_key: string;
    standard_display_name: string;
  };
}
