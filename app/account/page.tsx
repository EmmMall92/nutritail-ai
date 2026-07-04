"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  betaAccessPlanConfig,
  betaPlanHighlights,
} from "@/lib/beta/accessPlan";
import { getBetaLimitStatus } from "@/lib/beta/limitPolicy";
import { createClient } from "@/lib/supabase/client";
import { formatProgressDecisionConfidence } from "@/lib/progressDecisionCopy";

type Customer = {
  id: string;
  authUserId?: string | null;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  bonusCardCode?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type AnalysisHistoryItem = {
  id: string;
  createdAt: string;
  rer?: number | null;
  mer?: number | null;
  matchedFoodName?: string | null;
  feedingGramsPerDay?: number | null;
  foodScore?: number | null;
  weightGoal?: string | null;
  matched_food_name?: string | null;
  feeding_grams_per_day?: number | null;
  food_score?: number | null;
  weight_goal?: string | null;
};

type AccountPet = {
  id: string;
  name?: string | null;
  species?: string | null;
  weight?: number | null;
  analysisHistory?: AnalysisHistoryItem[];
  latestProgressLog?: {
    id: string;
    created_at: string;
    metadata?: {
      currentWeightKg?: number | null;
      feedingGramsPerDay?: number | null;
      progressDecisionStatus?: string | null;
      progressDecisionConfidence?: string | null;
      progressDecisionHeadlineEn?: string | null;
      progressDecisionHeadlineEl?: string | null;
      appetiteNote?: string | null;
      stoolNote?: string | null;
      energyNote?: string | null;
      treatsNote?: string | null;
    } | null;
  } | null;
};

type DashboardNextAction = {
  title: string;
  detail: string;
  href: string;
  tone: "primary" | "secondary";
};

type AccountReadinessStep = {
  title: string;
  detail: string;
  isComplete: boolean;
  href: string;
  actionLabel: string;
};

type AccountActivityStripItem = {
  label: string;
  value: string;
  detail: string;
  href: string;
  actionLabel: string;
};

type AccountTodayTask = {
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
  tone: "primary" | "calm";
};

type AccountNextBestMoveAction = {
  label: string;
  href: string;
  tone: "primary" | "secondary";
};

type AccountNextBestMove = {
  eyebrow: string;
  title: string;
  detail: string;
  helper: string;
  actions: AccountNextBestMoveAction[];
};

type AccountPlanSnapshot = {
  petName: string;
  weightGoal: string;
  foodName: string;
  dailyCalories: string;
  gramsPerDay: string;
  foodFit: string;
  progressHref: string;
  reportHref: string;
  timelineHref: string;
  alternativeHref: string;
};

type AccountHomeBriefCard = {
  label: string;
  value: string;
  detail: string;
};

type AccountHomeBrief = {
  title: string;
  subtitle: string;
  reportHref: string;
  progressHref: string;
  cards: AccountHomeBriefCard[];
};

type AccountPlanWatchItem = {
  label: string;
  detail: string;
};

type BetaUsageSnapshot = {
  petsUsed: number;
  petsLimit: number;
  petsRemaining: number;
  monthlyAnalysesUsed: number;
  monthlyAnalysesLimit: number;
  monthlyAnalysesRemaining: number;
  petsPercent: number;
  analysesPercent: number;
  statusLabel: string;
  statusDetail: string;
  customerNextStep: string;
  enforcementMode: "soft_warn_only";
};

const ACCOUNT_LOAD_ERROR_MESSAGE =
  "Δεν ήταν δυνατή η φόρτωση λογαριασμού. Δοκίμασε ξανά σε λίγο.";

function formatDate(value?: string) {
  if (!value) return "Δεν υπάρχει ανάλυση ακόμη";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Δεν υπάρχει ανάλυση ακόμη";

  return date.toLocaleDateString();
}

function hasReadyReport(pet: AccountPet) {
  const latest = pet.analysisHistory?.[0];
  return Boolean(getAnalysisFoodName(latest) && getAnalysisFeedingGrams(latest));
}

function getAnalysisFoodName(analysis?: AnalysisHistoryItem) {
  return analysis?.matchedFoodName ?? analysis?.matched_food_name ?? null;
}

function getAnalysisFeedingGrams(analysis?: AnalysisHistoryItem) {
  return analysis?.feedingGramsPerDay ?? analysis?.feeding_grams_per_day ?? null;
}

function getAnalysisFoodScore(analysis?: AnalysisHistoryItem) {
  return analysis?.foodScore ?? analysis?.food_score ?? null;
}

function getAnalysisWeightGoal(analysis?: AnalysisHistoryItem) {
  return analysis?.weightGoal ?? analysis?.weight_goal ?? null;
}

function formatDailyCalories(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "Θα εμφανιστούν μετά την επόμενη ανάλυση";
  }

  return `${Math.round(value)} kcal/ημέρα`;
}

function getWeightGoalCopy(value?: string | null) {
  const normalized = String(value ?? "").toLowerCase();

  if (normalized.includes("loss")) return "Απώλεια βάρους";
  if (normalized.includes("gain")) return "Αύξηση βάρους";
  if (normalized.includes("maintenance")) return "Διατήρηση βάρους";

  return "Τρέχον πλάνο";
}

function getPetLabel(pet: AccountPet) {
  const species =
    pet.species === "dog"
      ? " - σκύλος"
      : pet.species === "cat"
        ? " - γάτα"
        : "";
  const weight = pet.weight ? ` - ${pet.weight} kg` : "";
  return `${pet.name ?? "Κατοικίδιο"}${species}${weight}`;
}

function getNutritionPlanStatusCopy(score?: number | null) {
  if (typeof score !== "number") {
    return {
      label: "Έτοιμο για πρώτη καθοδήγηση",
      text: "Κάνε μια διατροφική ανάλυση για θερμίδες, λίστα τροφών και πρώτη εκτίμηση ποσότητας.",
    };
  }

  if (score >= 80) {
    return {
      label: "Πολύ καλή τελευταία επιλογή",
      text: "Το τελευταίο πλάνο φαίνεται καλό. Ξανατσέκαρέ το αν αλλάξει βάρος, όρεξη, κόπρανα, αλλεργίες ή τροφή.",
    };
  }

  if (score >= 60) {
    return {
      label: "Χρήσιμη τελευταία πρόταση",
      text: "Η τελευταία επιλογή τροφής είναι καλό σημείο εκκίνησης. Αν κάτι δεν πάει καλά, κάνε έλεγχο προόδου με νέο βάρος και γραμμάρια.",
    };
  }

  return {
    label: "Προτείνεται νέος έλεγχος",
    text: "Η τελευταία επιλογή θέλει επανέλεγχο. Χρησιμοποίησε ξανά τον σύμβουλο με ακριβές όνομα τροφής, φωτογραφία ετικέτας ή νεότερα στοιχεία.",
  };
}

function getFoodFitLabel(score?: number | null) {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return "Γενική καθοδήγηση";
  }

  if (score >= 80) return "Πολύ καλή επιλογή";
  if (score >= 60) return "Χρήσιμη επιλογή";
  if (score >= 40) return "Θέλει επανέλεγχο";
  return "Προτείνεται νέα ανάλυση";
}

function getAccountPlanSnapshot({
  latestPet,
  latestAnalysis,
}: {
  latestPet?: AccountPet;
  latestAnalysis?: AnalysisHistoryItem;
}): AccountPlanSnapshot | null {
  if (!latestPet || !latestAnalysis) return null;

  const foodName = getAnalysisFoodName(latestAnalysis);
  const feedingGrams = getAnalysisFeedingGrams(latestAnalysis);
  const foodScore = getAnalysisFoodScore(latestAnalysis);

  return {
    petName: latestPet.name ?? "Κατοικίδιο",
    weightGoal: getWeightGoalCopy(getAnalysisWeightGoal(latestAnalysis)),
    foodName: foodName ?? "Δεν έχει επιλεγεί ακόμη τροφή",
    dailyCalories: formatDailyCalories(latestAnalysis.mer),
    gramsPerDay: feedingGrams
      ? `${feedingGrams} γρ./ημέρα`
      : "Υπολογίζεται όταν επιλεγεί τροφή",
    foodFit: getFoodFitLabel(foodScore),
    progressHref: `/account/chatbot?petId=${latestPet.id}&mode=progress`,
    reportHref: `/print/pet-report/${latestPet.id}`,
    timelineHref: `/print/pet-timeline/${latestPet.id}`,
    alternativeHref: `/account/chatbot?petId=${latestPet.id}&mode=recommendation&reason=flavour`,
  };
}

function getAccountHomeBrief({
  latestPet,
  latestAnalysis,
}: {
  latestPet?: AccountPet;
  latestAnalysis?: AnalysisHistoryItem;
}): AccountHomeBrief | null {
  if (!latestPet || !latestAnalysis) return null;

  const foodName = getAnalysisFoodName(latestAnalysis);
  const feedingGrams = getAnalysisFeedingGrams(latestAnalysis);
  const mealSplit = feedingGrams
    ? {
        twoMeals: Math.round(feedingGrams / 2),
        threeMeals: Math.round(feedingGrams / 3),
      }
    : null;
  const treatCalories =
    typeof latestAnalysis.mer === "number" && Number.isFinite(latestAnalysis.mer)
      ? Math.round(latestAnalysis.mer * 0.1)
      : null;
  const mainFoodCalories =
    treatCalories !== null && typeof latestAnalysis.mer === "number"
      ? Math.max(0, latestAnalysis.mer - treatCalories)
      : null;
  const quantityDetail =
    feedingGrams && mealSplit
      ? `Πρακτικά: ${mealSplit.twoMeals}g x 2 γεύματα ή ${mealSplit.threeMeals}g x 3 γεύματα. Κράτα την ποσότητα σταθερή πριν κρίνεις το αποτέλεσμα.`
      : "\u039f\u03b9 \u03b8\u03b5\u03c1\u03bc\u03af\u03b4\u03b5\u03c2 \u03b5\u03af\u03bd\u03b1\u03b9 \u03ad\u03c4\u03bf\u03b9\u03bc\u03b5\u03c2, \u03b1\u03bb\u03bb\u03ac \u03bb\u03b5\u03af\u03c0\u03b5\u03b9 \u03c4\u03c1\u03bf\u03c6\u03ae \u03bc\u03b5 kcal/100g \u03b3\u03b9\u03b1 \u03b1\u03ba\u03c1\u03b9\u03b2\u03ae \u03b3\u03c1\u03b1\u03bc\u03bc\u03ac\u03c1\u03b9\u03b1.";

  return {
    title: "\u03a3\u03ae\u03bc\u03b5\u03c1\u03b1 \u03c3\u03c4\u03bf \u03c3\u03c0\u03af\u03c4\u03b9",
    subtitle:
      "\u0397 \u03c0\u03b9\u03bf \u03b1\u03c0\u03bb\u03ae \u03ad\u03ba\u03b4\u03bf\u03c3\u03b7 \u03c4\u03bf\u03c5 \u03c0\u03bb\u03ac\u03bd\u03bf\u03c5 \u03b3\u03b9\u03b1 \u03bd\u03b1 \u03bc\u03b7 \u03c7\u03b1\u03b8\u03b5\u03af \u03b7 \u03c0\u03c1\u03ac\u03be\u03b7.",
    reportHref: `/print/pet-report/${latestPet.id}`,
    progressHref: `/account/chatbot?petId=${latestPet.id}&mode=progress`,
    cards: [
      {
        label: "\u03a4\u03c1\u03bf\u03c6\u03ae",
        value:
          foodName ??
          "\u0394\u03b9\u03ac\u03bb\u03b5\u03be\u03b5 \u03c4\u03c1\u03bf\u03c6\u03ae",
        detail: foodName
          ? "\u0391\u03c5\u03c4\u03ae \u03b5\u03af\u03bd\u03b1\u03b9 \u03b7 \u03c4\u03c1\u03bf\u03c6\u03ae \u03c0\u03bf\u03c5 \u03ba\u03c1\u03b1\u03c4\u03ae\u03b8\u03b7\u03ba\u03b5 \u03b1\u03c0\u03cc \u03c4\u03b7\u03bd \u03c4\u03b5\u03bb\u03b5\u03c5\u03c4\u03b1\u03af\u03b1 \u03b1\u03bd\u03ac\u03bb\u03c5\u03c3\u03b7."
          : "\u0391\u03bd\u03bf\u03af\u03be\u03b5 \u03c4\u03bf chatbot \u03b3\u03b9\u03b1 \u03bd\u03b1 \u03ba\u03bb\u03b5\u03b9\u03b4\u03ce\u03c3\u03b5\u03b9 \u03bc\u03af\u03b1 \u03c3\u03c5\u03b3\u03ba\u03b5\u03ba\u03c1\u03b9\u03bc\u03ad\u03bd\u03b7 \u03b5\u03c0\u03b9\u03bb\u03bf\u03b3\u03ae.",
      },
      {
        label: "\u03a0\u03bf\u03c3\u03cc\u03c4\u03b7\u03c4\u03b1",
        value: feedingGrams
          ? `${feedingGrams}g/\u03b7\u03bc\u03ad\u03c1\u03b1`
          : formatDailyCalories(latestAnalysis.mer),
        detail: quantityDetail,
      },
      {
        label: "\u039b\u03b9\u03c7\u03bf\u03c5\u03b4\u03b9\u03ad\u03c2",
        value: treatCalories
          ? `\u03ad\u03c9\u03c2 ${treatCalories} kcal`
          : "\u03ad\u03c9\u03c2 10%",
        detail: mainFoodCalories
          ? `\u039a\u03c1\u03ac\u03c4\u03b1 \u03c0\u03b5\u03c1\u03af\u03c0\u03bf\u03c5 ${mainFoodCalories} kcal \u03b3\u03b9\u03b1 \u03c4\u03b7\u03bd \u03ba\u03cd\u03c1\u03b9\u03b1 \u03c4\u03c1\u03bf\u03c6\u03ae.`
          : "\u039c\u03b9\u03ba\u03c1\u03cc \u03bc\u03ad\u03c1\u03bf\u03c2 \u03c4\u03b7\u03c2 \u03b7\u03bc\u03ad\u03c1\u03b1\u03c2, \u03b3\u03b9\u03b1 \u03bd\u03b1 \u03bc\u03b7\u03bd \u03c7\u03b1\u03bb\u03ac\u03b5\u03b9 \u03bf \u03b8\u03b5\u03c1\u03bc\u03b9\u03b4\u03b9\u03ba\u03cc\u03c2 \u03c3\u03c4\u03cc\u03c7\u03bf\u03c2.",
      },
      {
        label: "\u0395\u03c0\u03b1\u03bd\u03ad\u03bb\u03b5\u03b3\u03c7\u03bf\u03c2",
        value: "2-4 \u03b5\u03b2\u03b4\u03bf\u03bc\u03ac\u03b4\u03b5\u03c2",
        detail:
          "\u0393\u03cd\u03c1\u03bd\u03b1 \u03bc\u03b5 \u03bd\u03ad\u03bf \u03b2\u03ac\u03c1\u03bf\u03c2, \u03c0\u03c1\u03b1\u03b3\u03bc\u03b1\u03c4\u03b9\u03ba\u03ac \u03b3\u03c1\u03b1\u03bc\u03bc\u03ac\u03c1\u03b9\u03b1, \u03bb\u03b9\u03c7\u03bf\u03c5\u03b4\u03b9\u03ad\u03c2 \u03ba\u03b1\u03b9 \u03b1\u03bd \u03c4\u03bf\u03c5 \u03b1\u03c1\u03ad\u03c3\u03b5\u03b9 \u03b1\u03ba\u03cc\u03bc\u03b7 \u03b7 \u03c4\u03c1\u03bf\u03c6\u03ae.",
      },
    ],
  };
}

function getAccountPlanWatchlist({
  latestPet,
  latestAnalysis,
}: {
  latestPet?: AccountPet;
  latestAnalysis?: AnalysisHistoryItem;
}): AccountPlanWatchItem[] {
  if (!latestPet || !latestAnalysis) return [];

  const weightGoal = String(getAnalysisWeightGoal(latestAnalysis) ?? "").toLowerCase();
  const species = latestPet.species;
  const foodName = getAnalysisFoodName(latestAnalysis);
  const feedingGrams = getAnalysisFeedingGrams(latestAnalysis);
  const items: AccountPlanWatchItem[] = [
    {
      label: "Βάρος",
      detail: weightGoal.includes("loss")
        ? "Ζύγισε κάθε 2-4 εβδομάδες. Θέλουμε σταδιακή πρόοδο, όχι απότομη πτώση."
        : weightGoal.includes("gain")
          ? "Παρακολούθησε αν ανεβαίνει σταδιακά χωρίς να χαλάει η όρεξη ή τα κόπρανα."
          : "Κράτα σταθερό ρυθμό ζυγίσματος για να δεις γρήγορα αν ξεφεύγει η τάση.",
    },
    {
      label: "Ποσότητα",
      detail: feedingGrams
        ? `Ξεκίνα από περίπου ${feedingGrams}g/ημέρα και σημείωσε αν έφαγε όλη την ποσότητα.`
        : "Μόλις επιλέξεις τροφή με θερμίδες, το NutriTail θα κρατήσει και γραμμάρια/ημέρα.",
    },
    {
      label: "Λιχουδιές",
      detail:
        "Σημείωσε πόσες δίνεις μέσα στη μέρα. Μικρές λιχουδιές μπορούν να αλλάξουν το αποτέλεσμα.",
    },
    {
      label: species === "cat" ? "Όρεξη / ούρηση" : "Όρεξη / κόπρανα",
      detail:
        species === "cat"
          ? "Για γάτα, κράτα σημείωση για όρεξη, νερό, τουαλέτα και αλλαγές στην ούρηση."
          : "Για σκύλο, κράτα σημείωση για όρεξη, ενέργεια, κόπρανα και αποδοχή της τροφής.",
    },
  ];

  if (foodName) {
    items.push({
      label: "Αποδοχή τροφής",
      detail:
        "Αν βαρεθεί γεύση ή εταιρεία, γύρνα στο chatbot για εναλλακτική χωρίς να ξεκινήσεις από την αρχή.",
    });
  }

  return items.slice(0, 5);
}

function getProgressDecisionLabel(value?: string | null) {
  const labels: Record<string, string> = {
    continue_plan: "Συνέχισε το πλάνο",
    adjust_portions: "Προσαρμογή ποσότητας",
    reduce_treats: "Μείωση λιχουδιών",
    review_food_fit: "Έλεγχος τροφής",
    needs_more_data: "Χρειάζονται στοιχεία",
  };

  return value ? labels[value] ?? value : "Έλεγχος προόδου";
}

function isCurrentMonthDate(value?: string | null) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function getBetaUsageSnapshot(pets: AccountPet[]): BetaUsageSnapshot {
  const monthlyAnalysesUsed = pets.reduce(
    (count, pet) =>
      count +
      (pet.analysisHistory ?? []).filter((analysis) =>
        isCurrentMonthDate(analysis.createdAt)
      ).length,
    0
  );
  const limitStatus = getBetaLimitStatus({
    petsUsed: pets.length,
    monthlyAnalysesUsed,
  });

  return {
    petsUsed: limitStatus.pets.used,
    petsLimit: limitStatus.pets.limit,
    petsRemaining: limitStatus.pets.remaining,
    monthlyAnalysesUsed: limitStatus.monthlyAnalyses.used,
    monthlyAnalysesLimit: limitStatus.monthlyAnalyses.limit,
    monthlyAnalysesRemaining: limitStatus.monthlyAnalyses.remaining,
    petsPercent: limitStatus.pets.percent,
    analysesPercent: limitStatus.monthlyAnalyses.percent,
    statusLabel: limitStatus.statusLabel,
    statusDetail: limitStatus.statusDetail,
    customerNextStep: limitStatus.customerNextStep,
    enforcementMode: limitStatus.enforcementMode,
  };
}

function getLatestProgressEntry(pets: AccountPet[]) {
  return pets
    .map((pet) => ({ pet, progress: pet.latestProgressLog }))
    .filter((entry) => Boolean(entry.progress?.created_at))
    .sort(
      (a, b) =>
        new Date(b.progress?.created_at ?? 0).getTime() -
        new Date(a.progress?.created_at ?? 0).getTime()
    )[0];
}

function getDashboardNextActions({
  pets,
  latestPet,
  latestAnalysis,
  latestProgressPet,
  nextPetToAnalyze,
}: {
  pets: AccountPet[];
  latestPet?: AccountPet;
  latestAnalysis?: AnalysisHistoryItem;
  latestProgressPet?: AccountPet;
  nextPetToAnalyze?: AccountPet;
}): DashboardNextAction[] {
  const primaryPet = latestProgressPet ?? latestPet;

  if (pets.length === 0) {
    return [
      {
        title: "Ξεκίνα με το πρώτο κατοικίδιο",
        detail: "Ο σύμβουλος θα φτιάξει προφίλ, θερμίδες και πρώτη λίστα τροφών.",
        href: "/account/chatbot",
        tone: "primary",
      },
      {
        title: "Δες πώς λειτουργεί",
        detail: "Μάθε τι κρατάει το NutriTail και γιατί οι προτάσεις βασίζονται σε δεδομένα.",
        href: "/account/profile",
        tone: "secondary",
      },
    ];
  }

  const actions: Array<DashboardNextAction | null> = [
    nextPetToAnalyze
      ? {
          title: `Κάνε ανάλυση για ${nextPetToAnalyze.name ?? "κατοικίδιο"}`,
          detail: "Δεν έχει ακόμη αποθηκευμένη αναφορά, οπότε αυτό είναι το πιο χρήσιμο επόμενο βήμα.",
          href: `/account/pets/${nextPetToAnalyze.id}`,
          tone: "primary",
        }
      : primaryPet
        ? {
            title: `Έλεγχος προόδου για ${primaryPet.name ?? "κατοικίδιο"}`,
            detail: "Δώσε τωρινό βάρος, γραμμάρια, λιχουδιές, όρεξη και κόπρανα.",
            href: `/account/chatbot?petId=${primaryPet.id}&mode=progress`,
            tone: "primary",
          }
        : null,
    latestPet && latestAnalysis
      ? {
          title: "Άνοιξε την τελευταία αναφορά",
          detail: getAnalysisFeedingGrams(latestAnalysis)
            ? "Δες θερμίδες, τροφή, γραμμάρια/ημέρα και πλάνο μετάβασης."
            : "Δες τη σύνοψη και συμπλήρωσε τροφή για πιο ακριβή ποσότητα.",
          href: `/print/pet-report/${latestPet.id}`,
          tone: "secondary",
        }
      : null,
    {
      title: "Νέα ανάλυση ή άλλη τροφή",
      detail: "Χρήσιμο αν άλλαξε βάρος, γεύση, εταιρεία, υγεία ή αποδοχή της τροφής.",
      href: latestPet ? `/account/chatbot?petId=${latestPet.id}` : "/account/chatbot",
      tone: "secondary",
    },
  ];

  const visibleActions: DashboardNextAction[] = actions.filter(
    (action): action is DashboardNextAction => Boolean(action)
  );

  return visibleActions.slice(0, 3);
}

function getAccountReadinessSteps({
  pets,
  totalAnalyses,
  readyReports,
  latestProgress,
  nextPetToAnalyze,
  latestPet,
  latestProgressPet,
}: {
  pets: AccountPet[];
  totalAnalyses: number;
  readyReports: number;
  latestProgress?: AccountPet["latestProgressLog"];
  nextPetToAnalyze?: AccountPet;
  latestPet?: AccountPet;
  latestProgressPet?: AccountPet;
}): AccountReadinessStep[] {
  const analysisTarget = nextPetToAnalyze ?? latestPet;
  const progressTarget = latestProgressPet ?? latestPet;

  return [
    {
      title: "Προφίλ κατοικιδίου",
      detail:
        pets.length > 0
          ? `${pets.length} αποθηκευμένα κατοικίδια`
          : "Ξεκίνα με ένα σκύλο ή μία γάτα για να χτιστεί το προφίλ.",
      isComplete: pets.length > 0,
      href: pets.length > 0 ? "/account/pets" : "/account/chatbot",
      actionLabel: pets.length > 0 ? "Δες κατοικίδια" : "Ξεκίνα",
    },
    {
      title: "Διατροφική ανάλυση",
      detail:
        totalAnalyses > 0
          ? `${totalAnalyses} αποθηκευμένες αναλύσεις`
          : "Υπολόγισε θερμίδες, στόχο και πρώτη λίστα τροφών.",
      isComplete: totalAnalyses > 0,
      href: analysisTarget
        ? `/account/chatbot?petId=${analysisTarget.id}`
        : "/account/chatbot",
      actionLabel: totalAnalyses > 0 ? "Νέα ανάλυση" : "Κάνε ανάλυση",
    },
    {
      title: "Πλάνο τροφής",
      detail:
        readyReports > 0
          ? `${readyReports} αναφορές με τροφή και ποσότητα`
          : "Διάλεξε τροφή για να κρατηθούν γραμμάρια/ημέρα και αναφορά.",
      isComplete: readyReports > 0,
      href: latestPet ? `/print/pet-report/${latestPet.id}` : "/account/chatbot",
      actionLabel: readyReports > 0 ? "Άνοιξε αναφορά" : "Διάλεξε τροφή",
    },
    {
      title: "Έλεγχος προόδου",
      detail: latestProgress
        ? "Υπάρχει πρόσφατος έλεγχος με βάρος, ποσότητα και απόφαση."
        : "Μετά από 2-4 εβδομάδες κάνε έλεγχο με νέο βάρος και γραμμάρια.",
      isComplete: Boolean(latestProgress),
      href: progressTarget
        ? `/account/chatbot?petId=${progressTarget.id}&mode=progress`
        : "/account/chatbot",
      actionLabel: latestProgress ? "Νέος έλεγχος" : "Έλεγχος προόδου",
    },
  ];
}

function getAccountActivityStrip({
  latestPet,
  latestAnalysis,
  latestProgressPet,
  latestProgress,
  nextPetToAnalyze,
}: {
  latestPet?: AccountPet;
  latestAnalysis?: AnalysisHistoryItem;
  latestProgressPet?: AccountPet;
  latestProgress?: AccountPet["latestProgressLog"];
  nextPetToAnalyze?: AccountPet;
}): AccountActivityStripItem[] {
  const latestProgressMetadata = latestProgress?.metadata;

  return [
    {
      label: "Τελευταία ανάλυση",
      value: latestPet?.name ?? "Δεν υπάρχει ακόμη",
      detail: latestAnalysis
        ? getAnalysisFoodName(latestAnalysis)
          ? `${formatDate(latestAnalysis.createdAt)} - ${getAnalysisFoodName(latestAnalysis)}`
          : `${formatDate(latestAnalysis.createdAt)} - χρειάζεται επιλογή τροφής`
        : "Ξεκίνα ανάλυση για να αποθηκευτούν θερμίδες, προτάσεις και αναφορά.",
      href: latestPet ? `/print/pet-report/${latestPet.id}` : "/account/chatbot",
      actionLabel: latestPet ? "Άνοιγμα αναφοράς" : "Ξεκίνα ανάλυση",
    },
    {
      label: "Τελευταίος έλεγχος",
      value: latestProgressPet?.name ?? "Δεν υπάρχει ακόμη",
      detail: latestProgress
        ? latestProgressMetadata?.progressDecisionHeadlineEl ??
          latestProgressMetadata?.progressDecisionHeadlineEn ??
          getProgressDecisionLabel(latestProgressMetadata?.progressDecisionStatus)
        : "Μετά από 2-4 εβδομάδες γύρνα με νέο βάρος, γραμμάρια και λιχουδιές.",
      href: latestProgressPet
        ? `/account/chatbot?petId=${latestProgressPet.id}&mode=progress`
        : latestPet
          ? `/account/chatbot?petId=${latestPet.id}&mode=progress`
          : "/account/chatbot",
      actionLabel: "Έλεγχος προόδου",
    },
    {
      label: "Επόμενο καλύτερο βήμα",
      value: nextPetToAnalyze?.name ?? latestPet?.name ?? "Πρώτο κατοικίδιο",
      detail: nextPetToAnalyze
        ? "Αυτό το κατοικίδιο δεν έχει ακόμη διατροφική ανάλυση."
        : latestPet
          ? "Αν άλλαξε βάρος, γεύση, μάρκα ή αποδοχή τροφής, ξεκίνα νέα ροή από εδώ."
          : "Δημιούργησε το πρώτο προφίλ για να ξεκινήσει η προσωποποιημένη εμπειρία.",
      href: nextPetToAnalyze
        ? `/account/chatbot?petId=${nextPetToAnalyze.id}`
        : latestPet
          ? `/account/chatbot?petId=${latestPet.id}`
          : "/account/chatbot",
      actionLabel: nextPetToAnalyze ? "Κάνε ανάλυση" : "Νέα πρόταση",
    },
  ];
}

function getAccountTodayTasks({
  pets,
  latestPet,
  latestAnalysis,
  latestProgressPet,
  nextPetToAnalyze,
}: {
  pets: AccountPet[];
  latestPet?: AccountPet;
  latestAnalysis?: AnalysisHistoryItem;
  latestProgressPet?: AccountPet;
  nextPetToAnalyze?: AccountPet;
}): AccountTodayTask[] {
  if (pets.length === 0) {
    return [
      {
        title: "Ξεκίνα με το πρώτο κατοικίδιο",
        detail:
          "Ο σύμβουλος θα σε ρωτήσει τα βασικά και θα φτιάξει την πρώτη διατροφική εικόνα.",
        href: "/account/chatbot",
        actionLabel: "Νέα ανάλυση",
        tone: "primary",
      },
      {
        title: "Μάθε πώς δουλεύει",
        detail:
          "Δες τι δεδομένα χρησιμοποιεί το NutriTail και γιατί οι προτάσεις βασίζονται σε κανόνες.",
        href: "/how-it-works",
        actionLabel: "Πώς λειτουργεί",
        tone: "calm",
      },
    ];
  }

  const reportTarget = latestPet;
  const progressTarget = latestProgressPet ?? latestPet;
  const recommendationTarget = latestPet ?? nextPetToAnalyze;

  const tasks: AccountTodayTask[] = [
    nextPetToAnalyze
      ? {
          title: `Ολοκλήρωσε ανάλυση για ${nextPetToAnalyze.name ?? "κατοικίδιο"}`,
          detail:
            "Αυτό το κατοικίδιο δεν έχει ακόμη αναφορά. Ξεκίνα από εδώ για θερμίδες, τροφές και ποσότητα.",
          href: `/account/chatbot?petId=${nextPetToAnalyze.id}`,
          actionLabel: "Κάνε ανάλυση",
          tone: "primary",
        }
      : {
          title: "Κάνε νέο έλεγχο ή νέα πρόταση",
          detail:
            "Χρήσιμο αν άλλαξε βάρος, γεύση, μάρκα, όρεξη, κόπρανα ή αποδοχή της τροφής.",
          href: recommendationTarget
            ? `/account/chatbot?petId=${recommendationTarget.id}`
            : "/account/chatbot",
          actionLabel: "Νέα πρόταση",
          tone: "primary",
        },
    {
      title: "Άνοιξε την τελευταία αναφορά",
      detail: getAnalysisFeedingGrams(latestAnalysis)
        ? "Δες θερμίδες, γραμμάρια/ημέρα, τροφή, λιχουδιές και πλάνο μετάβασης."
        : "Δες την τελευταία σύνοψη και συμπλήρωσε τροφή για πιο ακριβή γραμμάρια.",
      href: reportTarget ? `/print/pet-report/${reportTarget.id}` : "/account/chatbot",
      actionLabel: "Άνοιγμα αναφοράς",
      tone: "calm",
    },
    {
      title: "Έλεγχος προόδου",
      detail:
        "Γύρνα με νέο βάρος, γραμμάρια, λιχουδιές, όρεξη, κόπρανα και ενέργεια.",
      href: progressTarget
        ? `/account/chatbot?petId=${progressTarget.id}&mode=progress`
        : "/account/chatbot",
      actionLabel: "Έλεγχος προόδου",
      tone: "calm",
    },
    {
      title: "Αλλαγή γεύσης ή εταιρείας",
      detail:
        "Αν βαρέθηκε την τροφή ή δεν του ταιριάζει, ζήτησε εναλλακτική χωρίς να ξεκινήσεις από την αρχή.",
      href: recommendationTarget
        ? `/account/chatbot?petId=${recommendationTarget.id}&mode=recommendation&reason=flavour`
        : "/account/chatbot",
      actionLabel: "Βρες εναλλακτική",
      tone: "calm",
    },
  ];

  return tasks;
}

function getAccountNextBestMove({
  pets,
  latestPet,
  latestAnalysis,
  latestProgressPet,
  nextPetToAnalyze,
}: {
  pets: AccountPet[];
  latestPet?: AccountPet;
  latestAnalysis?: AnalysisHistoryItem;
  latestProgressPet?: AccountPet;
  nextPetToAnalyze?: AccountPet;
}): AccountNextBestMove {
  if (pets.length === 0) {
    return {
      eyebrow: "\u0395\u03c0\u03cc\u03bc\u03b5\u03bd\u03bf \u03ba\u03b1\u03bb\u03cd\u03c4\u03b5\u03c1\u03bf \u03b2\u03ae\u03bc\u03b1",
      title:
        "\u03a6\u03c4\u03b9\u03ac\u03be\u03b5 \u03c4\u03b7\u03bd \u03c0\u03c1\u03ce\u03c4\u03b7 \u03b1\u03bd\u03ac\u03bb\u03c5\u03c3\u03b7 \u03b3\u03b9\u03b1 \u03c4\u03bf \u03ba\u03b1\u03c4\u03bf\u03b9\u03ba\u03af\u03b4\u03b9\u03bf \u03c3\u03bf\u03c5",
      detail:
        "\u039f \u03c3\u03cd\u03bc\u03b2\u03bf\u03c5\u03bb\u03bf\u03c2 \u03b8\u03b1 \u03c1\u03c9\u03c4\u03ae\u03c3\u03b5\u03b9 \u03c4\u03b1 \u03b1\u03c0\u03b1\u03c1\u03b1\u03af\u03c4\u03b7\u03c4\u03b1 \u03ba\u03b1\u03b9 \u03b8\u03b1 \u03b2\u03b3\u03ac\u03bb\u03b5\u03b9 \u03b8\u03b5\u03c1\u03bc\u03af\u03b4\u03b5\u03c2, \u03c4\u03c1\u03bf\u03c6\u03ad\u03c2 \u03ba\u03b1\u03b9 \u03c0\u03bf\u03c3\u03cc\u03c4\u03b7\u03c4\u03b1.",
      helper:
        "\u0398\u03ad\u03bb\u03b5\u03b9 2-3 \u03bb\u03b5\u03c0\u03c4\u03ac \u03ba\u03b1\u03b9 \u03bc\u03b5\u03c4\u03ac \u03b8\u03b1 \u03ad\u03c7\u03b5\u03b9\u03c2 \u03b1\u03c0\u03bf\u03b8\u03b7\u03ba\u03b5\u03c5\u03bc\u03ad\u03bd\u03bf \u03c0\u03bb\u03ac\u03bd\u03bf.",
      actions: [
        {
          label: "\u039e\u03b5\u03ba\u03af\u03bd\u03b1 \u03b1\u03bd\u03ac\u03bb\u03c5\u03c3\u03b7",
          href: "/account/chatbot",
          tone: "primary",
        },
        {
          label: "\u0394\u03b5\u03c2 \u03c0\u03ce\u03c2 \u03bb\u03b5\u03b9\u03c4\u03bf\u03c5\u03c1\u03b3\u03b5\u03af",
          href: "/how-it-works",
          tone: "secondary",
        },
      ],
    };
  }

  if (nextPetToAnalyze) {
    return {
      eyebrow: "\u039b\u03b5\u03af\u03c0\u03b5\u03b9 \u03b1\u03bd\u03ac\u03bb\u03c5\u03c3\u03b7",
      title: `${
        nextPetToAnalyze.name ?? "\u03a4\u03bf \u03ba\u03b1\u03c4\u03bf\u03b9\u03ba\u03af\u03b4\u03b9\u03bf"
      } \u03b4\u03b5\u03bd \u03ad\u03c7\u03b5\u03b9 \u03b1\u03ba\u03cc\u03bc\u03b7 \u03c0\u03bb\u03ac\u03bd\u03bf`,
      detail:
        "\u039f\u03bb\u03bf\u03ba\u03bb\u03ae\u03c1\u03c9\u03c3\u03b5 \u03c0\u03c1\u03ce\u03c4\u03b1 \u03b1\u03c5\u03c4\u03ae \u03c4\u03b7\u03bd \u03b1\u03bd\u03ac\u03bb\u03c5\u03c3\u03b7 \u03ce\u03c3\u03c4\u03b5 \u03bd\u03b1 \u03c5\u03c0\u03ac\u03c1\u03c7\u03b5\u03b9 \u03c3\u03b1\u03c6\u03ae\u03c2 \u03c3\u03c4\u03cc\u03c7\u03bf\u03c2, \u03c0\u03c1\u03cc\u03c4\u03b1\u03c3\u03b7 \u03c4\u03c1\u03bf\u03c6\u03ae\u03c2 \u03ba\u03b1\u03b9 \u03b1\u03bd\u03b1\u03c6\u03bf\u03c1\u03ac.",
      helper:
        "\u0391\u03bd \u03ad\u03c7\u03b5\u03b9\u03c2 \u03c6\u03c9\u03c4\u03bf\u03b3\u03c1\u03b1\u03c6\u03af\u03b1 \u03b5\u03c4\u03b9\u03ba\u03ad\u03c4\u03b1\u03c2 \u03ae \u03c4\u03c9\u03c1\u03b9\u03bd\u03ae \u03c4\u03c1\u03bf\u03c6\u03ae, \u03bc\u03c0\u03bf\u03c1\u03b5\u03af\u03c2 \u03bd\u03b1 \u03c4\u03b7 \u03b3\u03c1\u03ac\u03c8\u03b5\u03b9\u03c2 \u03c3\u03c4\u03bf chat.",
      actions: [
        {
          label: "\u039a\u03ac\u03bd\u03b5 \u03b1\u03bd\u03ac\u03bb\u03c5\u03c3\u03b7",
          href: `/account/chatbot?petId=${nextPetToAnalyze.id}`,
          tone: "primary",
        },
        {
          label: "\u0394\u03b5\u03c2 \u03ba\u03b1\u03c4\u03bf\u03b9\u03ba\u03af\u03b4\u03b9\u03b1",
          href: "/account/pets",
          tone: "secondary",
        },
      ],
    };
  }

  const activePet = latestProgressPet ?? latestPet;
  const hasFoodPlan = Boolean(
    latestAnalysis &&
      getAnalysisFoodName(latestAnalysis) &&
      getAnalysisFeedingGrams(latestAnalysis)
  );

  if (activePet && hasFoodPlan) {
    return {
      eyebrow: "\u03a3\u03c5\u03bd\u03ad\u03c7\u03b9\u03c3\u03b5 \u03c7\u03c9\u03c1\u03af\u03c2 \u03bd\u03b1 \u03be\u03b5\u03ba\u03b9\u03bd\u03ae\u03c3\u03b5\u03b9\u03c2 \u03b1\u03c0\u03cc \u03c4\u03b7\u03bd \u03b1\u03c1\u03c7\u03ae",
      title: `\u03a4\u03bf \u03c0\u03bb\u03ac\u03bd\u03bf \u03b3\u03b9\u03b1 ${
        activePet.name ?? "\u03c4\u03bf \u03ba\u03b1\u03c4\u03bf\u03b9\u03ba\u03af\u03b4\u03b9\u03bf"
      } \u03b5\u03af\u03bd\u03b1\u03b9 \u03ad\u03c4\u03bf\u03b9\u03bc\u03bf`,
      detail:
        "\u0394\u03b5\u03c2 \u03c4\u03b7\u03bd \u03b1\u03bd\u03b1\u03c6\u03bf\u03c1\u03ac, \u03ba\u03ac\u03bd\u03b5 \u03ad\u03bb\u03b5\u03b3\u03c7\u03bf \u03c0\u03c1\u03bf\u03cc\u03b4\u03bf\u03c5 \u03ae \u03b6\u03ae\u03c4\u03b7\u03c3\u03b5 \u03bd\u03ad\u03b1 \u03b3\u03b5\u03cd\u03c3\u03b7/\u03bc\u03ac\u03c1\u03ba\u03b1 \u03bc\u03b5 \u03c4\u03bf \u03af\u03b4\u03b9\u03bf \u03b9\u03c3\u03c4\u03bf\u03c1\u03b9\u03ba\u03cc.",
      helper:
        "\u0393\u03b9\u03b1 \u03ba\u03b1\u03bb\u03cd\u03c4\u03b5\u03c1\u03bf \u03ad\u03bb\u03b5\u03b3\u03c7\u03bf, \u03ba\u03c1\u03ac\u03c4\u03b1 \u03bd\u03ad\u03bf \u03b2\u03ac\u03c1\u03bf\u03c2, \u03b3\u03c1\u03b1\u03bc\u03bc\u03ac\u03c1\u03b9\u03b1/\u03b7\u03bc\u03ad\u03c1\u03b1, \u03bb\u03b9\u03c7\u03bf\u03c5\u03b4\u03b9\u03ad\u03c2 \u03ba\u03b1\u03b9 \u03b1\u03bd \u03c4\u03bf\u03c5 \u03b1\u03c1\u03ad\u03c3\u03b5\u03b9 \u03b7 \u03c4\u03c1\u03bf\u03c6\u03ae.",
      actions: [
        {
          label: "\u0394\u03b5\u03c2 \u03b1\u03bd\u03b1\u03c6\u03bf\u03c1\u03ac",
          href: `/print/pet-report/${activePet.id}`,
          tone: "primary",
        },
        {
          label: "\u0388\u03bb\u03b5\u03b3\u03c7\u03bf\u03c2 \u03c0\u03c1\u03bf\u03cc\u03b4\u03bf\u03c5",
          href: `/account/chatbot?petId=${activePet.id}&mode=progress`,
          tone: "secondary",
        },
        {
          label: "\u0386\u03bb\u03bb\u03b7 \u03b3\u03b5\u03cd\u03c3\u03b7/\u03bc\u03ac\u03c1\u03ba\u03b1",
          href: `/account/chatbot?petId=${activePet.id}&mode=recommendation&reason=flavour`,
          tone: "secondary",
        },
      ],
    };
  }

  const fallbackPet = activePet ?? latestPet;

  return {
    eyebrow: "\u03a7\u03c1\u03b5\u03b9\u03ac\u03b6\u03b5\u03c4\u03b1\u03b9 \u03c4\u03b5\u03bb\u03b9\u03ba\u03ae \u03b5\u03c0\u03b9\u03bb\u03bf\u03b3\u03ae",
    title:
      "\u039a\u03bb\u03b5\u03af\u03b4\u03c9\u03c3\u03b5 \u03c4\u03c1\u03bf\u03c6\u03ae \u03b3\u03b9\u03b1 \u03bd\u03b1 \u03b2\u03b3\u03bf\u03c5\u03bd \u03c0\u03c1\u03b1\u03ba\u03c4\u03b9\u03ba\u03ac \u03b3\u03c1\u03b1\u03bc\u03bc\u03ac\u03c1\u03b9\u03b1",
    detail:
      "\u0397 \u03b1\u03bd\u03ac\u03bb\u03c5\u03c3\u03b7 \u03ad\u03c7\u03b5\u03b9 \u03b2\u03ac\u03c3\u03b7, \u03b1\u03bb\u03bb\u03ac \u03b7 \u03c4\u03b5\u03bb\u03b9\u03ba\u03ae \u03c0\u03bf\u03c3\u03cc\u03c4\u03b7\u03c4\u03b1 \u03b8\u03ad\u03bb\u03b5\u03b9 \u03c3\u03c5\u03b3\u03ba\u03b5\u03ba\u03c1\u03b9\u03bc\u03ad\u03bd\u03b7 \u03c4\u03c1\u03bf\u03c6\u03ae \u03bc\u03b5 kcal/100g.",
    helper:
      "\u039c\u03c0\u03bf\u03c1\u03b5\u03af\u03c2 \u03bd\u03b1 \u03b6\u03b7\u03c4\u03ae\u03c3\u03b5\u03b9\u03c2 \u03bd\u03ad\u03b1 \u03c0\u03c1\u03cc\u03c4\u03b1\u03c3\u03b7 \u03ae \u03bd\u03b1 \u03b3\u03c1\u03ac\u03c8\u03b5\u03b9\u03c2 \u03c4\u03b7\u03bd \u03b1\u03ba\u03c1\u03b9\u03b2\u03ae \u03c4\u03c1\u03bf\u03c6\u03ae \u03c0\u03bf\u03c5 \u03ad\u03c7\u03b5\u03b9\u03c2.",
    actions: [
      {
        label: "\u0392\u03c1\u03b5\u03c2 \u03c4\u03c1\u03bf\u03c6\u03ae",
        href: fallbackPet
          ? `/account/chatbot?petId=${fallbackPet.id}&mode=recommendation`
          : "/account/chatbot",
        tone: "primary",
      },
      {
        label: "\u0394\u03b5\u03c2 \u03c3\u03cd\u03bd\u03bf\u03c8\u03b7",
        href: fallbackPet ? `/print/pet-report/${fallbackPet.id}` : "/account/chatbot",
        tone: "secondary",
      },
    ],
  };
}

export default function AccountPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pets, setPets] = useState<AccountPet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAccount() {
      try {
        setError("");
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();

        if (!data.session?.user) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        const response = await fetch("/api/account/me", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authUserId: data.session.user.id,
            email: data.session.user.email,
            fullName:
              data.session.user.user_metadata?.full_name ||
              data.session.user.email ||
              "Πελάτης",
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error(result.error);
          throw new Error(ACCOUNT_LOAD_ERROR_MESSAGE);
        }

        setCustomer(result as Customer);

        const petsResponse = await fetch("/api/account/pets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authUserId: data.session.user.id,
          }),
        });

        const petsResult = await petsResponse.json();

        if (petsResponse.ok) {
          setPets((petsResult.pets ?? []) as AccountPet[]);
        }
      } catch (error) {
        console.error(error);
        setError(
          error instanceof Error
            ? error.message
            : ACCOUNT_LOAD_ERROR_MESSAGE
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadAccount();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-black">
            Φορτώνουμε τον λογαριασμό...
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Ετοιμάζουμε το προφίλ, τα αποθηκευμένα κατοικίδια και τη σύνοψη
            αναλύσεων.
          </p>
        </div>
      </section>
    );
  }

  if (!customer) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          {error || "Δεν ήταν δυνατή η φόρτωση λογαριασμού."}
        </div>
      </section>
    );
  }

  const totalAnalyses = pets.reduce(
    (count, pet) => count + (pet.analysisHistory?.length ?? 0),
    0
  );
  const petsNeedingAnalysis = pets.filter(
    (pet) => (pet.analysisHistory?.length ?? 0) === 0
  );
  const petsNeedingAnalysisCount = petsNeedingAnalysis.length;
  const readyReports = pets.filter(hasReadyReport).length;
  const profileProgress =
    pets.length === 0 ? 0 : Math.round((readyReports / pets.length) * 100);
  const latestAnalysisEntry = pets
    .flatMap((pet) =>
      (pet.analysisHistory ?? []).map((analysis) => ({ analysis, pet }))
    )
    .sort(
      (a, b) =>
        new Date(b.analysis.createdAt).getTime() -
        new Date(a.analysis.createdAt).getTime()
    )[0];
  const latestAnalysis = latestAnalysisEntry?.analysis;
  const latestPet = latestAnalysisEntry?.pet;
  const latestProgressEntry = getLatestProgressEntry(pets);
  const latestProgressPet = latestProgressEntry?.pet;
  const latestProgress = latestProgressEntry?.progress;
  const latestProgressMetadata = latestProgress?.metadata;
  const nextPetToAnalyze = petsNeedingAnalysis[0];
  const planStatusCopy = getNutritionPlanStatusCopy(
    getAnalysisFoodScore(latestAnalysis)
  );
  const accountPlanSnapshot = getAccountPlanSnapshot({
    latestPet,
    latestAnalysis,
  });
  const accountHomeBrief = getAccountHomeBrief({
    latestPet,
    latestAnalysis,
  });
  const accountPlanWatchlist = getAccountPlanWatchlist({
    latestPet,
    latestAnalysis,
  });
  const dashboardNextActions = getDashboardNextActions({
    pets,
    latestPet,
    latestAnalysis,
    latestProgressPet,
    nextPetToAnalyze,
  });
  const accountTodayTasks = getAccountTodayTasks({
    pets,
    latestPet,
    latestAnalysis,
    latestProgressPet,
    nextPetToAnalyze,
  });
  const accountNextBestMove = getAccountNextBestMove({
    pets,
    latestPet,
    latestAnalysis,
    latestProgressPet,
    nextPetToAnalyze,
  });
  const accountActivityStrip = getAccountActivityStrip({
    latestPet,
    latestAnalysis,
    latestProgressPet,
    latestProgress,
    nextPetToAnalyze,
  });
  const betaUsage = getBetaUsageSnapshot(pets);
  const readinessSteps = getAccountReadinessSteps({
    pets,
    totalAnalyses,
    readyReports,
    latestProgress,
    nextPetToAnalyze,
    latestPet,
    latestProgressPet,
  });
  const completedReadinessSteps = readinessSteps.filter(
    (step) => step.isComplete
  ).length;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">
              Καλώς ήρθες, {customer.fullName}
            </h1>
            <p className="mt-2 max-w-3xl text-gray-600">
              Ο προσωπικός σου πίνακας NutriTail AI για διατροφική καθοδήγηση,
              αποθηκευμένα κατοικίδια, αναφορές και επόμενα βήματα.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-gray-700">
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {profileProgress}% κάλυψη αναφορών
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {readyReports} έτοιμες αναφορές
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {petsNeedingAnalysisCount} θέλουν ανάλυση
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Link
              href="/account/chatbot"
              className="rounded-xl bg-black px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Νέα διατροφική ανάλυση
            </Link>
            <Link
              href="/account/pets"
              className="rounded-xl border border-gray-300 px-5 py-3 text-center text-sm font-medium text-black transition hover:bg-gray-100"
            >
              Δες τα κατοικίδια
            </Link>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl border border-black bg-black p-6 text-white shadow-sm"
        data-testid="account-next-best-move"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
              {accountNextBestMove.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              {accountNextBestMove.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-200">
              {accountNextBestMove.detail}
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              {accountNextBestMove.helper}
            </p>
          </div>

          <div className="flex min-w-full flex-col gap-2 sm:min-w-64">
            {accountNextBestMove.actions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                  action.tone === "primary"
                    ? "bg-white text-black hover:bg-gray-100"
                    : "border border-white/30 text-white hover:bg-white/10"
                }`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm"
        data-testid="account-today-command-center"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Σήμερα στο NutriTail
            </p>
            <h2 className="mt-1 text-2xl font-bold text-emerald-950">
              Οι πιο χρήσιμες κινήσεις για τον λογαριασμό σου
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-emerald-900">
            Από εδώ συνεχίζεις γρήγορα: νέα ανάλυση, αναφορά, έλεγχο προόδου ή
            αλλαγή τροφής χωρίς να ψάχνεις σε όλες τις σελίδες.
          </p>
        </div>

        <div
          data-testid="account-next-action-guide"
          className="mt-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-3"
        >
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 text-emerald-950">
            <p className="font-semibold">
              {"\u0391\u03bd \u03b8\u03ad\u03bb\u03b5\u03b9\u03c2 \u03bd\u03b1 \u03b4\u03b5\u03b9\u03c2 \u03c4\u03bf \u03c0\u03bb\u03ac\u03bd\u03bf"}
            </p>
            <p className="mt-1 leading-5 text-emerald-800">
              {"Άνοιξε την αναφορά για θερμίδες, τροφή, γραμμάρια και πλάνο αλλαγής τροφής."}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white p-4 text-amber-950">
            <p className="font-semibold">
              {"\u0391\u03bd \u03c0\u03ad\u03c1\u03b1\u03c3\u03b1\u03bd 2-4 \u03b5\u03b2\u03b4\u03bf\u03bc\u03ac\u03b4\u03b5\u03c2"}
            </p>
            <p className="mt-1 leading-5 text-amber-800">
              {"\u039a\u03ac\u03bd\u03b5 \u03ad\u03bb\u03b5\u03b3\u03c7\u03bf \u03c0\u03c1\u03bf\u03cc\u03b4\u03bf\u03c5 \u03bc\u03b5 \u03bd\u03ad\u03bf \u03b2\u03ac\u03c1\u03bf\u03c2, \u03c0\u03c1\u03b1\u03b3\u03bc\u03b1\u03c4\u03b9\u03ba\u03ac \u03b3\u03c1\u03b1\u03bc\u03bc\u03ac\u03c1\u03b9\u03b1 \u03ba\u03b1\u03b9 \u03bb\u03b9\u03c7\u03bf\u03c5\u03b4\u03b9\u03ad\u03c2."}
            </p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-4 text-violet-950">
            <p className="font-semibold">
              {"\u0391\u03bd \u03b8\u03ad\u03bb\u03b5\u03b9\u03c2 \u03ac\u03bb\u03bb\u03b7 \u03b3\u03b5\u03cd\u03c3\u03b7 \u03ae \u03b5\u03c4\u03b1\u03b9\u03c1\u03b5\u03af\u03b1"}
            </p>
            <p className="mt-1 leading-5 text-violet-800">
              {"\u0396\u03ae\u03c4\u03b7\u03c3\u03b5 \u03bd\u03ad\u03b1 \u03c0\u03c1\u03cc\u03c4\u03b1\u03c3\u03b7 \u03ba\u03c1\u03b1\u03c4\u03ce\u03bd\u03c4\u03b1\u03c2 \u03c4\u03bf \u03af\u03b4\u03b9\u03bf \u03ba\u03b1\u03c4\u03bf\u03b9\u03ba\u03af\u03b4\u03b9\u03bf, \u03c3\u03c4\u03cc\u03c7\u03bf \u03ba\u03b1\u03b9 \u03b9\u03c3\u03c4\u03bf\u03c1\u03b9\u03ba\u03cc."}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {accountTodayTasks.map((task) => (
            <Link
              key={task.title}
              href={task.href}
              className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
                task.tone === "primary"
                  ? "border-emerald-950 bg-emerald-950 text-white"
                  : "border-emerald-100 bg-white text-emerald-950 hover:border-emerald-400"
              }`}
            >
              <p className="font-semibold">{task.title}</p>
              <p
                className={`mt-2 text-sm leading-6 ${
                  task.tone === "primary" ? "text-emerald-50" : "text-emerald-900"
                }`}
              >
                {task.detail}
              </p>
              <p
                className={`mt-4 text-sm font-semibold ${
                  task.tone === "primary" ? "text-white" : "text-emerald-950"
                }`}
              >
                {task.actionLabel}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm"
        data-testid="account-latest-activity-strip"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Συνέχισε από εκεί που έμεινες
            </p>
            <h2 className="mt-1 text-2xl font-bold text-blue-950">
              Η τελευταία εικόνα του λογαριασμού σου
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-blue-900">
            Εδώ βλέπεις γρήγορα την τελευταία ανάλυση, τον τελευταίο έλεγχο
            προόδου και το πιο χρήσιμο επόμενο βήμα.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {accountActivityStrip.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-xl border border-blue-100 bg-white p-4 text-blue-950 transition hover:border-blue-400 hover:bg-blue-100"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                {item.label}
              </p>
              <p className="mt-2 font-bold">{item.value}</p>
              <p className="mt-1 text-sm leading-5 text-blue-900">
                {item.detail}
              </p>
              <p className="mt-3 text-sm font-semibold text-blue-950">
                {item.actionLabel}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {accountHomeBrief && (
        <div
          className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm"
          data-testid="account-home-brief"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                {accountHomeBrief.title}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-black">
                {accountHomeBrief.subtitle}
              </h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={accountHomeBrief.reportHref}
                className="rounded-xl bg-emerald-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Πλήρης αναφορά
              </Link>
              <Link
                href={accountHomeBrief.progressHref}
                className="rounded-xl border border-emerald-300 px-4 py-3 text-center text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50"
              >
                Έλεγχος προόδου
              </Link>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            {accountHomeBrief.cards.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {item.label}
                </p>
                <p className="mt-2 font-bold text-emerald-950">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-emerald-900">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {accountPlanSnapshot && (
        <div
          className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm"
          data-testid="account-plan-snapshot"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                Σημερινό πλάνο
              </p>
              <h2 className="mt-2 text-2xl font-bold text-black">
                {accountPlanSnapshot.petName}
              </h2>
              <p className="mt-1 text-sm font-medium text-teal-800">
                {accountPlanSnapshot.weightGoal}
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-700">
                Η πιο πρόσφατη αποθηκευμένη οδηγία σου συγκεντρωμένη σε ένα
                σημείο, για να ξέρεις τι ταΐζεις και πότε χρειάζεται έλεγχος.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Link
                href={accountPlanSnapshot.progressHref}
                className="rounded-xl bg-black px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Έλεγχος προόδου
              </Link>
              <Link
                href={accountPlanSnapshot.reportHref}
                className="rounded-xl border border-teal-300 px-4 py-2 text-center text-sm font-medium text-teal-900 transition hover:bg-teal-50"
              >
                Άνοιγμα αναφοράς
              </Link>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                Τροφή
              </p>
              <p className="mt-2 font-semibold text-teal-950">
                {accountPlanSnapshot.foodName}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Θερμίδες
              </p>
              <p className="mt-2 font-semibold text-gray-950">
                {accountPlanSnapshot.dailyCalories}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Γραμμάρια/ημέρα
              </p>
              <p className="mt-2 font-semibold text-gray-950">
                {accountPlanSnapshot.gramsPerDay}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Κατάσταση
              </p>
              <p className="mt-2 font-semibold text-gray-950">
                {accountPlanSnapshot.foodFit}
              </p>
            </div>
          </div>

          {accountPlanWatchlist.length > 0 && (
            <div
              data-testid="account-plan-watchlist"
              className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Μέχρι τον επόμενο έλεγχο
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-emerald-950">
                    Τι αξίζει να παρακολουθείς
                  </h3>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-emerald-900">
                  Κράτα αυτές τις μικρές σημειώσεις. Θα βοηθήσουν τον επόμενο
                  έλεγχο προόδου να δώσει πιο σωστή απόφαση.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                {accountPlanWatchlist.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-emerald-100 bg-white p-3"
                  >
                    <p className="text-sm font-semibold text-emerald-950">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-emerald-900">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            data-testid="account-progress-check-reminder"
            className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Επόμενος έλεγχος
                </p>
                <h3 className="mt-1 text-lg font-bold text-amber-950">
                  Σε 2-4 εβδομάδες κάνε έλεγχο προόδου
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
                  Φέρε νέο βάρος, πραγματικά γραμμάρια/ημέρα, λιχουδιές,
                  όρεξη, κόπρανα ή ούρηση, ενέργεια και αν του αρέσει ακόμη η
                  τροφή. Έτσι η επόμενη πρόταση δεν ξεκινά από το μηδέν.
                </p>
              </div>
              <Link
                href={accountPlanSnapshot.progressHref}
                className="rounded-xl bg-amber-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-amber-800"
              >
                Άνοιγμα ελέγχου προόδου
              </Link>
            </div>
          </div>

          <div
            data-testid="account-plan-decision-guide"
            className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Αν κάτι αλλάξει
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-950">
                  Διάλεξε την επόμενη κίνηση χωρίς να ξεκινήσεις από την αρχή
                </h3>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-700">
                Το ίδιο κατοικίδιο μπορεί να συνεχίσει με έλεγχο προόδου, νέα
                πρόταση ή αλλαγή γεύσης/εταιρείας, κρατώντας το ιστορικό του.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <Link
                href={accountPlanSnapshot.reportHref}
                className="rounded-xl border border-emerald-100 bg-white p-4 text-emerald-950 transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <p className="font-semibold">Πάει καλά</p>
                <p className="mt-1 text-sm leading-5 text-emerald-800">
                  Κράτα την ίδια ποσότητα, δες την αναφορά και έλεγξε ξανά σε
                  2-4 εβδομάδες.
                </p>
              </Link>
              <Link
                href={accountPlanSnapshot.progressHref}
                className="rounded-xl border border-amber-100 bg-white p-4 text-amber-950 transition hover:border-amber-300 hover:bg-amber-50"
              >
                <p className="font-semibold">Δεν βλέπω αλλαγή</p>
                <p className="mt-1 text-sm leading-5 text-amber-800">
                  Φέρε νέο βάρος, πραγματικά γραμμάρια/ημέρα και λιχουδιές για
                  να ελέγξουμε αν θέλει προσαρμογή.
                </p>
              </Link>
              <Link
                href={accountPlanSnapshot.alternativeHref}
                className="rounded-xl border border-violet-100 bg-white p-4 text-violet-950 transition hover:border-violet-300 hover:bg-violet-50"
              >
                <p className="font-semibold">Δεν του ταιριάζει η τροφή</p>
                <p className="mt-1 text-sm leading-5 text-violet-800">
                  Ζήτησε άλλη γεύση ή εταιρεία χωρίς να χαθούν βάρος, στόχος και
                  προηγούμενη ανάλυση.
                </p>
              </Link>
            </div>
          </div>

          <div
            data-testid="account-plan-next-steps"
            className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2 xl:grid-cols-4"
          >
            <Link
              href={accountPlanSnapshot.reportHref}
              className="rounded-xl border border-teal-100 bg-teal-50 p-4 text-teal-950 transition hover:border-teal-300 hover:bg-teal-100"
            >
              <p className="font-semibold">1. Δες την αναφορά</p>
              <p className="mt-1 leading-5 text-teal-800">
                Κράτα σε ένα σημείο θερμίδες, τροφή, ποσότητα και οδηγίες μετάβασης.
              </p>
            </Link>
            <Link
              href={accountPlanSnapshot.timelineHref}
              className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-950 transition hover:border-blue-300 hover:bg-blue-100"
            >
              <p className="font-semibold">2. Παρακολούθησε την πορεία</p>
              <p className="mt-1 leading-5 text-blue-800">
                Το ιστορικό δείχνει αναλύσεις, αλλαγές τροφής και ελέγχους προόδου.
              </p>
            </Link>
            <Link
              href={accountPlanSnapshot.progressHref}
              className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-amber-950 transition hover:border-amber-300 hover:bg-amber-100"
            >
              <p className="font-semibold">3. Κάνε έλεγχο προόδου</p>
              <p className="mt-1 leading-5 text-amber-800">
                Σε 2-4 εβδομάδες γύρνα με νέο βάρος, γραμμάρια/ημέρα και λιχουδιές.
              </p>
            </Link>
            <Link
              href={accountPlanSnapshot.alternativeHref}
              className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-violet-950 transition hover:border-violet-300 hover:bg-violet-100"
            >
              <p className="font-semibold">4. Άλλαξε γεύση ή εταιρεία</p>
              <p className="mt-1 leading-5 text-violet-800">
                Αν βαρέθηκε την τροφή ή δεν του ταιριάζει, κράτα το ίδιο προφίλ και ζήτησε νέα πρόταση.
              </p>
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link
              href={accountPlanSnapshot.timelineHref}
              className="rounded-full bg-teal-50 px-4 py-2 font-medium text-teal-900 transition hover:bg-teal-100"
            >
              Δες ιστορικό
            </Link>
            <Link
              href={accountPlanSnapshot.progressHref}
              className="rounded-full bg-gray-100 px-4 py-2 font-medium text-gray-900 transition hover:bg-gray-200"
            >
              Σε 2-4 εβδομάδες έλεγξε βάρος, όρεξη και κόπρανα
            </Link>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Η πορεία σου
            </p>
            <h2 className="mt-1 text-2xl font-bold text-black">
              {completedReadinessSteps}/4 βασικά βήματα έτοιμα
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Έτσι βλέπεις γρήγορα αν ο λογαριασμός έχει προφίλ, ανάλυση,
              πλάνο τροφής και επόμενο έλεγχο προόδου.
            </p>
          </div>
          <div className="w-full max-w-sm">
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-black transition-all"
                style={{
                  width: `${Math.round(
                    (completedReadinessSteps / readinessSteps.length) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="mt-2 text-right text-xs font-medium text-gray-500">
              {Math.round((completedReadinessSteps / readinessSteps.length) * 100)}
              % ολοκλήρωση λογαριασμού
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          {readinessSteps.map((step, index) => (
            <Link
              key={step.title}
              href={step.href}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-black hover:bg-white"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    step.isComplete
                      ? "bg-black text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  {step.isComplete ? "✓" : index + 1}
                </span>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    step.isComplete
                      ? "bg-green-100 text-green-800"
                      : "bg-white text-gray-600"
                  }`}
                >
                  {step.isComplete ? "Έτοιμο" : "Επόμενο"}
                </span>
              </div>
              <h3 className="mt-4 font-semibold text-black">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {step.detail}
              </p>
              <p className="mt-3 text-sm font-semibold text-black">
                {step.actionLabel}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Σήμερα μπορείς να κάνεις
            </p>
            <h2 className="mt-1 text-2xl font-bold text-black">
              Τα πιο χρήσιμα επόμενα βήματα
            </h2>
          </div>
          <p className="max-w-2xl text-sm text-gray-600">
            Διάλεξε γρήγορα αν θέλεις πρόοδο, αναφορά ή νέα πρόταση τροφής,
            χωρίς να ψάχνεις σε όλες τις σελίδες.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {dashboardNextActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
                action.tone === "primary"
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-gray-50 text-black hover:border-gray-400"
              }`}
            >
              <span className="block font-semibold">{action.title}</span>
              <span
                className={`mt-2 block text-sm leading-5 ${
                  action.tone === "primary" ? "text-gray-100" : "text-gray-600"
                }`}
              >
                {action.detail}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl border border-violet-200 bg-violet-50 p-6 shadow-sm"
        data-testid="account-weekly-rhythm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">
              Ρυθμός παρακολούθησης
            </p>
            <h2 className="mt-2 text-2xl font-bold text-violet-950">
              Τι να κάνεις από σήμερα μέχρι τον επόμενο έλεγχο
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-violet-900">
              Το NutriTail δουλεύει καλύτερα όταν κρατάς λίγα απλά στοιχεία:
              τροφή, γραμμάρια, λιχουδιές, βάρος, όρεξη και κόπρανα.
            </p>
          </div>

          <Link
            href={
              latestPet
                ? `/account/chatbot?petId=${latestPet.id}&mode=progress`
                : "/account/chatbot"
            }
            className="rounded-xl bg-violet-700 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-violet-800"
          >
            {latestPet ? "Κάνε έλεγχο προόδου" : "Ξεκίνα ανάλυση"}
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-violet-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
              Σήμερα
            </p>
            <h3 className="mt-2 font-semibold text-violet-950">
              Κράτα το πλάνο καθαρό
            </h3>
            <p className="mt-2 text-sm leading-6 text-violet-900">
              Άνοιξε την αναφορά, διάλεξε τροφή και κράτα την πρώτη ποσότητα σε
              γραμμάρια/ημέρα.
            </p>
          </div>

          <div className="rounded-xl border border-violet-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
              Σε 7 ημέρες
            </p>
            <h3 className="mt-2 font-semibold text-violet-950">
              Έλεγξε αποδοχή τροφής
            </h3>
            <p className="mt-2 text-sm leading-6 text-violet-900">
              Παρατήρησε όρεξη, ενέργεια, κόπρανα, φαγούρα και αν βαρέθηκε τη
              γεύση ή την εταιρεία.
            </p>
          </div>

          <div className="rounded-xl border border-violet-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
              Σε 2-4 εβδομάδες
            </p>
            <h3 className="mt-2 font-semibold text-violet-950">
              Κάνε νέο έλεγχο προόδου
            </h3>
            <p className="mt-2 text-sm leading-6 text-violet-900">
              Δώσε νέο βάρος, ποσότητα, λιχουδιές και αλλαγές για να δούμε αν
              συνεχίζουμε ή αλλάζουμε πλάνο.
            </p>
          </div>
        </div>

        <div
          className="mt-5 rounded-2xl border border-violet-100 bg-white p-4"
          data-testid="account-progress-return-kit"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                Στοιχεία προόδου
              </p>
              <h3 className="mt-1 text-lg font-bold text-violet-950">
                Τι να κρατάς μέχρι τον επόμενο έλεγχο
              </h3>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-violet-900">
              Όταν γυρίσεις στο chatbot, αυτά τα στοιχεία βοηθούν να δούμε αν
              συνεχίζουμε, αλλάζουμε ποσότητα ή ζητάμε άλλη τροφή.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-violet-50 p-3 text-sm text-violet-950">
              <p className="font-semibold">Βάρος</p>
              <p className="mt-1 text-xs leading-5 text-violet-900">
                Ζύγισμα στην ίδια ζυγαριά, ιδανικά παρόμοια ώρα.
              </p>
            </div>
            <div className="rounded-xl bg-violet-50 p-3 text-sm text-violet-950">
              <p className="font-semibold">Γραμμάρια</p>
              <p className="mt-1 text-xs leading-5 text-violet-900">
                Πόσα έτρωγε πραγματικά ανά ημέρα, όχι μόνο η αρχική οδηγία.
              </p>
            </div>
            <div className="rounded-xl bg-violet-50 p-3 text-sm text-violet-950">
              <p className="font-semibold">Λιχουδιές</p>
              <p className="mt-1 text-xs leading-5 text-violet-900">
                Πόσες, τι είδους και αν δίνονταν καθημερινά.
              </p>
            </div>
            <div className="rounded-xl bg-violet-50 p-3 text-sm text-violet-950">
              <p className="font-semibold">
                {latestPet?.species === "cat" ? "Όρεξη / ούρηση" : "Όρεξη / κόπρανα"}
              </p>
              <p className="mt-1 text-xs leading-5 text-violet-900">
                {latestPet?.species === "cat"
                  ? "Σημείωσε αν τρώει κάθε μέρα, τουαλέτα και τυχόν αλλαγές."
                  : "Σημείωσε κόπρανα, ενέργεια και αν δέχεται καλά την τροφή."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm"
        data-testid="account-beta-plan"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
              Beta πρόσβαση
            </p>
            <h2 className="mt-2 text-2xl font-bold text-amber-950">
              Το NutriTail είναι ενεργό για δοκιμή με καθαρά όρια χρήσης
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
              Στην beta περίοδο κρατάμε το πλάνο απλό: αρκετές αναλύσεις για να
              δοκιμάσεις προτάσεις, αναφορές και ελέγχους προόδου, χωρίς να σε
              μπερδεύουμε με συνδρομή πριν ολοκληρωθεί το launch.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Link
              href="/beta"
              className="rounded-xl bg-amber-700 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-amber-800"
            >
              Δες το beta πλάνο
            </Link>
            <Link
              href="/plans"
              className="rounded-xl border border-amber-300 bg-white px-5 py-3 text-center text-sm font-medium text-amber-950 transition hover:bg-amber-100"
            >
              Όρια και μελλοντικά πλάνα
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {betaPlanHighlights.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-amber-100 bg-white p-4"
            >
              <p className="text-base font-semibold text-amber-950">
                {item.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        <div
          className="mt-5 rounded-2xl border border-amber-100 bg-white p-4"
          data-testid="account-beta-usage"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Beta usage
              </p>
              <h3 className="mt-1 text-lg font-bold text-amber-950">
                {betaUsage.statusLabel}
              </h3>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                {betaUsage.statusDetail}
              </p>
            </div>
            <p className="text-sm font-semibold text-amber-950">
              {betaAccessPlanConfig.accessPlan}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-amber-50 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-amber-950">
                  Κατοικίδια
                </span>
                <span className="font-bold text-amber-950">
                  {betaUsage.petsUsed}/{betaUsage.petsLimit}
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-amber-100">
                <div
                  className="h-2 rounded-full bg-amber-700"
                  style={{ width: `${betaUsage.petsPercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-amber-900">
                Απομένουν {betaUsage.petsRemaining} κατοικίδια στο beta πλάνο.
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-amber-950">
                  Αναλύσεις αυτόν τον μήνα
                </span>
                <span className="font-bold text-amber-950">
                  {betaUsage.monthlyAnalysesUsed}/
                  {betaUsage.monthlyAnalysesLimit}
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-amber-100">
                <div
                  className="h-2 rounded-full bg-amber-700"
                  style={{ width: `${betaUsage.analysesPercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-amber-900">
                Απομένουν {betaUsage.monthlyAnalysesRemaining} αναλύσεις για αυτόν τον μήνα.
              </p>
            </div>
          </div>

          <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
            Τα beta όρια είναι προσωρινά soft limits: σήμερα βοηθούν να κρατάμε
            καθαρή ποιότητα και αύριο μπορούν να γίνουν κανονικό πλάνο πρόσβασης.
            {` ${betaUsage.customerNextStep}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Αποθηκευμένα κατοικίδια</p>
          <p className="mt-2 text-3xl font-bold text-black">{pets.length}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Αποθηκευμένες αναλύσεις</p>
          <p className="mt-2 text-3xl font-bold text-black">{totalAnalyses}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Έτοιμες αναφορές</p>
          <p className="mt-2 text-3xl font-bold text-black">{readyReports}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Θέλουν ανάλυση</p>
          <p className="mt-2 text-3xl font-bold text-black">
            {petsNeedingAnalysisCount}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Επόμενο καλύτερο βήμα
            </p>
            <h2 className="mt-2 text-2xl font-bold text-emerald-950">
              {pets.length === 0
                ? "Δημιούργησε το πρώτο προφίλ"
                : nextPetToAnalyze
                  ? `Ανάλυση για ${nextPetToAnalyze.name ?? "το κατοικίδιο"}`
                  : "Δες την τελευταία αναφορά"}
            </h2>
            <p className="mt-2 text-sm text-emerald-900">
              {pets.length === 0
                ? "Ξεκίνα τη ροή του συμβούλου για προφίλ, θερμίδες και πρώτη αναφορά."
                : nextPetToAnalyze
                  ? `${getPetLabel(
                      nextPetToAnalyze
                    )} δεν έχει ακόμη αποθηκευμένη διατροφική ανάλυση.`
                  : "Όλα τα κατοικίδια έχουν ιστορικό αναφορών. Άνοιξε την τελευταία αναφορά ή κάνε νέα ανάλυση αν άλλαξε κάτι."}
            </p>
          </div>

          <Link
            href={
              nextPetToAnalyze
                ? `/account/pets/${nextPetToAnalyze.id}`
                : "/account/chatbot"
            }
            className="rounded-xl bg-emerald-700 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-emerald-800"
          >
            {nextPetToAnalyze ? "Άνοιγμα κατοικιδίου" : "Άνοιγμα συμβούλου"}
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-gray-500">Τελευταία αναφορά</p>
            <h2 className="mt-2 text-xl font-semibold text-black">
              {latestPet?.name ?? "Δεν υπάρχει αποθηκευμένη αναφορά"}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {latestAnalysis
                ? `${formatDate(latestAnalysis.createdAt)}${
                    getAnalysisFoodName(latestAnalysis)
                      ? ` - ${getAnalysisFoodName(latestAnalysis)}`
                      : ""
                  }`
                : "Κάνε ανάλυση για να δημιουργηθεί η πρώτη αναφορά."}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {latestPet && (
              <>
                <Link
                  href={`/account/pets/${latestPet.id}`}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-center text-sm font-medium text-black transition hover:bg-gray-100"
                >
                  Άνοιγμα κατοικιδίου
                </Link>
                <Link
                  href={`/print/pet-report/${latestPet.id}`}
                  className="rounded-xl bg-green-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-green-700"
                >
                  Άνοιγμα αναφοράς
                </Link>
                <Link
                  href={`/print/pet-timeline/${latestPet.id}`}
                  className="rounded-xl border border-green-300 px-4 py-2 text-center text-sm font-medium text-green-800 transition hover:bg-green-50"
                >
                  Ιστορικό
                </Link>
              </>
            )}
            <Link
              href={
                latestPet
                  ? `/account/chatbot?petId=${latestPet.id}&mode=progress`
                  : "/account/chatbot"
              }
              className="rounded-xl bg-black px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-gray-800"
            >
              {latestPet ? "Έλεγχος προόδου" : "Νέα ανάλυση"}
            </Link>
          </div>
        </div>

        {latestAnalysis && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-700">
            {getAnalysisFoodScore(latestAnalysis) !== null &&
              getAnalysisFoodScore(latestAnalysis) !== undefined && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  Καταλληλότητα τροφής:{" "}
                  {getFoodFitLabel(getAnalysisFoodScore(latestAnalysis))}
                </span>
              )}
            {getAnalysisFeedingGrams(latestAnalysis) && (
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {getAnalysisFeedingGrams(latestAnalysis)} γρ./ημέρα
              </span>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
              Τελευταία απόφαση προόδου
            </p>
            <h2 className="mt-2 text-xl font-semibold text-sky-950">
              {latestProgressPet?.name ?? "Δεν υπάρχει έλεγχος προόδου"}
            </h2>
            <p className="mt-1 text-sm text-sky-900">
              {latestProgress
                ? latestProgressMetadata?.progressDecisionHeadlineEl ??
                  latestProgressMetadata?.progressDecisionHeadlineEn ??
                  getProgressDecisionLabel(
                    latestProgressMetadata?.progressDecisionStatus
                  )
                : "Κάνε έλεγχο προόδου μετά από 2-4 εβδομάδες για να δεις αν συνεχίζουμε, αλλάζουμε ποσότητα ή ψάχνουμε άλλη τροφή."}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {latestProgressPet && (
              <Link
                href={`/print/pet-timeline/${latestProgressPet.id}`}
                className="rounded-xl border border-sky-300 bg-white px-4 py-2 text-center text-sm font-medium text-sky-900 transition hover:bg-sky-100"
              >
                Ιστορικό
              </Link>
            )}
            <Link
              href={
                latestProgressPet
                  ? `/account/chatbot?petId=${latestProgressPet.id}&mode=progress`
                  : "/account/chatbot"
              }
              className="rounded-xl bg-sky-700 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-sky-800"
            >
              {latestProgressPet ? "Νέος έλεγχος προόδου" : "Έναρξη ελέγχου"}
            </Link>
          </div>
        </div>

        {latestProgress && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-sky-950">
            {latestProgressMetadata?.progressDecisionStatus && (
              <span className="rounded-full bg-white px-3 py-1">
                Απόφαση:{" "}
                {getProgressDecisionLabel(
                  latestProgressMetadata.progressDecisionStatus
                )}
              </span>
            )}
            {latestProgressMetadata?.progressDecisionConfidence && (
              <span className="rounded-full bg-white px-3 py-1">
                Πώς το βλέπουμε:{" "}
                {formatProgressDecisionConfidence(
                  latestProgressMetadata.progressDecisionConfidence
                )}
              </span>
            )}
            {latestProgressMetadata?.currentWeightKg && (
              <span className="rounded-full bg-white px-3 py-1">
                Τωρινό βάρος {latestProgressMetadata.currentWeightKg} kg
              </span>
            )}
            {latestProgressMetadata?.feedingGramsPerDay && (
              <span className="rounded-full bg-white px-3 py-1">
                {latestProgressMetadata.feedingGramsPerDay} γρ./ημέρα
              </span>
            )}
            <span className="rounded-full bg-white px-3 py-1">
              {formatDate(latestProgress.created_at)}
            </span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Κατάσταση διατροφικού πλάνου
            </p>
            <h2 className="mt-2 text-xl font-bold text-blue-950">
              {planStatusCopy.label}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-900">
              {planStatusCopy.text}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-blue-900">
              <span className="rounded-full bg-white px-3 py-1">
                Οι επιλογές τροφών έρχονται από τη βάση NutriTail
              </span>
              <span className="rounded-full bg-white px-3 py-1">
                Περισσότερα στοιχεία ετικέτας βελτιώνουν την απάντηση
              </span>
              <span className="rounded-full bg-white px-3 py-1">
                Τα θέματα υγείας απαντώνται πιο προσεκτικά
              </span>
            </div>
          </div>

          <Link
            href={latestPet ? `/account/pets/${latestPet.id}` : "/account/chatbot"}
            className="rounded-xl bg-blue-700 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-blue-800"
          >
            {latestPet ? "Έλεγχος στοιχείων" : "Έναρξη ανάλυσης"}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Προτεινόμενο επόμενο βήμα</p>
          <p className="mt-2 text-lg font-semibold text-black">
            {pets.length === 0
              ? "Δημιούργησε το πρώτο κατοικίδιο"
              : petsNeedingAnalysisCount > 0
                ? "Κάνε τις αναλύσεις που λείπουν"
                : "Δες την τελευταία αναφορά"}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {pets.length === 0
              ? "Ξεκίνα από τον σύμβουλο για να αποθηκευτούν προφίλ και αναφορά."
              : petsNeedingAnalysisCount > 0
                ? "Κάποια αποθηκευμένα κατοικίδια δεν έχουν ακόμη ανάλυση."
                : "Τα κατοικίδια έχουν αποθηκευμένο ιστορικό αναλύσεων."}
          </p>
        </div>

        <Link
          href="/account/chatbot"
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-black">
            Διατροφικός σύμβουλος
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ξεκίνα νέα καθοδηγούμενη ανάλυση για αποθηκευμένο ή νέο κατοικίδιο.
          </p>
        </Link>

        <Link
          href="/account/pets"
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-black">Κατοικίδια</h2>
          <p className="mt-2 text-sm text-gray-600">
            Δες προφίλ, ιστορικό αναλύσεων, αναφορές και πορεία.
          </p>
        </Link>

        <Link
          href="/account/profile"
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-black">Προφίλ</h2>
          <p className="mt-2 text-sm text-gray-600">
            Διαχειρίσου στοιχεία λογαριασμού και πληροφορίες πελάτη.
          </p>
        </Link>
      </div>

      {petsNeedingAnalysis.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-black">
                Κατοικίδια που θέλουν ανάλυση
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Ξεκίνα από εδώ ώστε κάθε αποθηκευμένο κατοικίδιο να έχει χρήσιμη ανάλυση.
              </p>
            </div>
            <Link
              href="/account/chatbot"
              className="rounded-xl border border-black px-4 py-2 text-center text-sm font-medium text-black transition hover:bg-gray-100"
            >
              Έναρξη ανάλυσης
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {petsNeedingAnalysis.slice(0, 3).map((pet) => (
              <Link
                key={pet.id}
                href={`/account/pets/${pet.id}`}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-black"
              >
                <p className="font-semibold text-black">
                  {pet.name ?? "Κατοικίδιο"}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {getPetLabel(pet)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
