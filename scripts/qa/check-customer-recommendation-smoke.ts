import {
  formatFoodV2ChatbotRecommendationSummary,
  type FoodV2ChatbotRecommendationResponse,
} from "@/lib/food-v2/chatbotRecommendationSummary";

const baseFood = {
  brand: "QA Brand",
  display_name: "Adult Chicken",
  data_quality_status: "needs_review",
  source_priority: "retailer",
  missing_nutrition_fields: ["sodium_percent"],
  nutrition: {
    kcal_per_100g: 342,
    protein_percent: 25,
    fat_percent: 12,
    fiber_percent: 3,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
  },
  ranking: {
    total_score: 82,
    confidence: "high" as const,
    reasons: ["Matches adult life stage.", "Ingredient data is available."],
    cautions: [
      "Data is usable but still needs review.",
      "Retailer source should be worded cautiously.",
    ],
  },
};

const scenarios: Array<{
  label: string;
  response: FoodV2ChatbotRecommendationResponse;
  expected: string[];
}> = [
  {
    label: "sterilised dog",
    response: {
      goal: "sterilised",
      premium: [
        {
          ...baseFood,
          brand: "Happy Dog",
          display_name: "Naturcroq Duck & Rice Sterilised",
          ranking: {
            ...baseFood.ranking,
            reasons: [
              "Useful weight-aware positioning for a sterilised pet.",
              "Lower calorie density fits a sterilised or weight-prone pet.",
              "Matches a preferred protein or flavor.",
            ],
          },
          food_intelligence: {
            best_use_cases: ["sterilised_weight_management"],
            strengths: ["Lower calorie and fat profile supports measured portions."],
          },
          nutrition: { ...baseFood.nutrition, kcal_per_100g: 332, fat_percent: 9 },
        },
      ],
      value: [],
      hold: [],
    },
    expected: ["sterilised pet", "flavour preference"],
  },
  {
    label: "weight loss dog",
    response: {
      goal: "weight_control",
      premium: [
        {
          ...baseFood,
          brand: "Royal Canin",
          display_name: "Mini Light Weight Care",
          ranking: {
            ...baseFood.ranking,
            reasons: ["Positioned for weight control.", "Fiber level can help satiety."],
          },
          nutrition: { ...baseFood.nutrition, kcal_per_100g: 318, fat_percent: 8, fiber_percent: 8 },
        },
      ],
      value: [],
      hold: [],
    },
    expected: ["weight control", "calorie and weight-control"],
  },
  {
    label: "chicken allergy dog",
    response: {
      goal: "allergy",
      premium: [
        {
          ...baseFood,
          brand: "Ambrosia",
          display_name: "Mediterranean Diet Grain Free Adult Fresh Sardine & Tuna",
          ranking: {
            ...baseFood.ranking,
            reasons: ["Allergens were not detected.", "Excluded ingredients are respected."],
          },
          nutrition: { ...baseFood.nutrition, protein_percent: 27, fat_percent: 15 },
        },
      ],
      value: [],
      hold: [],
    },
    expected: ["ingredient avoidance", "declared ingredient avoidances"],
  },
  {
    label: "sensitive digestion dog",
    response: {
      goal: "sensitive_digestion",
      premium: [
        {
          ...baseFood,
          brand: "Josera",
          display_name: "Sensi Plus Adult",
          ranking: {
            ...baseFood.ranking,
            reasons: ["Positioned for sensitive digestion.", "Digestive support positioning."],
          },
        },
      ],
      value: [],
      hold: [],
    },
    expected: ["sensitive digestion", "sensitive-digestion"],
  },
  {
    label: "urinary cat",
    response: {
      goal: "urinary",
      premium: [
        {
          ...baseFood,
          brand: "Monge",
          display_name: "VetSolution Urinary Struvite Feline",
          ranking: {
            ...baseFood.ranking,
            reasons: ["Positioned for urinary support."],
          },
          food_intelligence: {
            best_use_cases: ["urinary_complete_mineral_review"],
            strengths: ["Magnesium, phosphorus and sodium are available for urinary mineral review."],
          },
        },
      ],
      value: [],
      hold: [],
    },
    expected: ["urinary support", "magnesium, phosphorus and sodium"],
  },
  {
    label: "renal cat",
    response: {
      goal: "renal",
      premium: [
        {
          ...baseFood,
          brand: "Monge",
          display_name: "VetSolution Renal Feline",
          ranking: {
            ...baseFood.ranking,
            reasons: ["Positioned for renal support."],
          },
          food_intelligence: {
            best_use_cases: ["renal_mineral_review"],
            strengths: ["Phosphorus and sodium are available for renal mineral review."],
          },
        },
      ],
      value: [],
      hold: [],
    },
    expected: ["renal support", "phosphorus and sodium"],
  },
  {
    label: "large breed puppy",
    response: {
      goal: "growth",
      premium: [
        {
          ...baseFood,
          brand: "ACANA",
          display_name: "Puppy Large Breed",
          ranking: {
            ...baseFood.ranking,
            reasons: ["Large-breed puppy mineral review is available.", "Growth positioning."],
          },
        },
      ],
      value: [],
      hold: [],
    },
    expected: ["growth", "growth needs"],
  },
  {
    label: "active dog",
    response: {
      goal: "general",
      premium: [
        {
          ...baseFood,
          brand: "Josera",
          display_name: "High Energy Adult",
          ranking: {
            ...baseFood.ranking,
            reasons: ["Active/performance positioning fits a highly active pet."],
          },
          nutrition: { ...baseFood.nutrition, kcal_per_100g: 392, fat_percent: 18 },
        },
      ],
      value: [],
      hold: [],
    },
    expected: ["general recommendation", "basic profile"],
  },
  {
    label: "senior dog",
    response: {
      goal: "senior",
      premium: [
        {
          ...baseFood,
          brand: "Royal Canin",
          display_name: "Mini Ageing 12+",
          ranking: {
            ...baseFood.ranking,
            reasons: ["Positioned for senior pets.", "Clear senior positioning is visible to the customer."],
          },
        },
      ],
      value: [],
      hold: [],
    },
    expected: ["senior pet", "senior needs"],
  },
];

const forbidden = [
  "needs_review",
  "needs review",
  "retailer",
  "source tier",
  "data quality",
  "missing nutrition",
  "score",
  "high confidence",
  "medium confidence",
  "low confidence",
  "candidate",
  "ranking",
];

const compactForbidden = [
  "1.",
  "2.",
  "option 1",
  "best matches:",
  "first picks:",
  "simple alternatives:",
  "save the plan",
  "save it",
  "αποθήκευση",
  "αποθηκεύσεις",
  "να κρατήσω την τροφή",
];

for (const scenario of scenarios) {
  const full = formatFoodV2ChatbotRecommendationSummary(scenario.response, {
    locale: "en",
    maxItemsPerSection: 2,
  });
  const compact = formatFoodV2ChatbotRecommendationSummary(scenario.response, {
    locale: "en",
    maxItemsPerSection: 2,
    compactForCards: true,
  });
  const compactGreek = formatFoodV2ChatbotRecommendationSummary(scenario.response, {
    locale: "el",
    maxItemsPerSection: 2,
    compactForCards: true,
  });
  const combined = `${full}\n${compact}`;
  const leaked = forbidden.filter((term) =>
    combined.toLowerCase().includes(term.toLowerCase())
  );

  if (leaked.length > 0) {
    console.error(`Scenario ${scenario.label} leaked customer-hidden terms.`);
    console.error(leaked.join(", "));
    console.error(combined);
    process.exit(1);
  }

  for (const expected of scenario.expected) {
    if (!combined.toLowerCase().includes(expected.toLowerCase())) {
      console.error(`Scenario ${scenario.label} missed expected copy: ${expected}`);
      console.error(combined);
      process.exit(1);
    }
  }

  if (!full.includes("Next step: tap one food card to see the first daily portion in grams.")) {
    console.error(`Scenario ${scenario.label} missed the full recommendation next step.`);
    console.error(full);
    process.exit(1);
  }

  if (!compact.includes("Choose one food card below to see the first daily portion in grams.")) {
    console.error(`Scenario ${scenario.label} missed the compact card CTA.`);
    console.error(compact);
    process.exit(1);
  }

  const compactLeaks = compactForbidden.filter((term) =>
    `${compact}\n${compactGreek}`.toLowerCase().includes(term.toLowerCase())
  );

  if (compactLeaks.length > 0) {
    console.error(`Scenario ${scenario.label} compact card intro is too list-like or asks for save.`);
    console.error(compactLeaks.join(", "));
    console.error(`${compact}\n${compactGreek}`);
    process.exit(1);
  }
}

console.log(
  JSON.stringify(
    {
      checked: scenarios.length,
      passed: scenarios.length,
      scenarios: scenarios.map((scenario) => scenario.label),
    },
    null,
    2
  )
);
