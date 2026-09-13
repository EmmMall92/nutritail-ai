import { readFileSync } from "node:fs";

import { planChatbotResponse } from "../../lib/chatbot/responsePlanner";
import {
  blocksFoodRecommendations,
  detectSafetyWarnings,
  hasMedicalHandoff,
} from "../../lib/chatbot/safetyRules";
import type { MatchedFoodForPlanning } from "../../lib/chatbot/types";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const medicalCases = [
  { message: "Γάτα με νεφρική νόσο", code: "renal" },
  { message: "Σκύλος με παγκρεατίτιδα", code: "pancreatitis" },
  { message: "Σκύλος με διαβήτη και ινσουλίνη", code: "diabetes" },
  { message: "Γάτα με ιστορικό FLUTD", code: "urinary_condition" },
  { message: "Σκύλος με ηπατική νόσο", code: "hepatic_condition" },
  { message: "Γάτα με καρδιολογική πάθηση", code: "cardiac_condition" },
  { message: "Θέλω αλλαγή θεραπευτικής τροφής", code: "therapeutic_diet" },
] as const;

for (const medicalCase of medicalCases) {
  const warnings = detectSafetyWarnings({
    message: medicalCase.message,
    pet: { species: "cat" },
    locale: "el",
  });
  assert(hasMedicalHandoff(warnings), `${medicalCase.code} must require medical handoff.`);
  assert(
    blocksFoodRecommendations(warnings),
    `${medicalCase.code} must block customer-facing recommendations.`
  );
  assert(
    warnings.some((warning) => warning.code === medicalCase.code),
    `${medicalCase.code} warning code is missing.`
  );
}

const candidateFood = {
  id: "qa-food",
  brand: "QA Brand",
  name: "Adult Complete",
  display_name: "QA Brand Adult Complete",
  species: "cat",
  data_quality_status: "verified",
  missing_nutrition_fields: [],
  ranking: { confidence: "high" },
} satisfies MatchedFoodForPlanning;

const medicalPlan = planChatbotResponse({
  message: "Η γάτα έχει νεφρική νόσο και θέλω τροφή",
  pet: {
    species: "cat",
    age: 10,
    weight: 4,
    healthIssues: ["renal disease"],
    allergies: [],
  },
  matchedFoods: [candidateFood],
  intent: "renal",
});

assert(medicalPlan.eligible_foods.length === 0, "Medical plans must expose no foods.");
assert(!medicalPlan.should_ask_followup, "Medical plans must not continue shopping intake.");
assert(medicalPlan.confidence_level === "low", "Medical plans must not claim recommendation confidence.");

const healthyPlan = planChatbotResponse({
  message: "Θέλω καθημερινή τροφή για υγιή ενήλικη γάτα",
  pet: {
    species: "cat",
    age: 3,
    weight: 4,
    healthIssues: [],
    allergies: [],
  },
  matchedFoods: [candidateFood],
  intent: "food_recommendation",
});

assert(healthyPlan.eligible_foods.length === 1, "Healthy non-medical matching must remain available.");

const chatbotPage = read("app/account/chatbot/page.tsx");
const analysisRoute = read("app/api/account/chatbot/analyze/route.ts");
const recommendationRoute = read("app/api/account/foods/v2-recommendations/route.ts");
const termsPage = read("app/terms/page.tsx");
const aiPage = read("app/ai-transparency/page.tsx");

for (const [path, source] of [
  ["chatbot UI", chatbotPage],
  ["analysis API", analysisRoute],
  ["recommendation API", recommendationRoute],
] as const) {
  assert(
    source.includes("blocksFoodRecommendations"),
    `${path} must enforce the shared medical handoff blocker.`
  );
}

for (const marker of [
  "χωρίς κατάταξη προϊόντων, θερμίδες ή γραμμάρια",
  "δεν παρουσιάζονται ως πτυχίο ή άδεια άσκησης του κτηνιατρικού επαγγέλματος",
]) {
  assert(termsPage.includes(marker), `Terms medical boundary is missing: ${marker}`);
}

assert(
  aiPage.includes("παραμένει μπλοκαρισμένη σε UI και server APIs"),
  "AI transparency must describe the technical medical block."
);

console.log(
  `Medical handoff contract passed: ${medicalCases.length} medical categories block products, calories, and portions while healthy matching remains available.`
);
