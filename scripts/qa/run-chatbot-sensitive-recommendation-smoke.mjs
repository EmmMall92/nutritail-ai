import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const command = process.platform === "win32" ? "npm.cmd" : "npm";
const reportPath =
  process.env.NUTRITAIL_QA_SENSITIVE_RECOMMENDATION_REPORT_PATH ??
  "reports/chatbot_sensitive_recommendation_smoke.md";

const checks = [
  {
    name: "Cat ranking balance",
    args: ["run", "qa:cat-v2-ranking-balance"],
    covers: "kitten growth, sterilised cat, renal cat, senior cat, and urinary/renal mismatch guards",
  },
  {
    name: "Senior visible ranking",
    args: ["run", "qa:food-v2-senior-visible-ranking"],
    covers: "customer-visible senior positioning",
  },
  {
    name: "Food preference and puppy ranking",
    args: ["run", "qa:food-v2-preference-ranking"],
    covers:
      "taste avoidances, preferred proteins, weight control, large-dog size fit, and large-breed puppy guards",
  },
  {
    name: "Food V2 launch edge accuracy",
    args: ["run", "qa:food-v2-launch-edge-accuracy"],
    covers:
      "giant dog size rejection, large-breed puppy priority, allergy exclusions, renal-vs-urinary cat logic, and urinary subtype mismatch guards",
  },
  {
    name: "Food V2 ranking scenarios",
    args: ["run", "audit:food-v2-ranking-scenarios"],
    covers: "condition-specific live Food V2 recommendation scenarios",
  },
  {
    name: "Dog live smoke",
    args: ["run", "qa:dog-chatbot-live-smoke"],
    covers: "live dog recommendation endpoint across growth, allergy, urinary, renal, senior, and rescue cases",
  },
  {
    name: "Cat live safety",
    args: ["run", "qa:cat-chatbot-live-safety"],
    covers: "live cat emergency, urinary, renal, kitten, allergy, senior, and digestion cases",
  },
];

const startedAt = new Date();
const results = [];

function writeReport(status) {
  mkdirSync(path.dirname(reportPath), { recursive: true });
  const checked = results.length;
  const passed = results.filter((result) => result.status === "pass").length;
  const review = results.filter((result) => result.status !== "pass").length;
  const lines = [
    "# Chatbot Sensitive Recommendation Smoke QA",
    "",
    `Run date: ${startedAt.toISOString()}`,
    `Finished: ${new Date().toISOString()}`,
    `- Result: ${status}`,
    "",
    "This focused smoke suite protects the recommendation cases most likely to harm customer trust if they regress.",
    "",
    `- Checks: ${checked}`,
    `- Passed: ${passed}`,
    `- Needs review: ${review}`,
    "",
    "| Suite | Status | Covers |",
    "| --- | --- | --- |",
    ...results.map((result) => `| ${result.name} | ${result.status} | ${result.covers} |`),
    "",
  ];

  writeFileSync(reportPath, `${lines.join("\n")}\n`);
}

for (const check of checks) {
  console.log(`\n=== ${check.name} ===`);
  const result =
    process.platform === "win32"
      ? spawnSync(`${command} ${check.args.join(" ")}`, {
          cwd: process.cwd(),
          env: process.env,
          shell: true,
          stdio: "inherit",
        })
      : spawnSync(command, check.args, {
          cwd: process.cwd(),
          env: process.env,
          stdio: "inherit",
        });

  results.push({
    name: check.name,
    covers: check.covers,
    status: result.status === 0 ? "pass" : "fail",
  });

  if (result.status !== 0) {
    writeReport("REVIEW");
    console.error(`\n${check.name} failed.`);
    console.error(JSON.stringify({ startedAt, finishedAt: new Date(), results }, null, 2));
    process.exit(result.status ?? 1);
  }
}

writeReport("PASS");
console.log(
  JSON.stringify(
    {
      startedAt,
      finishedAt: new Date(),
      checked: results.length,
      passed: results.filter((result) => result.status === "pass").length,
      review: results.filter((result) => result.status !== "pass").length,
      results,
    },
    null,
    2
  )
);
