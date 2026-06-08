"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

type PetDetailResponse = {
  pet: AccountPet;
  analysisHistory: AnalysisHistoryItem[];
};

function hasValidFoodScore(score?: number | null) {
  return typeof score === "number" && Number.isFinite(score);
}

function getFoodScoreLabel(score?: number | null) {
  if (!hasValidFoodScore(score)) return "Not scored";
  const numericScore = Number(score);
  if (numericScore >= 80) return "Strong match";
  if (numericScore >= 60) return "Good match";
  if (numericScore >= 40) return "Needs review";
  return "Low match";
}

function getReportReadiness(item?: AnalysisHistoryItem) {
  if (!item) return "No report yet";
  if (item.matched_food_name && item.feeding_grams_per_day) {
    return "Ready to share";
  }
  if (item.matched_food_name || item.feeding_grams_per_day) {
    return "Useful with notes";
  }
  return "General guidance only";
}

function getLatestAnalysisNextSteps(item?: AnalysisHistoryItem) {
  const steps = [];

  if (!item?.matched_food_name) {
    steps.push("Add or confirm the exact food name for formula-specific advice.");
  }

  if (!item?.feeding_grams_per_day) {
    steps.push("Confirm kcal per 100g to calculate grams per day.");
  }

  if (!hasValidFoodScore(item?.food_score) || (item?.food_score ?? 0) < 60) {
    steps.push("Review the food choice if symptoms, allergies, or weight goals matter.");
  }

  if (steps.length === 0) {
    steps.push("Use the printable report for sharing or saving this analysis.");
  }

  return steps;
}

function getCareNotes(pet: AccountPet) {
  const notes = [];

  if (pet.allergies?.length) {
    notes.push(`Avoid known allergens: ${pet.allergies.join(", ")}.`);
  }

  if (pet.health_issues?.length) {
    notes.push(`Health notes to consider: ${pet.health_issues.join(", ")}.`);
  }

  if (pet.neutered) {
    notes.push("Neutered pets often need careful calorie control.");
  }

  if (notes.length === 0) {
    notes.push("No allergies or health notes saved yet.");
  }

  return notes;
}

export default function AccountPetDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<PetDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
          throw new Error(result.error || "Failed to load pet.");
        }

        setData(result as PetDetailResponse);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load pet.");
      } finally {
        setIsLoading(false);
      }
    }

    if (params?.id) {
      loadPet();
    }
  }, [params, pathname, router]);

  if (isLoading) {
    return (
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-black">Loading pet...</p>
          <p className="mt-2 text-sm text-gray-600">
            We are fetching the saved profile and analysis history.
          </p>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          <p className="font-semibold">Could not load this pet</p>
          <p className="mt-2 text-sm">
            {error || "Pet not found."}
          </p>
          <Link
            href="/account/pets"
            className="mt-4 inline-block rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            Back to My Pets
          </Link>
        </div>
      </section>
    );
  }

  const { pet, analysisHistory } = data;
  const latest = analysisHistory[0];

  return (
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">{pet.name}</h1>
            <p className="mt-2 text-gray-600">
              Pet profile and nutrition analysis history.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/account/pets"
              className="rounded-xl border border-black px-4 py-2 text-sm text-black"
            >
              Back to My Pets
            </Link>

            <Link
              href="/account/chatbot"
              className="rounded-xl bg-black px-4 py-2 text-sm text-white"
            >
              Update Analysis
            </Link>

            {latest && (
              <>
                <Link
                  href={`/print/pet-report/${pet.id}`}
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm text-white transition hover:bg-green-700"
                >
                  Print Report
                </Link>

                <Link
                  href={`/print/pet-timeline/${pet.id}`}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-black transition hover:bg-gray-100"
                >
                  Print Timeline
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                Care notes
              </p>
              <h2 className="mt-2 text-xl font-bold text-amber-950">
                Food choices should account for this profile
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-amber-900">
                {getCareNotes(pet).map((note) => (
                  <li key={note}>- {note}</li>
                ))}
              </ul>
            </div>

            <Link
              href="/account/chatbot"
              className="rounded-xl bg-amber-700 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-amber-800"
            >
              Recheck food fit
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">Species</p>
            <p className="mt-2 text-xl font-semibold text-black">{pet.species}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">Weight</p>
            <p className="mt-2 text-xl font-semibold text-black">{pet.weight} kg</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">Analyses</p>
            <p className="mt-2 text-xl font-semibold text-black">
              {analysisHistory.length}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-black">Pet details</h2>

          <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <p className="text-black">
              <span className="font-semibold">Breed:</span> {pet.breed || "-"}
            </p>
            <p className="text-black">
              <span className="font-semibold">Age:</span> {pet.age}
            </p>
            <p className="text-black">
              <span className="font-semibold">Activity:</span> {pet.activity_level}
            </p>
            <p className="text-black">
              <span className="font-semibold">Neutered:</span>{" "}
              {pet.neutered ? "Yes" : "No"}
            </p>
            <p className="text-black md:col-span-2">
              <span className="font-semibold">Allergies:</span>{" "}
              {pet.allergies?.length ? pet.allergies.join(", ") : "-"}
            </p>
            <p className="text-black md:col-span-2">
              <span className="font-semibold">Health issues:</span>{" "}
              {pet.health_issues?.length ? pet.health_issues.join(", ") : "-"}
            </p>
          </div>
        </div>

        {latest && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-black">
                  Latest analysis
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
                <p className="text-sm text-gray-600">RER</p>
                <p className="mt-1 text-xl font-semibold text-black">
                  {latest.rer} kcal
                </p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-gray-600">MER</p>
                <p className="mt-1 text-xl font-semibold text-black">
                  {latest.mer} kcal
                </p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-gray-600">Food score</p>
                <p className="mt-1 text-xl font-semibold text-black">
                  {hasValidFoodScore(latest.food_score)
                    ? `${latest.food_score}/100`
                    : "-"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {getFoodScoreLabel(latest.food_score)}
                </p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-gray-600">Feeding amount</p>
                <p className="mt-1 text-xl font-semibold text-black">
                  {latest.feeding_grams_per_day
                    ? `${latest.feeding_grams_per_day}g/day`
                    : "-"}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-green-200 bg-white p-4">
                <p className="text-sm font-semibold text-black">Food context</p>
                <p className="mt-2 text-sm text-gray-700">
                  Matched food:{" "}
                  <span className="font-semibold">
                    {latest.matched_food_name ?? "No matched food"}
                  </span>
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  Weight goal:{" "}
                  <span className="font-semibold">
                    {latest.weight_goal ?? "-"}
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-green-200 bg-white p-4">
                <p className="text-sm font-semibold text-black">Next steps</p>
                <ul className="mt-2 space-y-2 text-sm text-gray-700">
                  {getLatestAnalysisNextSteps(latest).map((step) => (
                    <li key={step}>- {step}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/account/chatbot"
                className="rounded-xl border border-green-300 bg-white px-4 py-2 text-center text-sm font-medium text-green-800 transition hover:bg-green-100"
              >
                Update analysis
              </Link>
              <Link
                href={`/print/pet-report/${pet.id}`}
                className="rounded-xl bg-green-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-green-700"
              >
                Open printable report
              </Link>
              <Link
                href={`/print/pet-timeline/${pet.id}`}
                className="rounded-xl border border-green-300 bg-white px-4 py-2 text-center text-sm font-medium text-green-800 transition hover:bg-green-100"
              >
                Open timeline
              </Link>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-black">Analysis history</h2>

          {analysisHistory.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">
              <p className="font-semibold text-black">No analysis history yet</p>
              <p className="mt-2 text-sm text-gray-600">
                Run a new analysis to create this pet&apos;s first nutrition
                report and timeline entry.
              </p>
              <Link
                href="/account/chatbot"
                className="mt-4 inline-block rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Run analysis
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
                    RER {item.rer} kcal - MER {item.mer} kcal
                  </p>
                  {hasValidFoodScore(item.food_score) && (
                  <p className="mt-1 text-sm text-gray-700">
                    Food score: {item.food_score}/100
                  </p>
                )}

                {item.feeding_grams_per_day && (
                  <p className="mt-1 text-sm text-gray-700">
                    Feeding: {item.feeding_grams_per_day}g/day
                  </p>
                )}

                {item.matched_food_name && (
                  <p className="mt-1 text-xs text-gray-500">
                    Food: {item.matched_food_name}
                  </p>
                )}
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended foods:{" "}
                    {item.recommendedFoodIds?.length
                      ? item.recommendedFoodIds.join(", ")
                      : "-"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
  );
}
