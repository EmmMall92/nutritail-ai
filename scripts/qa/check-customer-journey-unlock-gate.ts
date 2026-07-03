import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type SourceFile = "chatbot" | "account" | "report" | "timeline" | "packageJson";

type JourneyProof = {
  id: string;
  customerGoal: string;
  unlockGate: string;
  requiredEvidence: Record<SourceFile, string[]>;
};

type JourneyResult = {
  id: string;
  customerGoal: string;
  unlockGate: string;
  evidenceCount: number;
  checkedFiles: SourceFile[];
};

const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ||
  "reports/customer_journey_unlock_gate_qa.md";

function read(path: string) {
  if (!existsSync(path)) {
    throw new Error(`Missing file for customer journey unlock gate QA: ${path}`);
  }

  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const sources: Record<SourceFile, string> = {
  chatbot: read("app/account/chatbot/page.tsx"),
  account: read("app/account/page.tsx"),
  report: read("app/print/pet-report/[id]/page.tsx"),
  timeline: read("app/print/pet-timeline/[id]/page.tsx"),
  packageJson: read("package.json"),
};

const journeys: JourneyProof[] = [
  {
    id: "new-pet-recommendation-to-grams",
    customerGoal:
      "A new customer completes intake, sees 3 premium + 3 value food choices, taps one, and gets grams/day.",
    unlockGate: "Full recommendation journey proof",
    requiredEvidence: {
      chatbot: [
        "recommendedFoodChoices",
        "getRecommendationChoiceGroups",
        "premium",
        "value",
        "one food card",
        "grams/day",
        "Calculate grams/day",
        "First daily plan:",
        "selected-food-plan-card",
        "selected-food-first-week-checklist",
      ],
      account: ["account-today-command-center"],
      report: ["report-tomorrow-feeding-plan"],
      timeline: ["PetTimelineReportPage"],
      packageJson: ['"qa:customer-journey-unlock-gate"'],
    },
  },
  {
    id: "save-analysis-to-report-and-profile",
    customerGoal:
      "A customer saves the chosen food, then can open profile, report, timeline, and progress check.",
    unlockGate: "Full recommendation journey proof",
    requiredEvidence: {
      chatbot: [
        "Save to my account",
        "Analysis saved",
        "Open report",
        "Open timeline",
        "Progress check",
        "Your pet profile, report, timeline, and progress check are ready.",
      ],
      account: ["/print/pet-report/${latestPet.id}", "/print/pet-timeline/${latestPet.id}"],
      report: ["report-next-action-summary", "report-progress-return-kit"],
      timeline: ["progressLogs"],
      packageJson: ["qa:customer-journey-readiness-contract"],
    },
  },
  {
    id: "returning-pet-progress-check",
    customerGoal:
      "A returning customer chooses a saved pet and records progress without restarting intake.",
    unlockGate: "Returning pet proof",
    requiredEvidence: {
      chatbot: [
        "saved-pet-continuation-panel",
        "saved-pet-continuation-decision-guide",
        'action === "progress"',
        "formatSavedPetProgressPrompt",
        "parseProgressUpdate(text)",
        "buildProgressDecision",
      ],
      account: ["account-progress-check-reminder", "mode=progress"],
      report: ["report-latest-progress"],
      timeline: ["progressLogs", "created_at"],
      packageJson: ["qa:saved-pet-continuation-contract"],
    },
  },
  {
    id: "returning-pet-no-result-or-food-change",
    customerGoal:
      "A returning customer can say the plan did not work, request a new food, or change flavour/brand.",
    unlockGate: "Returning pet proof",
    requiredEvidence: {
      chatbot: [
        'action === "no_result"',
        'action === "change_food"',
        'setRecommendationMode("alternative")',
        "reason === \"flavour\"",
        "If there was no weight-loss progress",
        "flavor or brand change",
      ],
      account: ["mode=recommendation&reason=flavour", "alternativeHref"],
      report: ["reason=flavour", "Επιβεβαίωσε την ακριβή φόρμουλα"],
      timeline: ["PetTimelineReportPage", "progressLogs"],
      packageJson: ["qa:chatbot-progress-decision"],
    },
  },
  {
    id: "mobile-report-account-handoff",
    customerGoal:
      "A mobile customer can read the report/account handoff and knows what to do today and when to return.",
    unlockGate: "Report/account proof",
    requiredEvidence: {
      chatbot: [
        "sticky bottom-0",
        "scroll-pb-72",
        "selected-food-first-week-checklist",
        "selected-food-next-steps",
        "After you save",
      ],
      account: ["account-plan-snapshot", "account-progress-return-kit", "account-beta-usage"],
      report: [
        "report-start-checklist",
        "report-customer-takeaway",
        "report-tomorrow-feeding-plan",
        "report-plan-decision-guide",
        "report-progress-return-kit",
      ],
      timeline: ["sm:p-8", "md:grid-cols-2"],
      packageJson: ["qa:mobile-customer-readiness-contract"],
    },
  },
];

assert(journeys.length === 5, "Customer journey unlock gate QA must cover exactly five journeys.");

const results: JourneyResult[] = [];

for (const journey of journeys) {
  assert(journey.customerGoal.length > 20, `Journey ${journey.id} needs a clear customer goal.`);
  assert(journey.unlockGate.length > 0, `Journey ${journey.id} needs an unlock gate.`);

  let evidenceCount = 0;
  const checkedFiles: SourceFile[] = [];

  for (const [sourceName, markers] of Object.entries(journey.requiredEvidence) as [
    SourceFile,
    string[],
  ][]) {
    const source = sources[sourceName];
    checkedFiles.push(sourceName);

    for (const marker of markers) {
      assert(
        source.includes(marker),
        `Journey ${journey.id} is missing evidence "${marker}" in ${sourceName}.`
      );
      evidenceCount += 1;
    }
  }

  results.push({
    id: journey.id,
    customerGoal: journey.customerGoal,
    unlockGate: journey.unlockGate,
    evidenceCount,
    checkedFiles,
  });
}

const productProgress = read("docs/product-progress-score.md");

for (const gate of [
  "Full recommendation journey proof",
  "Returning pet proof",
  "Report/account proof",
]) {
  assert(
    productProgress.includes(gate),
    `Product progress rubric must include the customer UX unlock gate: ${gate}.`
  );
}

assert(
  sources.packageJson.includes(
    "qa:customer-journey-readiness-contract && npm run qa:customer-journey-unlock-gate"
  ),
  "CI readiness must run the customer journey unlock gate immediately after the broader journey contract."
);

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(
  reportPath,
  [
    "# Customer Journey Unlock Gate QA",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This report is customer-product evidence, not a substitute for a logged-in browser smoke test.",
    "It proves that the five Customer UX unlock journeys have protected code paths across chatbot, account, report, timeline, and CI scripts.",
    "",
    "## Summary",
    "",
    `- Result: PASS`,
    `- Journeys checked: ${results.length}`,
    `- Evidence markers checked: ${results.reduce((sum, result) => sum + result.evidenceCount, 0)}`,
    "- Unlock gates covered: Full recommendation journey proof, Returning pet proof, Report/account proof",
    "- Next manual proof: run these same journeys on production with a logged-in customer account.",
    "",
    "## Journey Evidence",
    "",
    "| Journey | Unlock gate | Evidence markers | Files checked | Customer goal |",
    "| --- | --- | ---: | --- | --- |",
    ...results.map(
      (result) =>
        `| ${result.id} | ${result.unlockGate} | ${result.evidenceCount} | ${result.checkedFiles.join(", ")} | ${result.customerGoal} |`
    ),
    "",
    "## Manual Live Follow-Up",
    "",
    "1. Create or log in to a QA customer account.",
    "2. Run a new-pet recommendation until 3 premium/value food cards are visible.",
    "3. Choose one food and confirm grams/day appears.",
    "4. Save the analysis and open profile, printable report, and timeline.",
    "5. Return to the same pet for progress check, no-result advice, and flavour/brand change.",
  ].join("\n") + "\n",
  "utf8"
);

console.log(`Customer journey unlock gate QA passed (${journeys.length} journeys covered).`);
console.log(`Wrote ${reportPath}.`);
