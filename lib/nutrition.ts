import type { Pet } from "@/types/pet";

export type NutritionResult = {
  rer: number;
  der: number;
  protein: string;
  fat: string;
  fiber: string;
  sodium: string;
  magnesium: string;
  calcium: string;
  phosphorus: string;
};

const MAX_NUTRITION_WEIGHT_KG = 150;

export function calculateRER(weight: number) {
  const normalizedWeight = Number(weight);

  if (
    !Number.isFinite(normalizedWeight) ||
    normalizedWeight <= 0 ||
    normalizedWeight > MAX_NUTRITION_WEIGHT_KG
  ) {
    return 0;
  }

  return 70 * Math.pow(normalizedWeight, 0.75);
}

export function getActivityFactor(pet: Pet) {
  if (pet.species === "cat") {
    if (pet.activityLevel === "low") return pet.neutered ? 1.0 : 1.2;
    if (pet.activityLevel === "normal") return pet.neutered ? 1.2 : 1.4;
    return 1.6;
  }

  if (pet.activityLevel === "low") return pet.neutered ? 1.2 : 1.4;
  if (pet.activityLevel === "normal") return pet.neutered ? 1.6 : 1.8;
  return 2.0;
}

export function calculateDER(pet: Pet) {
  const rer = calculateRER(pet.weight);
  const factor = getActivityFactor(pet);

  return rer * factor;
}

const WEIGHT_TERMS = ["obesity", "overweight", "weight", "παχ", "βάρος"];
const KIDNEY_TERMS = ["kidney", "renal", "ckd", "νεφρ"];
const URINARY_TERMS = ["urinary", "uti", "struvite", "crystal", "ουρο"];
const GI_TERMS = [
  "digest",
  "sensitive",
  "diarrhea",
  "diarrhoea",
  "stool",
  "gas",
  "γαστρ",
  "διαρ",
];

function hasHealthIssue(pet: Pet, terms: string[]) {
  const text = (pet.healthIssues ?? []).join(" ").toLowerCase();

  return terms.some((term) => text.includes(term));
}

export function getNutritionGuidance(pet: Pet): NutritionResult {
  const rer = calculateRER(pet.weight);
  const der = calculateDER(pet);

  const isSenior = pet.age >= 7;
  const hasWeightIssue = hasHealthIssue(pet, WEIGHT_TERMS) || pet.neutered;
  const hasKidneyIssue = hasHealthIssue(pet, KIDNEY_TERMS);
  const hasUrinaryIssue = hasHealthIssue(pet, URINARY_TERMS);
  const hasDigestiveIssue = hasHealthIssue(pet, GI_TERMS);

  const protein = pet.species === "dog" ? "24-28%" : "30-40%";
  let fat = pet.species === "dog" ? "12-16%" : "15-20%";
  let fiber = "3-5%";
  let sodium = "0.2-0.4%";
  let magnesium = "0.04-0.1%";
  const calcium = "0.8-1.5%";
  let phosphorus = "0.6-1.2%";

  if (isSenior) {
    fat = pet.species === "dog" ? "10-14%" : "12-18%";
  }

  if (hasWeightIssue) {
    fat = "8-12%";
    fiber = "5-10%";
  }

  if (hasDigestiveIssue) {
    fiber = "3-7%";
  }

  if (hasKidneyIssue) {
    phosphorus = "0.3-0.6%";
    sodium = "0.1-0.3%";
  }

  if (hasUrinaryIssue && pet.species === "cat") {
    magnesium = "0.04-0.09%";
    sodium = "confirm with urinary diet target";
  }

  return {
    rer: Math.round(rer),
    der: Math.round(der),
    protein,
    fat,
    fiber,
    sodium,
    magnesium,
    calcium,
    phosphorus,
  };
}
