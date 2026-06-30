import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import {
  buildIntakeExtractionSystemPrompt,
  buildIntakeExtractionUserPrompt,
  extractJsonObjectFromOpenAiText,
} from "@/lib/ai/intakePromptContract";
import { validateAiIntakeExtraction } from "@/lib/ai/intakeValidation";
import type { AiIntakeExtraction } from "@/lib/ai/intakeTypes";

type ExpectedValue = string | number | boolean | null | string[];

type SmokeCase = {
  id: string;
  message: string;
  expect: Record<string, ExpectedValue>;
};

const envPath = process.env.NUTRITAIL_QA_ENV_PATH || ".env.local";
const openAiKeyFile = process.env.NUTRITAIL_QA_OPENAI_API_KEY_FILE?.trim() || "";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH || "reports/openai_intake_smoke_qa.md";

const cases: SmokeCase[] = [
  {
    id: "greek_full_pet_profile",
    message:
      "\u0388\u03c7\u03c9 \u03c3\u03ba\u03cd\u03bb\u03bf, \u03c4\u03b7\u03bd \u03bb\u03ad\u03bd\u03b5 \u039a\u03cd\u03c1\u03ba\u03b7, \u03b5\u03af\u03bd\u03b1\u03b9 6 \u03ba\u03b9\u03bb\u03ac, 6 \u03b5\u03c4\u03ce\u03bd, \u03c7\u03b1\u03bc\u03b7\u03bb\u03ae \u03b4\u03c1\u03b1\u03c3\u03c4\u03b7\u03c1\u03b9\u03cc\u03c4\u03b7\u03c4\u03b1, \u03c3\u03c4\u03b5\u03b9\u03c1\u03c9\u03bc\u03ad\u03bd\u03b7. \u03a4\u03b7\u03c2 \u03b1\u03c1\u03ad\u03c3\u03b5\u03b9 \u03ba\u03bf\u03c4\u03cc\u03c0\u03bf\u03c5\u03bb\u03bf \u03ba\u03b1\u03b9 \u03b4\u03b5\u03bd \u03c4\u03b7\u03c2 \u03b1\u03c1\u03ad\u03c3\u03b5\u03b9 \u03c3\u03bf\u03bb\u03bf\u03bc\u03cc\u03c2.",
    expect: {
      species: "dog",
      petName: "\u039a\u03cd\u03c1\u03ba\u03b7",
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
    message:
      "\u039f \u03c3\u03ba\u03cd\u03bb\u03bf\u03c2 \u03bc\u03bf\u03c5 \u03ad\u03c7\u03b5\u03b9 \u03b1\u03bb\u03bb\u03b5\u03c1\u03b3\u03af\u03b1 \u03c3\u03c4\u03bf \u03ba\u03bf\u03c4\u03cc\u03c0\u03bf\u03c5\u03bb\u03bf \u03ba\u03b1\u03b9 \u03c3\u03c4\u03b7 \u03b3\u03b1\u03bb\u03bf\u03c0\u03bf\u03cd\u03bb\u03b1.",
    expect: {
      species: "dog",
      allergies: ["chicken", "turkey"],
      excludedIngredients: ["chicken", "turkey"],
    },
  },
  {
    id: "greek_urinary_red_flag",
    message:
      "\u039f \u03b3\u03ac\u03c4\u03bf\u03c2 \u03bc\u03bf\u03c5 \u03c0\u03c1\u03bf\u03c3\u03c0\u03b1\u03b8\u03b5\u03af \u03bd\u03b1 \u03ba\u03b1\u03c4\u03bf\u03c5\u03c1\u03ae\u03c3\u03b5\u03b9 \u03ba\u03b1\u03b9 \u03b4\u03b5\u03bd \u03bc\u03c0\u03bf\u03c1\u03b5\u03af.",
    expect: {
      species: "cat",
      redFlags: ["urinary_blockage"],
    },
  },
  {
    id: "implausible_weight_rejected",
    message: "\u0388\u03c7\u03c9 \u03c3\u03ba\u03cd\u03bb\u03bf 115 \u03ba\u03b9\u03bb\u03ac.",
    expect: {
      species: "dog",
      weightKg: null,
    },
  },
];

function assertSmokeCaseEncoding() {
  const mojibakePattern = new RegExp(
    "(?:[?]{3,}|\\uFFFD|\\u00C2|\\u00CE|\\u00CF|[\\u0080-\\u009f])",
    "u"
  );
  const damaged = cases.filter((item) => mojibakePattern.test(item.message));
  if (damaged.length > 0) {
    throw new Error(
      `OpenAI intake smoke cases contain damaged Greek text: ${damaged
        .map((item) => item.id)
        .join(", ")}`
    );
  }
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

async function loadOpenAiApiKey() {
  const fromEnv = process.env.OPENAI_API_KEY?.trim() || "";
  if (fromEnv) {
    return {
      value: fromEnv,
      source: "OPENAI_API_KEY",
      warning: "",
    };
  }

  if (!openAiKeyFile) {
    return {
      value: "",
      source: "missing",
      warning: "",
    };
  }

  try {
    const fromFile = (await readFile(openAiKeyFile, "utf8")).trim();

    return {
      value: fromFile,
      source: fromFile
        ? "NUTRITAIL_QA_OPENAI_API_KEY_FILE"
        : "empty NUTRITAIL_QA_OPENAI_API_KEY_FILE",
      warning: fromFile ? "" : "The configured OpenAI key file was readable but empty.",
    };
  } catch (error) {
    return {
      value: "",
      source: "unreadable NUTRITAIL_QA_OPENAI_API_KEY_FILE",
      warning: error instanceof Error ? error.message : "Unknown OpenAI key file read error",
    };
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

async function extractWithOpenAi(client: OpenAI, message: string) {
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: buildIntakeExtractionSystemPrompt(),
      },
      {
        role: "user",
        content: buildIntakeExtractionUserPrompt(message),
      },
    ],
    temperature: 0,
    max_output_tokens: 700,
  });

  const parsed = extractJsonObjectFromOpenAiText(
    response.output_text ?? ""
  ) as AiIntakeExtraction | null;
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

async function writeReport(lines: string[]) {
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  assertSmokeCaseEncoding();
  await loadEnvFile();

  const openAiKey = await loadOpenAiApiKey();
  const hasOpenAiKey = Boolean(openAiKey.value);

  if (!hasOpenAiKey) {
    await writeReport([
      "# OpenAI Intake Smoke QA",
      "",
      `Generated: ${new Date().toISOString()}`,
      "Status: skipped",
      "",
      "No usable `OPENAI_API_KEY` was available in the QA environment.",
      "This is expected in CI unless the secret is intentionally enabled there.",
      "You can also set `NUTRITAIL_QA_OPENAI_API_KEY_FILE` to a local ignored file containing the key. The key value is never written to this report.",
      "",
      "## Summary",
      "",
      `- Cases checked: ${cases.length}`,
      "- Passed: 0",
      "- Failed: 0",
      `- Skipped: ${cases.length}`,
      `- OpenAI key source: ${openAiKey.source}`,
      ...(openAiKey.warning ? [`- Key warning: ${openAiKey.warning}`] : []),
      "",
      "The smoke fixture validates clean Greek prompts, the same NutriTail fact-extraction prompt contract, and the same intake validation layer used by the app.",
      "The deterministic fallback intake QA still runs separately through `npm.cmd run qa:ai-intake`.",
    ]);

    console.log(
      JSON.stringify(
        {
          status: "skipped",
          reason: "OPENAI_API_KEY is not configured",
          openai_key_source: openAiKey.source,
          clean_fixture_cases: cases.length,
          report: reportPath,
        },
        null,
        2
      )
    );
    return;
  }

  const results = [];
  const client = new OpenAI({ apiKey: openAiKey.value });

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
    "It uses the same NutriTail fact-extraction prompt contract and intake validation layer as the chatbot.",
    "It does not rank foods or invent nutrient values.",
    "",
    "## Summary",
    "",
    `- Cases checked: ${results.length}`,
    `- Passed: ${results.length - failed.length}`,
    `- Failed: ${failed.length}`,
    "- Skipped: 0",
    `- OpenAI key source: ${openAiKey.source}`,
    "",
    "The key value was not written to this report.",
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
