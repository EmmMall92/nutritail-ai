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

export function betaAccessPlanMetadata() {
  return {
    accessPlan: betaAccessPlanConfig.accessPlan,
    accountLimit: betaAccessPlanConfig.accountLimit,
    petLimit: betaAccessPlanConfig.petLimit,
    monthlyAnalysisLimit: betaAccessPlanConfig.monthlyAnalysisLimit,
  };
}
