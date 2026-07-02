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

  return {
    ...scenario,
    ok: response.ok,
    totalCandidates: data?.total_candidates ?? null,
    visibleCount: foods.length,
    holdCount: (data?.hold ?? []).length,
    topFoods: foods.slice(0, 3).map(foodLabel).filter(Boolean),
    warnings,
  };
}

function renderReport(results) {
  const passCount = results.filter((result) => result.warnings.length === 0).length;
  const gapCount = results.filter((result) =>
    result.warnings.some((warning) => warning.includes("data coverage gap"))
  ).length;

  return [
    "# Food V2 Format Coverage QA",
    "",
    `Site: ${siteUrl}`,
    `Checked: ${results.length}`,
    `Passed without warnings: ${passCount}/${results.length}`,
    `Wet/canned data gaps: ${gapCount}`,
    "",
    "This report keeps wet/canned recommendation coverage visible without blocking CI while the dataset is still growing.",
    "",
    "## Results",
    "",
    ...results.flatMap((result) => [
      `### ${result.id}`,
      "",
      `- Species: ${result.species}`,
      `- Requested format: ${result.format}`,
      `- Goal: ${result.goal}`,
      `- Total candidates: ${result.totalCandidates ?? "unknown"}`,
      `- Visible premium/value foods: ${result.visibleCount}`,
      `- Hold foods: ${result.holdCount}`,
      "",
      "Top visible foods:",
      ...(result.topFoods.length ? result.topFoods.map((food) => `- ${food}`) : ["- None"]),
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
    `${result.warnings.length === 0 ? "PASS" : "REVIEW"} ${result.id}: ${result.visibleCount} visible`
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
