import type { FoodFormat, FoodNutrientsV2 } from "@/types/food-v2";

export type EnergyConfidence = "high" | "medium" | "low" | "unavailable";

export type EnergyEstimateInput = Pick<
  FoodNutrientsV2,
  | "protein_percent"
  | "fat_percent"
  | "fiber_percent"
  | "ash_percent"
  | "moisture_percent"
> & {
  format?: FoodFormat | null;
  allowDryDefaults?: boolean;
};

export type EnergyEstimateResult = {
  method: "modified_atwater";
  kcal_per_100g: number | null;
  kcal_per_kg: number | null;
  carbohydrate_percent: number | null;
  confidence: EnergyConfidence;
  used_defaults: {
    ash_percent?: number;
    moisture_percent?: number;
  };
  warnings: string[];
  source_note: string | null;
};

const MODIFIED_ATWATER_FACTORS = {
  protein: 3.5,
  fat: 8.5,
  carbohydrate: 3.5,
} as const;

const DRY_FOOD_DEFAULTS = {
  ash_percent: 7,
  moisture_percent: 10,
} as const;

export const ENERGY_SCIENTIFIC_PRINCIPLES = [
  {
    id: "energy_is_not_a_nutrient",
    principle:
      "Energy is required for growth, maintenance, reproduction and work, but it is evaluated through the usable energy supplied by protein, fat and carbohydrate.",
  },
  {
    id: "me_is_preferred_for_feeding",
    principle:
      "Metabolizable energy is the practical label value for deciding how much food to feed.",
  },
  {
    id: "modified_atwater_for_pet_food",
    principle:
      "Commercial pet foods are commonly estimated with modified Atwater factors because ordinary human-food Atwater factors can overestimate pet-food energy.",
  },
  {
    id: "label_energy_beats_estimate",
    principle:
      "Published manufacturer or label kcal values outrank calculated energy estimates.",
  },
] as const;

export const ENERGY_DECISION_RULES = [
  {
    id: "use_official_energy_first",
    when: ["kcal_per_100g or kcal_per_kg is present"],
    then: "Use the provided kcal value and do not estimate.",
  },
  {
    id: "estimate_from_proximate_analysis",
    when: ["kcal is missing", "protein_percent present", "fat_percent present"],
    then: "Estimate kcal using modified Atwater factors if carbohydrate can be estimated.",
  },
  {
    id: "dry_defaults_allowed_for_preview",
    when: ["dry food", "ash_percent or moisture_percent missing", "protein/fat/fiber available"],
    then: "Use conservative dry-food defaults for admin preview only and mark kcal as estimated.",
  },
  {
    id: "wet_defaults_not_allowed",
    when: ["wet food", "moisture_percent missing"],
    then: "Do not estimate calories automatically because moisture drives wet-food energy density.",
  },
] as const;

export const ENERGY_RECOMMENDATION_LOGIC = [
  {
    id: "portion_advice_requires_energy",
    logic:
      "Portion-size recommendations require kcal_per_100g or kcal_per_kg; estimated kcal can provide a starting point but should be labelled clearly.",
  },
  {
    id: "weight_control_needs_energy_density",
    logic:
      "Weight-control comparisons should consider energy density alongside protein, fat, fiber and satiety signals.",
  },
] as const;

export const ENERGY_CONTRAINDICATIONS = [
  {
    id: "do_not_estimate_from_ingredients_only",
    rule:
      "Do not estimate kcal from ingredient list alone without proximate analysis.",
  },
  {
    id: "do_not_treat_estimate_as_verified",
    rule:
      "Calculated kcal is estimated data and must not convert a food row to verified quality.",
  },
] as const;

export const ENERGY_UNCERTAINTY_RULES = [
  {
    id: "missing_ash_or_moisture_lowers_confidence",
    rule:
      "Using default ash or moisture values lowers confidence and must be recorded in source notes.",
  },
  {
    id: "negative_carbohydrate_blocks_estimate",
    rule:
      "If calculated carbohydrate is negative or above 100%, do not estimate kcal and keep the row blocked for review.",
  },
] as const;

function hasFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function resolveAshPercent(input: EnergyEstimateInput) {
  if (hasFiniteNumber(input.ash_percent)) {
    return { value: input.ash_percent, defaulted: false };
  }

  if (input.format === "dry" && input.allowDryDefaults !== false) {
    return { value: DRY_FOOD_DEFAULTS.ash_percent, defaulted: true };
  }

  return { value: null, defaulted: false };
}

function resolveMoisturePercent(input: EnergyEstimateInput) {
  if (hasFiniteNumber(input.moisture_percent)) {
    return { value: input.moisture_percent, defaulted: false };
  }

  if (input.format === "dry" && input.allowDryDefaults !== false) {
    return { value: DRY_FOOD_DEFAULTS.moisture_percent, defaulted: true };
  }

  return { value: null, defaulted: false };
}

export function estimateCarbohydratePercent(input: EnergyEstimateInput) {
  const ash = resolveAshPercent(input);
  const moisture = resolveMoisturePercent(input);

  if (
    !hasFiniteNumber(input.protein_percent) ||
    !hasFiniteNumber(input.fat_percent) ||
    !hasFiniteNumber(input.fiber_percent) ||
    !hasFiniteNumber(ash.value) ||
    !hasFiniteNumber(moisture.value)
  ) {
    return null;
  }

  return round1(
    100 -
      input.protein_percent -
      input.fat_percent -
      input.fiber_percent -
      ash.value -
      moisture.value
  );
}

export function estimateKcalPer100gModifiedAtwater(
  input: EnergyEstimateInput
): EnergyEstimateResult {
  const warnings: string[] = [];
  const proteinPercent = input.protein_percent;
  const fatPercent = input.fat_percent;
  const fiberPercent = input.fiber_percent;

  if (!hasFiniteNumber(proteinPercent)) warnings.push("missing_protein_percent");
  if (!hasFiniteNumber(fatPercent)) warnings.push("missing_fat_percent");
  if (!hasFiniteNumber(fiberPercent)) warnings.push("missing_fiber_percent");

  const ash = resolveAshPercent(input);
  const moisture = resolveMoisturePercent(input);
  const used_defaults: EnergyEstimateResult["used_defaults"] = {};

  if (ash.defaulted) used_defaults.ash_percent = ash.value ?? undefined;
  if (moisture.defaulted) {
    used_defaults.moisture_percent = moisture.value ?? undefined;
  }

  if (!hasFiniteNumber(ash.value)) warnings.push("missing_ash_percent");
  if (!hasFiniteNumber(moisture.value)) warnings.push("missing_moisture_percent");

  const carbohydrate_percent = estimateCarbohydratePercent(input);
  if (!hasFiniteNumber(carbohydrate_percent)) {
    return {
      method: "modified_atwater",
      kcal_per_100g: null,
      kcal_per_kg: null,
      carbohydrate_percent: null,
      confidence: "unavailable",
      used_defaults,
      warnings,
      source_note: null,
    };
  }

  if (carbohydrate_percent < 0 || carbohydrate_percent > 100) {
    return {
      method: "modified_atwater",
      kcal_per_100g: null,
      kcal_per_kg: null,
      carbohydrate_percent,
      confidence: "unavailable",
      used_defaults,
      warnings: [...warnings, "impossible_carbohydrate_percent"],
      source_note: null,
    };
  }

  if (!hasFiniteNumber(proteinPercent) || !hasFiniteNumber(fatPercent)) {
    return {
      method: "modified_atwater",
      kcal_per_100g: null,
      kcal_per_kg: null,
      carbohydrate_percent,
      confidence: "unavailable",
      used_defaults,
      warnings,
      source_note: null,
    };
  }

  const kcal_per_100g = round1(
    proteinPercent * MODIFIED_ATWATER_FACTORS.protein +
      fatPercent * MODIFIED_ATWATER_FACTORS.fat +
      carbohydrate_percent * MODIFIED_ATWATER_FACTORS.carbohydrate
  );

  const confidence: EnergyConfidence =
    Object.keys(used_defaults).length === 0 ? "high" : "medium";
  const source_note = [
    "kcal_estimated=true",
    "kcal_estimation_method=modified_atwater",
    `estimated_carbohydrate_percent=${carbohydrate_percent}`,
    used_defaults.ash_percent !== undefined
      ? `default_ash_percent=${used_defaults.ash_percent}`
      : "",
    used_defaults.moisture_percent !== undefined
      ? `default_moisture_percent=${used_defaults.moisture_percent}`
      : "",
    `kcal_estimation_confidence=${confidence}`,
  ]
    .filter(Boolean)
    .join("; ");

  return {
    method: "modified_atwater",
    kcal_per_100g,
    kcal_per_kg: round1(kcal_per_100g * 10),
    carbohydrate_percent,
    confidence,
    used_defaults,
    warnings,
    source_note,
  };
}
