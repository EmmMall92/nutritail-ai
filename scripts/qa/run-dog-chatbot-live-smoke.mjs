import { spawnSync } from "node:child_process";

const SMOKE_CASE_IDS = [
  2, // sterilised/weight loss senior dog
  4, // large-breed puppy mineral context
  9, // active/agility dog
  10, // chicken sensitivity/allergy
  14, // renal case
  15, // urinary case
  41, // sterilised indoor adult dog
  51, // senior low appetite
  103, // large dog with chicken sensitivity
  105, // large-breed adolescent puppy
  116, // newly sterilised dog
  117, // post-neuter weight gain
  121, // vomiting context
  132, // chronic soft stool
  141, // chicken and turkey allergy
  151, // urinary issue
  152, // struvite history
  153, // oxalate history
  154, // renal disease
  181, // very senior dog
  200, // rescue undernutrition
];

const command = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(
  command,
  ["run", "qa:dog-chatbot-live-cases"],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NUTRITAIL_QA_OPENAI: "0",
      NUTRITAIL_QA_CASE_IDS: SMOKE_CASE_IDS.join(","),
      NUTRITAIL_QA_REPORT_PATH: "reports/dog_chatbot_live_smoke.md",
    },
    shell: process.platform === "win32",
    stdio: "inherit",
  }
);

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
