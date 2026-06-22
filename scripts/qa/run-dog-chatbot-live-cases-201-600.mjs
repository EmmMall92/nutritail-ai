import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "npm.cmd" : "npm";

const result = spawnSync(command, ["run", "qa:dog-chatbot-live-cases"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    NUTRITAIL_QA_DOG_FIXTURE_PATH: "data/evals/chatbot-extra-cases-dog-201-600.json",
    NUTRITAIL_QA_REPORT_PATH: "reports/dog_chatbot_live_cases_201-600.md",
  },
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
