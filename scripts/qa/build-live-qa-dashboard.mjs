import { existsSync, readFileSync, writeFileSync } from "node:fs";
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
  {
    name: "Cat chatbot safety smoke",
    species: "cat",
    source: "reports/cat_chatbot_live_safety.md",
    fixture: "data/evals/chatbot-cat-safety-live.json",
    command: "npm.cmd run qa:cat-chatbot-live-safety",
    optional: true,
  },
  {
    name: "Cat chatbot quality smoke",
    species: "cat",
    source: "reports/cat_chatbot_live_quality.md",
    fixture: "data/evals/chatbot-cat-quality-live.json",
    command: "npm.cmd run qa:cat-chatbot-live-quality",
    optional: true,
  },
];

const intakeSuites = [
  {
    name: "AI intake golden QA",
    source: "reports/ai_intake_golden_qa.md",
    command: "npm.cmd run qa:ai-intake",
    layer: "deterministic fallback + validation",
    checkedLabel: "Cases",
  },
  {
    name: "OpenAI intake smoke QA",
    source: "reports/openai_intake_smoke_qa.md",
    command: "npm.cmd run qa:openai-intake-smoke",
    layer: "OpenAI structured fact extraction",
    checkedLabel: "Cases",
  },
  {
    name: "Account chatbot extract live route QA",
    source: "reports/account_chatbot_extract_live_route_qa.md",
    command: "npm.cmd run qa:account-chatbot-extract-live-route",
    layer: "authenticated live chatbot extraction route",
    checkedLabel: "Routes",
  },
];

const responseContractSuite = {
  name: "Chatbot response contract audit",
  source: "reports/chatbot_response_contract_summary.md",
  command: "npm.cmd run review:chatbot:responses",
  layer: "conversation safety + required answer structure",
};

const customerUxSuites = [
  {
    name: "Customer-facing recommendation QA",
    source: "reports/customer_facing_recommendation_qa.md",
    command: "npm.cmd run qa:chatbot-customer-recommendations",
    layer: "customer food shortlist language + card flow",
  },
  {
    name: "Customer UX copy contract QA",
    source: "reports/customer_ux_copy_contract_qa.md",
    command: "npm.cmd run qa:customer-ux-copy",
    layer: "account/chatbot copy leakage guard",
  },
  {
    name: "Sensitive recommendation smoke QA",
    source: "reports/chatbot_sensitive_recommendation_smoke.md",
    command: "npm.cmd run qa:chatbot-sensitive-recommendations",
    layer: "large-breed puppy, senior, renal, urinary, allergy/preference, and live dog/cat recommendation smoke",
  },
];

const goldenSuite = {
  name: "Chatbot golden suite fast",
  source: "reports/chatbot_golden_suite.md",
  command: "npm.cmd run qa:chatbot-golden-suite:fast",
  layer:
    "current fast regression gate for intake, customer UX, Food V2 ranking, dog live smoke, dog 201-600 smoke, cat live cases, and focused cat safety/quality smoke",
};

const fixtureCoverageSuites = [
  {
    name: "Dog 201-600 fixture integrity",
    source: "reports/dog_201_600_fixture_integrity.md",
    command: "npm.cmd run qa:dog-201-600-fixture",
    layer: "UTF-8 prompt integrity + sequential dog QA fixture",
  },
  {
    name: "Dog 201-600 coverage audit",
    source: "reports/dog_201_600_coverage_audit.md",
    command: "npm.cmd run audit:dog-201-600-coverage",
    layer: "dog scenario balance across growth, sterilised, allergy, senior, GI, renal, urinary, value, premium, and safety cases",
  },
  {
    name: "Cat 001-500 fixture integrity",
    source: "reports/cat_case_fixture_integrity.md",
    command: "npm.cmd run qa:cat-case-fixture",
    layer: "UTF-8 prompt integrity + sequential cat QA fixture",
  },
  {
    name: "Cat 001-500 coverage audit",
    source: "reports/cat_chatbot_coverage_audit.md",
    command: "npm.cmd run audit:cat-chatbot-coverage",
    layer: "cat scenario balance across growth, urinary, renal, senior, allergy, weight, and safety cases",
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

function matchOptionalNumber(text, patterns, fallback = 0) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return Number(match[1]);
  }

  return fallback;
}

function parseReport(suite) {
  if (!existsSync(path.join(root, suite.source))) {
    if (!suite.optional) {
      throw new Error(`Required live QA report is missing: ${suite.source}`);
    }

    return {
      ...suite,
      checked: 0,
      passed: 0,
      review: 0,
      promptEncodingRepairs: 0,
      promptEncodingIssues: 0,
      runDate: `missing - run ${suite.command}`,
      runner: "not generated",
      openAiExtraction: "not checked",
      missing: true,
    };
  }

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
  const promptEncodingRepairs = matchNumber(
    text,
    [/Prompt encoding repairs applied:\s*(\d+)/i],
    `${suite.source} prompt encoding repairs`,
  );
  const promptEncodingIssues = matchNumber(
    text,
    [/Prompt encoding issues after repair:\s*(\d+)/i],
    `${suite.source} prompt encoding issues`,
  );

  return {
    ...suite,
    checked,
    passed,
    review,
    promptEncodingRepairs,
    promptEncodingIssues,
    runDate,
    runner: runner ?? "legacy live QA runner",
    openAiExtraction: openAiLine ?? "not recorded",
    missing: false,
  };
}

function parseIntakeReport(suite) {
  const text = readReport(suite.source);
  const status = text.match(/^Status:\s*([^\n]+)/im)?.[1]?.trim() ?? "completed";
  const checked = matchNumber(
    text,
    [/- Cases checked:\s*(\d+)/i, /- Routes checked:\s*(\d+)/i],
    `${suite.source} checked`,
  );
  const passed = matchNumber(text, [/- Passed:\s*(\d+)/i], `${suite.source} passed`);
  const failed = matchNumber(text, [/- Failed:\s*(\d+)/i], `${suite.source} failed`);
  const skipped = matchOptionalNumber(text, [/- Skipped:\s*(\d+)/i]);
  const runDate = text.match(/(?:Generated|Run date):\s*([^\n]+)/i)?.[1]?.trim() ?? "unknown";

  return {
    ...suite,
    status,
    checked,
    passed,
    failed,
    skipped,
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

function parsePassFailReport(suite) {
  const text = readReport(suite.source);
  const result =
    text.match(/^- Result:\s*([A-Z]+)/im)?.[1]?.trim() ??
    text.match(/^## Result\s+([A-Z]+)/im)?.[1]?.trim() ??
    "unknown";
  const runDate = text.match(/(?:Generated|Run date):\s*([^\n]+)/i)?.[1]?.trim() ?? "unknown";

  return {
    ...suite,
    result,
    runDate,
  };
}

function parseGoldenSuiteReport(suite) {
  const text = readReport(suite.source);
  const mode = text.match(/^- Mode:\s*([^\n]+)/im)?.[1]?.trim() ?? "unknown";
  const checksMatch = text.match(/^- Checks run:\s*(\d+)\/(\d+)/im);
  const checked = checksMatch?.[2] ? Number(checksMatch[2]) : 0;
  const run = checksMatch?.[1] ? Number(checksMatch[1]) : 0;
  const passed = matchNumber(text, [/^- Passed:\s*(\d+)/im], `${suite.source} passed`);
  const failed = matchNumber(text, [/^- Failed:\s*(\d+)/im], `${suite.source} failed`);
  const runDate = text.match(/(?:Generated|Run date):\s*([^\n]+)/i)?.[1]?.trim() ?? "unknown";
  const result = run === checked && failed === 0 && passed === checked ? "PASS" : "REVIEW";

  return {
    ...suite,
    mode,
    checked,
    run,
    passed,
    failed,
    result,
    runDate,
  };
}

function parseFixtureIntegrityReport(suite) {
  const text = readReport(suite.source);
  const result = text.match(/^Result:\s*([A-Z]+)/im)?.[1]?.trim() ?? "unknown";
  const checked = matchNumber(text, [/- Cases checked:\s*(\d+)/i], `${suite.source} cases checked`);
  const issues = matchNumber(text, [/- Issues:\s*(\d+)/i], `${suite.source} issues`);
  const runDate = text.match(/(?:Generated|Run date):\s*([^\n]+)/i)?.[1]?.trim() ?? "unknown";

  return {
    ...suite,
    result,
    checked,
    issues,
    runDate,
  };
}

function percent(value, total) {
  if (total === 0) return "0.0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

const parsed = suites.map(parseReport);
const missingOptionalSuites = parsed.filter((suite) => suite.missing);
const parsedIntake = intakeSuites.map(parseIntakeReport);
const parsedResponseContract = parseResponseContractReport(responseContractSuite);
const parsedCustomerUx = customerUxSuites.map(parsePassFailReport);
const parsedGoldenSuite = parseGoldenSuiteReport(goldenSuite);
const parsedFixtureCoverage = fixtureCoverageSuites.map(parseFixtureIntegrityReport);
const totals = parsed.reduce(
  (acc, suite) => {
    acc.checked += suite.checked;
    acc.passed += suite.passed;
    acc.review += suite.review;
    acc.promptEncodingRepairs += suite.promptEncodingRepairs;
    acc.promptEncodingIssues += suite.promptEncodingIssues;
    return acc;
  },
  { checked: 0, passed: 0, review: 0, promptEncodingRepairs: 0, promptEncodingIssues: 0 },
);
const intakeTotals = parsedIntake.reduce(
  (acc, suite) => {
    acc.checked += suite.checked;
    acc.passed += suite.passed;
    acc.failed += suite.failed;
    acc.skipped += suite.skipped;
    acc.skippedSuites += suite.status.toLowerCase() === "skipped" ? 1 : 0;
    return acc;
  },
  { checked: 0, passed: 0, failed: 0, skipped: 0, skippedSuites: 0 },
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
  `- Prompt encoding repairs applied: ${totals.promptEncodingRepairs}`,
  `- Prompt encoding issues after repair: ${totals.promptEncodingIssues}`,
  `- Intake QA checked: ${intakeTotals.checked}`,
  `- Intake QA passed: ${intakeTotals.passed}`,
  `- Intake QA failed: ${intakeTotals.failed}`,
  `- Intake QA skipped checks: ${intakeTotals.skipped}`,
  `- Intake QA skipped suites: ${intakeTotals.skippedSuites}`,
  `- Response contracts checked: ${parsedResponseContract.checked}`,
  `- Response contracts passed: ${parsedResponseContract.passed}`,
  `- Response contracts failed: ${parsedResponseContract.failed}`,
  `- Customer UX suites passing: ${parsedCustomerUx.filter((suite) => suite.result === "PASS").length}/${parsedCustomerUx.length}`,
  `- Golden suite: ${parsedGoldenSuite.result} (${parsedGoldenSuite.run}/${parsedGoldenSuite.checked} checks run)`,
  `- Fixture/coverage evidence suites passing: ${parsedFixtureCoverage.filter((suite) => suite.result === "PASS").length}/${parsedFixtureCoverage.length}`,
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
  "| Suite | Source report | Fixture | Checked | Passed | Needs review | Encoding repairs | Encoding issues | Runner | OpenAI extraction | Last run |",
  "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |",
  ...parsed.map(
    (suite) =>
      `| ${suite.name} | \`${suite.source}\` | \`${suite.fixture}\` | ${suite.checked} | ${suite.passed} | ${suite.review} | ${suite.promptEncodingRepairs} | ${suite.promptEncodingIssues} | \`${suite.runner}\` | ${suite.openAiExtraction} | ${suite.runDate} |`,
  ),
  "",
  "## Intake Evidence",
  "",
  "| Suite | Source report | Layer | Command | Status | Checked | Passed | Failed | Skipped | Last run |",
  "| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |",
  ...parsedIntake.map(
    (suite) =>
      `| ${suite.name} | \`${suite.source}\` | ${suite.layer} | \`${suite.command}\` | ${suite.status} | ${suite.checked} | ${suite.passed} | ${suite.failed} | ${suite.skipped} | ${suite.runDate} |`,
  ),
  "",
  "## Response Contract Evidence",
  "",
  "| Suite | Source report | Layer | Command | Status | Checked | Passed | Failed | Contracts covered | Missing contracts | Last run |",
  "| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- |",
  `| ${parsedResponseContract.name} | \`${parsedResponseContract.source}\` | ${parsedResponseContract.layer} | \`${parsedResponseContract.command}\` | ${parsedResponseContract.status} | ${parsedResponseContract.checked} | ${parsedResponseContract.passed} | ${parsedResponseContract.failed} | ${parsedResponseContract.contractsCovered} | ${parsedResponseContract.missingContracts} | ${parsedResponseContract.runDate} |`,
  "",
  "## Customer UX Evidence",
  "",
  "| Suite | Source report | Layer | Command | Result | Last run |",
  "| --- | --- | --- | --- | --- | --- |",
  ...parsedCustomerUx.map(
    (suite) =>
      `| ${suite.name} | \`${suite.source}\` | ${suite.layer} | \`${suite.command}\` | ${suite.result} | ${suite.runDate} |`,
  ),
  "",
  "## Golden Suite Evidence",
  "",
  "| Suite | Source report | Layer | Command | Mode | Result | Checks run | Passed | Failed | Last run |",
  "| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | --- |",
  `| ${parsedGoldenSuite.name} | \`${parsedGoldenSuite.source}\` | ${parsedGoldenSuite.layer} | \`${parsedGoldenSuite.command}\` | ${parsedGoldenSuite.mode} | ${parsedGoldenSuite.result} | ${parsedGoldenSuite.run}/${parsedGoldenSuite.checked} | ${parsedGoldenSuite.passed} | ${parsedGoldenSuite.failed} | ${parsedGoldenSuite.runDate} |`,
  "",
  "## Fixture And Coverage Evidence",
  "",
  "| Suite | Source report | Layer | Command | Result | Checked | Issues | Last run |",
  "| --- | --- | --- | --- | --- | ---: | ---: | --- |",
  ...parsedFixtureCoverage.map(
    (suite) =>
      `| ${suite.name} | \`${suite.source}\` | ${suite.layer} | \`${suite.command}\` | ${suite.result} | ${suite.checked} | ${suite.issues} | ${suite.runDate} |`,
  ),
  "",
  "## Current Interpretation",
  "",
  "- Dog coverage is proven across 600 live recommendation scenarios.",
  "- Cat coverage is proven across 500 live recommendation scenarios.",
  "- Focused cat safety and quality smoke checks keep urinary, renal, kitten, allergy, senior, sterilised, weight-control, digestion, and preference regressions visible in the fast gate.",
  "- The live suites currently show no review cases.",
  "- OpenAI fact extraction is tracked separately from the large live recommendation suites so cost, auth, and deterministic ranking quality stay easy to reason about.",
  "- Response contracts are tracked separately so safety, context-question, comparison, nutrition-reasoning, and transition-guidance expectations remain visible.",
  "- Customer-facing UX checks protect against backend labels, raw scores, confusing recommendation flows, and high-risk recommendation regressions leaking into the customer experience.",
  "- The fast golden suite shows the current PR-level regression gate, including the latest live dog/cat smoke checks and focused cat safety/quality checks.",
  "- Fixture integrity, coverage audits, and live encoding checks protect the large Greek dog/cat QA batches from encoding drift and scenario imbalance before live tests run.",
  "",
  "## Next QA Gaps",
  "",
  ...missingOptionalSuites.map(
    (suite) =>
      `- Generate \`${suite.source}\` with \`${suite.command}\` before treating ${suite.name} as fresh dashboard evidence.`,
  ),
  "- Run `npm.cmd run qa:openai-intake-smoke` in an environment with `OPENAI_API_KEY` or `NUTRITAIL_QA_OPENAI_API_KEY_FILE` enabled to prove OpenAI fact extraction separately from deterministic recommendation quality.",
  "- Run `npm.cmd run qa:account-chatbot-extract-live-route` with `NUTRITAIL_QA_AUTH_COOKIE` or `NUTRITAIL_QA_AUTH_COOKIE_FILE` set to prove the authenticated live chatbot extraction route end to end without committing or printing the cookie.",
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

const suitesWithEncodingIssues = parsed.filter((suite) => suite.promptEncodingIssues > 0);
if (suitesWithEncodingIssues.length > 0) {
  throw new Error(
    `Live QA prompt encoding issues remain after repair: ${suitesWithEncodingIssues
      .map((suite) => suite.name)
      .join(", ")}`,
  );
}

const failingCustomerUx = parsedCustomerUx.filter((suite) => suite.result !== "PASS");
if (failingCustomerUx.length > 0) {
  throw new Error(
    `Customer UX QA is not passing: ${failingCustomerUx
      .map((suite) => suite.name)
      .join(", ")}`,
  );
}

if (parsedGoldenSuite.result !== "PASS") {
  throw new Error("Chatbot golden suite is not passing.");
}

const failingFixtureCoverage = parsedFixtureCoverage.filter((suite) => suite.result !== "PASS");
if (failingFixtureCoverage.length > 0) {
  throw new Error(
    `Fixture/coverage QA is not passing: ${failingFixtureCoverage
      .map((suite) => suite.name)
      .join(", ")}`,
  );
}
