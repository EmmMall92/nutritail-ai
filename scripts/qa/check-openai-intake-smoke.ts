import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { buildNutriTailSystemPrompt } from "@/lib/ai/promptInstructions";
import { validateAiIntakeExtraction } from "@/lib/ai/intakeValidation";
import type { AiIntakeExtraction } from "@/lib/ai/intakeTypes";

type ExpectedValue = string | number | boolean | null | string[];

type SmokeCase = {
  id: string;
  message: string;
  expect: Record<string, ExpectedValue>;
};

const envPath = process.env.NUTRITAIL_QA_ENV_PATH || ".env.local";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH || "reports/openai_intake_smoke_qa.md";

const cases: SmokeCase[] = [
  {
    id: "greek_full_pet_profile",
    message:
      "Έχω σκύλο, την λένε Κύρκη, είναι 6 κιλά, 6 ετών, χαμηλή δραστηριότητα, στειρωμένη. Της αρέσει κοτόπουλο και δεν της αρέσει σολομός.",
    expect: {
      species: "dog",
      petName: "Κύρκη",
      weightKg: 6,
      ageYears: 6,
      activityLevel: "low",
      neutered: true,
      preferredProteins: ["chicken"],
      excludedIngredients: ["salmon"],
    },
  },
  {
    id: "english_weight_loss_cat",
    message:
      "I have a sterilised indoor cat, 5 kg, 4 years old, and I want weight loss.",
    expect: {
      species: "cat",
      weightKg: 5,
      ageYears: 4,
      neutered: true,
      activityLevel: "low",
      weightGoal: "loss",
    },
  },
  {
    id: "greek_allergy_avoidance",
    message: "Ο σκύλος μου έχει αλλεργία στο κοτόπουλο και στη γαλοπούλα.",
    expect: {
      species: "dog",
      allergies: ["chicken", "turkey"],
      excludedIngredients: ["chicken", "turkey"],
    },
  },
  {
    id: "greek_urinary_red_flag",
    message: "Ο γάτος μου προσπαθεί να κατουρήσει και δεν μπορεί.",
    expect: {
      species: "cat",
      redFlags: ["urinary_blockage"],
    },
  },
  {
    id: "implausible_weight_rejected",
    message: "Έχω σκύλο 115 κιλά.",
    expect: {
      species: "dog",
      weightKg: null,
    },
  },
];

function assertSmokeCaseEncoding() {
  const mojibakePattern =
    /(?:\?{3,}|Ξ|Ο€|Ο|Β«|Β»|\uFFFD|\u00C2|\u00CE|\u00CF)/u;
  const damaged = cases.filter((item) => mojibakePattern.test(item.message));
  if (damaged.length > 0) {
    throw new Error(
      `OpenAI intake smoke cases contain damaged Greek text: ${damaged
        .map((item) => item.id)
        .join(", ")}`
    );
  }
}

function extractJsonObject(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]) as AiIntakeExtraction;
  } catch {
    return null;
  }
}

async function extractWithOpenAi(client: OpenAI, message: string) {
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: [
          buildNutriTailSystemPrompt("fact_extraction"),
          "",
          "Allowed enums: species dog|cat, activityLevel low|normal|high, weightGoal maintain|loss|gain, language el|en, confidence high|medium|low.",
        ].join("\n"),
      },
      {
        role: "user",
        content: `Message:\n${message}\n\nReturn JSON with keys: species, petName, weightKg, ageYears, activityLevel, neutered, healthIssues, allergies, currentFoodName, preferredProteins, excludedIngredients, weightGoal, language, missingFields, redFlags, confidence, notes.`,
      },
    ],
    temperature: 0,
    max_output_tokens: 700,
  });

  const parsed = extractJsonObject(response.output_text ?? "");
  if (!parsed) {
    return {
      source: "none" as const,
      data: {},
    };
  }

  return {
    ...validateAiIntakeExtraction(parsed),
    source: "openai" as const,
  };
}

async function loadEnvFile() {
  try {
    const raw = await readFile(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // Local and CI environments may inject env vars without an .env.local file.
  }
}

function includesExpectedArray(actual: unknown, expected: string[]) {
  if (!Array.isArray(actual)) return false;
  return expected.every((item) => actual.includes(item));
}

function matchesExpected(actual: unknown, expected: ExpectedValue) {
  if (Array.isArray(expected)) return includesExpectedArray(actual, expected);
  return actual === expected;
}

function renderValue(value: unknown) {
  return JSON.stringify(value);
}

async function writeReport(lines: string[]) {
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  assertSmokeCaseEncoding();
  await loadEnvFile();

  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY?.trim());

  if (!hasOpenAiKey) {
    await writeReport([
      "# OpenAI Intake Smoke QA",
      "",
      `Generated: ${new Date().toISOString()}`,
      "Status: skipped",
      "",
      "No usable `OPENAI_API_KEY` was available in the QA environment.",
      "This is expected in CI unless the secret is intentionally enabled there.",
      "",
      "The smoke fixture still validates clean Greek prompts and the same fact-extraction prompt contract used by the app.",
      "The deterministic fallback intake QA still runs separately through `npm.cmd run qa:ai-intake`.",
    ]);

    console.log(
      JSON.stringify(
        {
          status: "skipped",
          reason: "OPENAI_API_KEY is not configured",
          report: reportPath,
        },
        null,
        2
      )
    );
    return;
  }

  const results = [];
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  for (const item of cases) {
    const result = await extractWithOpenAi(client, item.message);

    const failures: string[] = [];
    if (result.source !== "openai") {
      failures.push(`expected source openai, got ${result.source}`);
    }

    for (const [field, expected] of Object.entries(item.expect)) {
      const actual = result.data[field as keyof typeof result.data];
      if (!matchesExpected(actual, expected)) {
        failures.push(
          `${field}: expected ${renderValue(expected)}, got ${renderValue(actual)}`
        );
      }
    }

    results.push({
      id: item.id,
      status: failures.length === 0 ? "pass" : "fail",
      source: result.source,
      failures,
    });
  }

  const failed = results.filter((result) => result.status === "fail");

  await writeReport([
    "# OpenAI Intake Smoke QA",
    "",
    `Generated: ${new Date().toISOString()}`,
    "Status: completed",
    "",
    "This smoke test checks that OpenAI is used only for structured pet fact extraction.",
    "It uses the same NutriTail fact-extraction prompt contract as the app.",
    "It does not rank foods or invent nutrient values.",
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
  ]);

  console.log(
    JSON.stringify(
      {
        status: failed.length === 0 ? "passed" : "failed",
        checked: results.length,
        passed: results.length - failed.length,
        failed: failed.length,
        report: reportPath,
      },
      null,
      2
    )
  );

  if (failed.length > 0) process.exitCode = 1;
}

void main();
