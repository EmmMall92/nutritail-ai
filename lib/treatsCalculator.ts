export function calculateTreatsAllowance(dailyCalories: number) {
  const calories = Number(dailyCalories);

  if (!Number.isFinite(calories) || calories <= 0) {
    return null;
  }

  const maxTreatCalories = Math.round(calories * 0.1);
  const mainFoodCalories = Math.round(calories * 0.9);

  return {
    dailyCalories: Math.round(calories),
    maxTreatCalories,
    mainFoodCalories,
  };
}