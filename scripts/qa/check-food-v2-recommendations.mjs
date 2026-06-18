import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const siteUrl = process.env.NUTRITAIL_QA_SITE_URL || "https://nutritail.ai";
const reportPath = "reports/food_v2_recommendation_smoke_qa.md";
const scenariosPath =
  process.env.NUTRITAIL_RECOMMENDATION_SCENARIOS_PATH ||
  "data/evals/food-v2-recommendation-scenarios.json";

async function loadScenarios() {
  const raw = await readFile(scenariosPath, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.scenarios) ? parsed.scenarios : [];
}

function isValidBucket(value) {
  return Array.isArray(value);
}

function topLabels(items) {
  return items
    .slice(0, 3)
    .map((item) => `${item.brand} ${item.display_name} (${item.ranking?.total_score ?? "?"})`)
    .join("<br>");
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9α-ω]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function itemText(item) {
  return normalizeText(
    [
      item?.brand,
      item?.display_name,
      item?.life_stage,
      item?.dog_size,
      ...(item?.ranking?.reasons ?? []),
      ...(item?.ranking?.cautions ?? []),
      ...(item?.guard_flags ?? []),
      ...(item?.food_intelligence?.best_use_cases ?? []),
      ...(item?.food_intelligence?.not_ideal_cases ?? []),
    ].join(" ")
  );
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function combinedTopItems(body) {
  return [...(body?.premium ?? []), ...(body?.value ?? [])]
    .sort(
      (a, b) =>
        (b?.ranking?.total_score ?? 0) - (a?.ranking?.total_score ?? 0)
    )
    .slice(0, 3);
}

function expectationWarnings(scenario, body, hasUsableRecommendations) {
  const expectations = Array.isArray(scenario.expectations)
    ? scenario.expectations
    : [];
  const warnings = [];
  const top = combinedTopItems(body);
  const topPick = top[0] ?? null;
  const topText = itemText(topPick);

  for (const expectation of expectations) {
    if (expectation === "premium_or_value") {
      if (!hasUsableRecommendations) warnings.push("No premium/value recommendations.");
    } else if (expectation === "no_small_dog_top_pick") {
      if (hasAny(topText, ["mini", "xsmall", "x-small", "small breed", "small adult"])) {
        warnings.push("Top pick looks positioned for a small dog.");
      }
    } else if (expectation === "no_weight_control_top_pick") {
      if (hasAny(topText, ["light", "sterilised", "sterilized", "neutered", "weight", "obesity", "satiety"])) {
        warnings.push("Top pick looks weight-control positioned.");
      }
    } else if (expectation === "no_active_performance_top_pick") {
      if (hasAny(topText, ["active", "performance", "sport", "working", "energy rich", "high energy"])) {
        warnings.push("Top pick looks active/performance positioned.");
      }
    } else if (expectation === "no_unrelated_therapeutic_top_picks") {
      const therapeuticTerms = [
        "gastro",
        "gastrointestinal",
        "liver",
        "hepatic",
        "renal",
        "kidney",
        "urinary",
        "struvite",
        "oxalate",
        "diabetic",
        "obesity",
        "satiety",
        "pancreatic",
      ];
      if (top.some((item) => hasAny(itemText(item), therapeuticTerms))) {
        warnings.push("A top recommendation looks like an unrelated therapeutic food.");
      }
    } else if (expectation === "weight_or_sterilised_fit") {
      if (!hasAny(topText, ["light", "sterilised", "sterilized", "neutered", "weight", "obesity", "satiety", "lower calorie"])) {
        warnings.push("Top pick does not show weight/sterilised fit.");
      }
    } else if (expectation === "moderate_calorie_fat_top_pick") {
      const kcal = Number(topPick?.nutrition?.kcal_per_100g);
      const fat = Number(topPick?.nutrition?.fat_percent);
      if (Number.isFinite(kcal) && kcal > 380) {
        warnings.push(`Top pick kcal looks high for this scenario: ${kcal}.`);
      }
      if (Number.isFinite(fat) && fat > 15) {
        warnings.push(`Top pick fat looks high for this scenario: ${fat}.`);
      }
    } else if (expectation === "active_energy_fit") {
      const kcal = Number(topPick?.nutrition?.kcal_per_100g);
      const fat = Number(topPick?.nutrition?.fat_percent);
      const activeSignal = hasAny(topText, ["active", "performance", "energy", "high activity"]);
      if (!activeSignal && !(Number.isFinite(kcal) && kcal >= 360) && !(Number.isFinite(fat) && fat >= 15)) {
        warnings.push("Top pick does not show active/energy fit.");
      }
    } else if (expectation === "puppy_top_pick") {
      if (!hasAny(topText, ["puppy", "junior", "kitten", "growth"])) {
        warnings.push("Top pick does not show growth/life-stage fit.");
      }
    } else if (expectation === "large_breed_growth_fit") {
      if (!top.some((item) => hasAny(itemText(item), ["large", "maxi", "giant", "large breed"]))) {
        warnings.push("Top recommendations do not show large-breed growth fit.");
      }
    } else if (expectation === "senior_top_pick") {
      if (!hasAny(topText, ["senior", "mature", "7", "8", "10", "12"])) {
        warnings.push("Top pick does not look senior-positioned.");
      }
    } else if (expectation === "senior_or_joint_fit") {
      if (!hasAny(topText, ["senior", "mature", "joint", "mobility", "glucosamine", "chondroitin"])) {
        warnings.push("Top pick does not show senior or joint fit.");
      }
    } else if (expectation === "urinary_top_pick") {
      if (!hasAny(topText, ["urinary", "struvite", "oxalate"])) {
        warnings.push("Top pick does not look urinary-positioned.");
      }
    } else if (expectation === "renal_top_pick") {
      if (!hasAny(topText, ["renal", "kidney"])) {
        warnings.push("Top pick does not look renal-positioned.");
      }
    } else if (expectation === "no_urinary_only_for_renal") {
      if (hasAny(topText, ["urinary", "struvite", "oxalate"]) && !hasAny(topText, ["renal", "kidney"])) {
        warnings.push("Renal scenario top pick looks urinary-only.");
      }
    } else if (expectation === "phosphorus_caution_or_data") {
      const phosphorus = Number(topPick?.nutrition?.phosphorus_percent);
      if (!Number.isFinite(phosphorus) && !hasAny(topText, ["phosphorus", "phosphorus data"])) {
        warnings.push("Renal scenario lacks phosphorus data/caution on top pick.");
      }
    } else if (expectation === "mineral_caution_or_data") {
      const calcium = Number(topPick?.nutrition?.calcium_percent);
      const phosphorus = Number(topPick?.nutrition?.phosphorus_percent);
      if ((!Number.isFinite(calcium) || !Number.isFinite(phosphorus)) && !hasAny(topText, ["calcium", "phosphorus", "mineral"])) {
        warnings.push("Growth scenario lacks mineral data/caution on top pick.");
      }
    } else if (expectation === "sensitive_fit") {
      if (!hasAny(topText, ["sensitive", "digest", "gastro", "hypo"])) {
        warnings.push("Top pick does not look digestion-sensitive positioned.");
      }
    } else if (expectation === "no_chicken_top_pick") {
      if (hasAny(topText, ["chicken", "poultry"])) {
        warnings.push("Top pick appears to include chicken/poultry.");
      }
    } else if (expectation === "no_excluded_protein_top_picks") {
      const excluded = [
        ...(scenario.pet?.excludedIngredients ?? []),
        ...(scenario.pet?.allergies ?? []),
      ].map(normalizeText);
      if (
        excluded.length > 0 &&
        top.some((item) => excluded.some((term) => term && itemText(item).includes(term)))
      ) {
        warnings.push("A top recommendation appears to include an excluded protein.");
      }
    }
  }

  return warnings;
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
    const expectationIssues = validShape
      ? expectationWarnings(scenario, body, hasUsableRecommendations)
      : [];

    return {
      ...scenario,
      status: response.status,
      ok:
        response.ok &&
        validShape &&
        hasUsableRecommendations &&
        expectationIssues.length === 0,
      duration_ms: Date.now() - started,
      total_candidates: body?.total_candidates ?? 0,
      premium_count: body?.premium?.length ?? 0,
      value_count: body?.value?.length ?? 0,
      hold_count: body?.hold?.length ?? 0,
      premium_top: validShape ? topLabels(body.premium) : "",
      value_top: validShape ? topLabels(body.value) : "",
      error: validShape
        ? expectationIssues.join("; ")
        : body?.error ?? "Invalid response shape",
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
  const scenarios = await loadScenarios();
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
      `Scenario source: ${scenariosPath}`,
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
