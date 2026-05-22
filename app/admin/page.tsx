"use client";

import { useEffect, useState } from "react";

type AdminStats = {
  totalFoods: number;
  dogFoods: number;
  catFoods: number;
  uniqueBrands: number;

  needsReviewFoods: number;
  partialFoods: number;
  verifiedFoods: number;
  unknownFoods: number;
};

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>

      <p className="mt-3 text-4xl font-bold text-black">{value}</p>

      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/admin/stats", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load stats.");
      }

      setStats(result as AdminStats);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Failed to load dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-black">
            Nutritail AI Admin
          </h1>

          <p className="mt-2 text-gray-600">
            Dashboard διαχείρισης τροφών, nutrition quality και database stats.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Foods"
                value={stats?.totalFoods ?? 0}
                description="All active foods in database"
              />

              <StatCard
                title="Dog Foods"
                value={stats?.dogFoods ?? 0}
                description="Foods for dogs"
              />

              <StatCard
                title="Cat Foods"
                value={stats?.catFoods ?? 0}
                description="Foods for cats"
              />

              <StatCard
                title="Brands"
                value={stats?.uniqueBrands ?? 0}
                description="Unique food brands"
              />
            </div>

            <div>
              <h2 className="mb-4 text-2xl font-bold text-black">
                Nutrition Data Quality
              </h2>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Needs Review"
                  value={stats?.needsReviewFoods ?? 0}
                  description="Foods that need nutrition review"
                />

                <StatCard
                  title="Partial Data"
                  value={stats?.partialFoods ?? 0}
                  description="Foods with incomplete nutrition data"
                />

                <StatCard
                  title="Verified Foods"
                  value={stats?.verifiedFoods ?? 0}
                  description="Foods with checked nutrition data"
                />

                <StatCard
                  title="Unknown Data"
                  value={stats?.unknownFoods ?? 0}
                  description="Foods where data could not be found"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <a
                href="/admin/foods"
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <h3 className="text-xl font-semibold text-black">
                  Foods Database
                </h3>

                <p className="mt-2 text-gray-600">
                  Διαχείριση τροφών, nutrition fields και quality status.
                </p>
              </a>

              <a
                href="/admin/customers"
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <h3 className="text-xl font-semibold text-black">
                  Customers
                </h3>

                <p className="mt-2 text-gray-600">
                  Διαχείριση λογαριασμών πελατών και bonus cards.
                </p>
              </a>

              <a
                href="/admin/pets"
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <h3 className="text-xl font-semibold text-black">
                  Pets & Analyses
                </h3>

                <p className="mt-2 text-gray-600">
                  Προβολή κατοικιδίων και nutrition analyses.
                </p>
              </a>
            </div>
          </>
        )}
      </section>
    </main>
  );
}