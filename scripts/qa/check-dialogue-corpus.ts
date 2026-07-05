import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  customerIntents,
  customerKnowledgeLevels,
  customerTones,
  dialogueCorpusFiles,
  dialogueDifficulties,
  dialogueLanguages,
  dialogueSpecies,
  requiredMustNotDo,
  type DialogueCorpusItem,
} from "../../data/dialogue-corpus/schema";

const corpusRoot = "data/dialogue-corpus";
const expectedTotal = 100;
const expectedDistribution = {
  dogRecommendation: 20,
  catRecommendation: 20,
  puppies: 10,
  kittens: 10,
  emergency: 10,
  allergySensitivity: 10,
  comparisons: 10,
  feedingTransition: 10,
};

const failures: string[] = [];
const seenIds = new Set<string>();
const allDialogues: Array<DialogueCorpusItem & { file: string }> = [];

function fail(message: string) {
  failures.push(message);
}

function isOneOf<T extends readonly string[]>(value: unknown, allowed: T) {
  return typeof value === "string" && allowed.includes(value);
}

function parseFile(file: string) {
  const filePath = path.join(corpusRoot, file);
  if (!existsSync(filePath)) {
    fail(`Missing corpus file: ${file}`);
    return [];
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
    if (!Array.isArray(parsed)) {
      fail(`${file} must contain a JSON array.`);
      return [];
    }
    return parsed as DialogueCorpusItem[];
  } catch (error) {
    fail(`${file} is not valid JSON: ${(error as Error).message}`);
    return [];
  }
}

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function hasExpectedFacts(item: DialogueCorpusItem, file: string) {
  const facts = item.pet_facts_expected;
  if (!facts || typeof facts !== "object") {
    fail(`${file}:${item.id} missing pet_facts_expected.`);
    return false;
  }

  const requiredArrays = [
    "health_conditions",
    "allergies",
    "sensitivities",
    "food_preferences",
    "urgency_flags",
  ] as const;

  for (const key of requiredArrays) {
    if (!hasStringArray(facts[key])) {
      fail(`${file}:${item.id} pet_facts_expected.${key} must be a string array.`);
      return false;
    }
  }

  if (facts.species !== null && !dialogueSpecies.includes(facts.species)) {
    fail(`${file}:${item.id} has invalid expected species: ${facts.species}.`);
    return false;
  }

  const hasUsefulFact =
    facts.species ||
    facts.breed ||
    facts.age_months !== null ||
    facts.age_years !== null ||
    facts.weight_kg !== null ||
    facts.health_conditions.length > 0 ||
    facts.allergies.length > 0 ||
    facts.sensitivities.length > 0 ||
    facts.food_preferences.length > 0 ||
    facts.urgency_flags.length > 0;

  if (!hasUsefulFact) {
    fail(`${file}:${item.id} expected facts are empty.`);
  }

  return hasUsefulFact;
}

function validateItem(item: DialogueCorpusItem, file: string) {
  if (!nonEmptyString(item.id)) fail(`${file} has item with missing id.`);
  if (seenIds.has(item.id)) fail(`Duplicate dialogue id: ${item.id}.`);
  seenIds.add(item.id);

  if (!dialogueSpecies.includes(item.species)) fail(`${file}:${item.id} invalid species.`);
  if (!nonEmptyString(item.category)) fail(`${file}:${item.id} missing category.`);
  if (!isOneOf(item.difficulty, dialogueDifficulties)) fail(`${file}:${item.id} invalid difficulty.`);
  if (!isOneOf(item.language, dialogueLanguages)) fail(`${file}:${item.id} invalid language.`);

  const profile = item.customer_profile;
  if (!profile || typeof profile !== "object") {
    fail(`${file}:${item.id} missing customer_profile.`);
  } else {
    if (!isOneOf(profile.intent, customerIntents)) fail(`${file}:${item.id} invalid intent.`);
    if (!isOneOf(profile.knowledge_level, customerKnowledgeLevels)) {
      fail(`${file}:${item.id} invalid knowledge_level.`);
    }
    if (!isOneOf(profile.tone, customerTones)) fail(`${file}:${item.id} invalid tone.`);
  }

  hasExpectedFacts(item, file);

  if (!Array.isArray(item.conversation) || item.conversation.length === 0) {
    fail(`${file}:${item.id} has empty conversation.`);
  } else {
    const hasUserTurn = item.conversation.some((turn) => turn.role === "user" && nonEmptyString(turn.content));
    const hasExpectedBehavior = item.conversation.some(
      (turn) => turn.role === "assistant_expected_behavior" && nonEmptyString(turn.content)
    );
    if (!hasUserTurn) fail(`${file}:${item.id} must include at least one user turn.`);
    if (!hasExpectedBehavior) fail(`${file}:${item.id} must include assistant_expected_behavior.`);
  }

  const behavior = item.expected_behavior;
  if (!behavior || typeof behavior !== "object") {
    fail(`${file}:${item.id} missing expected_behavior.`);
  } else {
    for (const rule of requiredMustNotDo) {
      if (!behavior.must_not_do?.includes(rule)) {
        fail(`${file}:${item.id} must_not_do missing ${rule}.`);
      }
    }
    if (behavior.must_not_do.includes("allow_openai_to_invent_foods")) {
      fail(`${file}:${item.id} must not expect OpenAI to invent foods.`);
    }
    if (behavior.must_not_do.includes("allow_openai_to_override_ranking")) {
      fail(`${file}:${item.id} must not expect OpenAI to override NutriTail ranking.`);
    }
  }

  const evaluation = item.evaluation;
  if (!evaluation || typeof evaluation !== "object") {
    fail(`${file}:${item.id} missing evaluation.`);
  } else {
    const arrayFields = [
      "fact_extraction_must_include",
      "safety_must_trigger",
      "retrieval_must_filter_by",
      "ranking_should_prefer",
      "answer_quality_checks",
    ] as const;
    for (const key of arrayFields) {
      if (!hasStringArray(evaluation[key])) {
        fail(`${file}:${item.id} evaluation.${key} must be a string array.`);
      }
    }
    const answerChecks = evaluation.answer_quality_checks ?? [];
    for (const requiredCheck of [
      "Greek natural tone",
      "clear recommendation",
      "no back-office wording",
      "mentions uncertainty when data is missing",
    ]) {
      if (!answerChecks.includes(requiredCheck)) {
        fail(`${file}:${item.id} answer_quality_checks missing "${requiredCheck}".`);
      }
    }
  }

  if (item.category === "emergency") {
    if (item.expected_behavior?.should_interrupt !== true) {
      fail(`${file}:${item.id} emergency dialogue must set should_interrupt=true.`);
    }
    if ((item.evaluation?.safety_must_trigger ?? []).length === 0) {
      fail(`${file}:${item.id} emergency dialogue must include safety_must_trigger.`);
    }
  }

  if (item.category === "allergy") {
    const facts = item.pet_facts_expected;
    if ((facts.allergies ?? []).length === 0 && (facts.sensitivities ?? []).length === 0) {
      fail(`${file}:${item.id} allergy dialogue must include allergies or sensitivities.`);
    }
  }

  if (item.category === "comparison") {
    const brandsOrFoods = item.pet_facts_expected.food_preferences ?? [];
    if (brandsOrFoods.length < 2) {
      fail(`${file}:${item.id} comparison dialogue must include at least two brands or foods.`);
    }
  }

  if (["feeding", "transition"].includes(item.category)) {
    const hasWeight = item.pet_facts_expected.weight_kg !== null;
    if (!hasWeight && item.expected_behavior?.should_ask_followup !== true) {
      fail(`${file}:${item.id} feeding/transition dialogue must include weight or ask-followup requirement.`);
    }
  }
}

for (const file of dialogueCorpusFiles) {
  for (const item of parseFile(file)) {
    allDialogues.push({ ...item, file });
    validateItem(item, file);
  }
}

const actualFiles = new Set<string>();
function collectJsonFiles(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsonFiles(fullPath);
    } else if (entry.name.endsWith(".json")) {
      actualFiles.add(path.relative(corpusRoot, fullPath).replace(/\\/g, "/"));
    }
  }
}
collectJsonFiles(corpusRoot);

for (const file of actualFiles) {
  if (!dialogueCorpusFiles.includes(file as (typeof dialogueCorpusFiles)[number])) {
    fail(`Unexpected dialogue corpus JSON file: ${file}.`);
  }
}

const counts = {
  total: allDialogues.length,
  dogRecommendation: allDialogues.filter((item) => item.species === "dog" && item.category === "recommendation").length,
  catRecommendation: allDialogues.filter((item) => item.species === "cat" && item.category === "recommendation").length,
  puppies: allDialogues.filter((item) => item.category === "puppy").length,
  kittens: allDialogues.filter((item) => item.category === "kitten").length,
  emergency: allDialogues.filter((item) => item.category === "emergency").length,
  allergySensitivity: allDialogues.filter((item) => item.category === "allergy").length,
  comparisons: allDialogues.filter((item) => item.category === "comparison").length,
  feedingTransition: allDialogues.filter((item) => ["feeding", "transition"].includes(item.category)).length,
};

if (counts.total !== expectedTotal) fail(`Expected ${expectedTotal} dialogues, found ${counts.total}.`);

for (const [key, expected] of Object.entries(expectedDistribution)) {
  const actual = counts[key as keyof typeof counts];
  if (actual !== expected) {
    fail(`Expected ${expected} ${key} dialogues, found ${actual}.`);
  }
}

const languageCounts = allDialogues.reduce<Record<string, number>>((acc, item) => {
  acc[item.language] = (acc[item.language] ?? 0) + 1;
  return acc;
}, {});

if ((languageCounts.greeklish ?? 0) < 5) fail("Corpus must include at least 5 Greeklish dialogues.");
if ((languageCounts.mixed ?? 0) < 3) fail("Corpus must include at least 3 mixed-language dialogues.");

if (failures.length > 0) {
  console.error(
    JSON.stringify(
      {
        status: "failed",
        checked: allDialogues.length,
        counts,
        languageCounts,
        failures,
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: "passed",
      checked: allDialogues.length,
      files: dialogueCorpusFiles.length,
      counts,
      languageCounts,
      categories: [...new Set(allDialogues.map((item) => item.category))].sort(),
    },
    null,
    2
  )
);
