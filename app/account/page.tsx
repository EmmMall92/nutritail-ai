"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Customer = {
  id: string;
  authUserId?: string | null;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  bonusCardCode?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type AnalysisHistoryItem = {
  id: string;
  createdAt: string;
  matched_food_name?: string | null;
  feeding_grams_per_day?: number | null;
  food_score?: number | null;
};

type AccountPet = {
  id: string;
  name?: string | null;
  species?: string | null;
  weight?: number | null;
  analysisHistory?: AnalysisHistoryItem[];
};

function formatDate(value?: string) {
  if (!value) return "No analyses yet";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "No analyses yet";

  return date.toLocaleDateString();
}

function hasReadyReport(pet: AccountPet) {
  const latest = pet.analysisHistory?.[0];
  return Boolean(latest?.matched_food_name && latest?.feeding_grams_per_day);
}

function getPetLabel(pet: AccountPet) {
  const species = pet.species ? ` - ${pet.species}` : "";
  const weight = pet.weight ? ` - ${pet.weight} kg` : "";
  return `${pet.name ?? "Unnamed pet"}${species}${weight}`;
}

function getNutritionPlanStatusCopy(score?: number | null) {
  if (typeof score !== "number") {
    return {
      label: "Ready for first guidance",
      text: "Run a nutrition analysis to get calories, a food shortlist, and a simple first portion estimate for this pet.",
    };
  }

  if (score >= 80) {
    return {
      label: "Strong latest fit",
      text: "The latest plan looks solid. Recheck it if weight, appetite, stool, allergies, or the current food changes.",
    };
  }

  if (score >= 60) {
    return {
      label: "Useful latest shortlist",
      text: "The latest food choice is a good starting point. If anything feels off, run a quick progress check with the newest weight and feeding amount.",
    };
  }

  return {
    label: "Fresh check recommended",
    text: "The last match was cautious. Use the chatbot again with the exact bag name, a label photo, or updated pet details.",
  };
}

function getFoodFitLabel(score?: number | null) {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return "General guidance";
  }

  if (score >= 80) return "Strong fit";
  if (score >= 60) return "Useful fit";
  if (score >= 40) return "Worth rechecking";
  return "Fresh analysis suggested";
}

export default function AccountPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pets, setPets] = useState<AccountPet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAccount() {
      try {
        setError("");
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();

        if (!data.session?.user) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        const response = await fetch("/api/account/me", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authUserId: data.session.user.id,
            email: data.session.user.email,
            fullName:
              data.session.user.user_metadata?.full_name ||
              data.session.user.email ||
              "Customer",
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load account.");
        }

        setCustomer(result as Customer);

        const petsResponse = await fetch("/api/account/pets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authUserId: data.session.user.id,
          }),
        });

        const petsResult = await petsResponse.json();

        if (petsResponse.ok) {
          setPets((petsResult.pets ?? []) as AccountPet[]);
        }
      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error.message : "Failed to load account.");
      } finally {
        setIsLoading(false);
      }
    }

    loadAccount();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-black">Loading account...</p>
          <p className="mt-2 text-sm text-gray-600">
            We are fetching your profile, saved pets, and analysis summary.
          </p>
        </div>
      </section>
    );
  }

  if (!customer) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          {error || "Could not load account."}
        </div>
      </section>
    );
  }

  const totalAnalyses = pets.reduce(
    (count, pet) => count + (pet.analysisHistory?.length ?? 0),
    0
  );
  const petsNeedingAnalysis = pets.filter(
    (pet) => (pet.analysisHistory?.length ?? 0) === 0
  );
  const petsNeedingAnalysisCount = petsNeedingAnalysis.length;
  const readyReports = pets.filter(hasReadyReport).length;
  const profileProgress =
    pets.length === 0 ? 0 : Math.round((readyReports / pets.length) * 100);
  const latestAnalysisEntry = pets
    .flatMap((pet) =>
      (pet.analysisHistory ?? []).map((analysis) => ({ analysis, pet }))
    )
    .sort(
      (a, b) =>
        new Date(b.analysis.createdAt).getTime() -
        new Date(a.analysis.createdAt).getTime()
    )[0];
  const latestAnalysis = latestAnalysisEntry?.analysis;
  const latestPet = latestAnalysisEntry?.pet;
  const nextPetToAnalyze = petsNeedingAnalysis[0];
  const planStatusCopy = getNutritionPlanStatusCopy(
    latestAnalysis?.food_score
  );

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">
              Welcome, {customer.fullName}
            </h1>
            <p className="mt-2 max-w-3xl text-gray-600">
              Your Nutritail AI dashboard for pet nutrition guidance, saved
              pets, reports, and next steps.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-gray-700">
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {profileProgress}% report coverage
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {readyReports} ready reports
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {petsNeedingAnalysisCount} need analysis
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Link
              href="/account/chatbot"
              className="rounded-xl bg-black px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Start nutrition analysis
            </Link>
            <Link
              href="/account/pets"
              className="rounded-xl border border-gray-300 px-5 py-3 text-center text-sm font-medium text-black transition hover:bg-gray-100"
            >
              View my pets
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Saved pets</p>
          <p className="mt-2 text-3xl font-bold text-black">{pets.length}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Saved analyses</p>
          <p className="mt-2 text-3xl font-bold text-black">{totalAnalyses}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Reports ready</p>
          <p className="mt-2 text-3xl font-bold text-black">{readyReports}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Need analysis</p>
          <p className="mt-2 text-3xl font-bold text-black">
            {petsNeedingAnalysisCount}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Next best action
            </p>
            <h2 className="mt-2 text-2xl font-bold text-emerald-950">
              {pets.length === 0
                ? "Create your first pet profile"
                : nextPetToAnalyze
                  ? `Analyze ${nextPetToAnalyze.name ?? "your pet"}`
                  : "Review your latest report"}
            </h2>
            <p className="mt-2 text-sm text-emerald-900">
              {pets.length === 0
                ? "Start the guided chatbot flow to create a profile, calorie target, and first report."
                : nextPetToAnalyze
                  ? `${getPetLabel(
                      nextPetToAnalyze
                    )} does not have a saved nutrition analysis yet.`
                  : "All saved pets have report history. Open the latest report or run a fresh analysis if anything changed."}
            </p>
          </div>

          <Link
            href={
              nextPetToAnalyze
                ? `/account/pets/${nextPetToAnalyze.id}`
                : "/account/chatbot"
            }
            className="rounded-xl bg-emerald-700 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-emerald-800"
          >
            {nextPetToAnalyze ? "Open pet" : "Open chatbot"}
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-gray-500">Latest report</p>
            <h2 className="mt-2 text-xl font-semibold text-black">
              {latestPet?.name ?? "No saved report yet"}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {latestAnalysis
                ? `${formatDate(latestAnalysis.createdAt)}${
                    latestAnalysis.matched_food_name
                      ? ` - ${latestAnalysis.matched_food_name}`
                      : ""
                  }`
                : "Run an analysis to create the first report."}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {latestPet && (
              <>
                <Link
                  href={`/account/pets/${latestPet.id}`}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-center text-sm font-medium text-black transition hover:bg-gray-100"
                >
                  Open pet
                </Link>
                <Link
                  href={`/print/pet-report/${latestPet.id}`}
                  className="rounded-xl bg-green-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-green-700"
                >
                  Open report
                </Link>
                <Link
                  href={`/print/pet-timeline/${latestPet.id}`}
                  className="rounded-xl border border-green-300 px-4 py-2 text-center text-sm font-medium text-green-800 transition hover:bg-green-50"
                >
                  Timeline
                </Link>
              </>
            )}
            <Link
              href={
                latestPet
                  ? `/account/chatbot?petId=${latestPet.id}&mode=progress`
                  : "/account/chatbot"
              }
              className="rounded-xl bg-black px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-gray-800"
            >
              {latestPet ? "Progress check" : "New analysis"}
            </Link>
          </div>
        </div>

        {latestAnalysis && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-700">
            {latestAnalysis.food_score !== null &&
              latestAnalysis.food_score !== undefined && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  Food fit: {getFoodFitLabel(latestAnalysis.food_score)}
                </span>
              )}
            {latestAnalysis.feeding_grams_per_day && (
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {latestAnalysis.feeding_grams_per_day}g/day
              </span>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Nutrition plan status
            </p>
            <h2 className="mt-2 text-xl font-bold text-blue-950">
              {planStatusCopy.label}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-900">
              {planStatusCopy.text}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-blue-900">
              <span className="rounded-full bg-white px-3 py-1">
                Food choices come from the NutriTail food list
              </span>
              <span className="rounded-full bg-white px-3 py-1">
                Better label details improve the answer
              </span>
              <span className="rounded-full bg-white px-3 py-1">
                Health issues get extra-care guidance
              </span>
            </div>
          </div>

          <Link
            href={latestPet ? `/account/pets/${latestPet.id}` : "/account/chatbot"}
            className="rounded-xl bg-blue-700 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-blue-800"
          >
            {latestPet ? "Review pet context" : "Start analysis"}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Suggested next step</p>
          <p className="mt-2 text-lg font-semibold text-black">
            {pets.length === 0
              ? "Create your first pet"
              : petsNeedingAnalysisCount > 0
                ? "Run missing analyses"
                : "Review latest report"}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {pets.length === 0
              ? "Start with the chatbot to save a profile and report."
              : petsNeedingAnalysisCount > 0
                ? "Some saved pets do not have an analysis yet."
                : "Your pets have saved analysis history."}
          </p>
        </div>

        <Link
          href="/account/chatbot"
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-black">
            Nutrition Chatbot
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Start a new guided nutrition analysis for a saved pet or a new pet.
          </p>
        </Link>

        <Link
          href="/account/pets"
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-black">My Pets</h2>
          <p className="mt-2 text-sm text-gray-600">
            Review saved pet profiles, analysis history, reports, and timelines.
          </p>
        </Link>

        <Link
          href="/account/profile"
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-black">Profile</h2>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account details and customer information.
          </p>
        </Link>
      </div>

      {petsNeedingAnalysis.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-black">
                Pets needing analysis
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Start here to make every saved pet useful inside Nutritail.
              </p>
            </div>
            <Link
              href="/account/chatbot"
              className="rounded-xl border border-black px-4 py-2 text-center text-sm font-medium text-black transition hover:bg-gray-100"
            >
              Run analysis
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {petsNeedingAnalysis.slice(0, 3).map((pet) => (
              <Link
                key={pet.id}
                href={`/account/pets/${pet.id}`}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-black"
              >
                <p className="font-semibold text-black">
                  {pet.name ?? "Unnamed pet"}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {pet.species ?? "pet"}
                  {pet.weight ? ` - ${pet.weight} kg` : ""}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
