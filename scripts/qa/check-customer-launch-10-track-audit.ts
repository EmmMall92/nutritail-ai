import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const doc = read("docs/customer-launch-10-track-audit.md");
const liveQaPage = read("app/admin/foods/v2-live-qa/page.tsx");
const packageJson = read("package.json");

const tracks = [
  "Final chatbot experience",
  "Saved pet continuation",
  "Pet report page",
  "Food recommendation accuracy",
  "User account polish",
  "Email/auth polish",
  "Public trust pages",
  "Analytics/feedback loop",
  "Launch QA",
  "Business layer",
];

for (const track of tracks) {
  assert(doc.includes(`| ${track} |`), `10-track audit doc is missing ${track}.`);
}

const docMarkers = [
  "Customer Launch 10-Track Audit",
  "Customer UX readiness: 88%",
  "Recommendation engine beta confidence: 95% beta-candidate",
  "Overall SaaS launch progress: 90%",
  "Next honest unlock: real beta-user proof",
  "Dog 001-200, dog 201-600, and cat 001-500 QA banks pass",
  "Fresh July 4 proof: dog 001-200 passed 200/200 live with OpenAI extraction enabled and 0 review",
  "Progress Ladder",
  "Already passed. Do not keep reporting this as the current state.",
  "95%+ launch candidate",
  "Why The Percentage May Stay Flat",
  "Customer UX readiness is blocked by real beta-user proof",
  "Next Actions",
  ".qa-secrets/beta-user-proof.json",
  "npm.cmd run qa:beta-user-proof-contract",
  "Raise Customer UX readiness only if the proof reports PASS",
];

for (const marker of docMarkers) {
  assert(doc.includes(marker), `10-track audit doc is missing marker: ${marker}`);
}

const pageMarkers = [
  "type CustomerLaunchTrackAuditSummary",
  "function readCustomerLaunchTrackAuditSummary",
  "docs/customer-launch-10-track-audit.md",
  "const launchTrackAudit = readCustomerLaunchTrackAuditSummary()",
  'data-testid="customer-launch-10-track-audit"',
  "10-track launch audit",
  "Why the percentage should not move until the next proof is real",
  'data-testid="customer-launch-current-position"',
  "launchTrackAudit.customerUxReadiness",
  "launchTrackAudit.recommendationEngineConfidence",
  "launchTrackAudit.overallSaasLaunchProgress",
  "launchTrackAudit.nextHonestUnlock",
  "launchTrackAudit.tracks.map",
  "Current proof",
  "Next proof needed",
  'data-testid="customer-launch-flat-reasons"',
  'data-testid="customer-launch-next-actions"',
];

for (const marker of pageMarkers) {
  assert(liveQaPage.includes(marker), `Admin live QA page is missing marker: ${marker}`);
}

assert(
  packageJson.includes('"qa:customer-launch-10-track-audit"'),
  "package.json must expose qa:customer-launch-10-track-audit.",
);

assert(
  packageJson.includes("qa:customer-launch-10-track-audit && npm run qa:launch-readiness-score-contract"),
  "CI readiness must run the 10-track audit before launch readiness score.",
);

console.log("Customer launch 10-track audit contract passed.");
