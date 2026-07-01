import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const reportPage = readFileSync("app/print/pet-report/[id]/page.tsx", "utf8");
const packageJson = readFileSync("package.json", "utf8");

const suspiciousMojibakeMarkers = [
  "Ο€",
  "Οƒ",
  "Ο„",
  "Ο‡",
  "Ο‰",
  "Ξ±",
  "Ξµ",
  "Ξ·",
  "ΞΌ",
  "Ξ½",
];

const requiredReportMarkers = [
  "getReportActionSummary",
  "getReportPlanSnapshot",
  "getCustomerHandoffSteps",
  "getCustomerPocketSummary",
  'data-testid="report-next-action-summary"',
  'data-testid="report-plan-snapshot"',
  'data-testid="report-customer-handoff"',
  'data-testid="report-pocket-summary"',
  "Τι κρατάμε για σήμερα",
  "Απλό πλάνο για τάισμα, λιχουδιές και επανέλεγχο",
  "Τι κάνουμε από εδώ και πέρα",
  "Τρία απλά βήματα για να μη χαθεί το πλάνο.",
  "Μικρή κάρτα για το σπίτι",
  "Τα 4 σημεία που χρειάζεται να θυμάσαι",
  "customerHandoffSteps.map",
  "customerPocketSummary.map",
  "Γύρνα στο NutriTail με νέο βάρος",
  "Σήμερα ταΐζουμε",
  "Πρώτη ποσότητα",
  "Λιχουδιές",
  "Επανέλεγχος",
  "Επιστροφή",
  "mealSplit.twoMeals",
  "mealSplit.threeMeals",
  "reportPlanSnapshot.map",
  "getTreatAllowance(analysis)",
];

const requiredDigitalActionMarkers = [
  'data-testid="report-digital-next-actions"',
  "Συνέχεια online",
  "Κράτα το πλάνο ζωντανό μετά την αναφορά",
  "Έλεγχος προόδου",
  "Νέα πρόταση τροφής",
  "Timeline",
  "Προφίλ κατοικιδίου",
  "mode=progress",
  "mode=recommendation",
  "/print/pet-timeline/",
];

for (const marker of suspiciousMojibakeMarkers) {
  assert(
    !reportPage.includes(marker),
    `Printable pet report must not include mojibake marker: ${marker}`
  );
}

for (const marker of requiredReportMarkers) {
  assert(
    reportPage.includes(marker),
    `Printable pet report must include customer action summary marker: ${marker}`
  );
}

for (const marker of requiredDigitalActionMarkers) {
  assert(
    reportPage.includes(marker),
    `Printable pet report must include digital next-action marker: ${marker}`
  );
}

assert(
  packageJson.includes('"qa:printable-report-action-summary"'),
  "package.json must expose the printable report action summary QA command."
);

assert(
  packageJson.includes("qa:printable-report-action-summary"),
  "CI readiness must include the printable report action summary QA command."
);

console.log("Printable report action summary contract passed.");
