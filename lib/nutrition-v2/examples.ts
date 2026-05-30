// Example cases for future nutrition-v2 unit tests and chatbot evals.

export type NutritionV2Example = {
  id: string;
  pet: Record<string, unknown>;
  expectedRecommendationBehavior: string[];
  expectedWarnings: string[];
  requiredFields: string[];
};

export const nutritionV2Examples: NutritionV2Example[] = [
  {
    id: "adult-sterilized-indoor-cat",
    pet: {
      species: "cat",
      lifeStage: "adult",
      neutered: true,
      activityLevel: "low",
      weightGoal: "maintain",
    },
    expectedRecommendationBehavior: [
      "Prefer controlled calories and clear mineral data.",
      "Avoid overclaiming urinary suitability without mineral values.",
    ],
    expectedWarnings: ["Sterilized indoor cats need calorie monitoring."],
    requiredFields: ["kcal_per_100g", "protein_percent", "fat_percent"],
  },
  {
    id: "overweight-dog",
    pet: {
      species: "dog",
      lifeStage: "adult",
      weightGoal: "loss",
      activityLevel: "low",
    },
    expectedRecommendationBehavior: [
      "Prefer lower kcal density, moderate fat, and higher fiber.",
      "Mention treat calories and measured portions.",
    ],
    expectedWarnings: ["Do not recommend energy-dense formulas casually."],
    requiredFields: ["kcal_per_100g", "fat_percent", "fiber_percent"],
  },
  {
    id: "puppy-large-breed",
    pet: {
      species: "dog",
      lifeStage: "puppy",
      dogSize: "large",
    },
    expectedRecommendationBehavior: [
      "Prefer puppy or growth formulas suitable for large breed growth.",
      "Check calcium/phosphorus ratio before confident recommendation.",
    ],
    expectedWarnings: ["Large breed puppies require extra mineral caution."],
    requiredFields: ["calcium_percent", "phosphorus_percent", "kcal_per_100g"],
  },
  {
    id: "senior-dog",
    pet: {
      species: "dog",
      lifeStage: "senior",
      weightGoal: "maintain",
    },
    expectedRecommendationBehavior: [
      "Prefer moderate calories and digestibility support.",
      "Mention joint-support ingredients when present.",
    ],
    expectedWarnings: ["Do not assume senior pets always need weight loss."],
    requiredFields: ["kcal_per_100g", "protein_percent", "fat_percent"],
  },
  {
    id: "cat-urinary-sensitivity",
    pet: {
      species: "cat",
      lifeStage: "adult",
      healthIssues: ["urinary sensitivity"],
    },
    expectedRecommendationBehavior: [
      "Prioritize urinary tags and mineral data.",
      "Recommend veterinary supervision for urinary symptoms.",
    ],
    expectedWarnings: ["Missing magnesium, sodium, or phosphorus lowers confidence."],
    requiredFields: ["magnesium_percent", "sodium_percent", "phosphorus_percent"],
  },
  {
    id: "dog-food-allergy-chicken",
    pet: {
      species: "dog",
      lifeStage: "adult",
      allergies: ["chicken"],
    },
    expectedRecommendationBehavior: [
      "Never recommend foods containing chicken ingredients.",
      "Ask about elimination-trial history when needed.",
    ],
    expectedWarnings: ["Food allergy cannot be diagnosed from chat alone."],
    requiredFields: ["ingredients", "primary_animal_proteins"],
  },
  {
    id: "dog-sensitive-digestion",
    pet: {
      species: "dog",
      lifeStage: "adult",
      healthIssues: ["sensitive digestion"],
    },
    expectedRecommendationBehavior: [
      "Prefer digestive support tags and fiber/prebiotic ingredients.",
      "Mention gradual transition.",
    ],
    expectedWarnings: ["Persistent vomiting or diarrhea needs veterinary review."],
    requiredFields: ["ingredients", "fiber_percent", "kcal_per_100g"],
  },
  {
    id: "dog-active-working",
    pet: {
      species: "dog",
      lifeStage: "adult",
      activityLevel: "high",
      weightGoal: "maintain",
    },
    expectedRecommendationBehavior: [
      "Allow higher energy needs with portion monitoring.",
      "Prefer adequate protein and fat if tolerated.",
    ],
    expectedWarnings: ["Do not underfeed high-activity dogs based only on average MER."],
    requiredFields: ["kcal_per_100g", "protein_percent", "fat_percent"],
  }
];
