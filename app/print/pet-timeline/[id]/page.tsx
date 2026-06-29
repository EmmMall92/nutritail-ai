"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { getBrandSettings, type BrandSettings } from "@/lib/brand";
import { formatProgressDecisionConfidence } from "@/lib/progressDecisionCopy";
import { petAnalysisService } from "@/services/petAnalysisService";
import { petAnalysisHistoryService } from "@/services/petAnalysisHistoryService";
import { comparePetAnalyses } from "@/services/petAnalysisComparisonService";
import type { Pet } from "@/types/pet";
import type { PetAnalysis } from "@/types/pet-analysis";
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

export default function PetTimelineReportPage() {
  const params = useParams<{ id: string }>();
  const petId = params?.id ?? "";
  const [pet, setPet] = useState<Pet | null>(null);
  const [analysis, setAnalysis] = useState<PetAnalysis | null>(null);
  const [history, setHistory] = useState<PetAnalysisHistory[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [brandSettings, setBrandSettings] = useState<BrandSettings | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadPage = useCallback(async () => {
    try {
      setBrandSettings(getBrandSettings());

      const petResponse = await fetch(`/api/pets/${petId}`, {
        method: "GET",
        cache: "no-store",
      });

      const petResult = await petResponse.json();

      if (!petResponse.ok) {
        setIsLoaded(true);
        return;
      }

      const loadedPet = petResult as Pet;
      setPet(loadedPet);

      const [analysisResult, historyResult] = await Promise.all([
        petAnalysisService.analyzePet(loadedPet),
        petAnalysisHistoryService.getPetHistory(loadedPet.id),
      ]);

      setAnalysis(analysisResult);
      setHistory(historyResult);

      const progressResponse = await fetch(`/api/print/pet-report/${petId}`, {
        cache: "no-store",
      });

      if (progressResponse.ok) {
        const progressResult = await progressResponse.json();
        setProgressLogs(progressResult.pet?.progressLogs ?? []);
      }
    } catch (error) {
      console.error("Δεν μπόρεσα να φορτώσω την αναφορά ιστορικού:", error);
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
    if (!isLoaded || !pet || !analysis || !brandSettings) return;

    const timer = setTimeout(() => {
      window.print();
    }, 400);

    return () => clearTimeout(timer);
  }, [isLoaded, pet, analysis, brandSettings]);

  const latestComparison = useMemo(() => {
    if (history.length < 2) return null;
    return comparePetAnalyses(history[1], history[0]);
  }, [history]);

  const latestProgressLog = useMemo(
    () => getLatestProgressLog(progressLogs),
    [progressLogs]
  );

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-gray-600">Φορτώνω το ιστορικό προόδου...</p>
        </div>
      </main>
    );
  }

  if (!pet || !analysis || !brandSettings) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-red-200 bg-red-50 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-black">
            Δεν υπάρχει διαθέσιμη αναφορά ιστορικού
          </h1>
          <p className="mt-2 text-red-700">
            Δεν μπόρεσα να φορτώσω το επιλεγμένο κατοικίδιο.
          </p>
        </div>
      </main>
    );
  }

  const { nutrition, advice, recommendedFoods } = analysis;

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
                Ιστορικό και περίληψη αλλαγών για {pet.name}
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
        <InfoCard label="Κατοικίδιο" value={pet.name} detail={pet.species} />
        <InfoCard label="Βάρος" value={`${pet.weight} kg`} />
        <InfoCard
          label="Θερμίδες ηρεμίας"
          value={`${nutrition.rer} kcal`}
          detail="Βασική ενέργεια πριν από προσαρμογές"
        />
        <InfoCard
          label="Ημερήσιος στόχος"
          value={`${nutrition.der} kcal`}
          detail="Πρακτικές θερμίδες για το τωρινό πλάνο"
        />
      </section>

      <Section title="Προφίλ κατοικιδίου">
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <p><span className="font-semibold">Είδος:</span> {pet.species}</p>
          <p><span className="font-semibold">Ράτσα:</span> {pet.breed}</p>
          <p><span className="font-semibold">Ηλικία:</span> {pet.age}</p>
          <p><span className="font-semibold">Δραστηριότητα:</span> {pet.activityLevel}</p>
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

      <Section title="Τελευταία διατροφική περίληψη">
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <p><span className="font-semibold">Πρωτεΐνη:</span> {nutrition.protein}</p>
          <p><span className="font-semibold">Λιπαρά:</span> {nutrition.fat}</p>
          <p><span className="font-semibold">Ίνες:</span> {nutrition.fiber}</p>
          <p><span className="font-semibold">Νάτριο:</span> {nutrition.sodium}</p>
          <p><span className="font-semibold">Μαγνήσιο:</span> {nutrition.magnesium}</p>
          <p><span className="font-semibold">Ασβέστιο:</span> {nutrition.calcium}</p>
          <p><span className="font-semibold">Φώσφορος:</span> {nutrition.phosphorus}</p>
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
            detail="Σημειώσεις προόδου από τον σύμβουλο"
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
            Δεν έχουν αποθηκευτεί ακόμη έλεγχοι προόδου από τον σύμβουλο.
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

                {(log.metadata?.progressDecisionHeadlineEn ||
                  log.metadata?.progressDecisionHeadlineEl) && (
                  <p className="mt-3 font-semibold text-blue-950">
                    {log.metadata.progressDecisionHeadlineEn ??
                      log.metadata.progressDecisionHeadlineEl}
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
                  <p><span className="font-semibold">Δραστηριότητα:</span> {item.activityLevel ?? "-"}</p>
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
                  Αποθηκεύτηκε με αυτή την ανάλυση στο ιστορικό του chatbot.
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Τελευταίες διατροφικές σημειώσεις">
        <div className="space-y-3">
          {advice.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-gray-700">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Τελευταία αποθηκευμένα food insights">
        <p className="mb-4 text-sm text-gray-600">
          Αυτές οι τροφές αποθηκεύτηκαν με την τελευταία ανάλυση ως χρήσιμο
          διατροφικό context. Για νέα λίστα αγοράς, κάνε νέα πρόταση στο chatbot
          με τωρινό βάρος, τροφή και προτιμήσεις.
        </p>
        <div className="space-y-4">
          {recommendedFoods.map((item) => (
            <div
              key={item.food.id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <p className="font-semibold">
                {item.food.brand} - {item.food.name}
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {item.food.species} - {item.food.lifeStage} - πρωτεΐνη{" "}
                {item.food.protein}% - λιπαρά {item.food.fat}%
              </p>
              <p className="mt-2 text-sm">
                <span className="font-semibold">Γιατί εμφανίστηκε:</span>{" "}
                {item.reasons.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
