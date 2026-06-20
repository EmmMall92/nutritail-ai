import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

type SourceMapEntry = {
  source_id?: string;
  source_collection_id?: string;
  display_name?: string;
  local_folder?: string;
  policy?: {
    allowed_use?: string[];
    copyright_rule?: string;
    ranking_rule?: string;
  };
  source_map?: Array<{
    source_id?: string;
    files?: string[];
    topics?: string[];
    target_rule_files?: string[];
  }>;
  chapter_map?: Array<{
    file?: string;
    topics?: string[];
    target_rule_files?: string[];
  }>;
};

const sourceDir = "data/sources";
const sourceMapFiles = existsSync(sourceDir)
  ? readdirSync(sourceDir)
      .filter((file) => file.endsWith("source-map.json"))
      .map((file) => path.join(sourceDir, file))
      .sort()
  : [];

const allowedUses = new Set([
  "decision_rules",
  "nutrition_logic",
  "disease_nutrition",
  "growth_nutrition",
  "senior_nutrition",
]);

const knownRuleTargets = new Set([
  "energyRules",
  "proteinRules",
  "fatRules",
  "carbohydrateRules",
  "vitaminMineralRules",
  "growthRules",
  "obesityRules",
  "renalRules",
  "urinaryRules",
  "giRules",
  "seniorRules",
  "feedingRules",
  "ingredientRules",
  "foodEvaluationEngine",
  "safetyRules",
  "responsePlanner",
  "dialoguePlaybook",
  "intentDetector",
  "petDataCompleteness",
  "humanTone",
]);

const failures: string[] = [];

function parseFile(filePath: string) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as SourceMapEntry;
  } catch (error) {
    failures.push(`${filePath}: invalid JSON (${(error as Error).message}).`);
    return null;
  }
}

function checkArray(value: unknown, label: string, filePath: string) {
  if (!Array.isArray(value) || value.length === 0) {
    failures.push(`${filePath}: ${label} must be a non-empty array.`);
    return [];
  }

  return value;
}

if (sourceMapFiles.length === 0) {
  failures.push("No nutrition source-map files found in data/sources.");
}

for (const filePath of sourceMapFiles) {
  const parsed = parseFile(filePath);
  if (!parsed) continue;

  const sourceId = parsed.source_id ?? parsed.source_collection_id;
  if (!sourceId) failures.push(`${filePath}: source_id or source_collection_id is required.`);
  if (!parsed.display_name) failures.push(`${filePath}: display_name is required.`);
  if (!parsed.local_folder) failures.push(`${filePath}: local_folder is required.`);
  if (!parsed.policy?.copyright_rule?.toLowerCase().includes("do not copy")) {
    failures.push(`${filePath}: policy.copyright_rule must explicitly forbid copied source text.`);
  }

  for (const use of checkArray(parsed.policy?.allowed_use, "policy.allowed_use", filePath)) {
    if (!allowedUses.has(String(use))) {
      failures.push(`${filePath}: unknown allowed_use ${String(use)}.`);
    }
  }

  const mapEntries = [
    ...(parsed.source_map ?? []).map((entry) => ({
      label: entry.source_id ?? sourceId ?? "source_map_entry",
      files: entry.files ?? [],
      topics: entry.topics ?? [],
      target_rule_files: entry.target_rule_files ?? [],
    })),
    ...(parsed.chapter_map ?? []).map((entry) => ({
      label: entry.file ?? "chapter_map_entry",
      files: entry.file ? [entry.file] : [],
      topics: entry.topics ?? [],
      target_rule_files: entry.target_rule_files ?? [],
    })),
  ];

  if (mapEntries.length === 0) {
    failures.push(`${filePath}: source_map or chapter_map must contain at least one entry.`);
  }

  for (const entry of mapEntries) {
    if (entry.files.length === 0) failures.push(`${filePath}:${entry.label}: file(s) are required.`);
    if (entry.topics.length === 0) failures.push(`${filePath}:${entry.label}: topics are required.`);
    if (entry.target_rule_files.length === 0) {
      failures.push(`${filePath}:${entry.label}: target_rule_files are required.`);
    }

    for (const target of entry.target_rule_files) {
      if (!knownRuleTargets.has(String(target))) {
        failures.push(`${filePath}:${entry.label}: unknown target rule file ${String(target)}.`);
      }
    }
  }
}

console.log(
  JSON.stringify(
    {
      files_checked: sourceMapFiles.length,
      passed: failures.length === 0,
      failures,
    },
    null,
    2
  )
);

if (failures.length > 0) process.exit(1);
