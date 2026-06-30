import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const normalizeLineEndings = (value) => value.replace(/\r\n/g, "\n");

const packageJson = read("package.json");
const readme = normalizeLineEndings(read("README.md"));
const prTemplate = read(".github/pull_request_template.md");

const checks = [
  {
    label: "package check includes CI readiness",
    source: packageJson,
    expected: "npm run build && npm run qa:ci-readiness",
  },
  {
    label: "README documents full local gate",
    source: readme,
    expected: "npm run check",
  },
  {
    label: "README documents fast chatbot golden signoff",
    source: readme,
    expected: "npm.cmd run qa:chatbot-golden-suite:fast",
  },
  {
    label: "README explains post-deploy skipped checks",
    source: readme,
    expected: "Command rows can be `PASS`, `SKIP`, or `REVIEW`",
  },
  {
    label: "README explains why fast golden suite is not default check",
    source: readme,
    expected: "kept\nout of the default `npm run check` loop",
  },
  {
    label: "PR template requires local gate",
    source: prTemplate,
    expected: "`npm run check`",
  },
  {
    label: "PR template requires chatbot golden suite for recommendation changes",
    source: prTemplate,
    expected: "`npm.cmd run qa:chatbot-golden-suite:fast`",
  },
  {
    label: "PR template blocks back-office recommendation wording",
    source: prTemplate,
    expected: "scores, review status, source tiers, or missing-field internals",
  },
  {
    label: "PR template keeps food card action flow visible",
    source: prTemplate,
    expected: "food cards still give a clear next action",
  },
  {
    label: "PR template includes post-deploy chatbot refresh",
    source: prTemplate,
    expected: "`npm.cmd run qa:post-deploy-readiness:refresh-chatbot`",
  },
];

const failures = checks.filter((check) => !check.source.includes(check.expected));

if (failures.length > 0) {
  console.error("PR quality policy QA failed:");
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
