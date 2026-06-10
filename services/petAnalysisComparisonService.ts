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
  energyComparable: boolean;
  weightDelta?: number;
  addedFoodIds: string[];
  removedFoodIds: string[];
}) {
  const summary: string[] = [];

  if (!params.energyComparable) {
    summary.push("Energy comparison is unavailable for this analysis pair.");
  } else if (params.merDelta > 0) {
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
    summary.push("Legacy food analysis signals changed.");
  } else {
    summary.push("Legacy food analysis signals remained the same.");
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
    typeof previous.weight === "number" &&
    typeof current.weight === "number" &&
    Number.isFinite(previous.weight) &&
    Number.isFinite(current.weight);

  const rerComparable =
    Number.isFinite(current.rer) && Number.isFinite(previous.rer);
  const merComparable =
    Number.isFinite(current.mer) && Number.isFinite(previous.mer);
  const rerDelta = rerComparable ? current.rer - previous.rer : 0;
  const merDelta = merComparable ? current.mer - previous.mer : 0;
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
      energyComparable: rerComparable && merComparable,
      weightDelta,
      addedFoodIds,
      removedFoodIds,
    }),
  };
}
