import { formatFoodV2ChatbotRecommendationSummary } from "@/lib/food-v2/chatbotRecommendationSummary";

const sampleResponse = {
  goal: "sterilised" as const,
  total_candidates: 2,
  premium: [
    {
      brand: "Happy Dog",
      display_name: "Naturcroq Duck & Rice Sterilised",
      data_quality_status: "needs_review",
      source_priority: "retailer",
      missing_nutrition_fields: ["sodium_percent", "magnesium_percent"],
      ranking: {
        total_score: 88,
        confidence: "high" as const,
        reasons: [
          "Matches adult life stage.",
          "Useful weight-aware positioning for a sterilised pet.",
          "Ingredient data is available.",
        ],
        cautions: [
          "Data is usable but still needs review.",
          "Retailer source should be worded cautiously.",
        ],
      },
      nutrition: {
        kcal_per_100g: 332,
        protein_percent: 22,
        fat_percent: 9,
        fiber_percent: 2.5,
        calcium_percent: 1.2,
        phosphorus_percent: 0.8,
      },
    },
  ],
  value: [],
  hold: [],
  notes: [],
};

const sample = formatFoodV2ChatbotRecommendationSummary(
  sampleResponse,
  {
    locale: "en",
    maxItemsPerSection: 2,
  }
);

const greekSample = formatFoodV2ChatbotRecommendationSummary(
  sampleResponse,
  {
    locale: "el",
    maxItemsPerSection: 2,
  },
);

const forbiddenTerms = [
  "needs_review",
  "needs review",
  "retailer",
  "source tier",
  "data quality",
  "missing nutrition",
  "missing_nutrition",
  "role:",
  "use case:",
  "ρόλος:",
  "χρήση:",
];

const lowerSample = `${sample}\n${greekSample}`.toLowerCase();
const leakedTerms = forbiddenTerms.filter((term) => lowerSample.includes(term));

if (leakedTerms.length > 0) {
  console.error("Customer-facing recommendation leaked back-office terms:");
  console.error(leakedTerms.join(", "));
  console.error(sample);
  process.exit(1);
}

if (!sample.includes("Recommended foods") || !sample.includes("Happy Dog")) {
  console.error("Customer-facing recommendation did not include the expected shortlist.");
  console.error(sample);
  process.exit(1);
}

console.log("Customer-facing chatbot recommendation QA passed.");
