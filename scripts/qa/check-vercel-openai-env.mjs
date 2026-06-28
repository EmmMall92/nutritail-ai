import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH || "reports/vercel_openai_env_qa.md";
const command = process.platform === "win32" ? "cmd.exe" : "npx";
const args =
  process.platform === "win32"
    ? ["/d", "/s", "/c", "npx.cmd vercel env ls"]
    : ["vercel", "env", "ls"];

function writeReport({ status, failed, details }) {
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(
    reportPath,
    [
      "# Vercel OpenAI Env QA",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "This QA checks that the production Vercel project has an encrypted OpenAI API key configured.",
      "It never prints or stores the secret value.",
      "",
      "## Summary",
      "",
      "- Checks: 1",
      `- Passed: ${failed ? 0 : 1}`,
      `- Failed: ${failed ? 1 : 0}`,
      "",
      "## Result",
      "",
      status,
      "",
      "## Details",
      "",
      ...details.map((detail) => `- ${detail}`),
    ].join("\n") + "\n",
    "utf8",
  );
}

const result = spawnSync(command, args, {
  cwd: process.cwd(),
  encoding: "utf8",
  shell: false,
});

if (result.error) {
  writeReport({
    status: "FAIL",
    failed: true,
    details: [`Could not run Vercel CLI: ${result.error.message}`],
  });
  console.error(`Could not run Vercel CLI: ${result.error.message}`);
  process.exit(1);
}

const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

if (result.status !== 0) {
  writeReport({
    status: "FAIL",
    failed: true,
    details: [
      `Vercel CLI exited with code ${result.status}.`,
      "Run `npx.cmd vercel login` and retry if this machine is not authenticated.",
    ],
  });
  console.error(output.trim());
  process.exit(1);
}

const openAiLine = output
  .split(/\r?\n/)
  .find((line) => /^\s*OPENAI_API_KEY\s+Encrypted\s+.*\bProduction\b/i.test(line));

if (!openAiLine) {
  writeReport({
    status: "FAIL",
    failed: true,
    details: ["OPENAI_API_KEY was not found for the Production environment."],
  });
  console.error("OPENAI_API_KEY was not found for the Production environment.");
  process.exit(1);
}

writeReport({
  status: "PASS",
  failed: false,
  details: ["OPENAI_API_KEY is configured as an encrypted Production environment variable."],
});

console.log("Vercel OpenAI env QA passed.");
