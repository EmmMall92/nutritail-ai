import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

type BulkChatbotCase = {
  id?: string;
  species?: "dog" | "cat" | string;
  locale?: "el-GR" | "en-GB" | string;
  prompt?: string;
  expectedSignals?: string[];
  expectedSafetyLevel?: "normal" | "caution" | "urgent" | string;
  expectedResponseMustMention?: string[];
};

type BulkChatbotCaseFile = {
  source?: string;
  purpose?: string;
  batch?: {
    id?: string;
    species_scope?: string[];
    status?: string;
  };
  cases?: BulkChatbotCase[];
};

const evalDir = "data/evals";
const requiredFiles = ["chatbot-case-intake-template.json"];
const batchPrefix = "chatbot-extra-cases-";
const allowedSpecies = new Set(["dog", "cat"]);
const allowedLocales = new Set(["el-GR", "en-GB"]);
const allowedSafetyLevels = new Set(["normal", "caution", "urgent"]);
const damagedTextPattern = /(?:\?{3,}|\u039e|\u0392\u00ae|\ufffd|\u039f[\u0080-\u00ff])/u;

function intakeFiles() {
  const fromDir = existsSync(evalDir)
    ? readdirSync(evalDir)
        .filter((file) => file.startsWith(batchPrefix) && file.endsWith(".json"))
        .map((file) => path.join(evalDir, file))
    : [];

  return [
    ...requiredFiles.map((file) => path.join(evalDir, file)),
    ...fromDir.sort(),
  ];
}

function parseJson(filePath: string) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as BulkChatbotCaseFile;
  } catch (error) {
    throw new Error(`${filePath} is not valid JSON: ${(error as Error).message}`);
  }
}

function normalizedPrompt(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

const failures: string[] = [];
const seenIds = new Set<string>();
const seenPrompts = new Map<string, string>();
const files = intakeFiles();

for (const filePath of files) {
  if (!existsSync(filePath)) {
    failures.push(`Missing intake file: ${filePath}`);
    continue;
  }

  let parsed: BulkChatbotCaseFile;
  try {
    parsed = parseJson(filePath);
  } catch (error) {
    failures.push((error as Error).message);
    continue;
  }

  if (!parsed.source) failures.push(`${filePath}: source is required.`);
  if (!parsed.purpose) failures.push(`${filePath}: purpose is required.`);
  if (!parsed.batch?.id) failures.push(`${filePath}: batch.id is required.`);
  if (!Array.isArray(parsed.cases) || parsed.cases.length === 0) {
    failures.push(`${filePath}: cases must contain at least one case.`);
    continue;
  }

  for (const item of parsed.cases) {
    const label = `${filePath}:${item.id ?? "(missing id)"}`;
    const prompt = String(item.prompt ?? "");

    if (!item.id?.trim()) failures.push(`${label}: id is required.`);
    if (item.id && seenIds.has(item.id)) failures.push(`${label}: duplicate id.`);
    if (item.id) seenIds.add(item.id);

    if (!allowedSpecies.has(String(item.species))) {
      failures.push(`${label}: species must be dog or cat.`);
    }

    if (!allowedLocales.has(String(item.locale))) {
      failures.push(`${label}: locale must be el-GR or en-GB.`);
    }

    if (!prompt.trim()) failures.push(`${label}: prompt is required.`);
    if (damagedTextPattern.test(prompt)) {
      failures.push(`${label}: prompt appears to contain mojibake or replacement characters.`);
    }

    const promptKey = normalizedPrompt(prompt);
    const existingPromptId = seenPrompts.get(promptKey);
    if (existingPromptId && item.id) {
      failures.push(`${label}: duplicate prompt also used by ${existingPromptId}.`);
    } else if (item.id && promptKey) {
      seenPrompts.set(promptKey, item.id);
    }

    if (!Array.isArray(item.expectedSignals) || item.expectedSignals.length === 0) {
      failures.push(`${label}: expectedSignals must contain at least one signal.`);
    }

    if (!allowedSafetyLevels.has(String(item.expectedSafetyLevel))) {
      failures.push(`${label}: expectedSafetyLevel must be normal, caution, or urgent.`);
    }

    if (
      !Array.isArray(item.expectedResponseMustMention) ||
      item.expectedResponseMustMention.length === 0
    ) {
      failures.push(`${label}: expectedResponseMustMention must contain at least one term.`);
    }
  }
}

console.log(
  JSON.stringify(
    {
      files_checked: files.length,
      cases_checked: seenIds.size,
      passed: failures.length === 0,
      failures,
    },
    null,
    2
  )
);

if (failures.length > 0) process.exit(1);
