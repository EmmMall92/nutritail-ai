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
const packageJson = read("package.json");

assert(
  feedbackRoute.includes("\"analysis_completed\""),
  "Feedback API must accept analysis_completed events."
);
assert(
  feedbackRoute.includes("\"plan_saved\""),
  "Feedback API must accept plan_saved events."
);
assert(
  chatbotPage.includes("eventType: \"analysis_completed\""),
  "Customer chatbot must log completed nutrition analyses."
);
assert(
  chatbotPage.includes("recommendationCount: analysisFoodChoices.length"),
  "Analysis completion analytics must include recommendation count."
);
assert(
  chatbotPage.includes("recommendedFoodBrands"),
  "Analysis completion analytics must include recommended food brands."
);
assert(
  chatbotPage.includes("eventType: \"plan_saved\""),
  "Customer chatbot must log saved nutrition plans."
);
assert(
  chatbotPage.includes("feedingGramsPerDay: analysisMetadata?.feedingGramsPerDay"),
  "Saved-plan analytics must include the portion estimate when available."
);
assert(
  adminFeedbackPage.includes("Analysis Funnel"),
  "Admin feedback page must show the analysis funnel."
);
assert(
  adminFeedbackPage.includes("setTypeFilter(\"analysis_completed\")"),
  "Admin feedback page must provide a shortcut to completed analyses."
);
assert(
  adminFeedbackPage.includes("setTypeFilter(\"plan_saved\")"),
  "Admin feedback page must provide a shortcut to saved plans."
);
assert(
  adminFeedbackPage.includes("Customer Drop-Off Priority"),
  "Admin feedback page must show the customer drop-off priority panel."
);
assert(
  adminFeedbackPage.includes("analysisWithoutFoodChoiceCount"),
  "Admin feedback page must track analyses that did not lead to a food choice."
);
assert(
  adminFeedbackPage.includes("foodChoiceWithoutSaveCount"),
  "Admin feedback page must track selected foods that did not lead to saved plans."
);
assert(
  packageJson.includes("\"qa:chatbot-funnel-analytics-contract\""),
  "package.json must expose the chatbot funnel analytics QA script."
);

console.log("Chatbot funnel analytics contract passed.");
