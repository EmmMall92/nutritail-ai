"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

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

  return new Date(value).toLocaleString();
}

function formatWeightGoal(value?: string | null) {
  if (!value) return "-";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getFoodScoreLabel(score?: number | null) {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return "Not scored";
  }

  if (score >= 80) return "Strong match";
  if (score >= 60) return "Good match";
  if (score >= 40) return "Needs review";

  return "Low match";
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
        throw new Error(result.error || "Failed to load pet report.");
      }

      setPet(result.pet as PetDetail);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load printable report."
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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-black">Loading report...</p>
          <p className="mt-2 text-sm text-gray-600">
            We are fetching the saved pet report.
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
            {error || "Pet report not found."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 text-black sm:p-6 print:bg-white print:p-0">
      <section className="mx-auto max-w-5xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Printable nutrition report
            </p>
            <h1 className="mt-2 text-3xl font-bold text-black sm:text-4xl">
              Nutritail AI Report
            </h1>

            <p className="mt-2 text-gray-600">
              Personalized nutrition summary for {pet.name}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Generated on {new Date().toLocaleString()}
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-black px-5 py-3 text-white transition hover:opacity-90 print:hidden"
          >
            Print / Save PDF
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReportCard label="Pet" value={pet.name} detail={pet.species} />
          <ReportCard label="Weight" value={`${pet.weight} kg`} />
          <ReportCard
            label="Daily calories"
            value={latestAnalysis ? `${latestAnalysis.mer} kcal` : "-"}
            detail="MER/DER target"
          />
          <ReportCard
            label="Food score"
            value={
              latestAnalysis?.food_score !== null &&
              latestAnalysis?.food_score !== undefined
                ? `${latestAnalysis.food_score}/100`
                : "-"
            }
            detail={getFoodScoreLabel(latestAnalysis?.food_score)}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="break-inside-avoid rounded-xl border border-gray-200 bg-gray-50 p-6 print:border-gray-300">
            <h2 className="text-lg font-semibold text-black">
              Pet Information
            </h2>

            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Species</dt>
                <dd className="font-semibold text-black">{pet.species}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Breed</dt>
                <dd className="font-semibold text-black">{pet.breed || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Age</dt>
                <dd className="font-semibold text-black">{pet.age} years</dd>
              </div>
              <div>
                <dt className="text-gray-500">Activity</dt>
                <dd className="font-semibold text-black">
                  {pet.activity_level || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Neutered</dt>
                <dd className="font-semibold text-black">
                  {pet.neutered ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="break-inside-avoid rounded-xl border border-gray-200 bg-gray-50 p-6 print:border-gray-300">
            <h2 className="text-lg font-semibold text-black">
              Latest Nutrition Analysis
            </h2>

            {latestAnalysis ? (
              <div className="mt-4 space-y-4">
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-gray-500">RER</dt>
                    <dd className="font-semibold text-black">
                      {latestAnalysis.rer} kcal
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">MER/DER</dt>
                    <dd className="font-semibold text-black">
                      {latestAnalysis.mer} kcal
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Feeding amount</dt>
                    <dd className="font-semibold text-black">
                      {latestAnalysis.feeding_grams_per_day
                        ? `${latestAnalysis.feeding_grams_per_day}g/day`
                        : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Weight goal</dt>
                    <dd className="font-semibold text-black">
                      {formatWeightGoal(latestAnalysis.weight_goal)}
                    </dd>
                  </div>
                </dl>

                {latestAnalysis.matched_food_name && (
                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                    <p className="text-gray-500">Matched food</p>
                    <p className="mt-1 font-semibold text-black">
                      {latestAnalysis.matched_food_name}
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Analysis date: {formatDate(latestAnalysis.created_at)}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-600">
                No analysis available yet.
              </p>
            )}
          </div>
        </div>

        {latestAnalysis?.advice &&
          latestAnalysis.advice.length > 0 && (
            <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 print:border-gray-300">
              <h2 className="text-xl font-semibold text-black">
                Nutrition Notes
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

        {pet.analyses && pet.analyses.length > 1 && (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 print:border-gray-300">
            <h2 className="text-xl font-semibold text-black">
              Analysis History
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
                        <strong>Date:</strong>{" "}
                        {formatDate(item.created_at)}
                      </p>

                      <p>
                        <strong>RER:</strong> {item.rer} kcal
                      </p>

                      <p>
                        <strong>MER:</strong> {item.mer} kcal
                      </p>

                      {item.food_score !== null &&
                        item.food_score !== undefined && (
                          <p>
                            <strong>Food score:</strong>{" "}
                            {item.food_score}/100 (
                            {getFoodScoreLabel(item.food_score)})
                          </p>
                        )}

                      {item.feeding_grams_per_day && (
                        <p>
                          <strong>Feeding:</strong>{" "}
                          {item.feeding_grams_per_day}g/day
                        </p>
                      )}

                      {item.weight_goal && (
                        <p>
                          <strong>Goal:</strong>{" "}
                            {formatWeightGoal(item.weight_goal)}
                        </p>
                      )}

                      {item.matched_food_name && (
                        <p>
                          <strong>Food:</strong>{" "}
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
            Nutritail AI provides educational nutrition guidance and does not
            replace veterinary diagnosis or medical advice.
          </p>
        </div>
      </section>
    </main>
  );
}
