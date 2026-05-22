import type { Pet } from "@/types/pet";

export type Advice = {
  title: string;
  description: string;
};

export function generateNutritionAdvice(pet: Pet): Advice[] {
  const advice: Advice[] = [];

  if (pet.age >= 7) {
    advice.push({
      title: "Senior Nutrition",
      description:
        "Older pets may benefit from slightly reduced fat levels and joint-support nutrients.",
    });
  }

  if (pet.healthIssues?.some(i => i.toLowerCase().includes("obesity"))) {
    advice.push({
      title: "Weight Control",
      description:
        "A lower fat diet with higher fiber may help maintain a healthy body weight.",
    });
  }

  if (pet.healthIssues?.some(i => i.toLowerCase().includes("kidney"))) {
    advice.push({
      title: "Kidney Support",
      description:
        "Pets with kidney issues often benefit from reduced phosphorus levels.",
    });
  }

  if (pet.allergies && pet.allergies.length > 0) {
    advice.push({
      title: "Food Allergies",
      description:
        "Consider limited ingredient or novel protein diets to avoid allergic reactions.",
    });
  }

  if (pet.activityLevel === "high") {
    advice.push({
      title: "High Activity",
      description:
        "Highly active pets may require increased calories and protein levels.",
    });
  }

  return advice;
}