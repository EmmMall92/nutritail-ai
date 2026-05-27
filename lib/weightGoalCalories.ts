export type WeightGoal = "maintain" | "loss" | "gain";

export function adjustCaloriesForWeightGoal(params: {
  calories: number;
  goal?: WeightGoal;
}) {
  const calories = Number(params.calories);

  if (!Number.isFinite(calories) || calories <= 0) {
    return 0;
  }

  if (params.goal === "loss") {
    return Math.round(calories * 0.85);
  }

  if (params.goal === "gain") {
    return Math.round(calories * 1.1);
  }

  return Math.round(calories);
}

export function getWeightGoalLabel(
  goal?: WeightGoal,
  locale: "en" | "el" = "en"
) {
  if (locale === "el") {
    if (goal === "loss") return "απώλεια βάρους";
    if (goal === "gain") return "αύξηση βάρους";
    return "διατήρηση βάρους";
  }

  if (goal === "loss") return "weight loss";
  if (goal === "gain") return "weight gain";
  return "weight maintenance";
}
