export type IngredientInsightResult = {
  positives: string[];
  cautions: string[];
};

export function generateIngredientInsights(
  ingredients?: string | null
): IngredientInsightResult {
  const positives: string[] = [];
  const cautions: string[] = [];

  const text = String(ingredients ?? "").toLowerCase();

  if (!text.trim()) {
    return {
      positives,
      cautions: ["No ingredient list is available yet for review."],
    };
  }

  if (
    text.includes("chicken") ||
    text.includes("turkey") ||
    text.includes("salmon") ||
    text.includes("lamb") ||
    text.includes("beef") ||
    text.includes("fish")
  ) {
    positives.push("Includes a recognizable animal protein source.");
  }

  if (
    text.includes("meat derivatives") ||
    text.includes("animal derivatives") ||
    text.includes("by-products")
  ) {
    cautions.push(
      "Includes broad terms such as derivatives/by-products, which may need closer quality review."
    );
  }

  if (
    text.includes("corn") ||
    text.includes("maize") ||
    text.includes("wheat")
  ) {
    positives.push(
      "Includes common carbohydrate sources such as corn/maize/wheat, which can be appropriate unless the pet has a known sensitivity or trial restriction."
    );
  }

  if (
    text.includes("prebiotic") ||
    text.includes("fos") ||
    text.includes("mos")
  ) {
    positives.push(
      "Includes prebiotic ingredients that may support digestion."
    );
  }

  return {
    positives,
    cautions,
  };
}
