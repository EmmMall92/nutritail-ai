import { readFileSync } from "node:fs";

const source = readFileSync("scripts/qa/build-live-readiness-dashboard.mjs", "utf8");

const checks = [
  {
    label: "reads deploy freshness timestamp from environment",
    expected: "NUTRITAIL_QA_DEPLOYED_AT",
  },
  {
    label: "marks reports older than deploy as stale",
    expected: "older than deploy",
  },
  {
    label: "exposes freshness notes in readiness evidence",
    expected: "Freshness note",
  },
  {
    label: "documents deploy freshness gate in next live checks",
    expected: "Set `NUTRITAIL_QA_DEPLOYED_AT`",
  },
  {
    label: "keeps default behavior optional when deploy timestamp is absent",
    expected: "not configured",
  },
];

const failures = checks.filter((check) => !source.includes(check.expected));

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
