export type NutritionInsightInput = {
  species?: string | null;
  neutered?: boolean | null;
  activityLevel?: string | null;
  weightGoal?: string | null;
  healthIssues?: string[] | null;

  protein?: number | null;
  fat?: number | null;
  fiber?: number | null;

  calcium?: number | null;
  phosphorus?: number | null;
  magnesium?: number | null;
  sodium?: number | null;

  kcalPer100g?: number | null;

  dataQualityStatus?: string | null;
  ingredients?: string | null;
};

export type NutritionInsightResult = {
  positives: string[];
  cautions: string[];
  summary: string;
  confidence: "low" | "moderate" | "high";
};

export function generateNutritionInsights(
  input: NutritionInsightInput
): NutritionInsightResult {
  const positives: string[] = [];
  const cautions: string[] = [];

  const protein = input.protein ?? null;
  const fat = input.fat ?? null;
  const fiber = input.fiber ?? null;
  const kcal = input.kcalPer100g ?? null;

  const calcium = input.calcium ?? null;
  const phosphorus = input.phosphorus ?? null;
  const magnesium = input.magnesium ?? null;
  const sodium = input.sodium ?? null;

  if (protein !== null) {
    if (protein >= 32) {
      positives.push("High protein may help support muscle maintenance.");
    } else if (protein < 24) {
      cautions.push("Protein level may be relatively low for some pets.");
    }
  }

  if (fat !== null) {
    if (fat >= 20) {
      cautions.push("Higher fat foods may require portion control.");
    }

    if (fat >= 10 && fat <= 18) {
      positives.push("Balanced fat level may help support daily energy.");
    }
  }

  if (fiber !== null && fiber >= 5) {
    positives.push("Fiber may help improve satiety and digestion.");
  }

  if (input.neutered) {
    cautions.push("Sterilized pets may benefit from calorie monitoring.");
  }

  if (input.weightGoal === "loss") {
    cautions.push("Weight loss plans require controlled calorie intake.");
  }

  if (
    input.healthIssues?.some((issue) =>
      issue.toLowerCase().includes("obesity")
    )
  ) {
    cautions.push(
      "Obesity management may require lower calorie density foods."
    );
  }

  if (kcal !== null) {
    if (kcal > 420) {
      cautions.push("High calorie density may increase overfeeding risk.");
    }

    if (kcal >= 300 && kcal <= 390) {
      positives.push("Moderate calorie density may help portion control.");
    }
  }

  if (calcium !== null && phosphorus !== null && phosphorus > 0) {
    const ratio = calcium / phosphorus;

    if (ratio >= 1 && ratio <= 2) {
      positives.push(
        "Calcium to phosphorus balance appears within a generally acceptable range."
      );
    } else {
      cautions.push("Calcium to phosphorus ratio may need closer review.");
    }
  }

  if (input.species === "cat" && magnesium !== null) {
    if (magnesium <= 0.09) {
      positives.push(
        "Controlled magnesium may be helpful for urinary-sensitive cats."
      );
    } else if (magnesium > 0.12) {
      cautions.push(
        "Magnesium appears relatively high for urinary-sensitive cats."
      );
    }
  }

  if (sodium !== null && sodium > 0.5) {
    cautions.push(
      "Sodium appears relatively high and may require attention in sensitive pets."
    );
  }

  let confidence: "low" | "moderate" | "high" = "moderate";
  let availableData = 0;

  const fields = [
    protein,
    fat,
    fiber,
    kcal,
    calcium,
    phosphorus,
    magnesium,
    sodium,
  ];

  fields.forEach((value) => {
    if (value !== null && value !== undefined) {
      availableData += 1;
    }
  });

  if (availableData >= 6) {
    confidence = "high";
  } else if (availableData <= 2) {
    confidence = "low";
  }

  const ingredientText = String(input.ingredients ?? "").toLowerCase();

  const hasBroadAnimalTerms =
    ingredientText.includes("by-products") ||
    ingredientText.includes("animal derivatives") ||
    ingredientText.includes("meat derivatives");

  if (hasBroadAnimalTerms) {
    cautions.push(
      "Ingredient list includes broad animal derivative terms, so quality confidence is lower."
    );
    confidence = "low";
  }

  if (
    input.dataQualityStatus === "verified" &&
    availableData >= 6 &&
    !hasBroadAnimalTerms
  ) {
    confidence = "high";
  }

  if (input.dataQualityStatus === "partial" && confidence === "high") {
    confidence = "moderate";
  }

  if (
    input.dataQualityStatus === "needs_review" ||
    input.dataQualityStatus === "unknown"
  ) {
    confidence = "low";
  }

  const summary =
    positives.length > cautions.length
      ? "This food appears nutritionally balanced for many pets."
      : cautions.length > positives.length
        ? "This food may require closer monitoring depending on your pet."
        : "This food may be suitable depending on your pet's needs.";

  return {
    positives,
    cautions,
    summary,
    confidence,
  };
}
