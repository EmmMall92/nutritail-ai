import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const reportPage = readFileSync("app/print/pet-report/[id]/page.tsx", "utf8");
const chatbotPage = readFileSync("app/account/chatbot/page.tsx", "utf8");
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
  "getReportCustomerTakeaway",
  "getReportExecutiveSummary",
  "getTomorrowFeedingPlan",
  "getReportPlanSnapshot",
  "getCustomerHandoffSteps",
  "getCustomerPocketSummary",
  "getReportStartChecklist",
  "getReportDecisionSummary",
  "getFoodReasoningSummary",
  'data-testid="report-start-checklist"',
  'data-testid="report-safe-use-note"',
  'data-testid="report-executive-summary"',
  'data-testid="report-customer-takeaway"',
  'data-testid="report-decision-summary"',
  'data-testid="report-food-reasoning-summary"',
  'data-testid="report-tomorrow-feeding-plan"',
  'data-testid="report-next-action-summary"',
  'data-testid="report-plan-snapshot"',
  'data-testid="report-customer-handoff"',
  'data-testid="report-pocket-summary"',
  'data-testid="report-progress-return-kit"',
  'data-testid="report-home-tracking-sheet"',
  'data-testid="report-first-week-followup-plan"',
  'data-testid="report-at-a-glance-summary"',
  'data-testid="report-at-a-glance-transition"',
  'data-testid="report-completion-status"',
  "hasCompleteFoodPlan",
  "Πλήρες πλάνο με τροφή και ποσότητα",
  "Χρειάζεται επιλογή τροφής για πλήρες πλάνο",
  "reportPortionLabel",
  "reportTreatAllowance",
  "mealSplit.twoMeals",
  "mealSplit.threeMeals",
  "75% παλιά + 25% νέα",
  "Απλό πλάνο για αύριο",
  "Γιατί προτάθηκε",
  "Γιατί κρατάμε αυτή την πρόταση",
  "Καταλληλότητα",
  "Τι λείπει για να γίνει η πρόταση πλήρης",
  "Η αναφορά εξηγεί την επιλογή με απλά λόγια",
  "Γύρνα για νέα πρόταση αν αλλάξει γεύση",
  "Το πλάνο για αύριο είναι έτοιμο",
  "Το πλάνο θέλει ακόμη επιλογή τροφής",
  "Κράτα αυτά τα 4 σημεία",
  "1. Κύρια τροφή",
  "2. Ποσότητα",
  "3. Λιχουδιές",
  "4. Επανέλεγχος",
  "tomorrowFeedingPlan.cards.map",
  "Τι κρατάμε για σήμερα",
  "Απλό πλάνο για τάισμα, λιχουδιές και επανέλεγχο",
  "Τι κάνουμε από εδώ και πέρα",
  "Τρία απλά βήματα για να μη χαθεί το πλάνο.",
  "Μικρή κάρτα για το σπίτι",
  "Τα 4 σημεία που χρειάζεται να θυμάσαι",
  "customerHandoffSteps.map",
  "customerPocketSummary.map",
  "getProgressReturnKit",
  "getLatestProgressLog",
  "getProgressReportCards",
  "progressReturnKit.map",
  'data-testid="report-latest-progress"',
  "Τελευταίος έλεγχος προόδου",
  "Τι άλλαξε μετά το πλάνο",
  "Τωρινό βάρος",
  "Πραγματική ποσότητα",
  "Τι φέρνεις στον επόμενο έλεγχο",
  "Progress kit για να μη μαντεύουμε την επόμενη φορά",
  "Πραγματική ποσότητα",
  "Γύρνα στο NutriTail με νέο βάρος",
  "Σήμερα ταΐζουμε",
  "Πρώτη ποσότητα",
  "Λιχουδιές",
  "Επανέλεγχος",
  "Επιστροφή",
  "mealSplit.twoMeals",
  "mealSplit.threeMeals",
  "reportPlanSnapshot.map",
  "reportDecisionSummary.cards.map",
  "reportDecisionSummary.watchList.map",
  "7ήμερο tracking στο σπίτι",
  "Συμπλήρωσέ το πριν το επόμενο progress check",
  "Ημέρα",
  "Βάρος",
  "Γραμμάρια",
  "getTreatAllowance(analysis)",
  "Before you start",
  "Σύνοψη πλάνου",
  "Τι κρατάμε για τον/την",
  "Η γρήγορη εικόνα για χρήση στο σπίτι",
  "Στόχος",
  "Θερμίδες",
  "Τροφή",
  "Ποσότητα",
  "Κράτα περίπου",
  "Πρακτικά:",
  "Check these 4 points before using the plan",
  "Ασφαλής χρήση της αναφοράς",
  "Χρησιμοποίησέ τη σαν πλάνο σίτισης, όχι σαν διάγνωση.",
  "Καθημερινή χρήση",
  "Πότε ξαναγυρνάς",
  "Πότε σταματάμε και ρωτάμε γιατρό",
  "δυσκολία στην ούρηση",
  "Η ουσία για τον πελάτη",
  "Τι κρατάμε από αυτή την αναφορά",
  "Κύρια επιλογή",
  "Πρώτη ποσότητα",
  "Επόμενος έλεγχος",
  "reportCustomerTakeaway.cards.map",
  "επόμενο progress check",
  "Food selected",
  "Daily amount",
  "Calorie target",
  "Follow-up date",
  "Ready to use",
  "Confirm before use",
  "Πρώτη εβδομάδα εφαρμογής",
  "Κράτα το πλάνο σταθερό πριν κρίνουμε αν πέτυχε",
  "Φέρε νέο βάρος, πραγματικά γραμμάρια/ημέρα και αν ακόμη του αρέσει η τροφή.",
];

const requiredDigitalActionMarkers = [
  'data-testid="report-digital-next-actions"',
  "Συνέχεια online",
  "Κράτα το πλάνο ζωντανό μετά την αναφορά",
  "Έλεγχος προόδου",
  "Νέα πρόταση τροφής",
  "Αλλαγή γεύσης / εταιρείας",
  "Timeline",
  "Προφίλ κατοικιδίου",
  "mode=progress",
  "mode=recommendation",
  "reason=flavour",
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

assert(
  !reportPage.includes('label: "Fit"'),
  "Printable pet report must use customer-facing suitability wording instead of Fit."
);

for (const marker of requiredDigitalActionMarkers) {
  assert(
    reportPage.includes(marker),
    `Printable pet report must include digital next-action marker: ${marker}`
  );
}

const requiredRecommendationDeepLinkMarkers = [
  'const reason = query.get("reason")',
  'reason ?? "none"',
  'mode === "recommendation"',
  'setRecommendationMode("alternative")',
  'setStep("currentFood")',
  'Αλλαγή γεύσης / εταιρείας',
  'reason === "flavour"',
];

for (const marker of requiredRecommendationDeepLinkMarkers) {
  assert(
    chatbotPage.includes(marker),
    `Account chatbot must honor report recommendation deep-link marker: ${marker}`
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
