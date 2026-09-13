import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const plansPage = read("app/plans/page.tsx");
const publicHeader = read("components/PublicHeader.tsx");
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
  "Δωρεάν beta πρόσβαση",
  "Δεν ζητάμε κάρτα",
  "ενεργοποιούμε συνδρομή",
  "Beta",
  "Personal",
  "Professional",
  "Οι τελικές",
  "δυνατότητες και τιμές θα ανακοινωθούν",
]) {
  assert(plansPage.includes(marker), `Plans page is missing marker: ${marker}`);
}

for (const marker of ["admin-style", "soft limits", "launch checks", "Business direction"]) {
  assert(!plansPage.includes(marker), `Plans page contains internal-facing copy: ${marker}`);
}

assert(sitemap.includes('path: "/plans"'), "Sitemap must include /plans.");
assert(
  publicHeader.includes('href: "/plans"') && publicHeader.includes('label: "Πλάνα"'),
  "Shared public navigation must link to /plans."
);
assert(
  publicLiveRoutes.includes('path: "/plans"') &&
    publicLiveRoutes.includes("Plans page") &&
    publicLiveRoutes.includes("https://nutritail.ai/plans"),
  "Public launch smoke must include /plans."
);
assert(
  packageJson.includes('"qa:public-plans-page-contract"'),
  "package.json must expose qa:public-plans-page-contract."
);

console.log("Public plans page contract passed.");
