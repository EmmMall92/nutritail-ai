"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
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

function getReportConfidence(score?: number | null) {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return "General guidance only";
  }

  if (score >= 80) return "High confidence";
  if (score >= 60) return "Moderate confidence";
  return "Needs review";
}

function getReportNextSteps(analysis?: AnalysisHistoryItem | null) {
  const steps = [
    "Use the daily calorie target as the starting point, then adjust only after tracking weight and body shape.",
    "Make food changes gradually over 7 days unless your veterinarian gives different instructions.",
  ];

  if (!analysis?.matched_food_name) {
    steps.push("Add the exact food name or a label photo before relying on formula-specific feeding advice.");
  }

  if (!analysis?.feeding_grams_per_day) {
    steps.push("Confirm kcal per 100g to calculate the daily grams more precisely.");
  }

  if ((analysis?.food_score ?? 0) < 60) {
    steps.push("Review the food choice if there are health issues, allergies, or weight concerns.");
  }

  return steps;
}

function getMonitoringChecklist(analysis?: AnalysisHistoryItem | null) {
  const checklist = [
    "Weigh the pet on the same scale every 2-4 weeks.",
    "Track appetite, stool quality, energy, and whether the food is accepted.",
    "Keep treats near 10% of daily calories and include them in the total.",
  ];

  if (analysis?.weight_goal === "loss") {
    checklist.push("If weight does not move after 2-3 weeks, run a Progress check before cutting food further.");
  }

  if (!analysis?.matched_food_name || !analysis?.feeding_grams_per_day) {
    checklist.push("Send the exact bag name or label photo to improve formula-specific confidence.");
  }

  return checklist;
}

function getReportSummary(analysis?: AnalysisHistoryItem | null) {
  if (!analysis) {
    return "This report needs a saved analysis before it can show calories, portions, and food fit.";
  }

  if (analysis.matched_food_name && analysis.feeding_grams_per_day) {
    return "This report is ready to use as a practical feeding summary.";
  }

  return "This report is useful, but food-specific portion details are still missing.";
}

function getFormulaStatus(analysis?: AnalysisHistoryItem | null) {
  if (!analysis) return "No saved analysis";
  if (analysis.matched_food_name && analysis.feeding_grams_per_day) {
    return "Formula and feeding amount saved";
  }
  if (analysis.matched_food_name) return "Formula saved, grams need confirmation";
  return "Exact formula still missing";
}

function getRecheckWindow(analysis?: AnalysisHistoryItem | null) {
  if (!analysis) return "After the first saved analysis";
  if (!analysis.matched_food_name || !analysis.feeding_grams_per_day) {
    return "After exact food details are confirmed";
  }
  if (analysis.weight_goal === "loss") return "In 2-4 weeks";
  return "When weight, appetite, stool, or food acceptance changes";
}

function getGoalLabel(value?: string | null) {
  if (value === "loss") return "Weight loss";
  if (value === "gain") return "Weight gain";
  if (value === "maintenance") return "Weight maintenance";
  return formatWeightGoal(value);
}

function getCalorieExplanation(analysis?: AnalysisHistoryItem | null) {
  if (!analysis) {
    return {
      rest: "RER is the resting calorie estimate before lifestyle adjustments.",
      daily: "MER/DER is the practical daily target after lifestyle and goal adjustments.",
    };
  }

  return {
    rest: `${analysis.rer} kcal/day is the estimated resting energy need before activity, neuter status, and weight goal adjustments.`,
    daily: `${analysis.mer} kcal/day is the practical daily target for the current plan.`,
  };
}

function getFeedingDetail(analysis?: AnalysisHistoryItem | null) {
  if (!analysis) return "Save an analysis first to calculate portions.";
  if (analysis.feeding_grams_per_day) {
    return "Start here, split into meals, and recheck weight/body condition before changing the amount.";
  }
  return "Choose or confirm a specific food so Nutritail can convert calories into grams per day.";
}

function getFoodMatchDetail(analysis?: AnalysisHistoryItem | null) {
  if (!analysis) return "No food has been selected yet.";
  if (analysis.matched_food_name) {
    return "Use this as the selected formula for the current feeding plan.";
  }
  return "No exact food was saved, so the report stays general.";
}

function getMealSplit(gramsPerDay?: number | null) {
  if (!gramsPerDay || !Number.isFinite(gramsPerDay)) return null;

  return {
    twoMeals: Math.round(gramsPerDay / 2),
    threeMeals: Math.round(gramsPerDay / 3),
  };
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

  const calorieExplanation = getCalorieExplanation(latestAnalysis);
  const mealSplit = getMealSplit(latestAnalysis?.feeding_grams_per_day);

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
              Printable nutrition plan
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

          <div className="flex flex-col gap-2 sm:flex-row print:hidden">
            <Link
              href={`/account/pets/${pet.id}`}
              className="rounded-xl border border-gray-300 px-5 py-3 text-center text-sm font-medium text-black transition hover:bg-gray-100"
            >
              Back to pet
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-black px-5 py-3 text-white transition hover:opacity-90"
            >
              Print / Save PDF
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReportCard label="Pet" value={pet.name} detail={pet.species} />
          <ReportCard label="Weight" value={`${pet.weight} kg`} />
          <ReportCard
            label="Daily target"
            value={latestAnalysis ? `${latestAnalysis.mer} kcal` : "-"}
            detail="Practical calories per day"
          />
          <ReportCard
            label="Food fit"
            value={
              latestAnalysis?.food_score !== null &&
              latestAnalysis?.food_score !== undefined
                ? `${latestAnalysis.food_score}/100`
                : "-"
            }
            detail={getFoodScoreLabel(latestAnalysis?.food_score)}
          />
        </div>

        <div className="mt-8 break-inside-avoid rounded-xl border border-emerald-200 bg-emerald-50 p-6 print:border-gray-300">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Client summary
          </p>
          <h2 className="mt-2 text-2xl font-bold text-emerald-950">
            {getReportSummary(latestAnalysis)}
          </h2>
          <p className="mt-3 text-sm text-emerald-900">
            Use this as a practical nutrition summary for calories, portions,
            food choice, and follow-up. It is not a medical diagnosis or
            treatment plan.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-emerald-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Plan confidence
              </p>
              <p className="mt-2 text-sm font-bold text-emerald-950">
                {getReportConfidence(latestAnalysis?.food_score)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Formula status
              </p>
              <p className="mt-2 text-sm font-bold text-emerald-950">
                {getFormulaStatus(latestAnalysis)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Best recheck time
              </p>
              <p className="mt-2 text-sm font-bold text-emerald-950">
                {getRecheckWindow(latestAnalysis)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="break-inside-avoid rounded-xl border border-gray-200 bg-gray-50 p-6 print:border-gray-300">
            <h2 className="text-lg font-semibold text-black">
              Pet profile
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
              Calories and portions
            </h2>

            {latestAnalysis ? (
              <div className="mt-4 space-y-4">
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-gray-500">Resting calories</dt>
                    <dd className="font-semibold text-black">
                      {latestAnalysis.rer} kcal
                    </dd>
                    <dd className="mt-1 text-xs text-gray-500">
                      Basic energy before lifestyle adjustments.
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Daily target</dt>
                    <dd className="font-semibold text-black">
                      {latestAnalysis.mer} kcal
                    </dd>
                    <dd className="mt-1 text-xs text-gray-500">
                      Practical target for the current plan.
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Daily grams</dt>
                    <dd className="font-semibold text-black">
                      {latestAnalysis.feeding_grams_per_day
                        ? `${latestAnalysis.feeding_grams_per_day}g/day`
                        : "-"}
                    </dd>
                    <dd className="mt-1 text-xs text-gray-500">
                      {getFeedingDetail(latestAnalysis)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Weight goal</dt>
                    <dd className="font-semibold text-black">
                      {getGoalLabel(latestAnalysis.weight_goal)}
                    </dd>
                  </div>
                </dl>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                    <p className="font-semibold text-black">
                      What resting calories mean
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {calorieExplanation.rest}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                    <p className="font-semibold text-black">
                      What daily target means
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {calorieExplanation.daily}
                    </p>
                  </div>
                </div>

                {latestAnalysis.matched_food_name && (
                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                    <p className="text-gray-500">Selected food</p>
                    <p className="mt-1 font-semibold text-black">
                      {latestAnalysis.matched_food_name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {getFoodMatchDetail(latestAnalysis)}
                    </p>
                  </div>
                )}

                {latestAnalysis.matched_food_name &&
                  latestAnalysis.feeding_grams_per_day && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
                      <p className="font-semibold text-emerald-950">
                        Feeding plan
                      </p>
                      <p className="mt-2 text-2xl font-bold text-emerald-950">
                        {latestAnalysis.feeding_grams_per_day}g/day
                      </p>
                      <p className="mt-1 text-xs text-emerald-900">
                        Start here, monitor weight and stool, then adjust with
                        a progress check instead of changing portions blindly.
                      </p>
                      {mealSplit && (
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="rounded-lg bg-white p-3">
                            <p className="text-xs uppercase text-emerald-700">
                              2 meals
                            </p>
                            <p className="font-semibold text-emerald-950">
                              {mealSplit.twoMeals}g per meal
                            </p>
                          </div>
                          <div className="rounded-lg bg-white p-3">
                            <p className="text-xs uppercase text-emerald-700">
                              3 meals
                            </p>
                            <p className="font-semibold text-emerald-950">
                              {mealSplit.threeMeals}g per meal
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                  <p className="text-gray-500">How to use this report</p>
                  <p className="mt-1 font-semibold text-black">
                    {getReportConfidence(latestAnalysis.food_score)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Confidence depends on pet context, the saved food match,
                    and the nutrition data available for that formula.
                  </p>
                </div>

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

        {latestAnalysis && (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 print:border-gray-300">
            <h2 className="text-xl font-semibold text-black">
              Practical Next Steps
            </h2>

            <div className="mt-4 space-y-3">
              {getReportNextSteps(latestAnalysis).map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="break-inside-avoid rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-black print:border-gray-300"
                >
                  {index + 1}. {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {latestAnalysis && (
          <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6 print:border-gray-300">
            <h2 className="text-xl font-semibold text-blue-950">
              Monitoring Checklist
            </h2>
            <p className="mt-2 text-sm text-blue-900">
              Use this section between reports so the next chatbot check-in has
              real progress data, not guesswork.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {getMonitoringChecklist(latestAnalysis).map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="break-inside-avoid rounded-xl border border-blue-100 bg-white p-4 text-sm text-blue-950 print:border-gray-300"
                >
                  {index + 1}. {item}
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
