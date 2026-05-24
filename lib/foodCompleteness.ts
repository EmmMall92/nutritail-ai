export type FoodCompletenessInput = {
  kcal_per_100g?: number | null;
  protein?: number | null;
  fat?: number | null;
  fiber?: number | null;
  sodium?: number | null;
  magnesium?: number | null;
  calcium?: number | null;
  phosphorus?: number | null;
  protein_percent?: number | null;
  fat_percent?: number | null;
  fiber_percent?: number | null;
  sodium_percent?: number | null;
  magnesium_percent?: number | null;
  calcium_percent?: number | null;
  phosphorus_percent?: number | null;
};

const REQUIRED_FIELDS: Array<keyof FoodCompletenessInput> = [
  "kcal_per_100g",
  "protein_percent",
  "fat_percent",
  "fiber_percent",
  "sodium_percent",
  "magnesium_percent",
  "calcium_percent",
  "phosphorus_percent",
];

const LEGACY_FIELD_FALLBACKS: Partial<
  Record<keyof FoodCompletenessInput, keyof FoodCompletenessInput>
> = {
  protein_percent: "protein",
  fat_percent: "fat",
  fiber_percent: "fiber",
  sodium_percent: "sodium",
  magnesium_percent: "magnesium",
  calcium_percent: "calcium",
  phosphorus_percent: "phosphorus",
};

function hasNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

export function getFoodCompleteness(food: FoodCompletenessInput) {
  const filled = REQUIRED_FIELDS.filter((field) => {
    const value = food[field];
    const fallbackField = LEGACY_FIELD_FALLBACKS[field];

    return (
      hasNumber(value) ||
      (fallbackField ? hasNumber(food[fallbackField]) : false)
    );
  });

  const missing = REQUIRED_FIELDS.filter((field) => !filled.includes(field));
  const score = Math.round((filled.length / REQUIRED_FIELDS.length) * 100);

  return {
    score,
    filledCount: filled.length,
    totalCount: REQUIRED_FIELDS.length,
    missing,
    isComplete: score === 100,
  };
}
