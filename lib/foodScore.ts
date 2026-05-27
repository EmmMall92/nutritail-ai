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

export function calculateFoodScore(
  input: FoodScoreInput
) {
  let score = 50;

  const protein = Number(input.protein ?? 0);
  const fat = Number(input.fat ?? 0);
  const fiber = Number(input.fiber ?? 0);
  const sodium = Number(input.sodium ?? 0);
  const magnesium = Number(input.magnesium ?? 0);

  // Cats prefer higher protein
  if (input.species === "cat") {
    if (protein >= 38) score += 12;
    else if (protein >= 32) score += 8;
    else if (protein < 28) score -= 10;
  }

  // Dogs
  if (input.species === "dog") {
    if (protein >= 28) score += 8;
    else if (protein < 20) score -= 8;
  }

  // Sterilised pets
  if (input.neutered) {
    if (fat <= 14) score += 8;
    if (fat >= 20) score -= 10;
  }

  // Weight loss
  if (input.weightGoal === "loss") {
    if (fiber >= 5) score += 8;
    if (fat <= 12) score += 6;
    if (fat >= 18) score -= 12;
  }

  // Weight gain
  if (input.weightGoal === "gain") {
    if (fat >= 18) score += 8;
  }

  // Active pets
  if (input.activityLevel === "high") {
    if (protein >= 30) score += 6;
    if (fat >= 16) score += 4;
  }

  // Urinary sensitivity logic for cats
  if (input.species === "cat") {
    if (magnesium > 0 && magnesium <= 0.09) {
      score += 6;
    }

    if (sodium >= 0.3 && sodium <= 0.6) {
      score += 3;
    }
  }

  // Senior pets
  if (input.age >= 7) {
    if (fat >= 20) score -= 5;
  }

  // Life stage bonus
  if (input.lifeStage) {
    const stage = input.lifeStage.toLowerCase();

    if (
      input.age < 1 &&
      (stage.includes("puppy") || stage.includes("kitten"))
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
