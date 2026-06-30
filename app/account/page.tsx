"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  matched_food_name?: string | null;
  feeding_grams_per_day?: number | null;
  food_score?: number | null;
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
  return Boolean(latest?.matched_food_name && latest?.feeding_grams_per_day);
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
          detail: latestAnalysis.feeding_grams_per_day
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
          : "Διάλεξε τροφή για να κρατηθούν γραμμάρια/ημέρα και report.",
      isComplete: readyReports > 0,
      href: latestPet ? `/print/pet-report/${latestPet.id}` : "/account/chatbot",
      actionLabel: readyReports > 0 ? "Άνοιξε report" : "Διάλεξε τροφή",
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
    latestAnalysis?.food_score
  );
  const dashboardNextActions = getDashboardNextActions({
    pets,
    latestPet,
    latestAnalysis,
    latestProgressPet,
    nextPetToAnalyze,
  });
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
              Ο προσωπικός σου πίνακας Nutritail AI για διατροφική καθοδήγηση,
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
            {latestPet ? "Κάνε progress check" : "Ξεκίνα ανάλυση"}
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
              Κάνε νέο progress check
            </h3>
            <p className="mt-2 text-sm leading-6 text-violet-900">
              Δώσε νέο βάρος, ποσότητα, λιχουδιές και αλλαγές για να δούμε αν
              συνεχίζουμε ή αλλάζουμε πλάνο.
            </p>
          </div>
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
                    latestAnalysis.matched_food_name
                      ? ` - ${latestAnalysis.matched_food_name}`
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
            {latestAnalysis.food_score !== null &&
              latestAnalysis.food_score !== undefined && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  Καταλληλότητα τροφής: {getFoodFitLabel(latestAnalysis.food_score)}
                </span>
              )}
            {latestAnalysis.feeding_grams_per_day && (
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {latestAnalysis.feeding_grams_per_day} γρ./ημέρα
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
