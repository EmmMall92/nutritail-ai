import { readFile } from "node:fs/promises";
import { fallbackExtractIntake } from "@/lib/ai/intakeFallback";

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
    source: result.canUse ? "fallback" : "none",
  };
}

async function main() {
  const raw = await readFile(goldenPath, "utf8");
  const cases = JSON.parse(raw) as GoldenCase[];
  const results = cases.map(checkCase);
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
