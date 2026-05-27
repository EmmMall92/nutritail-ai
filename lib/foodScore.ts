type FoodScoreInput = {
  species: string;
  age: number;
  neutered: boolean;
  activityLevel: string;
  weightGoal?: "maintain" | "loss" | "gain";

  protein?: number | null;
  fat?: number | null;
  fiber?: number | null;

  sodium?: number | null;
  magnesium?: number | null;

  lifeStage?: string | null;
};

function finiteNumberOrNull(value: number | null | undefined): number | null {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function calculateFoodScore(
  input: FoodScoreInput
) {
  let score = 50;

  const protein = finiteNumberOrNull(input.protein);
  const fat = finiteNumberOrNull(input.fat);
  const fiber = finiteNumberOrNull(input.fiber);
  const sodium = finiteNumberOrNull(input.sodium);
  const magnesium = finiteNumberOrNull(input.magnesium);

  // Cats prefer higher protein
  if (input.species === "cat" && protein !== null) {
    if (protein >= 38) score += 12;
    else if (protein >= 32) score += 8;
    else if (protein < 28) score -= 10;
  }

  // Dogs
  if (input.species === "dog" && protein !== null) {
    if (protein >= 28) score += 8;
    else if (protein < 20) score -= 8;
  }

  // Sterilised pets
  if (input.neutered && fat !== null) {
    if (fat <= 14) score += 8;
    if (fat >= 20) score -= 10;
  }

  // Weight loss
  if (input.weightGoal === "loss") {
    if (fiber !== null && fiber >= 5) score += 8;
    if (fat !== null && fat <= 12) score += 6;
    if (fat !== null && fat >= 18) score -= 12;
  }

  // Weight gain
  if (input.weightGoal === "gain" && fat !== null) {
    if (fat >= 18) score += 8;
  }

  // Active pets
  if (input.activityLevel === "high") {
    if (protein !== null && protein >= 30) score += 6;
    if (fat !== null && fat >= 16) score += 4;
  }

  // Urinary sensitivity logic for cats
  if (input.species === "cat") {
    if (magnesium !== null && magnesium > 0 && magnesium <= 0.09) {
      score += 6;
    }

    if (sodium !== null && sodium >= 0.3 && sodium <= 0.6) {
      score += 3;
    }
  }

  // Senior pets
  if (input.age >= 7 && fat !== null) {
    if (fat >= 20) score -= 5;
  }

  // Life stage bonus
  if (input.lifeStage) {
    const stage = input.lifeStage.toLowerCase();

    if (
      input.age < 1 &&
      (stage.includes("puppy") ||
        stage.includes("kitten") ||
        stage.includes("young") ||
        stage.includes("growth"))
    ) {
      score += 10;
    }

    if (
      input.age >= 7 &&
      (stage.includes("senior") ||
        stage.includes("aging") ||
        stage.includes("ageing") ||
        stage.includes("elderly"))
    ) {
      score += 6;
    }
  }

  return Math.max(0, Math.min(100, score));
}
