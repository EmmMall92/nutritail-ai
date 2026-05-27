"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AnalysisHistoryItem = {
  id: string;
  rer: number;
  mer: number;
  createdAt: string;
  recommendedFoodIds: string[];
  food_score?: number | null;
  matched_food_name?: string | null;
  feeding_grams_per_day?: number | null;
};

type AccountPet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  activity_level: string;
  created_at: string;
  analysisHistory: AnalysisHistoryItem[];
};

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString();
}

export default function AccountPetsPage() {
  const router = useRouter();

  const [pets, setPets] = useState<AccountPet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPets() {
      try {
        setIsLoading(true);
        setError("");

        const supabase = createClient();
        const { data } = await supabase.auth.getSession();

        if (!data.session?.user) {
          router.replace("/login");
          return;
        }

        const response = await fetch("/api/account/pets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authUserId: data.session.user.id,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load pets.");
        }

        setPets(result.pets as AccountPet[]);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load pets.");
      } finally {
        setIsLoading(false);
      }
    }

    loadPets();
  }, [router]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">My Pets</h1>
          <p className="mt-2 text-gray-600">
            Your saved pets and their nutrition analysis history.
          </p>
        </div>

        <Link
          href="/account/chatbot"
          className="rounded-xl bg-black px-4 py-2 text-center text-sm text-white"
        >
          New Analysis
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-gray-600">Loading pets...</p>
        ) : pets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
            <p className="text-lg font-semibold text-black">
              No saved pets yet
            </p>
            <p className="mt-2 max-w-xl text-sm text-gray-600">
              Start a nutrition analysis and Nutritail will save the pet profile
              here, together with its report and history.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/account/chatbot"
                className="rounded-xl bg-black px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Start first analysis
              </Link>
              <Link
                href="/account"
                className="rounded-xl border border-gray-300 px-5 py-3 text-center text-sm font-medium text-black transition hover:bg-white"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {pets.map((pet) => {
              const latest = pet.analysisHistory?.[0];

              return (
                <div
                  key={pet.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-gray-300"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-black">
                        {pet.name}
                        {pet.breed ? ` - ${pet.breed}` : ""}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {pet.species} - age {pet.age} - weight {pet.weight} kg -{" "}
                        {pet.activity_level}
                      </p>

                      {latest ? (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-700">
                          <span className="rounded-full bg-white px-3 py-1">
                            RER {latest.rer} kcal
                          </span>
                          <span className="rounded-full bg-white px-3 py-1">
                            MER {latest.mer} kcal
                          </span>
                          {latest.food_score !== null &&
                            latest.food_score !== undefined && (
                              <span className="rounded-full bg-white px-3 py-1">
                                Score {latest.food_score}/100
                              </span>
                            )}
                          <span className="rounded-full bg-white px-3 py-1">
                            {formatDate(latest.createdAt)}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">
                          No analysis history yet.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Link
                        href={`/account/pets/${pet.id}`}
                        className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-white"
                      >
                        Open
                      </Link>
                      {latest ? (
                        <>
                          <Link
                            href={`/print/pet-report/${pet.id}`}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-black transition hover:bg-white"
                          >
                            Report
                          </Link>
                          <Link
                            href={`/print/pet-timeline/${pet.id}`}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-black transition hover:bg-white"
                          >
                            Timeline
                          </Link>
                        </>
                      ) : (
                        <Link
                          href="/account/chatbot"
                          className="rounded-lg bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800"
                        >
                          Run analysis
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
