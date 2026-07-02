import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fallbackExtractIntake } from "@/lib/ai/intakeFallback";
import { validateAiIntakeExtraction } from "@/lib/ai/intakeValidation";
import { detectFoodFormatPreference } from "@/lib/chatbot/foodFormatPreference";
import { parseTastePreferences } from "@/lib/chatbot/tastePreferences";
import { formatPetDisplayName } from "@/lib/petName";

type GoldenCase = {
  id: string;
  message: string;
  expect: Record<string, unknown>;
};

const goldenPath =
  process.env.NUTRITAIL_AI_INTAKE_GOLDEN_PATH ??
  "data/evals/ai-intake-golden-cases.json";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ?? "reports/ai_intake_golden_qa.md";

function includesExpectedArray(actual: unknown, expected: unknown[]) {
  if (!Array.isArray(actual)) return false;

  return expected.every((item) => actual.includes(item));
}

function checkCase(testCase: GoldenCase) {
  const result = fallbackExtractIntake(testCase.message);
  const failures: string[] = [];

  for (const [field, expected] of Object.entries(testCase.expect)) {
    const actual = result.data[field as keyof typeof result.data];

    if (Array.isArray(expected)) {
      if (!includesExpectedArray(actual, expected)) {
        failures.push(
          `${field}: expected to include ${expected.join(", ")} got ${JSON.stringify(actual)}`
        );
      }
      continue;
    }

    if (actual !== expected) {
      failures.push(`${field}: expected ${String(expected)} got ${String(actual)}`);
    }
  }

  return {
    id: testCase.id,
    status: failures.length === 0 ? "pass" : "fail",
    failures,
    source: result.acceptedFields.length > 0 ? "fallback" : "none",
  };
}

function checkUiHelpers() {
  const failures: string[] = [];
  const name = formatPetDisplayName("\u03c4\u03b7\u03bd \u03bb\u03ad\u03bd\u03b5 \u039a\u03cd\u03c1\u03ba\u03b7");
  const repeatedArticleName = formatPetDisplayName(
    "\u03c4\u03b7\u03bd \u03bb\u03ad\u03bd\u03b5 \u03c4\u03b7\u03bd \u039a\u03cd\u03c1\u03ba\u03b7"
  );
  const speciesOwnerName = formatPetDisplayName(
    "\u03bf \u03c3\u03ba\u03cd\u03bb\u03bf\u03c2 \u03bc\u03bf\u03c5 \u03bb\u03ad\u03b3\u03b5\u03c4\u03b1\u03b9 \u03bb\u03ad\u03c9\u03bd\u03b9\u03b4\u03b1\u03c2"
  );
  const englishNamed = formatPetDisplayName("my dog is named luna");

  if (name !== "\u039a\u03cd\u03c1\u03ba\u03b7") {
    failures.push(`pet display name: expected \u039a\u03cd\u03c1\u03ba\u03b7 got ${name}`);
  }

  if (repeatedArticleName !== "\u039a\u03cd\u03c1\u03ba\u03b7") {
    failures.push(
      `pet display repeated article: expected \u039a\u03cd\u03c1\u03ba\u03b7 got ${repeatedArticleName}`
    );
  }

  if (speciesOwnerName !== "\u039b\u03b5\u03c9\u03bd\u03af\u03b4\u03b1\u03c2") {
    failures.push(
      `pet display species-owner phrase: expected \u039b\u03b5\u03c9\u03bd\u03af\u03b4\u03b1\u03c2 got ${speciesOwnerName}`
    );
  }

  if (englishNamed !== "Luna") {
    failures.push(`pet display English named phrase: expected Luna got ${englishNamed}`);
  }

  const preferences = parseTastePreferences(
    "\u03a4\u03b7\u03c2 \u03b1\u03c1\u03ad\u03c3\u03b5\u03b9 \u03c4\u03bf \u03ba\u03bf\u03c4\u03cc\u03c0\u03bf\u03c5\u03bb\u03bf \u03ba\u03b1\u03b9 \u03b4\u03b5\u03bd \u03c4\u03b7\u03c2 \u03b1\u03c1\u03ad\u03c3\u03b5\u03b9 \u03ba\u03b1\u03b8\u03cc\u03bb\u03bf\u03c5 \u03bf \u03c3\u03bf\u03bb\u03bf\u03bc\u03cc\u03c2"
  );

  if (!preferences.preferredProteins.includes("chicken")) {
    failures.push("taste preferences: expected chicken in preferredProteins");
  }

  if (!preferences.excludedIngredients.includes("salmon")) {
    failures.push("taste preferences: expected salmon in excludedIngredients");
  }

  if (preferences.preferredProteins.includes("salmon")) {
    failures.push("taste preferences: salmon must not appear in preferredProteins");
  }

  const mixedPreferences = parseTastePreferences(
    "\u03c4\u03bf\u03c5 \u03b1\u03c1\u03b5\u03c3\u03b5\u03b9 \u03c4\u03bf \u03ba\u03bf\u03c4\u03bf\u03c0\u03bf\u03c5\u03bb\u03bf \u03ba\u03b1\u03b9 \u03b4\u03b5\u03bd \u03c4\u03c1\u03c9\u03b5\u03b9 \u03b1\u03c1\u03bd\u03b9 \u03ba\u03b1\u03b9 \u03bc\u03bf\u03c3\u03c7\u03b1\u03c1\u03b9"
  );

  if (!mixedPreferences.preferredProteins.includes("chicken")) {
    failures.push("mixed Greek preferences: expected chicken in preferredProteins");
  }

  if (!mixedPreferences.excludedIngredients.includes("lamb")) {
    failures.push("mixed Greek preferences: expected lamb in excludedIngredients");
  }

  if (!mixedPreferences.excludedIngredients.includes("beef")) {
    failures.push("mixed Greek preferences: expected beef in excludedIngredients");
  }

  const englishAvoidance = parseTastePreferences("likes salmon, no chicken");

  if (!englishAvoidance.preferredProteins.includes("salmon")) {
    failures.push("English avoidance: expected salmon in preferredProteins");
  }

  if (!englishAvoidance.excludedIngredients.includes("chicken")) {
    failures.push("English avoidance: expected chicken in excludedIngredients");
  }

  if (englishAvoidance.preferredProteins.includes("chicken")) {
    failures.push("English avoidance: chicken must not appear in preferredProteins");
  }

  const formatCases = [
    {
      message: "Έχω σκύλο που τρώει μόνο κονσέρβα.",
      expected: "wet",
      label: "Greek wet-only canned food",
    },
    {
      message: "Έχω σκύλο που αρνείται όλες τις ξηρές τροφές.",
      expected: "wet",
      label: "Greek dry refusal",
    },
    {
      message: "Τρώει ξηρά μόνο όταν βάλω υγρή.",
      expected: "mixed",
      label: "Greek dry with wet topper",
    },
    {
      message: "He only eats canned food.",
      expected: "wet",
      label: "English wet-only canned food",
    },
  ] as const;

  for (const testCase of formatCases) {
    const actual = detectFoodFormatPreference(testCase.message);
    if (actual !== testCase.expected) {
      failures.push(`${testCase.label}: expected ${testCase.expected}, got ${actual ?? "none"}`);
    }
  }

  return {
    id: "ui_helper_regressions",
    status: failures.length === 0 ? "pass" : "fail",
    failures,
    source: "ui_helpers",
  };
}

function checkValidatedOpenAiCleanup() {
  const failures: string[] = [];
  const result = validateAiIntakeExtraction({
    petName: "\u03c4\u03b7\u03bd \u03bb\u03ad\u03bd\u03b5 \u039a\u03cd\u03c1\u03ba\u03b7",
    preferredProteins: [
      "\u03ba\u03bf\u03c4\u03cc\u03c0\u03bf\u03c5\u03bb\u03bf",
      "\u03c3\u03bf\u03bb\u03bf\u03bc\u03cc\u03c2",
    ],
    excludedIngredients: ["salmon"],
    confidence: "medium",
  });

  if (result.data.petName !== "\u039a\u03cd\u03c1\u03ba\u03b7") {
    failures.push(`validated pet name: expected \u039a\u03cd\u03c1\u03ba\u03b7 got ${result.data.petName}`);
  }

  if (!result.data.preferredProteins?.includes("chicken")) {
    failures.push("validated proteins: expected chicken in preferredProteins");
  }

  if (result.data.preferredProteins?.includes("salmon")) {
    failures.push("validated proteins: salmon must be removed from preferredProteins");
  }

  if (!result.data.excludedIngredients?.includes("salmon")) {
    failures.push("validated proteins: expected salmon in excludedIngredients");
  }

  const allergyConflict = validateAiIntakeExtraction({
    preferredProteins: [
      "\u03ba\u03bf\u03c4\u03cc\u03c0\u03bf\u03c5\u03bb\u03bf",
      "salmon",
    ],
    allergies: ["\u03c3\u03bf\u03bb\u03bf\u03bc\u03cc\u03c2"],
    currentFoodName: "\u03c3\u03bf\u03bb\u03bf\u03bc\u03cc\u03c2",
    confidence: "medium",
  });

  if (!allergyConflict.data.preferredProteins?.includes("chicken")) {
    failures.push("validated allergy conflict: expected chicken in preferredProteins");
  }

  if (allergyConflict.data.preferredProteins?.includes("salmon")) {
    failures.push("validated allergy conflict: salmon must be removed from preferredProteins");
  }

  if (!allergyConflict.data.allergies?.includes("salmon")) {
    failures.push("validated allergy conflict: expected canonical salmon in allergies");
  }

  if (allergyConflict.data.currentFoodName) {
    failures.push("validated allergy conflict: avoided bare ingredient must not become currentFoodName");
  }

  return {
    id: "validated_openai_cleanup",
    status: failures.length === 0 ? "pass" : "fail",
    failures,
    source: "validation",
  };
}

function checkFallbackPetNameCleanup() {
  const failures: string[] = [];
  const cases = [
    {
      message:
        "\u03c4\u03b7\u03bd \u03bb\u03ad\u03bd\u03b5 \u03c4\u03b7\u03bd \u039a\u03cd\u03c1\u03ba\u03b7",
      expected: "\u039a\u03cd\u03c1\u03ba\u03b7",
    },
    {
      message:
        "\u03bf \u03c3\u03ba\u03cd\u03bb\u03bf\u03c2 \u03bc\u03bf\u03c5 \u03bb\u03ad\u03b3\u03b5\u03c4\u03b1\u03b9 \u03bb\u03ad\u03c9\u03bd\u03b9\u03b4\u03b1\u03c2",
      expected: "\u039b\u03b5\u03c9\u03bd\u03af\u03b4\u03b1\u03c2",
    },
    {
      message: "my dog is named luna",
      expected: "Luna",
    },
  ];

  for (const testCase of cases) {
    const result = fallbackExtractIntake(testCase.message);
    if (result.data.petName !== testCase.expected) {
      failures.push(
        `fallback pet name: expected ${testCase.expected} got ${result.data.petName} for "${testCase.message}"`
      );
    }
  }

  return {
    id: "fallback_pet_name_cleanup",
    status: failures.length === 0 ? "pass" : "fail",
    failures,
    source: "fallback",
  };
}

async function main() {
  const raw = await readFile(goldenPath, "utf8");
  const cases = JSON.parse(raw) as GoldenCase[];
  const results = [
    ...cases.map(checkCase),
    checkUiHelpers(),
    checkValidatedOpenAiCleanup(),
    checkFallbackPetNameCleanup(),
  ];
  const failed = results.filter((result) => result.status === "fail");
  const report = [
    "# AI Intake Golden QA",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This QA checks deterministic intake fallback, validation cleanup, pet-name cleanup, and taste-preference parsing.",
    "",
    "## Summary",
    "",
    `- Cases checked: ${results.length}`,
    `- Passed: ${results.length - failed.length}`,
    `- Failed: ${failed.length}`,
    "",
    "## Results",
    "",
    "| Case | Status | Source | Notes |",
    "| --- | --- | --- | --- |",
    ...results.map((result) => {
      const notes = result.failures.length > 0 ? result.failures.join("; ") : "-";
      return `| ${result.id} | ${result.status} | ${result.source} | ${notes} |`;
    }),
  ];

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${report.join("\n")}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        checked: results.length,
        passed: results.length - failed.length,
        failed: failed.length,
        report: reportPath,
        results,
      },
      null,
      2
    )
  );

  if (failed.length > 0) {
    process.exit(1);
  }
}

void main();
