"use client";

import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    if (!petId) return;

    loadPet();
  }, [petId]);

  async function loadPet() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`/api/print/pet-report/${petId}`, {        cache: "no-store",
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
  }

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
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-gray-600">Loading report...</p>
        </div>
      </main>
    );
  }

  if (error || !pet) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
          <p className="text-red-700">
            {error || "Pet report not found."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 print:bg-white print:p-0">
      <section className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-black">
              Nutritail AI Report
            </h1>

            <p className="mt-2 text-gray-600">
              Personalized pet nutrition summary
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

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-xl font-semibold text-black">
              Pet Information
            </h2>

            <div className="mt-4 space-y-2 text-sm text-black">
              <p>
                <strong>Name:</strong> {pet.name}
              </p>

              <p>
                <strong>Species:</strong> {pet.species}
              </p>

              {pet.breed && (
                <p>
                  <strong>Breed:</strong> {pet.breed}
                </p>
              )}

              <p>
                <strong>Age:</strong> {pet.age} years
              </p>

              <p>
                <strong>Weight:</strong> {pet.weight} kg
              </p>

              <p>
                <strong>Neutered:</strong>{" "}
                {pet.neutered ? "Yes" : "No"}
              </p>

              {pet.activity_level && (
                <p>
                  <strong>Activity:</strong> {pet.activity_level}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-xl font-semibold text-black">
              Latest Nutrition Analysis
            </h2>

            {latestAnalysis ? (
              <div className="mt-4 space-y-2 text-sm text-black">
                <p>
                  <strong>RER:</strong> {latestAnalysis.rer} kcal
                </p>

                <p>
                  <strong>MER/DER:</strong> {latestAnalysis.mer} kcal
                </p>

                {latestAnalysis.food_score !== null &&
                  latestAnalysis.food_score !== undefined && (
                    <p>
                      <strong>Food score:</strong>{" "}
                      {latestAnalysis.food_score}/100
                    </p>
                  )}

                {latestAnalysis.feeding_grams_per_day && (
                  <p>
                    <strong>Feeding amount:</strong>{" "}
                    {latestAnalysis.feeding_grams_per_day}g/day
                  </p>
                )}

                {latestAnalysis.weight_goal && (
                  <p>
                    <strong>Weight goal:</strong>{" "}
                    {latestAnalysis.weight_goal}
                  </p>
                )}

                {latestAnalysis.matched_food_name && (
                  <p>
                    <strong>Matched food:</strong>{" "}
                    {latestAnalysis.matched_food_name}
                  </p>
                )}

                {latestAnalysis.created_at && (
                  <p className="pt-2 text-xs text-gray-500">
                    Analysis date:{" "}
                    {new Date(
                      latestAnalysis.created_at
                    ).toLocaleString()}
                  </p>
                )}
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
            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-black">
                Nutrition Notes
              </h2>

              <div className="mt-4 space-y-3">
                {latestAnalysis.advice.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-black"
                  >
                    • {item}
                  </div>
                ))}
              </div>
            </div>
          )}

        {pet.analyses && pet.analyses.length > 1 && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
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
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex flex-col gap-2 text-sm text-black">
                      <p>
                        <strong>Date:</strong>{" "}
                        {item.created_at
                          ? new Date(
                              item.created_at
                            ).toLocaleString()
                          : "-"}
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
                            {item.food_score}/100
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
                          {item.weight_goal}
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