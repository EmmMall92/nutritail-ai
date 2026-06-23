import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const fixturePath =
  process.env.NUTRITAIL_QA_DOG_FIXTURE_PATH ??
  "data/evals/chatbot-extra-cases-dog-201-600.json";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ??
  "reports/dog_201_600_fixture_integrity.md";

const allowedGoals = new Set([
  "general",
  "premium",
  "value",
  "weight_control",
  "sensitive_digestion",
  "allergy",
  "urinary",
  "renal",
  "growth",
  "sterilised",
  "senior",
]);
const allowedSafety = new Set(["normal", "vet_referral", "emergency"]);
const mojibakePattern =
  /(?:\?{3,}|\u039e|\u0392\u00ae|\ufffd|\u039f[\u0080-\u00ff])/u;

const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const cases = Array.isArray(fixture) ? fixture : Array.isArray(fixture.cases) ? fixture.cases : [];
const warnings = [];

if (cases.length !== 400) {
  warnings.push(`Expected 400 dog cases, found ${cases.length}.`);
}

const seenIds = new Set();
for (const [index, testCase] of cases.entries()) {
  const expectedId = index + 201;
  const id = Number(testCase.id);

  if (id !== expectedId) {
    warnings.push(`Expected case ${expectedId}, found ${testCase.id ?? "missing id"}.`);
  }

  if (seenIds.has(id)) {
    warnings.push(`Duplicate case id: ${id}.`);
  }
  seenIds.add(id);

  if (typeof testCase.message !== "string" || testCase.message.trim().length < 8) {
    warnings.push(`Case ${expectedId} message is missing or too short.`);
  } else if (mojibakePattern.test(testCase.message)) {
    warnings.push(`Case ${expectedId} message appears to contain mojibake: ${testCase.message}`);
  }

  if (!allowedGoals.has(testCase.goal)) {
    warnings.push(`Case ${expectedId} has invalid goal: ${testCase.goal ?? "missing"}.`);
  }

  if (!allowedSafety.has(testCase.safety)) {
    warnings.push(`Case ${expectedId} has invalid safety: ${testCase.safety ?? "missing"}.`);
  }

  if (!testCase.expected || typeof testCase.expected !== "object") {
    warnings.push(`Case ${expectedId} is missing expected extraction fields.`);
  } else if (testCase.expected.species !== "dog") {
    warnings.push(`Case ${expectedId} expected.species must be dog.`);
  }

  if (!testCase.checks || typeof testCase.checks !== "object") {
    warnings.push(`Case ${expectedId} is missing checks.`);
  }
}

for (let id = 201; id <= 600; id += 1) {
  if (!seenIds.has(id)) warnings.push(`Missing case id: ${id}.`);
}

const result = warnings.length === 0 ? "PASS" : "REVIEW";
const report = `# Dog 201-600 Fixture Integrity QA

Generated: ${new Date().toISOString()}
Fixture: \`${fixturePath}\`
Result: ${result}

## Summary

- Cases checked: ${cases.length}
- Expected cases: 400
- Issues: ${warnings.length}

## Checks

- Sequential numeric IDs from \`201\` to \`600\`
- Prompt text is present
- Prompt text does not contain common Greek mojibake markers
- Goal is one of the supported live QA goals
- Safety level is one of \`normal\`, \`vet_referral\`, \`emergency\`
- Expected extraction object exists and uses \`species: dog\`
- Checks object exists

## Issues

${warnings.length === 0 ? "- None" : warnings.map((warning) => `- ${warning}`).join("\n")}
`;

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(reportPath, report);

if (warnings.length > 0) {
  console.error(report);
  process.exit(1);
}

console.log(`Dog 201-600 fixture integrity passed. Wrote ${reportPath}`);
