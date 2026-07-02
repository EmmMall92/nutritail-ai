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
