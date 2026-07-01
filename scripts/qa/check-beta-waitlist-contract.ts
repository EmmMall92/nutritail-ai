import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const page = read("app/beta/page.tsx");
const form = read("app/beta/BetaSignupForm.tsx");
const route = read("app/api/beta/waitlist/route.ts");
const sitemap = read("app/sitemap.ts");
const publicQa = read("scripts/qa/check-public-launch-live-routes.mjs");

assert(page.includes("BetaSignupForm"), "Beta page should render the signup form.");
assert(page.includes("canonical: \"/beta\""), "Beta page should define a canonical URL.");
assert(page.includes("Beta access plan"), "Beta page should explain the beta access plan.");
assert(page.includes("betaAccessPlan"), "Beta page should render beta access plan items.");
assert(page.includes("Beta plan limits"), "Beta page should explain beta plan limits.");
assert(page.includes("betaPlanLimits"), "Beta page should render beta plan limit items.");
assert(page.includes("20 αναλύσεις / μήνα"), "Beta page should disclose the monthly analysis soft limit.");
assert(form.includes("/api/beta/waitlist"), "Beta form should submit to the beta waitlist API.");
assert(form.includes("Θέλω beta πρόσβαση"), "Beta form should expose a clear customer CTA.");
assert(route.includes("beta_waitlist_signup"), "Beta API should log a beta waitlist signup action.");
assert(route.includes("admin_activity_logs"), "Beta API should store signups in admin activity logs.");
assert(route.includes("EMAIL_PATTERN"), "Beta API should validate email before logging.");
assert(form.includes("website"), "Beta form should include a honeypot field.");
assert(route.includes("website"), "Beta API should read the honeypot field.");
assert(route.includes("accessPlan: \"limited_beta_v1\""), "Beta API should tag beta access plan signups.");
assert(route.includes("petLimit: 3"), "Beta API should log the beta pet limit.");
assert(route.includes("monthlyAnalysisLimit: 20"), "Beta API should log the monthly analysis limit.");
assert(sitemap.includes("path: \"/beta\""), "Sitemap should include the beta page.");
assert(publicQa.includes("path: \"/beta\""), "Public launch QA should check the beta page.");

console.log("Beta waitlist contract passed.");
