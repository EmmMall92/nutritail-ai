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
  accountPage.includes('data-testid="account-beta-plan"'),
  "Account dashboard must expose the beta access plan section."
);
assert(
  accountPage.includes("Beta πρόσβαση") &&
    accountPage.includes("3 κατοικίδια") &&
    accountPage.includes("20 αναλύσεις / μήνα") &&
    accountPage.includes('href="/beta"'),
  "Account dashboard must show beta plan limits and link to the beta page."
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
  accountPage.includes("type AccountActivityStripItem"),
  "Account dashboard must define structured latest activity strip items."
);
assert(
  accountPage.includes("function getAccountActivityStrip"),
  "Account dashboard must generate latest activity from account data."
);
assert(
  accountPage.includes('data-testid="account-latest-activity-strip"'),
  "Account dashboard must expose the latest activity strip."
);
assert(
  accountPage.includes("Συνέχισε από εκεί που έμεινες") &&
    accountPage.includes("Η τελευταία εικόνα του λογαριασμού σου") &&
    accountPage.includes("Τελευταία ανάλυση") &&
    accountPage.includes("Τελευταίο progress") &&
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
assert(
  packageJson.includes('"qa:account-dashboard-readiness-contract"'),
  "package.json must expose the account dashboard readiness QA script."
);

console.log("Account dashboard readiness contract passed.");
