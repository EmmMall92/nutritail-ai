import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH || "reports/openai_full_proof_qa.md";
const shouldRunChecks = process.argv.includes("--run");
const requirePass = process.env.NUTRITAIL_QA_REQUIRE_OPENAI_FULL_PROOF === "1";

const checks = [
  {
    id: "openai_intake_smoke",
    label: "OpenAI intake smoke",
    command: "npm.cmd run qa:openai-intake-smoke",
    report: "reports/openai_intake_smoke_qa.md",
    checkedPattern: /-\s*Cases checked:\s*(\d+)/i,
    proof:
      "OpenAI can extract structured pet facts through NutriTail's prompt contract without ranking foods.",
    pending:
      "Set OPENAI_API_KEY or NUTRITAIL_QA_OPENAI_API_KEY_FILE to a local ignored key file.",
  },
  {
    id: "account_chatbot_extract_live_route",
    label: "Authenticated chatbot extract live route",
    command: "npm.cmd run qa:account-chatbot-extract-live-route",
    report: "reports/account_chatbot_extract_live_route_qa.md",
    checkedPattern: /-\s*Routes checked:\s*(\d+)/i,
    proof:
      "The live authenticated chatbot intake route can call the production OpenAI-backed extraction path.",
    pending:
      "Set NUTRITAIL_QA_AUTH_COOKIE or NUTRITAIL_QA_AUTH_COOKIE_FILE to a local ignored file containing an authenticated QA account Cookie header.",
  },
];

function runCommand(command) {
  const result = spawnSync(command, {
    cwd: process.cwd(),
    env: process.env,
    shell: true,
    stdio: "inherit",
  });

  return result.status ?? 1;
}

function parseNumber(text, pattern) {
  const match = text.match(pattern);
  return match?.[1] == null ? 0 : Number(match[1]);
}

function parseReport(check) {
  if (!existsSync(check.report)) {
    return {
      ...check,
      status: "MISSING",
      checked: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      generated: "missing",
      note: "Evidence report is missing.",
    };
  }

  const text = readFileSync(check.report, "utf8");
  const declaredStatus =
    text.match(/^Status:\s*([^\n\r]+)/im)?.[1]?.trim().toLowerCase() ??
    "unknown";
  const checked = parseNumber(text, check.checkedPattern);
  const passed = parseNumber(text, /-\s*Passed:\s*(\d+)/i);
  const failed = parseNumber(text, /-\s*Failed:\s*(\d+)/i);
  const skipped = parseNumber(text, /-\s*Skipped:\s*(\d+)/i);
  const generated =
    text.match(/^Generated:\s*([^\n\r]+)/im)?.[1]?.trim() ?? "unknown";

  const status =
    failed > 0
      ? "REVIEW"
      : skipped > 0 || declaredStatus === "skipped"
        ? "PENDING"
        : declaredStatus === "completed" && checked > 0 && passed === checked
          ? "PASS"
          : "REVIEW";

  return {
    ...check,
    status,
    checked,
    passed,
    failed,
    skipped,
    generated,
    note: status === "PENDING" ? check.pending : status === "PASS" ? check.proof : declaredStatus,
  };
}

if (shouldRunChecks) {
  for (const check of checks) {
    console.log(`\n=== ${check.label} ===`);
    const status = runCommand(check.command);
    if (status !== 0) {
      console.error(`${check.label} exited with status ${status}.`);
    }
  }
}

const parsedChecks = checks.map(parseReport);
const reviewChecks = parsedChecks.filter((check) => check.status === "REVIEW");
const pendingChecks = parsedChecks.filter((check) => check.status === "PENDING" || check.status === "MISSING");
const passedChecks = parsedChecks.filter((check) => check.status === "PASS");
const overallStatus =
  reviewChecks.length > 0 ? "REVIEW" : pendingChecks.length > 0 ? "PENDING" : "PASS";

const lines = [
  "# OpenAI Full Proof QA",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Status: ${overallStatus}`,
  "",
  "This report summarizes the two pieces of evidence required before NutriTail can call OpenAI proof fully complete.",
  "It does not write OpenAI keys, cookies, tokens, raw secrets, or extracted secret values.",
  "",
  "## Summary",
  "",
  `- Checks required: ${parsedChecks.length}`,
  `- Passed: ${passedChecks.length}`,
  `- Pending: ${pendingChecks.length}`,
  `- Review: ${reviewChecks.length}`,
  `- Full OpenAI proof: ${overallStatus === "PASS" ? "PASS" : overallStatus}`,
  "",
  "## Evidence",
  "",
  "| Check | Status | Checked | Passed | Failed | Skipped | Source report | Last run | Note |",
  "| --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- |",
  ...parsedChecks.map(
    (check) =>
      `| ${check.label} | ${check.status} | ${check.checked} | ${check.passed} | ${check.failed} | ${check.skipped} | \`${check.report}\` | ${check.generated} | ${check.note} |`,
  ),
  "",
  "## How To Make This PASS",
  "",
  "1. Put the OpenAI key in a local ignored secret source, for example `NUTRITAIL_QA_OPENAI_API_KEY_FILE`, or export `OPENAI_API_KEY` only for the shell session.",
  "2. Put an authenticated NutriTail account Cookie header in a local ignored file and set `NUTRITAIL_QA_AUTH_COOKIE_FILE`.",
  "3. Run `npm.cmd run qa:openai-full-proof`.",
  "4. Do not commit, print, paste, or screenshot the key or cookie.",
  "",
  "OpenAI still remains limited to fact extraction and final human wording. Food ranking, exclusions, medical safety and nutrient truth stay in NutriTail deterministic code.",
  "",
];

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      status: overallStatus.toLowerCase(),
      passed: passedChecks.length,
      pending: pendingChecks.length,
      review: reviewChecks.length,
      report: reportPath,
    },
    null,
    2,
  ),
);

if (reviewChecks.length > 0 || (requirePass && overallStatus !== "PASS")) {
  process.exitCode = 1;
}
