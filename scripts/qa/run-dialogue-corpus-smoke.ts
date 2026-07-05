import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  dialogueCorpusFiles,
  type DialogueCorpusItem,
  type DialoguePetFactsExpected,
} from "../../data/dialogue-corpus/schema";

type SmokeResult = {
  id: string;
  file: string;
  category: string;
  species: string;
  status: "pass" | "review";
  checks: string[];
  warnings: string[];
};

const corpusRoot = "data/dialogue-corpus";
const reportPath =
  process.env.NUTRITAIL_DIALOGUE_CORPUS_SMOKE_REPORT ??
  "reports/dialogue_corpus_smoke.md";
const caseLimitRaw = Number(process.env.NUTRITAIL_DIALOGUE_CORPUS_SMOKE_LIMIT ?? "0");
const caseLimit = Number.isFinite(caseLimitRaw) && caseLimitRaw > 0 ? caseLimitRaw : null;

function loadCorpus() {
  const rows: Array<DialogueCorpusItem & { file: string }> = [];

  for (const file of dialogueCorpusFiles) {
    const filePath = path.join(corpusRoot, file);
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as DialogueCorpusItem[];
    rows.push(...parsed.map((item) => ({ ...item, file })));
  }

  return caseLimit ? rows.slice(0, caseLimit) : rows;
}

function hasFact(facts: DialoguePetFactsExpected, field: keyof DialoguePetFactsExpected) {
  const value = facts[field];
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  return value !== null && value !== undefined;
}

function includesAny(values: string[], patterns: RegExp[]) {
  const text = values.join(" ").toLowerCase();
  return patterns.some((pattern) => pattern.test(text));
}

function needsLargeBreedPuppyMineralLogic(facts: DialoguePetFactsExpected) {
  const adultWeight = facts.expected_adult_weight_kg ?? facts.weight_kg ?? 0;
  const breedText = `${facts.breed ?? ""} ${(facts.food_preferences ?? []).join(" ")}`.toLowerCase();

  return (
    facts.life_stage === "puppy" &&
    (adultWeight >= 25 || /\b(large|giant|cane corso|great dane|rottweiler|labrador|german shepherd)\b/i.test(breedText))
  );
}

function evaluateDialogue(item: DialogueCorpusItem & { file: string }): SmokeResult {
  const checks: string[] = [];
  const warnings: string[] = [];
  const facts = item.pet_facts_expected;
  const filters = item.evaluation.retrieval_must_filter_by;
  const ranking = item.evaluation.ranking_should_prefer;
  const rules = item.expected_behavior.required_rules;
  const tags = item.expected_behavior.required_tags;

  for (const field of item.evaluation.fact_extraction_must_include) {
    const typedField = field as keyof DialoguePetFactsExpected;
    if (
      item.category === "allergy" &&
      (field === "allergies" || field === "sensitivities") &&
      (facts.allergies.length > 0 || facts.sensitivities.length > 0)
    ) {
      checks.push("fact:allergy_or_sensitivity");
    } else if (typedField in facts && hasFact(facts, typedField)) {
      checks.push(`fact:${field}`);
    } else {
      warnings.push(`Expected fact extraction field is missing or empty: ${field}`);
    }
  }

  if (facts.species && filters.includes("species")) {
    checks.push("retrieval:species");
  } else if (facts.species) {
    warnings.push("Retrieval should explicitly filter by species.");
  }

  if (facts.life_stage && ["recommendation", "puppy", "kitten"].includes(item.category)) {
    if (filters.includes("life_stage")) {
      checks.push("retrieval:life_stage");
    } else {
      warnings.push("Recommendation dialogue should include life_stage retrieval filtering.");
    }
  }

  if (item.category === "emergency") {
    if (item.expected_behavior.should_interrupt) checks.push("safety:interrupt");
    else warnings.push("Emergency dialogue must interrupt normal recommendation flow.");

    if (item.evaluation.safety_must_trigger.length > 0) checks.push("safety:trigger");
    else warnings.push("Emergency dialogue must define safety_must_trigger.");

    if (item.expected_behavior.max_followup_questions_before_recommendation === 0) {
      checks.push("followup:none_before_safety");
    } else {
      warnings.push("Emergency dialogue should not ask routine food follow-up questions before safety guidance.");
    }
  }

  if ((facts.allergies.length > 0 || facts.sensitivities.length > 0) && item.category !== "emergency") {
    if (filters.includes("allergy_conflict") || rules.includes("allergy_conflict_hard_reject")) {
      checks.push("ranking:allergy_conflict");
    } else {
      warnings.push("Allergy/sensitivity dialogue should require allergy conflict filtering.");
    }

    const avoided = [...facts.allergies, ...facts.sensitivities];
    const rankingAvoids = ranking.some((value) => value.startsWith("no_")) || avoided.some((term) => ranking.join(" ").includes(term));
    if (rankingAvoids) checks.push("ranking:avoid_declared_conflict");
    else warnings.push("Ranking expectation should prefer avoiding declared allergens/sensitivities.");
  }

  if (item.category === "comparison") {
    if (facts.food_preferences.length >= 2) checks.push("comparison:two_options");
    else warnings.push("Comparison dialogue needs at least two brands or foods.");

    if (filters.includes("requested_brands_or_foods")) checks.push("retrieval:requested_brands");
    else warnings.push("Comparison dialogue should filter by requested brands or foods.");

    if (rules.includes("compare_only_retrieved_foods")) checks.push("authority:no_invented_comparison");
    else warnings.push("Comparison should require retrieved-food-only comparison.");
  }

  if (["feeding", "transition"].includes(item.category)) {
    if (facts.weight_kg !== null || item.expected_behavior.should_ask_followup) {
      checks.push("feeding:weight_or_followup");
    } else {
      warnings.push("Feeding/transition dialogue needs weight or a follow-up requirement.");
    }

    if (filters.includes("selected_food_or_kcal")) checks.push("feeding:selected_food_or_kcal");
    else warnings.push("Feeding/transition dialogue should filter by selected food or kcal context.");
  }

  if (needsLargeBreedPuppyMineralLogic(facts)) {
    const expectsMinerals = includesAny([...rules, ...ranking, ...tags], [/calcium/i, /phosphorus/i, /mineral/i]);
    if (expectsMinerals) checks.push("growth:large_breed_mineral_context");
    else warnings.push("Large-breed puppy dialogue should require calcium/phosphorus or mineral context.");
  }

  if (facts.neutered === true && item.category === "recommendation") {
    const hasCalorieContext = includesAny([...rules, ...ranking, ...tags], [/sterilised/i, /calorie/i, /weight/i, /fat/i]);
    if (hasCalorieContext) checks.push("neutered:calorie_context");
    else warnings.push("Neutered pet dialogue should carry calorie/weight-control context.");
  }

  if (facts.budget_preference) {
    checks.push("commercial:budget_context");
  }

  for (const forbidden of ["invent_foods", "invent_nutrients", "override_rules"]) {
    if (item.expected_behavior.must_not_do.includes(forbidden)) {
      checks.push(`authority:${forbidden}`);
    } else {
      warnings.push(`Missing authority guard: ${forbidden}`);
    }
  }

  if (item.evaluation.answer_quality_checks.includes("no back-office wording")) {
    checks.push("copy:no_back_office_wording");
  } else {
    warnings.push("Answer quality checks should block back-office wording.");
  }

  return {
    id: item.id,
    file: item.file,
    category: item.category,
    species: item.species,
    status: warnings.length === 0 ? "pass" : "review",
    checks,
    warnings,
  };
}

function renderReport(results: SmokeResult[]) {
  const passed = results.filter((item) => item.status === "pass").length;
  const review = results.length - passed;
  const byCategory = results.reduce<Record<string, { pass: number; review: number }>>((acc, item) => {
    acc[item.category] ??= { pass: 0, review: 0 };
    acc[item.category][item.status] += 1;
    return acc;
  }, {});

  const lines = [
    "# Dialogue Corpus Smoke QA",
    "",
    `Checked: ${results.length}`,
    `Passed: ${passed}`,
    `Review: ${review}`,
    "",
    "## Category Summary",
    "",
    "| Category | Pass | Review |",
    "| --- | ---: | ---: |",
    ...Object.entries(byCategory)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, counts]) => `| ${category} | ${counts.pass} | ${counts.review} |`),
    "",
    "## Review Items",
    "",
  ];

  const reviewItems = results.filter((item) => item.status === "review");
  if (reviewItems.length === 0) {
    lines.push("No review items.");
  } else {
    for (const item of reviewItems) {
      lines.push(`### ${item.id}`);
      lines.push("");
      lines.push(`- File: \`${item.file}\``);
      lines.push(`- Species/category: ${item.species}/${item.category}`);
      lines.push(`- Warnings: ${item.warnings.join("; ")}`);
      lines.push("");
    }
  }

  lines.push("## Passed Case IDs");
  lines.push("");
  lines.push(results.filter((item) => item.status === "pass").map((item) => item.id).join(", "));
  lines.push("");

  return lines.join("\n");
}

const corpus = loadCorpus();
const results = corpus.map(evaluateDialogue);
const reviewCount = results.filter((item) => item.status === "review").length;

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(reportPath, renderReport(results), "utf8");

const payload = {
  status: reviewCount === 0 ? "passed" : "failed",
  checked: results.length,
  passed: results.length - reviewCount,
  review: reviewCount,
  report: reportPath,
};

console.log(JSON.stringify(payload, null, 2));

if (reviewCount > 0) {
  process.exit(1);
}
