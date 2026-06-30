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
  chatbotPage.includes("Πρώτη επιλογή"),
  "Food shortlist summary must highlight the first recommendation in Greek."
);
assert(
  chatbotPage.includes("First pick"),
  "Food shortlist summary must highlight the first recommendation in English."
);
assert(
  chatbotPage.includes("Πρώτη μερίδα"),
  "Food shortlist summary must surface the first portion preview."
);
assert(
  chatbotPage.includes("Πάτησε κάρτα τροφής"),
  "Food shortlist summary must explain that tapping a card keeps the portion and plan."
);
assert(
  chatbotPage.includes("Δομή λίστας") && chatbotPage.includes("visiblePremiumCount"),
  "Food shortlist summary must show how many strong and value choices are visible."
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
  chatbotPage.includes("Simple / budget options"),
  "English food shortlist section should use customer-friendly budget wording."
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
  packageJson.includes("\"qa:chatbot-choice-summary-contract\""),
  "package.json must expose the chatbot choice summary QA script."
);

console.log("Chatbot choice summary contract passed.");
