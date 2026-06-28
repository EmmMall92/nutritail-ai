import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH || "reports/post_deploy_readiness.md";
const shouldRefreshChatbot =
  process.env.NUTRITAIL_QA_REFRESH_CHATBOT === "1" ||
  process.argv.includes("--refresh-chatbot");

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
    label: "Vercel OpenAI production env",
    command: "npm.cmd run qa:vercel-openai-env",
  },
  ...(shouldRefreshChatbot
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
  },
];

function runCommand(command) {
  const startedAt = Date.now();
  const result = spawnSync(command, {
    cwd: process.cwd(),
    encoding: "utf8",
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

const results = commands.map((item) => {
  console.log(`\n=== ${item.label} ===`);
  console.log(item.command);
  const result = runCommand(item.command);
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
  `- Chatbot dashboard refreshed in this run: ${shouldRefreshChatbot ? "yes" : "no"}`,
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
  "- Run with `--refresh-chatbot` or `NUTRITAIL_QA_REFRESH_CHATBOT=1` when the deploy touches chatbot recommendation logic.",
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
