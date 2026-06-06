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
