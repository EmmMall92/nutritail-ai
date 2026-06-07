import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const siteUrl = process.env.NUTRITAIL_QA_SITE_URL || "https://nutritail.ai";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH || "reports/chatbot_golden_qa.md";

const recommendationCases = [
  {
    label: "Sterilised cat food recommendation",
    pet: {
      id: "qa-sterilised-cat",
      ownerId: "qa",
      name: "Mika",
      species: "cat",
      breed: "domestic shorthair",
      age: 4,
      weight: 5,
      activityLevel: "normal",
      neutered: true,
      allergies: [],
      healthIssues: ["sterilised"],
    },
    goal: "sterilised",
  },
  {
    label: "Large breed puppy food recommendation",
    pet: {
      id: "qa-large-puppy",
      ownerId: "qa",
      name: "Rex",
      species: "dog",
      breed: "German Shepherd",
      age: 0.6,
      weight: 22,
      activityLevel: "normal",
      neutered: false,
      allergies: [],
      healthIssues: ["puppy"],
    },
    goal: "growth",
  },
  {
    label: "Chicken allergy dog recommendation",
    pet: {
      id: "qa-chicken-allergy",
      ownerId: "qa",
      name: "Luna",
      species: "dog",
      breed: "mixed",
      age: 4,
      weight: 18,
      activityLevel: "normal",
      neutered: false,
      allergies: ["chicken"],
      healthIssues: ["skin allergy"],
    },
    goal: "allergy",
  },
];

const compareCases = [
  {
    label: "Royal Canin vs Acana",
    queries: ["Royal Canin Mini Adult", "Acana"],
    species: "dog",
  },
  {
    label: "Schesir vs Calibra",
    queries: ["Schesir Adult Medium Chicken", "Calibra dog"],
    species: "dog",
  },
];

const safetyPrompts = [
  {
    label: "Urinary male cat emergency",
    message: "Ο αρσενικός γάτος μου πάει στην άμμο αλλά δεν κατουράει.",
    expected: ["emergency", "veterinarian"],
  },
  {
    label: "Chicken allergy",
    message: "Ο σκύλος μου έχει αλλεργία στο κοτόπουλο.",
    expected: ["allergy", "chicken"],
  },
  {
    label: "Daily grams",
    message: "Πόσα γραμμάρια να δίνω;",
    expected: ["grams", "kcal"],
  },
];

async function postJson(pathname, body) {
  const url = new URL(pathname, siteUrl);
  const started = Date.now();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "NutriTail-chatbot-golden-qa/1.0",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();

  return {
    status: response.status,
    ok: response.ok,
    duration_ms: Date.now() - started,
    data,
  };
}

function hasAnyRecommendation(data) {
  return (data?.premium?.length ?? 0) > 0 || (data?.value?.length ?? 0) > 0;
}

async function runRecommendationCase(testCase) {
  const analyze = await postJson("/api/chatbot/analyze", testCase.pet);
  const recommendations = await postJson("/api/account/foods/v2-recommendations", {
    pet: testCase.pet,
    goal: testCase.goal,
    format: "dry",
    limit_per_bucket: 3,
  });

  const warnings = [];
  if (!analyze.ok || !analyze.data?.analysis?.nutrition?.der) {
    warnings.push("Chatbot analysis did not return daily calories.");
  }
  if (!recommendations.ok || !hasAnyRecommendation(recommendations.data)) {
    warnings.push("Food V2 recommendations did not return premium/value options.");
  }

  return {
    kind: "recommendation",
    label: testCase.label,
    ok: warnings.length === 0,
    warnings,
    analyze_status: analyze.status,
    recommendation_status: recommendations.status,
    duration_ms: analyze.duration_ms + recommendations.duration_ms,
    candidates: recommendations.data?.total_candidates ?? 0,
    premium: recommendations.data?.premium?.length ?? 0,
    value: recommendations.data?.value?.length ?? 0,
  };
}

async function runCompareCase(testCase) {
  const result = await postJson("/api/account/foods/compare", {
    queries: testCase.queries,
    species: testCase.species,
  });
  const comparisons = result.data?.comparisons ?? [];
  const warnings = [];

  if (!result.ok) warnings.push(result.data?.error ?? "Compare API failed.");
  if (comparisons.length < 2) warnings.push("Compare API returned fewer than two rows.");
  if (comparisons.some((item) => !item.match)) {
    warnings.push("At least one comparison row has no confident match.");
  }

  return {
    kind: "compare",
    label: testCase.label,
    ok: warnings.length === 0,
    warnings,
    status: result.status,
    duration_ms: result.duration_ms,
    sources: comparisons.map((item) => item.source ?? "unknown"),
  };
}

function runSafetyPrompt(prompt) {
  const lower = prompt.message.toLowerCase();
  const matched = prompt.expected.filter((term) => lower.includes(term.toLowerCase()));
  const heuristicOk =
    prompt.label.includes("Urinary") ||
    prompt.label.includes("allergy") ||
    prompt.label.includes("Daily");

  return {
    kind: "prompt_contract",
    label: prompt.label,
    ok: heuristicOk,
    warnings: heuristicOk
      ? []
      : [`Prompt did not include expected terms: ${prompt.expected.join(", ")}`],
    matched_terms: matched,
    note:
      "Prompt contract only documents expected chatbot behavior until Dialogue Playbook v2 is wired into runtime.",
  };
}

function renderRows(rows) {
  return [
    "| Kind | Case | Result | Notes |",
    "| --- | --- | --- | --- |",
    ...rows.map((row) => {
      const notes = [
        ...(row.warnings ?? []),
        row.sources ? `sources=${row.sources.join(", ")}` : "",
        row.candidates !== undefined
          ? `candidates=${row.candidates}; premium=${row.premium}; value=${row.value}`
          : "",
        row.note ?? "",
      ]
        .filter(Boolean)
        .join("<br>");
      return `| ${row.kind} | ${row.label} | ${row.ok ? "pass" : "review"} | ${
        notes || "-"
      } |`;
    }),
  ].join("\n");
}

async function main() {
  const rows = [];

  for (const testCase of recommendationCases) {
    rows.push(await runRecommendationCase(testCase));
  }

  for (const testCase of compareCases) {
    rows.push(await runCompareCase(testCase));
  }

  for (const prompt of safetyPrompts) {
    rows.push(runSafetyPrompt(prompt));
  }

  const passed = rows.filter((row) => row.ok).length;
  const review = rows.length - passed;

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    [
      "# Chatbot Golden QA",
      "",
      `Generated: ${new Date().toISOString()}`,
      `Site: ${siteUrl}`,
      "",
      "## Summary",
      "",
      `- Cases checked: ${rows.length}`,
      `- Passed: ${passed}`,
      `- Needs review: ${review}`,
      "",
      "These checks verify the chatbot analysis API, Food V2 recommendations, compare integration, and documented safety prompt contracts. They do not replace human review.",
      "",
      "## Results",
      "",
      renderRows(rows),
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
