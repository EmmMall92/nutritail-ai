"use client";

import { type FormEvent, useEffect, useState } from "react";
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

type ProgressLog = {
  id: string;
  message: string;
  created_at: string;
  metadata?: {
    mode?: string;
    currentWeightKg?: number | null;
    previousWeightKg?: number | null;
    feedingGramsPerDay?: number | null;
    treatsPerDay?: string | null;
    note?: string | null;
  };
};

type PetDetailResponse = {
  pet: AccountPet;
  analysisHistory: AnalysisHistoryItem[];
  progressLogs?: ProgressLog[];
};

type PetContextForm = {
  breed: string;
  age: string;
  weight: string;
  activity_level: string;
  neutered: string;
  allergies: string;
  health_issues: string;
};

function toCommaText(value?: string[]) {
  return value?.length ? value.join(", ") : "";
}

function toStringList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toPetContextForm(pet: AccountPet): PetContextForm {
  return {
    breed: pet.breed ?? "",
    age: String(pet.age ?? ""),
    weight: String(pet.weight ?? ""),
    activity_level: pet.activity_level || "normal",
    neutered: pet.neutered ? "yes" : "no",
    allergies: toCommaText(pet.allergies),
    health_issues: toCommaText(pet.health_issues),
  };
}

function hasValidFoodScore(score?: number | null) {
  return typeof score === "number" && Number.isFinite(score);
}

function getFoodScoreLabel(score?: number | null) {
  if (!hasValidFoodScore(score)) return "General guidance";
  const numericScore = Number(score);
  if (numericScore >= 80) return "Strong fit";
  if (numericScore >= 60) return "Useful fit";
  if (numericScore >= 40) return "Worth rechecking";
  return "Fresh analysis suggested";
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

function getResultStatusDetail(item?: AnalysisHistoryItem) {
  if (!item) {
    return "Run the chatbot to create calories, food guidance, report, and timeline.";
  }

  if (item.matched_food_name && item.feeding_grams_per_day) {
    return "Ready for portion tracking, progress check-ins, and printable sharing.";
  }

  if (item.matched_food_name) {
    return "Formula is saved, but grams per day still need calorie confirmation.";
  }

  if (item.feeding_grams_per_day) {
    return "Portion guidance exists, but the exact food formula still needs confirmation.";
  }

  return "Calories are useful, but this is still general guidance until the food match is confirmed.";
}

function getResultFollowUp(item?: AnalysisHistoryItem, progressLogCount = 0) {
  if (!item) return "Start a nutrition analysis";
  if (!item.matched_food_name) return "Confirm exact food";
  if (!item.feeding_grams_per_day) return "Confirm kcal and grams";
  if (progressLogCount === 0) return "Add first progress check";
  return "Continue tracking progress";
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

function formatProgressMode(value?: string) {
  if (value === "no_result") return "No visible result";
  if (value === "progress") return "Progress check";
  return "Progress note";
}

function formatWeightDelta(currentWeight?: number | null, previousWeight?: number | null) {
  if (
    typeof currentWeight !== "number" ||
    !Number.isFinite(currentWeight) ||
    typeof previousWeight !== "number" ||
    !Number.isFinite(previousWeight)
  ) {
    return "No weight comparison yet";
  }

  const delta = Number((currentWeight - previousWeight).toFixed(1));
  if (delta === 0) return "No weight change from saved profile";
  if (delta < 0) return `${Math.abs(delta)} kg lower than saved profile`;
  return `${delta} kg higher than saved profile`;
}

function getLatestProgressSummary(progressLogs: ProgressLog[], pet: AccountPet) {
  const latestLog = progressLogs[0];
  const metadata = latestLog?.metadata;
  const currentWeight = metadata?.currentWeightKg ?? null;
  const previousWeight = metadata?.previousWeightKg ?? pet.weight ?? null;

  return {
    latestLog,
    currentWeight,
    feedingGramsPerDay: metadata?.feedingGramsPerDay ?? null,
    mode: formatProgressMode(metadata?.mode),
    deltaText: formatWeightDelta(currentWeight, previousWeight),
  };
}

export default function AccountPetDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<PetDetailResponse | null>(null);
  const [editForm, setEditForm] = useState<PetContextForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingContext, setIsSavingContext] = useState(false);
  const [error, setError] = useState("");
  const [contextMessage, setContextMessage] = useState("");

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

        const petDetail = result as PetDetailResponse;
        setData(petDetail);
        setEditForm(toPetContextForm(petDetail.pet));
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

  async function handleContextSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editForm || !data) return;

    try {
      setIsSavingContext(true);
      setContextMessage("");

      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      const response = await fetch(`/api/account/pets/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authUserId: sessionData.session.user.id,
          breed: editForm.breed,
          age: Number(editForm.age),
          weight: Number(editForm.weight),
          activity_level: editForm.activity_level,
          neutered: editForm.neutered === "yes",
          allergies: toStringList(editForm.allergies),
          health_issues: toStringList(editForm.health_issues),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update pet context.");
      }

      setData((current) =>
        current
          ? {
              ...current,
              pet: result.pet as AccountPet,
            }
          : current
      );
      setEditForm(toPetContextForm(result.pet as AccountPet));
      setContextMessage(
        "Pet context updated. Run a new analysis when you want fresh recommendations."
      );
    } catch (err) {
      console.error(err);
      setContextMessage(
        err instanceof Error ? err.message : "Failed to update pet context."
      );
    } finally {
      setIsSavingContext(false);
    }
  }

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

  const { pet, analysisHistory, progressLogs = [] } = data;
  const latest = analysisHistory[0];
  const progressSummary = getLatestProgressSummary(progressLogs, pet);
  const maxPetWeightKg = pet.species === "cat" ? 15 : 90;

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
              href={
                latest
                  ? `/account/chatbot?petId=${pet.id}&mode=progress`
                  : `/account/chatbot?petId=${pet.id}`
              }
              className="rounded-xl bg-black px-4 py-2 text-sm text-white"
            >
              {latest ? "Progress check" : "Run analysis"}
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
              href={
                latest
                  ? `/account/chatbot?petId=${pet.id}&mode=progress`
                  : `/account/chatbot?petId=${pet.id}`
              }
              className="rounded-xl bg-amber-700 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-amber-800"
            >
              Recheck food fit
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Latest result
              </p>
              <h2 className="mt-2 text-xl font-bold text-emerald-950">
                {getReportReadiness(latest)}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-emerald-900">
                {getResultStatusDetail(latest)}
              </p>
            </div>

            <Link
              href={
                latest
                  ? `/account/chatbot?petId=${pet.id}&mode=progress`
                  : `/account/chatbot?petId=${pet.id}`
              }
              className="rounded-xl bg-emerald-700 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-emerald-800"
            >
              {getResultFollowUp(latest, progressLogs.length)}
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Daily target
              </p>
              <p className="mt-2 text-lg font-semibold text-black">
                {latest?.mer ? `${latest.mer} kcal/day` : "Not calculated"}
              </p>
            </div>

            <div className="rounded-xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Food match
              </p>
              <p className="mt-2 text-sm font-semibold text-black">
                {latest?.matched_food_name ?? "Needs exact food"}
              </p>
            </div>

            <div className="rounded-xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Feeding
              </p>
              <p className="mt-2 text-lg font-semibold text-black">
                {latest?.feeding_grams_per_day
                  ? `${latest.feeding_grams_per_day}g/day`
                  : "Needs kcal check"}
              </p>
            </div>

            <div className="rounded-xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Follow-up
              </p>
              <p className="mt-2 text-sm font-semibold text-black">
                {getResultFollowUp(latest, progressLogs.length)}
              </p>
            </div>
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

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Latest progress
              </p>
              {progressSummary.latestLog ? (
                <>
                  <h2 className="mt-2 text-xl font-bold text-blue-950">
                    {progressSummary.mode}
                  </h2>
                  <p className="mt-2 text-sm text-blue-900">
                    {progressSummary.deltaText}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-blue-950">
                    {progressSummary.currentWeight && (
                      <span className="rounded-full bg-white px-3 py-1">
                        Current {progressSummary.currentWeight} kg
                      </span>
                    )}
                    {progressSummary.feedingGramsPerDay && (
                      <span className="rounded-full bg-white px-3 py-1">
                        {progressSummary.feedingGramsPerDay}g/day
                      </span>
                    )}
                    <span className="rounded-full bg-white px-3 py-1">
                      {new Date(progressSummary.latestLog.created_at).toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="mt-2 text-xl font-bold text-blue-950">
                    No check-ins yet
                  </h2>
                  <p className="mt-2 text-sm text-blue-900">
                    Add a progress check when weight, appetite, stool, treats,
                    or food acceptance changes.
                  </p>
                </>
              )}
            </div>

            <Link
              href={`/account/chatbot?petId=${pet.id}&mode=progress`}
              className="rounded-xl bg-blue-700 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-blue-800"
            >
              Add progress check
            </Link>
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

        {editForm && (
          <form
            onSubmit={handleContextSave}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-black">
                  Update pet context
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Keep weight, activity, allergies, and health notes current so
                  the next chatbot analysis starts from the right context.
                </p>
              </div>
              <Link
                href={`/account/chatbot?petId=${pet.id}`}
                className="rounded-xl border border-gray-300 px-4 py-2 text-center text-sm font-medium text-black transition hover:bg-gray-100"
              >
                Re-run analysis
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-black">
                Breed
                <input
                  value={editForm.breed}
                  onChange={(event) =>
                    setEditForm({ ...editForm, breed: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
                  placeholder="e.g. Labrador"
                />
              </label>

              <label className="text-sm font-medium text-black">
                Age
                <input
                  type="number"
                  min="0"
                  max="40"
                  step="0.1"
                  value={editForm.age}
                  onChange={(event) =>
                    setEditForm({ ...editForm, age: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
                />
              </label>

              <label className="text-sm font-medium text-black">
                Weight kg
                <input
                  type="number"
                  min="0.1"
                  max={maxPetWeightKg}
                  step="0.1"
                  value={editForm.weight}
                  onChange={(event) =>
                    setEditForm({ ...editForm, weight: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
                />
              </label>

              <label className="text-sm font-medium text-black">
                Activity
                <select
                  value={editForm.activity_level}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      activity_level: event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </label>

              <label className="text-sm font-medium text-black">
                Neutered
                <select
                  value={editForm.neutered}
                  onChange={(event) =>
                    setEditForm({ ...editForm, neutered: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>

              <label className="text-sm font-medium text-black">
                Allergies
                <input
                  value={editForm.allergies}
                  onChange={(event) =>
                    setEditForm({ ...editForm, allergies: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
                  placeholder="chicken, wheat"
                />
              </label>

              <label className="text-sm font-medium text-black md:col-span-2">
                Health notes
                <input
                  value={editForm.health_issues}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      health_issues: event.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
                  placeholder="sensitive digestion, weight loss"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={isSavingContext}
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isSavingContext ? "Saving..." : "Save context"}
              </button>

              {contextMessage && (
                <p className="text-sm text-gray-700">{contextMessage}</p>
              )}
            </div>
          </form>
        )}

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
                <p className="text-sm text-gray-600">Food fit</p>
                <p className="mt-1 text-xl font-semibold text-black">
                  {getFoodScoreLabel(latest.food_score)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Based on the saved food and pet profile.
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
                href={`/account/chatbot?petId=${pet.id}&mode=progress`}
                className="rounded-xl border border-green-300 bg-white px-4 py-2 text-center text-sm font-medium text-green-800 transition hover:bg-green-100"
              >
                Progress check
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

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-blue-950">
                Progress timeline
              </h2>
              <p className="mt-1 text-sm text-blue-900">
                Follow-up notes from chatbot check-ins, useful for weight-loss
                and food acceptance tracking.
              </p>
            </div>
            <Link
              href={`/account/chatbot?petId=${pet.id}&mode=progress`}
              className="rounded-xl bg-blue-700 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-blue-800"
            >
              Add check-in
            </Link>
          </div>

          {progressLogs.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-blue-300 bg-white p-5 text-sm text-blue-900">
              No progress check-ins yet. Open the chatbot, choose this pet, and
              use Progress check or No visible result.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {progressLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-blue-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-black">
                        {formatProgressMode(log.metadata?.mode)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                    {log.metadata?.currentWeightKg && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-900">
                        {log.metadata.currentWeightKg} kg
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-700">
                    {log.metadata?.previousWeightKg && (
                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        Previous {log.metadata.previousWeightKg} kg
                      </span>
                    )}
                    {log.metadata?.feedingGramsPerDay && (
                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        {log.metadata.feedingGramsPerDay}g/day
                      </span>
                    )}
                    {log.metadata?.treatsPerDay && (
                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        Treats: {log.metadata.treatsPerDay}
                      </span>
                    )}
                  </div>

                  {log.metadata?.note && (
                    <p className="mt-3 text-sm text-gray-700">
                      {log.metadata.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

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
                href={`/account/chatbot?petId=${pet.id}`}
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
                    Resting calories {item.rer} kcal - daily target {item.mer} kcal
                  </p>
                  {hasValidFoodScore(item.food_score) && (
                  <p className="mt-1 text-sm text-gray-700">
                    Food fit: {getFoodScoreLabel(item.food_score)}
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
                    Food recommendation:{" "}
                    {item.matched_food_name
                      ? "saved with this analysis"
                      : "choose a food in the chatbot to make this more specific"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
  );
}
