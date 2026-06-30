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
const packageJson = read("package.json");

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
  accountPage.includes("Ρυθμός παρακολούθησης"),
  "Account dashboard must explain the customer monitoring rhythm."
);
assert(
  accountPage.includes("Σε 2-4 εβδομάδες"),
  "Account dashboard must guide customers back to a progress check window."
);
assert(
  packageJson.includes("\"qa:account-dashboard-readiness-contract\""),
  "package.json must expose the account dashboard readiness QA script."
);

console.log("Account dashboard readiness contract passed.");
