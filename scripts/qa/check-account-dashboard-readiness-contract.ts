import { existsSync, readFileSync } from "node:fs";

function read(path: string) {
  if (!existsSync(path)) {
    throw new Error(`Missing required file for account dashboard readiness: ${path}`);
  }

  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const accountPage = read("app/account/page.tsx");
const chatbotPage = read("app/account/chatbot/page.tsx");
const petsPage = read("app/account/pets/page.tsx");
const petDetailPage = read("app/account/pets/[id]/page.tsx");
const packageJson = read("package.json");

const requiredAccountMarkers = [
  'data-testid="account-next-best-move"',
  'data-testid="account-plan-snapshot"',
  'data-testid="account-beta-plan"',
  'data-testid="account-beta-usage"',
  'data-testid="account-beta-journey-checklist"',
  'data-testid="account-beta-journey-checklist-item"',
  'data-testid="account-beta-proof-reminder"',
  "accountNextBestMove.actions.map",
  "function getAccountPlanSnapshot",
  "function getDashboardNextActions",
  "mode=recommendation&reason=flavour",
  "/print/pet-report/",
  "/print/pet-timeline/",
];

for (const marker of requiredAccountMarkers) {
  assert(accountPage.includes(marker), `Account dashboard is missing marker: ${marker}`);
}

const currentPlanCopy = [
  "Ενεργό πλάνο",
  "Τα βασικά που χρειάζεσαι σήμερα",
  "Η πλήρης ανάλυση μένει στην αναφορά",
  "Άνοιγμα αναφοράς",
  "Έλεγχος προόδου",
  "Άλλη τροφή",
  "Τροφή",
  "Θερμίδες",
  "Ποσότητα",
  "Επανέλεγχος",
  "2-4 εβδομάδες",
];

for (const marker of currentPlanCopy) {
  assert(accountPage.includes(marker), `Compact current-plan copy is missing: ${marker}`);
}

const removedDuplicateDashboardMarkers = [
  'data-testid="account-today-command-center"',
  'data-testid="account-next-action-guide"',
  'data-testid="account-latest-activity-strip"',
  'data-testid="account-home-brief"',
  'data-testid="account-customer-week-loop"',
  'data-testid="account-customer-week-loop-step"',
  'data-testid="account-plan-watchlist"',
  'data-testid="account-progress-check-reminder"',
  'data-testid="account-plan-decision-guide"',
  'data-testid="account-plan-next-steps"',
  'data-testid="account-weekly-rhythm"',
  'data-testid="account-progress-return-kit"',
  "function getAccountHomeBrief",
  "function getAccountActivityStrip",
  "function getAccountTodayTasks",
  "function getAccountWeeklyLoop",
  "function getAccountPlanWatchlist",
  "accountHomeBrief.cards.map",
  "accountActivityStrip.map",
  "accountTodayTasks.map",
  "accountWeeklyLoop.steps.map",
  "accountPlanWatchlist.map",
];

for (const marker of removedDuplicateDashboardMarkers) {
  assert(
    !accountPage.includes(marker),
    `Account dashboard should not reintroduce duplicate customer cards: ${marker}`
  );
}

const chatbotRequiredMarkers = [
  'data-testid="choose-food-before-save-notice"',
  'data-testid="selected-food-plan-card"',
  'data-testid="save-analysis-panel"',
  'data-testid="saved-analysis-handoff-panel"',
  'data-testid="saved-analysis-handoff-summary"',
  "Calculate grams/day",
  "Choose a food first",
];

for (const marker of chatbotRequiredMarkers) {
  assert(chatbotPage.includes(marker), `Chatbot customer flow is missing marker: ${marker}`);
}

const removedChatbotDuplicateMarkers = [
  "Το σημερινό πλάνο",
  "Today's plan",
  "Ήταν χρήσιμο;",
  "Was this helpful?",
  "The essentials that will be saved to the pet profile.",
];

for (const marker of removedChatbotDuplicateMarkers) {
  assert(
    !chatbotPage.includes(marker),
    `Chatbot save flow should not show duplicate summary/back-office copy: ${marker}`
  );
}

assert(
  petsPage.includes("/account/chatbot?petId=") &&
    petsPage.includes("/print/pet-report/") &&
    petsPage.includes("/print/pet-timeline/"),
  "Pets dashboard must keep chatbot, report, and timeline actions."
);

assert(
  petDetailPage.includes('data-testid="pet-profile-calorie-explainer"') &&
    petDetailPage.includes("Θερμίδες ηρεμίας") &&
    petDetailPage.includes("Ημερήσιος στόχος"),
  "Pet detail page must keep the calorie explainer for customers."
);

assert(
  packageJson.includes('"qa:account-dashboard-readiness-contract"'),
  "package.json must expose the account dashboard readiness QA script."
);

console.log("Account dashboard readiness contract passed.");
