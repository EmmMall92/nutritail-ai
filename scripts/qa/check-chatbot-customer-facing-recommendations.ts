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
          "Fat is not low enough to be a first pick for a sterilised or weight-control case.",
          "Pancreatitis history needs veterinarian-directed diet selection.",
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

function summary(
  response: Parameters<typeof formatFoodV2ChatbotRecommendationSummary>[0],
  locale: "el" | "en" = "en",
  compactForCards = false
) {
  return formatFoodV2ChatbotRecommendationSummary(response, {
    locale,
    maxItemsPerSection: 2,
    compactForCards,
  });
}

const sample = summary(sampleResponse);
const greekSample = summary(sampleResponse, "el");
const compactCardsSample = summary(sampleResponse, "en", true);
const compactGreekCardsSample = summary(sampleResponse, "el", true);
const valueGoalSample = summary({ ...sampleResponse, goal: "value" as const });

const coreScenarioSamples = [
  {
    label: "sterilised small dog",
    expectedGoalLabel: "sterilised pet",
    text: sample,
  },
  {
    label: "chicken allergy",
    expectedGoalLabel: "ingredient avoidance",
    text: summary({
      ...sampleResponse,
      goal: "allergy" as const,
      premium: [
        {
          ...sampleResponse.premium[0],
          brand: "Ambrosia",
          display_name: "Mediterranean Diet Grain Free Adult Fresh Sardine & Tuna",
          ranking: {
            ...sampleResponse.premium[0].ranking,
            reasons: ["Allergens were not detected.", "Excluded ingredients are respected."],
            cautions: ["Data is usable but still needs review."],
          },
        },
      ],
    }),
  },
  {
    label: "urinary cat",
    expectedGoalLabel: "urinary support",
    text: summary({
      ...sampleResponse,
      goal: "urinary" as const,
      premium: [
        {
          ...sampleResponse.premium[0],
          brand: "Monge",
          display_name: "VetSolution Urinary Struvite Feline",
          ranking: {
            ...sampleResponse.premium[0].ranking,
            reasons: ["Urinary subtype matches the request."],
            cautions: ["Magnesium data is missing for urinary review."],
          },
        },
      ],
    }),
  },
  {
    label: "renal senior cat",
    expectedGoalLabel: "renal support",
    text: summary({
      ...sampleResponse,
      goal: "renal" as const,
      premium: [
        {
          ...sampleResponse.premium[0],
          brand: "Monge",
          display_name: "VetSolution Renal Feline",
          ranking: {
            ...sampleResponse.premium[0].ranking,
            reasons: ["Renal support positioning."],
            cautions: ["Phosphorus data is missing for renal review."],
          },
        },
      ],
    }),
  },
  {
    label: "large breed puppy",
    expectedGoalLabel: "growth",
    text: summary({
      ...sampleResponse,
      goal: "growth" as const,
      premium: [
        {
          ...sampleResponse.premium[0],
          brand: "Acana",
          display_name: "Puppy Large Breed",
          ranking: {
            ...sampleResponse.premium[0].ranking,
            reasons: ["Large-breed puppy mineral review is available."],
            cautions: ["Calcium/phosphorus ratio needs closer review for growth."],
          },
        },
      ],
    }),
  },
  {
    label: "active dog",
    expectedGoalLabel: "general fit",
    text: summary({
      ...sampleResponse,
      goal: "general" as const,
      premium: [
        {
          ...sampleResponse.premium[0],
          brand: "Josera",
          display_name: "High Energy Adult",
          ranking: {
            ...sampleResponse.premium[0].ranking,
            reasons: ["High activity energy support."],
            cautions: [],
          },
        },
      ],
    }),
  },
];

const forbiddenTerms = [
  "needs_review",
  "needs review",
  "retailer",
  "source tier",
  "data quality",
  "missing nutrition",
  "missing_nutrition",
  "fat looks high",
  "fat is not low enough",
  "renal cases need",
  "urinary reasoning is weaker",
  "matches adult life stage",
  "ingredient data is available",
  "role:",
  "use case:",
  "candidate kept out",
  "kept foods out of the shortlist",
  "value ranking is a proxy",
  "data is usable",
  "�",
  "Ο",
];

const allSummaries = `${sample}\n${greekSample}\n${compactCardsSample}\n${compactGreekCardsSample}\n${valueGoalSample}\n${coreScenarioSamples
  .map((scenario) => scenario.text)
  .join("\n")}`;
const leakedTerms = forbiddenTerms.filter((term) =>
  allSummaries.toLowerCase().includes(term.toLowerCase())
);

if (leakedTerms.length > 0) {
  console.error("Customer-facing recommendation leaked back-office or mojibake terms:");
  console.error(leakedTerms.join(", "));
  console.error(allSummaries);
  process.exit(1);
}

for (const scenario of coreScenarioSamples) {
  if (
    !scenario.text.includes(
      `For this pet, I am prioritising: ${scenario.expectedGoalLabel}.`
    )
  ) {
    console.error(`Scenario ${scenario.label} did not show the expected customer goal.`);
    console.error(scenario.text);
    process.exit(1);
  }

  if (!scenario.text.includes("Next step: choose a food card")) {
    console.error(`Scenario ${scenario.label} did not include the customer card CTA.`);
    console.error(scenario.text);
    process.exit(1);
  }
}

if (!sample.includes("Food picks for this pet") || !sample.includes("Happy Dog")) {
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

if (!greekSample.includes("παγκρεατίτιδας")) {
  console.error("Greek customer-facing recommendation should translate pancreatitis cautions.");
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

if (!compactGreekCardsSample.includes("κάρτες από κάτω")) {
  console.error("Compact Greek card-facing recommendation should point to the cards.");
  console.error(compactGreekCardsSample);
  process.exit(1);
}

const noMatchSample = summary({
  ...sampleResponse,
  premium: [],
  value: [],
  hold: sampleResponse.premium,
});

if (!noMatchSample.includes("Some foods were skipped because")) {
  console.error("No-match recommendation copy should explain skipped foods in customer language.");
  console.error(noMatchSample);
  process.exit(1);
}

if (compactCardsSample.includes("Best options for this pet:") || /\n1\./.test(compactCardsSample)) {
  console.error("Compact card-facing recommendation should not duplicate the card list.");
  console.error(compactCardsSample);
  process.exit(1);
}

if (!valueGoalSample.includes("First value picks:")) {
  console.error("Value goal should label the first section as value picks.");
  console.error(valueGoalSample);
  process.exit(1);
}

if (/\b\d{1,3}\/100\b/.test(`${sample}\n${greekSample}`)) {
  console.error("Customer-facing recommendation should not expose raw internal score labels.");
  console.error(sample);
  console.error(greekSample);
  process.exit(1);
}

const chatbotPage = readFileSync("app/account/chatbot/page.tsx", "utf8");
const responseComposer = readFileSync("lib/ai/responseComposer.ts", "utf8");
const responseAdapter = readFileSync("lib/food-v2/recommendationResponseAdapter.ts", "utf8");

const forbiddenComposerCopy = [
  "score: food.ranking?.total_score",
  "(${score}/100)",
  "matches with score",
  "ταιριάζει με score",
  "high confidence",
  "medium confidence",
  "low confidence",
  "�",
];
const leakedComposerCopy = forbiddenComposerCopy.filter((term) =>
  `${responseComposer}\n${responseAdapter}`.includes(term)
);

if (leakedComposerCopy.length > 0) {
  console.error("Customer-facing recommendation copy still exposes internal score/confidence wording:");
  console.error(leakedComposerCopy.join(", "));
  process.exit(1);
}

const forbiddenChatbotPageCopy = [
  "Food score:",
  "Nutrition confidence:",
  "Review before saving",
  "Analysis summary",
  "Save when the pet details, calorie target, and food context look right.",
  "Επόμενο βήμα: διάλεξε μία τροφή από τη λίστα",
  "Score: ${getHistoryFoodScore",
  "Strong match",
  "Good match",
  "Useful alternative",
  "getRecommendationChoiceMatchLabel",
  "const reason = food.ranking?.reasons?.find",
];
const leakedChatbotPageCopy = forbiddenChatbotPageCopy.filter((term) =>
  chatbotPage.includes(term)
);

if (leakedChatbotPageCopy.length > 0) {
  console.error("Account chatbot still exposes report-style score/confidence copy:");
  console.error(leakedChatbotPageCopy.join(", "));
  process.exit(1);
}

if (!chatbotPage.includes("if (analysisFoodChoices.length === 0)")) {
  console.error(
    "Fallback next-step copy should only appear when no selectable food cards were returned."
  );
  process.exit(1);
}

const requiredCardFlowCopy = [
  "1. Pick",
  "2. Calculate",
  "3. Save",
  "Estimate grams",
  "Tap for grams/day and the next step.",
  "Tap to calculate grams and keep this food in the plan.",
  "Tap one card to see grams/day and keep that food in the plan.",
  "The first card is the strongest fit for the profile.",
  "Value options are simpler alternatives when they still fit well.",
  "Strongest first pick for the profile you gave.",
  "Simpler value-style alternative that still keeps a sensible nutrition fit.",
  "Good alternative if you want another suitable direction.",
  "formatCompareCustomerTakeaway",
  "How to choose:",
  "Next step: tell me which one you prefer",
  "Best nutrition fits",
  "options prioritised for fit",
  "Value options",
  "alternatives when they still fit",
  "Your plan is ready",
  "Plan summary",
  "Save it to keep calories, food choice, and first portion on the profile.",
  "Portion estimate",
  "If you split it:",
  "2 meals: about",
  "3 meals: about",
  "analysisMetadata.feedingGramsPerDay / 2",
  "getRecommendationChoiceFacts(choice, chatLanguage)",
  "calorie_aware_feeding",
  "sterilised_weight_management",
  "limited_protein_allergy_review",
  "large_breed_growth_mineral_review",
  "large-breed puppy mineral check",
  "lower-fat vet-guided review",
  "pancreatitis history without clear low-fat fit",
  "skin_coat_omega_review",
  "summer_low_appetite_feeding_review",
  "hot weather and low appetite",
  "hot-weather low appetite without enough energy support",
  "active_working",
  "high_activity_energy_support",
  "easy_chewing_kibble_review",
  "easy chewing or small kibble",
  "fussy_eater_palatability_trial",
  "fussy eater palatability trial",
  "hairball_fiber_support",
  "hairball fiber support",
  "senior_muscle_monitoring",
  "digestive_tolerance_review",
  "sterilised pets with too much energy density",
  "active pets without enough energy support",
  "senior pets without clear senior or mobility support",
  "kcal/100g",
  "protein",
  "fat",
  "fiber",
];
const missingCardFlowCopy = requiredCardFlowCopy.filter(
  (term) => !chatbotPage.includes(term)
);

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
const cardCtaIndex = chatbotPage.indexOf("Estimate grams", recommendedChoicesIndex);

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
