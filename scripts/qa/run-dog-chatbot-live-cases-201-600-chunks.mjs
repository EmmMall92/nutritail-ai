import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "npm.cmd" : "npm";
const start = Number(process.env.NUTRITAIL_QA_DOG_CHUNK_START ?? 201);
const end = Number(process.env.NUTRITAIL_QA_DOG_CHUNK_END ?? 600);
const size = Number(process.env.NUTRITAIL_QA_DOG_CHUNK_SIZE ?? 25);
const timeoutMs = Number(process.env.NUTRITAIL_QA_CHUNK_TIMEOUT_MS ?? 180000);

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

if (!isPositiveInteger(start) || !isPositiveInteger(end) || !isPositiveInteger(size)) {
  console.error("Dog live QA chunk bounds must be positive integers.");
  process.exit(1);
}

const min = Math.min(start, end);
const max = Math.max(start, end);
const failures = [];

for (let chunkStart = min; chunkStart <= max; chunkStart += size) {
  const chunkEnd = Math.min(chunkStart + size - 1, max);
  const chunk = `${chunkStart}-${chunkEnd}`;
  const reportPath = `reports/dog_chatbot_live_cases_${chunk}.md`;

  console.log(`Running dog live QA chunk ${chunk}...`);

  const result = spawnSync(`${command} run qa:dog-chatbot-live-cases`, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NUTRITAIL_QA_OPENAI: process.env.NUTRITAIL_QA_OPENAI ?? "0",
      NUTRITAIL_QA_DOG_FIXTURE_PATH:
        process.env.NUTRITAIL_QA_DOG_FIXTURE_PATH ??
        "data/evals/chatbot-extra-cases-dog-201-600.json",
      NUTRITAIL_QA_CASE_IDS: chunk,
      NUTRITAIL_QA_REPORT_PATH: reportPath,
    },
    shell: true,
    stdio: "inherit",
    timeout: timeoutMs,
  });

  if (result.error || result.status !== 0) {
    failures.push({
      chunk,
      status: result.status,
      signal: result.signal,
      error: result.error?.message,
    });
  }
}

if (failures.length > 0) {
  console.error("Dog 201-600 live QA chunks need review:");
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}

console.log("Dog 201-600 live QA chunks passed.");
