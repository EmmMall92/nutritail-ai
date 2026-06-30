"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type AnalysisHistoryItem = {
  id: string;
  created_at?: string;

  rer: number;
  mer: number;

  advice?: string[];

  food_score?: number | null;
  matched_food_id?: string | null;
  matched_food_name?: string | null;
  feeding_grams_per_day?: number | null;
  weight_goal?: string | null;
};

type PetDetail = {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  age: number;
  weight: number;
  neutered?: boolean;
  activity_level?: string | null;

  analyses?: AnalysisHistoryItem[];
};

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
}

function formatWeightGoal(value?: string | null) {
  if (!value) return "-";
  if (value === "loss") return "Απώλεια βάρους";
  if (value === "gain") return "Αύξηση βάρους";
  if (value === "maintenance") return "Διατήρηση βάρους";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getFoodScoreLabel(score?: number | null) {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return "Γενική καθοδήγηση";
  }

  if (score >= 80) return "Πολύ καλή επιλογή";
  if (score >= 60) return "Χρήσιμη επιλογή";
  if (score >= 40) return "Θέλει επανέλεγχο";

  return "Προτείνεται νέα ανάλυση";
}

function getPlanStatus(score?: number | null) {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return "Γενική καθοδήγηση";
  }

  if (score >= 80) return "Έτοιμο πλάνο";
  if (score >= 60) return "Χρήσιμο πλάνο";
  return "Προτείνεται νέος έλεγχος";
}

function getReportNextSteps(analysis?: AnalysisHistoryItem | null) {
  const steps = [
    "Χρησιμοποίησε τον ημερήσιο στόχο θερμίδων ως αρχικό σημείο και άλλαξε ποσότητα μόνο αφού παρακολουθήσεις βάρος και εικόνα σώματος.",
    "Κάνε αλλαγή τροφής σταδιακά σε 7 ημέρες, εκτός αν ο κτηνίατρος έχει δώσει άλλη οδηγία.",
  ];

  if (!analysis?.matched_food_name) {
    steps.push("Πρόσθεσε ακριβές όνομα τροφής ή φωτογραφία ετικέτας πριν βασιστείς σε συμβουλή για συγκεκριμένη φόρμουλα.");
  }

  if (!analysis?.feeding_grams_per_day) {
    steps.push("Επιβεβαίωσε kcal ανά 100g για πιο ακριβή υπολογισμό γραμμαρίων ανά ημέρα.");
  }

  if ((analysis?.food_score ?? 0) < 60) {
    steps.push("Κάνε επανέλεγχο τροφής αν υπάρχουν θέματα υγείας, αλλεργίες ή στόχος βάρους.");
  }

  return steps;
}

function getMonitoringChecklist(analysis?: AnalysisHistoryItem | null) {
  const checklist = [
    "Ζύγιζε το κατοικίδιο στην ίδια ζυγαριά κάθε 2-4 εβδομάδες.",
    "Παρακολούθησε όρεξη, ποιότητα κοπράνων, ενέργεια και αν δέχεται την τροφή.",
    "Κράτα τις λιχουδιές κοντά στο 10% των ημερήσιων θερμίδων και μέτρα τες στο σύνολο.",
  ];

  if (analysis?.weight_goal === "loss") {
    checklist.push("Αν το βάρος δεν αλλάξει μετά από 2-3 εβδομάδες, κάνε έλεγχο προόδου πριν μειώσεις κι άλλο την τροφή.");
  }

  if (!analysis?.matched_food_name || !analysis?.feeding_grams_per_day) {
    checklist.push("Στείλε ακριβές όνομα σακούλας ή φωτογραφία ετικέτας για πιο συγκεκριμένη μερίδα.");
  }

  return checklist;
}

function getFollowUpPlan(analysis?: AnalysisHistoryItem | null) {
  const plan = [
    {
      label: "Πότε ξαναελέγχουμε",
      value: getRecheckWindow(analysis),
      detail:
        "Χρησιμοποίησε τον έλεγχο προόδου με νέο βάρος, ημερήσια γραμμάρια, λιχουδιές, όρεξη, κόπρανα και ενέργεια.",
    },
    {
      label: "Τι κρατάμε σταθερό",
      value: "Ποσότητα τροφής και λιχουδιές",
      detail:
        "Απόφυγε αλλαγές μερίδας κάθε λίγες ημέρες. Παρακολούθησε το ίδιο πλάνο αρκετά ώστε να φανεί τάση.",
    },
    {
      label: "Πότε ζητάμε νέα λίστα",
      value: "Γεύση, κόπρανα ή βάρος δεν βελτιώνονται",
      detail:
        "Αν δεν δέχεται την τροφή, έχει μαλακά κόπρανα ή δεν αλλάζει το βάρος, κάνε νέα ανάλυση πριν αλλάξεις τυχαία τροφή.",
    },
  ];

  if (!analysis?.matched_food_name || !analysis?.feeding_grams_per_day) {
    plan.unshift({
      label: "Πριν βασιστείς στα γραμμάρια",
      value: "Επιβεβαίωσε την ακριβή φόρμουλα",
      detail:
        "Στείλε όνομα σακούλας ή φωτογραφία ετικέτας ώστε το NutriTail να υπολογίσει μερίδες από τις σωστές θερμίδες.",
    });
  }

  return plan;
}

function getReportSummary(analysis?: AnalysisHistoryItem | null) {
  if (!analysis) {
    return "Αυτή η αναφορά χρειάζεται αποθηκευμένη ανάλυση για να δείξει θερμίδες, μερίδα και καταλληλότητα τροφής.";
  }

  if (analysis.matched_food_name && analysis.feeding_grams_per_day) {
    return "Η αναφορά είναι έτοιμη ως πρακτική περίληψη ταΐσματος.";
  }

  return "Η αναφορά είναι χρήσιμη, αλλά λείπουν ακόμη λεπτομέρειες μερίδας για συγκεκριμένη τροφή.";
}

function getFormulaStatus(analysis?: AnalysisHistoryItem | null) {
  if (!analysis) return "Δεν υπάρχει αποθηκευμένη ανάλυση";
  if (analysis.matched_food_name && analysis.feeding_grams_per_day) {
    return "Τροφή και ποσότητα αποθηκευμένες";
  }
  if (analysis.matched_food_name) return "Η τροφή αποθηκεύτηκε, τα γραμμάρια θέλουν επιβεβαίωση";
  return "Λείπει ακόμη η ακριβής τροφή";
}

function getRecheckWindow(analysis?: AnalysisHistoryItem | null) {
  if (!analysis) return "Μετά την πρώτη αποθηκευμένη ανάλυση";
  if (!analysis.matched_food_name || !analysis.feeding_grams_per_day) {
    return "Αφού επιβεβαιωθούν τα ακριβή στοιχεία τροφής";
  }
  if (analysis.weight_goal === "loss") return "Σε 2-4 εβδομάδες";
  return "Όταν αλλάξει βάρος, όρεξη, κόπρανα ή αποδοχή τροφής";
}

function getGoalLabel(value?: string | null) {
  return formatWeightGoal(value);
}

function getCalorieExplanation(analysis?: AnalysisHistoryItem | null) {
  if (!analysis) {
    return {
      rest: "Οι θερμίδες ηρεμίας είναι η βασική εκτίμηση ενέργειας πριν από προσαρμογές τρόπου ζωής.",
      daily: "Ο ημερήσιος στόχος είναι η πρακτική ποσότητα ενέργειας μετά από δραστηριότητα, στείρωση και στόχο βάρους.",
    };
  }

  return {
    rest: `${analysis.rer} kcal/ημέρα είναι η εκτίμηση ενέργειας ηρεμίας πριν από δραστηριότητα, στείρωση και στόχο βάρους.`,
    daily: `${analysis.mer} kcal/ημέρα είναι ο πρακτικός ημερήσιος στόχος για το τωρινό πλάνο.`,
  };
}

function getFeedingDetail(analysis?: AnalysisHistoryItem | null) {
  if (!analysis) return "Αποθήκευσε πρώτα μία ανάλυση για να υπολογιστεί μερίδα.";
  if (analysis.feeding_grams_per_day) {
    return "Ξεκίνα από εδώ, χώρισέ το σε γεύματα και επανέλεγξε βάρος/εικόνα σώματος πριν αλλάξεις ποσότητα.";
  }
  return "Διάλεξε ή επιβεβαίωσε συγκεκριμένη τροφή ώστε το NutriTail να μετατρέψει θερμίδες σε γραμμάρια ανά ημέρα.";
}

function getFoodMatchDetail(analysis?: AnalysisHistoryItem | null) {
  if (!analysis) return "Δεν έχει επιλεγεί τροφή ακόμη.";
  if (analysis.matched_food_name) {
    return "Χρησιμοποίησέ την ως επιλεγμένη φόρμουλα για το τωρινό πλάνο ταΐσματος.";
  }
  return "Δεν αποθηκεύτηκε ακριβής τροφή, άρα η αναφορά μένει γενική.";
}

function getMealSplit(gramsPerDay?: number | null) {
  if (!gramsPerDay || !Number.isFinite(gramsPerDay)) return null;

  return {
    twoMeals: Math.round(gramsPerDay / 2),
    threeMeals: Math.round(gramsPerDay / 3),
  };
}

function getTreatAllowance(analysis?: AnalysisHistoryItem | null) {
  if (!analysis?.mer || !Number.isFinite(analysis.mer)) return null;

  const treatCalories = Math.round(analysis.mer * 0.1);

  return {
    treats: treatCalories,
    mainFood: Math.max(0, analysis.mer - treatCalories),
  };
}

function getReportActionSummary(
  analysis?: AnalysisHistoryItem | null,
  mealSplit?: ReturnType<typeof getMealSplit>
) {
  const treatAllowance = getTreatAllowance(analysis);

  return [
    {
      label: "Σήμερα ταΐζουμε",
      value: analysis?.matched_food_name ?? "Επιβεβαίωσε πρώτα την τροφή",
      detail: analysis?.matched_food_name
        ? "Αυτή είναι η τροφή που κρατήθηκε στην τελευταία ανάλυση."
        : "Διάλεξε τροφή από το chatbot ή στείλε φωτογραφία ετικέτας για πιο ακριβές πλάνο.",
    },
    {
      label: "Πρώτη ποσότητα",
      value: analysis?.feeding_grams_per_day
        ? `${analysis.feeding_grams_per_day}g/ημέρα`
        : "Θέλει kcal τροφής",
      detail:
        analysis?.feeding_grams_per_day && mealSplit
          ? `Πρακτικά: περίπου ${mealSplit.twoMeals}g ανά γεύμα σε 2 γεύματα ή ${mealSplit.threeMeals}g ανά γεύμα σε 3 γεύματα.`
          : "Η ποσότητα γίνεται ακριβής όταν έχουμε συγκεκριμένη τροφή με θερμίδες.",
    },
    {
      label: "Λιχουδιές",
      value: treatAllowance ? `έως ${treatAllowance.treats} kcal/ημέρα` : "έως 10%",
      detail: treatAllowance
        ? `Κράτα περίπου ${treatAllowance.mainFood} kcal για την κύρια τροφή.`
        : "Οι λιχουδιές καλό είναι να μένουν μικρό μέρος της ημέρας.",
    },
    {
      label: "Επανέλεγχος",
      value: getRecheckWindow(analysis),
      detail:
        "Στον επανέλεγχο φέρε βάρος, γραμμάρια/ημέρα, λιχουδιές, όρεξη, κόπρανα και ενέργεια.",
    },
  ];
}

function getDailyPlanCards(
  pet: PetDetail,
  analysis?: AnalysisHistoryItem | null
) {
  const treatAllowance = getTreatAllowance(analysis);

  return [
    {
      label: "Ημερήσιος στόχος",
      value: analysis ? `${analysis.mer} kcal/ημέρα` : "-",
      detail:
        "Ο πρακτικός στόχος ενέργειας για το σημερινό πλάνο του κατοικιδίου.",
    },
    {
      label: "Κύρια τροφή",
      value: analysis?.matched_food_name ?? "Δεν έχει επιλεγεί ακόμη",
      detail: analysis?.matched_food_name
        ? "Αυτή είναι η τροφή που κρατήθηκε στην τελευταία ανάλυση."
        : "Διάλεξε τροφή από το chatbot για να γίνει πιο συγκεκριμένο το πλάνο.",
    },
    {
      label: "Ποσότητα",
      value: analysis?.feeding_grams_per_day
        ? `${analysis.feeding_grams_per_day}g/ημέρα`
        : "Θέλει τροφή με kcal",
      detail: analysis?.feeding_grams_per_day
        ? "Χώρισέ το σε 2 ή 3 γεύματα και επανέλεγξε την εικόνα σώματος."
        : "Χρειάζεται επιλεγμένη τροφή με θερμίδες για ακριβή γραμμάρια.",
    },
    {
      label: "Λιχουδιές",
      value: treatAllowance
        ? `έως ${treatAllowance.treats} kcal/ημέρα`
        : "έως 10%",
      detail: treatAllowance
        ? `Περίπου ${treatAllowance.mainFood} kcal μένουν για κύρια τροφή.`
        : "Κράτα τις λιχουδιές μικρές και μέτρησέ τες στο σύνολο.",
    },
    {
      label: "Επανέλεγχος",
      value: getRecheckWindow(analysis),
      detail:
        pet.species === "cat"
          ? "Για γάτα, όρεξη, ούρηση και βάρος θέλουν πιο στενή παρακολούθηση."
          : "Φέρε νέο βάρος, γραμμάρια, λιχουδιές και παρατήρηση κοπράνων.",
    },
  ];
}

function getReportPlanSnapshot(
  pet: PetDetail,
  analysis?: AnalysisHistoryItem | null,
  mealSplit?: ReturnType<typeof getMealSplit>
) {
  return [
    {
      label: "Κατοικίδιο",
      value: `${pet.name} · ${pet.species}`,
      detail: `${pet.weight} kg · ${pet.age} έτη`,
    },
    {
      label: "Στόχος",
      value: analysis ? getGoalLabel(analysis.weight_goal) : "Χρειάζεται ανάλυση",
      detail: analysis
        ? `${analysis.mer} kcal/ημέρα ως σημερινός στόχος`
        : "Ξεκίνα νέα ανάλυση για θερμίδες και τροφή.",
    },
    {
      label: "Τροφή",
      value: analysis?.matched_food_name ?? "Δεν έχει επιλεγεί ακόμη",
      detail: analysis?.matched_food_name
        ? "Η τροφή που κρατήθηκε από την τελευταία ανάλυση."
        : "Διάλεξε τροφή από το chatbot για πιο πλήρες πλάνο.",
    },
    {
      label: "Ποσότητα",
      value: analysis?.feeding_grams_per_day
        ? `${analysis.feeding_grams_per_day}g/ημέρα`
        : "Θέλει kcal τροφής",
      detail:
        analysis?.feeding_grams_per_day && mealSplit
          ? `Πρακτικά: ${mealSplit.twoMeals}g x 2 γεύματα ή ${mealSplit.threeMeals}g x 3 γεύματα.`
          : "Η ποσότητα γίνεται ακριβής όταν ξέρουμε θερμίδες ανά 100g.",
    },
  ];
}

function getTransitionPlan(analysis?: AnalysisHistoryItem | null) {
  const basePlan = [
    {
      label: "Ημέρες 1-2",
      value: "75% παλιά + 25% νέα",
      detail: "Παρατήρησε όρεξη, κόπρανα και αν υπάρχει εμετός.",
    },
    {
      label: "Ημέρες 3-4",
      value: "50% παλιά + 50% νέα",
      detail: "Κράτα σταθερή τη συνολική ποσότητα της ημέρας.",
    },
    {
      label: "Ημέρες 5-6",
      value: "25% παλιά + 75% νέα",
      detail: "Αν τα κόπρανα μαλακώσουν πολύ, μείνε περισσότερο σε αυτό το βήμα.",
    },
    {
      label: "Ημέρα 7+",
      value: "100% νέα τροφή",
      detail: "Συνέχισε με το πλάνο γραμμαρίων και κάνε επανέλεγχο όταν χρειάζεται.",
    },
  ];

  if (!analysis?.matched_food_name) {
    return [
      {
        label: "Πριν τη μετάβαση",
        value: "Διάλεξε πρώτα συγκεκριμένη τροφή",
        detail:
          "Το transition plan είναι πιο χρήσιμο όταν ξέρουμε την ακριβή φόρμουλα.",
      },
      ...basePlan,
    ];
  }

  return basePlan;
}

function ReportCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="break-inside-avoid rounded-xl border border-gray-200 bg-white p-4 print:border-gray-300">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-black">{value}</p>
      {detail && <p className="mt-1 text-xs text-gray-500">{detail}</p>}
    </div>
  );
}

export default function PrintablePetReportPage() {
  const params = useParams();

  const petId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : "";

  const [pet, setPet] = useState<PetDetail | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`/api/print/pet-report/${petId}`, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(result.error);
        throw new Error("Δεν μπόρεσα να φορτώσω την αναφορά.");
      }

      setPet(result.pet as PetDetail);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Δεν μπόρεσα να φορτώσω την εκτυπώσιμη αναφορά."
      );
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    if (!petId) return;

    loadPet();
  }, [loadPet, petId]);

  const latestAnalysis = useMemo(() => {
    if (!pet?.analyses || pet.analyses.length === 0) {
      return null;
    }

    return [...pet.analyses].sort((a, b) => {
      const aDate = new Date(a.created_at ?? "").getTime();
      const bDate = new Date(b.created_at ?? "").getTime();

      return bDate - aDate;
    })[0];
  }, [pet]);

  const calorieExplanation = getCalorieExplanation(latestAnalysis);
  const mealSplit = getMealSplit(latestAnalysis?.feeding_grams_per_day);
  const reportActionSummary = getReportActionSummary(latestAnalysis, mealSplit);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-black">Φορτώνω την αναφορά...</p>
          <p className="mt-2 text-sm text-gray-600">
            Φέρνω την αποθηκευμένη διατροφική αναφορά.
          </p>
        </div>
      </main>
    );
  }

  if (error || !pet) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-red-200 bg-red-50 p-8 shadow-sm">
          <p className="text-sm text-red-700">
            {error || "Η αναφορά δεν βρέθηκε."}
          </p>
        </div>
      </main>
    );
  }

  const reportPlanSnapshot = getReportPlanSnapshot(pet, latestAnalysis, mealSplit);

  return (
    <main className="min-h-screen bg-gray-100 p-4 text-black sm:p-6 print:bg-white print:p-0">
      <section className="mx-auto max-w-5xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Εκτυπώσιμο διατροφικό πλάνο
            </p>
            <h1 className="mt-2 text-3xl font-bold text-black sm:text-4xl">
              Αναφορά NutriTail AI
            </h1>

            <p className="mt-2 text-gray-600">
              Προσωπική διατροφική περίληψη για {pet.name}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Δημιουργήθηκε στις {new Date().toLocaleString()}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row print:hidden">
            <Link
              href={`/account/pets/${pet.id}`}
              className="rounded-xl border border-gray-300 px-5 py-3 text-center text-sm font-medium text-black transition hover:bg-gray-100"
            >
              Πίσω στο κατοικίδιο
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-black px-5 py-3 text-white transition hover:opacity-90"
            >
              Εκτύπωση / PDF
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReportCard label="Κατοικίδιο" value={pet.name} detail={pet.species} />
          <ReportCard label="Βάρος" value={`${pet.weight} kg`} />
          <ReportCard
            label="Ημερήσιος στόχος"
            value={latestAnalysis ? `${latestAnalysis.mer} kcal` : "-"}
            detail="Πρακτικές θερμίδες ανά ημέρα"
          />
          <ReportCard
            label="Καταλληλότητα τροφής"
            value={getFoodScoreLabel(latestAnalysis?.food_score)}
            detail="Βασισμένο στο προφίλ και την επιλεγμένη τροφή."
          />
        </div>

        <div
          className="mt-8 break-inside-avoid rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm print:border-gray-300 print:shadow-none"
          data-testid="report-next-action-summary"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Τι κρατάμε για σήμερα
              </p>
              <h2 className="mt-1 text-2xl font-bold text-black">
                Απλό πλάνο για τάισμα, λιχουδιές και επανέλεγχο
              </h2>
            </div>
            <p className="max-w-xl text-sm text-gray-600">
              Αυτό είναι το γρήγορο κομμάτι που μπορείς να κρατήσεις ή να
              εκτυπώσεις. Οι λεπτομέρειες υπάρχουν πιο κάτω.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            {reportActionSummary.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-950 print:border-gray-300"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {item.label}
                </p>
                <p className="mt-2 font-bold">{item.value}</p>
                <p className="mt-1 text-xs text-emerald-900">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-8 break-inside-avoid rounded-2xl border border-black/10 bg-[#f7f7f4] p-6 shadow-sm print:border-gray-300 print:bg-white print:shadow-none"
          data-testid="report-plan-snapshot"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Πλάνο με μια ματιά
              </p>
              <h2 className="mt-1 text-2xl font-bold text-black">
                Η πρακτική περίληψη που κρατά ο πελάτης.
              </h2>
            </div>
            <p className="max-w-xl text-sm text-gray-600">
              Τροφή, ημερήσια ποσότητα, γεύματα και επανέλεγχος σε ένα σημείο,
              για να μη χρειάζεται να ψάχνει μέσα σε όλη την αναφορά.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            {reportPlanSnapshot.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-black/10 bg-white p-4 text-sm print:border-gray-300"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {item.label}
                </p>
                <p className="mt-2 font-bold text-black">{item.value}</p>
                <p className="mt-1 text-xs text-gray-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 break-inside-avoid rounded-xl border border-emerald-200 bg-emerald-50 p-6 print:border-gray-300">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Περίληψη πελάτη
          </p>
          <h2 className="mt-2 text-2xl font-bold text-emerald-950">
            {getReportSummary(latestAnalysis)}
          </h2>
          <p className="mt-3 text-sm text-emerald-900">
            Χρησιμοποίησέ το ως πρακτική περίληψη για θερμίδες, μερίδα,
            επιλογή τροφής και επανέλεγχο. Δεν αποτελεί διάγνωση ή θεραπευτικό
            πλάνο.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-emerald-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Κατάσταση πλάνου
              </p>
              <p className="mt-2 text-sm font-bold text-emerald-950">
                {getPlanStatus(latestAnalysis?.food_score)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Κατάσταση τροφής
              </p>
              <p className="mt-2 text-sm font-bold text-emerald-950">
                {getFormulaStatus(latestAnalysis)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Καλύτερη στιγμή επανελέγχου
              </p>
              <p className="mt-2 text-sm font-bold text-emerald-950">
                {getRecheckWindow(latestAnalysis)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 break-inside-avoid rounded-2xl border border-gray-200 bg-white p-6 shadow-sm print:border-gray-300 print:shadow-none">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Πλάνο ημέρας
              </p>
              <h2 className="mt-1 text-2xl font-bold text-black">
                Τι κρατάμε πρακτικά από την ανάλυση
              </h2>
            </div>
            <p className="max-w-xl text-sm text-gray-600">
              Αυτή είναι η γρήγορη εικόνα για θερμίδες, τροφή, ποσότητα,
              λιχουδιές και πότε χρειάζεται επανέλεγχος.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-5">
            {getDailyPlanCards(pet, latestAnalysis).map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm print:border-gray-300"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {item.label}
                </p>
                <p className="mt-2 font-bold text-black">{item.value}</p>
                <p className="mt-1 text-xs text-gray-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="break-inside-avoid rounded-xl border border-gray-200 bg-gray-50 p-6 print:border-gray-300">
            <h2 className="text-lg font-semibold text-black">
              Προφίλ κατοικιδίου
            </h2>

            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Είδος</dt>
                <dd className="font-semibold text-black">{pet.species}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Ράτσα</dt>
                <dd className="font-semibold text-black">{pet.breed || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Ηλικία</dt>
                <dd className="font-semibold text-black">{pet.age} έτη</dd>
              </div>
              <div>
                <dt className="text-gray-500">Δραστηριότητα</dt>
                <dd className="font-semibold text-black">
                  {pet.activity_level || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Στειρωμένο</dt>
                <dd className="font-semibold text-black">
                  {pet.neutered ? "Ναι" : "Όχι"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="break-inside-avoid rounded-xl border border-gray-200 bg-gray-50 p-6 print:border-gray-300">
            <h2 className="text-lg font-semibold text-black">
              Θερμίδες και μερίδες
            </h2>

            {latestAnalysis ? (
              <div className="mt-4 space-y-4">
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-gray-500">Θερμίδες ηρεμίας</dt>
                    <dd className="font-semibold text-black">
                      {latestAnalysis.rer} kcal
                    </dd>
                    <dd className="mt-1 text-xs text-gray-500">
                      Βασική ενέργεια πριν από προσαρμογές τρόπου ζωής.
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Ημερήσιος στόχος</dt>
                    <dd className="font-semibold text-black">
                      {latestAnalysis.mer} kcal
                    </dd>
                    <dd className="mt-1 text-xs text-gray-500">
                      Πρακτικός στόχος για το τωρινό πλάνο.
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Ημερήσια γραμμάρια</dt>
                    <dd className="font-semibold text-black">
                      {latestAnalysis.feeding_grams_per_day
                        ? `${latestAnalysis.feeding_grams_per_day}g/ημέρα`
                        : "-"}
                    </dd>
                    <dd className="mt-1 text-xs text-gray-500">
                      {getFeedingDetail(latestAnalysis)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Στόχος βάρους</dt>
                    <dd className="font-semibold text-black">
                      {getGoalLabel(latestAnalysis.weight_goal)}
                    </dd>
                  </div>
                </dl>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                    <p className="font-semibold text-black">
                      Τι σημαίνουν οι θερμίδες ηρεμίας
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {calorieExplanation.rest}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                    <p className="font-semibold text-black">
                      Τι σημαίνει ο ημερήσιος στόχος
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {calorieExplanation.daily}
                    </p>
                  </div>
                </div>

                {latestAnalysis.matched_food_name && (
                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                    <p className="text-gray-500">Επιλεγμένη τροφή</p>
                    <p className="mt-1 font-semibold text-black">
                      {latestAnalysis.matched_food_name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {getFoodMatchDetail(latestAnalysis)}
                    </p>
                  </div>
                )}

                {latestAnalysis.matched_food_name &&
                  latestAnalysis.feeding_grams_per_day && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
                      <p className="font-semibold text-emerald-950">
                        Πλάνο ταΐσματος
                      </p>
                      <p className="mt-2 text-2xl font-bold text-emerald-950">
                        {latestAnalysis.feeding_grams_per_day}g/ημέρα
                      </p>
                      <p className="mt-1 text-xs text-emerald-900">
                        Ξεκίνα από εδώ, παρακολούθησε βάρος και κόπρανα και μετά
                        ρύθμισε με έλεγχο προόδου αντί για τυχαίες αλλαγές.
                      </p>
                      {mealSplit && (
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="rounded-lg bg-white p-3">
                            <p className="text-xs uppercase text-emerald-700">
                              2 γεύματα
                            </p>
                            <p className="font-semibold text-emerald-950">
                              {mealSplit.twoMeals}g ανά γεύμα
                            </p>
                          </div>
                          <div className="rounded-lg bg-white p-3">
                            <p className="text-xs uppercase text-emerald-700">
                              3 γεύματα
                            </p>
                            <p className="font-semibold text-emerald-950">
                              {mealSplit.threeMeals}g ανά γεύμα
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                  <p className="text-gray-500">Πώς να χρησιμοποιήσεις την αναφορά</p>
                  <p className="mt-1 font-semibold text-black">
                    {getPlanStatus(latestAnalysis.food_score)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Χρησιμοποίησέ το ως αρχικό πλάνο και μετά ενημέρωσέ το με
                    βάρος, όρεξη, κόπρανα, λιχουδιές και αποδοχή τροφής.
                  </p>
                </div>

                <p className="text-xs text-gray-500">
                  Ημερομηνία ανάλυσης: {formatDate(latestAnalysis.created_at)}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-600">
                Δεν υπάρχει διαθέσιμη ανάλυση ακόμη.
              </p>
            )}
          </div>
        </div>

        {latestAnalysis?.advice &&
          latestAnalysis.advice.length > 0 && (
            <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 print:border-gray-300">
              <h2 className="text-xl font-semibold text-black">
                Διατροφικές σημειώσεις
              </h2>

              <div className="mt-4 space-y-3">
                {latestAnalysis.advice.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="break-inside-avoid rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-black print:border-gray-300"
                  >
                    - {item}
                  </div>
                ))}
              </div>
            </div>
          )}

        {latestAnalysis && (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 print:border-gray-300">
            <h2 className="text-xl font-semibold text-black">
              Πρακτικά επόμενα βήματα
            </h2>

            <div className="mt-4 space-y-3">
              {getReportNextSteps(latestAnalysis).map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="break-inside-avoid rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-black print:border-gray-300"
                >
                  {index + 1}. {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {latestAnalysis && (
          <div className="mt-8 rounded-xl border border-emerald-200 bg-white p-6 print:border-gray-300">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Μετάβαση τροφής
                </p>
                <h2 className="mt-1 text-xl font-semibold text-black">
                  7ήμερο πλάνο αλλαγής τροφής
                </h2>
              </div>
              <p className="max-w-xl text-sm text-gray-600">
                Αν αλλάξεις τροφή, κάνε τη μετάβαση σταδιακά. Σε ευαίσθητη πέψη
                μπορεί να χρειαστούν 10-14 ημέρες.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
              {getTransitionPlan(latestAnalysis).map((item) => (
                <div
                  key={item.label}
                  className="break-inside-avoid rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-950 print:border-gray-300"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {item.label}
                  </p>
                  <p className="mt-2 font-bold">{item.value}</p>
                  <p className="mt-1 text-xs text-emerald-900">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {latestAnalysis && (
          <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6 print:border-gray-300">
            <h2 className="text-xl font-semibold text-blue-950">
              Checklist παρακολούθησης
            </h2>
            <p className="mt-2 text-sm text-blue-900">
              Χρησιμοποίησε αυτή την ενότητα ανάμεσα στις αναφορές ώστε το
              επόμενος έλεγχος να έχει πραγματικά δεδομένα προόδου.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {getMonitoringChecklist(latestAnalysis).map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="break-inside-avoid rounded-xl border border-blue-100 bg-white p-4 text-sm text-blue-950 print:border-gray-300"
                >
                  {index + 1}. {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {latestAnalysis && (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6 print:border-gray-300">
            <h2 className="text-xl font-semibold text-amber-950">
              Πλάνο επανελέγχου
            </h2>
            <p className="mt-2 text-sm text-amber-900">
              Αυτό είναι το απλό πλάνο πριν αλλάξεις ξανά τροφή ή ποσότητες.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {getFollowUpPlan(latestAnalysis).map((item) => (
                <div
                  key={item.label}
                  className="break-inside-avoid rounded-xl border border-amber-100 bg-white p-4 text-sm text-amber-950 print:border-gray-300"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    {item.label}
                  </p>
                  <p className="mt-2 font-semibold">{item.value}</p>
                  <p className="mt-1 text-xs text-amber-900">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {pet.analyses && pet.analyses.length > 1 && (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 print:border-gray-300">
            <h2 className="text-xl font-semibold text-black">
              Ιστορικό αναλύσεων
            </h2>

            <div className="mt-5 space-y-4">
              {[...pet.analyses]
                .sort((a, b) => {
                  const aDate = new Date(
                    a.created_at ?? ""
                  ).getTime();

                  const bDate = new Date(
                    b.created_at ?? ""
                  ).getTime();

                  return bDate - aDate;
                })
                .map((item) => (
                  <div
                    key={item.id}
                    className="break-inside-avoid rounded-xl border border-gray-200 bg-gray-50 p-4 print:border-gray-300"
                  >
                    <div className="flex flex-col gap-2 text-sm text-black">
                      <p>
                        <strong>Ημερομηνία:</strong>{" "}
                        {formatDate(item.created_at)}
                      </p>

                      <p>
                        <strong>Θερμίδες ηρεμίας:</strong> {item.rer} kcal
                      </p>

                      <p>
                        <strong>Ημερήσιος στόχος:</strong> {item.mer} kcal
                      </p>

                      {item.food_score !== null &&
                        item.food_score !== undefined && (
                          <p>
                            <strong>Καταλληλότητα τροφής:</strong>{" "}
                            {getFoodScoreLabel(item.food_score)}
                          </p>
                        )}

                      {item.feeding_grams_per_day && (
                        <p>
                          <strong>Μερίδα:</strong>{" "}
                          {item.feeding_grams_per_day}g/ημέρα
                        </p>
                      )}

                      {item.weight_goal && (
                        <p>
                          <strong>Στόχος:</strong>{" "}
                            {formatWeightGoal(item.weight_goal)}
                        </p>
                      )}

                      {item.matched_food_name && (
                        <p>
                          <strong>Τροφή:</strong>{" "}
                          {item.matched_food_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="mt-10 border-t border-gray-200 pt-6 text-xs text-gray-500">
          <p>
            Το NutriTail AI παρέχει εκπαιδευτική διατροφική καθοδήγηση και δεν
            αντικαθιστά κτηνιατρική διάγνωση ή ιατρική συμβουλή.
          </p>
        </div>
      </section>
    </main>
  );
}
