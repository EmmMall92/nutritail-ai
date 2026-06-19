import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const siteUrl = process.env.NUTRITAIL_QA_SITE_URL || "https://nutritail.ai";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ||
  "reports/food_v2_ranking_scenario_audit.md";
const scenariosPath =
  process.env.NUTRITAIL_RECOMMENDATION_SCENARIOS_PATH ||
  "data/evals/food-v2-recommendation-scenarios.json";

async function loadScenarios() {
  const raw = await readFile(scenariosPath, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.scenarios) ? parsed.scenarios : [];
}

function firstPicks(data) {
  return [...(data.premium ?? []), ...(data.value ?? [])].slice(0, 3);
}

function foodText(food) {
  return [
    food?.brand,
    food?.display_name,
    food?.formula_key,
    food?.life_stage,
    food?.dog_size,
    food?.ranking?.reasons?.join(" "),
    food?.ranking?.cautions?.join(" "),
    food?.guard_flags?.map((flag) => flag.message).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function positioningText(food) {
  return [
    food?.brand,
    food?.display_name,
    food?.formula_key,
    food?.life_stage,
    food?.dog_size,
    food?.health_tags?.join(" "),
    food?.medical_tags?.join(" "),
    food?.commercial_tags?.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function nutritionHas(food, fields) {
  return fields.some((field) => {
    const value = food?.nutrition?.[field];
    return typeof value === "number" && Number.isFinite(value);
  });
}

function firstPickHasDataOrCaution(first, fields, cautionTerms) {
  if (!first) return false;
  if (nutritionHas(first, fields)) return true;
  const text = foodText(first);
  return cautionTerms.some((term) => text.includes(term));
}

function hasAnyTerm(text, terms) {
  return terms.some((term) => text.includes(term));
}

const INGREDIENT_ALIASES = {
  beef: ["beef", "μοσχαρι", "μοσχάρι", "moschari", "moshari"],
  chicken: ["chicken", "poultry", "κοτοπου", "κοτόπου", "kotopoulo"],
  duck: ["duck", "παπια", "πάπια", "papia"],
  fish: ["fish", "salmon", "tuna", "cod", "sardine", "herring", "trout", "ψαρι", "ψάρι"],
  lamb: ["lamb", "αρνι", "αρνί", "arni"],
  pork: ["pork", "χοιρινο", "χοιρινό", "xoirino", "hoirino"],
  salmon: ["salmon", "σολομος", "σολομός", "solomos"],
  turkey: ["turkey", "γαλοπουλα", "γαλοπούλα", "poultry"],
};

function normalizedIngredientTerms(values = []) {
  const terms = new Set();

  for (const value of values) {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (!normalized) continue;

    terms.add(normalized);
    for (const [key, aliases] of Object.entries(INGREDIENT_ALIASES)) {
      if (normalized.includes(key) || aliases.some((alias) => normalized.includes(alias))) {
        aliases.forEach((alias) => terms.add(alias));
      }
    }
  }

  return [...terms];
}

function checkExpectations(scenario, data) {
  const picks = firstPicks(data);
  const first = picks[0];
  const firstText = foodText(first);
  const warnings = [];

  for (const expectation of scenario.expectations ?? []) {
    if (expectation === "premium_or_value" && picks.length === 0) {
      warnings.push("No premium/value picks returned.");
    }

    if (expectation === "no_small_dog_top_pick") {
      if (hasAnyTerm(firstText, ["small", "mini"])) {
        warnings.push("Top pick appears to target small/mini dogs.");
      }
    }

    if (expectation === "no_chicken_top_pick") {
      if (hasAnyTerm(firstText, ["chicken", "κοτοπου", "poultry"])) {
        warnings.push("Top pick may contain chicken/poultry.");
      }
    }

    if (expectation === "no_excluded_protein_top_picks") {
      const excludedTerms = normalizedIngredientTerms([
        ...(scenario.pet?.allergies ?? []),
        ...(scenario.pet?.excludedIngredients ?? []),
      ]);
      const conflictingPicks = picks
        .map((pick, index) => ({ index: index + 1, text: foodText(pick) }))
        .filter((pick) => hasAnyTerm(pick.text, excludedTerms));

      if (conflictingPicks.length > 0) {
        warnings.push(
          `Top picks include declared exclusions: #${conflictingPicks
            .map((pick) => pick.index)
            .join(", #")}.`
        );
      }
    }

    if (expectation === "puppy_top_pick") {
      if (!hasAnyTerm(firstText, ["puppy", "junior", "kitten"])) {
        warnings.push("Top pick does not look puppy/junior/kitten focused.");
      }
    }

    if (expectation === "urinary_top_pick") {
      if (!hasAnyTerm(firstText, ["urinary", "struvite"])) {
        warnings.push("Top pick does not look urinary focused.");
      }
    }

    if (expectation === "renal_top_pick") {
      if (!hasAnyTerm(firstText, ["renal", "kidney"])) {
        warnings.push("Top pick does not look renal focused.");
      }
    }

    if (expectation === "weight_or_sterilised_fit") {
      if (
        !hasAnyTerm(firstText, [
          "weight",
          "light",
          "sterilised",
          "sterilized",
          "satiety",
        ])
      ) {
        warnings.push("Top pick does not show clear weight/sterilised fit.");
      }
    }

    if (expectation === "no_weight_control_top_pick") {
      if (
        hasAnyTerm(positioningText(first), [
          "weight",
          "light",
          "sterilised",
          "sterilized",
          "satiety",
          "obesity",
        ])
      ) {
        warnings.push("Top pick looks weight-control positioned.");
      }
    }

    if (expectation === "active_energy_fit") {
      const kcal = first?.nutrition?.kcal_per_100g;
      const fat = first?.nutrition?.fat_percent;
      if (
        !hasAnyTerm(firstText, ["active", "performance", "energy", "working"]) &&
        !(typeof kcal === "number" && kcal >= 360) &&
        !(typeof fat === "number" && fat >= 15)
      ) {
        warnings.push("Top pick does not show active/energy fit.");
      }
    }

    if (expectation === "value_first_for_budget") {
      const valuePositioned =
        first?.ranking?.bucket === "value" ||
        hasAnyTerm(firstText, [
          "classic",
          "regular",
          "basic",
          "daily",
          "everyday",
          "essential",
          "maintenance",
          "complete",
          "balance",
        ]);
      const premiumPositioned = hasAnyTerm(positioningText(first), [
        "grain free",
        "monoprotein",
        "veterinary",
        "vet",
        "renal",
        "urinary",
        "hypoallergenic",
        "breed specific",
      ]);

      if (!valuePositioned || premiumPositioned) {
        warnings.push("Budget/value scenario top pick does not look like a first value option.");
      }
    }

    if (expectation === "moderate_calorie_fat_top_pick") {
      const kcal = first?.nutrition?.kcal_per_100g;
      const fat = first?.nutrition?.fat_percent;
      const positionedForControl = hasAnyTerm(firstText, [
        "weight",
        "light",
        "sterilised",
        "sterilized",
        "satiety",
      ]);
      const activeFormula = hasAnyTerm(firstText, [
        "active",
        "performance",
        "energy",
        "sport",
        "working",
      ]);

      if (activeFormula && !positionedForControl) {
        warnings.push("Top pick looks active/performance-oriented for a sterilised pet.");
      }
      if (typeof kcal === "number" && kcal > 390 && !positionedForControl) {
        warnings.push("Top pick calories look high for a sterilised pet.");
      }
      if (typeof fat === "number" && fat >= 17 && !positionedForControl) {
        warnings.push("Top pick fat looks high for a sterilised pet.");
      }
    }

    if (expectation === "sensitive_fit") {
      if (
        !hasAnyTerm(firstText, [
          "sensitive",
          "digest",
          "gastro",
          "intestinal",
        ])
      ) {
        warnings.push("Top pick does not show clear sensitive digestion fit.");
      }
    }

    if (expectation === "senior_or_joint_fit") {
      if (
        !hasAnyTerm(firstText, ["senior", "mature", "joint", "mobility"])
      ) {
        warnings.push("Top pick does not show clear senior/joint fit.");
      }
    }

    if (expectation === "senior_top_pick") {
      if (!hasAnyTerm(firstText, ["senior", "mature", "7+", "8+", "10+", "12+"])) {
        warnings.push("Top pick is not clearly senior-positioned.");
      }
    }

    if (expectation === "large_breed_growth_fit") {
      if (!hasAnyTerm(firstText, ["large breed", "large puppy", "puppy large", "maxi", "giant"])) {
        warnings.push("Top pick is not clearly large-breed puppy positioned.");
      }
    }

    if (expectation === "no_urinary_only_for_renal") {
      if (
        hasAnyTerm(firstText, ["urinary", "struvite", "oxalate"]) &&
        !hasAnyTerm(firstText, ["renal", "kidney"])
      ) {
        warnings.push("Renal scenario returned urinary/oxalate positioning without renal/kidney positioning.");
      }
    }

    if (expectation === "no_unrelated_therapeutic_top_picks") {
      const unrelatedTherapeuticPick = picks.find((pick) =>
        hasAnyTerm(positioningText(pick), [
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
        ])
      );

      if (unrelatedTherapeuticPick) {
        warnings.push(
          `Top picks include unrelated therapeutic positioning: ${
            unrelatedTherapeuticPick.display_name ?? "unknown"
          }.`
        );
      }
    }

    if (expectation === "mineral_caution_or_data") {
      if (
        !firstPickHasDataOrCaution(
          first,
          ["calcium_percent", "phosphorus_percent"],
          ["calcium", "phosphorus", "mineral"]
        )
      ) {
        warnings.push("Growth top pick lacks calcium/phosphorus data or caution.");
      }
    }

    if (expectation === "phosphorus_caution_or_data") {
      if (
        !firstPickHasDataOrCaution(
          first,
          ["phosphorus_percent"],
          ["phosphorus", "renal", "kidney"]
        )
      ) {
        warnings.push("Renal top pick lacks phosphorus data or caution.");
      }
    }
  }

  return warnings;
}

function renderPick(food, index) {
  if (!food) return `| ${index} | - | - | - | - | - |`;
  const score = food.ranking?.total_score ?? "-";
  const bucket = food.ranking?.bucket ?? "-";
  const reasons = (food.ranking?.reasons ?? []).slice(0, 3).join("; ") || "-";
  const cautions = (food.ranking?.cautions ?? []).slice(0, 2).join("; ") || "-";
  return `| ${index} | ${food.brand ?? "-"} | ${
    food.display_name ?? "-"
  } | ${bucket} | ${score} | ${reasons} ${
    cautions !== "-" ? `Cautions: ${cautions}` : ""
  } |`;
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
    `- Expectations: ${(row.expectations ?? []).join(", ") || "-"}`,
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
  const scenarios = await loadScenarios();
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
      `Scenario source: ${scenariosPath}`,
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
        scenarioSource: scenariosPath,
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
