import { formatFoodV2ChatbotRecommendationSummary } from "@/lib/food-v2/chatbotRecommendationSummary";
import { planFoodV2RecommendationResponse } from "@/lib/food-v2/recommendationResponseAdapter";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ||
  "reports/customer_facing_recommendation_qa.md";

function toEscapedUnicode(value: string) {
  return value.replace(/[^\x00-\x7F]/g, (char) =>
    `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`
  );
}

function sourceIncludesTextOrEscapedUnicode(source: string, text: string) {
  return source.includes(text) || source.includes(toEscapedUnicode(text));
}

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
  compactForCards = false,
  extraOptions: Partial<Parameters<typeof formatFoodV2ChatbotRecommendationSummary>[1]> = {}
) {
  return formatFoodV2ChatbotRecommendationSummary(response, {
    locale,
    maxItemsPerSection: 2,
    compactForCards,
    ...extraOptions,
  });
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sentenceCount(text: string) {
  return text
    .replace(/\b(?:e\.g|i\.e)\./gi, "")
    .split(/[.!?;]+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

const sample = summary(sampleResponse);
const greekSample = summary(sampleResponse, "el");
const compactCardsSample = summary(sampleResponse, "en", true);
const compactGreekCardsSample = summary(sampleResponse, "el", true);
const preferenceSample = summary(sampleResponse, "en", true, {
  preferredProteins: ["chicken"],
  excludedIngredients: ["lamb", "beef"],
});
const greekPreferenceSample = summary(sampleResponse, "el", true, {
  preferredProteins: ["\u03ba\u03bf\u03c4\u03cc\u03c0\u03bf\u03c5\u03bb\u03bf"],
  excludedIngredients: [
    "\u03b1\u03c1\u03bd\u03af",
    "\u03bc\u03bf\u03c3\u03c7\u03ac\u03c1\u03b9",
  ],
});
const valueGoalSample = summary({ ...sampleResponse, goal: "value" as const });
const greekAdapterPlan = planFoodV2RecommendationResponse({
  ...sampleResponse,
  locale: "el",
});
const greekAdapterText = [
  greekAdapterPlan.title,
  greekAdapterPlan.summary,
  ...greekAdapterPlan.sections.flatMap((section) => [
    section.title,
    ...section.items,
  ]),
  ...greekAdapterPlan.cautions,
  greekAdapterPlan.followUpQuestion,
].join("\n");

const requiredCleanGreekAdapterCopy = [
  "Προτάσεις τροφής",
  "στειρωμένο κατοικίδιο",
  "Βρήκα επιλογές χωρισμένες σε δυνατές διατροφικά",
  "Καλύτερες διατροφικά επιλογές",
  "ταιριάζει σε ενήλικο κατοικίδιο",
  "δυνατή επιλογή",
  "Οι προτάσεις είναι διατροφική καθοδήγηση, όχι διάγνωση ή θεραπεία.",
  "Θέλεις να δούμε και πιο οικονομικές επιλογές",
];

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
          food_intelligence: {
            best_use_cases: ["urinary_mineral_review", "urinary_complete_mineral_review"],
            strengths: [
              "Magnesium, phosphorus and sodium are available for urinary mineral review.",
            ],
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
          food_intelligence: {
            best_use_cases: ["renal_phosphorus_review", "renal_mineral_review"],
            strengths: ["Phosphorus and sodium are available for renal mineral review."],
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
    expectedGoalLabel: "general recommendation",
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
  "OpenAI",
  "model",
  "prompt",
  "QA check",
  "proof status",
  "internal tooling",
  "missing_nutrition",
  "fat looks high",
  "fat is not low enough",
  "renal cases need",
  "urinary reasoning is weaker",
  "matches adult life stage",
  "ingredient data is available",
  "role:",
  "use case:",
  "For this pet, I am prioritising:",
  "Food picks for this pet",
  "Recommended foods:",
  "Key notes:",
  "Daily calorie guide",
  "Resting calories:",
  "Final daily target:",
  "The food cards below are the next step. Choose one option to calculate grams/day.",
  "Οδηγός ημερήσιων θερμίδων",
  "Θερμίδες ηρεμίας:",
  "Τελικός ημερήσιος στόχος:",
  "Οι κάρτες τροφών παρακάτω είναι το επόμενο βήμα.",
  "Weight Control:",
  "High Activity:",
  "Senior Nutrition:",
  "Puppy/Kitten Growth:",
  "First picks:",
  "Simple alternatives:",
  "Practical first picks:",
  "Stronger nutrition alternatives:",
  "At a glance:",
  "Why I picked it:",
  "Start with:",
  "calculate daily grams",
  "candidate kept out",
  "kept foods out of the shortlist",
  "value ranking is a proxy",
  "data is usable",
  "\uFFFD",
  "Ο",
];

const allSummaries = `${sample}\n${greekSample}\n${compactCardsSample}\n${compactGreekCardsSample}\n${preferenceSample}\n${greekPreferenceSample}\n${valueGoalSample}\n${greekAdapterText}\n${coreScenarioSamples
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

const greekCustomerText = `${greekSample}\n${compactGreekCardsSample}\n${greekAdapterText}`;
if (/\bvalue\b/i.test(greekCustomerText)) {
  console.error("Greek customer-facing recommendation should not expose the English 'value' label:");
  console.error(greekCustomerText);
  process.exit(1);
}

if (
  !greekAdapterPlan.title.includes("Προτάσεις τροφής") ||
  !greekAdapterText.includes("Καλύτερες διατροφικά επιλογές") ||
  /Ξ|Ξ|Ξ |Ο€|οΏ½/.test(greekAdapterText)
) {
  console.error("Food V2 recommendation response adapter should render clean Greek customer copy.");
  console.error(greekAdapterText);
  process.exit(1);
}

const missingCleanGreekAdapterCopy = requiredCleanGreekAdapterCopy.filter(
  (term) => !greekAdapterText.includes(term)
);

if (missingCleanGreekAdapterCopy.length > 0) {
  console.error("Food V2 recommendation response adapter is missing clean Greek customer copy:");
  console.error(missingCleanGreekAdapterCopy.join(", "));
  console.error(greekAdapterText);
  process.exit(1);
}

for (const scenario of coreScenarioSamples) {
  if (
    !scenario.text.includes(
      `Based on what you told me, I built a shortlist for ${scenario.expectedGoalLabel}.`
    )
  ) {
    console.error(`Scenario ${scenario.label} did not show the expected customer priority.`);
    console.error(scenario.text);
    process.exit(1);
  }

  if (!scenario.text.includes("Next step: choose one food card below to see the first daily portion in grams")) {
    console.error(`Scenario ${scenario.label} did not include the customer card CTA.`);
    console.error(scenario.text);
    process.exit(1);
  }
}

const urinaryCustomerScenario = coreScenarioSamples.find(
  (scenario) => scenario.label === "urinary cat"
);
if (
  !urinaryCustomerScenario?.text.includes("magnesium, phosphorus and sodium context") ||
  !urinaryCustomerScenario.text.includes("key mineral context")
) {
  console.error("Urinary customer-facing copy should explain mineral context without back-office wording.");
  console.error(urinaryCustomerScenario?.text);
  process.exit(1);
}

const renalCustomerScenario = coreScenarioSamples.find(
  (scenario) => scenario.label === "renal senior cat"
);
if (
  !renalCustomerScenario?.text.includes("phosphorus and sodium context") ||
  !renalCustomerScenario.text.includes("renal-positioned foods")
) {
  console.error("Renal customer-facing copy should explain phosphorus/sodium context without back-office wording.");
  console.error(renalCustomerScenario?.text);
  process.exit(1);
}

if (!sample.includes("Your food shortlist") || !sample.includes("Happy Dog")) {
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

if (!compactCardsSample.includes("I found the best first choices and placed them below as cards")) {
  console.error("Compact card-facing recommendation should point to the cards.");
  console.error(compactCardsSample);
  process.exit(1);
}

if (!compactCardsSample.includes("Choose one food card below to see the first daily portion in grams")) {
  console.error("Compact card-facing recommendation should include a clear card action.");
  console.error(compactCardsSample);
  process.exit(1);
}

if (
  !compactCardsSample.includes("best starting choices and budget-friendly alternatives") ||
  !compactCardsSample.includes("nutrition fit, flavour, and budget")
) {
  console.error("Compact card-facing recommendation should explain the premium/value card split.");
  console.error(compactCardsSample);
  process.exit(1);
}

if (
  !preferenceSample.includes("I also respected the pet's preferences") ||
  !preferenceSample.includes("preferred flavours/proteins such as chicken") ||
  !preferenceSample.includes("avoided lamb, beef")
) {
  console.error("English customer recommendation should explain applied flavour preferences and avoidances.");
  console.error(preferenceSample);
  process.exit(1);
}

if (!compactGreekCardsSample.includes("κάρτες από κάτω")) {
  console.error("Compact Greek card-facing recommendation should point to the cards.");
  console.error(compactGreekCardsSample);
  process.exit(1);
}

if (
  !compactGreekCardsSample.includes("πρώτες επιλογές") ||
  !compactGreekCardsSample.includes("πρακτικές/οικονομικές εναλλακτικές")
) {
  console.error("Compact Greek card-facing recommendation should explain the first/value card split.");
  console.error(compactGreekCardsSample);
  process.exit(1);
}

if (
  !greekPreferenceSample.includes("Έλαβα υπόψη τις προτιμήσεις του κατοικιδίου") ||
  !greekPreferenceSample.includes("κοτόπουλο") ||
  !greekPreferenceSample.includes("αρνί, μοσχάρι")
) {
  console.error("Greek customer recommendation should explain applied flavour preferences and avoidances.");
  console.error(greekPreferenceSample);
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

if (wordCount(compactCardsSample) > 90 || sentenceCount(compactCardsSample) > 4) {
  console.error("Compact card-facing recommendation must stay short enough to let the cards do the work.");
  console.error(compactCardsSample);
  process.exit(1);
}

if (wordCount(compactGreekCardsSample) > 90 || sentenceCount(compactGreekCardsSample) > 4) {
  console.error("Compact Greek card-facing recommendation must stay short enough to let the cards do the work.");
  console.error(compactGreekCardsSample);
  process.exit(1);
}

if (!valueGoalSample.includes("Budget-friendly first choices:")) {
  console.error("Value goal should label the first section as value picks.");
  console.error(valueGoalSample);
  process.exit(1);
}

if (
  !sample.includes("Best starting choices:") ||
  (!sample.includes("Budget-friendly alternatives:") && sampleResponse.value.length > 0)
) {
  console.error("Customer-facing recommendation should use polished section labels.");
  console.error(sample);
  process.exit(1);
}

if (/\b\d{1,3}\/100\b/.test(`${sample}\n${greekSample}`)) {
  console.error("Customer-facing recommendation should not expose raw internal score labels.");
  console.error(sample);
  console.error(greekSample);
  process.exit(1);
}

const chatbotPage = readFileSync("app/account/chatbot/page.tsx", "utf8");
const transitionGuideSource = readFileSync("lib/foodTransitionGuide.ts", "utf8");
const responseComposer = readFileSync("lib/ai/responseComposer.ts", "utf8");
const promptInstructions = readFileSync("lib/ai/promptInstructions.ts", "utf8");
const responseAdapter = readFileSync("lib/food-v2/recommendationResponseAdapter.ts", "utf8");
const recommendationSummarySource = readFileSync(
  "lib/food-v2/chatbotRecommendationSummary.ts",
  "utf8"
);
const compareRoute = readFileSync("app/api/account/foods/compare/route.ts", "utf8");

const requiredSeverityAwareSafetyCopy = [
  "function hasMedicalSafetyContext",
  "function customerSafetyReminder",
  "Because there is a medical context, the final diet choice should be checked with a veterinarian.",
  "If severe vomiting, diarrhea, blood, not eating, or trouble urinating appears, contact a veterinarian promptly.",
  "customerSafetyReminder(input, \"el\")",
  "customerSafetyReminder(input, \"en\")",
];
const missingSeverityAwareSafetyCopy = requiredSeverityAwareSafetyCopy.filter(
  (term) => !responseComposer.includes(term)
);

if (missingSeverityAwareSafetyCopy.length > 0) {
  console.error("Recommendation fallback must keep severity-aware customer safety copy:");
  console.error(missingSeverityAwareSafetyCopy.join(", "));
  process.exit(1);
}

if (
  responseComposer.includes(
    "For urinary, kidney, diabetes, pancreatitis, severe vomiting, diarrhea, blood, or not eating, speak with a veterinarian first."
  )
) {
  console.error(
    "General recommendation fallback should not use the old broad veterinary disclaimer."
  );
  process.exit(1);
}

const forbiddenComposerCopy = [
  "score: food.ranking?.total_score",
  "(${score}/100)",
  "matches with score",
  "ταιριάζει με score",
  "high confidence",
  "medium confidence",
  "low confidence",
  "\uFFFD",
];
const leakedComposerCopy = forbiddenComposerCopy.filter((term) =>
  `${responseComposer}\n${responseAdapter}`.includes(term)
);

if (leakedComposerCopy.length > 0) {
  console.error("Customer-facing recommendation copy still exposes internal score/confidence wording:");
  console.error(leakedComposerCopy.join(", "));
  process.exit(1);
}

const requiredComposerNameCleanup = [
  "customerFoodName(food)",
  "customerFoodDisplayName(food)",
  "customer_name: customerFoodName(food)",
];
const missingComposerNameCleanup = requiredComposerNameCleanup.filter(
  (term) => !responseComposer.includes(term)
);

if (missingComposerNameCleanup.length > 0) {
  console.error(
    "OpenAI recommendation composer must use the same customer food-name cleanup as chatbot cards:"
  );
  console.error(missingComposerNameCleanup.join(", "));
  process.exit(1);
}

const requiredCompactComposerFlow = [
  "The strongest starting options are in the cards below.",
  "Choose one food card below to see the first daily portion in grams.",
  "When selectable food cards follow, write only a short intro and next action",
  "If cards_follow is true, keep the answer under 65 words",
  "If cards_follow is true, use at most 3 short sentences",
  "wordCount(text) > 65",
  "sentenceCount(text) > 3",
  "If cards_follow is true, mention only the single best starting food, not every card",
  "If cards_follow is true, do not tell the user to save the plan in this intro",
  "Do not mention scores, confidence labels, source quality, review status, or missing fields",
  "If cards_follow is true, do not include kcal/100g, protein/fat/fiber percentages, or nutrition-table style snapshots",
  "Do not use headings such as Food shortlist, Best nutrition fits, Safety notes, Confidence notes, or Cautions",
  "food shortlist from",
  "needs[_\\s-]?review",
  "nutritionSnapshotTerms",
  "Explain one practical reason and one action, then stop",
  "the cards are the recommendation UI",
];
const missingCompactComposerFlow = requiredCompactComposerFlow.filter(
  (term) => !responseComposer.includes(term)
);

if (missingCompactComposerFlow.length > 0) {
  console.error("OpenAI/fallback composer is missing compact customer card-flow rules:");
  console.error(missingCompactComposerFlow.join(", "));
  process.exit(1);
}

const requiredCompactPromptFlow = [
  "Do not include kcal/100g, protein/fat/fiber percentages, or nutrition-table style snapshots in this compact intro.",
];
const missingCompactPromptFlow = requiredCompactPromptFlow.filter(
  (term) => !promptInstructions.includes(term)
);

if (missingCompactPromptFlow.length > 0) {
  console.error("OpenAI answer-writer prompt is missing compact customer nutrition-snapshot limits:");
  console.error(missingCompactPromptFlow.join(", "));
  process.exit(1);
}

if (responseComposer.includes("value.slice(0, 2)")) {
  console.error(
    "OpenAI/fallback composer must preserve up to 3 premium and 3 value food choices."
  );
  process.exit(1);
}

const forbiddenCompactComposerFlow = [
  "Tap one card to see estimated grams/day, then save the plan.",
  "Tap one card to see the first daily portion in grams.",
];
const leakedCompactComposerFlow = forbiddenCompactComposerFlow.filter((term) =>
  responseComposer.includes(term)
);

if (leakedCompactComposerFlow.length > 0) {
  console.error("OpenAI/fallback composer still mixes card choice and save actions:");
  console.error(leakedCompactComposerFlow.join(", "));
  process.exit(1);
}

const forbiddenChatbotPageCopy = [
  "Food score:",
  "Nutrition confidence:",
  "Review before saving",
  "Analysis summary",
  "Save when the pet details, calorie target, and food context look right.",
  "Επόμενο βήμα: διάλεξε μία τροφή από τη λίστα",
  "Top pick:",
  "Πρώτη επιλογή:",
  "Score: ${getHistoryFoodScore",
  "Strong match",
  "Good match",
  "general fit",
  "premium fit",
  "value fit",
  "Useful alternative",
  "getRecommendationChoiceMatchLabel",
  "const reason = food.ranking?.reasons?.find",
  "estimated grams/day",
  "Your first nutrition analysis is ready:",
  "Η πρώτη διατροφική ανάλυση είναι έτοιμη:",
  "Plan summary",
  "Choose a food for grams",
  "keep that food in the analysis",
  "result.summary.note",
  "Use this as a structured comparison aid.",
  "no confident database match",
  "compare them confidently",
  "nutrition gaps",
  "directional rather than final",
  "structured comparison",
  "Main need:",
  "Next step: tap one food card to see the first daily portion in grams",
  "Tap one card to estimate portions/day",
  "Next step: press save to keep the food, calories, and first portion on the profile.",
  "Save this food as the chosen option on the profile.",
  "Χρησιμοποίησέ το σαν δομημένη βοήθεια σύγκρισης.",
  "Treat allowance:",
  "Όριο για λιχουδιές:",
  "Goal: weight maintenance. Calories are based on maintenance needs.",
  "There is no analysis to save yet. Run an analysis first.",
  "There was a problem saving the analysis. Please try again.",
  "Budget: έως",
  "Budget: χωρίς",
  "Στόχος: διατήρηση βάρους. Οι θερμίδες βασίζονται στις ανάγκες συντήρησης.",
  "The first card is the strongest start for this pet profile.",
  "stronger starting choices",
  "Simple / budget options",
  "Simple options are not bad foods.",
  "List shape",
];
const leakedChatbotPageCopy = forbiddenChatbotPageCopy.filter((term) =>
  chatbotPage.includes(term)
);

if (leakedChatbotPageCopy.length > 0) {
  console.error("Account chatbot still exposes report-style score/confidence copy:");
  console.error(leakedChatbotPageCopy.join(", "));
  process.exit(1);
}

const forbiddenRecommendationSummaryCopy = [
  "Main need:",
  "Κύρια ανάγκη που καλύπτουμε:",
  "Next step: tap one food card to see the first daily portion in grams",
  "Tap one card to estimate portions/day",
];
const leakedRecommendationSummaryCopy = forbiddenRecommendationSummaryCopy.filter((term) =>
  recommendationSummarySource.includes(term)
);

if (leakedRecommendationSummaryCopy.length > 0) {
  console.error("Food V2 chatbot summary still exposes mechanical customer copy:");
  console.error(leakedRecommendationSummaryCopy.join(", "));
  process.exit(1);
}

if (!chatbotPage.includes("if (analysisFoodChoices.length === 0)")) {
  console.error(
    "Fallback next-step copy should only appear when no selectable food cards were returned."
  );
  process.exit(1);
}

const requiredLocalizedFoodQualityNote = [
  "function getFoodQualityNote(food: Record<string, unknown>, language: ChatLanguage)",
  "const isGreek = language === \"el\"",
  "qualityNote: getFoodQualityNote(matchedFood, chatLanguage)",
  "This food has enough label detail for a clearer nutrition discussion.",
  "I do not have every label detail yet, so I will treat this as a possible choice rather than an absolute answer.",
];
const missingLocalizedFoodQualityNote = requiredLocalizedFoodQualityNote.filter(
  (term) => !chatbotPage.includes(term)
);

if (missingLocalizedFoodQualityNote.length > 0) {
  console.error("Current-food match quality notes must be localized for Greek and English chats:");
  console.error(missingLocalizedFoodQualityNote.join(", "));
  process.exit(1);
}

const requiredCompareNameCleanup = [
  'import { customerFoodDisplayName } from "@/lib/food-v2/customerFoodName";',
  "function getFoodV2CustomerDisplayName",
  "name: getFoodV2CustomerDisplayName(bestV2)",
  "name: getFoodV2CustomerDisplayName(item)",
  "function isBrandOnlyCompareQuery",
  'query_kind: "brand_only"',
];
const missingCompareNameCleanup = requiredCompareNameCleanup.filter(
  (term) => !compareRoute.includes(term)
);

if (missingCompareNameCleanup.length > 0) {
  console.error("Food compare API must return customer-clean Food V2 names:");
  console.error(missingCompareNameCleanup.join(", "));
  process.exit(1);
}

const requiredCardFlowCopy = [
  "Best choice",
  "Practical option",
  "Good alternative",
  "Calculate grams/day",
  "customer-recommendation-choice-panel",
  "Food choices are ready",
  "Next: calculate grams/day.",
  "Start with the strongest choices. If budget also matters, check the practical alternatives too.",
  "Choose the food you prefer to see grams per day.",
  "If you change your mind before saving, you can tap another card.",
  "customer-choice-decision-guide",
  "ταίριασμα και γεύση",
  "one food card",
  "1. Compare",
  "2. Choose",
  "3. Get",
  "sm:grid-cols-3",
  "At a glance",
  "Best first choice for this pet's profile.",
  "Practical alternative when you want a simpler option.",
  "Another suitable option if you want a different direction.",
  "Your nutrition plan is ready:",
  "Calories in plain language",
  "Basic body calories:",
  "Daily calories for this plan:",
  "Γράψε μια ρεαλιστική ηλικία σε χρόνια",
  "Preparing reply...",
  "Treats: up to about",
  "What to watch for this pet:",
  "Now choose one food card below and I will calculate grams/day to complete the plan.",
  "preferredProteins: pet.preferredProteins ?? []",
  "excludedIngredients: pet.excludedIngredients ?? []",
  "formatCompareCustomerTakeaway",
  "formatCompareCandidateOptions",
  "this is a brand, not a specific food, so I will not pick a random formula.",
  "Possible formulas to choose from:",
  "How to choose:",
  "I need the exact product name before I can compare it well.",
  "missing some label details",
  "compare the main nutrition points",
  "Next step: tell me which one you prefer",
  "Best starting choices",
  "starting choices",
  "Budget-friendly alternatives",
  "alternatives when flavour, availability, or price matters",
  "Your plan is ready",
  "First portion",
  "Total: about",
  "2 meals: about",
  "3 meals: about",
  "Save it to keep calories, food choice, and first portion on the profile.",
  "Start with this amount for 2-4 weeks.",
  "Review weight, appetite, and stool in 2-4 weeks.",
  "Next step: press save to keep the food, portion, and report on the profile.",
  "For the first week, keep meals consistent and avoid adding many new treats or toppers.",
  "After 2-4 weeks, come back for a progress check with the new weight, actual grams/day, appetite, stool, energy, and whether the pet still likes the flavour.",
  "If you decide to change food, do it gradually:",
  "analysisMetadata.feedingGramsPerDay / 2",
  "getRecommendationChoiceFacts(choice, chatLanguage)",
  "getRecommendationChoiceReasonText(choice, index, chatLanguage)",
  "getRecommendationChoiceWatchNote(",
  "data-testid=\"recommendation-card-why\"",
  "data-testid=\"recommendation-card-watch\"",
  "dog: { el: \"σκύλους\", en: \"dogs\" }",
  "dry: { el: \"ξηρά τροφή\", en: \"dry food\" }",
  "choice.kcalPer100g == null",
  "async function startNewPetFromPetChoice",
  "hasNoHealthIssueAnswer(text)",
  "(step === \"health\" && hasNoHealthIssueAnswer(text))",
  "currentFoodAnswered:",
  "(step === \"currentFood\" && isUnknownFoodAnswer(text))",
  "preferencesAnswered:",
  "mergeTastePreferencesFromText",
  "await continueIntakeOrRunAnalysis(startingPet)",
  "matchesDeclaredIngredientIssue",
  "if (mentionedIngredientGroups.length > 0)",
  "return matchesDeclaredIngredientIssue;",
  "[\"chicken\", \"κοτοπουλ\"]",
  "[\"salmon\", \"σολομ\"]",
  "calorie_aware_feeding",
  "sterilised_weight_management",
  "limited_protein_allergy_review",
  "large_breed_growth_mineral_review",
  "large-breed puppy mineral check",
  "lower-fat vet-guided review",
  "pancreatitis history without clear low-fat suitability",
  "skin_coat_omega_review",
  "summer_low_appetite_feeding_review",
  "hot weather and low appetite",
  "hot-weather low appetite without enough energy support",
  "cold_weather_outdoor_feeding_review",
  "cold-weather or outdoor feeding review",
  "cold_weather_outdoor_without_energy_support",
  "cold-weather outdoor feeding without enough energy support",
  "controlled_weight_gain_recovery_review",
  "controlled weight-gain or recovery review",
  "recovery_weight_gain_without_energy_protein_support",
  "recovery or weight gain without enough energy and protein support",
  "small_breed_formula_review",
  "small-breed formula fit",
  "large_breed_formula_review",
  "large-breed formula fit",
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
  "energy-dense food without clear active use",
  "Energy-dense foods need clear active or weight-gain use",
  "food.food_intelligence?.not_ideal_cases",
  "senior pets without clear senior or mobility support",
  "It better matches this dog's size, with clearer breed-size positioning for the food choice.",
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

const requiredRecommendationSummaryPreferenceCopy = [
  "I also respected the pet's preferences",
  "Έλαβα υπόψη τις προτιμήσεις του κατοικιδίου",
  "preferredProteins",
  "excludedIngredients",
];
const missingRecommendationSummaryPreferenceCopy =
  requiredRecommendationSummaryPreferenceCopy.filter(
    (term) => !recommendationSummarySource.includes(term)
  );

if (missingRecommendationSummaryPreferenceCopy.length > 0) {
  console.error("Recommendation summary is missing customer-facing preference context copy:");
  console.error(missingRecommendationSummaryPreferenceCopy.join(", "));
  process.exit(1);
}

const requiredGreekCardFlowCopy = [
  "Καλύτερη επιλογή",
  "Πρακτική επιλογή",
  "Καλή εναλλακτική",
  "Υπολόγισε γραμμάρια/ημέρα",
  "Οι προτάσεις σου είναι έτοιμες",
  "Επόμενο: υπολόγισε γραμμάρια/ημέρα.",
  "Πρώτα βλέπεις τις πιο κατάλληλες επιλογές",
  "Πάτησε την τροφή που προτιμάς",
  "Με μια ματιά",
  "Πιο οικονομική / πρακτική εναλλακτική",
  "Πώς να το διαβάσεις:",
  "Οι 3 βασικές προτάσεις",
  "Πιο πρακτικές / οικονομικές επιλογές",
  "εναλλακτικές όταν μετράνε γεύση, διαθεσιμότητα ή τιμή",
  "Πιο απλές ή οικονομικές εναλλακτικές εμφανίζονται μόνο όταν ταιριάζουν αρκετά καλά.",
  "εμφανίζονται μόνο όταν περνούν αρκετά καλά τα ίδια κριτήρια",
  "Το διατροφικό πλάνο είναι έτοιμο",
  "Με απλά λόγια για τις θερμίδες",
  "Βασικές θερμίδες σώματος:",
  "Ημερήσιες θερμίδες για το πλάνο:",
  "Λιχουδιές: έως περίπου",
  "Τι προσέχουμε για αυτό το κατοικίδιο:",
  "Τώρα διάλεξε μία κάρτα τροφής από κάτω",
  "Το πλάνο σου είναι έτοιμο",
  "Πρώτη ποσότητα",
  "Σύνολο: περίπου",
  "Σε 2 γεύματα: περίπου",
  "Σε 3 γεύματα: περίπου",
  "Αποθήκευσέ το για να κρατήσεις θερμίδες",
  "Ξεκίνα με αυτή την ποσότητα για 2-4 εβδομάδες.",
  "Για την πρώτη εβδομάδα κράτα τα γεύματα σταθερά",
  "Παρακολούθησε βάρος, όρεξη, κόπρανα και ενέργεια.",
  "Επόμενο βήμα: πάτησε Αποθήκευση",
  "έλεγχο προόδου με νέο βάρος",
  "πρωτεΐνη",
  "λιπαρά",
  "ίνες",
];
const missingGreekCardFlowCopy = requiredGreekCardFlowCopy.filter(
  (term) => !sourceIncludesTextOrEscapedUnicode(chatbotPage, term)
);

if (missingGreekCardFlowCopy.length > 0) {
  console.error("Chatbot food cards are missing Greek customer-facing flow copy:");
  console.error(missingGreekCardFlowCopy.join(", "));
  process.exit(1);
}

const requiredGreekTransitionCopy = [
  "Αν αλλάξεις τροφή, κάν' το σταδιακά:",
  "Ημέρες 1-2: 75% παλιά τροφή + 25% νέα τροφή",
  "Ημέρες 3-4: 50% παλιά τροφή + 50% νέα τροφή",
  "Ημέρες 5-6: 25% παλιά τροφή + 75% νέα τροφή",
  "Ημέρα 7+: 100% νέα τροφή",
];
const missingGreekTransitionCopy = requiredGreekTransitionCopy.filter(
  (term) => !sourceIncludesTextOrEscapedUnicode(chatbotPage, term) &&
    !sourceIncludesTextOrEscapedUnicode(transitionGuideSource, term)
);

if (missingGreekTransitionCopy.length > 0) {
  console.error("Chatbot transition guide is missing Greek customer-facing copy:");
  console.error(missingGreekTransitionCopy.join(", "));
  process.exit(1);
}

const requiredTransitionGuideSourceCopy = [
  "For digestive sensitivity, slow this down to 10-14 days and watch stool quality closely.",
  "For suspected allergy, avoid mixing multiple new foods during a trial unless your veterinarian advises it.",
  "Για ευαισθησία στην πέψη, κάνε τη μετάβαση πιο αργά",
  "Αν υπάρχει υποψία αλλεργίας, μην ανακατεύεις πολλές νέες τροφές",
];
const missingTransitionGuideSourceCopy = requiredTransitionGuideSourceCopy.filter(
  (term) => !sourceIncludesTextOrEscapedUnicode(transitionGuideSource, term)
);

if (missingTransitionGuideSourceCopy.length > 0) {
  console.error("Food transition guide is missing localized safety copy:");
  console.error(missingTransitionGuideSourceCopy.join(", "));
  process.exit(1);
}

const recommendedChoicesIndex = chatbotPage.lastIndexOf("getRecommendationChoiceGroups");
const recommendationBlockIndex = chatbotPage.lastIndexOf(
  "showSave && recommendedFoodChoices.length > 0",
  recommendedChoicesIndex
);
const pickStepIndex = chatbotPage.lastIndexOf("1. Compare", recommendedChoicesIndex);
const nutritionFactsIndex = chatbotPage.indexOf(
  "getRecommendationChoiceFacts(choice, chatLanguage).map",
  recommendedChoicesIndex
);
const cardCtaIndex = chatbotPage.indexOf("Calculate grams/day", recommendedChoicesIndex);

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

const groupedChoiceMarkers = [
  "Best starting choices",
  "Budget-friendly alternatives",
  "choose-food-before-save-notice",
  "requiresFoodChoiceBeforeSave",
  "disabled={isSaving || requiresFoodChoiceBeforeSave}",
  "Choose one food card first so I can calculate grams/day.",
  "Choose one food card first. Then I will calculate grams/day and save a complete plan.",
  "formatCleanPetIntakeSummary",
  "customer-preferences-applied-strip",
  "I used the taste preferences and avoidances.",
  "formatCustomerIngredientList(pet.preferredProteins",
  "formatCustomerIngredientList(pet.excludedIngredients",
  "grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3",
  "group.choices.map",
  "group.choices.length}/3",
  "If you change your mind before saving, you can tap another card.",
  "cleanCustomerFoodIntelligenceLabel",
  "getCustomerFoodIntelligenceBadgeLabel",
  "veterinary check",
  "mineral context",
  "omega context",
  "formula fit",
];
const missingGroupedChoiceMarkers = groupedChoiceMarkers.filter(
  (marker) => !chatbotPage.includes(marker)
);

if (missingGroupedChoiceMarkers.length > 0) {
  console.error("Recommendation cards must stay grouped into best and value choices:");
  console.error(missingGroupedChoiceMarkers.join(", "));
  process.exit(1);
}

if (chatbotPage.includes("{item}</span>")) {
  console.error(
    "Recommendation cards must sanitize food-intelligence tags before rendering them to customers."
  );
  process.exit(1);
}

const pendingCompareNewPetMarkers = [
  "pendingCompareLabel",
  "pendingCompareQueries.length >= 2",
  "I will keep this comparison ready: ${pendingCompareLabel}",
  "species, age, weight, goal, and sensitivities",
  "run it with the right context",
];
const missingPendingCompareNewPetMarkers = pendingCompareNewPetMarkers.filter(
  (marker) => !chatbotPage.includes(marker)
);

if (missingPendingCompareNewPetMarkers.length > 0) {
  console.error(
    "Chatbot must preserve a pending compare request when the customer starts a new pet intake:"
  );
  console.error(missingPendingCompareNewPetMarkers.join(", "));
  process.exit(1);
}

const chooseRecommendedFoodStart = chatbotPage.indexOf("function chooseRecommendedFood");
const saveToMyAccountStart = chatbotPage.indexOf("async function saveToMyAccount");
const chooseRecommendedFoodSource =
  chooseRecommendedFoodStart === -1 || saveToMyAccountStart === -1
    ? ""
    : chatbotPage.slice(chooseRecommendedFoodStart, saveToMyAccountStart);

if (
  chooseRecommendedFoodSource === "" ||
  chooseRecommendedFoodSource.includes("setRecommendedFoodChoices([]);")
) {
  console.error(
    "Recommendation cards should stay visible after a food is chosen so the customer can change choice before saving."
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

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(
  reportPath,
  [
    "# Customer-Facing Recommendation QA",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This QA checks that Food V2 recommendations are presented in customer language without backend labels, raw scores, or confusing save-before-choice flows.",
    "",
    "## Summary",
    "",
    `- Scenario summaries checked: ${coreScenarioSamples.length}`,
    `- Forbidden customer-facing terms checked: ${forbiddenTerms.length}`,
    `- Required card-flow copy checks: ${requiredCardFlowCopy.length}`,
    `- Required Greek card-flow copy checks: ${requiredGreekCardFlowCopy.length}`,
    "- Result: PASS",
    "",
    "## Covered Scenarios",
    "",
    ...coreScenarioSamples.map((scenario) => `- ${scenario.label}`),
  ].join("\n") + "\n",
  "utf8",
);

console.log("Customer-facing chatbot recommendation QA passed.");
