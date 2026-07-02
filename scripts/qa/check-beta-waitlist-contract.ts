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
const accessPlan = read("lib/beta/accessPlan.ts");
const sitemap = read("app/sitemap.ts");
const publicQa = read("scripts/qa/check-public-launch-live-routes.mjs");
const accountPage = read("app/account/page.tsx");
const adminActivityPage = read("app/admin/activity/page.tsx");

assert(page.includes("BetaSignupForm"), "Beta page should render the signup form.");
assert(page.includes("canonical: \"/beta\""), "Beta page should define a canonical URL.");
assert(page.includes("Beta access plan"), "Beta page should explain the beta access plan.");
assert(page.includes("betaAccessPlan"), "Beta page should render beta access plan items.");
assert(page.includes("Beta plan limits"), "Beta page should explain beta plan limits.");
assert(page.includes("betaPlanLimits"), "Beta page should render beta plan limit items.");
assert(page.includes("betaPlainTerms"), "Beta page should render plain-language beta terms.");
assert(page.includes("betaLaunchSignals"), "Beta page should render launch quality signals.");
assert(
  page.includes('import { betaPlanLimits } from "@/lib/beta/accessPlan";'),
  "Beta page should render plan limits from the shared beta access plan config."
);
assert(
  accountPage.includes('import { betaPlanHighlights } from "@/lib/beta/accessPlan";') &&
    accountPage.includes('data-testid="account-beta-plan"'),
  "Account dashboard should render beta highlights from the shared beta access plan config."
);
assert(
  accessPlan.includes('accessPlan: "limited_beta_v1"') &&
    accessPlan.includes("accountLimit: 1") &&
    accessPlan.includes("petLimit: 3") &&
    accessPlan.includes("monthlyAnalysisLimit: 20"),
  "Shared beta access plan config should define the beta plan id and soft limits."
);
assert(
  accessPlan.includes("${betaAccessPlanConfig.monthlyAnalysisLimit} αναλύσεις / μήνα"),
  "Shared beta access plan config should disclose the monthly analysis soft limit."
);
assert(
  page.includes('data-testid="beta-commercial-clarity"'),
  "Beta page should expose the commercial clarity section."
);
assert(
  page.includes('data-testid="beta-launch-signals"'),
  "Beta page should expose the launch signals section."
);
assert(
  page.includes("Χωρίς πληρωμή στην beta") &&
    page.includes("δεν ζητά στοιχεία κάρτας") &&
    page.includes("δεν ενεργοποιεί συνδρομή"),
  "Beta page should clearly say beta has no payment, card, or subscription activation."
);
assert(
  page.includes("Τι παίρνεις τώρα") &&
    page.includes("report") &&
    page.includes("timeline") &&
    page.includes("progress check"),
  "Beta page should explain what customers get during beta."
);
assert(
  page.includes("Τι δεν είναι ακόμη τελικό") &&
    page.includes("βελτιώνονται συνεχώς"),
  "Beta page should explain that data and recommendations are still improving."
);
assert(
  page.includes("Πότε ανοίγει περισσότερο") &&
    page.includes("σταθερή ποιότητα"),
  "Beta page should explain what signals will allow broader launch."
);
assert(form.includes("/api/beta/waitlist"), "Beta form should submit to the beta waitlist API.");
assert(form.includes("Θέλω beta πρόσβαση"), "Beta form should expose a clear customer CTA.");
assert(route.includes("beta_waitlist_signup"), "Beta API should log a beta waitlist signup action.");
assert(route.includes("admin_activity_logs"), "Beta API should store signups in admin activity logs.");
assert(route.includes("EMAIL_PATTERN"), "Beta API should validate email before logging.");
assert(form.includes("website"), "Beta form should include a honeypot field.");
assert(route.includes("website"), "Beta API should read the honeypot field.");
assert(
  route.includes('import { betaAccessPlanMetadata } from "@/lib/beta/accessPlan";') &&
    route.includes("...betaAccessPlanMetadata()"),
  "Beta API should tag waitlist signups with the shared beta access plan metadata."
);
assert(
  adminActivityPage.includes('data-testid="admin-beta-waitlist-summary"') &&
    adminActivityPage.includes("beta_waitlist_signup") &&
    adminActivityPage.includes('data-testid="admin-beta-waitlist-activity"'),
  "Admin activity should expose a dedicated beta waitlist summary and readable signup details."
);
assert(
  adminActivityPage.includes('"accessPlan"') &&
    adminActivityPage.includes('"petLimit"') &&
    adminActivityPage.includes('"monthlyAnalysisLimit"'),
  "Admin activity should surface beta access plan metadata for waitlist signups."
);
assert(sitemap.includes("path: \"/beta\""), "Sitemap should include the beta page.");
assert(publicQa.includes("path: \"/beta\""), "Public launch QA should check the beta page.");

console.log("Beta waitlist contract passed.");
