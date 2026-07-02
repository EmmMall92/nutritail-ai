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
      'data-testid="selected-food-next-steps"',
      "First daily plan:",
    ],
  },
  {
    area: "Saved pet continuation",
    file: "app/account/chatbot/page.tsx",
    markers: [
      'query.get("petId")',
      'query.get("mode")',
      'mode === "progress"',
      "/print/pet-timeline/${savedPetId}",
      "/account/chatbot?petId=${savedPetId}&mode=progress",
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
      'data-testid="account-today-command-center"',
      'data-testid="account-latest-activity-strip"',
      'data-testid="account-plan-snapshot"',
      'data-testid="account-beta-plan"',
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
    area: "Business layer",
    file: "app/beta/page.tsx",
    markers: [
      "Beta access plan",
      "Beta plan limits",
      'data-testid="beta-commercial-clarity"',
      'data-testid="beta-launch-signals"',
      "paid plans",
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
  packageJson.includes("qa:customer-journey-readiness-contract"),
  "CI readiness must include qa:customer-journey-readiness-contract."
);

console.log(
  `Customer journey readiness contract passed (${requiredAreas.length} launch areas covered).`
);
