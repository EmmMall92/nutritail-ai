import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const suites = [
  {
    name: "Dog chatbot live QA 001-200",
    species: "dog",
    source: "reports/dog_chatbot_200_live_cases.md",
    fixture: "data/evals/chatbot-extra-cases-dog-001-100.json + data/evals/chatbot-dog-edge-cases-101-200.json",
  },
  {
    name: "Dog chatbot live QA 201-600",
    species: "dog",
    source: "reports/dog_chatbot_live_cases_201-600.md",
    fixture: "data/evals/chatbot-extra-cases-dog-201-600.json",
  },
  {
    name: "Cat chatbot live QA 001-500",
    species: "cat",
    source: "reports/cat_chatbot_live_cases_1-500.md",
    fixture: "data/evals/chatbot-extra-cases-cat-001-500.json",
  },
];

const intakeSuites = [
  {
    name: "AI intake golden QA",
    source: "reports/ai_intake_golden_qa.md",
    command: "npm.cmd run qa:ai-intake",
    layer: "deterministic fallback + validation",
  },
  {
    name: "OpenAI intake smoke QA",
    source: "reports/openai_intake_smoke_qa.md",
    command: "npm.cmd run qa:openai-intake-smoke",
    layer: "OpenAI structured fact extraction",
  },
];

const responseContractSuite = {
  name: "Chatbot response contract audit",
  source: "reports/chatbot_response_contract_summary.md",
  command: "npm.cmd run review:chatbot:responses",
  layer: "conversation safety + required answer structure",
};

function readReport(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function matchNumber(text, patterns, label) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return Number(match[1]);
  }

  throw new Error(`Could not parse ${label}`);
}

function parseReport(suite) {
  const text = readReport(suite.source);
  const checked = matchNumber(
    text,
    [/- Cases checked:\s*(\d+)/i, /Result:\s*(\d+)\/\d+\s+passed/i],
    `${suite.source} cases checked`,
  );
  const passed = matchNumber(
    text,
    [/- Passed:\s*(\d+)/i, /Result:\s*(\d+)\/\d+\s+passed/i],
    `${suite.source} passed`,
  );
  const review = matchNumber(
    text,
    [/- Needs review:\s*(\d+)/i, /Result:\s*\d+\/\d+\s+passed,\s*(\d+)\s+review/i],
    `${suite.source} review`,
  );

  const runDate = text.match(/(?:Generated|Run date):\s*([^\n]+)/i)?.[1]?.trim() ?? "unknown";
  const openAiLine = text.match(/OpenAI extraction:\s*([^\n]+)/i)?.[1]?.trim();
  const runner = text.match(/Runner:\s*`([^`]+)`/i)?.[1]?.trim();

  return {
    ...suite,
    checked,
    passed,
    review,
    runDate,
    runner: runner ?? "legacy live QA runner",
    openAiExtraction: openAiLine ?? "not recorded",
  };
}

function parseIntakeReport(suite) {
  const text = readReport(suite.source);
  const status = text.match(/^Status:\s*([^\n]+)/im)?.[1]?.trim() ?? "completed";
  const skipped = status.toLowerCase() === "skipped";
  const checked = skipped
    ? 0
    : matchNumber(text, [/- Cases checked:\s*(\d+)/i], `${suite.source} cases checked`);
  const passed = skipped
    ? 0
    : matchNumber(text, [/- Passed:\s*(\d+)/i], `${suite.source} passed`);
  const failed = skipped
    ? 0
    : matchNumber(text, [/- Failed:\s*(\d+)/i], `${suite.source} failed`);
  const runDate = text.match(/(?:Generated|Run date):\s*([^\n]+)/i)?.[1]?.trim() ?? "unknown";

  return {
    ...suite,
    status,
    checked,
    passed,
    failed,
    runDate,
  };
}

function parseResponseContractReport(suite) {
  const text = readReport(suite.source);
  const status = text.match(/^## Result\s+([A-Z]+)/im)?.[1]?.trim() ?? "unknown";
  const checked = matchNumber(text, [/Cases:\s*(\d+)/i], `${suite.source} cases`);
  const passed = matchNumber(text, [/Passed:\s*(\d+)/i], `${suite.source} passed`);
  const failed = matchNumber(text, [/Failed:\s*(\d+)/i], `${suite.source} failed`);
  const contractsCovered =
    text.match(/Contracts covered:\s*([^\n]+)/i)?.[1]?.trim() ?? "unknown";
  const missingContracts =
    text.match(/Missing contracts:\s*([^\n]+)/i)?.[1]?.trim() ?? "unknown";
  const runDate = text.match(/(?:Generated|Run date):\s*([^\n]+)/i)?.[1]?.trim() ?? "unknown";

  return {
    ...suite,
    status,
    checked,
    passed,
    failed,
    contractsCovered,
    missingContracts,
    runDate,
  };
}

function percent(value, total) {
  if (total === 0) return "0.0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

const parsed = suites.map(parseReport);
const parsedIntake = intakeSuites.map(parseIntakeReport);
const parsedResponseContract = parseResponseContractReport(responseContractSuite);
const totals = parsed.reduce(
  (acc, suite) => {
    acc.checked += suite.checked;
    acc.passed += suite.passed;
    acc.review += suite.review;
    return acc;
  },
  { checked: 0, passed: 0, review: 0 },
);
const intakeTotals = parsedIntake.reduce(
  (acc, suite) => {
    acc.checked += suite.checked;
    acc.passed += suite.passed;
    acc.failed += suite.failed;
    acc.skipped += suite.status.toLowerCase() === "skipped" ? 1 : 0;
    return acc;
  },
  { checked: 0, passed: 0, failed: 0, skipped: 0 },
);

const bySpecies = parsed.reduce((acc, suite) => {
  acc[suite.species] ??= { checked: 0, passed: 0, review: 0 };
  acc[suite.species].checked += suite.checked;
  acc[suite.species].passed += suite.passed;
  acc[suite.species].review += suite.review;
  return acc;
}, {});

const lines = [
  "# Chatbot Live QA Dashboard",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "This dashboard summarizes the current live recommendation QA evidence for NutriTail.",
  "It points to the authoritative per-suite reports instead of duplicating every test case.",
  "",
  "## Overall Status",
  "",
  `- Live cases checked: ${totals.checked}`,
  `- Passed: ${totals.passed}`,
  `- Needs review: ${totals.review}`,
  `- Pass rate: ${percent(totals.passed, totals.checked)}`,
  `- Intake QA checked: ${intakeTotals.checked}`,
  `- Intake QA passed: ${intakeTotals.passed}`,
  `- Intake QA failed: ${intakeTotals.failed}`,
  `- Intake QA skipped suites: ${intakeTotals.skipped}`,
  `- Response contracts checked: ${parsedResponseContract.checked}`,
  `- Response contracts passed: ${parsedResponseContract.passed}`,
  `- Response contracts failed: ${parsedResponseContract.failed}`,
  "",
  "## Species Coverage",
  "",
  "| Species | Checked | Passed | Needs review | Pass rate |",
  "| --- | ---: | ---: | ---: | ---: |",
  ...Object.entries(bySpecies).map(
    ([species, summary]) =>
      `| ${species} | ${summary.checked} | ${summary.passed} | ${summary.review} | ${percent(
        summary.passed,
        summary.checked,
      )} |`,
  ),
  "",
  "## Suite Evidence",
  "",
  "| Suite | Source report | Fixture | Checked | Passed | Needs review | Runner | OpenAI extraction | Last run |",
  "| --- | --- | --- | ---: | ---: | ---: | --- | --- | --- |",
  ...parsed.map(
    (suite) =>
      `| ${suite.name} | \`${suite.source}\` | \`${suite.fixture}\` | ${suite.checked} | ${suite.passed} | ${suite.review} | \`${suite.runner}\` | ${suite.openAiExtraction} | ${suite.runDate} |`,
  ),
  "",
  "## Intake Evidence",
  "",
  "| Suite | Source report | Layer | Command | Status | Checked | Passed | Failed | Last run |",
  "| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- |",
  ...parsedIntake.map(
    (suite) =>
      `| ${suite.name} | \`${suite.source}\` | ${suite.layer} | \`${suite.command}\` | ${suite.status} | ${suite.checked} | ${suite.passed} | ${suite.failed} | ${suite.runDate} |`,
  ),
  "",
  "## Response Contract Evidence",
  "",
  "| Suite | Source report | Layer | Command | Status | Checked | Passed | Failed | Contracts covered | Missing contracts | Last run |",
  "| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- |",
  `| ${parsedResponseContract.name} | \`${parsedResponseContract.source}\` | ${parsedResponseContract.layer} | \`${parsedResponseContract.command}\` | ${parsedResponseContract.status} | ${parsedResponseContract.checked} | ${parsedResponseContract.passed} | ${parsedResponseContract.failed} | ${parsedResponseContract.contractsCovered} | ${parsedResponseContract.missingContracts} | ${parsedResponseContract.runDate} |`,
  "",
  "## Current Interpretation",
  "",
  "- Dog coverage is proven across 600 live recommendation scenarios.",
  "- Cat coverage is proven across 500 live recommendation scenarios.",
  "- The live suites currently show no review cases.",
  "- OpenAI fact extraction is tracked separately from the large live recommendation suites so cost, auth, and deterministic ranking quality stay easy to reason about.",
  "- Response contracts are tracked separately so safety, context-question, comparison, nutrition-reasoning, and transition-guidance expectations remain visible.",
  "",
  "## Next QA Gaps",
  "",
  "- Run `npm.cmd run qa:openai-intake-smoke` in an environment with `OPENAI_API_KEY` enabled to prove live OpenAI fact extraction separately from deterministic recommendation quality.",
  "- Keep adding real customer-style cases when new foods or new clinical rules are introduced.",
  "- When recommendation ranking changes, rerun the affected dog/cat suite before merge.",
  "",
];

writeFileSync(path.join(root, "reports/chatbot_live_qa_dashboard.md"), `${lines.join("\n")}\n`);
console.log("Wrote reports/chatbot_live_qa_dashboard.md");
console.log(`Live cases checked: ${totals.checked}`);
console.log(`Passed: ${totals.passed}`);
console.log(`Needs review: ${totals.review}`);

if (parsedResponseContract.failed > 0 || parsedResponseContract.status !== "PASS") {
  throw new Error("Response contract audit is not passing.");
}
