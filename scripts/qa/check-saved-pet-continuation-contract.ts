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
      "runFollowUpAction",
      'data-testid="saved-pet-continuation-panel"',
      'data-testid="saved-pet-continuation-decision-guide"',
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
