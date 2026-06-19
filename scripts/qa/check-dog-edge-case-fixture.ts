import { readFileSync } from "node:fs";

type DogEdgeCase = {
  id?: string;
  locale?: string;
  prompt?: string;
  expectedSignals?: string[];
  expectedSafetyLevel?: string;
  expectedResponseMustMention?: string[];
};

const path = "data/evals/chatbot-dog-edge-cases-101-200.json";
const liveRunnerPath = "scripts/qa/run-dog-chatbot-live-cases.ts";
const raw = readFileSync(path, "utf8");
const liveRunnerSource = readFileSync(liveRunnerPath, "utf8");
const parsed = JSON.parse(raw) as { cases?: DogEdgeCase[] };
const cases = parsed.cases ?? [];
const failures: string[] = [];

function extractLiveRunnerPrompts(source: string) {
  const prompts = new Map<number, string>();

  for (const match of source.matchAll(/\{\s*id:\s*(1\d\d|200),\s*message:\s*"([^"]*)"/gu)) {
    prompts.set(Number(match[1]), match[2]);
  }

  return prompts;
}

if (cases.length !== 100) {
  failures.push(`Expected 100 cases, found ${cases.length}.`);
}

const mojibakePattern = /Ξ|Ο|Ο‡|Οƒ|Ο€|Ο„|Ο‰|Ο…|Ο|Ο|Β®/u;
const seenIds = new Set<number>();
const liveRunnerPrompts = extractLiveRunnerPrompts(liveRunnerSource);

for (const item of cases) {
  const numericId = Number(String(item.id ?? "").match(/^dog-(\d+)-/)?.[1]);

  if (!Number.isInteger(numericId) || numericId < 101 || numericId > 200) {
    failures.push(`Invalid case id: ${item.id ?? "(missing)"}.`);
    continue;
  }

  if (seenIds.has(numericId)) failures.push(`Duplicate case number: ${numericId}.`);
  seenIds.add(numericId);

  if (item.locale !== "el-GR") failures.push(`Case ${numericId} has unexpected locale ${item.locale}.`);
  if (!item.prompt?.trim()) failures.push(`Case ${numericId} has an empty prompt.`);
  if (liveRunnerPrompts.get(numericId) !== item.prompt) {
    failures.push(`Case ${numericId} prompt does not match the live runner prompt.`);
  }
  if (mojibakePattern.test(item.prompt ?? "")) {
    failures.push(`Case ${numericId} prompt contains mojibake: ${item.prompt}`);
  }
  if (!Array.isArray(item.expectedSignals) || item.expectedSignals.length === 0) {
    failures.push(`Case ${numericId} is missing expectedSignals.`);
  }
  if (!item.expectedSafetyLevel) failures.push(`Case ${numericId} is missing expectedSafetyLevel.`);
  if (!Array.isArray(item.expectedResponseMustMention)) {
    failures.push(`Case ${numericId} is missing expectedResponseMustMention.`);
  }
}

for (let id = 101; id <= 200; id += 1) {
  if (!seenIds.has(id)) failures.push(`Missing case number: ${id}.`);
  if (!liveRunnerPrompts.has(id)) failures.push(`Live runner is missing case number: ${id}.`);
}

if (failures.length > 0) {
  console.error("Dog edge case fixture QA failed:");
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Dog edge case fixture QA passed.");
