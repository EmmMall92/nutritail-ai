import { existsSync, readFileSync } from "node:fs";

type ContractCheck = {
  area: string;
  file: string;
  markers: string[];
};

function read(path: string) {
  if (!existsSync(path)) {
    throw new Error(`Missing required file for customer journey readiness: ${path}`);
  }

  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const checks: ContractCheck[] = [
  {
    area: "Final chatbot experience",
    file: "app/account/chatbot/page.tsx",
    markers: [
      "recommendedFoodChoices",
      "getRecommendationChoiceGroups",
      "Choose one food card below to estimate daily portions.",
      "Calculate grams/day",
      'data-testid="selected-food-plan-card"',
      "First portion:",
      "Keep treats steady and review weight, appetite, and stool in 2-4 weeks.",
    ],
  },
  {
    area: "Saved pet continuation",
    file: "app/account/chatbot/page.tsx",
    markers: [
      'query.get("petId")',
      'query.get("mode")',
      'mode === "progress"',
      'action === "no_result"',
      'action === "change_food"',
      'action === "timeline"',
      'data-testid="saved-pet-continuation-panel"',
      'data-testid="saved-pet-continuation-decision-guide"',
      "/print/pet-timeline/${savedPetId}",
      "/account/chatbot?petId=${savedPetId}&mode=progress",
      "/account/chatbot?petId=${savedPetId}&mode=recommendation&reason=flavour",
    ],
  },
  {
    area: "Pet report page",
    file: "scripts/qa/check-printable-report-action-summary-contract.ts",
    markers: [
      "report-food-reasoning-summary",
      "report-tomorrow-feeding-plan",
      "Food selected",
      "reason=flavour",
      "/print/pet-timeline/",
      "qa:printable-report-action-summary",
    ],
  },
  {
    area: "Food recommendation accuracy",
    file: "scripts/qa/check-customer-recommendation-smoke.ts",
    markers: [
      "sterilised dog",
      "weight loss dog",
      "chicken allergy dog",
      "urinary cat",
      "renal cat",
      "large breed puppy",
      "senior dog",
    ],
  },
  {
    area: "Food recommendation accuracy",
    file: "lib/ai/responseComposer.ts",
    markers: [
      "premium.slice(0, 3)",
      "value.slice(0, 3)",
      "Do not add brand-level winners or unlisted alternatives.",
      "removeBackOfficeLines",
    ],
  },
  {
    area: "User account polish",
    file: "app/account/page.tsx",
    markers: [
      'data-testid="account-next-best-move"',
      'data-testid="account-plan-snapshot"',
      'data-testid="account-beta-plan"',
      "Ενεργό πλάνο",
      "Η πλήρης ανάλυση μένει στην αναφορά",
      "/print/pet-report/${latestPet.id}",
      "/print/pet-timeline/${latestPet.id}",
      "mode=recommendation&reason=flavour",
    ],
  },
  {
    area: "Email/auth polish",
    file: "scripts/qa/check-auth-customer-copy-contract.ts",
    markers: [
      "auth-register-confirmation-next-steps",
      "auth-forgot-email-sent-next-steps",
      "auth-reset-session-warning",
      "auth-reset-success-next-steps",
    ],
  },
  {
    area: "Public trust pages",
    file: "scripts/qa/check-public-trust-copy-contract.ts",
    markers: [
      "public-trust-promise",
      "public-feedback-loop",
      "public-trust-decision-model",
      "public-ai-boundaries",
      "public-source-quality-model",
    ],
  },
  {
    area: "Analytics/feedback loop",
    file: "app/admin/chat-feedback/page.tsx",
    markers: [
      'data-testid="chat-feedback-launch-triage"',
      'data-testid="chat-feedback-dropoff-priority"',
      "Selected Food Trends",
      "Not-Helpful Patterns",
      "Analysis Funnel",
      "food_choice_selected",
    ],
  },
  {
    area: "Launch QA",
    file: "scripts/qa/run-chatbot-golden-suite.mjs",
    markers: [
      "Customer flow links",
      "report, timeline, progress",
      "400 additional dog cases",
      "cat 001-500 coverage",
      "food-selection next steps",
    ],
  },
  {
    area: "Launch QA",
    file: "scripts/qa/check-mobile-customer-readiness-contract.ts",
    markers: [
      "Mobile customer readiness",
      "Account chatbot mobile frame",
      "Account chatbot mobile food cards",
      "Printable report mobile sections",
      "qa:mobile-customer-readiness-contract",
    ],
  },
  {
    area: "Launch QA",
    file: "scripts/qa/check-customer-live-journey-proof.mjs",
    markers: [
      "PASS_NON_DESTRUCTIVE",
      "PASS_FULL",
      "manualProofFile",
      "manualJourneyRequirements",
      "requiredTerms",
      "missingTerms",
      "hasPlaceholderEvidence",
      "Placeholder/TODO evidence is not accepted",
      "NUTRITAIL_QA_WRITE_MANUAL_PROOF_DRAFT",
      "NUTRITAIL_QA_KEEP_LIVE_WRITE_PROOF",
      "cleanup_live_write_pet",
      "soft-delete enabled by default",
      "DELETE /api/account/pets/:id",
      "customer-live-journey-proof.draft.json",
      "manual_proof_draft_written",
      "manualJourneyResults",
      "missingManualProofKeys",
      "food_choice_grams",
      "save_analysis",
      "open_report",
      "open_timeline",
      "return_for_progress",
      "returning_continuation",
      "report_account_clarity",
      "no-result",
      "flavour",
      "new food",
      "update the Customer UX score",
    ],
  },
  {
    area: "Launch QA",
    file: "docs/customer-live-journey-proof.md",
    markers: [
      "Customer Live Journey Proof",
      "PASS_NON_DESTRUCTIVE",
      "PASS_FULL",
      "customer-live-journey-proof.json",
      "customer-live-journey-proof.draft.json",
      "NUTRITAIL_QA_WRITE_MANUAL_PROOF_DRAFT",
      "The runner rejects TODO, placeholder, draft, or example evidence text",
      "soft-deletes the controlled QA pet",
      "NUTRITAIL_QA_KEEP_LIVE_WRITE_PROOF",
      "DELETE /api/account/pets/:id",
      "food_choice_grams",
      "Required evidence terms",
      "Only `PASS_FULL` should justify moving Customer UX at the current live customer journey gate",
    ],
  },
  {
    area: "Launch QA",
    file: "docs/customer-live-journey-proof.template.json",
    markers: [
      "food_choice_grams",
      "save_analysis",
      "open_report",
      "open_timeline",
      "return_for_progress",
      "returning_continuation",
      "passed",
      "evidence",
    ],
  },
  {
    area: "Business layer",
    file: "app/account/page.tsx",
    markers: [
      'data-testid="account-beta-plan"',
      'data-testid="account-beta-usage"',
      "getBetaUsageSnapshot",
      "betaUsage.petsUsed",
      "betaUsage.monthlyAnalysesUsed",
    ],
  },
  {
    area: "Business layer",
    file: "app/beta/page.tsx",
    markers: [
      "Beta access plan",
      "Beta plan limits",
      'data-testid="beta-commercial-clarity"',
      'data-testid="beta-launch-signals"',
      "πληρωμένα πλάνα",
    ],
  },
  {
    area: "Business layer",
    file: "lib/beta/accessPlan.ts",
    markers: ["petLimit", "monthlyAnalysisLimit", "accountLimit"],
  },
];

const coveredAreas = new Set<string>();

for (const check of checks) {
  const source = read(check.file);
  coveredAreas.add(check.area);

  for (const marker of check.markers) {
    assert(
      source.includes(marker),
      `Customer journey readiness missing "${marker}" for ${check.area} in ${check.file}.`
    );
  }
}

const requiredAreas = [
  "Final chatbot experience",
  "Saved pet continuation",
  "Pet report page",
  "Food recommendation accuracy",
  "User account polish",
  "Email/auth polish",
  "Public trust pages",
  "Analytics/feedback loop",
  "Launch QA",
  "Business layer",
];

for (const area of requiredAreas) {
  assert(coveredAreas.has(area), `Customer journey readiness contract does not cover ${area}.`);
}

const packageJson = read("package.json");

assert(
  packageJson.includes('"qa:customer-journey-readiness-contract"'),
  "package.json must expose qa:customer-journey-readiness-contract."
);

assert(
  packageJson.includes('"qa:customer-journey-unlock-gate"'),
  "package.json must expose qa:customer-journey-unlock-gate."
);

assert(
  packageJson.includes("qa:customer-journey-readiness-contract"),
  "CI readiness must include qa:customer-journey-readiness-contract."
);

assert(
  packageJson.includes('"qa:saved-pet-continuation-contract"'),
  "package.json must expose qa:saved-pet-continuation-contract."
);

assert(
  packageJson.includes("qa:mobile-customer-readiness-contract && npm run qa:saved-pet-continuation-contract && npm run qa:customer-journey-readiness-contract && npm run qa:customer-journey-unlock-gate"),
  "CI readiness must run mobile, saved-pet, customer journey, and customer journey unlock gate contracts in order."
);

console.log(
  `Customer journey readiness contract passed (${requiredAreas.length} launch areas covered).`
);
