import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const supportPage = read("app/support/page.tsx");
const homepage = read("app/page.tsx");
const betaPage = read("app/beta/page.tsx");
const plansPage = read("app/plans/page.tsx");
const sitemap = read("app/sitemap.ts");
const publicLiveRoutes = read("scripts/qa/check-public-launch-live-routes.mjs");
const packageJson = read("package.json");

for (const marker of [
  'title: `Support | ${brand.name}`',
  'canonical: "/support"',
  'data-testid="support-hero"',
  'data-testid="support-primary-email"',
  'data-testid="support-request-types"',
  'data-testid="support-request-type"',
  'data-testid="support-operating-flow"',
  'data-testid="support-vet-boundary"',
  "Account or beta access",
  "Nutrition analysis or report",
  "Food data or missing product",
  "Privacy or data request",
  "Support feedback becomes product improvement",
  "NutriTail can help organize nutrition information, but it does not",
  "cat straining or unable to urinate",
]) {
  assert(supportPage.includes(marker), `Support page is missing marker: ${marker}`);
}

assert(sitemap.includes('path: "/support"'), "Sitemap must include /support.");

assert(
  homepage.includes('href="/support"') && homepage.includes("Support"),
  "Homepage navigation must link to /support."
);

assert(
  betaPage.includes('href="/support"') && betaPage.includes("Support"),
  "Beta page navigation must link to /support."
);

assert(
  plansPage.includes('href="/support"') && plansPage.includes("Support"),
  "Plans page navigation must link to /support."
);

assert(
  publicLiveRoutes.includes('path: "/support"') &&
    publicLiveRoutes.includes("https://nutritail.ai/support"),
  "Public launch live route smoke must include /support and the sitemap URL."
);

assert(
  packageJson.includes('"qa:support-flow-contract"'),
  "package.json must expose qa:support-flow-contract."
);

assert(
  packageJson.includes(
    "qa:public-trust-copy && npm run qa:support-flow-contract && npm run qa:launch-recommendation-contract"
  ),
  "CI readiness must run support flow contract after public trust copy."
);

console.log("Support flow contract passed.");
