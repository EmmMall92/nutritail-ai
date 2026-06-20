import { spawnSync } from "node:child_process";

const CHUNKS = [
  "101-120",
  "121-140",
  "141-160",
  "161-180",
  "181-200",
];

const failures = [];

for (const chunk of CHUNKS) {
  const result = spawnSync("npm run qa:dog-chatbot-live-cases", {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NUTRITAIL_QA_OPENAI: process.env.NUTRITAIL_QA_OPENAI ?? "0",
      NUTRITAIL_QA_CASE_IDS: chunk,
      NUTRITAIL_QA_REPORT_PATH: `reports/dog_chatbot_live_cases_${chunk}.md`,
    },
    shell: true,
    stdio: "inherit",
  });

  if (result.error || result.status !== 0) {
    failures.push(chunk);
  }
}

if (failures.length > 0) {
  console.error(
    `Dog edge live chunks failed for: ${failures.join(", ")}`
  );
  process.exit(1);
}

console.log("Dog edge live chunks passed.");
