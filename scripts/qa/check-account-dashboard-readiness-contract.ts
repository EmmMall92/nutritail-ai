import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const accountPage = read("app/account/page.tsx");
const betaAccessPlan = read("lib/beta/accessPlan.ts");
const petsPage = read("app/account/pets/page.tsx");
const packageJson = read("package.json");

const customerFacingSources = [
  ["account dashboard", accountPage],
  ["pets dashboard", petsPage],
] as const;

const mojibakeMarkers = [
  "Ξ±",
  "Ξµ",
  "Ξ·",
  "ΞΌ",
  "Ξ½",
  "Ο€",
  "Οƒ",
  "Ο„",
  "Ο‡",
  "Ο‰",
  "β€”",
  "β€",
];

for (const [label, source] of customerFacingSources) {
  const hits = mojibakeMarkers.filter((marker) => source.includes(marker));
  assert(
    hits.length === 0,
    `${label} must not contain mojibake markers in customer-facing copy: ${hits.join(
      ", "
    )}.`
  );
}

assert(
  accountPage.includes("type AccountReadinessStep"),
  "Account dashboard must define structured readiness steps."
);
assert(
  accountPage.includes("function getAccountReadinessSteps"),
  "Account dashboard must generate readiness steps from account data."
);
assert(
  accountPage.includes("Η πορεία σου"),
  "Account dashboard must show a customer-facing readiness section."
);
assert(
  accountPage.includes("Προφίλ κατοικιδίου"),
  "Readiness flow must include pet profile status."
);
assert(
  accountPage.includes("Διατροφική ανάλυση"),
  "Readiness flow must include nutrition analysis status."
);
assert(
  accountPage.includes("Πλάνο τροφής"),
  "Readiness flow must include food plan/report status."
);
assert(
  accountPage.includes("Έλεγχος προόδου"),
  "Readiness flow must include progress-check status."
);
assert(
  accountPage.includes('data-testid="account-weekly-rhythm"'),
  "Account dashboard must expose the weekly monitoring rhythm section."
);
assert(
  accountPage.includes('data-testid="account-progress-return-kit"') &&
    accountPage.includes("Τι να κρατάς μέχρι τον επόμενο έλεγχο") &&
    accountPage.includes("Βάρος") &&
    accountPage.includes("Γραμμάρια") &&
    accountPage.includes("Λιχουδιές") &&
    accountPage.includes("Όρεξη / ούρηση") &&
    accountPage.includes("Όρεξη / κόπρανα"),
  "Account dashboard must show a customer-facing progress return kit."
);
assert(
  accountPage.includes('data-testid="account-beta-plan"'),
  "Account dashboard must expose the beta access plan section."
);
assert(
  accountPage.includes("Beta πρόσβαση") &&
    accountPage.includes("betaAccessPlanConfig") &&
    accountPage.includes("betaPlanHighlights") &&
    betaAccessPlan.includes("petLimit: 3") &&
    betaAccessPlan.includes("monthlyAnalysisLimit: 20") &&
    accountPage.includes('href="/beta"') &&
    accountPage.includes('href="/plans"') &&
    accountPage.includes("Όρια και μελλοντικά πλάνα"),
  "Account dashboard must show beta plan limits and link to beta and plans pages."
);
assert(
  accountPage.includes("type BetaUsageSnapshot") &&
    accountPage.includes("function getBetaUsageSnapshot") &&
    accountPage.includes("isCurrentMonthDate") &&
    accountPage.includes('data-testid="account-beta-usage"') &&
    accountPage.includes("betaUsage.petsUsed") &&
    accountPage.includes("betaUsage.monthlyAnalysesUsed") &&
    accountPage.includes("betaUsage.petsPercent") &&
    accountPage.includes("betaUsage.analysesPercent") &&
    accountPage.includes("Αναλύσεις αυτόν τον μήνα"),
  "Account dashboard must show customer-facing beta usage against current beta limits."
);
assert(
  accountPage.includes("Ρυθμός παρακολούθησης"),
  "Account dashboard must explain the customer monitoring rhythm."
);
assert(
  accountPage.includes("Σε 2-4 εβδομάδες"),
  "Account dashboard must guide customers back to a progress check window."
);
assert(
  accountPage.includes("/account/chatbot?petId=") &&
    accountPage.includes("mode=progress"),
  "Account dashboard must link saved pets back into progress-check chatbot mode."
);
assert(
  accountPage.includes("/print/pet-report/"),
  "Account dashboard must link customers to printable pet reports."
);
assert(
  accountPage.includes("/print/pet-timeline/"),
  "Account dashboard must link customers to pet progress timelines."
);
assert(
  accountPage.includes("function getDashboardNextActions"),
  "Account dashboard must keep structured next best actions for customers."
);
assert(
  accountPage.includes("function getAccountTodayTasks"),
  "Account dashboard must generate a customer-facing command center from account data."
);
assert(
  accountPage.includes('data-testid="account-today-command-center"'),
  "Account dashboard must expose the today command center."
);
assert(
  accountPage.includes("accountTodayTasks.map"),
  "Account dashboard must render today command center actions from structured data."
);
assert(
  accountPage.includes("type AccountActivityStripItem"),
  "Account dashboard must define structured latest activity strip items."
);
assert(
  accountPage.includes("function getAccountActivityStrip"),
  "Account dashboard must generate latest activity from account data."
);
assert(
  accountPage.includes("function getAccountPlanSnapshot"),
  "Account dashboard must generate a current plan snapshot from the latest saved analysis."
);
assert(
  accountPage.includes('data-testid="account-latest-activity-strip"'),
  "Account dashboard must expose the latest activity strip."
);
assert(
  accountPage.includes('data-testid="account-plan-snapshot"'),
  "Account dashboard must expose the customer-facing current plan snapshot."
);
assert(
  accountPage.includes('data-testid="account-plan-next-steps"') &&
    accountPage.includes("1. Δες την αναφορά") &&
    accountPage.includes("2. Παρακολούθησε την πορεία") &&
    accountPage.includes("3. Κάνε έλεγχο προόδου") &&
    accountPage.includes("Σε 2-4 εβδομάδες γύρνα με νέο βάρος, γραμμάρια/ημέρα και λιχουδιές"),
  "Current plan snapshot must guide customers through report, timeline, and progress-check next steps."
);
assert(
  accountPage.includes("Σημερινό πλάνο") &&
    accountPage.includes("Θερμίδες") &&
    accountPage.includes("Γραμμάρια/ημέρα") &&
    accountPage.includes("Έλεγχος προόδου") &&
    accountPage.includes("Άνοιγμα αναφοράς") &&
    accountPage.includes("Σε 2-4 εβδομάδες έλεγξε βάρος, όρεξη και κόπρανα"),
  "Current plan snapshot must show food-plan, portion, report, and progress-check copy."
);
assert(
  accountPage.includes("getAnalysisFoodName") &&
    accountPage.includes("getAnalysisFeedingGrams") &&
    accountPage.includes("getAnalysisFoodScore"),
  "Account dashboard must read saved analysis fields defensively across old and new payload names."
);
assert(
  accountPage.includes("Συνέχισε από εκεί που έμεινες") &&
    accountPage.includes("Η τελευταία εικόνα του λογαριασμού σου") &&
    accountPage.includes("Τελευταία ανάλυση") &&
    accountPage.includes("Τελευταίος έλεγχος") &&
    accountPage.includes("Επόμενο καλύτερο βήμα"),
  "Latest activity strip must show customer-facing continuation copy."
);
assert(
  accountPage.includes("accountActivityStrip.map"),
  "Account dashboard must render latest activity cards from structured data."
);
assert(
  petsPage.includes("/account/chatbot?petId=") && petsPage.includes("mode=progress"),
  "Pets dashboard must link each saved pet to progress-check chatbot mode."
);
assert(
  petsPage.includes("/print/pet-report/") &&
    petsPage.includes("/print/pet-timeline/"),
  "Pets dashboard must expose report and timeline actions for saved pets."
);

const customerVisibleEnglishActionCopy = [
  "Progress check",
  "Progress kit",
  "progress check",
  "progress checks",
  "Τελευταίο progress",
  "επόμενο check",
  "Μέχρι το επόμενο check",
  "1. Δες το report",
  "Δες timeline",
  "Το timeline δείχνει",
  "μελλοντικά plans",
];

for (const marker of customerVisibleEnglishActionCopy) {
  assert(
    !accountPage.includes(marker),
    `Account dashboard must keep customer action copy in Greek. Found: ${marker}`
  );
}
assert(
  packageJson.includes('"qa:account-dashboard-readiness-contract"'),
  "package.json must expose the account dashboard readiness QA script."
);

assert(
  accountPage.includes("alternativeHref") &&
    accountPage.includes("mode=recommendation&reason=flavour") &&
    accountPage.includes("4. Άλλαξε γεύση ή εταιρεία") &&
    accountPage.includes("κράτα το ίδιο προφίλ"),
  "Current plan snapshot must let returning customers request a flavour or brand alternative without restarting."
);

assert(
  accountPage.includes("type AccountPlanWatchItem") &&
    accountPage.includes("function getAccountPlanWatchlist") &&
    accountPage.includes("accountPlanWatchlist.map") &&
    accountPage.includes('data-testid="account-plan-watchlist"') &&
    accountPage.includes("Μέχρι τον επόμενο έλεγχο") &&
    accountPage.includes("Τι αξίζει να παρακολουθείς") &&
    accountPage.includes("Βάρος") &&
    accountPage.includes("Ποσότητα") &&
    accountPage.includes("Λιχουδιές") &&
    accountPage.includes("Αποδοχή τροφής"),
  "Current plan snapshot must show a customer-facing watchlist for weight, portions, treats, stool/urine, and food acceptance."
);

assert(
  accountPage.includes('data-testid="account-progress-check-reminder"') &&
    accountPage.includes("Σε 2-4 εβδομάδες κάνε έλεγχο προόδου") &&
    accountPage.includes("Φέρε νέο βάρος, πραγματικά γραμμάρια/ημέρα") &&
    accountPage.includes("Άνοιγμα ελέγχου προόδου"),
  "Current plan snapshot must show a visible 2-4 week progress-check reminder with required return data."
);

console.log("Account dashboard readiness contract passed.");
