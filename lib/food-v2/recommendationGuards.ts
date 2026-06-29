import type {
  FoodV2RankingResult,
  FoodV2RankingSignal,
} from "@/lib/food-v2/recommendationRanking";

export type FoodV2RecommendationGuardSeverity = "block" | "warning" | "info";

export type FoodV2RecommendationGuardFlag = {
  code: string;
  severity: FoodV2RecommendationGuardSeverity;
  message: string;
};

const SIGNAL_GUARDS: Record<
  string,
  Omit<FoodV2RecommendationGuardFlag, "message"> & { fallbackMessage: string }
> = {
  species_mismatch: {
    code: "species_mismatch",
    severity: "block",
    fallbackMessage: "Different species.",
  },
  dog_size_mismatch: {
    code: "dog_size_mismatch",
    severity: "block",
    fallbackMessage: "Breed-size positioning does not fit this dog.",
  },
  customer_visible_dog_size_mismatch: {
    code: "customer_visible_dog_size_mismatch",
    severity: "block",
    fallbackMessage: "Customer-visible breed-size positioning does not fit this dog.",
  },
  small_dog_medium_visible_mismatch: {
    code: "small_dog_medium_visible_mismatch",
    severity: "block",
    fallbackMessage:
      "A visibly medium-positioned formula is not the best starting point for this small dog.",
  },
  contradicting_species_label: {
    code: "contradicting_species_label",
    severity: "block",
    fallbackMessage: "Customer-visible product label appears to target a different species.",
  },
  therapeutic_food_without_matching_condition: {
    code: "therapeutic_food_without_matching_condition",
    severity: "block",
    fallbackMessage:
      "Veterinary or therapeutic positioning does not match this pet context.",
  },
  urinary_goal_without_urinary_positioning: {
    code: "urinary_goal_without_urinary_positioning",
    severity: "block",
    fallbackMessage: "Urinary cases need urinary-positioned foods.",
  },
  renal_urinary_mismatch: {
    code: "renal_urinary_mismatch",
    severity: "block",
    fallbackMessage:
      "Urinary/oxalate positioning does not replace renal diet support.",
  },
  urinary_renal_mismatch: {
    code: "urinary_renal_mismatch",
    severity: "block",
    fallbackMessage:
      "Renal positioning does not replace urinary or stone-specific diet support.",
  },
  urinary_subtype_mismatch: {
    code: "urinary_subtype_mismatch",
    severity: "block",
    fallbackMessage:
      "Struvite and oxalate urinary contexts should not be treated as interchangeable.",
  },
  growth_food_for_adult_pet: {
    code: "growth_food_for_adult_pet",
    severity: "block",
    fallbackMessage: "Growth food does not fit an adult or senior pet.",
  },
  adult_food_for_puppy_growth: {
    code: "adult_food_for_puppy_growth",
    severity: "block",
    fallbackMessage: "Puppy growth cases need puppy or all-life-stage food.",
  },
  adult_food_for_growth_pet: {
    code: "adult_food_for_growth_pet",
    severity: "block",
    fallbackMessage: "Growth-stage pets need puppy, kitten, junior or all-life-stage food.",
  },
  adult_food_for_kitten_growth: {
    code: "adult_food_for_kitten_growth",
    severity: "block",
    fallbackMessage: "Kitten growth cases need kitten or all-life-stage food.",
  },
  implausibly_low_fat_growth_food: {
    code: "implausibly_low_fat_growth_food",
    severity: "block",
    fallbackMessage:
      "Declared fat looks implausibly low for a dry growth food and needs data review.",
  },
  obesity_active_formula_mismatch: {
    code: "obesity_active_formula_mismatch",
    severity: "block",
    fallbackMessage:
      "Active/performance food does not fit this weight-loss context.",
  },
  obesity_high_energy_high_fat: {
    code: "obesity_high_energy_high_fat",
    severity: "block",
    fallbackMessage:
      "High calories and high fat conflict with the weight-loss goal.",
  },
  high_energy_fat_weight_sensitive: {
    code: "high_energy_fat_weight_sensitive",
    severity: "block",
    fallbackMessage:
      "Calories and fat are too high for a first weight-control shortlist.",
  },
  sterilised_high_energy_fat_mismatch: {
    code: "sterilised_high_energy_fat_mismatch",
    severity: "block",
    fallbackMessage:
      "This is too energy-dense for a sterilised maintenance shortlist.",
  },
  sterilised_rich_formula_mismatch: {
    code: "sterilised_rich_formula_mismatch",
    severity: "block",
    fallbackMessage:
      "Calories and fat are too rich for a first sterilised-pet shortlist.",
  },
  small_sterilised_rich_formula_mismatch: {
    code: "small_sterilised_rich_formula_mismatch",
    severity: "block",
    fallbackMessage:
      "Small sterilised pets need leaner first-shortlist options.",
  },
  small_sterilised_generic_without_lean_evidence: {
    code: "small_sterilised_generic_without_lean_evidence",
    severity: "block",
    fallbackMessage:
      "Small sterilised pets need visible sterilised/light positioning or lean calorie and fat evidence.",
  },
  active_formula_for_weight_sensitive_pet: {
    code: "active_formula_for_weight_sensitive_pet",
    severity: "block",
    fallbackMessage:
      "Active/performance food is a poor first choice for this weight-sensitive context.",
  },
  light_formula_for_high_activity_pet: {
    code: "light_formula_for_high_activity_pet",
    severity: "block",
    fallbackMessage:
      "Light/sterilised energy positioning is a poor first choice for a high-activity pet.",
  },
  low_fat_formula_for_active_gain_pet: {
    code: "low_fat_formula_for_active_gain_pet",
    severity: "block",
    fallbackMessage:
      "Low-fat formulas are not a credible first pick for active weight-gain cases.",
  },
  senior_active_energy_mismatch: {
    code: "senior_active_energy_mismatch",
    severity: "block",
    fallbackMessage:
      "Active/high-energy food is not a first pick for a low-activity senior pet.",
  },
  senior_positioning_not_customer_visible: {
    code: "senior_positioning_not_customer_visible",
    severity: "block",
    fallbackMessage:
      "Senior shortlists should prefer foods with senior positioning visible to customers.",
  },
  gas_context_monoprotein_without_digestive_support: {
    code: "gas_context_monoprotein_without_digestive_support",
    severity: "block",
    fallbackMessage:
      "Chronic gas contexts need visible digestive, sensitive, or GI support rather than monoprotein positioning alone.",
  },
  adjacent_dog_size_mismatch: {
    code: "adjacent_dog_size_mismatch",
    severity: "warning",
    fallbackMessage: "Breed-size positioning is adjacent but not exact.",
  },
  allergen_conflict: {
    code: "allergen_conflict",
    severity: "block",
    fallbackMessage: "Contains a declared allergen.",
  },
  excluded_ingredient_preference: {
    code: "excluded_ingredient_preference",
    severity: "block",
    fallbackMessage: "Contains an ingredient or flavor the pet should avoid.",
  },
  life_stage_mismatch: {
    code: "life_stage_mismatch",
    severity: "warning",
    fallbackMessage: "Life stage is not an exact match.",
  },
  large_breed_growth_mineral_gap: {
    code: "large_breed_growth_mineral_gap",
    severity: "warning",
    fallbackMessage: "Large-breed puppy recommendation lacks mineral confidence.",
  },
  missing_urinary_minerals: {
    code: "missing_urinary_minerals",
    severity: "warning",
    fallbackMessage: "Urinary reasoning lacks key mineral data.",
  },
  missing_phosphorus_renal: {
    code: "missing_phosphorus_renal",
    severity: "warning",
    fallbackMessage: "Renal reasoning needs phosphorus data.",
  },
  renal_needs_vet_food: {
    code: "renal_needs_vet_food",
    severity: "warning",
    fallbackMessage: "Renal cases need veterinarian-directed diet selection.",
  },
  pancreatitis_high_fat_mismatch: {
    code: "pancreatitis_high_fat_mismatch",
    severity: "block",
    fallbackMessage:
      "Pancreatitis history should not start from higher-fat foods.",
  },
  pancreatitis_missing_fat: {
    code: "pancreatitis_missing_fat",
    severity: "warning",
    fallbackMessage:
      "Pancreatitis context needs fat data before confident shortlisting.",
  },
  pancreatitis_requires_vet: {
    code: "pancreatitis_requires_vet",
    severity: "warning",
    fallbackMessage:
      "Pancreatitis history needs veterinarian-directed diet selection.",
  },
};

function flagFromSignal(signal: FoodV2RankingSignal) {
  const guard = SIGNAL_GUARDS[signal.code];
  if (!guard) return null;

  return {
    code: guard.code,
    severity: guard.severity,
    message: signal.message || guard.fallbackMessage,
  } satisfies FoodV2RecommendationGuardFlag;
}

export function detectFoodV2RecommendationGuardFlags(
  ranking: FoodV2RankingResult
) {
  const flags = ranking.signals
    .map(flagFromSignal)
    .filter((flag): flag is FoodV2RecommendationGuardFlag => Boolean(flag));
  const deduped = new Map<string, FoodV2RecommendationGuardFlag>();

  for (const flag of flags) {
    deduped.set(flag.code, flag);
  }

  if (ranking.bucket !== "hold" && [...deduped.values()].some((flag) => flag.severity === "block")) {
    deduped.set("block_signal_in_visible_bucket", {
      code: "block_signal_in_visible_bucket",
      severity: "block",
      message: "A blocking signal appeared outside the hold bucket.",
    });
  }

  return [...deduped.values()].sort((a, b) => {
    const order = { block: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity] || a.code.localeCompare(b.code);
  });
}

export function hasBlockingFoodV2RecommendationGuard(
  ranking: FoodV2RankingResult
) {
  return detectFoodV2RecommendationGuardFlags(ranking).some(
    (flag) => flag.severity === "block"
  );
}
