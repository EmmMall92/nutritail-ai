import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const chatbotPage = read("app/account/chatbot/page.tsx");
const packageJson = read("package.json");

assert(
  chatbotPage.includes("function getRecommendationShortlistHighlights"),
  "Chatbot must build a compact customer-facing food shortlist summary."
);
assert(
  chatbotPage.includes("Πρώτη πρόταση"),
  "Food shortlist summary must highlight the first recommendation in Greek."
);
assert(
  chatbotPage.includes("First recommendation"),
  "Food shortlist summary must highlight the first recommendation in English."
);
assert(
  chatbotPage.includes("Πρώτη μερίδα"),
  "Food shortlist summary must surface the first portion preview."
);
assert(
  chatbotPage.includes("Πάτησε τροφή"),
  "Food shortlist summary must explain that choosing a food shows grams per day."
);
assert(
  chatbotPage.includes("Τι θα δεις") && chatbotPage.includes("visiblePremiumCount"),
  "Food shortlist summary must show how many first and practical choices are visible."
);
assert(
  chatbotPage.includes("πιο απλές ή οικονομικές εναλλακτικές"),
  "Greek food shortlist summary must describe value choices in customer-friendly Greek."
);
assert(
  !chatbotPage.includes("απλές/value"),
  "Greek customer-facing shortlist copy must not expose the English value label."
);
assert(
  chatbotPage.includes("Budget-friendly alternatives"),
  "English food shortlist section should use customer-friendly budget wording."
);
assert(
  chatbotPage.includes('data-testid="customer-food-choice-guide"') &&
    chatbotPage.includes("For the strongest start") &&
    chatbotPage.includes("If budget also matters") &&
    chatbotPage.includes("Then tap one food") &&
    chatbotPage.includes("Look at the green cards first") &&
    chatbotPage.includes("Use the blue cards as practical or budget-friendly alternatives") &&
    chatbotPage.includes("I will calculate the first grams/day estimate"),
  "Food shortlist must include a customer-facing guide for strong picks, value picks, and grams/day action."
);
assert(
  chatbotPage.includes('data-testid="customer-choice-decision-guide"') &&
    chatbotPage.includes("Choose in this order") &&
    chatbotPage.includes("First we check age, size, neuter status, weight goal, and sensitivities.") &&
    chatbotPage.includes("Then we respect what the pet likes, refuses, or should avoid.") &&
    chatbotPage.includes("Finally you compare premium and practical alternatives without losing the fit."),
  "Food shortlist must explain the customer decision order: fit, taste, then budget."
);
assert(
  chatbotPage.includes("md:grid-cols-4"),
  "Food shortlist summary should have room for first pick, portion, list shape, and alternatives."
);
assert(
  chatbotPage.includes("getRecommendationShortlistHighlights("),
  "Chatbot UI must render the shortlist summary before detailed food cards."
);
assert(
  chatbotPage.includes('data-testid="selected-food-plan-card"'),
  "Chatbot must show a dedicated selected-food plan card after the customer chooses a food."
);
assert(
  chatbotPage.includes("Η επιλογή σου") && chatbotPage.includes("Your selected food"),
  "Selected-food card must clearly confirm the chosen food in Greek and English."
);
assert(
  chatbotPage.includes("Πρώτη ποσότητα") && chatbotPage.includes("Starting portion"),
  "Selected-food card must surface the starting portion in customer-friendly copy."
);
assert(
  chatbotPage.includes("Review weight, appetite, and stool in 2-4 weeks."),
  "Selected-food card must tell the customer what to monitor before the progress check."
);
assert(
  chatbotPage.includes('data-testid="selected-food-next-steps"'),
  "Selected-food card must show a visible next-steps panel after choosing a food."
);
assert(
  chatbotPage.includes("1. Αποθήκευση") &&
    chatbotPage.includes("2. Μετάβαση") &&
    chatbotPage.includes("3. Επανέλεγχος") &&
    chatbotPage.includes("Save to keep the food, portion, and goal on the profile.") &&
    chatbotPage.includes("In 2-4 weeks, come back with weight, grams, treats, and results."),
  "Selected-food next steps must guide save, transition, and progress check in customer language."
);
assert(
  chatbotPage.includes('data-testid="selected-food-first-week-checklist"') &&
    chatbotPage.includes("Πρώτη εβδομάδα εφαρμογής") &&
    chatbotPage.includes("First week checklist") &&
    chatbotPage.includes("Μέτρα την ποσότητα") &&
    chatbotPage.includes("Keep treats steady") &&
    chatbotPage.includes("Watch appetite, stool, energy") &&
    chatbotPage.includes("In 2-4 weeks, bring weight, grams/day, and the result."),
  "Selected-food card must give a first-week customer checklist before save/progress."
);
assert(
  packageJson.includes("\"qa:chatbot-choice-summary-contract\""),
  "package.json must expose the chatbot choice summary QA script."
);

console.log("Chatbot choice summary contract passed.");
