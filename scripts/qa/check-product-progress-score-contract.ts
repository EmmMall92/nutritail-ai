import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const doc = read("docs/product-progress-score.md");
const launchDoc = read("docs/launch-readiness-score.md");
const packageJson = read("package.json");
const liveQaPage = read("app/admin/foods/v2-live-qa/page.tsx");

const categoryMarkers = [
  "Final chatbot experience",
  "Saved pet continuation",
  "Pet report page",
  "Food recommendation accuracy",
  "User account polish",
  "Email/auth polish",
  "Public trust pages",
  "Analytics/feedback loop",
  "Launch QA",
  "Business layer",
];

for (const marker of categoryMarkers) {
  assert(doc.includes(marker), `Product progress rubric is missing category: ${marker}`);
}

const requiredMarkers = [
  "Customer product progress is currently **93-94%**",
  "Overall SaaS launch progress is currently **80-82%**",
  "business limits, beta access, subscription",
  "legal/trust readiness",
  "is the whole company/product ready to launch?",
  "The latest move from **92-93%** to **93-94%**",
  "authenticated",
  "OpenAI/chatbot intake-context fix",
  "saved/selected pet species context",
  "effective **199/200**",
  "same shared OpenAI prompt contract",
  "fallback merge",
  "Greek/English allergy, sensitivity, mixed",
  "The previous move from **91-92%** to **92-93%**",
  "metadata-only",
  "working Husky",
  "Food V2 ranking audit passes 38/38",
  "The previous move from **90-91%** to **91-92%**",
  "Weight goal is now preserved",
  "active weight-gain dog guard",
  "Food V2 launch-edge accuracy",
  "The previous move from **89-90%** to **90-91%**",
  "drop-off priorities for analyses without",
  "choice clarity, save confidence, food matching, and",
  "answer usefulness",
  "Do not raise this score because a pull request merged",
  "Automated live readiness",
  "customer-visible risk is reduced",
  "real mistake and the fix is locked by a test",
  "3 premium + 3 value choices",
  "progress check, no-progress advice, new food, flavour change, brand change, and timeline review",
  "authenticated live chatbot extract proof",
  "93-94%",
  "Beta access, plan limits, subscription/payment direction",
];

for (const marker of requiredMarkers) {
  assert(doc.includes(marker), `Product progress rubric is missing marker: ${marker}`);
}

const weights = [...doc.matchAll(/\| [^|\n]+ \| (\d+) \|/g)]
  .map((match) => Number(match[1]))
  .filter((value) => Number.isFinite(value));

const totalWeight = weights.reduce((sum, value) => sum + value, 0);

assert(weights.length >= 10, "Product progress rubric must include at least 10 weighted categories.");
assert(totalWeight === 100, `Product progress category weights must total 100, got ${totalWeight}.`);

assert(
  launchDoc.includes("docs/product-progress-score.md") &&
    launchDoc.includes("Customer Product Progress Score") &&
    launchDoc.includes("92-93% to 93-94%"),
  "Launch readiness score doc must point to the product progress score rubric."
);

assert(
  packageJson.includes('"qa:product-progress-score-contract"'),
  "package.json must expose qa:product-progress-score-contract."
);

assert(
  packageJson.includes(
    "qa:launch-readiness-score-contract && npm run qa:product-progress-score-contract && npm run qa:pr-quality-policy"
  ),
  "CI readiness must run product progress score contract after launch readiness score contract."
);

assert(
  liveQaPage.includes("function readCustomerProductProgressSummary") &&
    liveQaPage.includes("docs/product-progress-score.md"),
  "Admin live QA page must read the customer product progress rubric."
);

assert(
  liveQaPage.includes('data-testid="customer-product-progress-summary"') &&
    liveQaPage.includes("Customer product progress") &&
    liveQaPage.includes("Overall SaaS launch") &&
    liveQaPage.includes("productProgress.overallSaasEstimate") &&
    liveQaPage.includes("separate from automated"),
  "Admin live QA page must expose the customer product progress summary."
);

assert(
  liveQaPage.includes("Why it may not move every PR") &&
    liveQaPage.includes("Next moves toward") &&
    liveQaPage.includes("94-95%"),
  "Admin live QA page must explain why the score feels stuck and what moves it next."
);

console.log("Product progress score contract passed.");
