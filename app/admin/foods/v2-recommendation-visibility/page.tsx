"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type VisibilityFood = {
  id: string;
  brand: string;
  name: string;
  species: string;
  data_quality_status: string;
  source_priority: string | null;
  is_recommendable: boolean;
  formula_key: string | null;
  safety: {
    recommendation_status: string;
    risk_level: string;
    gap_priority: string;
    gap_score: number | null;
    missing_blockers: string[];
    estimated_fields_to_replace: string[];
    health_context: string[];
    recommendation_reason: string;
    required_before_enable: string;
  } | null;
};

type VisibilityBrand = {
  brand: string;
  total: number;
  enabled: number;
  needs_review: number;
  retailer: number;
  official: number;
};

type VisibilityResponse = {
  catalog: string;
  totalRows: number;
  enabledRows: number;
  hiddenRows: number;
  brands: VisibilityBrand[];
  foods: VisibilityFood[];
  safety?: {
    auditRows: number;
    doNotEnableRows: number;
    cautiousRows: number;
    eligibleRows: number;
  };
};

type VisibilityFilter = "all" | "enabled" | "hidden";
type SafetyFilter =
  | "all"
  | "do_not_enable"
  | "hold_until_backfill"
  | "cautious_enable_only"
  | "review_before_enable"
  | "eligible_after_admin_choice";

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-black">{value}</p>
      <p className="mt-2 text-sm text-gray-600">{helper}</p>
    </div>
  );
}

function safetyClasses(status: string) {
  if (status === "do_not_enable") return "border-red-200 bg-red-50 text-red-700";
  if (status === "hold_until_backfill") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  if (status === "cautious_enable_only" || status === "review_before_enable") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (status === "eligible_after_admin_choice") {
    return "border-green-200 bg-green-50 text-green-700";
  }
  return "border-gray-200 bg-white text-gray-600";
}

export default function FoodV2RecommendationVisibilityPage() {
  const [report, setReport] = useState<VisibilityResponse | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>("all");
  const [safetyFilter, setSafetyFilter] = useState<SafetyFilter>("all");

  async function loadVisibility() {
    try {
      setError("");
      setIsLoading(true);
      const response = await fetch(
        "/api/admin/foods/recommendation-visibility?catalog=food_v2",
        { cache: "no-store" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Could not load Food V2 recommendation visibility."
        );
      }

      setReport(result as VisibilityResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load Food V2 recommendation visibility."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadVisibility();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSearch = params.get("search");
    const requestedSafety = params.get("safety");

    if (requestedSearch) setSearch(requestedSearch);
    if (
      requestedSafety === "do_not_enable" ||
      requestedSafety === "hold_until_backfill" ||
      requestedSafety === "cautious_enable_only" ||
      requestedSafety === "review_before_enable" ||
      requestedSafety === "eligible_after_admin_choice"
    ) {
      setSafetyFilter(requestedSafety);
    }
  }, []);

  const brandOptions = useMemo(
    () => report?.brands.map((brand) => brand.brand) ?? [],
    [report]
  );

  const visibleFoods = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (report?.foods ?? []).filter((food) => {
      const matchesSearch =
        !normalizedSearch ||
        `${food.brand} ${food.name}`.toLowerCase().includes(normalizedSearch);
      const matchesBrand = !brandFilter || food.brand === brandFilter;
      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "enabled" && food.is_recommendable) ||
        (visibilityFilter === "hidden" && !food.is_recommendable);
      const matchesSafety =
        safetyFilter === "all" ||
        food.safety?.recommendation_status === safetyFilter;

      return matchesSearch && matchesBrand && matchesVisibility && matchesSafety;
    });
  }, [brandFilter, report, safetyFilter, search, visibilityFilter]);

  async function updateVisibility({
    brand,
    foodIds,
    isRecommendable,
    all,
  }: {
    brand?: string;
    foodIds?: string[];
    isRecommendable: boolean;
    all?: boolean;
  }) {
    try {
      setError("");
      setMessage("");
      setIsSaving(true);

      const response = await fetch("/api/admin/foods/recommendation-visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalog: "food_v2",
          brand,
          food_ids: foodIds,
          all,
          is_recommendable: isRecommendable,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Could not update Food V2 recommendation visibility."
        );
      }

      setMessage(`${result.updatedRows ?? 0} Food V2 rows updated.`);
      await loadVisibility();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update Food V2 recommendation visibility."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Food V2
              </p>
              <h1 className="mt-2 text-3xl font-bold text-black">
                Recommendation visibility
              </h1>
              <p className="mt-2 max-w-3xl text-gray-600">
                Decide which Food V2 brands and formulas are allowed to appear
                in recommendation flows. Safety and nutrient gaps stay visible
                as advisory QA signals while products can still be enabled.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  updateVisibility({ all: true, isRecommendable: true })
                }
                disabled={isLoading || isSaving}
                className="rounded-xl bg-green-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Allow all Food V2
              </button>
              <button
                type="button"
                onClick={loadVisibility}
                disabled={isLoading || isSaving}
                className="rounded-xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-500"
              >
                {isLoading ? "Loading..." : "Refresh"}
              </button>
              <Link
                href="/admin/foods/v2-post-import-qa"
                className="rounded-xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-100"
              >
                Post-import QA
              </Link>
              <Link
                href="/admin/foods/v2-preview"
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Import Preview
              </Link>
            </div>
          </div>
        </div>

        {message && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {report && (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-6">
              <SummaryCard
                label="Food V2 Rows"
                value={report.totalRows}
                helper="Imported Food V2 products"
              />
              <SummaryCard
                label="Allowed"
                value={report.enabledRows}
                helper="Can appear in recommendations"
              />
              <SummaryCard
                label="Hidden"
                value={report.hiddenRows}
                helper="Kept out of recommendations"
              />
              <SummaryCard
                label="Do Not Enable"
                value={report.safety?.doNotEnableRows ?? 0}
                helper="Advisory QA warnings"
              />
              <SummaryCard
                label="Cautious"
                value={report.safety?.cautiousRows ?? 0}
                helper="Needs careful wording"
              />
              <SummaryCard
                label="Eligible"
                value={report.safety?.eligibleRows ?? 0}
                helper="Admin can choose"
              />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    Search
                  </label>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search brand or formula..."
                    className="w-full rounded-xl border border-gray-300 p-3 text-black"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    Brand
                  </label>
                  <select
                    value={brandFilter}
                    onChange={(event) => setBrandFilter(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-3 text-black"
                  >
                    <option value="">All brands</option>
                    {brandOptions.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    Visibility
                  </label>
                  <select
                    value={visibilityFilter}
                    onChange={(event) =>
                      setVisibilityFilter(event.target.value as VisibilityFilter)
                    }
                    className="w-full rounded-xl border border-gray-300 p-3 text-black"
                  >
                    <option value="all">All</option>
                    <option value="enabled">Allowed</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    Safety
                  </label>
                  <select
                    value={safetyFilter}
                    onChange={(event) =>
                      setSafetyFilter(event.target.value as SafetyFilter)
                    }
                    className="w-full rounded-xl border border-gray-300 p-3 text-black"
                  >
                    <option value="all">All safety statuses</option>
                    <option value="do_not_enable">Do not enable</option>
                    <option value="hold_until_backfill">Hold until backfill</option>
                    <option value="cautious_enable_only">Cautious only</option>
                    <option value="review_before_enable">Review before enable</option>
                    <option value="eligible_after_admin_choice">
                      Eligible after admin choice
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-black">
                    Brand controls
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Toggle a whole Food V2 brand after QA. This does not delete
                    rows.
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  {report.brands.length} brands
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {report.brands.map((brand) => {
                  const allEnabled = brand.enabled === brand.total;
                  return (
                    <label
                      key={brand.brand}
                      className="flex items-start gap-3 rounded-xl border border-gray-200 p-3"
                    >
                      <input
                        type="checkbox"
                        checked={allEnabled}
                        disabled={isSaving}
                        onChange={(event) =>
                          updateVisibility({
                            brand: brand.brand,
                            isRecommendable: event.target.checked,
                          })
                        }
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        <span className="block font-semibold text-black">
                          {brand.brand}
                        </span>
                        <span className="mt-1 block text-xs text-gray-600">
                          {brand.enabled}/{brand.total} allowed -{" "}
                          {brand.needs_review} needs review
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          {brand.official} official / {brand.retailer} retailer
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-black">
                    Formula controls
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Showing {visibleFoods.length} matching Food V2 formulas.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                {visibleFoods.slice(0, 80).map((food) => (
                  <div
                    key={food.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-black">{food.brand}</p>
                        <p className="mt-1 text-sm text-gray-700">
                          {food.name}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-white px-3 py-1 text-gray-700">
                            {food.species}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-gray-700">
                            {food.data_quality_status}
                          </span>
                          {food.source_priority && (
                            <span className="rounded-full bg-white px-3 py-1 text-gray-700">
                              {food.source_priority}
                            </span>
                          )}
                          {food.safety && (
                            <span
                              className={`rounded-full border px-3 py-1 font-semibold ${safetyClasses(
                                food.safety.recommendation_status
                              )}`}
                            >
                              {food.safety.recommendation_status.replaceAll(
                                "_",
                                " "
                              )}
                            </span>
                          )}
                        </div>
                        {food.safety && (
                          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700">
                            <p>
                              <span className="font-semibold">Safety:</span>{" "}
                              {food.safety.recommendation_reason}
                            </p>
                            {food.safety.missing_blockers.length > 0 && (
                              <p className="mt-1">
                                <span className="font-semibold">Blockers:</span>{" "}
                                {food.safety.missing_blockers.join(", ")}
                              </p>
                            )}
                            {food.safety.required_before_enable && (
                              <p className="mt-1">
                                <span className="font-semibold">Before enable:</span>{" "}
                                {food.safety.required_before_enable}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-black">
                        <input
                          type="checkbox"
                          checked={food.is_recommendable}
                          disabled={isSaving}
                          onChange={(event) =>
                            updateVisibility({
                              foodIds: [food.id],
                              isRecommendable: event.target.checked,
                            })
                          }
                          className="h-4 w-4"
                        />
                        Allowed
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
