import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "npm.cmd" : "npm";

const result = spawnSync(command, ["run", "qa:cat-chatbot-live-cases"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    NUTRITAIL_QA_CAT_FIXTURE_PATH: "data/evals/chatbot-extra-cases-cat-001-500.json",
    NUTRITAIL_QA_REPORT_PATH: "reports/cat_chatbot_live_cases_1-500.md",
  },
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
