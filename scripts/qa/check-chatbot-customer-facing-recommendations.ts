import { formatFoodV2ChatbotRecommendationSummary } from "@/lib/food-v2/chatbotRecommendationSummary";
import { readFileSync } from "node:fs";

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
          "Fat looks high for a sterilised or weight-prone pet.",
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

const sample = formatFoodV2ChatbotRecommendationSummary(sampleResponse, {
  locale: "en",
  maxItemsPerSection: 2,
});

const greekSample = formatFoodV2ChatbotRecommendationSummary(sampleResponse, {
  locale: "el",
  maxItemsPerSection: 2,
});

const compactCardsSample = formatFoodV2ChatbotRecommendationSummary(sampleResponse, {
  locale: "en",
  maxItemsPerSection: 2,
  compactForCards: true,
});

const compactGreekCardsSample = formatFoodV2ChatbotRecommendationSummary(sampleResponse, {
  locale: "el",
  maxItemsPerSection: 2,
  compactForCards: true,
});

const valueGoalSample = formatFoodV2ChatbotRecommendationSummary(
  {
    ...sampleResponse,
    goal: "value" as const,
  },
  {
    locale: "en",
    maxItemsPerSection: 2,
  }
);

const forbiddenTerms = [
  "needs_review",
  "needs review",
  "retailer",
  "source tier",
  "data quality",
  "missing nutrition",
  "missing_nutrition",
  "fat looks high",
  "renal cases need",
  "urinary reasoning is weaker",
  "role:",
  "use case:",
  "candidate kept out",
  "value ranking is a proxy",
  "data is usable",
  "Ο",
  "Ο‡",
];

const lowerSample = `${sample}\n${greekSample}\n${compactCardsSample}\n${compactGreekCardsSample}\n${valueGoalSample}`.toLowerCase();
const leakedTerms = forbiddenTerms.filter((term) =>
  lowerSample.includes(term.toLowerCase())
);

if (leakedTerms.length > 0) {
  console.error("Customer-facing recommendation leaked back-office or mojibake terms:");
  console.error(leakedTerms.join(", "));
  console.error(sample);
  console.error(greekSample);
  console.error(compactCardsSample);
  console.error(compactGreekCardsSample);
  console.error(valueGoalSample);
  process.exit(1);
}

if (!sample.includes("Recommended foods") || !sample.includes("Happy Dog")) {
  console.error("Customer-facing recommendation did not include the expected shortlist.");
  console.error(sample);
  process.exit(1);
}

if (!greekSample.includes("Προτεινόμενες τροφές") || !greekSample.includes("Happy Dog")) {
  console.error("Greek customer-facing recommendation did not include the expected shortlist.");
  console.error(greekSample);
  process.exit(1);
}

if (!greekSample.includes("Επόμενο βήμα")) {
  console.error("Greek customer-facing recommendation did not include a clear next step.");
  console.error(greekSample);
  process.exit(1);
}

if (!compactCardsSample.includes("I placed the best options below as cards")) {
  console.error("Compact card-facing recommendation should point to the cards.");
  console.error(compactCardsSample);
  process.exit(1);
}

if (!compactCardsSample.includes("Tap one card to estimate grams/day")) {
  console.error("Compact card-facing recommendation should include a clear card action.");
  console.error(compactCardsSample);
  process.exit(1);
}

if (compactCardsSample.includes("Best nutrition fits:") || /\n1\./.test(compactCardsSample)) {
  console.error("Compact card-facing recommendation should not duplicate the card list.");
  console.error(compactCardsSample);
  process.exit(1);
}

if (!valueGoalSample.includes("First value picks:")) {
  console.error("Value goal should label the first section as value picks.");
  console.error(valueGoalSample);
  process.exit(1);
}

if (!compactGreekCardsSample.includes("κάρτες από κάτω")) {
  console.error("Compact Greek card-facing recommendation should point to the cards.");
  console.error(compactGreekCardsSample);
  process.exit(1);
}

const chatbotPage = readFileSync("app/account/chatbot/page.tsx", "utf8");

if (/\b\d{1,3}\/100\b/.test(`${sample}\n${greekSample}`)) {
  console.error("Customer-facing recommendation should not expose raw internal score labels.");
  console.error(sample);
  console.error(greekSample);
  console.error(compactCardsSample);
  console.error(compactGreekCardsSample);
  process.exit(1);
}

const requiredCardFlowCopy = [
  "1. Pick",
  "2. Calculate",
  "3. Save",
  "Choose and calculate",
  "Tap to calculate grams per day.",
  "Practical split:",
  "2 meals: about",
  "3 meals: about",
  "analysisMetadata.feedingGramsPerDay / 2",
  "getRecommendationChoiceFacts(choice, chatLanguage)",
  "kcal/100g",
  "protein",
  "fat",
  "fiber",
];
const missingCardFlowCopy = requiredCardFlowCopy.filter(
  (term) => !chatbotPage.includes(term)
);

const responseComposer = readFileSync("lib/ai/responseComposer.ts", "utf8");
const forbiddenComposerCopy = [
  "score: food.ranking?.total_score",
  "(${score}/100)",
];
const leakedComposerCopy = forbiddenComposerCopy.filter((term) =>
  responseComposer.includes(term)
);

if (leakedComposerCopy.length > 0) {
  console.error("Customer-facing response composer still exposes internal score copy:");
  console.error(leakedComposerCopy.join(", "));
  process.exit(1);
}

if (missingCardFlowCopy.length > 0) {
  console.error("Chatbot food cards are missing customer-facing flow copy:");
  console.error(missingCardFlowCopy.join(", "));
  process.exit(1);
}

const recommendedChoicesIndex = chatbotPage.indexOf("recommendedFoodChoices.map");
const recommendationBlockIndex = chatbotPage.lastIndexOf(
  "showSave && recommendedFoodChoices.length > 0",
  recommendedChoicesIndex
);
const pickStepIndex = chatbotPage.lastIndexOf("1. Pick", recommendedChoicesIndex);
const nutritionFactsIndex = chatbotPage.indexOf(
  "getRecommendationChoiceFacts(choice, chatLanguage).map",
  recommendedChoicesIndex
);
const cardCtaIndex = chatbotPage.indexOf("Choose and calculate", recommendedChoicesIndex);

if (
  recommendedChoicesIndex === -1 ||
  recommendationBlockIndex === -1 ||
  pickStepIndex === -1 ||
  pickStepIndex < recommendationBlockIndex
) {
  console.error(
    "Customer-facing Pick/Calculate/Save flow must appear inside the recommended food card area."
  );
  process.exit(1);
}

if (
  nutritionFactsIndex === -1 ||
  cardCtaIndex === -1 ||
  nutritionFactsIndex > cardCtaIndex
) {
  console.error(
    "Recommendation cards should show customer-facing nutrition chips before the calculate CTA."
  );
  process.exit(1);
}

console.log("Customer-facing chatbot recommendation QA passed.");
