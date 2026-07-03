import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const feedbackRoute = read("app/api/feedback/chat/route.ts");
const chatbotPage = read("app/account/chatbot/page.tsx");
const adminFeedbackPage = read("app/admin/chat-feedback/page.tsx");

assert(
  feedbackRoute.includes("\"food_choice_selected\""),
  "Feedback API must accept food_choice_selected events."
);
assert(
  chatbotPage.includes("eventType: \"food_choice_selected\""),
  "Customer chatbot must log selected recommendation cards."
);
assert(
  chatbotPage.includes("selectedFoodName: choice.name"),
  "Food-choice analytics must include the selected food name."
);
assert(
  chatbotPage.includes("selectedFoodBrand: choice.brand"),
  "Food-choice analytics must include the selected food brand."
);
assert(
  chatbotPage.includes("feedingGramsPerDay: gramsPerDay"),
  "Food-choice analytics must include the estimated grams/day when available."
);
assert(
  adminFeedbackPage.includes("Selected Food Trends"),
  "Admin feedback page must show selected food trends."
);
assert(
  adminFeedbackPage.includes("Brand Selection Trends"),
  "Admin feedback page must show selected brand trends."
);
assert(
  adminFeedbackPage.includes("getSelectedFoodName"),
  "Admin feedback page must group selected-food analytics by food name."
);
assert(
  adminFeedbackPage.includes("getSelectedFoodBrand"),
  "Admin feedback page must group selected-food analytics by brand."
);
assert(
  adminFeedbackPage.includes("setTypeFilter(\"food_choice_selected\")"),
  "Admin feedback page must provide a shortcut to food-choice events."
);
assert(
  adminFeedbackPage.includes("function getLaunchSignalStatus"),
  "Admin feedback page must compute a launch signal from feedback analytics."
);
assert(
  adminFeedbackPage.includes('data-testid="chat-feedback-launch-triage"'),
  "Admin feedback page must expose the launch triage panel."
);
assert(
  adminFeedbackPage.includes("function getFeedbackSource") &&
    adminFeedbackPage.includes("printable_pet_report") &&
    adminFeedbackPage.includes("reportHelpfulRate") &&
    adminFeedbackPage.includes('data-testid="chat-feedback-report-quality"') &&
    adminFeedbackPage.includes("Open report feedback") &&
    adminFeedbackPage.includes("Printable report feedback") &&
    adminFeedbackPage.includes('setSearch("printable_pet_report")'),
  "Admin feedback page must expose printable report feedback quality separately."
);
assert(
  adminFeedbackPage.includes("highPriorityCleanupCount"),
  "Launch triage must include cleanup risk from repeated failed matches."
);
assert(
  adminFeedbackPage.includes("foodSelectionRate") &&
    adminFeedbackPage.includes("planSaveRate") &&
    adminFeedbackPage.includes("helpfulRate"),
  "Launch triage must include food selection, save, and helpfulness rates."
);
assert(
  adminFeedbackPage.includes("function getDropoffPriorityItems"),
  "Admin feedback page must compute customer drop-off priorities."
);
assert(
  adminFeedbackPage.includes("function getNextFeedbackFix"),
  "Admin feedback page must compute the next best feedback fix."
);
assert(
  adminFeedbackPage.includes("function getCustomerFrictionScorecards") &&
    adminFeedbackPage.includes("customerFrictionScorecards.map") &&
    adminFeedbackPage.includes('data-testid="chat-feedback-customer-friction-scorecard"') &&
    adminFeedbackPage.includes("Open top friction queue") &&
    adminFeedbackPage.includes("choice clarity") &&
    adminFeedbackPage.includes("save confidence") &&
    adminFeedbackPage.includes("food matching") &&
    adminFeedbackPage.includes("answer usefulness"),
  "Admin feedback page must translate drop-off analytics into a customer friction scorecard."
);
assert(
  adminFeedbackPage.includes('data-testid="chat-feedback-next-best-fix"'),
  "Admin feedback page must expose the next best feedback fix panel."
);
assert(
  adminFeedbackPage.includes("Open this queue") &&
    adminFeedbackPage.includes("nextFeedbackFix.action") &&
    adminFeedbackPage.includes("setTypeFilter(nextFeedbackFix.typeFilter)") &&
    adminFeedbackPage.includes("setRatingFilter(nextFeedbackFix.ratingFilter)"),
  "Next best feedback fix panel must link to the relevant feedback queue."
);
assert(
  adminFeedbackPage.includes('data-testid="chat-feedback-dropoff-priority"'),
  "Admin feedback page must expose the drop-off priority panel."
);
assert(
  adminFeedbackPage.includes("analysisWithoutFoodChoiceCount") &&
    adminFeedbackPage.includes("foodChoiceWithoutSaveCount"),
  "Drop-off priority must track analysis-without-choice and choice-without-save counts."
);
assert(
  adminFeedbackPage.includes("Analysis without food choice") &&
    adminFeedbackPage.includes("Food choice without save") &&
    adminFeedbackPage.includes("Failed food match") &&
    adminFeedbackPage.includes("Not helpful feedback"),
  "Drop-off priority must include the four core launch-risk groups."
);

console.log("Chat feedback analytics contract passed.");
