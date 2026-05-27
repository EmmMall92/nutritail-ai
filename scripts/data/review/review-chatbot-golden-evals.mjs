import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  cases: "data/evals/chatbot-golden-cases.json",
  report: "reports/chatbot_golden_eval_summary.md",
};

const requiredFields = [
  "id",
  "prompt",
  "locale",
  "expected_intent",
  "safety_level",
  "must_include",
  "must_not_include",
  "notes",
];

const requiredIntentCoverage = [
  "urgent_safety_escalation",
  "food_compare",
  "weight_management",
  "suspected_allergy",
  "nutrition_myth",
];

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function collectIssues(cases) {
  const issues = [];
  const ids = new Set();

  cases.forEach((item, index) => {
    for (const field of requiredFields) {
      if (!hasValue(item[field])) {
        issues.push(`case ${index + 1}: missing ${field}`);
      }
    }

    if (ids.has(item.id)) {
      issues.push(`case ${index + 1}: duplicate id ${item.id}`);
    }

    ids.add(item.id);

    if (!["normal", "caution", "urgent"].includes(item.safety_level)) {
      issues.push(`case ${item.id}: invalid safety_level ${item.safety_level}`);
    }

    if (!Array.isArray(item.must_include)) {
      issues.push(`case ${item.id}: must_include must be an array`);
    }

    if (!Array.isArray(item.must_not_include)) {
      issues.push(`case ${item.id}: must_not_include must be an array`);
    }
  });

  const coveredIntents = new Set(cases.map((item) => item.expected_intent));

  for (const intent of requiredIntentCoverage) {
    if (!coveredIntents.has(intent)) {
      issues.push(`missing required intent coverage: ${intent}`);
    }
  }

  return issues;
}

function summarizeBy(cases, key) {
  return cases.reduce((counts, item) => {
    const value = String(item[key] ?? "unknown");
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function renderCounts(counts) {
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");
}

function renderReport(cases, issues) {
  const now = new Date().toISOString();
  const safetyCounts = summarizeBy(cases, "safety_level");
  const localeCounts = summarizeBy(cases, "locale");
  const intentCounts = summarizeBy(cases, "expected_intent");

  return `# Chatbot Golden Eval Summary

Generated: ${now}

## Result

${issues.length === 0 ? "PASS" : "FAIL"}

## Coverage

Total cases: ${cases.length}

### Safety levels

${renderCounts(safetyCounts)}

### Locales

${renderCounts(localeCounts)}

### Intents

${renderCounts(intentCounts)}

## Issues

${
  issues.length > 0
    ? issues.map((issue) => `- ${issue}`).join("\n")
    : "- No structural issues found."
}
`;
}

async function main() {
  const raw = await readFile(paths.cases, "utf8");
  const cases = JSON.parse(raw);

  if (!Array.isArray(cases)) {
    throw new Error(`${paths.cases} must contain an array.`);
  }

  const issues = collectIssues(cases);
  const report = renderReport(cases, issues);

  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.report, report);

  console.log(`Reviewed ${cases.length} chatbot golden eval cases.`);
  console.log(`Report written to ${paths.report}`);

  if (issues.length > 0) {
    console.error(`Found ${issues.length} issue(s).`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
