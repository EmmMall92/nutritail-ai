"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { getBrandSettings, type BrandSettings } from "@/lib/brand";
import { localizeNutritionAdviceNotes } from "@/lib/chatbot/nutritionAdvicePresentation";
import {
  formatCustomerActivity,
  formatCustomerBreed,
  formatCustomerSpecies,
  formatCustomerWeightGoal,
} from "@/lib/petCustomerLabels";
import { formatCustomerPetName } from "@/lib/petName";
import { formatProgressDecisionConfidence } from "@/lib/progressDecisionCopy";
import { comparePetAnalyses } from "@/services/petAnalysisComparisonService";
import type { Pet } from "@/types/pet";
import type { PetAnalysisHistory } from "@/types/pet-analysis-history";

type ProgressLog = {
  id: string;
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

type PrintablePetPayload = Partial<Pet> & {
  owner_id?: string | null;
  activity_level?: string | null;
  health_issues?: unknown;
  analyses?: unknown[];
  progressLogs?: ProgressLog[];
};

type PrintableHistoryPayload = Partial<PetAnalysisHistory> & {
  pet_id?: string | null;
  owner_id?: string | null;
  recommended_food_ids?: unknown;
  activity_level?: string | null;
  health_issues?: unknown;
  food_score?: number | null;
  matched_food_id?: string | null;
  matched_food_name?: string | null;
  feeding_grams_per_day?: number | null;
  weight_goal?: string | null;
  created_at?: string | null;
};

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function normalizePrintablePet(payload: PrintablePetPayload): Pet {
  const activityLevel = payload.activityLevel ?? payload.activity_level;

  return {
    id: String(payload.id ?? ""),
    ownerId: String(payload.ownerId ?? payload.owner_id ?? ""),
    name: String(payload.name ?? "Κατοικίδιο"),
    species: payload.species === "cat" ? "cat" : "dog",
    breed: String(payload.breed ?? ""),
    age: Number(payload.age ?? 0),
    weight: Number(payload.weight ?? 0),
    activityLevel:
      activityLevel === "low" ||
      activityLevel === "normal" ||
      activityLevel === "high"
        ? activityLevel
        : "normal",
    neutered: Boolean(payload.neutered),
    allergies: normalizeStringArray(payload.allergies),
    healthIssues: normalizeStringArray(
      payload.healthIssues ?? payload.health_issues
    ),
  };
}

function normalizePrintableHistory(
  payload: PrintableHistoryPayload
): PetAnalysisHistory {
  return {
    id: String(payload.id ?? ""),
    petId: String(payload.petId ?? payload.pet_id ?? ""),
    ownerId: String(payload.ownerId ?? payload.owner_id ?? ""),
    rer: Number(payload.rer ?? 0),
    mer: Number(payload.mer ?? 0),
    recommendedFoodIds: normalizeStringArray(
      payload.recommendedFoodIds ?? payload.recommended_food_ids
    ),
    notes: payload.notes,
    weight:
      typeof payload.weight === "number" && Number.isFinite(payload.weight)
        ? payload.weight
        : undefined,
    age:
      typeof payload.age === "number" && Number.isFinite(payload.age)
        ? payload.age
        : undefined,
    activityLevel: payload.activityLevel ?? payload.activity_level ?? undefined,
    neutered: payload.neutered,
    allergies: normalizeStringArray(payload.allergies),
    healthIssues: normalizeStringArray(
      payload.healthIssues ?? payload.health_issues
    ),
    foodScore: payload.foodScore ?? payload.food_score ?? null,
    matchedFoodId: payload.matchedFoodId ?? payload.matched_food_id ?? null,
    matchedFoodName: payload.matchedFoodName ?? payload.matched_food_name ?? null,
    feedingGramsPerDay:
      payload.feedingGramsPerDay ?? payload.feeding_grams_per_day ?? null,
    weightGoal: payload.weightGoal ?? payload.weight_goal ?? null,
    createdAt: String(payload.createdAt ?? payload.created_at ?? ""),
  };
}

function InfoCard({
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="break-inside-avoid space-y-3 rounded-xl border border-gray-200 bg-white p-6 print:border-gray-300">
      <h2 className="text-lg font-semibold text-black">{title}</h2>
      {children}
    </section>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
}

function formatProgressMode(value?: string) {
  if (value === "no_result") return "Χωρίς ορατό αποτέλεσμα";
  if (value === "progress") return "Έλεγχος προόδου";
  return "Σημείωση προόδου";
}

function getProgressDecisionHeadline(log: ProgressLog) {
  return (
    log.metadata?.progressDecisionHeadlineEl ??
    log.metadata?.progressDecisionHeadlineEn ??
    null
  );
}

function getTimelineUseNotes(
  progressLogs: ProgressLog[],
  history: PetAnalysisHistory[]
) {
  const notes = [
    "Σύγκρινε βάρος, όρεξη, κόπρανα, λιχουδιές και ενέργεια ανάμεσα στους ελέγχους προόδου αντί να κρίνεις από μία ημέρα.",
    "Χρησιμοποίησε την ίδια ζυγαριά και όσο γίνεται παρόμοιες συνθήκες ζυγίσματος.",
    "Φέρε τα τωρινά ημερήσια γραμμάρια και τυχόν άρνηση τροφής στον επόμενο έλεγχο προόδου.",
  ];

  if (progressLogs.length === 0) {
    notes.push("Πρόσθεσε τον πρώτο έλεγχο προόδου μετά από 2-4 εβδομάδες σε νέο πλάνο.");
  }

  if (history.length <= 1) {
    notes.push("Μια δεύτερη αποθηκευμένη ανάλυση θα κάνει τη σύγκριση τάσης πιο χρήσιμη.");
  }

  return notes;
}

function getLatestProgressLog(progressLogs: ProgressLog[]) {
  return [...progressLogs].sort((a, b) => {
    const aDate = new Date(a.created_at).getTime();
    const bDate = new Date(b.created_at).getTime();

    return bDate - aDate;
  })[0];
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

function getProgressTimelineSummary(log: ProgressLog) {
  const headline = getProgressDecisionHeadline(log);
  const grams = log.metadata?.feedingGramsPerDay
    ? `${log.metadata.feedingGramsPerDay}g/ημέρα`
    : null;
  const weight = log.metadata?.currentWeightKg
    ? `${log.metadata.currentWeightKg} kg`
    : null;
  const status = formatProgressChipLabel(log.metadata?.progressDecisionStatus);

  if (headline) return headline;
  if (status && grams) return `${status}: κρατάμε ως βάση τα ${grams}.`;
  if (status && weight) return `${status}: τελευταίο βάρος ${weight}.`;
  if (grams) return `Καταγράφηκε έλεγχος με ποσότητα ${grams}.`;

  return "Καταγράφηκε έλεγχος προόδου για το επόμενο βήμα.";
}

export default function PetTimelineReportPage() {
  const params = useParams<{ id: string }>();
  const petId = params?.id ?? "";
  const [pet, setPet] = useState<Pet | null>(null);
  const [history, setHistory] = useState<PetAnalysisHistory[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [brandSettings, setBrandSettings] = useState<BrandSettings | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<{
    status: number;
    message: string;
  } | null>(null);

  const loadPage = useCallback(async () => {
    try {
      setIsLoaded(false);
      setLoadError(null);
      setBrandSettings(getBrandSettings());

      const printResponse = await fetch(`/api/print/pet-report/${petId}`, {
        cache: "no-store",
      });

      const printResult = await printResponse.json();

      if (!printResponse.ok || !printResult.pet) {
        setLoadError({
          status: printResponse.status,
          message: String(printResult.error ?? "Δεν ήταν δυνατή η φόρτωση του ιστορικού."),
        });
        return;
      }

      const printablePet = printResult.pet as PrintablePetPayload;
      const loadedPet = normalizePrintablePet(printablePet);
      setPet(loadedPet);

      const historyResult = (printablePet.analyses ?? []).map((item) =>
        normalizePrintableHistory(item as PrintableHistoryPayload)
      );

      setHistory(historyResult);
      setProgressLogs(printablePet.progressLogs ?? []);
    } catch (error) {
      console.error("Δεν μπόρεσα να φορτώσω την αναφορά ιστορικού:", error);
      setLoadError({
        status: 0,
        message: "Δεν ήταν δυνατή η σύνδεση. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.",
      });
    } finally {
      setIsLoaded(true);
    }
  }, [petId]);

  useEffect(() => {
    if (petId) {
      loadPage();
    } else {
        setIsLoaded(true);
    }
  }, [loadPage, petId]);

  useEffect(() => {
    if (!isLoaded || !pet || !brandSettings) return;

    const timer = setTimeout(() => {
      window.print();
    }, 400);

    return () => clearTimeout(timer);
  }, [isLoaded, pet, brandSettings]);

  const latestComparison = useMemo(() => {
    if (history.length < 2) return null;
    return comparePetAnalyses(history[1], history[0]);
  }, [history]);

  const latestProgressLog = useMemo(
    () => getLatestProgressLog(progressLogs),
    [progressLogs]
  );
  const latestHistory = history[0] ?? null;

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-gray-600">Φορτώνω το ιστορικό προόδου...</p>
        </div>
      </main>
    );
  }

  if (loadError || !pet || !brandSettings) {
    const needsLogin = loadError?.status === 401;

    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase text-red-700">
            Χρειάζεται μια μικρή ενέργεια
          </p>
          <h1 className="text-2xl font-bold text-black">
            {needsLogin
              ? "Συνδέσου για να δεις το ιστορικό"
              : "Δεν φορτώθηκε το ιστορικό"}
          </h1>
          <p className="mt-3 text-gray-700">
            {needsLogin
              ? "Η αναφορά είναι ιδιωτική και εμφανίζεται μόνο στον λογαριασμό που ανήκει το κατοικίδιο."
              : loadError?.message ?? "Δεν μπόρεσα να φορτώσω το επιλεγμένο κατοικίδιο."}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {needsLogin ? (
              <a
                href={`/login?next=${encodeURIComponent(`/print/pet-timeline/${petId}`)}`}
                className="rounded-xl bg-black px-5 py-3 font-semibold text-white"
              >
                Σύνδεση
              </a>
            ) : (
              <button
                type="button"
                onClick={loadPage}
                className="rounded-xl bg-black px-5 py-3 font-semibold text-white"
              >
                Δοκίμασε ξανά
              </button>
            )}
            <a
              href="/account"
              className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-black"
            >
              Επιστροφή στον λογαριασμό
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl space-y-6 bg-gray-50 p-4 text-black sm:p-8 print:max-w-none print:bg-white print:p-0">
      <header className="rounded-xl border border-gray-200 bg-white p-6 print:border-gray-300 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            {brandSettings.logoDataUrl ? (
              <Image
                src={brandSettings.logoDataUrl}
                alt={`${brandSettings.appName} logo`}
                width={64}
                height={64}
                unoptimized
                className="h-16 w-16 rounded-2xl border border-gray-200 object-cover bg-white"
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 text-lg font-bold text-white"
                style={{ backgroundColor: brandSettings.accentColor }}
              >
                {brandSettings.logoText || "NT"}
              </div>
            )}

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                {brandSettings.appName}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-black">
                Ιστορικό διατροφής κατοικιδίου
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Ιστορικό και περίληψη αλλαγών για {formatCustomerPetName(pet.name)}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Δημιουργήθηκε στις {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm">
            <p className="font-semibold text-black">{brandSettings.businessName}</p>
            <p className="mt-1 text-gray-700">{brandSettings.address}</p>
            <p className="text-gray-700">{brandSettings.contactPhone}</p>
            <p className="text-gray-700">{brandSettings.contactEmail}</p>
            <p className="text-gray-700">{brandSettings.website}</p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          label="Κατοικίδιο"
          value={formatCustomerPetName(pet.name)}
          detail={formatCustomerSpecies(pet.species)}
        />
        <InfoCard label="Βάρος" value={`${pet.weight} kg`} />
        <InfoCard
          label="Θερμίδες ηρεμίας"
          value={latestHistory ? `${latestHistory.rer} kcal` : "-"}
          detail="Βασική ενέργεια πριν από προσαρμογές"
        />
        <InfoCard
          label="Ημερήσιος στόχος"
          value={latestHistory ? `${latestHistory.mer} kcal` : "-"}
          detail="Πρακτικές θερμίδες για το τωρινό πλάνο"
        />
      </section>

      <Section title="Προφίλ κατοικιδίου">
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <p><span className="font-semibold">Είδος:</span> {formatCustomerSpecies(pet.species)}</p>
          <p><span className="font-semibold">Ράτσα:</span> {formatCustomerBreed(pet.breed)}</p>
          <p><span className="font-semibold">Ηλικία:</span> {pet.age}</p>
          <p><span className="font-semibold">Δραστηριότητα:</span> {formatCustomerActivity(pet.activityLevel)}</p>
          <p><span className="font-semibold">Στειρωμένο:</span> {pet.neutered ? "Ναι" : "Όχι"}</p>
          <p>
            <span className="font-semibold">Αλλεργίες:</span>{" "}
            {pet.allergies && pet.allergies.length > 0
                ? pet.allergies.join(", ")
                : "Καμία"}
          </p>
          <p className="md:col-span-2">
            <span className="font-semibold">Θέματα υγείας:</span>{" "}
            {pet.healthIssues && pet.healthIssues.length > 0
                ? pet.healthIssues.join(", ")
                : "Κανένα"}
          </p>
        </div>
      </Section>

      <Section title="Τελευταίο αποθηκευμένο πλάνο">
        <div
          className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2"
          data-testid="pet-timeline-saved-plan"
        >
          <p>
            <span className="font-semibold">Επιλεγμένη τροφή:</span>{" "}
            {latestHistory?.matchedFoodName ?? "Δεν έχει επιλεγεί τροφή"}
          </p>
          <p>
            <span className="font-semibold">Ημερήσια ποσότητα:</span>{" "}
            {latestHistory?.feedingGramsPerDay
              ? `${latestHistory.feedingGramsPerDay}g/ημέρα`
              : "Δεν έχει υπολογιστεί"}
          </p>
          <p>
            <span className="font-semibold">Στόχος βάρους:</span>{" "}
            {formatCustomerWeightGoal(latestHistory?.weightGoal)}
          </p>
          <p>
            <span className="font-semibold">Καταλληλότητα:</span>{" "}
            {typeof latestHistory?.foodScore === "number"
              ? `${latestHistory.foodScore}/100`
              : "Δεν έχει βαθμολογηθεί"}
          </p>
        </div>
      </Section>

      {latestComparison && (
        <Section title="Τελευταία περίληψη αλλαγών">
          <div className="space-y-2 text-sm">
            {latestComparison.summary.map((item, index) => (
              <p key={index}>- {item}</p>
            ))}
            <p>
              <span className="font-semibold">Αλλαγή ημερήσιου στόχου:</span>{" "}
              {latestComparison.merDelta > 0 ? "+" : ""}
              {latestComparison.merDelta}
            </p>
            <p>
              <span className="font-semibold">Διαφορά βάρους:</span>{" "}
              {latestComparison.weightDelta === undefined
                ? "-"
                : `${latestComparison.weightDelta > 0 ? "+" : ""}${latestComparison.weightDelta}`}
            </p>
          </div>
        </Section>
      )}

      <Section title="Πρόοδος με μια ματιά">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard
            label="Αποθηκευμένες αναλύσεις"
            value={history.length}
            detail="Διατροφικές στιγμές"
          />
          <InfoCard
            label="Έλεγχοι προόδου"
            value={progressLogs.length}
            detail="Σημειώσεις προόδου από τον βοηθό"
          />
          <InfoCard
            label="Τελευταίο βάρος ελέγχου"
            value={
              latestProgressLog?.metadata?.currentWeightKg
                ? `${latestProgressLog.metadata.currentWeightKg} kg`
                : "-"
            }
            detail={
              latestProgressLog
                ? formatDate(latestProgressLog.created_at)
                : "Δεν υπάρχει αποθηκευμένος έλεγχος προόδου ακόμη"
            }
          />
          <InfoCard
            label="Τελευταία ημερήσια γραμμάρια"
            value={
              latestProgressLog?.metadata?.feedingGramsPerDay
                ? `${latestProgressLog.metadata.feedingGramsPerDay}g`
                : "-"
            }
            detail="Από τον τελευταίο έλεγχο προόδου"
          />
        </div>
      </Section>

      <Section title="Έλεγχοι προόδου">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
          <p className="font-semibold">Πώς να χρησιμοποιήσεις αυτό το ιστορικό</p>
          <ul className="mt-2 space-y-1">
            {getTimelineUseNotes(progressLogs, history).map((note) => (
              <li key={note}>- {note}</li>
            ))}
          </ul>
        </div>

        {progressLogs.length === 0 ? (
          <p className="text-sm text-gray-600">
            Δεν έχουν αποθηκευτεί ακόμη έλεγχοι προόδου από τον βοηθό.
          </p>
        ) : (
          <div className="space-y-4">
            {progressLogs.map((log) => (
              <div
                key={log.id}
                className="break-inside-avoid rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm print:border-gray-300"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-black">
                      {formatProgressMode(log.metadata?.mode)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(log.created_at)}
                    </p>
                  </div>
                  {log.metadata?.currentWeightKg && (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-900">
                      Τωρινό βάρος {log.metadata.currentWeightKg} kg
                    </span>
                  )}
                </div>

                <div
                  className="mt-3 rounded-xl border border-blue-100 bg-white p-3 text-blue-950"
                  data-testid="timeline-progress-customer-summary"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Τι κρατάμε
                  </p>
                  <p className="mt-1 font-semibold">
                    {getProgressTimelineSummary(log)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-blue-900">
                    Χρησιμοποίησέ το σαν συνέχεια του πλάνου, μαζί με βάρος,
                    γραμμάρια, λιχουδιές, όρεξη και κόπρανα.
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <p>
                    <span className="font-semibold">Προηγούμενο βάρος:</span>{" "}
                    {log.metadata?.previousWeightKg
                      ? `${log.metadata.previousWeightKg} kg`
                      : "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Μερίδα:</span>{" "}
                    {log.metadata?.feedingGramsPerDay
                      ? `${log.metadata.feedingGramsPerDay}g/ημέρα`
                      : "-"}
                  </p>
                  <p className="md:col-span-2">
                    <span className="font-semibold">Λιχουδιές:</span>{" "}
                    {log.metadata?.treatsNote
                      ? formatProgressChipLabel(log.metadata.treatsNote)
                      : log.metadata?.treatsPerDay || "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Όρεξη:</span>{" "}
                    {formatProgressChipLabel(log.metadata?.appetiteNote) ?? "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Κόπρανα:</span>{" "}
                    {formatProgressChipLabel(log.metadata?.stoolNote) ?? "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Ενέργεια:</span>{" "}
                    {formatProgressChipLabel(log.metadata?.energyNote) ?? "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Αλλαγή σώματος:</span>{" "}
                    {formatProgressChipLabel(log.metadata?.bodyChangeNote) ?? "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Απόφαση προόδου:</span>{" "}
                    {formatProgressChipLabel(log.metadata?.progressDecisionStatus) ??
                      "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Πώς το βλέπουμε:</span>{" "}
                    {formatProgressDecisionConfidence(
                      log.metadata?.progressDecisionConfidence
                    ) ?? "-"}
                  </p>
                </div>

                {getProgressDecisionHeadline(log) && (
                  <p className="mt-3 font-semibold text-blue-950">
                    {getProgressDecisionHeadline(log)}
                  </p>
                )}

                {log.metadata?.note && (
                  <p className="mt-3 text-gray-700">{log.metadata.note}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Ιστορικό αναλύσεων">
        {history.length === 0 ? (
          <p className="text-sm text-gray-600">Δεν υπάρχει διαθέσιμο ιστορικό ανάλυσης.</p>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="break-inside-avoid rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm print:border-gray-300"
              >
                <p className="font-semibold text-black">
                  {formatDate(item.createdAt)}
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <p>
                    <span className="font-semibold">Θερμίδες ηρεμίας:</span>{" "}
                    {item.rer}
                  </p>
                  <p>
                    <span className="font-semibold">Ημερήσιος στόχος:</span>{" "}
                    {item.mer}
                  </p>
                  <p><span className="font-semibold">Βάρος:</span> {item.weight ?? "-"} kg</p>
                  <p><span className="font-semibold">Ηλικία:</span> {item.age ?? "-"}</p>
                  <p><span className="font-semibold">Δραστηριότητα:</span> {formatCustomerActivity(item.activityLevel)}</p>
                  <p><span className="font-semibold">Στειρωμένο:</span> {item.neutered === undefined ? "-" : item.neutered ? "Ναι" : "Όχι"}</p>
                </div>

                <p className="mt-2">
                  <span className="font-semibold">Αλλεργίες:</span>{" "}
                    {item.allergies && item.allergies.length > 0
                    ? item.allergies.join(", ")
                    : "Καμία"}                
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Θέματα υγείας:</span>{" "}
                 {item.healthIssues && item.healthIssues.length > 0
                        ? item.healthIssues.join(", ")
                        : "Κανένα"}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Πρόταση τροφής:</span>{" "}
                  {item.matchedFoodName ?? "Δεν επιλέχθηκε συγκεκριμένη τροφή"}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Ημερήσια ποσότητα:</span>{" "}
                  {item.feedingGramsPerDay
                    ? `${item.feedingGramsPerDay}g/ημέρα`
                    : "Δεν υπολογίστηκε"}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Στόχος βάρους:</span>{" "}
                  {formatCustomerWeightGoal(item.weightGoal)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Τελευταίες διατροφικές σημειώσεις">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          {localizeNutritionAdviceNotes(latestHistory?.notes, "el") ||
            "Δεν υπάρχουν αποθηκευμένες σημειώσεις για την τελευταία ανάλυση."}
        </div>
      </Section>

      <Section title="Αποθηκευμένη επιλογή τροφής">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
          <p className="font-semibold">
            {latestHistory?.matchedFoodName ?? "Δεν έχει επιλεγεί συγκεκριμένη τροφή"}
          </p>
          <p className="mt-2 text-gray-700">
            Ημερήσια ποσότητα:{" "}
            {latestHistory?.feedingGramsPerDay
              ? `${latestHistory.feedingGramsPerDay}g`
              : "δεν έχει υπολογιστεί"}
          </p>
          <p className="mt-1 text-gray-700">
            Στόχος: {formatCustomerWeightGoal(latestHistory?.weightGoal)}
          </p>
        </div>
      </Section>
    </main>
  );
}
