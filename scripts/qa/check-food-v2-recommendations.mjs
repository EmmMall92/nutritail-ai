import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const siteUrl = process.env.NUTRITAIL_QA_SITE_URL || "https://nutritail.ai";
const reportPath = "reports/food_v2_recommendation_smoke_qa.md";

const scenarios = [
  {
    label: "Large sterilised dog",
    goal: "sterilised",
    pet: {
      species: "dog",
      breed: "Labrador",
      age: 4,
      weight: 30,
      activityLevel: "normal",
      neutered: true,
      healthIssues: ["weight control"],
    },
  },
  {
    label: "Large dog avoiding chicken",
    goal: "general",
    pet: {
      species: "dog",
      breed: "Labrador",
      age: 4,
      weight: 30,
      activityLevel: "normal",
      neutered: true,
      excludedIngredients: ["chicken"],
      preferredProteins: ["lamb", "salmon"],
    },
  },
  {
    label: "Chicken allergy dog",
    goal: "allergy",
    pet: {
      species: "dog",
      breed: "Mixed breed",
      age: 3,
      weight: 18,
      activityLevel: "normal",
      neutered: false,
      allergies: ["chicken"],
      healthIssues: ["skin allergy"],
      preferredProteins: ["lamb", "duck", "salmon"],
    },
  },
  {
    label: "Large breed puppy",
    goal: "growth",
    pet: {
      species: "dog",
      breed: "German Shepherd",
      age: 0.6,
      weight: 22,
      activityLevel: "normal",
      neutered: false,
    },
  },
  {
    label: "Sensitive digestion dog",
    goal: "sensitive_digestion",
    pet: {
      species: "dog",
      breed: "French Bulldog",
      age: 3,
      weight: 12,
      activityLevel: "normal",
      neutered: true,
      healthIssues: ["sensitive digestion", "gas"],
    },
  },
  {
    label: "Sterilised cat",
    goal: "sterilised",
    pet: {
      species: "cat",
      breed: "European shorthair",
      age: 5,
      weight: 5,
      activityLevel: "low",
      neutered: true,
      healthIssues: ["weight control"],
    },
  },
  {
    label: "Urinary cat",
    goal: "urinary",
    pet: {
      species: "cat",
      breed: "European shorthair",
      age: 5,
      weight: 5,
      activityLevel: "normal",
      neutered: true,
      healthIssues: ["urinary"],
    },
  },
  {
    label: "Senior dog",
    goal: "senior",
    pet: {
      species: "dog",
      breed: "Mixed breed",
      age: 10,
      weight: 18,
      activityLevel: "low",
      neutered: true,
      healthIssues: ["joint support"],
    },
  },
];

function isValidBucket(value) {
  return Array.isArray(value);
}

function topLabels(items) {
  return items
    .slice(0, 3)
    .map((item) => `${item.brand} ${item.display_name} (${item.ranking?.total_score ?? "?"})`)
    .join("<br>");
}

async function checkScenario(scenario) {
  const url = new URL("/api/account/foods/v2-recommendations", siteUrl).toString();
  const started = Date.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "NutriTail-food-v2-recommendation-smoke-qa/1.0",
      },
      body: JSON.stringify({
        goal: scenario.goal,
        format: "dry",
        limit_per_bucket: 3,
        pet: scenario.pet,
      }),
    });
    const body = await response.json().catch(() => null);
    const validShape =
      body &&
      isValidBucket(body.premium) &&
      isValidBucket(body.value) &&
      isValidBucket(body.hold) &&
      typeof body.total_candidates === "number";
    const hasUsableRecommendations =
      validShape && body.premium.length + body.value.length > 0;

    return {
      ...scenario,
      status: response.status,
      ok: response.ok && validShape && hasUsableRecommendations,
      duration_ms: Date.now() - started,
      total_candidates: body?.total_candidates ?? 0,
      premium_count: body?.premium?.length ?? 0,
      value_count: body?.value?.length ?? 0,
      hold_count: body?.hold?.length ?? 0,
      premium_top: validShape ? topLabels(body.premium) : "",
      value_top: validShape ? topLabels(body.value) : "",
      error: validShape ? "" : body?.error ?? "Invalid response shape",
    };
  } catch (error) {
    return {
      ...scenario,
      status: 0,
      ok: false,
      duration_ms: Date.now() - started,
      total_candidates: 0,
      premium_count: 0,
      value_count: 0,
      hold_count: 0,
      premium_top: "",
      value_top: "",
      error: error instanceof Error ? error.message : "Unknown request error",
    };
  }
}

function renderTable(rows) {
  return [
    "| Scenario | Status | Result | Candidates | Premium | Value | Hold | Top premium | Top value | Notes |",
    "| --- | ---: | --- | ---: | ---: | ---: | ---: | --- | --- | --- |",
    ...rows.map((row) =>
      [
        row.label,
        row.status || "error",
        row.ok ? "pass" : "fail",
        row.total_candidates,
        row.premium_count,
        row.value_count,
        row.hold_count,
        row.premium_top || "-",
        row.value_top || "-",
        row.error || `${row.duration_ms}ms`,
      ].join(" | ")
    ),
  ].join("\n");
}

async function main() {
  const rows = [];
  for (const scenario of scenarios) {
    rows.push(await checkScenario(scenario));
  }

  const passed = rows.filter((row) => row.ok).length;
  const failed = rows.length - passed;

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    [
      "# Food V2 Recommendation Smoke QA",
      "",
      `Generated: ${new Date().toISOString()}`,
      `Site: ${siteUrl}`,
      "",
      "## Summary",
      "",
      `- Scenarios checked: ${rows.length}`,
      `- Passed: ${passed}`,
      `- Failed: ${failed}`,
      "",
      "This smoke check verifies that the recommendations endpoint returns premium/value/hold buckets for common pet profiles. It does not assert exact brands because the Food V2 dataset changes frequently.",
      "",
      "## Results",
      "",
      renderTable(rows),
    ].join("\n"),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        siteUrl,
        checked: rows.length,
        passed,
        failed,
        report: reportPath,
      },
      null,
      2
    )
  );

  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
