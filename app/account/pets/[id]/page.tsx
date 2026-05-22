"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function AccountPetDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

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
          router.replace("/login");
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
  }, [params, router]);

  if (isLoading) {
    return (
      
        <p className="text-gray-600">Loading pet...</p>
      
    );
  }

  if (error || !data) {
    return (
    
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error || "Pet not found."}
          </div>

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
              Προφίλ κατοικιδίου και ιστορικό διατροφικών αναλύσεων.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/account/pets"
              className="rounded-xl border border-black px-4 py-2 text-sm text-black"
            >
              Back to My Pets
            </a>

            <a
              href="/account/chatbot"
              className="rounded-xl bg-black px-4 py-2 text-sm text-white"
            >
              New Analysis
            </a>
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
            <h2 className="text-xl font-semibold text-black">Latest analysis</h2>
            <p className="mt-3 text-black">
              RER: <span className="font-semibold">{latest.rer} kcal</span>
            </p>
            <p className="mt-1 text-black">
              MER: <span className="font-semibold">{latest.mer} kcal</span>
            </p>
            {latest.food_score !== null && latest.food_score !== undefined && (
          <p className="mt-1 text-black">
            Food score:{" "}
            <span className="font-semibold">{latest.food_score}/100</span>
          </p>
        )}

        {latest.feeding_grams_per_day && (
          <p className="mt-1 text-black">
            Feeding amount:{" "}
            <span className="font-semibold">
              {latest.feeding_grams_per_day}g/day
            </span>
          </p>
        )}

        {latest.weight_goal && (
          <p className="mt-1 text-black">
            Weight goal:{" "}
            <span className="font-semibold">{latest.weight_goal}</span>
          </p>
        )}

        {latest.matched_food_name && (
          <p className="mt-1 text-black">
            Matched food:{" "}
            <span className="font-semibold">{latest.matched_food_name}</span>
          </p>
        )}
            <p className="mt-1 text-sm text-gray-700">
              {new Date(latest.createdAt).toLocaleString()}
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-black">Analysis history</h2>

          {analysisHistory.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">
              Δεν υπάρχει ακόμα ιστορικό αναλύσεων.
            </p>
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
                    RER {item.rer} kcal • MER {item.mer} kcal
                  </p>
                  {item.food_score !== null && item.food_score !== undefined && (
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