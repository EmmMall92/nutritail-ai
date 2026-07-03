import { readFileSync } from "node:fs";

const dashboardSource = readFileSync("scripts/qa/build-live-readiness-dashboard.mjs", "utf8");
const chatbotDashboardSource = readFileSync("scripts/qa/build-live-qa-dashboard.mjs", "utf8");
const postDeploySource = readFileSync("scripts/qa/run-post-deploy-readiness.mjs", "utf8");
const adminLiveQaSource = readFileSync("app/admin/foods/v2-live-qa/page.tsx", "utf8");
const packageSource = readFileSync("package.json", "utf8");

const checks = [
  {
    label: "reads deploy freshness timestamp from environment",
    source: dashboardSource,
    expected: "NUTRITAIL_QA_DEPLOYED_AT",
  },
  {
    label: "marks reports older than deploy as stale",
    source: dashboardSource,
    expected: "older than deploy",
  },
  {
    label: "exposes freshness notes in readiness evidence",
    source: dashboardSource,
    expected: "Freshness note",
  },
  {
    label: "documents deploy freshness gate in next live checks",
    source: dashboardSource,
    expected: "Set `NUTRITAIL_QA_DEPLOYED_AT`",
  },
  {
    label: "keeps default behavior optional when deploy timestamp is absent",
    source: dashboardSource,
    expected: "not configured",
  },
  {
    label: "readiness dashboard has a configurable minimum readiness score",
    source: dashboardSource,
    expected: "NUTRITAIL_QA_MIN_READINESS_SCORE",
  },
  {
    label: "readiness dashboard defaults to the 95 target score",
    source: dashboardSource,
    expected: "?? 95",
  },
  {
    label: "readiness dashboard exits non-zero below the target score",
    source: dashboardSource,
    expected: "below the ${minReadinessScore}/100 gate",
  },
  {
    label: "readiness dashboard reports the minimum readiness score",
    source: dashboardSource,
    expected: "Minimum readiness score",
  },
  {
    label: "readiness dashboard separates customer-ready core status",
    source: dashboardSource,
    expected: "Customer-ready core status",
  },
  {
    label: "readiness dashboard separates full OpenAI proof status",
    source: dashboardSource,
    expected: "Full OpenAI proof status",
  },
  {
    label: "full OpenAI proof only passes after both advisory checks pass",
    source: dashboardSource,
    expected: "it becomes PASS only after the OpenAI intake smoke and authenticated chatbot extract route both run successfully",
  },
  {
    label: "chatbot live dashboard separates recommendation logic review cases",
    source: chatbotDashboardSource,
    expected: "Recommendation logic review cases",
  },
  {
    label: "chatbot live dashboard separates format data coverage gaps",
    source: chatbotDashboardSource,
    expected: "Format/data coverage gaps",
  },
  {
    label: "readiness dashboard reads chatbot recommendation logic review cases",
    source: dashboardSource,
    expected: "Recommendation logic review cases",
  },
  {
    label: "readiness dashboard reads chatbot format data coverage gaps",
    source: dashboardSource,
    expected: "Format/data coverage gaps",
  },
  {
    label: "post-deploy script can enable deploy freshness from CLI",
    source: postDeploySource,
    expected: "--deploy-freshness",
  },
  {
    label: "package exposes post-deploy chatbot refresh script",
    source: packageSource,
    expected: "qa:post-deploy-readiness:refresh-chatbot",
  },
  {
    label: "package exposes post-deploy deploy freshness script",
    source: packageSource,
    expected: "qa:post-deploy-readiness:deploy-freshness",
  },
  {
    label: "package exposes full post-deploy release signoff script",
    source: packageSource,
    expected: "qa:post-deploy-readiness:full",
  },
  {
    label: "post-deploy script can accept exact deployed-at timestamp",
    source: postDeploySource,
    expected: "--deployed-at=",
  },
  {
    label: "post-deploy script forwards deployed timestamp to readiness dashboard",
    source: postDeploySource,
    expected: "NUTRITAIL_QA_DEPLOYED_AT: deployedAt",
  },
  {
    label: "post-deploy report records whether deploy freshness was used",
    source: postDeploySource,
    expected: "Deploy freshness gate used:",
  },
  {
    label: "post-deploy refreshes OpenAI intake smoke advisory report",
    source: postDeploySource,
    expected: "qa:openai-intake-smoke",
  },
  {
    label: "post-deploy refreshes OpenAI food brand guard report",
    source: postDeploySource,
    expected: "qa:openai-food-brand-guard",
  },
  {
    label: "readiness dashboard includes OpenAI food brand guard evidence",
    source: dashboardSource,
    expected: "OpenAI food brand guard",
  },
  {
    label: "readiness dashboard points to OpenAI food brand guard report",
    source: dashboardSource,
    expected: "reports/openai_food_brand_guard_qa.md",
  },
  {
    label: "post-deploy refreshes authenticated extract route advisory report",
    source: postDeploySource,
    expected: "qa:account-chatbot-extract-live-route",
  },
  {
    label: "post-deploy deploy freshness refreshes customer flow report",
    source: postDeploySource,
    expected: "qa:customer-chatbot-flow-links",
  },
  {
    label: "post-deploy deploy freshness refreshes chatbot dashboard report",
    source: postDeploySource,
    expected: "qa:chatbot-live-dashboard",
  },
  {
    label: "post-deploy report records freshness source refresh",
    source: postDeploySource,
    expected: "Freshness source reports refreshed:",
  },
  {
    label: "post-deploy report reads live readiness rollup",
    source: postDeploySource,
    expected: "readLiveReadinessRollup",
  },
  {
    label: "post-deploy report records live readiness score",
    source: postDeploySource,
    expected: "Live readiness score:",
  },
  {
    label: "post-deploy report records minimum readiness score",
    source: postDeploySource,
    expected: "Minimum readiness score:",
  },
  {
    label: "post-deploy report records core evidence score",
    source: postDeploySource,
    expected: "Core evidence score:",
  },
  {
    label: "post-deploy report records advisory evidence score",
    source: postDeploySource,
    expected: "Advisory evidence score:",
  },
  {
    label: "admin live QA summary parses deploy freshness gate",
    source: adminLiveQaSource,
    expected: "deployFreshnessGate",
  },
  {
    label: "admin live QA summary parses readiness score",
    source: adminLiveQaSource,
    expected: "readinessScore",
  },
  {
    label: "admin live QA summary parses minimum readiness score",
    source: adminLiveQaSource,
    expected: "minimumReadinessScore",
  },
  {
    label: "admin live QA summary parses core evidence score",
    source: adminLiveQaSource,
    expected: "coreEvidenceScore",
  },
  {
    label: "admin live QA summary parses advisory evidence score",
    source: adminLiveQaSource,
    expected: "advisoryEvidenceScore",
  },
  {
    label: "admin live QA summary parses customer-ready core status",
    source: adminLiveQaSource,
    expected: "customerReadyCoreStatus",
  },
  {
    label: "admin live QA summary parses full OpenAI proof status",
    source: adminLiveQaSource,
    expected: "fullOpenAiProofStatus",
  },
  {
    label: "admin live QA card shows readiness score",
    source: adminLiveQaSource,
    expected: "Readiness score",
  },
  {
    label: "admin live QA card shows OpenAI proof status",
    source: adminLiveQaSource,
    expected: "OpenAI proof:",
  },
  {
    label: "admin live QA exposes OpenAI full proof runbook action",
    source: adminLiveQaSource,
    expected: 'data-testid="openai-full-proof-runbook"',
  },
  {
    label: "admin live QA links OpenAI full proof runbook",
    source: adminLiveQaSource,
    expected: "docs/openai-full-proof-runbook.md",
  },
  {
    label: "admin live QA shows authenticated cookie proof path",
    source: adminLiveQaSource,
    expected: ".qa-secrets/nutritail-auth-cookie.txt",
  },
  {
    label: "admin live QA shows full OpenAI proof command",
    source: adminLiveQaSource,
    expected: "npm.cmd run qa:openai-full-proof",
  },
  {
    label: "admin live QA summary shows oldest source report",
    source: adminLiveQaSource,
    expected: "oldestSourceReport",
  },
  {
    label: "admin live QA summary shows next stale report",
    source: adminLiveQaSource,
    expected: "nextStaleReport",
  },
];

const failures = checks.filter((check) => !check.source.includes(check.expected));

if (failures.length > 0) {
  console.error("Live readiness deploy freshness QA failed:");
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
