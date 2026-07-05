import { existsSync, readFileSync } from "node:fs";

type SourceCheck = {
  file: string;
  markers: string[];
};

function read(path: string) {
  if (!existsSync(path)) {
    throw new Error(`Missing required file for saved-pet continuation contract: ${path}`);
  }

  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const checks: SourceCheck[] = [
  {
    file: "app/account/chatbot/page.tsx",
    markers: [
      'type FollowUpMode = "progress" | "no_result" | null',
      "formatSavedPetContinuityIntro",
      "formatSavedPetProgressPrompt",
      "savedPetDecisionGuide",
      "savedPetContinuationPrepChecklist",
      "runFollowUpAction",
      'data-testid="saved-analysis-handoff-panel"',
      'data-testid="saved-analysis-handoff-summary"',
      'data-testid="saved-analysis-summary-food"',
      'data-testid="saved-analysis-summary-portion"',
      'data-testid="saved-analysis-summary-next-check"',
      'data-testid="saved-analysis-open-profile"',
      'data-testid="saved-analysis-open-report"',
      'data-testid="saved-analysis-open-timeline"',
      'data-testid="saved-analysis-progress-check"',
      'data-testid="saved-analysis-no-result"',
      'data-testid="saved-analysis-change-food"',
      'data-testid="saved-analysis-new-analysis"',
      "reason=no_result",
      'reason === "no_result"',
      'setFollowUpMode(noResultMode ? "no_result" : "progress")',
      "No visible progress",
      "Check portions, treats, and whether a new food is needed.",
      "Τι κρατήθηκε στο προφίλ",
      "σε 2-4 εβδομάδες",
      'data-testid="saved-pet-continuation-panel"',
      'data-testid="saved-pet-continuation-prep-checklist"',
      'data-testid="saved-pet-continuation-decision-guide"',
      'data-testid="saved-pet-progress-sticky-next-actions"',
      "saved-pet-progress-sticky-action-${item.action}",
      "latestProgressDecisionStatus && followUpMode",
      "What to have ready",
      "Current weight",
      "Grams & treats",
      "Flavor or brand",
      "saved-pet-continuation-action-${action.id}",
      'action === "progress"',
      'action === "no_result"',
      'action === "change_food"',
      'action === "timeline"',
      'action === "new_analysis"',
      'setFollowUpMode("progress")',
      'setFollowUpMode("no_result")',
      'setRecommendationMode("alternative")',
      'setStep("currentFood")',
      'mode === "progress"',
      'mode === "recommendation"',
      'reason === "flavour"',
      "/print/pet-timeline/",
      "/account/chatbot?petId=${savedPetId}&mode=recommendation&reason=flavour",
      "parseProgressUpdate(text)",
      "buildProgressDecision",
    ],
  },
  {
    file: "app/account/page.tsx",
    markers: [
      "progressHref",
      "alternativeHref",
      "timelineHref",
      "mode=progress",
      "mode=recommendation&reason=flavour",
      "/print/pet-timeline/",
      'data-testid="account-progress-check-reminder"',
      'data-testid="account-progress-return-kit"',
    ],
  },
  {
    file: "app/account/pets/page.tsx",
    markers: [
      "/account/chatbot?petId=",
      "mode=progress",
      "/print/pet-timeline/",
    ],
  },
  {
    file: "scripts/qa/check-chatbot-progress-decision.ts",
    markers: [
      "parseProgressUpdate",
      "buildProgressDecision",
      "no_result",
      "reduce_treats",
      "review_food_fit",
    ],
  },
  {
    file: "scripts/qa/check-chatbot-progress-parsing.ts",
    markers: [
      "currentWeightKg",
      "feedingGramsPerDay",
      "treatsNote",
      "appetiteNote",
      "stoolNote",
      "energyNote",
      "foodAcceptanceNote",
      "missingFollowUpFields",
      "hasEnoughProgressContext",
    ],
  },
];

for (const check of checks) {
  const source = read(check.file);

  for (const marker of check.markers) {
    assert(
      source.includes(marker),
      `Saved-pet continuation contract missing "${marker}" in ${check.file}.`
    );
  }
}

const chatbotPage = read("app/account/chatbot/page.tsx");
const handleStepIndex = chatbotPage.indexOf("async function handleStep(text: string)");
const progressMetricRoutingIndex = chatbotPage.indexOf(
  "if (hasProgressMetric(text))",
  handleStepIndex
);
const genericPetChoiceFallbackIndex = chatbotPage.indexOf(
  'if (step === "petChoice")',
  progressMetricRoutingIndex
);

assert(
  handleStepIndex >= 0 &&
    progressMetricRoutingIndex >= 0 &&
    genericPetChoiceFallbackIndex >= 0,
  "Saved-pet continuation contract must include progress metric routing and the generic pet-choice fallback."
);

assert(
  progressMetricRoutingIndex < genericPetChoiceFallbackIndex,
  "Saved-pet progress replies such as `7κιλα` must be routed before the generic pet-choice fallback."
);

const packageJson = read("package.json");

assert(
  packageJson.includes('"qa:saved-pet-continuation-contract"'),
  "package.json must expose qa:saved-pet-continuation-contract."
);

assert(
  packageJson.includes(
    "qa:saved-pet-continuation-contract && npm run qa:customer-journey-readiness-contract"
  ),
  "CI readiness must run saved-pet continuation before the broader customer journey contract."
);

console.log("Saved-pet continuation contract passed.");
