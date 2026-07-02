import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const siteUrl = process.env.NUTRITAIL_QA_SITE_URL || "https://nutritail.ai";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH || "reports/food_v2_format_coverage_qa.md";

const scenarios = [
  {
    id: "dog-dry",
    species: "dog",
    format: "dry",
    goal: "sterilised",
    prompt: "Sterilised adult dog that eats dry food.",
    pet: {
      species: "dog",
      age: 5,
      weight: 10,
      activityLevel: "low",
      neutered: true,
      weightGoal: "maintain",
      healthIssues: [],
      allergies: [],
      excludedIngredients: [],
      preferredProteins: [],
    },
    expectedVisible: true,
  },
  {
    id: "dog-wet",
    species: "dog",
    format: "wet",
    goal: "general",
    prompt: "Adult dog that eats only canned or wet food.",
    pet: {
      species: "dog",
      age: 5,
      weight: 10,
      activityLevel: "normal",
      neutered: false,
      weightGoal: "maintain",
      healthIssues: [],
      allergies: [],
      excludedIngredients: [],
      preferredProteins: [],
    },
    expectedVisible: false,
  },
  {
    id: "cat-dry",
    species: "cat",
    format: "dry",
    goal: "sterilised",
    prompt: "Sterilised adult cat that eats dry food.",
    pet: {
      species: "cat",
      age: 5,
      weight: 4.5,
      activityLevel: "low",
      neutered: true,
      weightGoal: "maintain",
      healthIssues: [],
      allergies: [],
      excludedIngredients: [],
      preferredProteins: [],
    },
    expectedVisible: true,
  },
  {
    id: "cat-wet",
    species: "cat",
    format: "wet",
    goal: "general",
    prompt: "Adult cat that eats only wet food or pouches.",
    pet: {
      species: "cat",
      age: 5,
      weight: 4.5,
      activityLevel: "normal",
      neutered: true,
      weightGoal: "maintain",
      healthIssues: [],
      allergies: [],
      excludedIngredients: [],
      preferredProteins: [],
    },
    expectedVisible: false,
  },
];

function foodLabel(food) {
  return [food?.brand, food?.display_name ?? food?.formula_key].filter(Boolean).join(" - ");
}

function visibleFoods(data) {
  return [...(data?.premium ?? []), ...(data?.value ?? [])];
}

function guardCodes(food) {
  return (food?.guard_flags ?? [])
    .map((flag) => String(flag?.code ?? "").trim())
    .filter(Boolean);
}

function classifyCoverage({ response, data, foods, scenario, nonRequestedFormats, warnings }) {
  if (!response.ok) return "api_error";
  if (nonRequestedFormats.length > 0) return "format_mismatch";
  if (foods.length > 0) return "visible";

  const totalCandidates = Number(data?.total_candidates ?? 0);
  const hold = data?.hold ?? [];
  if (totalCandidates === 0) return "data_gap";

  const holdCodes = hold.flatMap(guardCodes);
  const hasLifeStageHold = holdCodes.some((code) =>
    ["life_stage_mismatch", "growth_food_for_adult_pet", "adult_food_for_growth_pet"].includes(code)
  );
  const hasMedicalHold = holdCodes.some((code) =>
    [
      "therapeutic_food_without_matching_condition",
      "renal_food_without_context",
      "urinary_food_without_context",
    ].includes(code)
  );
  const hasSafetyHold = holdCodes.some((code) =>
    [
      "allergy_conflict",
      "species_mismatch",
      "user_visible_confidence_hold",
      "non_complete_food_product",
    ].includes(code)
  );

  if (hold.length > 0 && (hasLifeStageHold || hasMedicalHold || hasSafetyHold)) {
    return "safe_hold";
  }

  if (warnings.length > 0 && scenario.expectedVisible) return "unexpected_empty";
  return "insufficient_visible_data";
}

const COVERAGE_STATUS_LABELS = {
  visible: "Visible recommendations",
  safe_hold: "Safe hold / needs more matching data",
  data_gap: "No matching data",
  insufficient_visible_data: "Insufficient visible data",
  unexpected_empty: "Unexpected empty result",
  api_error: "API error",
  format_mismatch: "Format mismatch",
};

async function runScenario(scenario) {
  const response = await fetch(new URL("/api/account/foods/v2-recommendations", siteUrl), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "NutriTail-food-v2-format-coverage-qa/1.0",
    },
    body: JSON.stringify({
      goal: scenario.goal,
      message: scenario.prompt,
      prompt: scenario.prompt,
      pet: scenario.pet,
      format: scenario.format,
      limit_per_bucket: 3,
    }),
  });

  const data = await response.json().catch(() => ({}));
  const foods = visibleFoods(data);
  const nonRequestedFormats = foods.filter(
    (food) => String(food?.format ?? "").toLowerCase() !== scenario.format
  );
  const warnings = [];

  if (!response.ok) {
    warnings.push(`HTTP ${response.status}`);
  }

  if (scenario.expectedVisible && foods.length === 0) {
    warnings.push("Expected visible recommendations but none were returned.");
  }

  if (scenario.format === "wet" && foods.length === 0) {
    warnings.push("Wet/canned recommendations are not visible yet; this is a data coverage gap.");
  }

  if (nonRequestedFormats.length > 0) {
    warnings.push(`Returned non-${scenario.format} recommendations in visible buckets.`);
  }

  const coverageStatus = classifyCoverage({
    response,
    data,
    foods,
    scenario,
    nonRequestedFormats,
    warnings,
  });

  return {
    ...scenario,
    ok: response.ok,
    coverageStatus,
    coverageLabel: COVERAGE_STATUS_LABELS[coverageStatus] ?? coverageStatus,
    totalCandidates: data?.total_candidates ?? null,
    visibleCount: foods.length,
    holdCount: (data?.hold ?? []).length,
    holdReasons: (data?.hold ?? [])
      .slice(0, 3)
      .map((food) => {
        const codes = guardCodes(food);
        return `${foodLabel(food) || "Unknown food"}${codes.length ? ` (${codes.join(", ")})` : ""}`;
      })
      .filter(Boolean),
    topFoods: foods.slice(0, 3).map(foodLabel).filter(Boolean),
    warnings,
  };
}

function renderReport(results) {
  const passCount = results.filter((result) => result.warnings.length === 0).length;
  const gapCount = results.filter((result) =>
    result.warnings.some((warning) => warning.includes("data coverage gap"))
  ).length;
  const safeHoldCount = results.filter((result) => result.coverageStatus === "safe_hold").length;

  return [
    "# Food V2 Format Coverage QA",
    "",
    `Site: ${siteUrl}`,
    `Checked: ${results.length}`,
    `Passed without warnings: ${passCount}/${results.length}`,
    `Wet/canned data gaps: ${gapCount}`,
    `Safe holds: ${safeHoldCount}`,
    "",
    "This report keeps wet/canned recommendation coverage visible without blocking CI while the dataset is still growing.",
    "Coverage status separates ready journeys from safe holds, true data gaps, and possible ranking bugs.",
    "",
    "## Results",
    "",
    ...results.flatMap((result) => [
      `### ${result.id}`,
      "",
      `- Species: ${result.species}`,
      `- Requested format: ${result.format}`,
      `- Goal: ${result.goal}`,
      `- Coverage status: ${result.coverageLabel}`,
      `- Total candidates: ${result.totalCandidates ?? "unknown"}`,
      `- Visible premium/value foods: ${result.visibleCount}`,
      `- Hold foods: ${result.holdCount}`,
      "",
      "Top visible foods:",
      ...(result.topFoods.length ? result.topFoods.map((food) => `- ${food}`) : ["- None"]),
      "",
      "Held examples:",
      ...(result.holdReasons.length
        ? result.holdReasons.map((food) => `- ${food}`)
        : ["- None"]),
      "",
      "Warnings:",
      ...(result.warnings.length ? result.warnings.map((warning) => `- ${warning}`) : ["- None"]),
      "",
    ]),
  ].join("\n");
}

const results = [];

for (const scenario of scenarios) {
  const result = await runScenario(scenario);
  results.push(result);
  console.log(
    `${result.warnings.length === 0 ? "PASS" : "REVIEW"} ${result.id}: ${result.visibleCount} visible (${result.coverageStatus})`
  );
  for (const warning of result.warnings) console.log(`  - ${warning}`);
}

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(reportPath, renderReport(results), "utf8");
console.log(`Wrote ${reportPath}`);

const hardFailures = results.filter((result) =>
  result.warnings.some(
    (warning) => warning.startsWith("HTTP ") || warning.includes("Returned non-")
  )
);

if (hardFailures.length > 0) {
  process.exitCode = 1;
}
