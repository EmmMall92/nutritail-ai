"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

type ReportReadiness =
  | "needs_analysis"
  | "report_ready"
  | "report_with_notes"
  | "general_report";

function formatDate(value?: string) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString();
}

function getFoodFitLabel(score?: number | null) {
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  if (score >= 80) return "πολύ καλή επιλογή";
  if (score >= 60) return "καλή επιλογή";
  return "θέλει επανέλεγχο";
}

function getReportReadiness(pet: AccountPet): ReportReadiness {
  const latest = pet.analysisHistory?.[0];

  if (!latest) return "needs_analysis";
  if (latest.matched_food_name && latest.feeding_grams_per_day) {
    return "report_ready";
  }
  if (latest.matched_food_name || latest.feeding_grams_per_day) {
    return "report_with_notes";
  }
  return "general_report";
}

function getReadinessLabel(readiness: ReportReadiness) {
  if (readiness === "report_ready") return "Αναφορά έτοιμη";
  if (readiness === "needs_analysis") return "Θέλει ανάλυση";
  if (readiness === "report_with_notes") return "Αναφορά με σημειώσεις";
  return "Γενική αναφορά";
}

function getReadinessClass(readiness: ReportReadiness) {
  if (readiness === "report_ready") {
    return "border-green-200 bg-green-50 text-green-800";
  }

  if (readiness === "needs_analysis") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-blue-200 bg-blue-50 text-blue-800";
}

function getReadinessHelper(readiness: ReportReadiness) {
  if (readiness === "report_ready") {
    return "Υπάρχει αποθηκευμένη τροφή και εκτίμηση γραμμαρίων ανά ημέρα.";
  }

  if (readiness === "needs_analysis") {
    return "Κάνε μία ανάλυση στο chatbot για θερμίδες, προτάσεις και report.";
  }

  return "Υπάρχει report, αλλά ίσως λείπουν λεπτομέρειες για συγκεκριμένη τροφή.";
}

function formatSpecies(value?: string) {
  if (value === "dog") return "σκύλος";
  if (value === "cat") return "γάτα";
  return value || "-";
}

function formatActivity(value?: string) {
  if (value === "low") return "χαμηλή δραστηριότητα";
  if (value === "normal") return "κανονική δραστηριότητα";
  if (value === "high") return "υψηλή δραστηριότητα";
  return value || "-";
}

export default function AccountPetsPage() {
  const router = useRouter();
  const pathname = usePathname();

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
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
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
          console.error(result.error);
          throw new Error("Δεν μπόρεσα να φορτώσω τα κατοικίδια.");
        }

        setPets(result.pets as AccountPet[]);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Δεν μπόρεσα να φορτώσω τα κατοικίδια.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadPets();
  }, [pathname, router]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Τα κατοικίδιά μου</h1>
          <p className="mt-2 text-gray-600">
            Τα αποθηκευμένα κατοικίδια, τα διατροφικά reports και η πρόοδός τους.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/account"
            className="rounded-xl border border-gray-300 px-4 py-2 text-center text-sm text-black transition hover:bg-gray-100"
          >
            Λογαριασμός
          </Link>
          <Link
            href="/account/chatbot"
            className="rounded-xl bg-black px-4 py-2 text-center text-sm text-white"
          >
            Νέα ανάλυση
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!isLoading && pets.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Αποθηκευμένα κατοικίδια</p>
            <p className="mt-2 text-3xl font-bold text-black">
              {pets.length}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Έτοιμα reports</p>
            <p className="mt-2 text-3xl font-bold text-black">
              {
                pets.filter(
                  (pet) => getReportReadiness(pet) === "report_ready"
                ).length
              }
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Θέλουν ανάλυση</p>
            <p className="mt-2 text-3xl font-bold text-black">
              {
                pets.filter(
                  (pet) => getReportReadiness(pet) === "needs_analysis"
                ).length
              }
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Συνολικές αναλύσεις</p>
            <p className="mt-2 text-3xl font-bold text-black">
              {pets.reduce(
                (count, pet) => count + (pet.analysisHistory?.length ?? 0),
                0
              )}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-gray-600">Φορτώνω τα κατοικίδια...</p>
        ) : pets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
            <p className="text-lg font-semibold text-black">
              Δεν έχεις αποθηκευμένα κατοικίδια ακόμη
            </p>
            <p className="mt-2 max-w-xl text-sm text-gray-600">
              Ξεκίνα μία διατροφική ανάλυση και το NutriTail θα κρατήσει εδώ το
              προφίλ του κατοικιδίου, το report και το ιστορικό του.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/account/chatbot"
                className="rounded-xl bg-black px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Ξεκίνα πρώτη ανάλυση
              </Link>
              <Link
                href="/account"
                className="rounded-xl border border-gray-300 px-5 py-3 text-center text-sm font-medium text-black transition hover:bg-white"
              >
                Πίσω στον λογαριασμό
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {pets.map((pet) => {
              const latest = pet.analysisHistory?.[0];
              const readiness = getReportReadiness(pet);

              return (
                <div
                  key={pet.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-gray-300"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-black">
                          {pet.name}
                          {pet.breed ? ` - ${pet.breed}` : ""}
                        </p>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getReadinessClass(
                            readiness
                          )}`}
                        >
                          {getReadinessLabel(readiness)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-600">
                        {formatSpecies(pet.species)} - ηλικία {pet.age} - βάρος{" "}
                        {pet.weight} kg - {formatActivity(pet.activity_level)}
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        {getReadinessHelper(readiness)}
                      </p>

                      {latest ? (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-700">
                          <span className="rounded-full bg-white px-3 py-1">
                            Θερμίδες ηρεμίας {latest.rer} kcal
                          </span>
                          <span className="rounded-full bg-white px-3 py-1">
                            Ημερήσιος στόχος {latest.mer} kcal
                          </span>
                          {getFoodFitLabel(latest.food_score) && (
                              <span className="rounded-full bg-white px-3 py-1">
                                Fit τροφής: {getFoodFitLabel(latest.food_score)}
                              </span>
                            )}
                          {latest.feeding_grams_per_day && (
                            <span className="rounded-full bg-white px-3 py-1">
                              {latest.feeding_grams_per_day}g/ημέρα
                            </span>
                          )}
                          {latest.matched_food_name && (
                            <span className="max-w-full rounded-full bg-white px-3 py-1">
                              Τροφή: {latest.matched_food_name}
                            </span>
                          )}
                          <span className="rounded-full bg-white px-3 py-1">
                            {formatDate(latest.createdAt)}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">
                          Δεν υπάρχει ακόμη ιστορικό ανάλυσης.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Link
                        href={`/account/pets/${pet.id}`}
                        className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-white"
                      >
                        Άνοιγμα
                      </Link>
                      {latest ? (
                        <>
                          <Link
                            href={`/account/chatbot?petId=${pet.id}&mode=progress`}
                            className="rounded-lg bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800"
                          >
                            Έλεγχος προόδου
                          </Link>
                          <Link
                            href={`/print/pet-report/${pet.id}`}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-black transition hover:bg-white"
                          >
                            Αναφορά
                          </Link>
                          <Link
                            href={`/print/pet-timeline/${pet.id}`}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-black transition hover:bg-white"
                          >
                            Ιστορικό
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={`/account/chatbot?petId=${pet.id}`}
                          className="rounded-lg bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800"
                        >
                          Ανάλυση
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
