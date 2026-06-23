import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

type BulkChatbotCase = {
  id?: number | string;
  species?: "dog" | "cat" | string;
  locale?: "el-GR" | "en-GB" | string;
  prompt?: string;
  message?: string;
  expected?: {
    species?: "dog" | "cat" | string;
  };
  goal?: string;
  safety?: string;
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
const isoGreekDecoder = new TextDecoder("iso-8859-7");
const isoGreekReverseMap = new Map<string, number>();

for (let byte = 0; byte <= 255; byte += 1) {
  isoGreekReverseMap.set(isoGreekDecoder.decode(Uint8Array.of(byte)), byte);
}

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
    return JSON.parse(readFileSync(filePath, "utf8")) as BulkChatbotCaseFile | BulkChatbotCase[];
  } catch (error) {
    throw new Error(`${filePath} is not valid JSON: ${(error as Error).message}`);
  }
}

function normalizedPrompt(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function repairLegacyGreekMojibake(value: string) {
  if (!damagedTextPattern.test(value)) return value;

  const bytes: number[] = [];
  for (const char of value) {
    const byte = isoGreekReverseMap.get(char);
    if (byte !== undefined) {
      bytes.push(byte);
    } else if (char.charCodeAt(0) <= 255) {
      bytes.push(char.charCodeAt(0));
    } else {
      return value;
    }
  }

  const repaired = new TextDecoder("utf-8").decode(Uint8Array.from(bytes));
  return repaired.includes("\ufffd") ? value : repaired;
}

function normalizeParsedCases(parsed: BulkChatbotCaseFile | BulkChatbotCase[]) {
  return Array.isArray(parsed) ? parsed : parsed.cases;
}

function isLegacyArrayFile(parsed: BulkChatbotCaseFile | BulkChatbotCase[]) {
  return Array.isArray(parsed);
}

function expectedSignalsFor(item: BulkChatbotCase, species: unknown) {
  if (Array.isArray(item.expectedSignals) && item.expectedSignals.length > 0) {
    return item.expectedSignals;
  }

  const signals = new Set<string>();
  if (String(species)) signals.add(String(species));
  if (item.goal && item.goal !== "general") signals.add(item.goal);
  return [...signals];
}

function expectedSafetyFor(item: BulkChatbotCase) {
  if (item.expectedSafetyLevel) return item.expectedSafetyLevel;
  if (item.safety === "emergency") return "urgent";
  if (item.safety === "vet_referral") return "caution";
  if (item.safety === "normal") return "normal";
  return undefined;
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

  let parsed: BulkChatbotCaseFile | BulkChatbotCase[];
  try {
    parsed = parseJson(filePath);
  } catch (error) {
    failures.push((error as Error).message);
    continue;
  }

  if (!isLegacyArrayFile(parsed)) {
    if (!parsed.source) failures.push(`${filePath}: source is required.`);
    if (!parsed.purpose) failures.push(`${filePath}: purpose is required.`);
    if (!parsed.batch?.id) failures.push(`${filePath}: batch.id is required.`);
  }

  const cases = normalizeParsedCases(parsed);
  if (!Array.isArray(cases) || cases.length === 0) {
    failures.push(`${filePath}: cases must contain at least one case.`);
    continue;
  }

  for (const item of cases) {
    const label = `${filePath}:${item.id ?? "(missing id)"}`;
    const id = item.id == null ? "" : String(item.id);
    const prompt = repairLegacyGreekMojibake(String(item.prompt ?? item.message ?? ""));
    const species = item.species ?? item.expected?.species;
    const locale = item.locale ?? "el-GR";
    const expectedSignals = expectedSignalsFor(item, species);
    const expectedSafetyLevel = expectedSafetyFor(item);
    const expectedResponseMustMention = item.expectedResponseMustMention;

    if (!id.trim()) failures.push(`${label}: id is required.`);
    if (id && seenIds.has(`${filePath}:${id}`)) failures.push(`${label}: duplicate id.`);
    if (id) seenIds.add(`${filePath}:${id}`);

    if (!allowedSpecies.has(String(species))) {
      failures.push(`${label}: species must be dog or cat.`);
    }

    if (!allowedLocales.has(String(locale))) {
      failures.push(`${label}: locale must be el-GR or en-GB.`);
    }

    if (!prompt.trim()) failures.push(`${label}: prompt is required.`);
    if (damagedTextPattern.test(prompt)) {
      failures.push(`${label}: prompt appears to contain mojibake or replacement characters.`);
    }

    const promptKey = normalizedPrompt(prompt);
    if (id && promptKey && !seenPrompts.has(`${filePath}:${promptKey}`)) {
      seenPrompts.set(`${filePath}:${promptKey}`, id);
    }

    if (expectedSignals.length === 0) {
      failures.push(`${label}: expectedSignals must contain at least one signal.`);
    }

    if (!allowedSafetyLevels.has(String(expectedSafetyLevel))) {
      failures.push(`${label}: expectedSafetyLevel must be normal, caution, or urgent.`);
    }

    if (expectedResponseMustMention !== undefined && !Array.isArray(expectedResponseMustMention)) {
      failures.push(`${label}: expectedResponseMustMention must be an array when provided.`);
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
