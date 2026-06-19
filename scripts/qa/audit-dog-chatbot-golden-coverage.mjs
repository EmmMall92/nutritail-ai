import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const liveCasesPath = "scripts/qa/run-dog-chatbot-live-cases.ts";
const edgeFixturePath = "data/evals/chatbot-dog-edge-cases-101-200.json";
const reportPath = "reports/dog_chatbot_golden_coverage_audit.md";

const damagedTextPattern =
  /(?:\?{3,}|Ξ|Ο[€‡ƒ„‰…]|Β®|�)/u;

function extractLiveCaseIds(source) {
  return [...source.matchAll(/\{\s*id:\s*(\d+),\s*message:\s*"([^"]*)"/gu)].map(
    (match) => ({
      id: Number(match[1]),
      prompt: match[2],
    })
  );
}

function extractLiveCaseCoverage(source) {
  const cases = [];
  const pattern = /\{\s*id:\s*(\d+),\s*message:\s*"([^"]*)",\s*goal:\s*"([^"]+)",\s*safety:\s*"([^"]+)"(.*)\},?\s*$/u;

  for (const line of source.split(/\r?\n/u)) {
    const match = line.match(pattern);
    if (!match) continue;

    const checksBlock = String(match[5] ?? "").match(/checks:\s*\{([^}]*)\}/u)?.[1] ?? "";
    const checks = [...checksBlock.matchAll(/(\w+):\s*(?:true|\[[^\]]+\])/gu)].map(
      (check) => check[1]
    );
    cases.push({
      id: Number(match[1]),
      prompt: match[2],
      goal: match[3],
      safety: match[4],
      checks,
    });
  }

  return cases;
}

function countBy(items, selector) {
  const counts = new Map();

  for (const item of items) {
    const key = selector(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function renderCounts(counts) {
  if (counts.length === 0) return "- none";
  return counts.map(([key, count]) => `- ${key}: ${count}`).join("\n");
}

function missingRequiredCoverage(coverageCases) {
  const goals = new Set(coverageCases.map((item) => item.goal));
  const checks = new Set(coverageCases.flatMap((item) => item.checks));
  const safeties = new Set(coverageCases.map((item) => item.safety));
  const requiredGoals = [
    "general",
    "value",
    "premium",
    "weight_control",
    "sensitive_digestion",
    "allergy",
    "urinary",
    "renal",
    "growth",
    "sterilised",
    "senior",
  ];
  const requiredChecks = [
    "allergyReject",
    "puppyGrowth",
    "largeBreedPuppy",
    "obesityLogic",
    "medicalNoTreatment",
    "foodV2Candidates",
  ];
  const requiredSafeties = ["normal", "vet_referral", "emergency"];

  return [
    ...requiredGoals
      .filter((goal) => !goals.has(goal))
      .map((goal) => `missing goal coverage: ${goal}`),
    ...requiredChecks
      .filter((check) => !checks.has(check))
      .map((check) => `missing check coverage: ${check}`),
    ...requiredSafeties
      .filter((safety) => !safeties.has(safety))
      .map((safety) => `missing safety coverage: ${safety}`),
  ];
}

function summarizeIds(cases, from, to) {
  const ids = cases.map((item) => item.id);
  const uniqueIds = new Set(ids);
  const missing = Array.from({ length: to - from + 1 }, (_, index) => index + from).filter(
    (id) => !uniqueIds.has(id)
  );
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

  return {
    count: cases.length,
    unique: uniqueIds.size,
    missing,
    duplicates: [...new Set(duplicates)],
  };
}

function damagedCases(cases) {
  return cases
    .filter((item) => damagedTextPattern.test(item.prompt ?? ""))
    .map((item) => item.id);
}

async function main() {
  const liveSource = await readFile(liveCasesPath, "utf8");
  const liveCases = extractLiveCaseIds(liveSource);
  const liveCoverageCases = extractLiveCaseCoverage(liveSource);
  const liveSummary = summarizeIds(liveCases, 1, 200);

  const edgeFixture = JSON.parse(await readFile(edgeFixturePath, "utf8"));
  const edgeCases = (edgeFixture.cases ?? []).map((item) => ({
    id: Number(String(item.id ?? "").match(/^dog-(\d+)/u)?.[1]),
    prompt: item.prompt,
  }));
  const edgeSummary = summarizeIds(edgeCases, 101, 200);

  const liveDamaged = damagedCases(liveCases);
  const edgeDamaged = damagedCases(edgeCases);
  const blockingProblems = [
    liveSummary.count !== 200
      ? `Live runner should contain 200 cases, found ${liveSummary.count}.`
      : null,
    liveSummary.missing.length > 0
      ? `Live runner missing ids: ${liveSummary.missing.join(", ")}.`
      : null,
    liveSummary.duplicates.length > 0
      ? `Live runner duplicate ids: ${liveSummary.duplicates.join(", ")}.`
      : null,
    edgeSummary.count !== 100
      ? `Edge fixture should contain 100 cases, found ${edgeSummary.count}.`
      : null,
    edgeSummary.missing.length > 0
      ? `Edge fixture missing ids: ${edgeSummary.missing.join(", ")}.`
      : null,
    edgeSummary.duplicates.length > 0
      ? `Edge fixture duplicate ids: ${edgeSummary.duplicates.join(", ")}.`
      : null,
    liveDamaged.length > 0
      ? `Live runner has damaged prompt ids: ${liveDamaged.join(", ")}.`
      : null,
    edgeDamaged.length > 0
      ? `Edge fixture has damaged prompt ids: ${edgeDamaged.join(", ")}.`
      : null,
    liveCoverageCases.length !== 200
      ? `Live coverage parser should find 200 cases, found ${liveCoverageCases.length}.`
      : null,
    ...missingRequiredCoverage(liveCoverageCases),
  ].filter(Boolean);

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    [
      "# Dog Chatbot Golden Coverage Audit",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `- Live runner cases: ${liveSummary.count}`,
      `- Live runner unique ids: ${liveSummary.unique}`,
      `- External 101-200 fixture cases: ${edgeSummary.count}`,
      `- External 101-200 fixture unique ids: ${edgeSummary.unique}`,
      `- Live runner damaged prompts: ${liveDamaged.length}`,
      `- External fixture damaged prompts: ${edgeDamaged.length}`,
      `- Coverage parser cases: ${liveCoverageCases.length}`,
      `- Blocking structural problems: ${blockingProblems.length}`,
      "",
      "## Goal Coverage",
      "",
      renderCounts(countBy(liveCoverageCases, (item) => item.goal)),
      "",
      "## Safety Coverage",
      "",
      renderCounts(countBy(liveCoverageCases, (item) => item.safety)),
      "",
      "## Check Coverage",
      "",
      renderCounts(
        countBy(
          liveCoverageCases.flatMap((item) => item.checks.map((check) => ({ check }))),
          (item) => item.check
        )
      ),
      "",
      "## Damaged Prompt Cleanup",
      "",
      liveDamaged.length > 0
        ? `- Live runner ids needing prompt cleanup: ${liveDamaged.join(", ")}`
        : "- Live runner prompts look clean.",
      edgeDamaged.length > 0
        ? `- External fixture ids needing prompt cleanup: ${edgeDamaged.join(", ")}`
        : "- External fixture prompts look clean.",
      "",
      "## Blocking Problems",
      "",
      blockingProblems.length > 0
        ? blockingProblems.map((item) => `- ${item}`).join("\n")
        : "- none",
      "",
      "## Next Step",
      "",
      liveDamaged.length > 0 || edgeDamaged.length > 0
        ? "Replace damaged prompts with clean Greek source text before relying on the dog chatbot golden suite."
        : "The 200-case golden suite coverage is structurally clean. Continue tracking recommendation regressions by scenario.",
      "",
    ].join("\n"),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        liveCases: liveSummary.count,
        edgeCases: edgeSummary.count,
        coverageCases: liveCoverageCases.length,
        liveDamagedPrompts: liveDamaged.length,
        edgeDamagedPrompts: edgeDamaged.length,
        blockingProblems: blockingProblems.length,
        report: reportPath,
      },
      null,
      2
    )
  );

  if (blockingProblems.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
