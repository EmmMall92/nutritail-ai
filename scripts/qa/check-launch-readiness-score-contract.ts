import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const doc = read("docs/launch-readiness-score.md");
const readme = read("README.md");
const packageJson = read("package.json");
const dashboard = read("scripts/qa/build-live-readiness-dashboard.mjs");
const postDeploy = read("scripts/qa/run-post-deploy-readiness.mjs");

const docMarkers = [
  "95/100 is the beta-launch target",
  "90% core evidence",
  "10% advisory evidence",
  "Why The Percentage May Not Move",
  "What Moves 94 Toward 95",
  "Avoid raising the percentage just because a PR merged",
  "reports/live_readiness_dashboard.md",
];

for (const marker of docMarkers) {
  assert(doc.includes(marker), `Launch readiness score doc is missing: ${marker}`);
}

assert(
  dashboard.includes("const configuredMinReadinessScore") &&
    dashboard.includes("?? 95") &&
    dashboard.includes("coreReadinessRatio * 0.9 + advisoryReadinessRatio * 0.1"),
  "Live readiness dashboard must keep the documented 95 target and 90/10 scoring model."
);

assert(
  postDeploy.includes("Live readiness score:") &&
    postDeploy.includes("Core evidence score:") &&
    postDeploy.includes("Advisory evidence score:"),
  "Post-deploy report must expose score, core evidence, and advisory evidence."
);

assert(
  packageJson.includes('"qa:launch-readiness-score-contract"'),
  "package.json must expose qa:launch-readiness-score-contract."
);

assert(
  packageJson.includes("qa:launch-readiness-score-contract && npm run qa:pr-quality-policy"),
  "CI readiness must run launch readiness score contract before PR quality policy."
);

assert(
  readme.includes("docs/launch-readiness-score.md") &&
    readme.includes("Do not raise") &&
    readme.includes("fresh QA evidence"),
  "README must point readers to the launch readiness score playbook."
);

console.log("Launch readiness score contract passed.");
