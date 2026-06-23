import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const fixturePath =
  process.env.NUTRITAIL_QA_DOG_FIXTURE_PATH ??
  "data/evals/chatbot-extra-cases-dog-201-600.json";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ?? "reports/dog_201_600_coverage_audit.md";

const expectedCaseCount = 400;
const firstExpectedId = 201;
const lastExpectedId = 600;
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

function normalizeCase(rawCase) {
  const repairedMessage = repairLegacyGreekMojibake(rawCase.message);
  return {
    id: Number(rawCase.id),
    message: repairedMessage.text,
    messageWasRepaired: repairedMessage.repaired,
    goal: rawCase.goal,
    safety: rawCase.safety,
    expected: rawCase.expected && typeof rawCase.expected === "object" ? rawCase.expected : {},
    checks: rawCase.checks && typeof rawCase.checks === "object" ? rawCase.checks : {},
  };
}

function countBy(items, selector) {
  const counts = new Map();

  for (const item of items) {
    const key = selector(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
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
  const missing = Array.from(
    { length: lastExpectedId - firstExpectedId + 1 },
    (_, index) => index + firstExpectedId,
  ).filter((id) => !uniqueIds.has(id));
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

  return {
    count: cases.length,
    unique: uniqueIds.size,
    missing,
    duplicates: [...new Set(duplicates)],
  };
}

function topicCoverageCounts(cases) {
  const ids = new Set(cases.map((item) => item.id));
  return [
    ["feeding_behaviour_201_250", 201, 250],
    ["lifestage_sterilised_251_350", 251, 350],
    ["sterilised_weight_351_425", 351, 425],
    ["allergy_sensitivity_426_475", 426, 475],
    ["medical_senior_growth_476_550", 476, 550],
    ["growth_gi_value_551_600", 551, 600],
  ].map(([label, from, to]) => [
    label,
    Array.from({ length: Number(to) - Number(from) + 1 }, (_, index) => Number(from) + index)
      .filter((id) => ids.has(id)).length,
  ]);
}

function coverageProblems(cases) {
  const goalCounts = countMap(cases, (item) => item.goal);
  const safetyCounts = countMap(cases, (item) => item.safety);
  const checkCounts = countMap(
    cases.flatMap((item) => Object.keys(item.checks).filter((key) => item.checks[key]).map((check) => ({ check }))),
    (item) => item.check,
  );
  const topics = new Map(topicCoverageCounts(cases));

  const minimumGoals = {
    general: 100,
    growth: 90,
    sterilised: 55,
    allergy: 40,
    senior: 15,
    sensitive_digestion: 10,
    weight_control: 8,
    premium: 8,
    value: 5,
    urinary: 3,
    renal: 2,
  };
  const minimumSafeties = {
    normal: 250,
    vet_referral: 100,
    emergency: 1,
  };
  const minimumChecks = {
    foodV2Candidates: 400,
    medicalNoTreatment: 100,
    puppyGrowth: 90,
    obesityLogic: 70,
    activeFit: 35,
    allergyReject: 25,
    largeBreedPuppy: 20,
  };
  const minimumTopics = {
    feeding_behaviour_201_250: 50,
    lifestage_sterilised_251_350: 100,
    sterilised_weight_351_425: 75,
    allergy_sensitivity_426_475: 50,
    medical_senior_growth_476_550: 75,
    growth_gi_value_551_600: 50,
  };

  return [
    ...Object.entries(minimumGoals)
      .filter(([goal, minimum]) => (goalCounts.get(goal) ?? 0) < minimum)
      .map(([goal, minimum]) => `goal coverage too low for ${goal}: ${goalCounts.get(goal) ?? 0}/${minimum}`),
    ...Object.entries(minimumSafeties)
      .filter(([safety, minimum]) => (safetyCounts.get(safety) ?? 0) < minimum)
      .map(
        ([safety, minimum]) =>
          `safety coverage too low for ${safety}: ${safetyCounts.get(safety) ?? 0}/${minimum}`,
      ),
    ...Object.entries(minimumChecks)
      .filter(([check, minimum]) => (checkCounts.get(check) ?? 0) < minimum)
      .map(([check, minimum]) => `check coverage too low for ${check}: ${checkCounts.get(check) ?? 0}/${minimum}`),
    ...Object.entries(minimumTopics)
      .filter(([topic, minimum]) => (topics.get(topic) ?? 0) < minimum)
      .map(([topic, minimum]) => `topic coverage too low for ${topic}: ${topics.get(topic) ?? 0}/${minimum}`),
  ];
}

async function main() {
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
  const cases = (Array.isArray(fixture) ? fixture : Array.isArray(fixture.cases) ? fixture.cases : []).map(
    normalizeCase,
  );
  const idSummary = summarizeIds(cases);
  const repairedMessages = cases.filter((item) => item.messageWasRepaired).length;
  const damagedAfterRepair = cases.filter((item) => damagedTextPattern.test(item.message)).map((item) => item.id);
  const structuralProblems = [
    idSummary.count !== expectedCaseCount
      ? `Expected ${expectedCaseCount} dog cases, found ${idSummary.count}.`
      : null,
    idSummary.unique !== expectedCaseCount
      ? `Expected ${expectedCaseCount} unique dog ids, found ${idSummary.unique}.`
      : null,
    idSummary.missing.length > 0 ? `Missing ids: ${idSummary.missing.join(", ")}.` : null,
    idSummary.duplicates.length > 0 ? `Duplicate ids: ${idSummary.duplicates.join(", ")}.` : null,
    ...cases
      .filter((item) => item.id < firstExpectedId || item.id > lastExpectedId)
      .map((item) => `Case id out of 201-600 range: ${item.id}.`),
    ...cases
      .filter((item) => item.expected.species !== "dog")
      .map((item) => `Case ${item.id} expected.species must be dog.`),
    ...cases
      .filter((item) => item.message.trim().length < 8)
      .map((item) => `Case ${item.id} message is missing or too short.`),
    ...cases
      .filter((item) => Object.keys(item.checks).length === 0)
      .map((item) => `Case ${item.id} checks object must not be empty.`),
    ...damagedAfterRepair.map((id) => `Case ${id} still has damaged Greek message text after repair.`),
  ].filter(Boolean);
  const coverageWarnings = coverageProblems(cases);
  const allProblems = [...structuralProblems, ...coverageWarnings];
  const result = allProblems.length === 0 ? "PASS" : "REVIEW";

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    [
      "# Dog 201-600 Coverage Audit",
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
      `- Prompt encoding repairs applied: ${repairedMessages}`,
      `- Prompt encoding issues after repair: ${damagedAfterRepair.length}`,
      `- Structural issues: ${structuralProblems.length}`,
      `- Coverage issues: ${coverageWarnings.length}`,
      `- Issues: ${allProblems.length}`,
      "",
      "## Goal Coverage",
      "",
      renderCounts(countBy(cases, (item) => item.goal)),
      "",
      "## Safety Coverage",
      "",
      renderCounts(countBy(cases, (item) => item.safety)),
      "",
      "## Check Coverage",
      "",
      renderCounts(
        countBy(
          cases.flatMap((item) =>
            Object.keys(item.checks)
              .filter((key) => item.checks[key])
              .map((check) => ({ check })),
          ),
          (item) => item.check,
        ),
      ),
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
        ? "The 400-case dog fixture is structurally valid and covers the main 201-600 recommendation, safety, growth, sterilised, allergy, senior, GI, renal, urinary, value, premium, and activity scenarios."
        : "Fix the structural or coverage issues above before relying on this fixture as broad dog 201-600 recommendation evidence.",
      "",
    ].join("\n"),
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        cases: cases.length,
        repairedMessages,
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
