import type { Food } from "@/types/food";

export type PetConditionSignal = "weight" | "kidney" | "digestive" | "urinary";

const CONDITION_ALIASES: Record<PetConditionSignal, string[]> = {
  weight: [
    "obesity",
    "obese",
    "overweight",
    "weight",
    "slimming",
    "παχ",
    "βάρος",
    "pax",
    "varos",
  ],
  kidney: ["kidney", "renal", "ckd", "νεφρ", "nefr", "nefro"],
  digestive: [
    "sensitive",
    "digestion",
    "digestive",
    "stomach",
    "gastrointestinal",
    "diarrhea",
    "diarrhoea",
    "gi",
    "γαστρ",
    "διαρ",
    "εμετ",
    "gastr",
    "diarr",
    "emet",
  ],
  urinary: [
    "urinary",
    "struvite",
    "crystal",
    "bladder",
    "ουρο",
    "κατουρ",
    "ouro",
    "ourin",
    "katour",
  ],
};

const FOOD_SUPPORT_ALIASES: Record<PetConditionSignal, string[]> = {
  weight: [
    "weight control",
    "weight management",
    "light",
    "satiety",
    "slim",
    "obesity",
  ],
  kidney: ["kidney support", "renal", "renal support", "kidney", "renal care"],
  digestive: [
    "sensitive stomach",
    "sensitive digestion",
    "digestive",
    "gastrointestinal",
    "gastro",
  ],
  urinary: ["urinary", "urinary support", "urinary health", "struvite"],
};

function normalizeSignal(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
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
