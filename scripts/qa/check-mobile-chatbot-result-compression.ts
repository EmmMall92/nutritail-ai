import { readFileSync } from "node:fs";
import { localizeNutritionAdviceItem } from "@/lib/chatbot/nutritionAdvicePresentation";
import { generateIngredientInsights } from "@/lib/nutrition/ingredientInsights";
import { generateNutritionInsights } from "@/lib/nutrition/nutritionInsights";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const nutrition = generateNutritionInsights(
  {
    species: "dog",
    neutered: true,
    weightGoal: "loss",
    protein: 34,
    fat: 14,
    fiber: 6,
    calcium: 1.2,
    phosphorus: 0.9,
    kcalPer100g: 350,
    ingredients: "salmon, rice, chicory, fish oil",
  },
  "el"
);
const ingredients = generateIngredientInsights(
  "salmon, rice, chicory, fish oil",
  "el"
);
const digestiveAdvice = localizeNutritionAdviceItem(
  {
    title: "Digestive Support",
    description:
      "Digestive signs usually need a slow transition and monitoring.",
  },
  "el"
);
const greekCustomerCopy = [
  nutrition.summary,
  ...nutrition.positives,
  ...nutrition.cautions,
  ...ingredients.positives,
  ...ingredients.cautions,
  digestiveAdvice.title,
  digestiveAdvice.description,
].join("\n");

for (const leakedEnglish of [
  "This food appears",
  "High protein may",
  "Balanced fat level",
  "Fiber may help",
  "Moderate calorie density",
  "Digestive Support",
  "Digestive signs usually",
]) {
  assert(
    !greekCustomerCopy.includes(leakedEnglish),
    `Greek chatbot result leaked English customer copy: ${leakedEnglish}`
  );
}

assert(
  greekCustomerCopy.includes("Υποστήριξη πέψης"),
  "Digestive advice must have a customer-facing Greek title."
);
assert(
  greekCustomerCopy.includes("διατροφική εικόνα"),
  "Nutrition summary must be localized in Greek."
);

const chatbotSource = readFileSync("app/account/chatbot/page.tsx", "utf8");

for (const marker of [
  'presentation?: "standard" | "details"',
  'data-testid="chatbot-analysis-details"',
  'data-testid="mobile-chatbot-header"',
  "selectedRecommendedFoodName",
  "setSelectedRecommendedFoodName(choice.name)",
  "formatAnalysisDetails(",
  '"details"',
  "mobileFoodChoiceActions.length === 0",
  "!hasSelectableFoodRecommendations || hasSelectedRecommendedFood",
]) {
  assert(
    chatbotSource.includes(marker),
    `Mobile chatbot compression contract is missing: ${marker}`
  );
}

assert(
  !chatbotSource.includes(
    "const hasSelectedRecommendedFood = Boolean(analysisMetadata?.matchedFoodName)"
  ),
  "A current-food database match must not count as an explicit recommendation choice."
);
assert(
  chatbotSource.includes(
    'className="hidden rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm sm:block"'
  ),
  "Full recommendation cards must stay out of the constrained mobile viewport."
);

console.log(
  "Mobile chatbot result compression passed: Greek copy, progressive disclosure, compact mobile choices, and explicit food selection are protected."
);
