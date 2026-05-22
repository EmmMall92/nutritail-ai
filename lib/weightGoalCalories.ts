export type WeightGoal = "maintain" | "loss" | "gain";

export function adjustCaloriesForWeightGoal(params: {
  calories: number;
  goal?: WeightGoal;
}) {
  const calories = Number(params.calories);

  if (!Number.isFinite(calories) || calories <= 0) {
    return calories;
  }

  if (params.goal === "loss") {
    return Math.round(calories * 0.85);
  }

  if (params.goal === "gain") {
    return Math.round(calories * 1.1);
  }

  return Math.round(calories);
}

export function getWeightGoalLabel(goal?: WeightGoal) {
  if (goal === "loss") return "απώλεια βάρους";
  if (goal === "gain") return "αύξηση βάρους";
  return "διατήρηση βάρους";
}