export const betaAccessPlanConfig = {
  accessPlan: "limited_beta_v1",
  accountLimit: 1,
  petLimit: 3,
  monthlyAnalysisLimit: 20,
} as const;

export const betaPlanHighlights = [
  {
    label: `${betaAccessPlanConfig.petLimit} κατοικίδια`,
    detail: "Κράτα τα βασικά προφίλ που χρειάζεσαι για δοκιμή.",
  },
  {
    label: `${betaAccessPlanConfig.monthlyAnalysisLimit} αναλύσεις / μήνα`,
    detail: "Αρκετές για νέα πρόταση, progress check και αλλαγή τροφής.",
  },
  {
    label: "Reports και timeline",
    detail: "Οι αναφορές και οι έλεγχοι προόδου μένουν στον λογαριασμό.",
  },
] as const;

export const betaPlanLimits = [
  {
    metric: `${betaAccessPlanConfig.accountLimit} λογαριασμός`,
    detail: "Προσωπικό account για κατοικίδια, αναλύσεις και reports.",
  },
  {
    metric: `Έως ${betaAccessPlanConfig.petLimit} κατοικίδια`,
    detail: "Αρκετό για πραγματική δοκιμή χωρίς άσχετα ή διπλά δεδομένα.",
  },
  {
    metric: `${betaAccessPlanConfig.monthlyAnalysisLimit} αναλύσεις / μήνα`,
    detail: "Για νέα ανάλυση, progress check, αλλαγή γεύσης ή εναλλακτική πρόταση.",
  },
  {
    metric: "Feedback πρώτης προτεραιότητας",
    detail: "Τα not helpful, failed matches και food choices μπαίνουν στο admin review loop.",
  },
] as const;

export const futurePaidPlanDirection = [
  {
    name: "Beta",
    audience: "Για τους πρώτους χρήστες που βοηθούν με feedback.",
    includes: "Βασικός σύμβουλος, αποθηκευμένα pets, reports, timeline και progress checks μέσα στα beta όρια.",
    status: "Διαθέσιμο χωρίς πληρωμή στην beta.",
  },
  {
    name: "Personal",
    audience: "Για κηδεμόνες που θέλουν σταθερή παρακολούθηση ενός μικρού αριθμού κατοικιδίων.",
    includes: "Περισσότερες αναλύσεις, ιστορικό προόδου, αλλαγές τροφής και πιο καθαρά saved reports.",
    status: "Μελλοντικό πλάνο. Δεν ενεργοποιείται ακόμη.",
  },
  {
    name: "Pro",
    audience: "Για πιο απαιτητική χρήση, πολλά κατοικίδια ή συνεργαζόμενα pet professionals.",
    includes: "Περισσότερα profiles, πιο συχνά checks, εξαγωγές και πιο οργανωμένη παρακολούθηση feedback.",
    status: "Μελλοντικό πλάνο. Θα παρουσιαστεί πριν ζητηθεί οποιαδήποτε πληρωμή.",
  },
] as const;

export function betaAccessPlanMetadata() {
  return {
    accessPlan: betaAccessPlanConfig.accessPlan,
    accountLimit: betaAccessPlanConfig.accountLimit,
    petLimit: betaAccessPlanConfig.petLimit,
    monthlyAnalysisLimit: betaAccessPlanConfig.monthlyAnalysisLimit,
  };
}
