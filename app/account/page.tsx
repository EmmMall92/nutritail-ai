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
          throw new Error(result.error || "Δεν ήταν δυνατή η φόρτωση λογαριασμού.");
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
            : "Δεν ήταν δυνατή η φόρτωση λογαριασμού."
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
