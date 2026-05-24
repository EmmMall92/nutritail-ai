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

export function calculateRER(weight: number) {
  return 70 * Math.pow(weight, 0.75);
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

export function getNutritionGuidance(pet: Pet): NutritionResult {
  const rer = calculateRER(pet.weight);
  const der = calculateDER(pet);

  const isSenior = pet.age >= 7;
  const hasWeightIssue =
    pet.healthIssues?.some((issue) =>
      issue.toLowerCase().includes("obesity")
    ) ?? false;
  const hasKidneyIssue =
    pet.healthIssues?.some((issue) =>
      issue.toLowerCase().includes("kidney")
    ) ?? false;

  const protein = pet.species === "dog" ? "24-28%" : "30-40%";
  let fat = pet.species === "dog" ? "12-16%" : "15-20%";
  let fiber = "3-5%";
  let sodium = "0.2-0.4%";
  const magnesium = "0.04-0.1%";
  const calcium = "0.8-1.5%";
  let phosphorus = "0.6-1.2%";

  if (isSenior) {
    fat = pet.species === "dog" ? "10-14%" : "12-18%";
  }

  if (hasWeightIssue) {
    fat = "8-12%";
    fiber = "5-10%";
  }

  if (hasKidneyIssue) {
    phosphorus = "0.3-0.6%";
    sodium = "0.1-0.3%";
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