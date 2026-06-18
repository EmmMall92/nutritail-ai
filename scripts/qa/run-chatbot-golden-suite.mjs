import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const reportPath =
  process.env.NUTRITAIL_CHATBOT_GOLDEN_SUITE_REPORT ||
  "reports/chatbot_golden_suite.md";

const checks = [
  {
    name: "AI intake golden cases",
    command: "npm.cmd",
    args: ["run", "qa:ai-intake"],
    covers: "OpenAI/fallback fact extraction, pet name cleanup, preference parsing, weight limits.",
  },
  {
    name: "Dog edge fixture 101-200",
    command: "npm.cmd",
    args: ["run", "qa:dog-edge-fixture"],
    covers: "User-supplied dog cases 101-200 fixture structure and required expectations.",
  },
  {
    name: "Dog golden coverage audit",
    command: "npm.cmd",
    args: ["run", "audit:dog-chatbot-golden-coverage"],
    covers: "200 live runner ids, fixture coverage, duplicates, and damaged prompt detection.",
  },
  {
    name: "Live dog chatbot 200 cases",
    command: "npm.cmd",
    args: ["run", "qa:dog-chatbot-live-cases"],
    covers: "Live extraction, safety expectations, Food V2 candidates, and recommendation guards.",
  },
  {
    name: "Customer-facing recommendation copy",
    command: "npm.cmd",
    args: ["run", "qa:chatbot-customer-recommendations"],
    covers: "No back-office wording in customer chatbot recommendations and card action flow.",
  },
];

function runCheck(check) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const command =
      process.platform === "win32" ? "cmd.exe" : check.command;
    const args =
      process.platform === "win32"
        ? ["/d", "/s", "/c", [check.command, ...check.args].join(" ")]
        : check.args;
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      shell: false,
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("close", (code) => {
      resolve({
        ...check,
        status: code === 0 ? "pass" : "fail",
        exitCode: code,
        durationMs: Date.now() - startedAt,
        stdout,
        stderr,
      });
    });
  });
}

function summarizeOutput(value) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  return lines.slice(-12).join("\n");
}

async function main() {
  const results = [];

  for (const check of checks) {
    console.log(`\n=== ${check.name} ===`);
    const result = await runCheck(check);
    results.push(result);

    if (result.status !== "pass") {
      break;
    }
  }

  const failed = results.filter((result) => result.status !== "pass");
  const lines = [
    "# Chatbot Golden Suite",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Checks run: ${results.length}/${checks.length}`,
    `- Passed: ${results.filter((result) => result.status === "pass").length}`,
    `- Failed: ${failed.length}`,
    "",
    "## Coverage",
    "",
    ...checks.map((check) => `- ${check.name}: ${check.covers}`),
    "",
    "## Results",
    "",
    ...results.flatMap((result) => [
      `### ${result.name}`,
      "",
      `- Status: ${result.status}`,
      `- Duration: ${(result.durationMs / 1000).toFixed(1)}s`,
      `- Command: \`${[result.command, ...result.args].join(" ")}\``,
      "",
      "```text",
      summarizeOutput(`${result.stdout}\n${result.stderr}`) || "(no output)",
      "```",
      "",
    ]),
  ];

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${lines.join("\n")}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        checks: results.length,
        passed: results.filter((result) => result.status === "pass").length,
        failed: failed.length,
        report: reportPath,
      },
      null,
      2
    )
  );

  if (failed.length > 0 || results.length !== checks.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
