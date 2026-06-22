import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const fixturePath =
  process.env.NUTRITAIL_QA_CAT_FIXTURE_PATH ??
  "data/evals/chatbot-extra-cases-cat-001-500.json";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ?? "reports/cat_case_fixture_integrity.md";

const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const cases = Array.isArray(fixture.cases) ? fixture.cases : [];
const warnings = [];

const mojibakePattern =
  /(?:Ξ[£“”¥‘’ ¬µ³½ΌΉΆΎΏΊΈ®±»΄΅ΪΫΰ-ώ]|Ο[„€ƒ‡‰…‰†]|β‚¬|�)/u;

if (cases.length !== 500) {
  warnings.push(`Expected 500 cat cases, found ${cases.length}.`);
}

cases.forEach((testCase, index) => {
  const expectedId = `cat-${String(index + 1).padStart(3, "0")}`;

  if (testCase.id !== expectedId) {
    warnings.push(`Expected ${expectedId}, found ${testCase.id ?? "missing id"}.`);
  }

  if (testCase.species !== "cat") {
    warnings.push(`${expectedId} species must be cat.`);
  }

  if (typeof testCase.prompt !== "string" || testCase.prompt.trim().length < 8) {
    warnings.push(`${expectedId} prompt is missing or too short.`);
  } else if (mojibakePattern.test(testCase.prompt)) {
    warnings.push(`${expectedId} prompt appears to contain mojibake: ${testCase.prompt}`);
  }

  if (!Array.isArray(testCase.expectedSignals) || testCase.expectedSignals.length === 0) {
    warnings.push(`${expectedId} expectedSignals must be a non-empty array.`);
  }

  if (!["normal", "caution", "urgent"].includes(testCase.expectedSafetyLevel)) {
    warnings.push(`${expectedId} expectedSafetyLevel is invalid.`);
  }
});

const result = warnings.length === 0 ? "PASS" : "REVIEW";
const report = `# Cat Case Fixture Integrity QA

Generated: ${new Date().toISOString()}
Fixture: \`${fixturePath}\`
Result: ${result}

## Summary

- Cases checked: ${cases.length}
- Expected cases: 500
- Issues: ${warnings.length}

## Checks

- Sequential IDs from \`cat-001\` to \`cat-500\`
- Species is \`cat\`
- Prompt text is present
- Prompt text does not contain common Greek mojibake markers
- Expected signals exist
- Safety level is one of \`normal\`, \`caution\`, \`urgent\`

## Issues

${warnings.length === 0 ? "- None" : warnings.map((warning) => `- ${warning}`).join("\n")}
`;

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(reportPath, report);

if (warnings.length > 0) {
  console.error(report);
  process.exit(1);
}

console.log(`Cat case fixture integrity passed. Wrote ${reportPath}`);
