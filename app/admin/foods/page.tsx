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
  is_recommendable?: boolean | null;
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
  const [recommendableFilter, setRecommendableFilter] = useState("all");
  const [visibilityMessage, setVisibilityMessage] = useState("");

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
      const isRecommendable = food.is_recommendable !== false;
      const matchesRecommendable =
        recommendableFilter === "all" ||
        (recommendableFilter === "yes" && isRecommendable) ||
        (recommendableFilter === "no" && !isRecommendable);

      return matchesSearch && matchesSpecies && matchesQuality && matchesRecommendable;
    });
  }, [foods, qualityFilter, recommendableFilter, search, speciesFilter]);

  const brandControls = useMemo(() => {
    const byBrand = new Map<string, AdminFood[]>();
    foods.forEach((food) => {
      byBrand.set(food.brand, [...(byBrand.get(food.brand) ?? []), food]);
    });

    return [...byBrand.entries()]
      .map(([brand, brandFoods]) => ({
        brand,
        total: brandFoods.length,
        enabled: brandFoods.filter((food) => food.is_recommendable !== false)
          .length,
      }))
      .sort((a, b) => a.brand.localeCompare(b.brand));
  }, [foods]);

  async function updateRecommendationVisibility({
    brand,
    foodIds,
    isRecommendable,
  }: {
    brand?: string;
    foodIds?: string[];
    isRecommendable: boolean;
  }) {
    try {
      setError("");
      setVisibilityMessage("");

      const response = await fetch(
        "/api/admin/foods/recommendation-visibility",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand,
            food_ids: foodIds,
            is_recommendable: isRecommendable,
          }),
        }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to update recommendation visibility."
        );
      }

      setVisibilityMessage(
        `${result.updatedRows ?? 0} food rows updated for recommendations.`
      );
      await loadFoods();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update recommendation visibility."
      );
    }
  }

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
              href="/admin/foods/v2-preview"
              className="rounded-xl border border-black px-5 py-3 text-center text-black transition hover:bg-gray-100"
            >
              V2 Preview
            </Link>

            <Link
              href="/admin/foods/v2-review"
              className="rounded-xl border border-black px-5 py-3 text-center text-black transition hover:bg-gray-100"
            >
              V2 Review
            </Link>

            <Link
              href="/admin/foods/v2-recommendation-visibility"
              className="rounded-xl border border-black px-5 py-3 text-center text-black transition hover:bg-gray-100"
            >
              V2 Visibility
            </Link>

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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
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

            <div>
              <label className="mb-2 block text-sm font-medium text-black">
                Recommendations
              </label>

              <select
                value={recommendableFilter}
                onChange={(e) => setRecommendableFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 text-black"
              >
                <option value="all">All</option>
                <option value="yes">Allowed</option>
                <option value="no">Hidden</option>
              </select>
            </div>
          </div>
        </div>

        {visibilityMessage && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {visibilityMessage}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-black">
                Brand recommendation controls
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Turn a brand on or off for recommendations without deleting its
                foods from the database.
              </p>
            </div>
            <p className="text-sm text-gray-500">
              {brandControls.length} brands
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {brandControls.map((item) => {
              const allEnabled = item.enabled === item.total;
              return (
                <label
                  key={item.brand}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 p-3"
                >
                  <input
                    type="checkbox"
                    checked={allEnabled}
                    onChange={(event) =>
                      updateRecommendationVisibility({
                        brand: item.brand,
                        isRecommendable: event.target.checked,
                      })
                    }
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    <span className="block font-semibold text-black">
                      {item.brand}
                    </span>
                    <span className="mt-1 block text-xs text-gray-600">
                      {item.enabled}/{item.total} allowed
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

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

                  <label className="mt-4 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={food.is_recommendable !== false}
                      onChange={(event) =>
                        updateRecommendationVisibility({
                          foodIds: [food.id],
                          isRecommendable: event.target.checked,
                        })
                      }
                      className="mt-1 h-4 w-4"
                    />
                    <span>
                      <span className="font-semibold text-black">
                        Allow in recommended foods
                      </span>
                      <span className="mt-1 block text-gray-600">
                        Hidden foods stay in admin data but are excluded from
                        customer recommendations.
                      </span>
                    </span>
                  </label>

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
