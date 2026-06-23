import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const fixturePath =
  process.env.NUTRITAIL_QA_CAT_FIXTURE_PATH ??
  "data/evals/chatbot-extra-cases-cat-001-500.json";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ?? "reports/cat_chatbot_coverage_audit.md";

const expectedCaseCount = 500;
const damagedTextPattern = /(?:\?{3,}|\u039e|\u0392\u00ae|\ufffd|\u039f[\u0080-\u00ff])/u;
const isoGreekDecoder = new TextDecoder("iso-8859-7");
const isoGreekReverseMap = new Map();

for (let byte = 0; byte <= 255; byte += 1) {
  isoGreekReverseMap.set(isoGreekDecoder.decode(Uint8Array.of(byte)), byte);
}

function repairLegacyGreekMojibake(value) {
  const text = String(value ?? "");
  if (!damagedTextPattern.test(text)) return { text, repaired: false };

  const bytes = [];
  for (const char of text) {
    const byte = isoGreekReverseMap.get(char);
    if (byte !== undefined) {
      bytes.push(byte);
    } else if (char.charCodeAt(0) <= 255) {
      bytes.push(char.charCodeAt(0));
    } else {
      return { text, repaired: false };
    }
  }

  const repairedText = new TextDecoder("utf-8").decode(Uint8Array.from(bytes));
  return repairedText.includes("\ufffd")
    ? { text, repaired: false }
    : { text: repairedText, repaired: repairedText !== text };
}

function normalizeCase(rawCase, index) {
  const repairedPrompt = repairLegacyGreekMojibake(rawCase.prompt);
  return {
    id: rawCase.id,
    expectedId: `cat-${String(index + 1).padStart(3, "0")}`,
    species: rawCase.species,
    prompt: repairedPrompt.text,
    promptWasRepaired: repairedPrompt.repaired,
    expectedSignals: Array.isArray(rawCase.expectedSignals) ? rawCase.expectedSignals : [],
    expectedSafetyLevel: rawCase.expectedSafetyLevel,
  };
}

function inferGoal(testCase) {
  const signals = new Set(testCase.expectedSignals);

  if (signals.has("renal")) return "renal";
  if (signals.has("urinary")) return "urinary";
  if (signals.has("kitten_growth")) return "growth";
  if (signals.has("allergy")) return "allergy";
  if (signals.has("weight_control")) return "weight_control";
  if (signals.has("sterilised")) return "sterilised";
  if (signals.has("senior")) return "senior";
  if (signals.has("premium")) return "premium";
  if (signals.has("budget")) return "value";

  return "general";
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

function countMap(items, selector) {
  return new Map(countBy(items, selector));
}

function renderCounts(counts) {
  if (counts.length === 0) return "- none";
  return counts.map(([key, count]) => `- ${key}: ${count}`).join("\n");
}

function summarizeIds(cases) {
  const ids = cases.map((item) => item.id);
  const uniqueIds = new Set(ids);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  const missing = Array.from({ length: expectedCaseCount }, (_, index) => {
    return `cat-${String(index + 1).padStart(3, "0")}`;
  }).filter((id) => !uniqueIds.has(id));

  return {
    count: cases.length,
    unique: uniqueIds.size,
    duplicates: [...new Set(duplicates)],
    missing,
  };
}

function topicCoverageCounts(cases) {
  const ids = new Set(cases.map((item) => Number(String(item.id ?? "").replace(/\D/gu, ""))));
  return [
    ["sterilised_indoor_preference_001_010", 1, 10],
    ["kitten_growth_011_020", 11, 20],
    ["active_unsterilised_021_030", 21, 30],
    ["urinary_hydration_031_040", 31, 40],
    ["renal_041_050", 41, 50],
    ["weight_control_051_060", 51, 60],
    ["allergy_061_070", 61, 70],
    ["hairball_skin_071_080", 71, 80],
    ["sensitive_digestion_081_090", 81, 90],
    ["senior_091_100", 91, 100],
    ["expanded_customer_cases_101_500", 101, 500],
  ].map(([label, from, to]) => [
    label,
    Array.from({ length: Number(to) - Number(from) + 1 }, (_, index) => Number(from) + index)
      .filter((id) => ids.has(id)).length,
  ]);
}

function coverageProblems(cases) {
  const goalCounts = countMap(cases, inferGoal);
  const signalCounts = countMap(
    cases.flatMap((item) => item.expectedSignals.map((signal) => ({ signal }))),
    (item) => item.signal,
  );
  const safetyCounts = countMap(cases, (item) => item.expectedSafetyLevel);
  const topics = new Map(topicCoverageCounts(cases));

  const minimumGoals = {
    general: 80,
    sterilised: 15,
    growth: 30,
    urinary: 30,
    renal: 30,
    weight_control: 30,
    allergy: 25,
    senior: 25,
  };
  const minimumSignals = {
    cat: 500,
    sterilised: 20,
    urinary: 30,
    renal: 30,
    kitten_growth: 30,
    weight_control: 30,
    allergy: 30,
    senior: 25,
    sensitive_digestion: 15,
    skin_hairball: 15,
    hydration: 15,
    preference: 50,
  };
  const minimumSafeties = {
    normal: 250,
    caution: 100,
    urgent: 8,
  };
  const minimumTopics = {
    sterilised_indoor_preference_001_010: 10,
    kitten_growth_011_020: 10,
    active_unsterilised_021_030: 10,
    urinary_hydration_031_040: 10,
    renal_041_050: 10,
    weight_control_051_060: 10,
    allergy_061_070: 10,
    hairball_skin_071_080: 10,
    sensitive_digestion_081_090: 10,
    senior_091_100: 10,
    expanded_customer_cases_101_500: 400,
  };

  return [
    ...Object.entries(minimumGoals)
      .filter(([goal, minimum]) => (goalCounts.get(goal) ?? 0) < minimum)
      .map(([goal, minimum]) => `goal coverage too low for ${goal}: ${goalCounts.get(goal) ?? 0}/${minimum}`),
    ...Object.entries(minimumSignals)
      .filter(([signal, minimum]) => (signalCounts.get(signal) ?? 0) < minimum)
      .map(
        ([signal, minimum]) =>
          `signal coverage too low for ${signal}: ${signalCounts.get(signal) ?? 0}/${minimum}`,
      ),
    ...Object.entries(minimumSafeties)
      .filter(([safety, minimum]) => (safetyCounts.get(safety) ?? 0) < minimum)
      .map(
        ([safety, minimum]) =>
          `safety coverage too low for ${safety}: ${safetyCounts.get(safety) ?? 0}/${minimum}`,
      ),
    ...Object.entries(minimumTopics)
      .filter(([topic, minimum]) => (topics.get(topic) ?? 0) < minimum)
      .map(([topic, minimum]) => `topic coverage too low for ${topic}: ${topics.get(topic) ?? 0}/${minimum}`),
  ];
}

async function main() {
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
  const cases = (Array.isArray(fixture.cases) ? fixture.cases : []).map(normalizeCase);
  const idSummary = summarizeIds(cases);
  const repairedPrompts = cases.filter((item) => item.promptWasRepaired).length;
  const damagedAfterRepair = cases.filter((item) => damagedTextPattern.test(item.prompt)).map((item) => item.id);
  const structuralProblems = [
    idSummary.count !== expectedCaseCount
      ? `Expected ${expectedCaseCount} cat cases, found ${idSummary.count}.`
      : null,
    idSummary.unique !== expectedCaseCount
      ? `Expected ${expectedCaseCount} unique cat ids, found ${idSummary.unique}.`
      : null,
    idSummary.missing.length > 0 ? `Missing ids: ${idSummary.missing.join(", ")}.` : null,
    idSummary.duplicates.length > 0 ? `Duplicate ids: ${idSummary.duplicates.join(", ")}.` : null,
    ...cases
      .filter((item) => item.id !== item.expectedId)
      .map((item) => `Expected ${item.expectedId}, found ${item.id ?? "missing id"}.`),
    ...cases
      .filter((item) => item.species !== "cat")
      .map((item) => `${item.id ?? "unknown"} species must be cat.`),
    ...cases
      .filter((item) => item.prompt.trim().length < 8)
      .map((item) => `${item.id ?? "unknown"} prompt is missing or too short.`),
    ...cases
      .filter((item) => item.expectedSignals.length === 0)
      .map((item) => `${item.id ?? "unknown"} expectedSignals must not be empty.`),
    ...cases
      .filter((item) => !["normal", "caution", "urgent"].includes(item.expectedSafetyLevel))
      .map((item) => `${item.id ?? "unknown"} expectedSafetyLevel is invalid.`),
    ...damagedAfterRepair.map((id) => `${id} still has damaged Greek prompt text after repair.`),
  ].filter(Boolean);
  const coverageWarnings = coverageProblems(cases);
  const allProblems = [...structuralProblems, ...coverageWarnings];
  const result = allProblems.length === 0 ? "PASS" : "REVIEW";

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    [
      "# Cat Chatbot Coverage Audit",
      "",
      `Generated: ${new Date().toISOString()}`,
      `Fixture: \`${fixturePath}\``,
      `Result: ${result}`,
      "",
      "## Summary",
      "",
      `- Cases checked: ${cases.length}`,
      `- Expected cases: ${expectedCaseCount}`,
      `- Unique ids: ${idSummary.unique}`,
      `- Prompt encoding repairs applied: ${repairedPrompts}`,
      `- Prompt encoding issues after repair: ${damagedAfterRepair.length}`,
      `- Structural issues: ${structuralProblems.length}`,
      `- Coverage issues: ${coverageWarnings.length}`,
      `- Issues: ${allProblems.length}`,
      "",
      "## Goal Coverage",
      "",
      renderCounts(countBy(cases, inferGoal)),
      "",
      "## Signal Coverage",
      "",
      renderCounts(
        countBy(
          cases.flatMap((item) => item.expectedSignals.map((signal) => ({ signal }))),
          (item) => item.signal,
        ),
      ),
      "",
      "## Safety Coverage",
      "",
      renderCounts(countBy(cases, (item) => item.expectedSafetyLevel)),
      "",
      "## Topic Coverage",
      "",
      renderCounts(topicCoverageCounts(cases)),
      "",
      "## Issues",
      "",
      allProblems.length > 0 ? allProblems.map((item) => `- ${item}`).join("\n") : "- None",
      "",
      "## Next Step",
      "",
      result === "PASS"
        ? "The 500-case cat fixture is structurally valid and covers the main feline recommendation, medical caution, growth, urinary, renal, senior, allergy, and weight-control scenarios."
        : "Fix the structural or coverage issues above before relying on this fixture as broad cat recommendation evidence.",
      "",
    ].join("\n"),
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        cases: cases.length,
        repairedPrompts,
        damagedAfterRepair: damagedAfterRepair.length,
        structuralProblems: structuralProblems.length,
        coverageWarnings: coverageWarnings.length,
        result,
        report: reportPath,
      },
      null,
      2,
    ),
  );

  if (allProblems.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
