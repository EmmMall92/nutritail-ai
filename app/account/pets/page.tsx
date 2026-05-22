"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AnalysisHistoryItem = {
  id: string;
  rer: number;
  mer: number;
  createdAt: string;
  recommendedFoodIds: string[];
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
            Τα κατοικίδιά σου και το ιστορικό διατροφικών αναλύσεων.
          </p>
        </div>

        <a
          href="/account/chatbot"
          className="rounded-xl bg-black px-4 py-2 text-sm text-white"
        >
          New Analysis
        </a>
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
          <div>
            <p className="text-sm text-gray-600">
              Δεν έχεις καταχωρημένο κατοικίδιο ακόμα.
            </p>
            <a
              href="/account/chatbot"
              className="mt-4 inline-block rounded-xl bg-black px-5 py-3 text-white"
            >
              Ξεκίνα με το chatbot
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {pets.map((pet) => {
              const latest = pet.analysisHistory?.[0];

              return (
                <div
                  key={pet.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-black">
                        {pet.name} — {pet.breed}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {pet.species} • age {pet.age} • weight {pet.weight} kg •{" "}
                        {pet.activity_level}
                      </p>

                      {latest ? (
                        <p className="mt-2 text-sm text-gray-700">
                          Latest analysis: RER {latest.rer} kcal • MER{" "}
                          {latest.mer} kcal
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">
                          No analysis history yet.
                        </p>
                      )}
                    </div>

                    <a
                      href={`/account/pets/${pet.id}`}
                      className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-white"
                    >
                      Open
                    </a>
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