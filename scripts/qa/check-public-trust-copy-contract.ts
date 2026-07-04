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
const privacyPage = read("app/privacy/page.tsx");
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
  "Κύκλος βελτίωσης",
  "Πώς χρησιμοποιούμε τα σχόλια",
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

const customerOutputMarkers = [
  'data-testid="public-customer-output-model"',
  "Τι βλέπει τελικά ο πελάτης",
  "Η πρόταση πρέπει να είναι χρήσιμη στο σπίτι, όχι μόνο σωστή στον κώδικα.",
  "λίγες καθαρές επιλογές τροφής",
  "premium και value",
  "Γιατί προτάθηκε",
  "Επιλογή και γραμμάρια/ημέρα",
  "αποθηκευτεί",
  "αναφορά",
  "timeline",
  "έλεγχο προόδου",
  "νέα πρόταση",
];

const commercialTrustMarkers = [
  'data-testid="public-commercial-trust-guard"',
  'data-testid="public-commercial-trust-rule"',
  "Εμπορική διαφάνεια",
  "Η πρόταση δεν πρέπει να αγοράζεται από το brand.",
  "Featured ή προωθημένες επιλογές μπορούν να εμφανιστούν μόνο μέσα στα ασφαλή αποτελέσματα.",
  "κανόνες καταλληλότητας",
  "Οι κανόνες προηγούνται",
  "Οι συνεργασίες δεν κρύβουν τα όρια",
  "Ο πελάτης χρειάζεται καθαρό λόγο",
];

const launchTrustChecklistMarkers = [
  'data-testid="public-launch-trust-checklist"',
  'data-testid="public-launch-trust-checklist-item"',
  "Beta launch trust checklist",
  "Τι είναι έτοιμο για beta",
  "Τι παραμένει υπό έλεγχο",
  "Πότε θέλει κτηνίατρο",
  "Ξεκίνα ανάλυση",
  "Δες απόρρητο",
  "Δες όρους beta",
];

const betaTermsMarkers = [
  'import { betaAccessPlanConfig } from "@/lib/beta/accessPlan";',
  'data-testid="terms-paid-launch-notice"',
  'data-testid="terms-paid-launch-notice-item"',
  "paidLaunchNotice",
  "paid launch",
  "Δεν υπάρχει αυτόματη χρέωση",
  "Θα προηγηθεί καθαρή ενημέρωση",
  "Ο χρήστης θα επιλέγει συνειδητά",
  "Beta πρόσβαση και πλάνα",
  "δεν ενεργοποιεί πληρωμή",
  "δεν ζητά στοιχεία κάρτας",
  "δεν ξεκινά συνδρομή",
  "betaAccessPlanConfig.accessPlan",
  "betaAccessPlanConfig.petLimit",
  "betaAccessPlanConfig.monthlyAnalysisLimit",
  "πληρωμένα πλάνα",
];

const privacyTrustMarkers = [
  "AI και πάροχοι υπηρεσιών",
  "Το AI χρησιμοποιείται για να καταλαβαίνει φυσικά μηνύματα",
  "όχι για να εφευρίσκει τροφές, θερμίδες ή ιατρικές οδηγίες",
  "Οι προτάσεις τροφών, οι αποκλεισμοί αλλεργιών και τα όρια ασφάλειας παραμένουν στον κώδικα και στη βάση NutriTail.",
  "Διατήρηση, διόρθωση και διαγραφή",
  "Κρατάμε στοιχεία λογαριασμού, κατοικιδίων και αναλύσεων όσο χρειάζονται",
  "διόρθωση, εξαγωγή ή διαγραφή",
  "τι μπορεί να διαγραφεί άμεσα",
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

for (const marker of customerOutputMarkers) {
  assert(
    howItWorksPage.includes(marker),
    `How-it-works page must include customer output trust marker: ${marker}`
  );
}

for (const marker of commercialTrustMarkers) {
  assert(
    howItWorksPage.includes(marker),
    `How-it-works page must include commercial trust guard marker: ${marker}`
  );
}

for (const marker of launchTrustChecklistMarkers) {
  assert(
    howItWorksPage.includes(marker),
    `How-it-works page must include launch trust checklist marker: ${marker}`
  );
}

for (const marker of betaTermsMarkers) {
  assert(
    termsPage.includes(marker),
    `Terms page must include beta access trust marker: ${marker}`
  );
}

for (const marker of privacyTrustMarkers) {
  assert(
    privacyPage.includes(marker),
    `Privacy page must include public trust privacy marker: ${marker}`
  );
}

assert(
  packageJson.includes('"qa:public-trust-copy"'),
  "package.json must expose qa:public-trust-copy."
);

assert(
  packageJson.includes(
    "qa:account-dashboard-readiness-contract && npm run qa:public-trust-copy && npm run qa:support-flow-contract && npm run qa:launch-recommendation-contract"
  ),
  "CI readiness must include qa:public-trust-copy and qa:support-flow-contract before launch recommendation checks."
);

console.log("Public trust copy contract passed.");
