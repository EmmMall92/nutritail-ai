import type {
  FoodDataQualityStatus,
  NormalizedFoodRow,
} from "@/types/food-dataset";

type EnergyInput = {
  kcalPer100g?: number | null;
  kcalPerKg?: number | null;
  kcalPerCan?: number | null;
  canGrams?: number | null;
  kJPerKg?: number | null;
};

export type NutritionUnit =
  | "percent"
  | "g_per_100g"
  | "g_per_kg"
  | "mg_per_kg";

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function energyToKcalPer100g(input: EnergyInput): number | null {
  if (input.kcalPer100g !== null && input.kcalPer100g !== undefined) {
    return round1(input.kcalPer100g);
  }

  if (input.kcalPerKg !== null && input.kcalPerKg !== undefined) {
    return round1(input.kcalPerKg / 10);
  }

  if (
    input.kcalPerCan !== null &&
    input.kcalPerCan !== undefined &&
    input.canGrams !== null &&
    input.canGrams !== undefined &&
    input.canGrams > 0
  ) {
    return round1((input.kcalPerCan / input.canGrams) * 100);
  }

  if (input.kJPerKg !== null && input.kJPerKg !== undefined) {
    return round1(input.kJPerKg / 4.184 / 10);
  }

  return null;
}

export function percentFromUnit(
  value: number,
  unit: NutritionUnit
): number | null {
  if (!Number.isFinite(value)) return null;

  if (unit === "percent" || unit === "g_per_100g") return round3(value);
  if (unit === "g_per_kg") return round3(value / 10);
  if (unit === "mg_per_kg") return round3(value / 10000);

  return null;
}

export function classifyFoodRow(row: NormalizedFoodRow): FoodDataQualityStatus {
  const official = row.data_notes?.includes("source_tier=official") ?? false;
  const coreComplete = Boolean(
    row.brand &&
      row.name &&
      row.species &&
      row.ingredients.length > 0 &&
      row.kcal_per_100g !== null &&
      row.protein_percent !== null &&
      row.fat_percent !== null &&
      row.fiber_percent !== null &&
      row.calcium_percent !== null &&
      row.phosphorus_percent !== null
  );
  const fullMinerals =
    row.sodium_percent !== null && row.magnesium_percent !== null;

  if (official && coreComplete && fullMinerals) return "verified";
  if (official && coreComplete) return "partial";
  if (coreComplete) return "needs_review";

  return "unknown";
}
