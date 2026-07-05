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
  !chatbotPage.includes('data-testid="customer-food-choice-guide"') &&
    !chatbotPage.includes('data-testid="recommendation-final-choice-guide"'),
  "Food shortlist should not show duplicate customer guide panels before the food cards."
);
assert(
  chatbotPage.includes('data-testid="customer-choice-decision-guide"') &&
    chatbotPage.includes("fit and taste") &&
    chatbotPage.includes("one food card") &&
    chatbotPage.includes("grams/day"),
  "Food shortlist must keep one compact customer decision strip: compare, choose, grams/day."
);
assert(
  chatbotPage.includes('data-testid="customer-food-choice-confidence-strip"') &&
    chatbotPage.includes('data-testid="customer-food-choice-confidence-item"') &&
    chatbotPage.includes("Πώς να διαλέξεις") &&
    chatbotPage.includes("How to choose") &&
    chatbotPage.includes("Διατροφικό ταίριασμα") &&
    chatbotPage.includes("Γεύση και αποφυγές") &&
    chatbotPage.includes("Πρακτική καθημερινότητα") &&
    chatbotPage.includes("Nutrition fit") &&
    chatbotPage.includes("Taste and avoidances") &&
    chatbotPage.includes("Daily practicality"),
  "Food shortlist must help customers choose between cards using fit, taste/avoidances, and practical daily use."
);
assert(
  chatbotPage.includes('data-testid="customer-food-journey-stepper"') &&
    chatbotPage.includes('data-testid="customer-food-journey-stepper-item"') &&
    chatbotPage.includes("Τι γίνεται μετά") &&
    chatbotPage.includes("What happens next") &&
    chatbotPage.includes("Βλέπεις τις κάρτες") &&
    chatbotPage.includes("Πατάς μία τροφή") &&
    chatbotPage.includes("Βγαίνουν γραμμάρια/ημέρα") &&
    chatbotPage.includes("Αποθηκεύεις και επιστρέφεις για πρόοδο") &&
    chatbotPage.includes("Save and check progress"),
  "Food shortlist must show a visible customer journey stepper from cards to grams/day, save, and progress."
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
  chatbotPage.includes('data-testid="selected-food-pocket-plan"') &&
    chatbotPage.includes("At-home pocket plan") &&
    chatbotPage.includes("Today I feed") &&
    chatbotPage.includes("per meal if fed twice") &&
    chatbotPage.includes("with weight, appetite, stool, and taste response"),
  "Selected-food card must show a compact at-home pocket plan after the customer chooses a food."
);
assert(
  chatbotPage.includes('data-testid="selected-food-next-steps"'),
  "Selected-food card must show a visible next-steps panel after choosing a food."
);
assert(
  chatbotPage.includes('data-testid="selected-food-action-buttons"') &&
    chatbotPage.includes('href="#save-analysis-panel"') &&
    chatbotPage.includes('data-testid="save-analysis-panel"') &&
    chatbotPage.includes("Save this plan") &&
    chatbotPage.includes("Keep the report") &&
    chatbotPage.includes("Check progress later"),
  "Selected-food card must expose direct action buttons that take the customer to save/report/progress next steps."
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
