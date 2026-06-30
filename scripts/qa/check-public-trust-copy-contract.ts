import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const aboutPage = read("app/about/page.tsx");
const howItWorksPage = read("app/how-it-works/page.tsx");
const packageJson = read("package.json");

const aboutMarkers = [
  'data-testid="public-trust-promise"',
  "Η δέσμευσή μας",
  "Λιγότερες υποθέσεις. Περισσότερα δεδομένα.",
  "Δεν εφευρίσκουμε τροφές",
  "Εξηγούμε τα όρια",
  "Δεν κάνουμε διάγνωση",
];

const methodologyMarkers = [
  'data-testid="public-trust-decision-model"',
  "Πώς κρατάμε την πρόταση αξιόπιστη",
  "Το AI εξηγεί. Το NutriTail αποφασίζει με δεδομένα.",
  "Food V2 βάση",
  "Κανόνες NutriTail",
  "OpenAI απάντηση",
  "Όρια ασφάλειας",
  "χωρίς να εφευρίσκει τροφές ή θρεπτικές τιμές",
];

for (const marker of aboutMarkers) {
  assert(
    aboutPage.includes(marker),
    `About page must include public trust marker: ${marker}`
  );
}

for (const marker of methodologyMarkers) {
  assert(
    howItWorksPage.includes(marker),
    `How-it-works page must include methodology trust marker: ${marker}`
  );
}

assert(
  packageJson.includes('"qa:public-trust-copy"'),
  "package.json must expose qa:public-trust-copy."
);

assert(
  packageJson.includes(
    "qa:account-dashboard-readiness-contract && npm run qa:public-trust-copy && npm run qa:launch-recommendation-contract"
  ),
  "CI readiness must include qa:public-trust-copy before launch recommendation checks."
);

console.log("Public trust copy contract passed.");
