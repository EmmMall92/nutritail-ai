import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const plansPage = read("app/plans/page.tsx");
const sitemap = read("app/sitemap.ts");
const publicLiveRoutes = read("scripts/qa/check-public-launch-live-routes.mjs");
const packageJson = read("package.json");

for (const marker of [
  "export const metadata",
  'canonical: "/plans"',
  'data-testid="plans-hero"',
  'data-testid="plans-current-beta-limits"',
  'data-testid="plans-future-direction"',
  'data-testid="plans-payment-readiness"',
  "betaAccessPlanConfig.petLimit",
  "betaAccessPlanConfig.monthlyAnalysisLimit",
  "Δεν ζητάμε κάρτα",
  "δεν ενεργοποιούμε συνδρομή",
  "Beta",
  "Personal",
  "Pro",
  "Πριν τις πληρωμές",
  "πρώτα ποιότητα",
  "μετά πληρωμές",
]) {
  assert(plansPage.includes(marker), `Plans page is missing marker: ${marker}`);
}

assert(sitemap.includes('path: "/plans"'), "Sitemap must include /plans.");

assert(
  publicLiveRoutes.includes('path: "/plans"') &&
    publicLiveRoutes.includes("Plans page") &&
    publicLiveRoutes.includes("https://nutritail.ai/plans"),
  "Public launch live route smoke must include /plans and the sitemap URL."
);

assert(
  packageJson.includes('"qa:public-plans-page-contract"'),
  "package.json must expose qa:public-plans-page-contract."
);

assert(
  packageJson.includes(
    "qa:beta-limit-policy-contract && npm run qa:public-plans-page-contract"
  ),
  "CI readiness must run public plans contract after beta limit policy."
);

console.log("Public plans page contract passed.");
