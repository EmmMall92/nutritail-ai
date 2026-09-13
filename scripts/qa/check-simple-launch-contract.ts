import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const features = read("lib/launch/features.ts");
const header = read("components/PublicHeader.tsx");
const footer = read("components/PublicFooter.tsx");
const betaPage = read("app/beta/page.tsx");
const plansPage = read("app/plans/page.tsx");
const storeRanking = read("app/store-ranking/page.tsx");
const chatbot = read("app/account/chatbot/page.tsx");
const availabilityApi = read("app/api/account/foods/availability/route.ts");
const referralApi = read("app/api/account/retail-partner-referrals/route.ts");
const foodPhotoApi = read("app/api/account/chatbot/analyze-food-photo/route.ts");
const betaWaitlistApi = read("app/api/beta/waitlist/route.ts");
const envExample = read(".env.example");

for (const flag of [
  "NEXT_PUBLIC_ENABLE_BETA_WAITLIST",
  "NEXT_PUBLIC_ENABLE_PAID_PLANS",
  "NEXT_PUBLIC_ENABLE_PROFESSIONAL_SIGNUP",
  "NEXT_PUBLIC_ENABLE_FOOD_PHOTO_ANALYSIS",
  "NEXT_PUBLIC_ENABLE_PARTNER_STORES",
]) {
  assert(features.includes(`process.env.${flag}`), `Missing launch flag: ${flag}`);
  assert(envExample.includes(`${flag}=false`), `Missing safe default for: ${flag}`);
}

assert(
  header.includes("launchFeatures.paidPlans") &&
    footer.includes("launchFeatures.partnerStores"),
  "Commercial public navigation must be feature-gated."
);
assert(
  betaPage.includes('redirect("/register")') &&
    plansPage.includes("launchFeatures.paidPlans") &&
    betaWaitlistApi.includes("if (!launchFeatures.betaWaitlist)"),
  "Beta waitlist and future plans must be feature-gated."
);
assert(
  storeRanking.includes("notFound()") &&
    chatbot.includes("launchFeatures.partnerStores"),
  "Partner pages and chatbot purchase options must be feature-gated."
);
assert(
  chatbot.includes("launchFeatures.foodPhotoAnalysis") &&
    foodPhotoApi.includes("if (!launchFeatures.foodPhotoAnalysis)"),
  "Optional photo analysis must stay off in the simple launch."
);

for (const route of [availabilityApi, referralApi]) {
  assert(
    route.includes("if (!launchFeatures.partnerStores)") &&
      route.includes('error: "Not found."') &&
      route.includes("requireAccountApiUser()"),
    "Disabled partner APIs must fail closed and require an account when enabled."
  );
}

console.log("Simple launch contract passed.");
