"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getBrandSettings, type BrandSettings } from "@/lib/brand";
import { getPetSession } from "@/lib/storage";
import { petAnalysisService } from "@/services/petAnalysisService";
import type { PetNutritionSession } from "@/types/nutrition";
import type { PetAnalysis } from "@/types/pet-analysis";

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

export default function PetReportPage() {
  const [session, setSession] = useState<PetNutritionSession | null>(null);
  const [analysis, setAnalysis] = useState<PetAnalysis | null>(null);
  const [brandSettings, setBrandSettings] = useState<BrandSettings | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadReport() {
      const storedSession = getPetSession();
      const settings = getBrandSettings();

      setBrandSettings(settings);

      if (!storedSession) {
        setIsLoaded(true);
        return;
      }

      setSession(storedSession);

      const result = await petAnalysisService.analyzePet(storedSession.pet);
      setAnalysis(result);
      setIsLoaded(true);
    }

    loadReport();
  }, []);

  useEffect(() => {
    if (!isLoaded || !session || !analysis || !brandSettings) return;

    const timer = setTimeout(() => {
      window.print();
    }, 400);

    return () => clearTimeout(timer);
  }, [isLoaded, session, analysis, brandSettings]);

  if (!isLoaded) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-black">Loading report...</p>
          <p className="mt-2 text-sm text-gray-600">
            We are preparing the printable nutrition report.
          </p>
        </div>
      </main>
    );
  }

  if (!session || !analysis || !brandSettings) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold text-black">No report data available</h1>
        <p className="mt-2 text-gray-600">
          Create or open a pet profile first, then try again.
        </p>
      </main>
    );
  }

  const { pet } = session;
  const { nutrition, advice, recommendedFoods } = analysis;

  return (
    <main className="mx-auto max-w-5xl space-y-6 bg-gray-50 px-8 py-10 text-black print:bg-white print:px-0 print:py-0">
      <header className="rounded-2xl border border-gray-200 bg-white p-8">
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
              <h1 className="mt-2 text-3xl font-bold">
                Personalized Pet Nutrition Report
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {brandSettings.tagline}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Generated on {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm">
            <p className="font-semibold text-black">
              {brandSettings.businessName}
            </p>
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
          <p>
            <span className="font-semibold">Species:</span> {pet.species}
          </p>
          <p>
            <span className="font-semibold">Breed:</span> {pet.breed}
          </p>
          <p>
            <span className="font-semibold">Age:</span> {pet.age}
          </p>
          <p>
            <span className="font-semibold">Activity Level:</span>{" "}
            {pet.activityLevel}
          </p>
          <p>
            <span className="font-semibold">Neutered:</span>{" "}
            {pet.neutered ? "Yes" : "No"}
          </p>
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

      <Section title="Nutrition Summary">
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <p>
            <span className="font-semibold">Protein:</span> {nutrition.protein}
          </p>
          <p>
            <span className="font-semibold">Fat:</span> {nutrition.fat}
          </p>
          <p>
            <span className="font-semibold">Fiber:</span> {nutrition.fiber}
          </p>
          <p>
            <span className="font-semibold">Sodium:</span> {nutrition.sodium}
          </p>
          <p>
            <span className="font-semibold">Magnesium:</span>{" "}
            {nutrition.magnesium}
          </p>
          <p>
            <span className="font-semibold">Calcium:</span> {nutrition.calcium}
          </p>
          <p>
            <span className="font-semibold">Phosphorus:</span>{" "}
            {nutrition.phosphorus}
          </p>
        </div>
      </Section>

      <Section title="AI Nutrition Advice">
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

      <Section title="Recommended Foods">
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
                {item.food.species} / {item.food.lifeStage} / protein{" "}
                {item.food.protein}% / fat {item.food.fat}%
              </p>
              <p className="mt-2 text-sm">
                <span className="font-semibold">Recommendation reasons:</span>{" "}
                {item.reasons.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <footer className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-semibold text-black">
              {brandSettings.businessName}
            </p>
            <p className="mt-2">
              This report was generated by {brandSettings.appName} as a
              structured nutrition guidance summary based on the active pet
              profile.
            </p>
          </div>

          <div className="text-sm md:text-right">
            <p>{brandSettings.address}</p>
            <p>{brandSettings.contactPhone}</p>
            <p>{brandSettings.contactEmail}</p>
            <p>{brandSettings.website}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
