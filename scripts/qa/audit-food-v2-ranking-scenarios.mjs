import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const siteUrl = process.env.NUTRITAIL_QA_SITE_URL || "https://nutritail.ai";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ||
  "reports/food_v2_ranking_scenario_audit.md";

const scenarios = [
  {
    label: "Large adult dog",
    goal: "general",
    pet: {
      species: "dog",
      breed: "labrador",
      age: 4,
      weight: 30,
      activityLevel: "normal",
      neutered: false,
      allergies: [],
      healthIssues: [],
    },
    expectations: ["premium_or_value", "no_small_dog_top_pick"],
  },
  {
    label: "Small sterilised dog",
    goal: "sterilised",
    pet: {
      species: "dog",
      breed: "maltese",
      age: 5,
      weight: 6,
      activityLevel: "normal",
      neutered: true,
      allergies: [],
      healthIssues: ["sterilised"],
    },
    expectations: ["premium_or_value"],
  },
  {
    label: "Avoid chicken",
    goal: "allergy",
    pet: {
      species: "dog",
      breed: "mixed",
      age: 4,
      weight: 18,
      activityLevel: "normal",
      neutered: false,
      allergies: ["chicken"],
      excludedIngredients: ["chicken"],
      healthIssues: [],
    },
    expectations: ["premium_or_value", "no_chicken_top_pick"],
  },
  {
    label: "Large breed puppy",
    goal: "growth",
    pet: {
      species: "dog",
      breed: "german shepherd",
      age: 0.5,
      weight: 22,
      activityLevel: "normal",
      neutered: false,
      allergies: [],
      healthIssues: ["puppy"],
    },
    expectations: ["premium_or_value", "puppy_top_pick"],
  },
  {
    label: "Sterilised cat",
    goal: "sterilised",
    pet: {
      species: "cat",
      breed: "domestic shorthair",
      age: 3,
      weight: 5,
      activityLevel: "normal",
      neutered: true,
      allergies: [],
      healthIssues: ["sterilised"],
    },
    expectations: ["premium_or_value"],
  },
  {
    label: "Urinary cat",
    goal: "urinary",
    pet: {
      species: "cat",
      breed: "domestic shorthair",
      age: 5,
      weight: 5,
      activityLevel: "low",
      neutered: true,
      allergies: [],
      healthIssues: ["urinary"],
    },
    expectations: ["premium_or_value", "urinary_top_pick"],
  },
];

function firstPicks(data) {
  return [...(data.premium ?? []), ...(data.value ?? [])].slice(0, 3);
}

function foodText(food) {
  return [
    food?.brand,
    food?.display_name,
    food?.life_stage,
    food?.dog_size,
    food?.ranking?.reasons?.join(" "),
    food?.ranking?.cautions?.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function checkExpectations(scenario, data) {
  const picks = firstPicks(data);
  const first = picks[0];
  const warnings = [];

  for (const expectation of scenario.expectations) {
    if (expectation === "premium_or_value" && picks.length === 0) {
      warnings.push("No premium/value picks returned.");
    }

    if (expectation === "no_small_dog_top_pick") {
      const text = foodText(first);
      if (text.includes("small") || text.includes("mini")) {
        warnings.push("Top pick appears to target small/mini dogs.");
      }
    }

    if (expectation === "no_chicken_top_pick") {
      const text = foodText(first);
      if (
        text.includes("chicken") ||
        text.includes("κοτοπου") ||
        text.includes("poultry")
      ) {
        warnings.push("Top pick may contain chicken/poultry.");
      }
    }

    if (expectation === "puppy_top_pick") {
      const text = foodText(first);
      if (!text.includes("puppy") && !text.includes("junior")) {
        warnings.push("Top pick does not look puppy/junior focused.");
      }
    }

    if (expectation === "urinary_top_pick") {
      const text = foodText(first);
      if (!text.includes("urinary") && !text.includes("ουρο")) {
        warnings.push("Top pick does not look urinary focused.");
      }
    }
  }

  return warnings;
}

function renderPick(food, index) {
  if (!food) return `| ${index} | - | - | - | - | - |`;
  const score = food.ranking?.score ?? "-";
  const bucket = food.ranking?.bucket ?? "-";
  const reasons = (food.ranking?.reasons ?? []).slice(0, 3).join("; ") || "-";
  const cautions = (food.ranking?.cautions ?? []).slice(0, 2).join("; ") || "-";
  return `| ${index} | ${food.brand ?? "-"} | ${
    food.display_name ?? "-"
  } | ${bucket} | ${score} | ${reasons} ${cautions !== "-" ? `Cautions: ${cautions}` : ""} |`;
}

async function runScenario(scenario) {
  const url = new URL("/api/account/foods/v2-recommendations", siteUrl);
  const started = Date.now();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "NutriTail-food-v2-ranking-audit/1.0",
    },
    body: JSON.stringify({
      pet: scenario.pet,
      goal: scenario.goal,
      format: "dry",
      limit_per_bucket: 3,
    }),
  });

  const data = await response.json();
  const requestOk = response.ok;
  const warnings = requestOk
    ? checkExpectations(scenario, data)
    : [data?.error || `HTTP ${response.status}`];

  return {
    ...scenario,
    status: response.status,
    duration_ms: Date.now() - started,
    ok: requestOk && warnings.length === 0,
    warnings,
    data,
  };
}

function renderScenario(row) {
  const picks = firstPicks(row.data);
  return [
    `### ${row.label}`,
    "",
    `- Status: ${row.status}`,
    `- Duration: ${row.duration_ms}ms`,
    `- Candidates: ${row.data?.total_candidates ?? 0}`,
    `- Result: ${row.ok ? "pass" : "review"}`,
    `- Warnings: ${row.warnings.length ? row.warnings.join(" | ") : "-"}`,
    "",
    "| # | Brand | Food | Bucket | Score | Notes |",
    "| ---: | --- | --- | --- | ---: | --- |",
    renderPick(picks[0], 1),
    renderPick(picks[1], 2),
    renderPick(picks[2], 3),
  ].join("\n");
}

async function main() {
  const rows = [];
  for (const scenario of scenarios) {
    rows.push(await runScenario(scenario));
  }

  const passed = rows.filter((row) => row.ok).length;
  const review = rows.length - passed;

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    [
      "# Food V2 Ranking Scenario Audit",
      "",
      `Generated: ${new Date().toISOString()}`,
      `Site: ${siteUrl}`,
      "",
      "## Summary",
      "",
      `- Scenarios checked: ${rows.length}`,
      `- Passed: ${passed}`,
      `- Needs review: ${review}`,
      "",
      "This audit is intentionally opinionated. It catches obvious recommendation risks such as a large dog receiving small-breed food, allergy conflicts, and condition-specific goals returning unrelated first picks.",
      "",
      "## Scenarios",
      "",
      rows.map(renderScenario).join("\n\n"),
    ].join("\n"),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        siteUrl,
        checked: rows.length,
        passed,
        review,
        report: reportPath,
      },
      null,
      2
    )
  );

  if (review > 0 && process.env.NUTRITAIL_QA_STRICT === "1") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
