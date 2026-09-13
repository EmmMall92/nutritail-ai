"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, ArrowRight, Clock3, FileText, PawPrint, Plus, Sparkles } from "lucide-react";
import { formatCustomerPetName } from "@/lib/petName";
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
    return "border-[#bde6cc] bg-[#eaf7ef] text-[#17663f]";
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
    return "Κάνε μία ενημερωτική εκτίμηση με τον βοηθό για θερμίδες, επιλογές και αναφορά.";
  }

  return "Υπάρχει αναφορά, αλλά ίσως λείπουν λεπτομέρειες για συγκεκριμένη τροφή.";
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
    <section className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-[#dce5df] pb-6 pt-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="nt-eyebrow">Κατοικίδια</p>
          <h1 className="mt-2 text-3xl font-black text-[#14221b]">Τα κατοικίδιά μου</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f6f66]">
            Τα αποθηκευμένα κατοικίδια, οι διατροφικές αναφορές και η πρόοδός τους.
          </p>
        </div>

        <Link href="/account/chatbot" className="nt-button nt-button-primary nt-focus">
          <Plus size={17} aria-hidden="true" />
          Νέα ανάλυση
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!isLoading && pets.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 rounded-lg border border-[#dce5df] bg-white p-5 shadow-sm">
          <div className="border-b border-[#e3ebe6] pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-5">
            <p className="text-xs font-extrabold text-[#6b7b72]">Αποθηκευμένα</p>
            <p className="mt-2 text-2xl font-black text-[#14221b]">
              {pets.length}
            </p>
          </div>
          <div className="border-b border-[#e3ebe6] pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-5">
            <p className="text-xs font-extrabold text-[#1f7a4d]">Έτοιμες αναφορές</p>
            <p className="mt-2 text-2xl font-black text-[#14221b]">
              {
                pets.filter(
                  (pet) => getReportReadiness(pet) === "report_ready"
                ).length
              }
            </p>
          </div>
          <div className="border-b border-[#e3ebe6] pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-5">
            <p className="text-xs font-extrabold text-[#a66716]">Θέλουν ανάλυση</p>
            <p className="mt-2 text-2xl font-black text-[#14221b]">
              {
                pets.filter(
                  (pet) => getReportReadiness(pet) === "needs_analysis"
                ).length
              }
            </p>
          </div>
          <div>
            <p className="text-xs font-extrabold text-[#6b7b72]">Συνολικές αναλύσεις</p>
            <p className="mt-2 text-2xl font-black text-[#14221b]">
              {pets.reduce(
                (count, pet) => count + (pet.analysisHistory?.length ?? 0),
                0
              )}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {!isLoading && pets.length > 0 && (
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="nt-eyebrow">Προφίλ</p>
              <h2 className="mt-1 text-xl font-black text-[#14221b]">Όλα τα κατοικίδια</h2>
            </div>
            <span className="text-sm font-bold text-[#6b7b72]">{pets.length} συνολικά</span>
          </div>
        )}
        {isLoading ? (
          <div className="rounded-lg border border-[#dce5df] bg-white p-5 text-sm text-[#5f6f66] shadow-sm">
            Φορτώνω τα κατοικίδια...
          </div>
        ) : pets.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#b8c8be] bg-white p-6 sm:p-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eaf7ef] text-[#1f7a4d]">
              <PawPrint size={21} aria-hidden="true" />
            </span>
            <p className="mt-5 text-lg font-bold text-[#14221b]">
              Δεν έχεις αποθηκευμένα κατοικίδια ακόμη
            </p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#5f6f66]">
              Ξεκίνα μία διατροφική ανάλυση και το NutriTail θα κρατήσει εδώ το
              προφίλ του κατοικιδίου, την αναφορά και το ιστορικό του.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/account/chatbot"
                className="nt-button nt-button-primary nt-focus"
              >
                <Sparkles size={17} aria-hidden="true" />
                Ξεκίνα πρώτη ανάλυση
              </Link>
              <Link
                href="/account"
                className="nt-button nt-button-secondary nt-focus"
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
                <article
                  key={pet.id}
                  className="rounded-lg border border-[#dce5df] bg-white p-4 shadow-sm transition hover:border-[#8ab89b] sm:p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex min-w-0 gap-3 sm:gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf7ef] text-[#1f7a4d]">
                        <PawPrint size={20} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-[#14221b]">
                          {formatCustomerPetName(pet.name)}
                          {pet.breed ? ` - ${pet.breed}` : ""}
                        </h3>
                        <span
                          className={`rounded-md border px-2.5 py-1 text-xs font-bold ${getReadinessClass(
                            readiness
                          )}`}
                        >
                          {getReadinessLabel(readiness)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-[#52645a]">
                        {formatSpecies(pet.species)} - ηλικία {pet.age} - βάρος{" "}
                        {pet.weight} kg - {formatActivity(pet.activity_level)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#6b7b72]">
                        {getReadinessHelper(readiness)}
                      </p>

                      {latest ? (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#52645a]">
                          <span className="rounded-md bg-[#f3f7f4] px-3 py-1.5">
                            Θερμίδες ηρεμίας {latest.rer} kcal
                          </span>
                          <span className="rounded-md bg-[#f3f7f4] px-3 py-1.5">
                            Ημερήσιος στόχος {latest.mer} kcal
                          </span>
                          {getFoodFitLabel(latest.food_score) && (
                              <span className="rounded-md bg-[#f3f7f4] px-3 py-1.5">
                                Καταλληλότητα τροφής: {getFoodFitLabel(latest.food_score)}
                              </span>
                            )}
                          {latest.feeding_grams_per_day && (
                            <span className="rounded-md bg-[#f3f7f4] px-3 py-1.5">
                              {latest.feeding_grams_per_day}g/ημέρα
                            </span>
                          )}
                          {latest.matched_food_name && (
                            <span className="max-w-full rounded-md bg-[#f3f7f4] px-3 py-1.5">
                              Τροφή: {latest.matched_food_name}
                            </span>
                          )}
                          <span className="rounded-md bg-[#f3f7f4] px-3 py-1.5">
                            {formatDate(latest.createdAt)}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-[#6b7b72]">
                          Δεν υπάρχει ακόμη ιστορικό ανάλυσης.
                        </p>
                      )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Link
                        href={`/account/pets/${pet.id}`}
                        className="nt-button nt-button-secondary nt-focus min-h-10 px-3 py-2"
                      >
                        Άνοιγμα
                        <ArrowRight size={16} aria-hidden="true" />
                      </Link>
                      {latest ? (
                        <>
                          <Link
                            href={`/account/chatbot?petId=${pet.id}&mode=progress`}
                            className="nt-button nt-button-primary nt-focus min-h-10 px-3 py-2"
                          >
                            <Activity size={16} aria-hidden="true" />
                            Έλεγχος προόδου
                          </Link>
                          <Link
                            href={`/print/pet-report/${pet.id}`}
                            className="nt-button nt-button-secondary nt-focus min-h-10 px-3 py-2"
                          >
                            <FileText size={16} aria-hidden="true" />
                            Αναφορά
                          </Link>
                          <Link
                            href={`/print/pet-timeline/${pet.id}`}
                            className="nt-button nt-button-secondary nt-focus min-h-10 px-3 py-2"
                          >
                            <Clock3 size={16} aria-hidden="true" />
                            Ιστορικό
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={`/account/chatbot?petId=${pet.id}`}
                          className="nt-button nt-button-primary nt-focus min-h-10 px-3 py-2"
                        >
                          <Sparkles size={16} aria-hidden="true" />
                          Ανάλυση
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
