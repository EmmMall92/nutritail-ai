export type ExtractedSpecies = "dog" | "cat";
export type ExtractedActivityLevel = "low" | "normal" | "high";
export type ExtractedWeightGoal = "maintain" | "loss" | "gain";
export type ExtractedLanguage = "el" | "en";

export type AiIntakeExtraction = {
  species?: ExtractedSpecies | null;
  petName?: string | null;
  weightKg?: number | null;
  ageYears?: number | null;
  activityLevel?: ExtractedActivityLevel | null;
  neutered?: boolean | null;
  healthIssues?: string[];
  allergies?: string[];
  currentFoodName?: string | null;
  preferredProteins?: string[];
  excludedIngredients?: string[];
  weightGoal?: ExtractedWeightGoal | null;
  language?: ExtractedLanguage | null;
  missingFields?: string[];
  redFlags?: string[];
  confidence?: "high" | "medium" | "low";
  notes?: string[];
};

export type ValidatedAiIntakeExtraction = {
  data: AiIntakeExtraction;
  acceptedFields: string[];
  missingFields: string[];
  warnings: string[];
  errors: string[];
  canUse: boolean;
};
