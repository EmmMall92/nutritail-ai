"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function AccountPage() {
  const router = useRouter();

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
          router.replace("/login");
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
  }, [router]);

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
  ).length;
  const readyReports = pets.filter(hasReadyReport).length;
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

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-black">
          Welcome, {customer.fullName}
        </h1>
        <p className="mt-2 text-gray-600">
          Your Nutritail AI dashboard for pet nutrition guidance, saved pets,
          and account details.
        </p>
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
            {petsNeedingAnalysis}
          </p>
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
              </>
            )}
            <Link
              href="/account/chatbot"
              className="rounded-xl bg-black px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-gray-800"
            >
              New analysis
            </Link>
          </div>
        </div>

        {latestAnalysis && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-700">
            {latestAnalysis.food_score !== null &&
              latestAnalysis.food_score !== undefined && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  Score {latestAnalysis.food_score}/100
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Suggested next step</p>
          <p className="mt-2 text-lg font-semibold text-black">
            {pets.length === 0
              ? "Create your first pet"
              : petsNeedingAnalysis > 0
                ? "Run missing analyses"
                : "Review latest report"}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {pets.length === 0
              ? "Start with the chatbot to save a profile and report."
              : petsNeedingAnalysis > 0
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
    </section>
  );
}
