import type { Species } from "@/types/food-v2";

export type NutritionRuleSource =
  | "FEDIAF_2025"
  | "AAFCO"
  | "WSAVA"
  | "AAHA"
  | "MSD_MERCK"
  | "FDA"
  | "CLINIC_REVIEW_REQUIRED";

export type NutritionRuleSeverity = "hard_filter" | "strong_preference" | "confidence_penalty" | "monitoring_note";

export type NutrientBasis = "as_fed" | "dry_matter" | "per_1000_kcal";

export type RecommendationScenario =
  | "general"
  | "growth"
  | "sterilised"
  | "weight_control"
  | "sensitive_digestion"
  | "allergy"
  | "urinary"
  | "renal"
  | "diabetes"
  | "pancreatitis"
  | "joint_support"
  | "senior";

export type ScoringComponent =
  | "clinical_fit"
  | "nutrient_fit"
  | "life_stage_size_fit"
  | "feeding_method_flavor_fit"
  | "owner_constraint_fit"
  | "data_quality";

export type NumericRule = {
  id: string;
  label: string;
  species?: Species | "any";
  basis: NutrientBasis;
  unit: string;
  min?: number;
  max?: number;
  target?: number;
  severity: NutritionRuleSeverity;
  source: NutritionRuleSource;
  notes: string;
};

export type DiseaseRule = {
  id: string;
  scenario: RecommendationScenario;
  hardFilters: string[];
  boostSignals: string[];
  requiredDataForHighConfidence: string[];
  uncertaintyRules: string[];
  vetReferralRules: string[];
  source: NutritionRuleSource[];
};

export type EnergyRule = {
  id: string;
  species: Species;
  formula: string;
  appliesWhen: string;
  confidence: "high" | "medium" | "low";
  source: NutritionRuleSource;
};

export type WaterRule = {
  id: string;
  formulaOrStrategy: string;
  appliesWhen: string;
  source: NutritionRuleSource;
  notes: string;
};

export type RecommendationRulesRegistry = {
  version: string;
  scoringWeights: Record<"default" | "therapeutic" | "weight_control" | "allergy" | "urinary", Record<ScoringComponent, number>>;
  hardSafetyFilters: string[];
  energyRules: EnergyRule[];
  waterRules: WaterRule[];
  baselineNutrientGuardrails: NumericRule[];
  diseaseRules: DiseaseRule[];
  confidenceRubric: Record<"high" | "medium" | "low" | "no_safe_match", string[]>;
};

export const recommendationRulesRegistry: RecommendationRulesRegistry = {
  version: "2026-06-07.1",
  scoringWeights: {
    default: {
      clinical_fit: 40,
      nutrient_fit: 25,
      life_stage_size_fit: 10,
      feeding_method_flavor_fit: 10,
      owner_constraint_fit: 10,
      data_quality: 5,
    },
    therapeutic: {
      clinical_fit: 50,
      nutrient_fit: 25,
      life_stage_size_fit: 8,
      feeding_method_flavor_fit: 7,
      owner_constraint_fit: 5,
      data_quality: 5,
    },
    weight_control: {
      clinical_fit: 35,
      nutrient_fit: 25,
      life_stage_size_fit: 10,
      feeding_method_flavor_fit: 10,
      owner_constraint_fit: 10,
      data_quality: 10,
    },
    allergy: {
      clinical_fit: 40,
      nutrient_fit: 25,
      life_stage_size_fit: 10,
      feeding_method_flavor_fit: 10,
      owner_constraint_fit: 10,
      data_quality: 5,
    },
    urinary: {
      clinical_fit: 45,
      nutrient_fit: 25,
      life_stage_size_fit: 8,
      feeding_method_flavor_fit: 12,
      owner_constraint_fit: 5,
      data_quality: 5,
    },
  },
  hardSafetyFilters: [
    "species_mismatch",
    "wrong_life_stage_for_growth_or_adult_pet",
    "known_allergen_or_excluded_ingredient_present",
    "therapeutic_food_without_matching_condition",
    "large_or_giant_puppy_without_minimum_mineral_confidence",
    "renal_case_without_renal_fit_when_renal_options_exist",
    "urinary_case_without_urinary_fit_when_urinary_options_exist",
    "pancreatitis_or_fat_sensitive_case_above_fat_guardrail",
    "raw_or_unbalanced_food_without_explicit_supervised_context",
  ],
  energyRules: [
    {
      id: "dog_rer_all_weights",
      species: "dog",
      formula: "RER = 70 * body_weight_kg^0.75",
      appliesWhen: "Any dog calorie estimate; preferred general equation.",
      confidence: "high",
      source: "MSD_MERCK",
    },
    {
      id: "dog_rer_linear_fallback",
      species: "dog",
      formula: "RER = 30 * body_weight_kg + 70",
      appliesWhen: "Approximate shortcut for typical adult dogs in the supported body-weight range.",
      confidence: "medium",
      source: "MSD_MERCK",
    },
    {
      id: "cat_adult_mer_indoor_neutered",
      species: "cat",
      formula: "MER ~= 75 * body_weight_kg^0.67",
      appliesWhen: "Indoor or neutered adult cats when no stronger clinic factor exists.",
      confidence: "medium",
      source: "FEDIAF_2025",
    },
  ],
  waterRules: [
    {
      id: "free_choice_water",
      formulaOrStrategy: "Fresh water should be available at all times.",
      appliesWhen: "All pets.",
      source: "WSAVA",
      notes: "Use as a universal guidance note rather than a precise dosing rule.",
    },
    {
      id: "water_ml_per_kcal_strategy",
      formulaOrStrategy: "Approximate working target: about 1 ml water per kcal ME consumed, when a clinic formula is not configured.",
      appliesWhen: "Hydration planning, dry-fed pets, urinary context, hot weather, or increased activity.",
      source: "MSD_MERCK",
      notes: "Use as a practical range and explain that individual needs vary.",
    },
  ],
  baselineNutrientGuardrails: [
    {
      id: "adult_dog_protein_min_aafco_dm",
      label: "Adult dog protein minimum",
      species: "dog",
      basis: "dry_matter",
      unit: "percent",
      min: 18,
      severity: "hard_filter",
      source: "AAFCO",
      notes: "Baseline adequacy screen, not a disease-therapy target.",
    },
    {
      id: "growth_dog_protein_min_aafco_dm",
      label: "Growth dog protein minimum",
      species: "dog",
      basis: "dry_matter",
      unit: "percent",
      min: 22.5,
      severity: "hard_filter",
      source: "AAFCO",
      notes: "Puppy/growth adequacy screen.",
    },
    {
      id: "adult_dog_fat_min_aafco_dm",
      label: "Adult dog fat minimum",
      species: "dog",
      basis: "dry_matter",
      unit: "percent",
      min: 5.5,
      severity: "hard_filter",
      source: "AAFCO",
      notes: "Baseline adequacy screen for complete adult diets.",
    },
    {
      id: "large_breed_puppy_calcium_max_dm",
      label: "Large-breed puppy calcium upper guardrail",
      species: "dog",
      basis: "dry_matter",
      unit: "percent",
      max: 1.8,
      severity: "hard_filter",
      source: "AAFCO",
      notes: "Use as a growth safety rule when calcium data are available.",
    },
    {
      id: "adult_dog_ca_p_ratio",
      label: "Adult dog calcium phosphorus ratio",
      species: "dog",
      basis: "dry_matter",
      unit: "ratio",
      min: 1,
      max: 2,
      severity: "strong_preference",
      source: "FEDIAF_2025",
      notes: "Use when both calcium and phosphorus are available.",
    },
  ],
  diseaseRules: [
    {
      id: "renal_first",
      scenario: "renal",
      hardFilters: ["Prefer renal therapeutic diets; do not substitute generic high-protein/high-phosphorus foods when renal options exist."],
      boostSignals: ["renal_support_tag", "lower_phosphorus_when_available", "documented_omega3_or_epa_dha"],
      requiredDataForHighConfidence: ["phosphorus", "protein", "kcal", "source_quality"],
      uncertaintyRules: ["If renal stage is missing, lower confidence and recommend veterinary confirmation."],
      vetReferralRules: ["Known kidney disease needs veterinarian-guided diet selection and monitoring."],
      source: ["MSD_MERCK", "CLINIC_REVIEW_REQUIRED"],
    },
    {
      id: "urinary_hydration_first",
      scenario: "urinary",
      hardFilters: ["Prefer urinary therapeutic diets when urinary disease, stones, crystals, or obstruction history is present."],
      boostSignals: ["urinary_support_tag", "wet_or_mixed_feeding", "magnesium_and_phosphorus_available"],
      requiredDataForHighConfidence: ["urinary_positioning", "kcal", "magnesium", "phosphorus"],
      uncertaintyRules: ["If stone type is unknown, do not invent pH or mineral targets."],
      vetReferralRules: ["Male cat straining or unable to urinate is urgent veterinary care."],
      source: ["FDA", "WSAVA", "CLINIC_REVIEW_REQUIRED"],
    },
    {
      id: "weight_control_calorie_first",
      scenario: "weight_control",
      hardFilters: ["Avoid calorie-dense standard diets when safer weight-management options exist."],
      boostSignals: ["lower_kcal_density", "weight_management_tag", "satiety_fiber", "protein_available"],
      requiredDataForHighConfidence: ["kcal", "protein", "fat", "fiber", "weight_goal"],
      uncertaintyRules: ["If ideal weight or BCS is missing, use cautious calorie targets and lower confidence."],
      vetReferralRules: ["Rapid weight loss, poor appetite, or concurrent disease needs veterinary review."],
      source: ["AAHA", "WSAVA"],
    },
    {
      id: "allergy_elimination_logic",
      scenario: "allergy",
      hardFilters: ["Exclude declared allergens or avoided ingredients when detected in ingredient text."],
      boostSignals: ["hydrolyzed", "novel_protein", "monoprotein", "clear_ingredient_text"],
      requiredDataForHighConfidence: ["ingredient_text", "allergy_history", "protein_sources"],
      uncertaintyRules: ["Suspected allergy is not a diagnosis; elimination trials need strict control."],
      vetReferralRules: ["Severe allergy symptoms or persistent skin/ear/GI signs need veterinary review."],
      source: ["WSAVA", "CLINIC_REVIEW_REQUIRED"],
    },
    {
      id: "pancreatitis_low_fat_guardrail",
      scenario: "pancreatitis",
      hardFilters: ["Hold high-fat foods when pancreatitis or marked fat sensitivity is present."],
      boostSignals: ["low_fat", "gastrointestinal_support", "kcal_available"],
      requiredDataForHighConfidence: ["fat", "kcal", "gi_positioning"],
      uncertaintyRules: ["If fat per 1000 kcal cannot be calculated, confidence stays low."],
      vetReferralRules: ["Pancreatitis or severe abdominal pain requires veterinary direction."],
      source: ["MSD_MERCK", "CLINIC_REVIEW_REQUIRED"],
    },
  ],
  confidenceRubric: {
    high: [
      "Pet species, life stage, size, goal, and major exclusions are known.",
      "Top foods have matching Food V2 data with kcal, core macros, relevant minerals, ingredients, and source traceability.",
      "No hard safety filters were triggered for top recommendations.",
    ],
    medium: [
      "The safe class is clear, but some minerals, optional nutrients, price, or disease-stage details are missing.",
      "Foods may be needs_review but still have enough core data for cautious ranking.",
    ],
    low: [
      "Critical pet context, product match, kcal, ingredients, or disease-stage details are missing.",
      "Use as a shortlist only, not a final formula-specific recommendation.",
    ],
    no_safe_match: [
      "All candidate foods were held by hard filters or the catalog lacks an appropriate option.",
      "Explain why foods were held and request the minimum missing data or veterinary confirmation.",
    ],
  },
};

export function scoringWeightsForScenario(scenario: RecommendationScenario) {
  if (scenario === "weight_control") return recommendationRulesRegistry.scoringWeights.weight_control;
  if (scenario === "allergy") return recommendationRulesRegistry.scoringWeights.allergy;
  if (scenario === "urinary") return recommendationRulesRegistry.scoringWeights.urinary;
  if (["renal", "diabetes", "pancreatitis", "sensitive_digestion"].includes(scenario)) {
    return recommendationRulesRegistry.scoringWeights.therapeutic;
  }

  return recommendationRulesRegistry.scoringWeights.default;
}
