import { calculateFeedingGrams } from "@/lib/feedingCalculator";
import { calculateTreatsAllowance } from "@/lib/treatsCalculator";

export type MainFoodPortionEstimate = {
  finalDailyCalories: number;
  mainFoodCalories: number;
  maxTreatCalories: number;
  kcalPer100g: number;
  gramsPerDay: number;
  gramsPerMealTwoMeals: number;
  gramsPerMealThreeMeals: number;
};

export function calculateMainFoodPortionEstimate(params: {
  finalDailyCalories: number | null | undefined;
  kcalPer100g: number | null | undefined;
}): MainFoodPortionEstimate | null {
  const finalDailyCalories = Number(params.finalDailyCalories);
  const kcalPer100g = Number(params.kcalPer100g);

  if (!Number.isFinite(finalDailyCalories) || finalDailyCalories <= 0) {
    return null;
  }

  if (!Number.isFinite(kcalPer100g) || kcalPer100g <= 0) {
    return null;
  }

  const treats = calculateTreatsAllowance(finalDailyCalories);
  if (!treats) return null;

  const feeding = calculateFeedingGrams({
    dailyCalories: treats.mainFoodCalories,
    kcalPer100g,
  });
  if (!feeding) return null;

  return {
    finalDailyCalories: treats.dailyCalories,
    mainFoodCalories: treats.mainFoodCalories,
    maxTreatCalories: treats.maxTreatCalories,
    kcalPer100g,
    gramsPerDay: feeding.gramsPerDay,
    gramsPerMealTwoMeals: feeding.gramsPerMealTwoMeals,
    gramsPerMealThreeMeals: feeding.gramsPerMealThreeMeals,
  };
}
