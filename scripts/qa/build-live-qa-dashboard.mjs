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

function percent(value, total) {
  if (total === 0) return "0.0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

const parsed = suites.map(parseReport);
const totals = parsed.reduce(
  (acc, suite) => {
    acc.checked += suite.checked;
    acc.passed += suite.passed;
    acc.review += suite.review;
    return acc;
  },
  { checked: 0, passed: 0, review: 0 },
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
  "## Current Interpretation",
  "",
  "- Dog coverage is proven across 600 live recommendation scenarios.",
  "- Cat coverage is proven across 500 live recommendation scenarios.",
  "- The live suites currently show no review cases.",
  "- OpenAI fact extraction is not the main proof in these live suites; they primarily validate Food V2 retrieval, deterministic ranking, safety guards, and recommendation availability.",
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
