export type FeedingGramsResult = {
  dailyCalories: number;
  kcalPer100g: number;
  gramsPerDay: number;
  gramsPerMealTwoMeals: number;
  gramsPerMealThreeMeals: number;
};

export function calculateFeedingGrams(params: {
  dailyCalories: number;
  kcalPer100g: number;
}): FeedingGramsResult | null {
  const dailyCalories = Number(params.dailyCalories);
  const kcalPer100g = Number(params.kcalPer100g);

  if (!Number.isFinite(dailyCalories) || dailyCalories <= 0) return null;
  if (!Number.isFinite(kcalPer100g) || kcalPer100g <= 0) return null;

  const gramsPerDay = (dailyCalories / kcalPer100g) * 100;

  return {
    dailyCalories,
    kcalPer100g,
    gramsPerDay: Math.round(gramsPerDay),
    gramsPerMealTwoMeals: Math.round(gramsPerDay / 2),
    gramsPerMealThreeMeals: Math.round(gramsPerDay / 3),
  };
}