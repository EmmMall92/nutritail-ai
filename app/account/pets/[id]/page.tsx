"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatProgressDecisionConfidence } from "@/lib/progressDecisionCopy";

type AnalysisHistoryItem = {
  id: string;
  rer: number;
  mer: number;
  createdAt: string;
  recommendedFoodIds: string[];
  food_score?: number | null;
  matched_food_id?: string | null;
  matched_food_name?: string | null;
  feeding_grams_per_day?: number | null;
  weight_goal?: string | null;
};

type AccountPet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  activity_level: string;
  neutered: boolean;
  allergies: string[];
  health_issues: string[];
  created_at: string;
};

type ProgressLog = {
  id: string;
  message: string;
  created_at: string;
  metadata?: {
    mode?: string;
    currentWeightKg?: number | null;
    previousWeightKg?: number | null;
    feedingGramsPerDay?: number | null;
    treatsPerDay?: string | null;
    treatsNote?: string | null;
    appetiteNote?: string | null;
    stoolNote?: string | null;
    energyNote?: string | null;
    bodyChangeNote?: string | null;
    progressDecisionStatus?: string | null;
    progressDecisionConfidence?: string | null;
    progressDecisionHeadlineEl?: string | null;
    progressDecisionHeadlineEn?: string | null;
    note?: string | null;
  };
};

type PetDetailResponse = {
  pet: AccountPet;
  analysisHistory: AnalysisHistoryItem[];
  progressLogs?: ProgressLog[];
};

type PetContextForm = {
  breed: string;
  age: string;
  weight: string;
  activity_level: string;
  neutered: string;
  allergies: string;
  health_issues: string;
};

function toCommaText(value?: string[]) {
  return value?.length ? value.join(", ") : "";
}

function toStringList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toPetContextForm(pet: AccountPet): PetContextForm {
  return {
    breed: pet.breed ?? "",
    age: String(pet.age ?? ""),
    weight: String(pet.weight ?? ""),
    activity_level: pet.activity_level || "normal",
    neutered: pet.neutered ? "yes" : "no",
    allergies: toCommaText(pet.allergies),
    health_issues: toCommaText(pet.health_issues),
  };
}

function hasValidFoodScore(score?: number | null) {
  return typeof score === "number" && Number.isFinite(score);
}

function getFoodScoreLabel(score?: number | null) {
  if (!hasValidFoodScore(score)) return "Γενική καθοδήγηση";
  const numericScore = Number(score);
  if (numericScore >= 80) return "Πολύ καλή επιλογή";
  if (numericScore >= 60) return "Χρήσιμη επιλογή";
  if (numericScore >= 40) return "Θέλει επανέλεγχο";
  return "Προτείνεται νέα ανάλυση";
}

function getReportReadiness(item?: AnalysisHistoryItem) {
  if (!item) return "Δεν υπάρχει report ακόμη";
  if (item.matched_food_name && item.feeding_grams_per_day) {
    return "Έτοιμο για χρήση";
  }
  if (item.matched_food_name || item.feeding_grams_per_day) {
    return "Χρήσιμο με σημειώσεις";
  }
  return "Γενική καθοδήγηση";
}

function getLatestAnalysisNextSteps(item?: AnalysisHistoryItem) {
  const steps = [];

  if (!item?.matched_food_name) {
    steps.push("Πρόσθεσε ή επιβεβαίωσε την ακριβή τροφή για πιο συγκεκριμένη συμβουλή.");
  }

  if (!item?.feeding_grams_per_day) {
    steps.push("Επιβεβαίωσε τις θερμίδες της τροφής για υπολογισμό γραμμαρίων.");
  }

  if (!hasValidFoodScore(item?.food_score) || (item?.food_score ?? 0) < 60) {
    steps.push("Κάνε επανέλεγχο τροφής αν υπάρχουν αλλεργίες, συμπτώματα ή στόχος βάρους.");
  }

  if (steps.length === 0) {
    steps.push("Χρησιμοποίησε την αναφορά για αποθήκευση ή κοινοποίηση της ανάλυσης.");
  }

  return steps;
}

function getResultStatusDetail(item?: AnalysisHistoryItem) {
  if (!item) {
    return "Ξεκίνα ανάλυση στο chatbot για θερμίδες, προτάσεις τροφής, report και ιστορικό.";
  }

  if (item.matched_food_name && item.feeding_grams_per_day) {
    return "Έτοιμο για παρακολούθηση μερίδας, ελέγχους προόδου και αποθήκευση.";
  }

  if (item.matched_food_name) {
    return "Η τροφή έχει αποθηκευτεί, αλλά τα γραμμάρια θέλουν επιβεβαίωση θερμίδων.";
  }

  if (item.feeding_grams_per_day) {
    return "Υπάρχει εκτίμηση μερίδας, αλλά η ακριβής τροφή θέλει επιβεβαίωση.";
  }

  return "Οι θερμίδες είναι χρήσιμες, αλλά η συμβουλή μένει γενική μέχρι να επιβεβαιωθεί η τροφή.";
}

function getResultFollowUp(item?: AnalysisHistoryItem, progressLogCount = 0) {
  if (!item) return "Ξεκίνα διατροφική ανάλυση";
  if (!item.matched_food_name) return "Επιβεβαίωσε την τροφή";
  if (!item.feeding_grams_per_day) return "Επιβεβαίωσε θερμίδες και γραμμάρια";
  if (progressLogCount === 0) return "Πρώτος έλεγχος προόδου";
  return "Συνέχισε την παρακολούθηση";
}

function getCareNotes(pet: AccountPet) {
  const notes = [];

  if (pet.allergies?.length) {
    notes.push(`Απόφυγε γνωστά αλλεργιογόνα: ${pet.allergies.join(", ")}.`);
  }

  if (pet.health_issues?.length) {
    notes.push(`Σημειώσεις υγείας που πρέπει να ληφθούν υπόψη: ${pet.health_issues.join(", ")}.`);
  }

  if (pet.neutered) {
    notes.push("Τα στειρωμένα κατοικίδια συχνά χρειάζονται πιο προσεκτικό έλεγχο θερμίδων.");
  }

  if (notes.length === 0) {
    notes.push("Δεν υπάρχουν αποθηκευμένες αλλεργίες ή σημειώσεις υγείας ακόμη.");
  }

  return notes;
}

function formatProgressMode(value?: string) {
  if (value === "no_result") return "Χωρίς ορατό αποτέλεσμα";
  if (value === "progress") return "Έλεγχος προόδου";
  return "Σημείωση προόδου";
}

function formatWeightDelta(currentWeight?: number | null, previousWeight?: number | null) {
  if (
    typeof currentWeight !== "number" ||
    !Number.isFinite(currentWeight) ||
    typeof previousWeight !== "number" ||
    !Number.isFinite(previousWeight)
  ) {
    return "Δεν υπάρχει ακόμη σύγκριση βάρους";
  }

  const delta = Number((currentWeight - previousWeight).toFixed(1));
  if (delta === 0) return "Δεν υπάρχει αλλαγή βάρους από το αποθηκευμένο προφίλ";
  if (delta < 0) return `${Math.abs(delta)} kg χαμηλότερα από το αποθηκευμένο προφίλ`;
  return `${delta} kg υψηλότερα από το αποθηκευμένο προφίλ`;
}

function getLatestProgressSummary(progressLogs: ProgressLog[], pet: AccountPet) {
  const latestLog = progressLogs[0];
  const metadata = latestLog?.metadata;
  const currentWeight = metadata?.currentWeightKg ?? null;
  const previousWeight = metadata?.previousWeightKg ?? pet.weight ?? null;

  return {
    latestLog,
    currentWeight,
    feedingGramsPerDay: metadata?.feedingGramsPerDay ?? null,
    treatsNote: metadata?.treatsNote ?? metadata?.treatsPerDay ?? null,
    appetiteNote: metadata?.appetiteNote ?? null,
    stoolNote: metadata?.stoolNote ?? null,
    energyNote: metadata?.energyNote ?? null,
    progressDecisionStatus: metadata?.progressDecisionStatus ?? null,
    progressDecisionConfidence: metadata?.progressDecisionConfidence ?? null,
    progressDecisionHeadline:
      metadata?.progressDecisionHeadlineEn ??
      metadata?.progressDecisionHeadlineEl ??
      null,
    mode: formatProgressMode(metadata?.mode),
    deltaText: formatWeightDelta(currentWeight, previousWeight),
  };
}

function formatProgressChipLabel(value?: string | null) {
  if (!value) return null;

  const labels: Record<string, string> = {
    none: "καθόλου",
    few: "λίγες",
    some: "μερικές",
    many: "πολλές",
    normal: "φυσιολογικό",
    hungry: "πεινάει",
    low: "χαμηλή",
    picky: "επιλεκτικό",
    better: "καλύτερα",
    soft: "μαλακά",
    diarrhea: "διάρροια",
    constipation: "δυσκοιλιότητα",
    high: "υψηλή",
    leaner: "πιο αδύνατο",
    same: "ίδιο",
    heavier: "πιο βαρύ",
    continue_plan: "συνέχισε το πλάνο",
    adjust_portions: "ρύθμισε τη μερίδα",
    reduce_treats: "μείωσε τις λιχουδιές",
    review_food_fit: "επανέλεγχος τροφής",
    needs_more_data: "χρειάζονται περισσότερα στοιχεία",
  };

  return labels[value] ?? value;
}

function getProgressContextChips(metadata?: ProgressLog["metadata"]) {
  if (!metadata) return [];

  return [
    ["Λιχουδιές", metadata.treatsNote],
    ["Όρεξη", metadata.appetiteNote],
    ["Κόπρανα", metadata.stoolNote],
    ["Ενέργεια", metadata.energyNote],
    ["Σώμα", metadata.bodyChangeNote],
  ]
    .map(([label, value]) => {
      const formatted = formatProgressChipLabel(value);
      return formatted ? `${label}: ${formatted}` : null;
    })
    .filter((value): value is string => Boolean(value));
}

export default function AccountPetDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<PetDetailResponse | null>(null);
  const [editForm, setEditForm] = useState<PetContextForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingContext, setIsSavingContext] = useState(false);
  const [error, setError] = useState("");
  const [contextMessage, setContextMessage] = useState("");

  useEffect(() => {
    async function loadPet() {
      try {
        setIsLoading(true);
        setError("");

        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();

        if (!sessionData.session?.user) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        const response = await fetch(`/api/account/pets/${params.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authUserId: sessionData.session.user.id,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error(result.error);
          throw new Error("Δεν μπόρεσα να φορτώσω το κατοικίδιο.");
        }

        const petDetail = result as PetDetailResponse;
        setData(petDetail);
        setEditForm(toPetContextForm(petDetail.pet));
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Δεν μπόρεσα να φορτώσω το κατοικίδιο.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (params?.id) {
      loadPet();
    }
  }, [params, pathname, router]);

  async function handleContextSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editForm || !data) return;

    try {
      setIsSavingContext(true);
      setContextMessage("");

      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      const response = await fetch(`/api/account/pets/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authUserId: sessionData.session.user.id,
          breed: editForm.breed,
          age: Number(editForm.age),
          weight: Number(editForm.weight),
          activity_level: editForm.activity_level,
          neutered: editForm.neutered === "yes",
          allergies: toStringList(editForm.allergies),
          health_issues: toStringList(editForm.health_issues),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(result.error);
        throw new Error("Δεν μπόρεσα να ενημερώσω το προφίλ κατοικιδίου.");
      }

      setData((current) =>
        current
          ? {
              ...current,
              pet: result.pet as AccountPet,
            }
          : current
      );
      setEditForm(toPetContextForm(result.pet as AccountPet));
      setContextMessage(
        "Το προφίλ κατοικιδίου ενημερώθηκε. Κάνε νέα ανάλυση όταν θέλεις φρέσκες προτάσεις."
      );
    } catch (err) {
      console.error(err);
      setContextMessage(
        err instanceof Error
          ? err.message
          : "Δεν μπόρεσα να ενημερώσω το προφίλ κατοικιδίου."
      );
    } finally {
      setIsSavingContext(false);
    }
  }

  if (isLoading) {
    return (
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-black">Φορτώνω το κατοικίδιο...</p>
          <p className="mt-2 text-sm text-gray-600">
            Φέρνω το αποθηκευμένο προφίλ και το ιστορικό αναλύσεων.
          </p>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          <p className="font-semibold">Δεν μπόρεσα να φορτώσω αυτό το κατοικίδιο</p>
          <p className="mt-2 text-sm">
            {error || "Το κατοικίδιο δεν βρέθηκε."}
          </p>
          <Link
            href="/account/pets"
            className="mt-4 inline-block rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            Πίσω στα κατοικίδιά μου
          </Link>
        </div>
      </section>
    );
  }

  const { pet, analysisHistory, progressLogs = [] } = data;
  const latest = analysisHistory[0];
  const progressSummary = getLatestProgressSummary(progressLogs, pet);
  const maxPetWeightKg = pet.species === "cat" ? 15 : 90;

  return (
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">{pet.name}</h1>
            <p className="mt-2 text-gray-600">
              Προφίλ κατοικιδίου, διατροφική ανάλυση και ιστορικό προόδου.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/account/pets"
              className="rounded-xl border border-black px-4 py-2 text-sm text-black"
            >
              Πίσω στα κατοικίδιά μου
            </Link>

            <Link
              href={
                latest
                  ? `/account/chatbot?petId=${pet.id}&mode=progress`
                  : `/account/chatbot?petId=${pet.id}`
              }
              className="rounded-xl bg-black px-4 py-2 text-sm text-white"
            >
              {latest ? "Έλεγχος προόδου" : "Νέα ανάλυση"}
            </Link>

            {latest && (
              <>
                <Link
                  href={`/print/pet-report/${pet.id}`}
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm text-white transition hover:bg-green-700"
                >
                  Αναφορά
                </Link>

                <Link
                  href={`/print/pet-timeline/${pet.id}`}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-black transition hover:bg-gray-100"
                >
                  Ιστορικό
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                Σημειώσεις φροντίδας
              </p>
              <h2 className="mt-2 text-xl font-bold text-amber-950">
                Η επιλογή τροφής πρέπει να λαμβάνει υπόψη αυτό το προφίλ
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-amber-900">
                {getCareNotes(pet).map((note) => (
                  <li key={note}>- {note}</li>
                ))}
              </ul>
            </div>

            <Link
              href={
                latest
                  ? `/account/chatbot?petId=${pet.id}&mode=progress`
                  : `/account/chatbot?petId=${pet.id}`
              }
              className="rounded-xl bg-amber-700 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-amber-800"
            >
              Επανέλεγχος τροφής
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Τελευταίο αποτέλεσμα
              </p>
              <h2 className="mt-2 text-xl font-bold text-emerald-950">
                {getReportReadiness(latest)}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-emerald-900">
                {getResultStatusDetail(latest)}
              </p>
            </div>

            <Link
              href={
                latest
                  ? `/account/chatbot?petId=${pet.id}&mode=progress`
                  : `/account/chatbot?petId=${pet.id}`
              }
              className="rounded-xl bg-emerald-700 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-emerald-800"
            >
              {getResultFollowUp(latest, progressLogs.length)}
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Ημερήσιος στόχος
              </p>
              <p className="mt-2 text-lg font-semibold text-black">
                {latest?.mer ? `${latest.mer} kcal/ημέρα` : "Δεν έχει υπολογιστεί"}
              </p>
            </div>

            <div className="rounded-xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Τροφή
              </p>
              <p className="mt-2 text-sm font-semibold text-black">
                {latest?.matched_food_name ?? "Θέλει ακριβές όνομα τροφής"}
              </p>
            </div>

            <div className="rounded-xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Μερίδα
              </p>
              <p className="mt-2 text-lg font-semibold text-black">
                {latest?.feeding_grams_per_day
                  ? `${latest.feeding_grams_per_day}g/ημέρα`
                  : "Θέλει έλεγχο θερμίδων"}
              </p>
            </div>

            <div className="rounded-xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Συνέχεια
              </p>
              <p className="mt-2 text-sm font-semibold text-black">
                {getResultFollowUp(latest, progressLogs.length)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">Είδος</p>
            <p className="mt-2 text-xl font-semibold text-black">
              {pet.species === "dog" ? "σκύλος" : pet.species === "cat" ? "γάτα" : pet.species}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">Βάρος</p>
            <p className="mt-2 text-xl font-semibold text-black">{pet.weight} kg</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">Αναλύσεις</p>
            <p className="mt-2 text-xl font-semibold text-black">
              {analysisHistory.length}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Τελευταία πρόοδος
              </p>
              {progressSummary.latestLog ? (
                <>
                  <h2 className="mt-2 text-xl font-bold text-blue-950">
                    {progressSummary.mode}
                  </h2>
                  <p className="mt-2 text-sm text-blue-900">
                    {progressSummary.deltaText}
                  </p>
                  {progressSummary.progressDecisionHeadline && (
                    <p className="mt-2 text-sm font-semibold text-blue-950">
                      {progressSummary.progressDecisionHeadline}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-blue-950">
                    {progressSummary.progressDecisionStatus && (
                      <span className="rounded-full bg-white px-3 py-1">
                        Απόφαση: {formatProgressChipLabel(progressSummary.progressDecisionStatus)}
                      </span>
                    )}
                    {progressSummary.progressDecisionConfidence && (
                      <span className="rounded-full bg-white px-3 py-1">
                        Πώς το βλέπουμε:{" "}
                        {formatProgressDecisionConfidence(
                          progressSummary.progressDecisionConfidence
                        )}
                      </span>
                    )}
                    {progressSummary.currentWeight && (
                      <span className="rounded-full bg-white px-3 py-1">
                        Τωρινό βάρος {progressSummary.currentWeight} kg
                      </span>
                    )}
                    {progressSummary.feedingGramsPerDay && (
                      <span className="rounded-full bg-white px-3 py-1">
                        {progressSummary.feedingGramsPerDay}g/ημέρα
                      </span>
                    )}
                    {progressSummary.treatsNote && (
                      <span className="rounded-full bg-white px-3 py-1">
                        Λιχουδιές: {formatProgressChipLabel(progressSummary.treatsNote)}
                      </span>
                    )}
                    {progressSummary.appetiteNote && (
                      <span className="rounded-full bg-white px-3 py-1">
                        Όρεξη: {formatProgressChipLabel(progressSummary.appetiteNote)}
                      </span>
                    )}
                    {progressSummary.stoolNote && (
                      <span className="rounded-full bg-white px-3 py-1">
                        Κόπρανα: {formatProgressChipLabel(progressSummary.stoolNote)}
                      </span>
                    )}
                    {progressSummary.energyNote && (
                      <span className="rounded-full bg-white px-3 py-1">
                        Ενέργεια: {formatProgressChipLabel(progressSummary.energyNote)}
                      </span>
                    )}
                    <span className="rounded-full bg-white px-3 py-1">
                      {new Date(progressSummary.latestLog.created_at).toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="mt-2 text-xl font-bold text-blue-950">
                    Δεν υπάρχουν check-ins ακόμη
                  </h2>
                  <p className="mt-2 text-sm text-blue-900">
                    Πρόσθεσε έλεγχο όταν αλλάξει βάρος, όρεξη, κόπρανα,
                    λιχουδιές ή αποδοχή τροφής.
                  </p>
                </>
              )}
            </div>

            <Link
              href={`/account/chatbot?petId=${pet.id}&mode=progress`}
              className="rounded-xl bg-blue-700 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-blue-800"
            >
              Πρόσθεσε έλεγχο προόδου
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-black">Στοιχεία κατοικιδίου</h2>

          <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <p className="text-black">
              <span className="font-semibold">Ράτσα:</span> {pet.breed || "-"}
            </p>
            <p className="text-black">
              <span className="font-semibold">Ηλικία:</span> {pet.age}
            </p>
            <p className="text-black">
              <span className="font-semibold">Δραστηριότητα:</span> {pet.activity_level}
            </p>
            <p className="text-black">
              <span className="font-semibold">Στειρωμένο:</span>{" "}
              {pet.neutered ? "Ναι" : "Όχι"}
            </p>
            <p className="text-black md:col-span-2">
              <span className="font-semibold">Αλλεργίες:</span>{" "}
              {pet.allergies?.length ? pet.allergies.join(", ") : "-"}
            </p>
            <p className="text-black md:col-span-2">
              <span className="font-semibold">Θέματα υγείας:</span>{" "}
              {pet.health_issues?.length ? pet.health_issues.join(", ") : "-"}
            </p>
          </div>
        </div>

        {editForm && (
          <form
            onSubmit={handleContextSave}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-black">
                  Ενημέρωση προφίλ κατοικιδίου
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Κράτα ενημερωμένα βάρος, δραστηριότητα, αλλεργίες και σημειώσεις
                  υγείας, ώστε η επόμενη ανάλυση να ξεκινά σωστά.
                </p>
              </div>
              <Link
                href={`/account/chatbot?petId=${pet.id}`}
                className="rounded-xl border border-gray-300 px-4 py-2 text-center text-sm font-medium text-black transition hover:bg-gray-100"
              >
                Νέα ανάλυση
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-black">
                Ράτσα
                <input
                  value={editForm.breed}
                  onChange={(event) =>
                    setEditForm({ ...editForm, breed: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
                  placeholder="π.χ. Labrador"
                />
              </label>

              <label className="text-sm font-medium text-black">
                Ηλικία
                <input
                  type="number"
                  min="0"
                  max="40"
                  step="0.1"
                  value={editForm.age}
                  onChange={(event) =>
                    setEditForm({ ...editForm, age: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
                />
              </label>

              <label className="text-sm font-medium text-black">
                Βάρος kg
                <input
                  type="number"
                  min="0.1"
                  max={maxPetWeightKg}
                  step="0.1"
                  value={editForm.weight}
                  onChange={(event) =>
                    setEditForm({ ...editForm, weight: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
                />
              </label>

              <label className="text-sm font-medium text-black">
                Δραστηριότητα
                <select
                  value={editForm.activity_level}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      activity_level: event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
                >
                  <option value="low">Χαμηλή</option>
                  <option value="normal">Κανονική</option>
                  <option value="high">Υψηλή</option>
                </select>
              </label>

              <label className="text-sm font-medium text-black">
                Στειρωμένο
                <select
                  value={editForm.neutered}
                  onChange={(event) =>
                    setEditForm({ ...editForm, neutered: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
                >
                  <option value="yes">Ναι</option>
                  <option value="no">Όχι</option>
                </select>
              </label>

              <label className="text-sm font-medium text-black">
                Αλλεργίες
                <input
                  value={editForm.allergies}
                  onChange={(event) =>
                    setEditForm({ ...editForm, allergies: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
                  placeholder="κοτόπουλο, σιτάρι"
                />
              </label>

              <label className="text-sm font-medium text-black md:col-span-2">
                Σημειώσεις υγείας
                <input
                  value={editForm.health_issues}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      health_issues: event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
                  placeholder="ευαίσθητη πέψη, απώλεια βάρους"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={isSavingContext}
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isSavingContext ? "Αποθήκευση..." : "Αποθήκευση προφίλ"}
              </button>

              {contextMessage && (
                <p className="text-sm text-gray-700">{contextMessage}</p>
              )}
            </div>
          </form>
        )}

        {latest && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-black">
                  Τελευταία ανάλυση
                </h2>
                <p className="mt-1 text-sm text-gray-700">
                  {new Date(latest.createdAt).toLocaleString()}
                </p>
              </div>

              <span className="rounded-full border border-green-300 bg-white px-3 py-1 text-sm font-semibold text-green-800">
                {getReportReadiness(latest)}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-gray-600">Θερμίδες ηρεμίας</p>
                <p className="mt-1 text-xl font-semibold text-black">
                  {latest.rer} kcal
                </p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-gray-600">Ημερήσιος στόχος</p>
                <p className="mt-1 text-xl font-semibold text-black">
                  {latest.mer} kcal
                </p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-gray-600">Fit τροφής</p>
                <p className="mt-1 text-xl font-semibold text-black">
                  {getFoodScoreLabel(latest.food_score)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Βασισμένο στην αποθηκευμένη τροφή και το προφίλ κατοικιδίου.
                </p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-gray-600">Ποσότητα τροφής</p>
                <p className="mt-1 text-xl font-semibold text-black">
                  {latest.feeding_grams_per_day
                    ? `${latest.feeding_grams_per_day}g/ημέρα`
                    : "-"}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-green-200 bg-white p-4">
                <p className="text-sm font-semibold text-black">Στοιχεία τροφής</p>
                <p className="mt-2 text-sm text-gray-700">
                  Τροφή:{" "}
                  <span className="font-semibold">
                    {latest.matched_food_name ?? "Δεν έχει ταιριάξει τροφή"}
                  </span>
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  Στόχος βάρους:{" "}
                  <span className="font-semibold">
                    {latest.weight_goal ?? "-"}
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-green-200 bg-white p-4">
                <p className="text-sm font-semibold text-black">Επόμενα βήματα</p>
                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                  {getLatestAnalysisNextSteps(latest).map((step) => (
                    <li key={step}>- {step}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                href={`/account/chatbot?petId=${pet.id}&mode=progress`}
                className="rounded-xl border border-green-300 bg-white px-4 py-2 text-center text-sm font-medium text-green-800 transition hover:bg-green-100"
              >
                Έλεγχος προόδου
              </Link>
              <Link
                href={`/print/pet-report/${pet.id}`}
                className="rounded-xl bg-green-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-green-700"
              >
                Άνοιγμα αναφοράς
              </Link>
              <Link
                href={`/print/pet-timeline/${pet.id}`}
                className="rounded-xl border border-green-300 bg-white px-4 py-2 text-center text-sm font-medium text-green-800 transition hover:bg-green-100"
              >
                Άνοιγμα ιστορικού
              </Link>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-blue-950">
                Ιστορικό προόδου
              </h2>
              <p className="mt-1 text-sm text-blue-900">
                Σημειώσεις από check-ins του chatbot, χρήσιμες για παρακολούθηση
                βάρους και αποδοχής τροφής.
              </p>
            </div>
            <Link
              href={`/account/chatbot?petId=${pet.id}&mode=progress`}
              className="rounded-xl bg-blue-700 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-blue-800"
            >
              Νέο check-in
            </Link>
          </div>

          {progressLogs.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-blue-300 bg-white p-5 text-sm text-blue-900">
              Δεν υπάρχουν check-ins ακόμη. Άνοιξε το chatbot, διάλεξε αυτό το
              κατοικίδιο και χρησιμοποίησε έλεγχο προόδου.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {progressLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-blue-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-black">
                        {formatProgressMode(log.metadata?.mode)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                    {log.metadata?.currentWeightKg && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-900">
                        {log.metadata.currentWeightKg} kg
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-700">
                        {log.metadata?.previousWeightKg && (
                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        Προηγούμενο βάρος {log.metadata.previousWeightKg} kg
                      </span>
                    )}
                    {log.metadata?.feedingGramsPerDay && (
                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        {log.metadata.feedingGramsPerDay}g/ημέρα
                      </span>
                    )}
                    {log.metadata?.treatsPerDay && (
                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        Λιχουδιές: {log.metadata.treatsPerDay}
                      </span>
                    )}
                    {log.metadata?.progressDecisionStatus && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-900">
                        Απόφαση: {formatProgressChipLabel(log.metadata.progressDecisionStatus)}
                      </span>
                    )}
                    {log.metadata?.progressDecisionConfidence && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-900">
                        Πώς το βλέπουμε:{" "}
                        {formatProgressDecisionConfidence(
                          log.metadata.progressDecisionConfidence
                        )}
                      </span>
                    )}
                    {getProgressContextChips(log.metadata).map((chip) => (
                      <span key={chip} className="rounded-full bg-gray-100 px-3 py-1">
                        {chip}
                      </span>
                    ))}
                  </div>

                  {(log.metadata?.progressDecisionHeadlineEn ||
                    log.metadata?.progressDecisionHeadlineEl) && (
                    <p className="mt-3 text-sm font-semibold text-blue-950">
                      {log.metadata.progressDecisionHeadlineEn ??
                        log.metadata.progressDecisionHeadlineEl}
                    </p>
                  )}

                  {log.metadata?.note && (
                    <p className="mt-3 text-sm text-gray-700">
                      {log.metadata.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-black">Ιστορικό αναλύσεων</h2>

          {analysisHistory.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">
              <p className="font-semibold text-black">Δεν υπάρχει ιστορικό ανάλυσης ακόμη</p>
              <p className="mt-2 text-sm text-gray-600">
                Κάνε νέα ανάλυση για να δημιουργηθεί το πρώτο διατροφικό report
                και η πρώτη εγγραφή ιστορικού.
              </p>
              <Link
                href={`/account/chatbot?petId=${pet.id}`}
                className="mt-4 inline-block rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Νέα ανάλυση
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {analysisHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <p className="font-semibold text-black">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    Θερμίδες ηρεμίας {item.rer} kcal - ημερήσιος στόχος {item.mer} kcal
                  </p>
                  {hasValidFoodScore(item.food_score) && (
                  <p className="mt-1 text-sm text-gray-700">
                    Fit τροφής: {getFoodScoreLabel(item.food_score)}
                  </p>
                )}

                {item.feeding_grams_per_day && (
                  <p className="mt-1 text-sm text-gray-700">
                    Μερίδα: {item.feeding_grams_per_day}g/ημέρα
                  </p>
                )}

                {item.matched_food_name && (
                  <p className="mt-1 text-xs text-gray-500">
                    Τροφή: {item.matched_food_name}
                  </p>
                )}
                  <p className="mt-1 text-xs text-gray-500">
                    Πρόταση τροφής:{" "}
                    {item.matched_food_name
                      ? "αποθηκεύτηκε με αυτή την ανάλυση"
                      : "διάλεξε τροφή στο chatbot για πιο συγκεκριμένη συμβουλή"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
  );
}
