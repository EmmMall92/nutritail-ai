import type { PetAnalysisHistory } from "@/types/pet-analysis-history";

export type PetAnalysisComparison = {
  previousRer: number;
  currentRer: number;
  rerDelta: number;

  previousMer: number;
  currentMer: number;
  merDelta: number;

  previousWeight?: number;
  currentWeight?: number;
  weightDelta?: number;

  previousFoodIds: string[];
  currentFoodIds: string[];

  addedFoodIds: string[];
  removedFoodIds: string[];

  summary: string[];
};

function buildSummary(params: {
  rerDelta: number;
  merDelta: number;
  weightDelta?: number;
  addedFoodIds: string[];
  removedFoodIds: string[];
}) {
  const summary: string[] = [];

  if (params.merDelta > 0) {
    summary.push("Energy needs increased compared to the previous analysis.");
  } else if (params.merDelta < 0) {
    summary.push("Energy needs decreased compared to the previous analysis.");
  } else {
    summary.push("Energy needs stayed stable.");
  }

  if (params.weightDelta !== undefined) {
    if (params.weightDelta > 0) {
      summary.push("Body weight increased.");
    } else if (params.weightDelta < 0) {
      summary.push("Body weight decreased.");
    } else {
      summary.push("Body weight stayed the same.");
    }
  }

  if (params.addedFoodIds.length > 0 || params.removedFoodIds.length > 0) {
    summary.push("Recommended foods changed.");
  } else {
    summary.push("Recommended foods remained the same.");
  }

  return summary;
}

export function comparePetAnalyses(
  previous: PetAnalysisHistory,
  current: PetAnalysisHistory
): PetAnalysisComparison {
  const previousFoodSet = new Set(previous.recommendedFoodIds);
  const currentFoodSet = new Set(current.recommendedFoodIds);

  const addedFoodIds = current.recommendedFoodIds.filter(
    (id) => !previousFoodSet.has(id)
  );

  const removedFoodIds = previous.recommendedFoodIds.filter(
    (id) => !currentFoodSet.has(id)
  );

  const hasWeights =
    typeof previous.weight === "number" && typeof current.weight === "number";

  const rerDelta = current.rer - previous.rer;
  const merDelta = current.mer - previous.mer;
  const weightDelta = hasWeights ? current.weight! - previous.weight! : undefined;

  return {
    previousRer: previous.rer,
    currentRer: current.rer,
    rerDelta,

    previousMer: previous.mer,
    currentMer: current.mer,
    merDelta,

    previousWeight: previous.weight,
    currentWeight: current.weight,
    weightDelta,

    previousFoodIds: previous.recommendedFoodIds,
    currentFoodIds: current.recommendedFoodIds,

    addedFoodIds,
    removedFoodIds,

    summary: buildSummary({
      rerDelta,
      merDelta,
      weightDelta,
      addedFoodIds,
      removedFoodIds,
    }),
  };
}