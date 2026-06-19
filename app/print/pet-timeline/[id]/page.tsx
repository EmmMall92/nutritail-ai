"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { getBrandSettings, type BrandSettings } from "@/lib/brand";
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
  if (value === "no_result") return "No visible result";
  if (value === "progress") return "Progress check";
  return "Progress note";
}

function getTimelineUseNotes(
  progressLogs: ProgressLog[],
  history: PetAnalysisHistory[]
) {
  const notes = [
    "Compare weight, appetite, stool, treats, and energy between check-ins instead of judging from one day.",
    "Use the same scale and similar weighing conditions whenever possible.",
    "Bring the current daily grams and any food refusal notes into the next chatbot Progress check.",
  ];

  if (progressLogs.length === 0) {
    notes.push("Add the first chatbot Progress check after 2-4 weeks on a new plan.");
  }

  if (history.length <= 1) {
    notes.push("A second saved analysis will make trend comparison more useful.");
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
      console.error("Failed to load pet timeline report:", error);
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
          <p className="text-gray-600">Loading timeline report...</p>
        </div>
      </main>
    );
  }

  if (!pet || !analysis || !brandSettings) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-red-200 bg-red-50 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-black">
            No timeline report available
          </h1>
          <p className="mt-2 text-red-700">
            The selected pet could not be loaded.
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
                Pet Nutrition Timeline Report
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Timeline and change summary for {pet.name}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Generated on {new Date().toLocaleString()}
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
        <InfoCard label="Pet" value={pet.name} detail={pet.species} />
        <InfoCard label="Weight" value={`${pet.weight} kg`} />
        <InfoCard label="RER" value={`${nutrition.rer} kcal`} />
        <InfoCard label="MER/DER" value={`${nutrition.der} kcal`} />
      </section>

      <Section title="Pet Profile">
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <p><span className="font-semibold">Species:</span> {pet.species}</p>
          <p><span className="font-semibold">Breed:</span> {pet.breed}</p>
          <p><span className="font-semibold">Age:</span> {pet.age}</p>
          <p><span className="font-semibold">Activity Level:</span> {pet.activityLevel}</p>
          <p><span className="font-semibold">Neutered:</span> {pet.neutered ? "Yes" : "No"}</p>
          <p>
            <span className="font-semibold">Allergies:</span>{" "}
            {pet.allergies && pet.allergies.length > 0
                ? pet.allergies.join(", ")
                : "None"}
          </p>
          <p className="md:col-span-2">
            <span className="font-semibold">Health Issues:</span>{" "}
            {pet.healthIssues && pet.healthIssues.length > 0
                ? pet.healthIssues.join(", ")
                : "None"}
          </p>
        </div>
      </Section>

      <Section title="Latest Nutrition Summary">
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <p><span className="font-semibold">Protein:</span> {nutrition.protein}</p>
          <p><span className="font-semibold">Fat:</span> {nutrition.fat}</p>
          <p><span className="font-semibold">Fiber:</span> {nutrition.fiber}</p>
          <p><span className="font-semibold">Sodium:</span> {nutrition.sodium}</p>
          <p><span className="font-semibold">Magnesium:</span> {nutrition.magnesium}</p>
          <p><span className="font-semibold">Calcium:</span> {nutrition.calcium}</p>
          <p><span className="font-semibold">Phosphorus:</span> {nutrition.phosphorus}</p>
        </div>
      </Section>

      {latestComparison && (
        <Section title="Latest Change Summary">
          <div className="space-y-2 text-sm">
            {latestComparison.summary.map((item, index) => (
              <p key={index}>- {item}</p>
            ))}
            <p>
              <span className="font-semibold">MER delta:</span>{" "}
              {latestComparison.merDelta > 0 ? "+" : ""}
              {latestComparison.merDelta}
            </p>
            <p>
              <span className="font-semibold">Weight delta:</span>{" "}
              {latestComparison.weightDelta === undefined
                ? "-"
                : `${latestComparison.weightDelta > 0 ? "+" : ""}${latestComparison.weightDelta}`}
            </p>
          </div>
        </Section>
      )}

      <Section title="Progress at a Glance">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard
            label="Saved analyses"
            value={history.length}
            detail="Nutrition snapshots"
          />
          <InfoCard
            label="Progress checks"
            value={progressLogs.length}
            detail="Chatbot follow-ups"
          />
          <InfoCard
            label="Latest check weight"
            value={
              latestProgressLog?.metadata?.currentWeightKg
                ? `${latestProgressLog.metadata.currentWeightKg} kg`
                : "-"
            }
            detail={
              latestProgressLog
                ? formatDate(latestProgressLog.created_at)
                : "No saved check-in yet"
            }
          />
          <InfoCard
            label="Latest daily grams"
            value={
              latestProgressLog?.metadata?.feedingGramsPerDay
                ? `${latestProgressLog.metadata.feedingGramsPerDay}g`
                : "-"
            }
            detail="From latest progress check"
          />
        </div>
      </Section>

      <Section title="Progress Check-ins">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
          <p className="font-semibold">How to use this timeline</p>
          <ul className="mt-2 space-y-1">
            {getTimelineUseNotes(progressLogs, history).map((note) => (
              <li key={note}>- {note}</li>
            ))}
          </ul>
        </div>

        {progressLogs.length === 0 ? (
          <p className="text-sm text-gray-600">
            No chatbot progress check-ins have been saved yet.
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
                      Current {log.metadata.currentWeightKg} kg
                    </span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <p>
                    <span className="font-semibold">Previous weight:</span>{" "}
                    {log.metadata?.previousWeightKg
                      ? `${log.metadata.previousWeightKg} kg`
                      : "-"}
                  </p>
                  <p>
                    <span className="font-semibold">Feeding:</span>{" "}
                    {log.metadata?.feedingGramsPerDay
                      ? `${log.metadata.feedingGramsPerDay}g/day`
                      : "-"}
                  </p>
                  <p className="md:col-span-2">
                    <span className="font-semibold">Treats:</span>{" "}
                    {log.metadata?.treatsPerDay || "-"}
                  </p>
                </div>

                {log.metadata?.note && (
                  <p className="mt-3 text-gray-700">{log.metadata.note}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Analysis Timeline">
        {history.length === 0 ? (
          <p className="text-sm text-gray-600">No analysis history available.</p>
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
                  <p><span className="font-semibold">RER:</span> {item.rer}</p>
                  <p><span className="font-semibold">MER:</span> {item.mer}</p>
                  <p><span className="font-semibold">Weight:</span> {item.weight ?? "-"} kg</p>
                  <p><span className="font-semibold">Age:</span> {item.age ?? "-"}</p>
                  <p><span className="font-semibold">Activity:</span> {item.activityLevel ?? "-"}</p>
                  <p><span className="font-semibold">Neutered:</span> {item.neutered === undefined ? "-" : item.neutered ? "Yes" : "No"}</p>
                </div>

                <p className="mt-2">
                  <span className="font-semibold">Allergies:</span>{" "}
                    {item.allergies && item.allergies.length > 0
                    ? item.allergies.join(", ")
                    : "None"}                
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Health Issues:</span>{" "}
                 {item.healthIssues && item.healthIssues.length > 0
                        ? item.healthIssues.join(", ")
                        : "None"}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Food recommendation:</span>{" "}
                  Saved with this analysis in the chatbot report.
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Latest AI Nutrition Advice">
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

      <Section title="Latest Saved Food Insights">
        <p className="mb-4 text-sm text-gray-600">
          These foods were saved with the latest timeline analysis as useful
          nutrition context. For a fresh shopping shortlist, run a new chatbot
          recommendation with the pet&apos;s current weight, food, and preferences.
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
                {item.food.species} - {item.food.lifeStage} - protein{" "}
                {item.food.protein}% - fat {item.food.fat}%
              </p>
              <p className="mt-2 text-sm">
                <span className="font-semibold">Why it appeared:</span>{" "}
                {item.reasons.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
