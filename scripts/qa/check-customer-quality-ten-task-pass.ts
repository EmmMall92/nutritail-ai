import { readFileSync } from "node:fs";
import { normalizeSafeRedirectPath } from "@/lib/auth/safeRedirect";
import {
  splitFoodV2Recommendations,
  type FoodV2RankingResult,
} from "@/lib/food-v2/recommendationRanking";
import {
  formatCustomerPetName,
  formatPetDisplayName,
  isTechnicalPetName,
} from "@/lib/petName";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function ranking(input: {
  key: string;
  name: string;
  score: number;
  preferred?: boolean;
  bucket?: "premium" | "value" | "hold";
}): FoodV2RankingResult {
  return {
    formula_key: input.key,
    display_name: input.name,
    brand: "QA Brand",
    total_score: input.score,
    fit_score: input.score,
    quality_score: 80,
    value_score: 60,
    confidence: "high",
    bucket: input.bucket ?? "premium",
    value_tier: "premium_candidate",
    reasons: [],
    cautions: [],
    signals: input.preferred
      ? [
          {
            type: "boost",
            code: "preferred_protein_visible_match",
            points: 8,
            message: "Matches the declared taste preference.",
          },
        ]
      : [],
  };
}

const chatbotPage = readFileSync("app/account/chatbot/page.tsx", "utf8");
const accountLayout = readFileSync("app/account/layout.tsx", "utf8");
const printRoute = readFileSync("app/api/print/pet-report/[id]/route.ts", "utf8");
const timelinePage = readFileSync("app/print/pet-timeline/[id]/page.tsx", "utf8");
const reportPage = readFileSync("app/print/pet-report/[id]/page.tsx", "utf8");
const authCallback = readFileSync("app/auth/callback/route.ts", "utf8");
const registerPage = readFileSync("app/register/page.tsx", "utf8");
const forgotPasswordPage = readFileSync("app/forgot-password/page.tsx", "utf8");

assert(
  formatPetDisplayName("την λένε κύρκη και είναι 6 ετών") === "Κύρκη",
  "Natural Greek name phrases must save only the pet name."
);
assert(
  formatPetDisplayName("my dog's name is luna and she is five") === "Luna",
  "Natural English name phrases must save only the pet name."
);
assert(
  isTechnicalPetName("QA Live Proof 202607031752") &&
    formatCustomerPetName("QA Live Proof 202607031752", "Κατοικίδιο") ===
      "Κατοικίδιο",
  "Technical QA names must never leak to customer surfaces."
);

assert(
  normalizeSafeRedirectPath("https://attacker.example") === "/account" &&
    normalizeSafeRedirectPath("//attacker.example") === "/account" &&
    normalizeSafeRedirectPath("/\\attacker.example") === "/account" &&
    normalizeSafeRedirectPath("/auth/callback") === "/account" &&
    normalizeSafeRedirectPath("/account/chatbot") === "/account/chatbot",
  "Auth redirects must stay inside NutriTail."
);

const preferredSplit = splitFoodV2Recommendations([
  ranking({ key: "qa|duck", name: "Adult Duck", score: 78 }),
  ranking({
    key: "qa|salmon",
    name: "Adult Salmon",
    score: 65,
    preferred: true,
  }),
  ranking({
    key: "qa|unsafe-salmon",
    name: "Unsafe Salmon",
    score: 90,
    preferred: true,
    bucket: "hold",
  }),
]);
const visibleKeys = [...preferredSplit.premium, ...preferredSplit.value].map(
  (item) => item.formula_key
);

assert(
  visibleKeys[0] === "qa|salmon",
  "A safe declared protein preference must lead among nutritionally comparable choices."
);
assert(
  !visibleKeys.includes("qa|unsafe-salmon"),
  "A preferred protein must never override a hard safety hold."
);

[
  "const cleanPet = sanitizePetIntake(pet)",
  "excludedIngredients: cleanPet.excludedIngredients",
  "preferredProteins: cleanPet.preferredProteins",
  "showJumpToLatest",
  "shouldStickToBottomRef",
  "archivedConversationMessages",
  "onScroll={handleMessagesScroll}",
].forEach((marker) =>
  assert(chatbotPage.includes(marker), `Missing chatbot quality marker: ${marker}`)
);
assert(
  !chatbotPage.includes("Array.from(container.children)"),
  "Auto-scroll must not observe and force-scroll every chat child."
);
assert(
  accountLayout.includes("grid-cols-4") &&
    !accountLayout.includes("overflow-x-auto px-4 py-3"),
  "Mobile account navigation must fit without a horizontal scrollbar."
);

[
  "supabase.auth.getUser()",
  '.eq("customer_id", customer.id)',
  '.from("pet_analyses")',
  '"Cache-Control": "private, no-store, max-age=0"',
].forEach((marker) =>
  assert(printRoute.includes(marker), `Missing private report marker: ${marker}`)
);
assert(
  !printRoute.includes("petAnalysisHistoryService"),
  "Printable reports must not mix authenticated and anonymous history clients."
);
assert(
  timelinePage.includes("setLoadError") &&
    timelinePage.includes("Δοκίμασε ξανά") &&
    timelinePage.includes("Σύνδεση"),
  "Timeline failures must provide retry and authentication recovery."
);

assert(
  authCallback.includes("exchangeCodeForSession") &&
    registerPage.includes("buildAuthCallbackPath") &&
    forgotPasswordPage.includes("buildAuthCallbackPath"),
  "Confirmation and recovery emails must return through the server callback."
);

[
  'data-testid="report-executive-summary"',
  'data-testid="report-plan-decision-guide"',
  'data-testid="report-decision-summary"',
  'data-testid="report-food-reasoning-summary"',
  'data-testid="report-tomorrow-feeding-plan"',
].forEach((marker) =>
  assert(reportPage.includes(marker), `Missing report section: ${marker}`)
);
assert(
  (reportPage.match(/hidden break-inside-avoid/g) ?? []).length >= 8,
  "Repeated report summaries should stay out of the online customer view."
);

console.log("Customer quality ten-task regression QA passed.");
