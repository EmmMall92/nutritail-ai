import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const liveCasesPath = "scripts/qa/run-dog-chatbot-live-cases.ts";
const edgeFixturePath = "data/evals/chatbot-dog-edge-cases-101-200.json";
const reportPath = "reports/dog_chatbot_golden_coverage_audit.md";

const damagedTextPattern = /(?:\?{3,}|\u039e|\u0392\u00ae|\ufffd|\u039f[\u0080-\u00ff])/u;
const isoGreekDecoder = new TextDecoder("iso-8859-7");
const isoGreekReverseMap = new Map();

for (let byte = 0; byte <= 255; byte += 1) {
  isoGreekReverseMap.set(isoGreekDecoder.decode(Uint8Array.of(byte)), byte);
}

function repairLegacyGreekMojibake(value) {
  const text = String(value ?? "");
  if (!damagedTextPattern.test(text)) return text;

  const bytes = [];
  for (const char of text) {
    const byte = isoGreekReverseMap.get(char);
    if (byte !== undefined) {
      bytes.push(byte);
    } else if (char.charCodeAt(0) <= 255) {
      bytes.push(char.charCodeAt(0));
    } else {
      return text;
    }
  }

  return new TextDecoder("utf-8").decode(Uint8Array.from(bytes));
}

function extractLiveCaseIds(source) {
  return [...source.matchAll(/\{\s*id:\s*(\d+),\s*message:\s*"([^"]*)"/gu)].map(
    (match) => ({
      id: Number(match[1]),
      prompt: repairLegacyGreekMojibake(match[2]),
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
      prompt: repairLegacyGreekMojibake(match[2]),
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

function mapCounts(items, selector) {
  return new Map(countBy(items, selector));
}

function minimumCoverageProblems(coverageCases) {
  const goalCounts = mapCounts(coverageCases, (item) => item.goal);
  const safetyCounts = mapCounts(coverageCases, (item) => item.safety);
  const checkCounts = mapCounts(
    coverageCases.flatMap((item) => item.checks.map((check) => ({ check }))),
    (item) => item.check
  );
  const minimumGoals = {
    allergy: 20,
    growth: 20,
    senior: 20,
    sensitive_digestion: 15,
    weight_control: 10,
    renal: 5,
    urinary: 5,
    sterilised: 3,
    value: 2,
    premium: 5,
  };
  const minimumChecks = {
    allergyReject: 10,
    puppyGrowth: 20,
    largeBreedPuppy: 8,
    obesityLogic: 15,
    activeFit: 10,
    medicalNoTreatment: 90,
    foodV2Candidates: 150,
  };
  const minimumSafeties = {
    normal: 80,
    vet_referral: 80,
    emergency: 5,
  };

  return [
    ...Object.entries(minimumGoals)
      .filter(([goal, minimum]) => (goalCounts.get(goal) ?? 0) < minimum)
      .map(
        ([goal, minimum]) =>
          `goal coverage too low for ${goal}: ${goalCounts.get(goal) ?? 0}/${minimum}`
      ),
    ...Object.entries(minimumChecks)
      .filter(([check, minimum]) => (checkCounts.get(check) ?? 0) < minimum)
      .map(
        ([check, minimum]) =>
          `check coverage too low for ${check}: ${checkCounts.get(check) ?? 0}/${minimum}`
      ),
    ...Object.entries(minimumSafeties)
      .filter(([safety, minimum]) => (safetyCounts.get(safety) ?? 0) < minimum)
      .map(
        ([safety, minimum]) =>
          `safety coverage too low for ${safety}: ${safetyCounts.get(safety) ?? 0}/${minimum}`
      ),
  ];
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
    "activeFit",
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

function topicCoverageProblems(coverageCases) {
  const ids = new Set(coverageCases.map((item) => item.id));
  const topics = [
    { label: "breed_activity_101_115", from: 101, to: 115, minimum: 15 },
    { label: "sterilised_weight_behaviour_116_120", from: 116, to: 120, minimum: 5 },
    { label: "gi_skin_allergy_121_150", from: 121, to: 150, minimum: 30 },
    { label: "medical_conditions_151_170", from: 151, to: 170, minimum: 20 },
    { label: "reproduction_growth_171_180", from: 171, to: 180, minimum: 10 },
    { label: "senior_accessibility_181_190", from: 181, to: 190, minimum: 10 },
    { label: "environment_rescue_191_200", from: 191, to: 200, minimum: 10 },
  ];

  return topics
    .map((topic) => {
      const count = Array.from(
        { length: topic.to - topic.from + 1 },
        (_, index) => topic.from + index
      ).filter((id) => ids.has(id)).length;

      return { ...topic, count };
    })
    .filter((topic) => topic.count < topic.minimum)
    .map(
      (topic) =>
        `topic coverage too low for ${topic.label}: ${topic.count}/${topic.minimum}`
    );
}

function topicCoverageCounts(coverageCases) {
  const ids = new Set(coverageCases.map((item) => item.id));
  return [
    ["breed_activity_101_115", 101, 115],
    ["sterilised_weight_behaviour_116_120", 116, 120],
    ["gi_skin_allergy_121_150", 121, 150],
    ["medical_conditions_151_170", 151, 170],
    ["reproduction_growth_171_180", 171, 180],
    ["senior_accessibility_181_190", 181, 190],
    ["environment_rescue_191_200", 191, 200],
  ].map(([label, from, to]) => [
    label,
    Array.from({ length: Number(to) - Number(from) + 1 }, (_, index) => Number(from) + index)
      .filter((id) => ids.has(id)).length,
  ]);
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
    prompt: repairLegacyGreekMojibake(item.prompt),
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
    ...minimumCoverageProblems(liveCoverageCases),
    ...topicCoverageProblems(liveCoverageCases),
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
      "## Topic Coverage For User Cases 101-200",
      "",
      renderCounts(topicCoverageCounts(liveCoverageCases)),
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
