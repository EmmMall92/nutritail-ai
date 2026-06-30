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

console.log("Chat feedback analytics contract passed.");
