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

const requiredCompactFlow = [
  'data-testid="customer-recommendation-choice-panel"',
  'data-testid="customer-preferences-applied-strip"',
  "getRecommendationChoiceGroups(recommendedFoodChoices, chatLanguage)",
  "group.choices.length}/{group.key === \"premium\" ? 2 : 1}",
  "hidden text-xs leading-5 sm:block",
  "Calculate grams/day",
  'data-testid="selected-food-plan-card"',
  'data-testid="save-analysis-panel"',
  "First portion: about",
  "Keep treats steady and review weight, appetite, and stool in 2-4 weeks.",
];

const missingCompactFlow = requiredCompactFlow.filter((term) => !chatbotPage.includes(term));

assert(
  missingCompactFlow.length === 0,
  `Compact customer recommendation flow is missing markers: ${missingCompactFlow.join(", ")}`
);

const removedVerbosePanels = [
  'data-testid="customer-food-choice-confidence-strip"',
  'data-testid="customer-choice-decision-guide"',
  'data-testid="customer-food-journey-stepper"',
  "getRecommendationShortlistHighlights(",
  "recommendation-card-watch",
  "Next: calculate grams/day.",
  "Total: about",
  'data-testid="selected-food-pocket-plan"',
  'data-testid="selected-food-first-week-checklist"',
  'data-testid="selected-food-next-steps"',
  'data-testid="selected-food-action-buttons"',
];

const stillVerbose = removedVerbosePanels.filter((term) => chatbotPage.includes(term));

assert(
  stillVerbose.length === 0,
  `Customer chatbot should not render verbose duplicate recommendation panels: ${stillVerbose.join(", ")}`
);

assert(
  chatbotPage.includes(".slice(0, 2)") && chatbotPage.includes(".slice(0, 1)"),
  "Customer food cards must stay compact: max two strongest picks and one practical option."
);

assert(
  packageJson.includes("\"qa:chatbot-choice-summary-contract\""),
  "package.json must expose the chatbot choice summary QA script."
);

console.log("Chatbot compact choice summary contract passed.");
