import type { Food } from "@/types/food";

export type PetConditionSignal = "weight" | "kidney" | "digestive" | "urinary";

const CONDITION_ALIASES: Record<PetConditionSignal, string[]> = {
  weight: ["obesity", "obese", "overweight", "weight", "slimming"],
  kidney: ["kidney", "renal", "ckd"],
  digestive: [
    "sensitive",
    "digestion",
    "digestive",
    "stomach",
    "gastrointestinal",
    "diarrhea",
    "diarrhoea",
    "gi",
  ],
  urinary: ["urinary", "struvite", "crystal", "bladder"],
};

const FOOD_SUPPORT_ALIASES: Record<PetConditionSignal, string[]> = {
  weight: ["weight control", "weight management", "light", "satiety"],
  kidney: ["kidney support", "renal", "renal support", "kidney"],
  digestive: [
    "sensitive stomach",
    "sensitive digestion",
    "digestive",
    "gastrointestinal",
  ],
  urinary: ["urinary", "urinary support", "urinary health", "struvite"],
};

function normalizeSignal(value: string) {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAlias(value: string, aliases: string[]) {
  const normalizedValue = normalizeSignal(value);
  return aliases.some((alias) => normalizedValue.includes(normalizeSignal(alias)));
}

export function hasPetCondition(
  healthIssues: string[] | undefined,
  condition: PetConditionSignal
) {
  return (healthIssues ?? []).some((issue) =>
    includesAlias(issue, CONDITION_ALIASES[condition])
  );
}

export function foodSupportsCondition(food: Food, condition: PetConditionSignal) {
  const searchableSignals = [...food.healthSupport, ...food.tags];

  return searchableSignals.some((signal) =>
    includesAlias(signal, FOOD_SUPPORT_ALIASES[condition])
  );
}
