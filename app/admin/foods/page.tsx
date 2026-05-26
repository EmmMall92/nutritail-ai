"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getFoodCompleteness } from "@/lib/foodCompleteness";

type AdminFood = {
  id: string;
  brand: string;
  name: string;
  species: string;
  life_stage?: string | null;
  created_at?: string;

  kcal_per_100g?: number | null;
  protein_percent?: number | null;
  fat_percent?: number | null;
  fiber_percent?: number | null;
  sodium_percent?: number | null;
  magnesium_percent?: number | null;
  calcium_percent?: number | null;
  phosphorus_percent?: number | null;

  data_quality_status?:
    | "needs_review"
    | "partial"
    | "verified"
    | "unknown";

  data_source_url?: string | null;
  data_notes?: string | null;
};

const DATA_STATUS_OPTIONS = [
  "all",
  "needs_review",
  "partial",
  "verified",
  "unknown",
] as const;

export default function AdminFoodsPage() {
  const [foods, setFoods] = useState<AdminFood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");

  const [qualityFilter, setQualityFilter] = useState<
    | "all"
    | "needs_review"
    | "partial"
    | "verified"
    | "unknown"
  >("all");

  useEffect(() => {
    loadFoods();
  }, []);

  async function loadFoods() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/admin/foods", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load foods.");
      }

      setFoods(result.foods ?? []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load foods.");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const fullName = `${food.brand} ${food.name}`.toLowerCase();

      const matchesSearch =
        search.trim() === "" ||
        fullName.includes(search.toLowerCase().trim());

      const matchesSpecies =
        speciesFilter === "all" || food.species === speciesFilter;

      const matchesQuality =
        qualityFilter === "all" ||
        food.data_quality_status === qualityFilter;

      return matchesSearch && matchesSpecies && matchesQuality;
    });
  }, [foods, qualityFilter, search, speciesFilter]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">
              Foods Database
            </h1>

            <p className="mt-2 text-gray-600">
              Manage foods, nutrition fields, enrichment data, and quality
              status.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/foods/enrichment-import"
              className="rounded-xl border border-black px-5 py-3 text-center text-black transition hover:bg-gray-100"
            >
              Import Enrichment
            </Link>

            <Link
              href="/admin/foods/new"
              className="rounded-xl bg-black px-5 py-3 text-center text-white transition hover:opacity-90"
            >
              + Add Food
            </Link>
          </div>

        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-black">
                Search
              </label>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by brand or name..."
                className="w-full rounded-xl border border-gray-300 p-3 text-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black">
                Species
              </label>

              <select
                value={speciesFilter}
                onChange={(e) => setSpeciesFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 text-black"
              >
                <option value="all">All</option>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black">
                Data quality
              </label>

              <select
                value={qualityFilter}
                onChange={(e) =>
                  setQualityFilter(
                    e.target.value as
                      | "all"
                      | "needs_review"
                      | "partial"
                      | "verified"
                      | "unknown"
                  )
                }
                className="w-full rounded-xl border border-gray-300 p-3 text-black"
              >
                {DATA_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {isLoading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-black">Loading foods...</p>
              <p className="mt-2 text-sm text-gray-600">
                We are fetching the active food catalog.
              </p>
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-black">No foods found</p>
              <p className="mt-2 text-sm text-gray-600">
                Try clearing filters or add a new food to the catalog.
              </p>
            </div>
          ) : (
            filteredFoods.map((food) => {
              const completeness = getFoodCompleteness(food);

              return (
                <div
                  key={food.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xl font-semibold text-black">
                        {food.brand}
                      </p>

                      <p className="mt-1 text-gray-700">{food.name}</p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-black">
                          {food.species}
                        </span>

                        {food.life_stage && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-black">
                            {food.life_stage}
                          </span>
                        )}
                      </div>

                      <p className="mt-4 text-sm text-gray-600">
                        Data quality:{" "}
                        <span className="font-semibold text-black">
                          {food.data_quality_status ?? "needs_review"}
                        </span>
                      </p>
                    </div>

                    <Link
                      href={`/admin/foods/${food.id}`}
                      className="rounded-xl border border-black px-4 py-2 text-center text-sm text-black transition hover:bg-gray-100"
                    >
                      Edit
                    </Link>
                  </div>

                  <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-black">
                        Nutrition completeness
                      </p>

                      <p className="text-sm text-gray-600">
                        {completeness.filledCount}/
                        {completeness.totalCount}
                      </p>
                    </div>

                    <div className="mt-3 h-2 rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-black transition-all"
                        style={{ width: `${completeness.score}%` }}
                      />
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      {completeness.score}% complete
                    </p>

                    {!completeness.isComplete && (
                      <p className="mt-2 text-xs text-gray-500">
                        Missing: {completeness.missing.join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-gray-500">Kcal/100g</p>
                      <p className="mt-1 font-semibold text-black">
                        {food.kcal_per_100g ?? "-"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-gray-500">Protein</p>
                      <p className="mt-1 font-semibold text-black">
                        {food.protein_percent ?? "-"}%
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-gray-500">Fat</p>
                      <p className="mt-1 font-semibold text-black">
                        {food.fat_percent ?? "-"}%
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-3">
                      <p className="text-gray-500">Fiber</p>
                      <p className="mt-1 font-semibold text-black">
                        {food.fiber_percent ?? "-"}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
