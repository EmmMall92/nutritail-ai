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
  "getReportHandoffStrip",
  "getTomorrowFeedingPlan",
  "getReportDailyUseBrief",
  "getReportOnePagePlan",
  "getReportPlanSnapshot",
  "getCustomerHandoffSteps",
  "getCustomerPocketSummary",
  "getReportStartChecklist",
  "getReportDecisionSummary",
  "getFoodReasoningSummary",
  "reportNextActionHelper",
  "reportNextActionHelper.map",
  'data-testid="report-start-checklist"',
  'data-testid="report-safe-use-note"',
  'data-testid="report-handoff-strip"',
  'data-testid="report-executive-summary"',
  'data-testid="report-one-page-customer-plan"',
  'data-testid="report-one-page-reminders"',
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
  'data-testid="report-daily-use-brief"',
  'data-testid="report-next-action-helper"',
  'data-testid="report-plan-decision-guide"',
  'data-testid="report-completion-status"',
  'data-testid="report-feedback-panel"',
  'data-testid="report-feedback-helpful"',
  'data-testid="report-feedback-not-helpful"',
  'data-testid="report-feedback-status"',
  "submitReportFeedback",
  'source: "printable_pet_report"',
  'fetch("/api/feedback/chat"',
  "hasCompleteFoodPlan",
  "Πλήρες πλάνο με τροφή και ποσότητα",
  "Χρειάζεται επιλογή τροφής για πλήρες πλάνο",
  "reportPortionLabel",
  "reportHandoffStrip.map",
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
  "reportDailyUseBrief.cards.map",
  "reportDailyUseBrief.title",
  "reportOnePagePlan.cards.map",
  "reportOnePagePlan.reminders.map",
  "reportOnePagePlan.title",
  "reportOnePagePlan.subtitle",
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
  "Σημείωμα για τον επόμενο έλεγχο",
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
  "Συμπλήρωσέ το πριν τον επόμενο έλεγχο προόδου",
  "Ημέρα",
  "Βάρος",
  "Γραμμάρια",
  "getTreatAllowance(analysis)",
  "Πριν ξεκινήσεις",
  "Σύνοψη πλάνου",
  "Τι κρατάμε για τον/την",
  "Η γρήγορη εικόνα για χρήση στο σπίτι",
  "Στόχος",
  "Θερμίδες",
  "Τροφή",
  "Ποσότητα",
  "Κράτα περίπου",
  "Πρακτικά:",
  "Έλεγξε αυτά τα 4 σημεία πριν χρησιμοποιήσεις το πλάνο",
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
  "επόμενο έλεγχο προόδου",
  "Τροφή",
  "Ημερήσια ποσότητα",
  "Θερμιδικός στόχος",
  "Επανέλεγχος",
  "Έτοιμο για χρήση",
  "Επιβεβαίωσε πριν τη χρήση",
  "Πρώτη εβδομάδα εφαρμογής",
  "Κράτα το πλάνο σταθερό πριν κρίνουμε αν πέτυχε",
  "Φέρε νέο βάρος, πραγματικά γραμμάρια/ημέρα και αν ακόμη του αρέσει η τροφή.",
  "Αν κάτι αλλάξει",
  "Τι κάνουμε μετά την αναφορά",
  "Κράτα το ίδιο κατοικίδιο και το ίδιο ιστορικό",
  "Πάει καλά",
  "Δεν βλέπω αλλαγή",
  "Δεν του ταιριάζει η τροφή",
  "Ζήτησε άλλη γεύση ή εταιρεία χωρίς να ξεκινήσεις από την αρχή",
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

const requiredReportHandoffMarkers = [
  "Άμεσο πλάνο",
  "Τι κάνουμε από σήμερα",
  "Η γρήγορη περίληψη για τάισμα, ποσότητα και επόμενο έλεγχο",
  "Σήμερα",
  "Ποσότητα",
  "Έλεγχος",
];

for (const marker of suspiciousMojibakeMarkers) {
  assert(
    !reportPage.includes(marker),
    `Printable pet report must not include mojibake marker: ${marker}`
  );
}

const reportEnglishMicrocopyThatShouldStayOut = [
  "Before you start",
  "Check these 4 points before using the plan",
  "Food selected",
  "Daily amount",
  "Calorie target",
  "Follow-up date",
  "progress check",
  "Progress kit",
  "Ready to use",
  "Confirm before use",
  "Needs confirmation",
  "Needs food calories",
];

for (const marker of reportEnglishMicrocopyThatShouldStayOut) {
  assert(
    !reportPage.includes(marker),
    `Printable pet report must not leak English microcopy into the Greek customer report: ${marker}`
  );
}

for (const marker of requiredReportMarkers) {
  assert(
    reportPage.includes(marker),
    `Printable pet report must include customer action summary marker: ${marker}`
  );
}

for (const marker of requiredReportHandoffMarkers) {
  assert(
    reportPage.includes(marker),
    `Printable pet report must include handoff strip marker: ${marker}`
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
