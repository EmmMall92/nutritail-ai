import { readFileSync } from "node:fs";

const dashboardSource = readFileSync("scripts/qa/build-live-readiness-dashboard.mjs", "utf8");
const postDeploySource = readFileSync("scripts/qa/run-post-deploy-readiness.mjs", "utf8");
const adminLiveQaSource = readFileSync("app/admin/foods/v2-live-qa/page.tsx", "utf8");

const checks = [
  {
    label: "reads deploy freshness timestamp from environment",
    source: dashboardSource,
    expected: "NUTRITAIL_QA_DEPLOYED_AT",
  },
  {
    label: "marks reports older than deploy as stale",
    source: dashboardSource,
    expected: "older than deploy",
  },
  {
    label: "exposes freshness notes in readiness evidence",
    source: dashboardSource,
    expected: "Freshness note",
  },
  {
    label: "documents deploy freshness gate in next live checks",
    source: dashboardSource,
    expected: "Set `NUTRITAIL_QA_DEPLOYED_AT`",
  },
  {
    label: "keeps default behavior optional when deploy timestamp is absent",
    source: dashboardSource,
    expected: "not configured",
  },
  {
    label: "post-deploy script can enable deploy freshness from CLI",
    source: postDeploySource,
    expected: "--deploy-freshness",
  },
  {
    label: "post-deploy script can accept exact deployed-at timestamp",
    source: postDeploySource,
    expected: "--deployed-at=",
  },
  {
    label: "post-deploy script forwards deployed timestamp to readiness dashboard",
    source: postDeploySource,
    expected: "NUTRITAIL_QA_DEPLOYED_AT: deployedAt",
  },
  {
    label: "post-deploy report records whether deploy freshness was used",
    source: postDeploySource,
    expected: "Deploy freshness gate used:",
  },
  {
    label: "post-deploy deploy freshness refreshes customer flow report",
    source: postDeploySource,
    expected: "qa:customer-chatbot-flow-links",
  },
  {
    label: "post-deploy deploy freshness refreshes chatbot dashboard report",
    source: postDeploySource,
    expected: "qa:chatbot-live-dashboard",
  },
  {
    label: "post-deploy report records freshness source refresh",
    source: postDeploySource,
    expected: "Freshness source reports refreshed:",
  },
  {
    label: "admin live QA summary parses deploy freshness gate",
    source: adminLiveQaSource,
    expected: "deployFreshnessGate",
  },
  {
    label: "admin live QA summary shows oldest source report",
    source: adminLiveQaSource,
    expected: "oldestSourceReport",
  },
  {
    label: "admin live QA summary shows next stale report",
    source: adminLiveQaSource,
    expected: "nextStaleReport",
  },
];

const failures = checks.filter((check) => !check.source.includes(check.expected));

if (failures.length > 0) {
  console.error("Live readiness deploy freshness QA failed:");
  for (const failure of failures) {
    console.error(`- ${failure.label}: missing ${JSON.stringify(failure.expected)}`);
  }
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      checked: checks.length,
      passed: checks.length,
      failed: 0,
    },
    null,
    2
  )
);
