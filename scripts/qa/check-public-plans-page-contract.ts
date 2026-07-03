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
const homepage = read("app/page.tsx");
const betaPage = read("app/beta/page.tsx");
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
  'data-testid="plans-payment-readiness-checklist"',
  'data-testid="plans-payment-readiness-checklist-item"',
  "paymentReadinessChecklist",
  "Beta proof",
  "Τιμή και limits",
  "Ακύρωση και υποστήριξη",
  "Legal review",
  "πραγματικά beta sessions",
  "πολιτική ακύρωσης",
  "ενεργοποιηθούν συνδρομές",
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
  "Τα όρια είναι καθαρά και προσωρινά",
  "Πριν ενεργοποιηθούν πληρωμές",
  "πραγματικά σχόλια από χρήστες",
  "Πιο οργανωμένος κύκλος βελτίωσης",
  "έλεγχοι κυκλοφορίας",
]) {
  assert(plansPage.includes(marker), `Plans page is missing marker: ${marker}`);
}

const mojibakeMarkers = [
  "\u039f\u008d",
  "\u03b2\u20ac",
  "\u03bf\u038f\u00bd",
  "\ufffd",
];

for (const marker of mojibakeMarkers) {
  assert(
    !plansPage.includes(marker),
    `Plans page must not contain customer-visible mojibake marker: ${marker}`
  );
}

assert(
  !/[ΞΟ][\u0080-\u009f€ƒ„†‡‰‘’“”•–—™]/u.test(plansPage),
  "Plans page must not contain Greek mojibake control-character sequences."
);

for (const marker of [
  "saved reports",
  "Progress checks",
  "feedback loop",
  "admin-style",
  "Printable report",
  "soft limits",
  "paid plans",
  "πραγματικό testing",
  "launch checks",
]) {
  assert(
    !plansPage.includes(marker),
    `Plans page must keep business copy customer-friendly. Found: ${marker}`
  );
}

assert(sitemap.includes('path: "/plans"'), "Sitemap must include /plans.");

assert(
  homepage.includes('href="/plans"') && homepage.includes("Plans"),
  "Homepage navigation must link to /plans."
);

assert(
  betaPage.includes('href="/plans"') && betaPage.includes("Plans"),
  "Beta page navigation must link to /plans."
);

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
