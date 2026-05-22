"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getBrandSettings, type BrandSettings } from "@/lib/brand";
import { petAnalysisService } from "@/services/petAnalysisService";
import { petAnalysisHistoryService } from "@/services/petAnalysisHistoryService";
import { comparePetAnalyses } from "@/services/petAnalysisComparisonService";
import type { Pet } from "@/types/pet";
import type { PetAnalysis } from "@/types/pet-analysis";
import type { PetAnalysisHistory } from "@/types/pet-analysis-history";

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-black">{value}</p>
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
    <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-black">{title}</h2>
      {children}
    </section>
  );
}

export default function PetTimelineReportPage() {
  const params = useParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [analysis, setAnalysis] = useState<PetAnalysis | null>(null);
  const [history, setHistory] = useState<PetAnalysisHistory[]>([]);
  const [brandSettings, setBrandSettings] = useState<BrandSettings | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadPage() {
      try {
        setBrandSettings(getBrandSettings());

        const petResponse = await fetch(`/api/pets/${params.id}`, {
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
      } catch (error) {
        console.error("Failed to load pet timeline report:", error);
      } finally {
        setIsLoaded(true);
      }
    }

    if (params?.id) {
      loadPage();
    }
  }, [params]);

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

  if (!isLoaded) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        Loading timeline report...
      </main>
    );
  }

  if (!pet || !analysis || !brandSettings) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold text-black">No timeline report available</h1>
        <p className="mt-2 text-gray-600">
          The selected pet could not be loaded.
        </p>
      </main>
    );
  }

  const { nutrition, advice, recommendedFoods } = analysis;

  return (
    <main className="mx-auto max-w-5xl space-y-6 bg-gray-50 px-8 py-10 text-black print:bg-white print:px-0 print:py-0">
      <header className="rounded-2xl border border-gray-200 bg-white p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            {brandSettings.logoDataUrl ? (
              <img
                src={brandSettings.logoDataUrl}
                alt={`${brandSettings.appName} logo`}
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
              <h1 className="mt-2 text-3xl font-bold">
                Pet Nutrition Timeline Report
              </h1>
              <p className="mt-2 text-sm text-gray-600">
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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <InfoCard label="Pet Name" value={pet.name} />
        <InfoCard label="Weight" value={`${pet.weight} kg`} />
        <InfoCard label="RER" value={`${nutrition.rer} kcal`} />
        <InfoCard label="DER" value={`${nutrition.der} kcal`} />
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
              <p key={index}>• {item}</p>
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

      <Section title="Analysis Timeline">
        {history.length === 0 ? (
          <p className="text-sm text-gray-600">No analysis history available.</p>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm"
              >
                <p className="font-semibold text-black">
                  {new Date(item.createdAt).toLocaleString()}
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
                  <span className="font-semibold">Recommended Food IDs:</span>{" "}
                  {item.recommendedFoodIds.length > 0
                    ? item.recommendedFoodIds.join(", ")
                    : "None"}
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

      <Section title="Latest Recommended Foods">
        <div className="space-y-4">
          {recommendedFoods.map((item) => (
            <div
              key={item.food.id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <p className="font-semibold">
                {item.food.brand} — {item.food.name}
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {item.food.species} • {item.food.lifeStage} • protein {item.food.protein}% • fat {item.food.fat}%
              </p>
              <p className="mt-2 text-sm">
                <span className="font-semibold">Recommendation reasons:</span>{" "}
                {item.reasons.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}