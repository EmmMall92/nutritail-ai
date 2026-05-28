import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  fixtures: "data/evals/chatbot-golden-cases.json",
  report: "reports/chatbot_response_contract_summary.md",
};

const requiredContractTypes = [
  "context_question",
  "compare",
  "nutrition_reasoning",
  "safety_escalation",
  "transition_guidance",
];

function normalizeList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item ?? "").trim()).filter(Boolean)
    : [];
}

function inferContractTypes(testCase) {
  const signals = normalizeList(testCase.expectedSignals);
  const safetyLevel = String(testCase.expectedSafetyLevel ?? "");
  const contracts = new Set(["nutrition_reasoning"]);

  if (signals.includes("compare")) contracts.add("compare");
  if (signals.includes("needs_context") || signals.includes("low_confidence_match")) {
    contracts.add("context_question");
  }
  if (signals.includes("digestive") || signals.includes("weight")) {
    contracts.add("transition_guidance");
  }
  if (safetyLevel === "urgent" || safetyLevel === "caution") {
    contracts.add("safety_escalation");
  }

  return [...contracts].sort();
}

function requiredMentionsFor(testCase, contracts) {
  const signals = normalizeList(testCase.expectedSignals);
  const mentions = new Set(normalizeList(testCase.expectedResponseMustMention));

  if (contracts.includes("safety_escalation")) {
    mentions.add("veterinarian");
  }
  if (signals.includes("kidney")) {
    mentions.add("phosphorus");
  }
  if (signals.includes("growth") || signals.includes("large_breed")) {
    mentions.add("calcium");
    mentions.add("phosphorus");
  }
  if (signals.includes("compare")) {
    mentions.add("compare");
  }
  if (signals.includes("low_confidence_match")) {
    mentions.add("exact brand");
  }
  if (signals.includes("weight") || signals.includes("neutered")) {
    mentions.add("calorie");
  }

  return [...mentions].sort();
}

function forbiddenClaimsFor(testCase) {
  const signals = normalizeList(testCase.expectedSignals);
  const forbidden = new Set([
    "guaranteed cure",
    "diagnose",
    "always best",
  ]);

  if (signals.includes("ingredient_myth")) {
    forbidden.add("grain-free is always better");
  }
  if (signals.includes("kidney")) {
    forbidden.add("highest protein is best");
  }
  if (signals.includes("allergy")) {
    forbidden.add("allergy is confirmed");
  }

  return [...forbidden].sort();
}

function validateCase(testCase) {
  const id = String(testCase.id ?? "").trim();
  const prompt = String(testCase.prompt ?? "").trim();
  const safetyLevel = String(testCase.expectedSafetyLevel ?? "");
  const contracts = inferContractTypes(testCase);
  const requiredMentions = requiredMentionsFor(testCase, contracts);
  const forbiddenClaims = forbiddenClaimsFor(testCase);
  const issues = [];

  if (!id) issues.push("Missing id");
  if (!prompt) issues.push("Missing prompt");
  if (requiredMentions.length < 2) {
    issues.push("Response contract needs at least two required mentions");
  }
  if (forbiddenClaims.length < 3) {
    issues.push("Response contract needs baseline forbidden claims");
  }
  if (safetyLevel === "urgent" && !contracts.includes("safety_escalation")) {
    issues.push("Urgent case must require safety escalation");
  }
  if (
    contracts.includes("context_question") &&
    !requiredMentions.some((mention) =>
      ["age", "weight", "goal", "exact brand", "candidates"].includes(mention)
    )
  ) {
    issues.push("Context-question case must require a clarifying detail");
  }

  return {
    id,
    safetyLevel,
    contracts,
    requiredMentions,
    forbiddenClaims,
    issues,
    passed: issues.length === 0,
  };
}

function renderReport(results) {
  const now = new Date().toISOString();
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;
  const coveredContracts = new Set(
    results.flatMap((result) => result.contracts)
  );
  const missingContracts = requiredContractTypes.filter(
    (contract) => !coveredContracts.has(contract)
  );
  const status = failed === 0 && missingContracts.length === 0 ? "PASS" : "FAIL";

  return `# Chatbot Response Contract Summary

Generated: ${now}

## Result

${status}

Cases: ${results.length}
Passed: ${passed}
Failed: ${failed}

## Coverage

Contracts covered: ${[...coveredContracts].sort().join(", ")}
Missing contracts: ${
    missingContracts.length > 0 ? missingContracts.join(", ") : "none"
  }

## Cases

${results
  .map((result) => {
    const issueText =
      result.issues.length > 0
        ? `\n  Issues: ${result.issues.join("; ")}`
        : "";

    return `- ${result.passed ? "PASS" : "FAIL"} ${result.id}: ${
      result.contracts.join(", ")
    }; mentions=${result.requiredMentions.join(", ")}; forbidden=${
      result.forbiddenClaims.join(", ")
    }${issueText}`;
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

  console.log(`Reviewed ${results.length} chatbot response contracts.`);
  console.log(`Report written to ${paths.report}`);

  if (report.includes("\nFAIL\n")) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
