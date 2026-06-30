import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputPath = "reports/live_readiness_dashboard.md";
const generatedAt = new Date();
const configuredMaxReportAgeHours = Number(process.env.NUTRITAIL_QA_MAX_REPORT_AGE_HOURS ?? 48);
const maxReportAgeHours =
  Number.isFinite(configuredMaxReportAgeHours) && configuredMaxReportAgeHours > 0
    ? configuredMaxReportAgeHours
    : 48;
const deployedAtRaw = process.env.NUTRITAIL_QA_DEPLOYED_AT?.trim() ?? "";
const deployedAtMs = deployedAtRaw ? Date.parse(deployedAtRaw) : null;
const deployedAtIso =
  deployedAtMs != null && Number.isFinite(deployedAtMs)
    ? new Date(deployedAtMs).toISOString()
    : null;

const routeSuites = [
  {
    name: "Public launch live routes",
    source: "reports/public_launch_live_route_smoke_qa.md",
    command: "npm.cmd run qa:public-launch-live-routes",
    layer: "homepage, auth pages, legal pages, SEO files, manifest, OpenGraph image",
  },
  {
    name: "Food V2 live routes",
    source: "reports/food_v2_live_route_smoke_qa.md",
    command: "npm.cmd run qa:food-v2-live-routes",
    layer: "admin Food V2 pages + protected Food V2 APIs",
  },
  {
    name: "Account progress live routes",
    source: "reports/account_progress_live_route_smoke_qa.md",
    command: "npm.cmd run qa:account-progress-live-routes",
    layer: "account pages, pet pages, printable reports, progress API guard",
  },
];

const staticSuites = [
  {
    name: "Customer chatbot flow links",
    source: "reports/customer_chatbot_flow_links_qa.md",
    command: "npm.cmd run qa:customer-chatbot-flow-links",
    layer: "saved pet deep links, progress links, customer-facing copy guards",
  },
  {
    name: "Vercel OpenAI production env",
    source: "reports/vercel_openai_env_qa.md",
    command: "npm.cmd run qa:vercel-openai-env",
    layer: "production OpenAI API key presence without exposing the secret",
  },
];

const chatbotSuite = {
  name: "Chatbot live QA dashboard",
  source: "reports/chatbot_live_qa_dashboard.md",
  command: "npm.cmd run qa:chatbot-live-dashboard",
  layer: "dog/cat recommendation live QA, intake QA, response contracts, customer UX",
};

const advisorySuites = [
  {
    name: "OpenAI intake smoke",
    source: "reports/openai_intake_smoke_qa.md",
    command: "npm.cmd run qa:openai-intake-smoke",
    layer: "structured pet-fact extraction through OpenAI when a key is available",
    parser: "case",
  },
  {
    name: "Account chatbot extract live route",
    source: "reports/account_chatbot_extract_live_route_qa.md",
    command: "npm.cmd run qa:account-chatbot-extract-live-route",
    layer: "authenticated live chatbot intake extraction endpoint",
    parser: "route",
  },
];

function readReport(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function missingSuite(suite) {
  return {
    ...suite,
    checked: 1,
    passed: 0,
    failed: 1,
    runDate: "missing",
    ageHours: null,
    age: "missing",
    staleReason: "report missing",
    status: "MISSING",
  };
}

function reportExists(relativePath) {
  return existsSync(path.join(root, relativePath));
}

function parseNumber(text, patterns, label) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1] != null) return Number(match[1]);
  }

  throw new Error(`Could not parse ${label}`);
}

function parseOptionalNumber(text, patterns, fallback = 0) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1] != null) return Number(match[1]);
  }

  return fallback;
}

function parseRunDate(text) {
  return text.match(/(?:Generated|Run date):\s*([^\n\r]+)/i)?.[1]?.trim() ?? "unknown";
}

function reportAgeHours(runDate) {
  const parsed = Date.parse(runDate);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, (generatedAt.getTime() - parsed) / 36e5);
}

function reportRunMs(runDate) {
  const parsed = Date.parse(runDate);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatAge(hours) {
  if (hours == null) return "unknown";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}

function formatRemaining(hours) {
  if (hours == null) return "unknown";
  if (hours <= 0) return "now";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  return `${hours.toFixed(1)}h`;
}

function isStale(runDate) {
  const ageHours = reportAgeHours(runDate);
  const runMs = reportRunMs(runDate);
  return (
    ageHours == null ||
    ageHours > maxReportAgeHours ||
    (deployedAtMs != null && Number.isFinite(deployedAtMs) && (runMs == null || runMs < deployedAtMs))
  );
}

function staleReason(runDate) {
  const ageHours = reportAgeHours(runDate);
  const runMs = reportRunMs(runDate);

  if (ageHours == null) return "unknown run date";
  if (ageHours > maxReportAgeHours) return `older than ${maxReportAgeHours}h`;
  if (deployedAtMs != null && Number.isFinite(deployedAtMs) && (runMs == null || runMs < deployedAtMs)) {
    return `older than deploy ${deployedAtIso}`;
  }

  return "";
}

function parseRouteSuite(suite) {
  if (!reportExists(suite.source)) return missingSuite(suite);

  const text = readReport(suite.source);
  const checked = parseNumber(text, [/- Routes checked:\s*(\d+)/i], `${suite.source} checked`);
  const passed = parseNumber(text, [/- Passed:\s*(\d+)/i], `${suite.source} passed`);
  const failed = parseNumber(text, [/- Failed:\s*(\d+)/i], `${suite.source} failed`);
  const runDate = parseRunDate(text);
  const ageHours = reportAgeHours(runDate);
  const stale = isStale(runDate);

  return {
    ...suite,
    checked,
    passed,
    failed,
    runDate,
    ageHours,
    age: formatAge(ageHours),
    staleReason: stale ? staleReason(runDate) : "",
    status: failed === 0 && checked === passed && !stale ? "PASS" : stale ? "STALE" : "REVIEW",
  };
}

function parseStaticSuite(suite) {
  if (!reportExists(suite.source)) return missingSuite(suite);

  const text = readReport(suite.source);
  const checked = parseNumber(text, [/- Checks:\s*(\d+)/i], `${suite.source} checked`);
  const passed = parseNumber(text, [/- Passed:\s*(\d+)/i], `${suite.source} passed`);
  const failed = parseNumber(text, [/- Failed:\s*(\d+)/i], `${suite.source} failed`);
  const runDate = parseRunDate(text);
  const ageHours = reportAgeHours(runDate);
  const stale = isStale(runDate);

  return {
    ...suite,
    checked,
    passed,
    failed,
    runDate,
    ageHours,
    age: formatAge(ageHours),
    staleReason: stale ? staleReason(runDate) : "",
    status: failed === 0 && checked === passed && !stale ? "PASS" : stale ? "STALE" : "REVIEW",
  };
}

function parseOpenAiSmokeSuite(suite) {
  if (!reportExists(suite.source)) {
    return {
      ...missingSuite(suite),
      skipped: 0,
      note: "report missing",
    };
  }

  const text = readReport(suite.source);
  const checked = parseOptionalNumber(text, [/- Cases checked:\s*(\d+)/i]);
  const passed = parseOptionalNumber(text, [/- Passed:\s*(\d+)/i]);
  const failed = parseOptionalNumber(text, [/- Failed:\s*(\d+)/i]);
  const skipped = parseOptionalNumber(text, [/- Skipped:\s*(\d+)/i]);
  const declaredStatus = text.match(/^Status:\s*([^\n\r]+)/im)?.[1]?.trim().toLowerCase() ?? "unknown";
  const runDate = parseRunDate(text);
  const ageHours = reportAgeHours(runDate);
  const stale = isStale(runDate);
  const status =
    failed > 0
      ? "REVIEW"
      : stale
        ? "STALE"
        : declaredStatus === "completed"
          ? "PASS"
          : declaredStatus === "skipped"
            ? "SKIPPED"
            : "REVIEW";

  return {
    ...suite,
    checked,
    passed,
    failed,
    skipped,
    runDate,
    ageHours,
    age: formatAge(ageHours),
    staleReason: stale ? staleReason(runDate) : "",
    status,
    note:
      status === "SKIPPED"
        ? "OPENAI_API_KEY or NUTRITAIL_QA_OPENAI_API_KEY_FILE was not available in this QA environment; production env is checked separately."
        : declaredStatus,
  };
}

function parseAdvisoryRouteSuite(suite) {
  if (!reportExists(suite.source)) {
    return {
      ...missingSuite(suite),
      skipped: 0,
      note: "report missing",
    };
  }

  const text = readReport(suite.source);
  const checked = parseOptionalNumber(text, [/- Routes checked:\s*(\d+)/i]);
  const passed = parseOptionalNumber(text, [/- Passed:\s*(\d+)/i]);
  const failed = parseOptionalNumber(text, [/- Failed:\s*(\d+)/i]);
  const skipped = parseOptionalNumber(text, [/- Skipped:\s*(\d+)/i]);
  const declaredStatus = text.match(/^Status:\s*([^\n\r]+)/im)?.[1]?.trim().toLowerCase() ?? "unknown";
  const runDate = parseRunDate(text);
  const ageHours = reportAgeHours(runDate);
  const stale = isStale(runDate);
  const status =
    failed > 0
      ? "REVIEW"
      : stale
        ? "STALE"
        : declaredStatus === "completed"
          ? "PASS"
          : declaredStatus === "skipped"
            ? "SKIPPED"
            : "REVIEW";

  return {
    ...suite,
    checked,
    passed,
    failed,
    skipped,
    runDate,
    ageHours,
    age: formatAge(ageHours),
    staleReason: stale ? staleReason(runDate) : "",
    status,
    note:
      status === "SKIPPED"
        ? "NUTRITAIL_QA_AUTH_COOKIE or NUTRITAIL_QA_AUTH_COOKIE_FILE was not available; provide an authenticated account cookie for full live endpoint verification without committing or printing it."
        : declaredStatus,
  };
}

function parseAdvisorySuite(suite) {
  return suite.parser === "route" ? parseAdvisoryRouteSuite(suite) : parseOpenAiSmokeSuite(suite);
}

function parseChatbotSuite(suite) {
  if (!reportExists(suite.source)) {
    return {
      ...missingSuite(suite),
      review: 1,
      responseFailures: 0,
      intakeChecked: 0,
      intakePassed: 0,
      intakeFailed: 0,
      intakeSkippedSuites: 0,
      promptEncodingRepairs: 0,
      promptEncodingIssues: 0,
      fixtureCoverageLine: "missing",
      customerUxLine: "missing",
    };
  }

  const text = readReport(suite.source);
  const checked = parseNumber(text, [/- Live cases checked:\s*(\d+)/i], `${suite.source} checked`);
  const passed = parseNumber(text, [/- Passed:\s*(\d+)/i], `${suite.source} passed`);
  const review = parseNumber(text, [/- Needs review:\s*(\d+)/i], `${suite.source} review`);
  const responseFailures = parseNumber(
    text,
    [/- Response contracts failed:\s*(\d+)/i],
    `${suite.source} response failures`,
  );
  const intakeChecked = parseNumber(text, [/- Intake QA checked:\s*(\d+)/i], `${suite.source} intake checked`);
  const intakePassed = parseNumber(text, [/- Intake QA passed:\s*(\d+)/i], `${suite.source} intake passed`);
  const intakeFailed = parseNumber(text, [/- Intake QA failed:\s*(\d+)/i], `${suite.source} intake failed`);
  const intakeSkippedSuites = parseNumber(
    text,
    [/- Intake QA skipped suites:\s*(\d+)/i],
    `${suite.source} intake skipped suites`,
  );
  const promptEncodingRepairs = parseNumber(
    text,
    [/- Prompt encoding repairs applied:\s*(\d+)/i],
    `${suite.source} prompt encoding repairs`,
  );
  const promptEncodingIssues = parseNumber(
    text,
    [/- Prompt encoding issues after repair:\s*(\d+)/i],
    `${suite.source} prompt encoding issues`,
  );
  const fixtureCoverageLine =
    text.match(/- Fixture\/coverage evidence suites passing:\s*([^\n\r]+)/i)?.[1]?.trim() ??
    text.match(/- Fixture integrity suites passing:\s*([^\n\r]+)/i)?.[1]?.trim() ??
    "not recorded";
  const customerUxLine =
    text.match(/- Customer UX suites passing:\s*([^\n\r]+)/i)?.[1]?.trim() ?? "not recorded";
  const runDate = parseRunDate(text);
  const ageHours = reportAgeHours(runDate);
  const stale = isStale(runDate);

  return {
    ...suite,
    checked,
    passed,
    failed: review + responseFailures + intakeFailed + promptEncodingIssues,
    review,
    responseFailures,
    intakeChecked,
    intakePassed,
    intakeFailed,
    intakeSkippedSuites,
    promptEncodingRepairs,
    promptEncodingIssues,
    fixtureCoverageLine,
    customerUxLine,
    runDate,
    ageHours,
    age: formatAge(ageHours),
    staleReason: stale ? staleReason(runDate) : "",
    status:
      review === 0 &&
      responseFailures === 0 &&
      intakeFailed === 0 &&
      promptEncodingIssues === 0 &&
      checked === passed &&
      !stale
        ? "PASS"
        : stale
          ? "STALE"
          : "REVIEW",
  };
}

function percent(value, total) {
  if (!total) return "0.0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

function scoreRatio(value, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(1, value / total));
}

function advisorySuiteScore(suite) {
  if (suite.status === "PASS") return 1;
  if (suite.status === "SKIPPED") return 0.5;
  return 0;
}

const parsedRouteSuites = routeSuites.map(parseRouteSuite);
const parsedStaticSuites = staticSuites.map(parseStaticSuite);
const parsedChatbotSuite = parseChatbotSuite(chatbotSuite);
const parsedAdvisorySuites = advisorySuites.map(parseAdvisorySuite);
const allSuites = [...parsedRouteSuites, ...parsedStaticSuites, parsedChatbotSuite];
const totals = allSuites.reduce(
  (acc, suite) => {
    acc.checked += suite.checked;
    acc.passed += suite.passed;
    acc.failed += suite.failed;
    return acc;
  },
  { checked: 0, passed: 0, failed: 0 },
);
const failingSuites = allSuites.filter((suite) => suite.status !== "PASS");
const status = failingSuites.length === 0 ? "PASS" : "REVIEW";
const coreReadinessRatio = scoreRatio(totals.passed, totals.checked);
const advisoryReadinessRatio = scoreRatio(
  parsedAdvisorySuites.reduce((sum, suite) => sum + advisorySuiteScore(suite), 0),
  parsedAdvisorySuites.length,
);
const readinessScore = Math.round((coreReadinessRatio * 0.9 + advisoryReadinessRatio * 0.1) * 100);
const ageKnownSuites = allSuites.filter((suite) => suite.ageHours != null);
const oldestSuite = [...ageKnownSuites].sort((a, b) => b.ageHours - a.ageHours)[0];
const nextStaleSuite = [...ageKnownSuites]
  .filter((suite) => suite.ageHours <= maxReportAgeHours)
  .sort((a, b) => maxReportAgeHours - a.ageHours - (maxReportAgeHours - b.ageHours))[0];
const nextStaleRemainingHours =
  nextStaleSuite?.ageHours == null ? null : maxReportAgeHours - nextStaleSuite.ageHours;
const refreshPrioritySuites = [...ageKnownSuites].sort((a, b) => b.ageHours - a.ageHours).slice(0, 3);
const advisoryAgeKnownSuites = parsedAdvisorySuites.filter((suite) => suite.ageHours != null);
const advisoryRefreshPrioritySuites = [...advisoryAgeKnownSuites]
  .sort((a, b) => b.ageHours - a.ageHours)
  .slice(0, 3);

const lines = [
  "# NutriTail Live Readiness Dashboard",
  "",
  `Generated: ${generatedAt.toISOString()}`,
  `Result: ${status}`,
  "",
  "This dashboard summarizes live route, customer-flow, and chatbot QA evidence.",
  "It is intentionally evidence-based: each row points to the authoritative report and command.",
  "",
  "## Overall Status",
  "",
  `- Suites checked: ${allSuites.length}`,
  `- Suites passing: ${allSuites.length - failingSuites.length}/${allSuites.length}`,
  `- Total checks/cases/routes: ${totals.checked}`,
  `- Passed: ${totals.passed}`,
  `- Failed or needs review: ${totals.failed}`,
  `- Pass rate: ${percent(totals.passed, totals.checked)}`,
  `- 95% readiness score: ${readinessScore}/100`,
  `- Core evidence score: ${percent(coreReadinessRatio, 1)} (blocks readiness)`,
  `- Advisory evidence score: ${percent(advisoryReadinessRatio, 1)} (non-blocking but needed for full OpenAI proof)`,
  `- Max report age: ${maxReportAgeHours}h`,
  `- Deploy freshness gate: ${deployedAtIso ? `reports must be newer than ${deployedAtIso}` : "not configured"}`,
  `- Oldest source report: ${oldestSuite ? `${oldestSuite.name} (${oldestSuite.age})` : "unknown"}`,
  `- Next stale report: ${
    nextStaleSuite
      ? `${nextStaleSuite.name} in ${formatRemaining(nextStaleRemainingHours)}`
      : "unknown"
  }`,
  `- Advisory evidence suites: ${parsedAdvisorySuites.length}`,
  "",
  "## Readiness Evidence",
  "",
  "| Suite | Layer | Source report | Command | Status | Checked | Passed | Failed/review | Last run | Age | Freshness note |",
  "| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- | ---: | --- |",
  ...allSuites.map(
    (suite) =>
      `| ${suite.name} | ${suite.layer} | \`${suite.source}\` | \`${suite.command}\` | ${suite.status} | ${suite.checked} | ${suite.passed} | ${suite.failed} | ${suite.runDate} | ${suite.age} | ${suite.staleReason || "-"} |`,
  ),
  "",
  "## Advisory Evidence",
  "",
  "These checks add confidence but do not block live readiness when skipped locally.",
  "",
  "| Suite | Layer | Source report | Command | Status | Checked | Passed | Failed | Skipped | Last run | Age | Freshness note | Note |",
  "| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |",
  ...parsedAdvisorySuites.map(
    (suite) =>
      `| ${suite.name} | ${suite.layer} | \`${suite.source}\` | \`${suite.command}\` | ${suite.status} | ${suite.checked} | ${suite.passed} | ${suite.failed} | ${suite.skipped} | ${suite.runDate} | ${suite.age} | ${suite.staleReason || "-"} | ${suite.note} |`,
  ),
  "",
  "## Advisory Refresh Priority",
  "",
  "These checks are non-blocking, but they show the next best QA evidence to refresh when the needed key or auth cookie is available.",
  "",
  "| Priority | Suite | Status | Age | Time until stale | Source report | Command |",
  "| ---: | --- | --- | ---: | ---: | --- | --- |",
  ...advisoryRefreshPrioritySuites.map((suite, index) => {
    const remainingHours = maxReportAgeHours - suite.ageHours;
    return `| ${index + 1} | ${suite.name} | ${suite.status} | ${suite.age} | ${formatRemaining(remainingHours)} | \`${suite.source}\` | \`${suite.command}\` |`;
  }),
  "",
  "## Refresh Priority",
  "",
  "| Priority | Suite | Age | Time until stale | Source report |",
  "| ---: | --- | ---: | ---: | --- |",
  ...refreshPrioritySuites.map((suite, index) => {
    const remainingHours = maxReportAgeHours - suite.ageHours;
    return `| ${index + 1} | ${suite.name} | ${suite.age} | ${formatRemaining(remainingHours)} | \`${suite.source}\` |`;
  }),
  "",
  "## Chatbot Evidence Details",
  "",
  `- Live recommendation cases: ${parsedChatbotSuite.passed}/${parsedChatbotSuite.checked}`,
  `- Recommendation cases needing review: ${parsedChatbotSuite.review}`,
  `- Intake QA: ${parsedChatbotSuite.intakePassed}/${parsedChatbotSuite.intakeChecked}`,
  `- Intake QA failures: ${parsedChatbotSuite.intakeFailed}`,
  `- Intake QA skipped suites: ${parsedChatbotSuite.intakeSkippedSuites}`,
  `- Prompt encoding repairs applied: ${parsedChatbotSuite.promptEncodingRepairs}`,
  `- Prompt encoding issues after repair: ${parsedChatbotSuite.promptEncodingIssues}`,
  `- Response contract failures: ${parsedChatbotSuite.responseFailures}`,
  `- Customer UX suites: ${parsedChatbotSuite.customerUxLine}`,
  `- Fixture/coverage evidence suites: ${parsedChatbotSuite.fixtureCoverageLine}`,
  "",
  "## Interpretation",
  "",
  "- Food V2 and account route smoke checks prove key live pages and protected APIs are deployed.",
  "- Customer flow link QA protects saved-pet, progress-check, report, and chatbot navigation behavior.",
  "- Chatbot live QA protects dog/cat recommendation behavior separately from route availability.",
  "- Intake QA is visible separately so OpenAI smoke skips or failures do not hide behind recommendation totals.",
  "- Fixture integrity, coverage audits, and live encoding checks protect the large Greek dog/cat QA batches before live tests run.",
  `- The readiness score weights blocking core evidence at 90% and advisory OpenAI/authenticated-route evidence at 10%. Skipped advisory checks count as partial evidence because the route and secret-handling code are present, but the live credentialed smoke was not executed in this environment.`,
  "",
  "## Next Live Checks",
  "",
  "- Rerun this dashboard after each deploy that touches account, chatbot, Food V2, or report routes.",
  `- Refresh first: ${
    nextStaleSuite ? `${nextStaleSuite.name} (${nextStaleSuite.command})` : "no current source report found"
  }.`,
  `- Reports older than ${maxReportAgeHours}h are marked STALE and block readiness until rerun.`,
  "- Set `NUTRITAIL_QA_DEPLOYED_AT` to the production deploy timestamp to require reports generated after that deploy.",
  "- If a report is older than the current deploy, rerun the source command before relying on it.",
  "- When OpenAI settings change, rerun `npm.cmd run qa:openai-intake-smoke` in an environment with `OPENAI_API_KEY` or `NUTRITAIL_QA_OPENAI_API_KEY_FILE`.",
  "",
];

writeFileSync(path.join(root, outputPath), `${lines.join("\n")}\n`);
console.log(`Wrote ${outputPath}`);
console.log(`Result: ${status}`);
console.log(`Suites passing: ${allSuites.length - failingSuites.length}/${allSuites.length}`);

if (failingSuites.length > 0) {
  throw new Error(`Live readiness needs review: ${failingSuites.map((suite) => suite.name).join(", ")}`);
}
