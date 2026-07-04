import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const accessPlan = read("lib/beta/accessPlan.ts");
const limitPolicy = read("lib/beta/limitPolicy.ts");
const launchDecisionPolicy = read("lib/beta/launchDecisionPolicy.ts");
const accountPage = read("app/account/page.tsx");
const packageJson = read("package.json");

for (const marker of [
  'accessPlan: "limited_beta_v1"',
  "petLimit: 3",
  "monthlyAnalysisLimit: 20",
]) {
  assert(accessPlan.includes(marker), `Beta access plan is missing marker: ${marker}`);
}

for (const marker of [
  "export type BetaLimitUsageInput",
  "export type BetaLimitStatus",
  'enforcementMode: "soft_warn_only"',
  "getBetaLimitStatus",
  "Πάνω από το beta όριο",
  "Κοντά στο beta όριο",
  "Άνετη beta χρήση",
  "Δεν μπλοκάρουμε ακόμη τη χρήση στην beta",
  "ανοίξουμε σταδιακά τα όρια",
]) {
  assert(limitPolicy.includes(marker), `Beta limit policy is missing marker: ${marker}`);
}

for (const marker of [
  "export type BetaLaunchDecisionInput",
  "export type BetaLaunchDecisionId",
  "getBetaLaunchDecision",
  "keep_soft_beta",
  "open_wider_beta_batch",
  "prepare_hard_limits",
  "prepare_paid_plan_work",
  "pricingApproved",
  "legalApproved",
  "supportFlowReady",
  "hardLimitCopyReady",
  "missing dog-owner beta proof candidate",
  "missing cat-owner beta proof candidate",
  "missing returning saved-pet beta proof candidate",
]) {
  assert(
    launchDecisionPolicy.includes(marker),
    `Beta launch decision policy is missing marker: ${marker}`
  );
}

for (const marker of [
  'import { getBetaLimitStatus } from "@/lib/beta/limitPolicy";',
  "type BetaUsageSnapshot",
  "petsRemaining",
  "monthlyAnalysesRemaining",
  "customerNextStep",
  "enforcementMode",
  "getBetaLimitStatus({",
  "betaUsage.customerNextStep",
  "Τα beta όρια είναι προσωρινά soft limits",
  "Απομένουν {betaUsage.petsRemaining}",
  "Απομένουν {betaUsage.monthlyAnalysesRemaining}",
  'data-testid="account-beta-usage"',
]) {
  assert(accountPage.includes(marker), `Account page beta usage is missing marker: ${marker}`);
}

const adminActivityPage = read("app/admin/activity/page.tsx");

for (const marker of [
  'import { getBetaLaunchDecision } from "@/lib/beta/launchDecisionPolicy";',
  "betaBusinessDecisionChecklist",
  "betaLaunchDecision",
  'data-testid="admin-beta-business-decision-checklist"',
  'data-testid="admin-beta-business-decision"',
  'data-testid="admin-beta-launch-decision-policy"',
  'data-testid="admin-beta-launch-decision-id"',
  'data-testid="admin-beta-launch-decision-blockers"',
  "Business decision guard",
  "Current launch decision policy",
  "Keep beta limits soft until customer proof",
  "Open a wider beta batch",
  "Turn on hard limits",
  "Start paid-plan work",
  "Pricing, cancellation, legal copy, support flow, and plan-limit enforcement",
]) {
  assert(
    adminActivityPage.includes(marker),
    `Admin beta business readiness is missing marker: ${marker}`
  );
}

assert(
  packageJson.includes('"qa:beta-limit-policy-contract"'),
  "package.json must expose qa:beta-limit-policy-contract."
);

assert(
  packageJson.includes(
    "qa:beta-waitlist-contract && npm run qa:beta-limit-policy-contract"
  ),
  "CI readiness must run beta limit policy after beta waitlist contract."
);

console.log("Beta limit policy contract passed.");
