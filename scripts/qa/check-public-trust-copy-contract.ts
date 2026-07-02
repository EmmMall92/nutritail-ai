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
const termsPage = read("app/terms/page.tsx");
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
  'data-testid="public-ai-boundaries"',
  "Πώς κρατάμε την πρόταση αξιόπιστη",
  "Το AI εξηγεί. Το NutriTail αποφασίζει με δεδομένα.",
  "Food V2 βάση",
  "Κανόνες NutriTail",
  "OpenAI απάντηση",
  "Όρια ασφάλειας",
  "χωρίς να εφευρίσκει τροφές ή θρεπτικές τιμές",
  "Το OpenAI βοηθά στη συζήτηση, όχι στην αυθαίρετη επιλογή τροφής.",
  "Τι επιτρέπεται",
  "Τι δεν επιτρέπεται",
  "Δεν επιτρέπεται να εφευρίσκει τροφές ή θρεπτικές τιμές.",
  "Δεν επιτρέπεται να αγνοεί αλλεργίες, είδος ή ηλικία.",
  "Δεν επιτρέπεται να κάνει διάγνωση ή θεραπευτικές υποσχέσεις.",
];

const feedbackLoopMarkers = [
  'data-testid="public-feedback-loop"',
  "Πώς χρησιμοποιούμε το feedback",
  "Δεν αλλάζουν μόνα τους τις προτάσεις",
  "Τροφές που λείπουν",
  "Απαντήσεις που δεν βοήθησαν",
  "Επιλογές που πατά ο χρήστης",
];

const sourceQualityMarkers = [
  'data-testid="public-source-quality-model"',
  "Ποιότητα πηγών",
  "Δεν έχουν όλα τα δεδομένα την ίδια βαρύτητα",
  "Επίσημη πηγή",
  "Retailer ή ελληνικό e-shop",
  "Ετικέτα ή φωτογραφία συσκευασίας",
  "Ελλιπή δεδομένα",
];

const betaTermsMarkers = [
  'import { betaAccessPlanConfig } from "@/lib/beta/accessPlan";',
  "Beta πρόσβαση και πλάνα",
  "δεν ενεργοποιεί πληρωμή",
  "δεν ζητά στοιχεία κάρτας",
  "δεν ξεκινά συνδρομή",
  "betaAccessPlanConfig.accessPlan",
  "betaAccessPlanConfig.petLimit",
  "betaAccessPlanConfig.monthlyAnalysisLimit",
  "paid plans",
];

for (const marker of aboutMarkers) {
  assert(
    aboutPage.includes(marker),
    `About page must include public trust marker: ${marker}`
  );
}

for (const marker of feedbackLoopMarkers) {
  assert(
    aboutPage.includes(marker),
    `About page must include public feedback loop marker: ${marker}`
  );
}

for (const marker of methodologyMarkers) {
  assert(
    howItWorksPage.includes(marker),
    `How-it-works page must include methodology trust marker: ${marker}`
  );
}

for (const marker of sourceQualityMarkers) {
  assert(
    howItWorksPage.includes(marker),
    `How-it-works page must include source quality trust marker: ${marker}`
  );
}

for (const marker of betaTermsMarkers) {
  assert(
    termsPage.includes(marker),
    `Terms page must include beta access trust marker: ${marker}`
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
