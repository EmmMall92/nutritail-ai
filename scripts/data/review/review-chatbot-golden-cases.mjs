import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  fixtures: "data/evals/chatbot-golden-cases.json",
  report: "reports/chatbot_golden_eval_summary.md",
};

const requiredSafetyLevels = new Set(["normal", "caution", "urgent"]);
const requiredSignals = [
  "allergy",
  "compare",
  "digestive",
  "ingredient_myth",
  "kidney",
  "low_confidence_match",
  "needs_context",
  "product_lookup",
  "urinary",
  "weight",
];

function normalizeList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item ?? "").trim()).filter(Boolean)
    : [];
}

function normalizePrompt(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(normalizePrompt(term)));
}

function inferSignals(prompt) {
  const text = normalizePrompt(prompt);
  const signals = new Set();

  if (includesAny(text, ["compare", " vs ", "versus", "συγκριν"])) {
    signals.add("compare");
    signals.add("product_lookup");
  }

  if (includesAny(text, ["royal", "farmina", "canin", "n&d", "mini"])) {
    signals.add("product_lookup");
  }

  if (includesAny(text, ["something", "not sure", "δεν ξερω"])) {
    signals.add("low_confidence_match");
  }

  if (includesAny(text, ["obese", "overweight", "weight", "pax", "παχ"])) {
    signals.add("weight");
  }

  if (includesAny(text, ["neutered", "steril", "steirom"])) {
    signals.add("neutered");
  }

  if (includesAny(text, ["pee", "urinary", "urine", "κατουρ", "ουρο"])) {
    signals.add("urinary");
  }

  if (includesAny(text, ["nothing comes out", "blocked", "straining"])) {
    signals.add("urgent");
  }

  if (includesAny(text, ["diarrhea", "diarrhoea", "διαρ", "gas", "αερ"])) {
    signals.add("digestive");
  }

  if (includesAny(text, ["allergy", "allergic", "itch", "scratch", "αλλεργ"])) {
    signals.add("allergy");
  }

  if (includesAny(text, ["chicken", "κοτοπου", "kotopoulo"])) {
    signals.add("chicken");
  }

  if (includesAny(text, ["kidney", "renal", "ckd", "νεφρ"])) {
    signals.add("kidney");
  }

  if (includesAny(text, ["puppy", "5 months", "growth"])) {
    signals.add("growth");
  }

  if (includesAny(text, ["large breed", "giant"])) {
    signals.add("large_breed");
  }

  if (includesAny(text, ["grain free", "grain-free", "by-products"])) {
    signals.add("ingredient_myth");
  }

  if (includesAny(text, ["best food"]) && !signals.has("compare")) {
    signals.add("needs_context");
  }

  return [...signals].sort();
}

function inferSafetyLevel(signals) {
  if (signals.includes("urgent")) return "urgent";
  if (
    signals.some((signal) =>
      ["allergy", "digestive", "kidney", "urinary"].includes(signal)
    )
  ) {
    return "caution";
  }

  return "normal";
}

function validateCase(testCase) {
  const issues = [];
  const id = String(testCase.id ?? "").trim();
  const prompt = String(testCase.prompt ?? "").trim();
  const expectedSignals = normalizeList(testCase.expectedSignals);
  const expectedMentions = normalizeList(testCase.expectedResponseMustMention);
  const expectedSafetyLevel = String(testCase.expectedSafetyLevel ?? "").trim();
  const inferredSignals = inferSignals(prompt);
  const inferredSafetyLevel = inferSafetyLevel(inferredSignals);

  if (!id) issues.push("Missing id");
  if (!prompt || prompt.length < 8) issues.push("Prompt is missing or too short");
  if (expectedSignals.length === 0) issues.push("Missing expectedSignals");
  if (expectedMentions.length === 0) {
    issues.push("Missing expectedResponseMustMention");
  }
  if (!requiredSafetyLevels.has(expectedSafetyLevel)) {
    issues.push(`Invalid safety level: ${expectedSafetyLevel || "empty"}`);
  }
  for (const signal of expectedSignals) {
    if (!inferredSignals.includes(signal)) {
      issues.push(`Expected signal not inferred from prompt: ${signal}`);
    }
  }
  if (
    requiredSafetyLevels.has(expectedSafetyLevel) &&
    inferredSafetyLevel !== expectedSafetyLevel
  ) {
    issues.push(
      `Expected safety ${expectedSafetyLevel}, inferred ${inferredSafetyLevel}`
    );
  }

  return {
    id,
    prompt,
    expectedSignals,
    inferredSignals,
    expectedSafetyLevel,
    inferredSafetyLevel,
    expectedMentions,
    issues,
    passed: issues.length === 0,
  };
}

function renderReport(results) {
  const now = new Date().toISOString();
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;
  const coveredSignals = new Set(
    results.flatMap((result) => result.expectedSignals)
  );
  const missingSignals = requiredSignals.filter(
    (signal) => !coveredSignals.has(signal)
  );
  const safetyLevels = new Set(
    results.map((result) => result.expectedSafetyLevel).filter(Boolean)
  );
  const missingSafetyLevels = [...requiredSafetyLevels].filter(
    (level) => !safetyLevels.has(level)
  );
  const coveragePassed =
    missingSignals.length === 0 && missingSafetyLevels.length === 0;
  const status = failed === 0 && coveragePassed ? "PASS" : "FAIL";

  return `# Chatbot Golden Eval Summary

Generated: ${now}

## Result

${status}

Cases: ${results.length}
Passed: ${passed}
Failed: ${failed}

## Coverage

Signals covered: ${[...coveredSignals].sort().join(", ")}
Missing signals: ${missingSignals.length > 0 ? missingSignals.join(", ") : "none"}

Safety levels covered: ${[...safetyLevels].sort().join(", ")}
Missing safety levels: ${
    missingSafetyLevels.length > 0 ? missingSafetyLevels.join(", ") : "none"
  }

## Cases

${results
  .map((result) => {
    const issueText =
      result.issues.length > 0
        ? `\n  Issues: ${result.issues.join("; ")}`
        : "";

    return `- ${result.passed ? "PASS" : "FAIL"} ${result.id}: ${
      result.expectedSafetyLevel
    } / ${result.expectedSignals.join(", ")}; inferred=${
      result.inferredSafetyLevel
    } / ${result.inferredSignals.join(", ")}${issueText}`;
  })
  .join("\n")}
`;
}

async function main() {
  const raw = await readFile(paths.fixtures, "utf8");
  const data = JSON.parse(raw);

  if (!Array.isArray(data.cases)) {
    throw new Error("Chatbot golden eval file must include a cases array.");
  }

  const results = data.cases.map(validateCase);
  const report = renderReport(results);

  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.report, report);

  console.log(`Reviewed ${results.length} chatbot golden cases.`);
  console.log(`Report written to ${paths.report}`);

  if (report.includes("\nFAIL\n")) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
