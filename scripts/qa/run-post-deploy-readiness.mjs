import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH || "reports/post_deploy_readiness.md";
const shouldRefreshChatbot =
  process.env.NUTRITAIL_QA_REFRESH_CHATBOT === "1" ||
  process.argv.includes("--refresh-chatbot");
const runStartedAt = new Date();
const deployFreshnessRequested =
  process.env.NUTRITAIL_QA_DEPLOY_FRESHNESS === "1" ||
  process.argv.includes("--deploy-freshness");
const deployedAtArg = process.argv
  .find((arg) => arg.startsWith("--deployed-at="))
  ?.slice("--deployed-at=".length)
  .trim();
const deployedAt = (
  process.env.NUTRITAIL_QA_DEPLOYED_AT?.trim() ||
  deployedAtArg ||
  (deployFreshnessRequested ? runStartedAt.toISOString() : "")
);
const shouldRefreshFreshnessSources = Boolean(deployedAt);

const commands = [
  {
    label: "Public launch live routes",
    command: "npm.cmd run qa:public-launch-live-routes",
  },
  {
    label: "Food V2 live routes",
    command: "npm.cmd run qa:food-v2-live-routes",
  },
  {
    label: "Account progress live routes",
    command: "npm.cmd run qa:account-progress-live-routes",
  },
  {
    label: "Customer chatbot flow links",
    command: "npm.cmd run qa:customer-chatbot-flow-links",
  },
  {
    label: "Vercel OpenAI production env",
    command: "npm.cmd run qa:vercel-openai-env",
  },
  {
    label: "OpenAI intake smoke",
    command: "npm.cmd run qa:openai-intake-smoke",
  },
  {
    label: "Account chatbot extract live route",
    command: "npm.cmd run qa:account-chatbot-extract-live-route",
  },
  ...(shouldRefreshChatbot
    ? [
        {
          label: "Chatbot golden suite fast",
          command: "npm.cmd run qa:chatbot-golden-suite:fast",
        },
        {
          label: "Chatbot sensitive recommendation smoke",
          command: "npm.cmd run qa:chatbot-sensitive-recommendations",
        },
        {
          label: "Chatbot live QA dashboard",
          command: "npm.cmd run qa:chatbot-live-dashboard",
        },
      ]
    : []),
  ...(shouldRefreshFreshnessSources && !shouldRefreshChatbot
    ? [
        {
          label: "Chatbot live QA dashboard",
          command: "npm.cmd run qa:chatbot-live-dashboard",
        },
      ]
    : []),
  {
    label: "Live readiness dashboard",
    command: "npm.cmd run qa:live-readiness-dashboard",
    env: deployedAt ? { NUTRITAIL_QA_DEPLOYED_AT: deployedAt } : {},
  },
];

function runCommand(command, env = {}) {
  const startedAt = Date.now();
  const result = spawnSync(command, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      ...env,
    },
    shell: true,
  });

  return {
    status: result.status ?? 1,
    durationSeconds: (Date.now() - startedAt) / 1000,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error?.message ?? null,
  };
}

function readLiveReadinessRollup() {
  const source = "reports/live_readiness_dashboard.md";

  if (!existsSync(source)) {
    return {
      source,
      result: "missing",
      readinessScore: "unknown",
      minimumReadinessScore: "unknown",
      coreEvidenceScore: "unknown",
      advisoryEvidenceScore: "unknown",
      generated: "unknown",
    };
  }

  const report = readFileSync(source, "utf8");

  return {
    source,
    result: report.match(/^Result:\s*([^\n\r]+)/im)?.[1]?.trim() ?? "unknown",
    readinessScore:
      report.match(/- 95% readiness score:\s*([^\n\r]+)/i)?.[1]?.trim() ?? "unknown",
    minimumReadinessScore:
      report.match(/- Minimum readiness score:\s*([^\n\r]+)/i)?.[1]?.trim() ?? "unknown",
    coreEvidenceScore:
      report.match(/- Core evidence score:\s*([^\n\r]+)/i)?.[1]?.trim() ?? "unknown",
    advisoryEvidenceScore:
      report.match(/- Advisory evidence score:\s*([^\n\r]+)/i)?.[1]?.trim() ?? "unknown",
    generated: report.match(/^Generated:\s*([^\n\r]+)/im)?.[1]?.trim() ?? "unknown",
  };
}

const results = commands.map((item) => {
  console.log(`\n=== ${item.label} ===`);
  console.log(item.command);
  const result = runCommand(item.command, item.env);
  if (result.stdout.trim()) console.log(result.stdout.trim());
  if (result.stderr.trim()) console.error(result.stderr.trim());
  if (result.error) console.error(result.error);

  return {
    ...item,
    ...result,
    passed: result.status === 0 && !result.error,
  };
});

const failed = results.filter((item) => !item.passed);
const liveReadiness = readLiveReadinessRollup();
const generatedAt = new Date().toISOString();
const lines = [
  "# NutriTail Post-Deploy Readiness",
  "",
  `Generated: ${generatedAt}`,
  `Result: ${failed.length === 0 ? "PASS" : "REVIEW"}`,
  "",
  "This report is the quick post-deploy command summary for the live NutriTail surface.",
  "It refreshes the core route, Food V2, account, OpenAI env, and readiness evidence after a production deploy.",
  "",
  "## Summary",
  "",
  `- Commands checked: ${results.length}`,
  `- Passed: ${results.length - failed.length}`,
  `- Failed or needs review: ${failed.length}`,
  `- Chatbot QA refreshed in this run: ${shouldRefreshChatbot ? "yes" : "no"}`,
  "- Customer chatbot flow refreshed in this run: yes",
  `- Deploy freshness gate used: ${deployedAt ? deployedAt : "no"}`,
  `- Freshness source reports refreshed: ${shouldRefreshFreshnessSources ? "yes" : "no"}`,
  `- Live readiness result: ${liveReadiness.result}`,
  `- Live readiness score: ${liveReadiness.readinessScore}`,
  `- Minimum readiness score: ${liveReadiness.minimumReadinessScore}`,
  `- Core evidence score: ${liveReadiness.coreEvidenceScore}`,
  `- Advisory evidence score: ${liveReadiness.advisoryEvidenceScore}`,
  `- Live readiness generated: ${liveReadiness.generated}`,
  "",
  "## Commands",
  "",
  "| Step | Command | Status | Duration |",
  "| --- | --- | --- | ---: |",
  ...results.map(
    (item) =>
      `| ${item.label} | \`${item.command}\` | ${
        item.passed ? "PASS" : "REVIEW"
      } | ${item.durationSeconds.toFixed(1)}s |`,
  ),
  "",
  "## Notes",
  "",
  "- Run with `--refresh-chatbot` or `NUTRITAIL_QA_REFRESH_CHATBOT=1` when the deploy touches chatbot recommendation logic; this runs the fast golden suite and sensitive recommendation smoke before refreshing the chatbot QA dashboard.",
  "- Customer chatbot flow links run by default because saved-pet navigation, scrolling, language, and customer-facing copy are production-critical.",
  "- Run with `--deploy-freshness` or set `NUTRITAIL_QA_DEPLOY_FRESHNESS=1` to require the live readiness dashboard reports to be newer than the start of this post-deploy run.",
  "- Use `--deployed-at=<ISO timestamp>` or `NUTRITAIL_QA_DEPLOYED_AT=<ISO timestamp>` when you know the exact production deploy time.",
  "- The live readiness dashboard remains the authoritative rollup; this report records the post-deploy command sequence.",
  "- The OpenAI env check confirms encrypted Production env presence without pulling or printing the secret.",
  "",
];

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");

console.log(`\nWrote ${reportPath}`);
console.log(`Result: ${failed.length === 0 ? "PASS" : "REVIEW"}`);

if (failed.length > 0) {
  throw new Error(
    `Post-deploy readiness needs review: ${failed.map((item) => item.label).join(", ")}`,
  );
}
