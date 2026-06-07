import type { FoodV2RankingResult } from "@/lib/food-v2/recommendationRanking";
import type {
  RecommendationScenario,
  ScoringComponent,
} from "@/lib/nutrition-rules/rulesRegistry";

export type RecommendationConfidenceLevel =
  | "high"
  | "medium"
  | "low"
  | "no_safe_match";

export type RecommendationCaseSummary = {
  species: "dog" | "cat";
  breed?: string | null;
  age_years?: number | null;
  age_months?: number | null;
  life_stage?: string | null;
  size_class?: string | null;
  weight_kg?: number | null;
  neuter_status?: string | null;
  activity_level?: string | null;
  health_conditions: string[];
  owner_constraints: string[];
};

export type RecommendationEnergyPlan = {
  rer_kcal_day?: number | null;
  mer_or_target_kcal_day?: number | null;
  calorie_basis:
    | "current_weight"
    | "ideal_weight"
    | "growth_formula"
    | "user_provided"
    | "fallback_factor"
    | "unknown";
  treat_allowance_kcal_day?: number | null;
  notes: string[];
};

export type RecommendationWaterPlan = {
  target_ml_day_low?: number | null;
  target_ml_day_high?: number | null;
  target_ml_day_preferred?: number | null;
  strategy_notes: string[];
};

export type RecommendationScoreBreakdown = Record<ScoringComponent, number>;

export type ContractFoodNutrientHighlights = {
  kcal_per_100g?: number | null;
  kcal_per_kg?: number | null;
  protein_percent?: number | null;
  fat_percent?: number | null;
  fiber_percent?: number | null;
  calcium_percent?: number | null;
  phosphorus_percent?: number | null;
  sodium_percent?: number | null;
  magnesium_percent?: number | null;
  omega3_percent?: number | null;
  omega6_percent?: number | null;
  epa_percent?: number | null;
  dha_percent?: number | null;
  epa_dha_percent?: number | null;
  moisture_percent?: number | null;
};

export type ContractRankedFood = {
  food_id?: string | null;
  formula_key: string;
  brand: string;
  display_name: string;
  total_score: number;
  confidence: Exclude<RecommendationConfidenceLevel, "no_safe_match">;
  score_breakdown: Partial<RecommendationScoreBreakdown>;
  why_it_matches: string[];
  nutrient_highlights: ContractFoodNutrientHighlights;
  feeding_guide?: {
    grams_per_day?: number | null;
    cans_or_pouches_per_day?: number | null;
    meals_per_day?: number | null;
    notes: string[];
  };
  cautions: string[];
  data_quality?: string | null;
  source_priority?: string | null;
  source_url?: string | null;
};

export type RecommendationContract = {
  schema_version: "nutritail_recommendation_contract_v1";
  case_summary: RecommendationCaseSummary;
  assumptions_used: string[];
  scenario: RecommendationScenario;
  energy_plan: RecommendationEnergyPlan;
  water_plan: RecommendationWaterPlan;
  ranked_foods: ContractRankedFood[];
  alternatives: ContractRankedFood[];
  avoid_list: Array<{
    label: string;
    reason: string;
    severity: "avoid" | "hold" | "monitor";
  }>;
  feeding_transition: {
    protocol_name: "standard_7_day" | "slow_gi_sensitive" | "veterinary_directed";
    steps: string[];
    notes: string[];
  };
  monitoring_points: string[];
  confidence: {
    level: RecommendationConfidenceLevel;
    drivers: string[];
    missing_data_penalties: string[];
  };
  sources: Array<{
    type: "rule" | "product" | "source";
    id: string;
    label: string;
  }>;
};

export type ContractFoodInput = {
  id?: string | null;
  formula_key: string;
  brand: string;
  display_name: string;
  data_quality_status?: string | null;
  source_priority?: string | null;
  data_source_url?: string | null;
  ranking: FoodV2RankingResult;
  nutrition?: ContractFoodNutrientHighlights | null;
};

function clampScore(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function contractConfidence(
  ranking: FoodV2RankingResult
): Exclude<RecommendationConfidenceLevel, "no_safe_match"> {
  if (ranking.confidence === "high") return "high";
  if (ranking.confidence === "low") return "low";
  return "medium";
}

export function toContractRankedFood(input: ContractFoodInput): ContractRankedFood {
  return {
    food_id: input.id ?? null,
    formula_key: input.formula_key,
    brand: input.brand,
    display_name: input.display_name,
    total_score: clampScore(input.ranking.total_score),
    confidence: contractConfidence(input.ranking),
    score_breakdown: {
      clinical_fit: clampScore(input.ranking.fit_score),
      nutrient_fit: clampScore(input.ranking.quality_score),
      owner_constraint_fit: clampScore(input.ranking.value_score),
    },
    why_it_matches: input.ranking.reasons,
    nutrient_highlights: input.nutrition ?? {},
    cautions: input.ranking.cautions,
    data_quality: input.data_quality_status ?? null,
    source_priority: input.source_priority ?? null,
    source_url: input.data_source_url ?? null,
  };
}

export function emptyRecommendationContract(
  input: Pick<RecommendationContract, "case_summary" | "scenario"> & {
    assumptions_used?: string[];
    avoid_list?: RecommendationContract["avoid_list"];
    confidence_drivers?: string[];
    missing_data_penalties?: string[];
  }
): RecommendationContract {
  return {
    schema_version: "nutritail_recommendation_contract_v1",
    case_summary: input.case_summary,
    assumptions_used: input.assumptions_used ?? [],
    scenario: input.scenario,
    energy_plan: {
      calorie_basis: "unknown",
      notes: ["No formula-specific calorie plan was generated."],
    },
    water_plan: {
      strategy_notes: ["Keep fresh water available and confirm hydration needs if urinary or kidney concerns exist."],
    },
    ranked_foods: [],
    alternatives: [],
    avoid_list: input.avoid_list ?? [],
    feeding_transition: {
      protocol_name: "standard_7_day",
      steps: [
        "Days 1-2: 75% old food + 25% new food.",
        "Days 3-4: 50% old food + 50% new food.",
        "Days 5-6: 25% old food + 75% new food.",
        "Day 7+: 100% new food if stool and appetite are stable.",
      ],
      notes: ["Use a slower transition for sensitive digestion or veterinary diets."],
    },
    monitoring_points: ["body weight trend", "appetite", "stool quality", "water intake"],
    confidence: {
      level: "no_safe_match",
      drivers: input.confidence_drivers ?? ["No candidate food passed the safety and fit filters."],
      missing_data_penalties: input.missing_data_penalties ?? [],
    },
    sources: [
      {
        type: "rule",
        id: "recommendation_contract_v1",
        label: "NutriTail structured recommendation contract",
      },
    ],
  };
}
