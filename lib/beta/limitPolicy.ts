import { betaAccessPlanConfig } from "@/lib/beta/accessPlan";

export type BetaLimitUsageInput = {
  petsUsed: number;
  monthlyAnalysesUsed: number;
};

export type BetaLimitMeter = {
  used: number;
  limit: number;
  remaining: number;
  percent: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
};

export type BetaLimitStatus = {
  accessPlan: typeof betaAccessPlanConfig.accessPlan;
  enforcementMode: "soft_warn_only";
  pets: BetaLimitMeter;
  monthlyAnalyses: BetaLimitMeter;
  statusLabel: string;
  statusDetail: string;
  customerNextStep: string;
};

function normalizeCount(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function buildMeter(usedInput: number, limit: number): BetaLimitMeter {
  const used = normalizeCount(usedInput);
  const remaining = Math.max(0, limit - used);
  const percent = Math.min(100, Math.round((used / limit) * 100));

  return {
    used,
    limit,
    remaining,
    percent,
    isNearLimit: percent >= 80,
    isOverLimit: used > limit,
  };
}

export function getBetaLimitStatus({
  petsUsed,
  monthlyAnalysesUsed,
}: BetaLimitUsageInput): BetaLimitStatus {
  const pets = buildMeter(petsUsed, betaAccessPlanConfig.petLimit);
  const monthlyAnalyses = buildMeter(
    monthlyAnalysesUsed,
    betaAccessPlanConfig.monthlyAnalysisLimit
  );
  const isOverLimit = pets.isOverLimit || monthlyAnalyses.isOverLimit;
  const isNearLimit = pets.isNearLimit || monthlyAnalyses.isNearLimit;

  if (isOverLimit) {
    return {
      accessPlan: betaAccessPlanConfig.accessPlan,
      enforcementMode: "soft_warn_only",
      pets,
      monthlyAnalyses,
      statusLabel: "Πάνω από το beta όριο",
      statusDetail:
        "Δεν μπλοκάρουμε ακόμη τη χρήση στην beta, αλλά αυτό είναι σήμα για review πριν ανοίξουν paid plans.",
      customerNextStep:
        "Στείλε μας feedback αν χρειάζεσαι περισσότερα κατοικίδια ή αναλύσεις.",
    };
  }

  if (isNearLimit) {
    return {
      accessPlan: betaAccessPlanConfig.accessPlan,
      enforcementMode: "soft_warn_only",
      pets,
      monthlyAnalyses,
      statusLabel: "Κοντά στο beta όριο",
      statusDetail:
        "Αν χρειαστείς περισσότερα κατοικίδια ή αναλύσεις, στείλε μας feedback για να ανοίξουμε σταδιακά τα όρια.",
      customerNextStep:
        "Συνέχισε με τα πιο σημαντικά progress checks και πες μας τι σε περιορίζει.",
    };
  }

  return {
    accessPlan: betaAccessPlanConfig.accessPlan,
    enforcementMode: "soft_warn_only",
    pets,
    monthlyAnalyses,
    statusLabel: "Άνετη beta χρήση",
    statusDetail:
      "Έχεις χώρο για νέα ανάλυση, progress check ή αλλαγή τροφής μέσα στον μήνα.",
    customerNextStep:
      "Χρησιμοποίησε την beta για πραγματικά σενάρια και κράτα feedback όταν κάτι δεν σε βοηθά.",
  };
}
