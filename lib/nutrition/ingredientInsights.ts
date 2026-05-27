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
    text.includes("fish") ||
    text.includes("rabbit") ||
    text.includes("duck")
  ) {
    positives.push("Includes a recognizable animal protein source.");
  }

  if (
    text.includes("hydrolysed") ||
    text.includes("hydrolyzed") ||
    text.includes("hypoallergenic")
  ) {
    positives.push(
      "Includes hydrolysed or hypoallergenic positioning that may be relevant for supervised allergy trials."
    );
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
    text.includes("wheat") ||
    text.includes("rice") ||
    text.includes("barley") ||
    text.includes("oats") ||
    text.includes("potato")
  ) {
    positives.push(
      "Includes carbohydrate sources such as grains, rice, or potato; these are not automatically negative unless the pet has a known sensitivity or trial restriction."
    );
  }

  if (
    text.includes("prebiotic") ||
    text.includes("fos") ||
    text.includes("mos") ||
    text.includes("beet pulp") ||
    text.includes("chicory") ||
    text.includes("psyllium") ||
    text.includes("inulin")
  ) {
    positives.push(
      "Includes prebiotic ingredients that may support digestion."
    );
  }

  if (
    text.includes("fish oil") ||
    text.includes("salmon oil") ||
    text.includes("algal oil") ||
    text.includes("dha") ||
    text.includes("epa")
  ) {
    positives.push(
      "Includes omega-3 or DHA/EPA signals that may support skin, coat, and development goals."
    );
  }

  return {
    positives,
    cautions,
  };
}
