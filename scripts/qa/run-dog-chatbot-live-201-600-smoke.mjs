import { spawnSync } from "node:child_process";

const SMOKE_CASE_IDS = [
  201, // picky eater / topper context
  205, // fast eating with regurgitation context
  221, // pregnancy / growth-energy context
  231, // urinary stones context
  261, // underweight / BCS 2/9
  271, // multi-poultry allergy
  281, // hot climate context
  291, // rescue with unknown age
  301, // sterilised toy dog
  321, // sterilised large dog appetite/weight context
  341, // food boredom / change request
  361, // sterilised puppy context
  381, // value request with protein preference
  421, // active/hunting adult
  461, // intact puppy preference context
  501, // tiny puppy
  521, // large-breed puppy
  541, // puppy chicken allergy
  561, // puppy diarrhea after food change
  600, // premium puppy request
];

const command = process.platform === "win32" ? "npm.cmd" : "npm";
const defaultTimeoutMs = 180_000;
const configuredTimeoutMs = Number(
  process.env.NUTRITAIL_DOG_CHATBOT_201_600_SMOKE_TIMEOUT_MS ?? defaultTimeoutMs
);
const timeoutMs =
  Number.isFinite(configuredTimeoutMs) && configuredTimeoutMs > 0
    ? configuredTimeoutMs
    : defaultTimeoutMs;

const result = spawnSync(command, ["run", "qa:dog-chatbot-live-cases"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NUTRITAIL_QA_OPENAI: "0",
    NUTRITAIL_QA_DOG_FIXTURE_PATH:
      "data/evals/chatbot-extra-cases-dog-201-600.json",
    NUTRITAIL_QA_CASE_IDS: SMOKE_CASE_IDS.join(","),
    NUTRITAIL_QA_REPORT_PATH: "reports/dog_chatbot_live_201_600_smoke.md",
  },
  shell: process.platform === "win32",
  stdio: "inherit",
  timeout: timeoutMs,
  killSignal: "SIGTERM",
});

if (result.error) {
  console.error(result.error);
}

if (result.error?.code === "ETIMEDOUT") {
  console.error(
    `Dog chatbot 201-600 live smoke exceeded ${(timeoutMs / 1000).toFixed(0)}s timeout.`
  );
}

process.exit(result.status ?? 1);
