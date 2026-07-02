import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { customerFoodName } from "@/lib/food-v2/customerFoodName";
import {
  detectFoodFormatPreference,
  recommendationFormatFromPreference,
} from "@/lib/chatbot/foodFormatPreference";
import { parseTastePreferences } from "@/lib/chatbot/tastePreferences";

type SafetyExpectation = "normal" | "caution" | "urgent";
type RecommendationGoal =
  | "general"
  | "premium"
  | "value"
  | "weight_control"
  | "sensitive_digestion"
  | "allergy"
  | "urinary"
  | "renal"
  | "growth"
  | "sterilised"
  | "senior";

type CatFixtureCase = {
  id: string;
  species: "cat";
  locale: string;
  prompt: string;
  expectedSignals: string[];
  expectedSafetyLevel: SafetyExpectation;
  expectedResponseMustMention: string[];
  expectedFirstFoodMustMention?: string[];
  expectedVisibleFoodsMustNotMention?: string[];
};

type CatFixtureCaseWithEncoding = CatFixtureCase & {
  encodingRepaired?: boolean;
};

type FoodV2Item = {
  brand?: string | null;
  display_name?: string | null;
  formula_key?: string | null;
  format?: string | null;
  life_stage?: string | null;
  source_priority?: string | null;
  ranking?: {
    total_score?: number;
    confidence?: string;
    reasons?: string[];
    cautions?: string[];
    signals?: Array<{ code?: string; type?: string; message?: string }>;
  };
  nutrition?: {
    kcal_per_100g?: number | null;
    protein_percent?: number | null;
    fat_percent?: number | null;
    fiber_percent?: number | null;
    calcium_percent?: number | null;
    phosphorus_percent?: number | null;
    magnesium_percent?: number | null;
    sodium_percent?: number | null;
  };
};

type RecommendationResponse = {
  total_candidates?: number;
  premium?: FoodV2Item[];
  value?: FoodV2Item[];
  hold?: FoodV2Item[];
  safety?: {
    hard_stop?: boolean;
    warnings?: Array<{ code?: string; severity?: string; message?: string }>;
  };
  error?: string;
};

type CatQaResult = {
  id: string;
  status: "pass" | "review";
  prompt: string;
  goal: RecommendationGoal;
  expectedSignals: string[];
  warnings: string[];
  topFoods: string[];
};

const SITE_URL = process.env.NUTRITAIL_QA_SITE_URL || "https://nutritail.ai";
const DEFAULT_REPORT_PATH = "reports/cat_chatbot_live_cases_1-100.md";
const DEFAULT_FIXTURE_PATH = "data/evals/chatbot-extra-cases-cat-001-100.json";
const STRICT = process.env.NUTRITAIL_QA_STRICT === "1";
const damagedTextPattern =
  /(?:\?{3,}|\u039e|\u0392\u00ae|\ufffd|\u039f[\u0080-\u00ff])/u;

let isoGreekReverseMap: Map<string, number> | null = null;

function getIsoGreekReverseMap() {
  if (isoGreekReverseMap) return isoGreekReverseMap;

  const decoder = new TextDecoder("iso-8859-7");
  isoGreekReverseMap = new Map<string, number>();

  for (let byte = 0; byte <= 255; byte += 1) {
    isoGreekReverseMap.set(decoder.decode(Uint8Array.of(byte)), byte);
  }

  return isoGreekReverseMap;
}

function repairLegacyGreekMojibake(value: string) {
  if (!damagedTextPattern.test(value)) return value;

  const reverseMap = getIsoGreekReverseMap();
  const bytes: number[] = [];

  for (const char of value) {
    const byte = reverseMap.get(char);
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

function repairCaseEncoding(testCase: CatFixtureCase): CatFixtureCaseWithEncoding {
  const repaired = repairLegacyGreekMojibake(testCase.prompt);
  return {
    ...testCase,
    prompt: repaired,
    encodingRepaired: repaired !== testCase.prompt,
  };
}

function assertNoDamagedPrompts(cases: CatFixtureCaseWithEncoding[], source: string) {
  const damaged = cases.filter((testCase) => damagedTextPattern.test(testCase.prompt));
  if (damaged.length > 0) {
    throw new Error(
      `${source} cat chatbot QA prompts still contain damaged Greek text after repair: ${damaged
        .map((testCase) => testCase.id)
        .join(", ")}`,
    );
  }
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function selectedCaseIds() {
  const raw = cliOption("ids") ?? cliOption("cases") ?? process.env.NUTRITAIL_QA_CASE_IDS?.trim();
  if (!raw) return null;

  return new Set(
    raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => (item.startsWith("cat-") ? item : `cat-${item.padStart(3, "0")}`))
  );
}

function cliOption(name: string) {
  const prefix = `--${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length).trim();

  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) return process.argv[index + 1]?.trim();

  return undefined;
}

function selectedCaseIdsFromRange() {
  const from = Number(cliOption("from"));
  const to = Number(cliOption("to"));
  if (!Number.isInteger(from) || !Number.isInteger(to) || from <= 0 || to <= 0) {
    return null;
  }

  const min = Math.min(from, to);
  const max = Math.max(from, to);
  return new Set(
    Array.from({ length: max - min + 1 }, (_, index) => {
      const id = String(min + index).padStart(3, "0");
      return `cat-${id}`;
    })
  );
}

function numberFromPrompt(prompt: string, pattern: RegExp) {
  const match = prompt.match(pattern);
  if (!match) return null;
  const parsed = Number.parseFloat(match[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function inferGoal(testCase: CatFixtureCase): RecommendationGoal {
  const signals = new Set(testCase.expectedSignals);

  if (signals.has("renal")) return "renal";
  if (signals.has("urinary")) return "urinary";
  if (signals.has("kitten_growth")) return "growth";
  if (signals.has("allergy")) return "allergy";
  if (signals.has("sensitive_digestion")) return "sensitive_digestion";
  if (signals.has("weight_control")) return "weight_control";
  if (signals.has("sterilised")) return "sterilised";
  if (signals.has("senior")) return "senior";

  return "general";
}

function inferNeutered(prompt: string, signals: Set<string>) {
  if (
    prompt.includes("\u03b1\u03c3\u03c4\u03b5\u03b9\u03c1\u03c9\u03c4\u03b7") ||
    prompt.includes("\u03b1\u03c3\u03c4\u03b5\u03b9\u03c1\u03c9\u03c4\u03bf\u03c2") ||
    prompt.includes("\u03b1\u03c3\u03c4\u03b5\u03b9\u03c1\u03c9\u03c4\u03bf") ||
    prompt.includes("unsterilised") ||
    prompt.includes("unsterilized") ||
    prompt.includes("not neutered") ||
    prompt.includes("intact")
  ) {
    return false;
  }

  return (
    signals.has("sterilised") ||
    prompt.includes("\u03c3\u03c4\u03b5\u03b9\u03c1") ||
    prompt.includes("sterilised") ||
    prompt.includes("sterilized") ||
    prompt.includes("neutered")
  );
}

function inferPet(testCase: CatFixtureCase) {
  const prompt = normalizeText(testCase.prompt);
  const signals = new Set(testCase.expectedSignals);
  const tastePreferences = parseTastePreferences(testCase.prompt);
  const allergies = inferAllergies(prompt);
  const excludedIngredients = [
    ...new Set([...allergies, ...tastePreferences.excludedIngredients]),
  ];
  const preferredProteins =
    tastePreferences.preferredProteins.length > 0
      ? tastePreferences.preferredProteins
      : inferPreferredProteins(prompt);
  const weight = numberFromPrompt(prompt, /(\d+(?:[.,]\d+)?)\s*kg/) ?? 4;
  const monthAge = numberFromPrompt(prompt, /(\d+(?:[.,]\d+)?)\s*(?:\u03bc\u03b7\u03bd|month)/);
  const weekAge = numberFromPrompt(prompt, /(\d+(?:[.,]\d+)?)\s*(?:\u03b5\u03b2\u03b4\u03bf\u03bc\u03b1\u03b4|week)/);
  const yearAge = numberFromPrompt(prompt, /(\d+(?:[.,]\d+)?)\s*(?:\u03b5\u03c4|\u03c7\u03c1\u03bf\u03bd|year)/);
  const age =
    weekAge != null
      ? Number((weekAge / 52).toFixed(2))
      : monthAge != null
        ? Number((monthAge / 12).toFixed(2))
        : yearAge ?? (signals.has("kitten_growth") ? 0.5 : signals.has("senior") ? 11 : 4);

  const healthIssues = [
    signals.has("urinary") ? "urinary" : null,
    signals.has("renal") ? "renal" : null,
    signals.has("skin_hairball") ? "skin_hairball" : null,
    signals.has("weight_control") ? "weight_control" : null,
  ].filter((item): item is string => Boolean(item));

  return {
    species: "cat",
    weight,
    age,
    activityLevel: prompt.includes("outdoor") || prompt.includes("\u03b4\u03c1\u03b1\u03c3\u03c4\u03b7\u03c1") || signals.has("active") ? "high" : "low",
    neutered: inferNeutered(prompt, signals),
    healthIssues,
    allergies,
    excludedIngredients,
    preferredProteins,
  };
}

function inferAllergies(prompt: string) {
  const allergies: string[] = [];
  if (prompt.includes("\u03ba\u03bf\u03c4\u03bf\u03c0") || prompt.includes("chicken")) allergies.push("chicken");
  if (prompt.includes("\u03b3\u03b1\u03bb\u03bf\u03c0") || prompt.includes("turkey")) allergies.push("turkey");
  if (prompt.includes("\u03c3\u03bf\u03bb\u03bf\u03bc") || prompt.includes("salmon")) allergies.push("salmon");
  if (prompt.includes("\u03c8\u03b1\u03c1") || prompt.includes("fish")) allergies.push("fish");
  if (prompt.includes("\u03bc\u03bf\u03c3\u03c7") || prompt.includes("beef")) allergies.push("beef");
  if (prompt.includes("\u03b1\u03c1\u03bd") || prompt.includes("lamb")) allergies.push("lamb");
  if (prompt.includes("\u03b1\u03c5\u03b3") || prompt.includes("egg")) allergies.push("egg");
  if (prompt.includes("\u03c3\u03b9\u03c4\u03b7\u03c1") || prompt.includes("grain")) allergies.push("grain");
  if (prompt.includes("\u03ba\u03b1\u03bb\u03b1\u03bc\u03c0\u03bf\u03ba") || prompt.includes("corn")) allergies.push("corn");
  return prompt.includes("\u03b1\u03bb\u03bb\u03b5\u03c1\u03b3") ||
    prompt.includes("allerg") ||
    prompt.includes("\u03b5\u03c5\u03b1\u03b9\u03c3\u03b8\u03b7") ||
    prompt.includes("sensitive") ||
    prompt.includes("\u03b4\u03c5\u03c3\u03b1\u03bd\u03b5\u03be") ||
    prompt.includes("intoler") ||
    prompt.includes("elimination")
    ? allergies
    : [];
}

function inferPreferredProteins(prompt: string) {
  const preferred: string[] = [];
  if (prompt.includes("\u03ba\u03bf\u03c4\u03bf\u03c0") || prompt.includes("chicken")) preferred.push("chicken");
  if (prompt.includes("\u03b3\u03b1\u03bb\u03bf\u03c0") || prompt.includes("turkey")) preferred.push("turkey");
  if (prompt.includes("\u03c3\u03bf\u03bb\u03bf\u03bc") || prompt.includes("salmon")) preferred.push("salmon");
  if (prompt.includes("\u03c4\u03bf\u03bd\u03bf") || prompt.includes("tuna")) preferred.push("tuna");
  if (prompt.includes("\u03c0\u03b1\u03c0\u03b9\u03b1") || prompt.includes("duck")) preferred.push("duck");
  if (prompt.includes("\u03c8\u03b1\u03c1") || prompt.includes("fish")) preferred.push("fish");
  if (prompt.includes("\u03b1\u03c1\u03bd") || prompt.includes("lamb")) preferred.push("lamb");
  if (prompt.includes("\u03ba\u03bf\u03c5\u03bd\u03b5\u03bb") || prompt.includes("rabbit")) preferred.push("rabbit");
  return preferred;
}

function foodLabel(food: FoodV2Item) {
  return customerFoodName({
    brand: food.brand ?? "",
    display_name: food.display_name ?? "",
  });
}

function hasCustomerVisibleMojibake(value: string) {
  return /(?:Ξ|Ο[\u0080-\u00ff]|[Γγ][\u0080-\u00ff]|[Ββ][®€]|β€|\ufffd)/u.test(value);
}

function allVisibleFoods(response: RecommendationResponse) {
  return [...(response.premium ?? []), ...(response.value ?? [])];
}

function hasFoodMatch(foods: FoodV2Item[], patterns: RegExp[]) {
  return foods.some((food) => {
    const text = normalizeText(
      [
        food.brand,
        food.display_name,
        food.formula_key,
        food.life_stage,
        ...(food.ranking?.reasons ?? []),
        ...(food.ranking?.cautions ?? []),
        ...(food.ranking?.signals ?? []).map((signal) => signal.message ?? ""),
      ].join(" ")
    );
    return patterns.some((pattern) => pattern.test(text));
  });
}

function termPattern(term: string) {
  return new RegExp(term, "i");
}

function visibleFoodText(food: FoodV2Item) {
  return [
    food.brand,
    food.display_name,
    food.formula_key,
    food.life_stage,
    ...(food.ranking?.reasons ?? []),
    ...(food.ranking?.cautions ?? []),
    ...(food.ranking?.signals ?? []).map((signal) => signal.message ?? ""),
  ].join(" ");
}

function validateCase(testCase: CatFixtureCase, response: RecommendationResponse, goal: RecommendationGoal) {
  const warnings: string[] = [];
  const foods = allVisibleFoods(response);
  const signals = new Set(testCase.expectedSignals);
  const safetyHardStop = response.safety?.hard_stop === true;
  const formatPreference = detectFoodFormatPreference(testCase.prompt);

  if (response.error) warnings.push(`Recommendation endpoint returned error: ${response.error}`);
  if (!response.total_candidates && !safetyHardStop) warnings.push("Food V2 returned zero cat candidates.");
  if (testCase.expectedSafetyLevel === "urgent" && foods.length > 0) {
    warnings.push("Urgent safety case returned visible food recommendations; chatbot should block shopping mode before showing foods.");
  }
  if (testCase.expectedSafetyLevel === "urgent" && !safetyHardStop) {
    warnings.push("Urgent safety case did not return a safety hard stop.");
  }
  if (foods.length === 0 && testCase.expectedSafetyLevel !== "urgent") {
    warnings.push("No visible cat recommendations returned.");
  }

  const damagedTopFoodName = foods.slice(0, 5).map(foodLabel).find(hasCustomerVisibleMojibake);
  if (damagedTopFoodName) {
    warnings.push(`Customer-visible top food name contains mojibake: ${damagedTopFoodName}`);
  }

  if (safetyHardStop) return warnings;

  if (
    formatPreference === "wet" &&
    foods.slice(0, 5).some((food) => String(food.format ?? "").toLowerCase() !== "wet")
  ) {
    warnings.push("Wet-only cat case surfaced dry/non-wet candidates in the visible shortlist.");
  }

  if (hasFoodMatch(foods, [/\bdog\b/, /\bcanine\b/, /\u03c3\u03ba\u03c5\u03bb/, /puppy/])) {
    warnings.push("Visible shortlist appears to contain dog food terms.");
  }

  if (testCase.expectedFirstFoodMustMention?.length && foods[0]) {
    const firstFoodText = normalizeText(visibleFoodText(foods[0]));
    const matched = testCase.expectedFirstFoodMustMention.some((term) =>
      termPattern(term).test(firstFoodText)
    );
    if (!matched) {
      warnings.push(
        `First food does not match expected positioning terms: ${testCase.expectedFirstFoodMustMention.join(", ")}.`
      );
    }
  }

  if (testCase.expectedVisibleFoodsMustNotMention?.length && foods.length > 0) {
    const forbiddenPatterns = testCase.expectedVisibleFoodsMustNotMention.map(termPattern);
    const forbiddenFood = foods.slice(0, 5).find((food) =>
      forbiddenPatterns.some((pattern) => pattern.test(normalizeText(visibleFoodText(food))))
    );
    if (forbiddenFood) {
      warnings.push(
        `Visible shortlist includes forbidden positioning for this case: ${foodLabel(forbiddenFood)}.`
      );
    }
  }

  if (signals.has("urinary") && !hasFoodMatch(foods, [/urinary/, /struvite/, /oxalate/, /\u03bf\u03c5\u03c1\u03bf/])) {
    warnings.push("Urinary case did not surface urinary/struvite/oxalate candidates.");
  }

  if (signals.has("renal") && !hasFoodMatch(foods, [/renal/, /kidney/, /\u03bd\u03b5\u03c6\u03c1/])) {
    warnings.push("Renal case did not surface renal/kidney candidates.");
  }

  if (signals.has("kitten_growth") && !hasFoodMatch(foods, [/kitten/, /growth/, /junior/, /\u03b3\u03b1\u03c4\u03b1\u03ba\u03b9/])) {
    warnings.push("Kitten growth case did not surface kitten/growth candidates.");
  }

  if (signals.has("sterilised") && !hasFoodMatch(foods, [/sterili[sz]ed/, /neutered/, /\u03c3\u03c4\u03b5\u03b9\u03c1/, /indoor/, /light/])) {
    warnings.push("Sterilised case did not surface sterilised/neutered/indoor/light candidates.");
  }

  const prompt = normalizeText(testCase.prompt);
  const explicitlyUnneutered =
    prompt.includes("\u03b1\u03c3\u03c4\u03b5\u03b9\u03c1\u03c9\u03c4") ||
    prompt.includes("unsterilised") ||
    prompt.includes("unsterilized") ||
    prompt.includes("not neutered") ||
    prompt.includes("intact");
  if (explicitlyUnneutered && goal === "general") {
    const mismatch = foods.slice(0, 5).find((food) =>
      /sterili[sz]ed|neutered|light|weight/.test(normalizeText(visibleFoodText(food)))
    );
    if (mismatch) {
      warnings.push(
        `Non-neutered general cat case surfaced sterilised/light food: ${foodLabel(mismatch)}.`
      );
    }
  }

  if (signals.has("weight_control") && !hasFoodMatch(foods, [/light/, /obesity/, /weight/, /sterili[sz]ed/, /neutered/])) {
    const hasRenalUrinaryPriorityMatch =
      (signals.has("renal") &&
        hasFoodMatch(foods, [/renal/, /kidney/, /\u03bd\u03b5\u03c6\u03c1/])) ||
      (signals.has("urinary") &&
        hasFoodMatch(foods, [/urinary/, /struvite/, /oxalate/, /\u03bf\u03c5\u03c1\u03bf/]));
    const hasModerateEnergy = foods.some((food) => {
      const kcal = food.nutrition?.kcal_per_100g;
      const fat = food.nutrition?.fat_percent;
      return (kcal == null || kcal <= 380) && (fat == null || fat <= 15);
    });
    if (!hasModerateEnergy && !hasRenalUrinaryPriorityMatch) warnings.push("Weight-control case did not surface weight/light candidates or moderate kcal/fat foods.");
  }

  if (signals.has("senior") && !hasFoodMatch(foods, [/senior/, /\b7\+/, /\b10\+/, /\b11\+/, /\b12\+/, /mature/])) {
    warnings.push("Senior case did not surface senior/mature candidates.");
  }

  if (signals.has("sensitive_digestion")) {
    const prompt = normalizeText(testCase.prompt);
    const hasRenalOrUrinaryPromptContext =
      /renal|kidney|urinary|struvite|oxalate|\u03bd\u03b5\u03c6\u03c1|\u03bf\u03c5\u03c1\u03bf\u03bb|\u03bf\u03be\u03b1\u03bb/.test(
        prompt
      );
    const medicalMismatch = foods.slice(0, 3).find((food) =>
      /renal|kidney|urinary|struvite|oxalate|\u03bd\u03b5\u03c6\u03c1|\u03bf\u03c5\u03c1\u03bf\u03bb|\u03bf\u03be\u03b1\u03bb/.test(
        normalizeText(visibleFoodText(food))
      )
    );

    if (medicalMismatch && !hasRenalOrUrinaryPromptContext) {
      warnings.push(
        `Sensitive-digestion case surfaced renal/urinary food in the top shortlist: ${foodLabel(medicalMismatch)}.`
      );
    }
  }

  if (goal === "allergy") {
    const prompt = normalizeText(testCase.prompt);
    const riskyProteins = [
      ["chicken", /chicken|\u03ba\u03bf\u03c4\u03bf\u03c0/],
      ["turkey", /turkey|\u03b3\u03b1\u03bb\u03bf\u03c0/],
      ["salmon", /salmon|\u03c3\u03bf\u03bb\u03bf\u03bc/],
      ["beef", /beef|\u03bc\u03bf\u03c3\u03c7/],
      ["lamb", /lamb|\u03b1\u03c1\u03bd/],
      ["fish", /fish|\u03c8\u03b1\u03c1/],
    ] as const;

    for (const [protein, pattern] of riskyProteins) {
      if (
        (prompt.includes("\u03b1\u03bb\u03bb\u03b5\u03c1\u03b3") || prompt.includes("\u03b5\u03c5\u03b1\u03b9\u03c3\u03b8\u03b7") || prompt.includes("\u03b4\u03c5\u03c3\u03b1\u03bd\u03b5\u03be")) &&
        pattern.test(prompt) &&
        hasFoodMatch(foods.slice(0, 3), [new RegExp(protein)])
      ) {
        warnings.push(`Top allergy shortlist may contain excluded protein: ${protein}.`);
      }
    }
  }

  return warnings;
}

async function runCase(testCase: CatFixtureCase): Promise<CatQaResult> {
  const goal = inferGoal(testCase);
  const pet = inferPet(testCase);
  const formatPreference = detectFoodFormatPreference(testCase.prompt);
  const response = await fetch(`${SITE_URL}/api/account/foods/v2-recommendations`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      goal,
      message: testCase.prompt,
      prompt: testCase.prompt,
      pet,
      format: recommendationFormatFromPreference(formatPreference),
      limit_per_bucket: 3,
    }),
  });

  const json = (await response.json()) as RecommendationResponse;
  const warnings = validateCase(testCase, json, goal);
  if (!response.ok) warnings.push(`HTTP ${response.status}`);

  return {
    id: testCase.id,
    status: warnings.length === 0 ? "pass" : "review",
    prompt: testCase.prompt,
    goal,
    expectedSignals: testCase.expectedSignals,
    warnings,
    topFoods: allVisibleFoods(json).slice(0, 5).map(foodLabel),
  };
}

function countItems(items: string[]) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function resultSummary(results: CatQaResult[]) {
  const byGoal = new Map<RecommendationGoal, CatQaResult[]>();
  const bySignal = new Map<string, CatQaResult[]>();

  for (const result of results) {
    byGoal.set(result.goal, [...(byGoal.get(result.goal) ?? []), result]);
    for (const signal of result.expectedSignals) {
      bySignal.set(signal, [...(bySignal.get(signal) ?? []), result]);
    }
  }

  const goalRows = [...byGoal.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([goal, goalResults]) => {
      const passCount = goalResults.filter((result) => result.status === "pass").length;
      const topFirstFoods = countItems(
        goalResults.map((result) => result.topFoods[0]).filter((food): food is string => Boolean(food))
      )
        .slice(0, 3)
        .map(([food, count]) => `${food} (${count})`)
        .join("; ");

      return `| ${goal} | ${passCount}/${goalResults.length} | ${topFirstFoods || "None"} |`;
    });

  const signalRows = [...bySignal.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([signal, signalResults]) => {
      const passCount = signalResults.filter((result) => result.status === "pass").length;
      const topFoods = countItems(
        signalResults.flatMap((result) => result.topFoods.slice(0, 2))
      )
        .slice(0, 4)
        .map(([food, count]) => `${food} (${count})`)
        .join("; ");

      return `| ${signal} | ${passCount}/${signalResults.length} | ${topFoods || "None"} |`;
    });

  const recurringFirstPicks = countItems(
    results.map((result) => result.topFoods[0]).filter((food): food is string => Boolean(food))
  )
    .filter(([, count]) => count >= 4)
    .slice(0, 10)
    .map(([food, count]) => `- ${food}: ${count} first-pick appearances`);

  return [
    "## Executive Summary",
    "",
    "### Goal Coverage",
    "",
    "| Goal | Pass rate | Most common first picks |",
    "| --- | ---: | --- |",
    ...goalRows,
    "",
    "### Signal Coverage",
    "",
    "| Signal | Pass rate | Common top-2 foods |",
    "| --- | ---: | --- |",
    ...signalRows,
    "",
    "### Recurring First Picks",
    "",
    ...(recurringFirstPicks.length
      ? recurringFirstPicks
      : ["- No single first pick appears in four or more cases."]),
    "",
    "Use this section for qualitative review: repeated first picks can be healthy if they match the scenario, but they can also reveal over-dominant ranking signals.",
    "",
  ];
}

function caseRange(results: CatQaResult[]) {
  const numbers = results
    .map((result) => Number.parseInt(result.id.replace(/\D/g, ""), 10))
    .filter(Number.isFinite);
  if (!numbers.length) return "selected";
  const first = String(Math.min(...numbers)).padStart(3, "0");
  const last = String(Math.max(...numbers)).padStart(3, "0");
  return `${first}-${last}`;
}

function reportMarkdown(
  results: CatQaResult[],
  fixturePath: string,
  cases: CatFixtureCaseWithEncoding[],
) {
  const passed = results.filter((result) => result.status === "pass").length;
  const review = results.length - passed;
  const range = caseRange(results);
  const repairedPromptCount = cases.filter((testCase) => testCase.encodingRepaired).length;
  const damagedAfterRepair = cases.filter((testCase) => damagedTextPattern.test(testCase.prompt)).length;

  return [
    `# Cat Chatbot Live Cases ${range}`,
    "",
    `Site: ${SITE_URL}`,
    `Run date: ${new Date().toISOString()}`,
    "OpenAI extraction: skipped",
    `Result: ${passed}/${results.length} passed, ${review} review`,
    `Prompt encoding repairs applied: ${repairedPromptCount}`,
    `Prompt encoding issues after repair: ${damagedAfterRepair}`,
    "",
    `This QA checks the live Food V2 recommendation endpoint with cat scenarios from \`${fixturePath}\`.`,
    "It focuses on species safety, empty shortlists, and major nutrition-direction mismatches for urinary, renal, kitten, senior, sterilised, weight-control, and allergy scenarios.",
    "",
    ...resultSummary(results),
    "## Results",
    "",
    ...results.flatMap((result) => [
      `### ${result.id} - ${result.status.toUpperCase()}`,
      "",
      `Prompt: ${result.prompt}`,
      `Goal: ${result.goal}`,
      "",
      "Top foods:",
      ...(result.topFoods.length ? result.topFoods.map((food) => `- ${food}`) : ["- None"]),
      "",
      "Warnings:",
      ...(result.warnings.length ? result.warnings.map((warning) => `- ${warning}`) : ["- None"]),
      "",
    ]),
  ].join("\n");
}

async function main() {
  const fixturePath = process.env.NUTRITAIL_QA_CAT_FIXTURE_PATH || DEFAULT_FIXTURE_PATH;
  const absoluteFixturePath = path.join(process.cwd(), fixturePath);
  const fixture = JSON.parse(await readFile(absoluteFixturePath, "utf8")) as { cases: CatFixtureCase[] };
  const selected = selectedCaseIdsFromRange() ?? selectedCaseIds();
  const limit = Number.parseInt(
    cliOption("limit") ?? process.env.NUTRITAIL_QA_CASE_LIMIT ?? "",
    10
  );
  const cases = fixture.cases
    .map(repairCaseEncoding)
    .filter((testCase) => !selected || selected.has(testCase.id))
    .slice(0, Number.isFinite(limit) ? limit : undefined);

  if (cases.length === 0) {
    throw new Error("No cat QA cases selected.");
  }
  assertNoDamagedPrompts(cases, fixturePath);

  const results: CatQaResult[] = [];
  for (const testCase of cases) {
    const result = await runCase(testCase);
    results.push(result);
    console.log(`${result.status === "pass" ? "PASS" : "REVIEW"} ${result.id}: ${result.prompt}`);
    for (const warning of result.warnings) console.log(`  - ${warning}`);
  }

  const reportPath = cliOption("report") || process.env.NUTRITAIL_QA_REPORT_PATH || DEFAULT_REPORT_PATH;
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, reportMarkdown(results, fixturePath, cases), "utf8");

  const reviewCount = results.filter((result) => result.status === "review").length;
  console.log(`\nWrote ${reportPath}`);
  console.log(`Result: ${results.length - reviewCount}/${results.length} passed, ${reviewCount} review`);

  if (STRICT && reviewCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
