import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputPath = "reports/live_readiness_dashboard.md";

const routeSuites = [
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
];

const chatbotSuite = {
  name: "Chatbot live QA dashboard",
  source: "reports/chatbot_live_qa_dashboard.md",
  command: "npm.cmd run qa:chatbot-live-dashboard",
  layer: "dog/cat recommendation live QA, intake QA, response contracts, customer UX",
};

function readReport(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function parseNumber(text, patterns, label) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1] != null) return Number(match[1]);
  }

  throw new Error(`Could not parse ${label}`);
}

function parseRunDate(text) {
  return text.match(/(?:Generated|Run date):\s*([^\n\r]+)/i)?.[1]?.trim() ?? "unknown";
}

function parseRouteSuite(suite) {
  const text = readReport(suite.source);
  const checked = parseNumber(text, [/- Routes checked:\s*(\d+)/i], `${suite.source} checked`);
  const passed = parseNumber(text, [/- Passed:\s*(\d+)/i], `${suite.source} passed`);
  const failed = parseNumber(text, [/- Failed:\s*(\d+)/i], `${suite.source} failed`);

  return {
    ...suite,
    checked,
    passed,
    failed,
    runDate: parseRunDate(text),
    status: failed === 0 && checked === passed ? "PASS" : "REVIEW",
  };
}

function parseStaticSuite(suite) {
  const text = readReport(suite.source);
  const checked = parseNumber(text, [/- Checks:\s*(\d+)/i], `${suite.source} checked`);
  const passed = parseNumber(text, [/- Passed:\s*(\d+)/i], `${suite.source} passed`);
  const failed = parseNumber(text, [/- Failed:\s*(\d+)/i], `${suite.source} failed`);

  return {
    ...suite,
    checked,
    passed,
    failed,
    runDate: parseRunDate(text),
    status: failed === 0 && checked === passed ? "PASS" : "REVIEW",
  };
}

function parseChatbotSuite(suite) {
  const text = readReport(suite.source);
  const checked = parseNumber(text, [/- Live cases checked:\s*(\d+)/i], `${suite.source} checked`);
  const passed = parseNumber(text, [/- Passed:\s*(\d+)/i], `${suite.source} passed`);
  const review = parseNumber(text, [/- Needs review:\s*(\d+)/i], `${suite.source} review`);
  const responseFailures = parseNumber(
    text,
    [/- Response contracts failed:\s*(\d+)/i],
    `${suite.source} response failures`,
  );
  const fixtureLine =
    text.match(/- Fixture integrity suites passing:\s*([^\n\r]+)/i)?.[1]?.trim() ?? "not recorded";
  const customerUxLine =
    text.match(/- Customer UX suites passing:\s*([^\n\r]+)/i)?.[1]?.trim() ?? "not recorded";

  return {
    ...suite,
    checked,
    passed,
    failed: review + responseFailures,
    review,
    responseFailures,
    fixtureLine,
    customerUxLine,
    runDate: parseRunDate(text),
    status: review === 0 && responseFailures === 0 && checked === passed ? "PASS" : "REVIEW",
  };
}

function percent(value, total) {
  if (!total) return "0.0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

const parsedRouteSuites = routeSuites.map(parseRouteSuite);
const parsedStaticSuites = staticSuites.map(parseStaticSuite);
const parsedChatbotSuite = parseChatbotSuite(chatbotSuite);
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

const lines = [
  "# NutriTail Live Readiness Dashboard",
  "",
  `Generated: ${new Date().toISOString()}`,
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
  "",
  "## Readiness Evidence",
  "",
  "| Suite | Layer | Source report | Command | Status | Checked | Passed | Failed/review | Last run |",
  "| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- |",
  ...allSuites.map(
    (suite) =>
      `| ${suite.name} | ${suite.layer} | \`${suite.source}\` | \`${suite.command}\` | ${suite.status} | ${suite.checked} | ${suite.passed} | ${suite.failed} | ${suite.runDate} |`,
  ),
  "",
  "## Chatbot Evidence Details",
  "",
  `- Live recommendation cases: ${parsedChatbotSuite.passed}/${parsedChatbotSuite.checked}`,
  `- Recommendation cases needing review: ${parsedChatbotSuite.review}`,
  `- Response contract failures: ${parsedChatbotSuite.responseFailures}`,
  `- Customer UX suites: ${parsedChatbotSuite.customerUxLine}`,
  `- Fixture integrity suites: ${parsedChatbotSuite.fixtureLine}`,
  "",
  "## Interpretation",
  "",
  "- Food V2 and account route smoke checks prove key live pages and protected APIs are deployed.",
  "- Customer flow link QA protects saved-pet, progress-check, report, and chatbot navigation behavior.",
  "- Chatbot live QA protects dog/cat recommendation behavior separately from route availability.",
  "- Fixture integrity protects the large Greek cat QA batch before live cat tests run.",
  "",
  "## Next Live Checks",
  "",
  "- Rerun this dashboard after each deploy that touches account, chatbot, Food V2, or report routes.",
  "- If a route report is older than the current deploy, rerun the source command before relying on it.",
  "- When OpenAI settings change, rerun `npm.cmd run qa:openai-intake-smoke` in an environment with `OPENAI_API_KEY`.",
  "",
];

writeFileSync(path.join(root, outputPath), `${lines.join("\n")}\n`);
console.log(`Wrote ${outputPath}`);
console.log(`Result: ${status}`);
console.log(`Suites passing: ${allSuites.length - failingSuites.length}/${allSuites.length}`);

if (failingSuites.length > 0) {
  throw new Error(`Live readiness needs review: ${failingSuites.map((suite) => suite.name).join(", ")}`);
}
