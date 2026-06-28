import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH || "reports/vercel_openai_env_qa.md";
const command = process.platform === "win32" ? "cmd.exe" : "npx";
const listArgs =
  process.platform === "win32"
    ? ["/d", "/s", "/c", "npx.cmd vercel env ls"]
    : ["vercel", "env", "ls"];

function writeReport({ status, failed, details, checks = 2 }) {
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
      `- Checks: ${checks}`,
      `- Passed: ${failed ? checks - 1 : checks}`,
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

function runVercel(args) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: false,
  });
}

function getPulledEnvValue(envFilePath, key) {
  if (!existsSync(envFilePath)) return null;

  const line = readFileSync(envFilePath, "utf8")
    .split(/\r?\n/)
    .find((item) => item.startsWith(`${key}=`));

  if (!line) return null;

  return line
    .slice(key.length + 1)
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

const result = runVercel(listArgs);

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

const tempDir = mkdtempSync(path.join(os.tmpdir(), "nutritail-vercel-env-"));
const tempEnvPath = path.join(tempDir, ".env.production.local");
const pullArgs =
  process.platform === "win32"
    ? [
        "/d",
        "/s",
        "/c",
        `npx.cmd vercel env pull ${tempEnvPath} --environment=production --yes`,
      ]
    : ["vercel", "env", "pull", tempEnvPath, "--environment=production", "--yes"];

const pullResult = spawnSync(command, pullArgs, {
  cwd: process.cwd(),
  encoding: "utf8",
  shell: false,
});

try {
  if (pullResult.error) {
    writeReport({
      status: "FAIL",
      failed: true,
      details: [`Could not pull Vercel env values: ${pullResult.error.message}`],
    });
    console.error(`Could not pull Vercel env values: ${pullResult.error.message}`);
    process.exit(1);
  }

  if (pullResult.status !== 0) {
    writeReport({
      status: "FAIL",
      failed: true,
      details: [
        `Vercel env pull exited with code ${pullResult.status}.`,
        "Run `npx.cmd vercel login` and retry if this machine is not authenticated.",
      ],
    });
    console.error("Vercel env pull failed.");
    process.exit(1);
  }

  const openAiValue = getPulledEnvValue(tempEnvPath, "OPENAI_API_KEY");
  if (!openAiValue) {
    writeReport({
      status: "FAIL",
      failed: true,
      details: [
        "OPENAI_API_KEY exists in Vercel Production but its pulled value is empty.",
        "Set a non-empty Production value in Vercel before relying on OpenAI runtime behavior.",
      ],
    });
    console.error("OPENAI_API_KEY exists in Vercel Production but its pulled value is empty.");
    process.exit(1);
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

writeReport({
  status: "PASS",
  failed: false,
  details: [
    "OPENAI_API_KEY is configured as an encrypted Production environment variable.",
    "A temporary env pull confirmed the value is non-empty without printing or storing it.",
  ],
});

console.log("Vercel OpenAI env QA passed.");
