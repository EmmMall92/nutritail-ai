import { readFile } from "node:fs/promises";
import { fallbackExtractIntake } from "@/lib/ai/intakeFallback";
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

  if (name !== "\u039a\u03cd\u03c1\u03ba\u03b7") {
    failures.push(`pet display name: expected \u039a\u03cd\u03c1\u03ba\u03b7 got ${name}`);
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

  return {
    id: "ui_helper_regressions",
    status: failures.length === 0 ? "pass" : "fail",
    failures,
    source: "ui_helpers",
  };
}

async function main() {
  const raw = await readFile(goldenPath, "utf8");
  const cases = JSON.parse(raw) as GoldenCase[];
  const results = [...cases.map(checkCase), checkUiHelpers()];
  const failed = results.filter((result) => result.status === "fail");

  console.log(
    JSON.stringify(
      {
        checked: results.length,
        passed: results.length - failed.length,
        failed: failed.length,
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
