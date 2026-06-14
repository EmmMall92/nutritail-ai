"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type CountItem = {
  key: string;
  count: number;
};

type NutrientGapRow = {
  priority: string;
  gap_score: number;
  brand: string;
  display_name: string;
  species: string;
  format: string;
  life_stage: string;
  data_quality_status: string;
  source_priority: string;
  formula_key: string;
  missing_blockers: string[];
  estimated_fields_to_replace: string[];
  missing_helpful_fields: string[];
  health_context: string[];
  recommended_evidence: string;
  next_action: string;
  data_source_url: string;
};

type NutrientGapResponse = {
  generated_from: string;
  total_rows: number;
  summary: {
    by_priority: Record<string, number>;
    by_species: Record<string, number>;
    top_brands: CountItem[];
    top_blockers: CountItem[];
    top_estimated_fields: CountItem[];
    top_health_context: CountItem[];
  };
  rows: NutrientGapRow[];
};

type PriorityFilter = "all" | "high" | "medium" | "low";
type FocusFilter = "all" | "energy" | "estimated" | "health";

type BrandFocusRow = {
  brand: string;
  total: number;
  high: number;
  energy: number;
  estimated: number;
  health: number;
};

type BrandWorkPlan = BrandFocusRow & {
  nextStep: string;
  topBlockers: CountItem[];
  topEstimates: CountItem[];
};

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

function priorityClasses(priority: string) {
  if (priority === "high") return "border-red-200 bg-red-50 text-red-700";
  if (priority === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-gray-200 bg-gray-50 text-gray-700";
}

function ListText({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="text-gray-400">none</span>;
  return <span>{items.join(", ")}</span>;
}

function CountList({ title, items }: { title: string; items: CountItem[] }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-black">{title}</h2>
      <div className="mt-4 space-y-2 text-sm">
        {items.length === 0 ? (
          <p className="text-gray-500">No data yet.</p>
        ) : (
          items.slice(0, 8).map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2"
            >
              <span className="text-gray-700">{item.key}</span>
              <span className="font-semibold text-black">{item.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ActionSummaryCard({
  label,
  value,
  helper,
  onClick,
}: {
  label: string;
  value: number;
  helper: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-black hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-black">{value}</p>
      <p className="mt-2 text-sm leading-6 text-gray-600">{helper}</p>
    </button>
  );
}

function BrandFocusCard({
  row,
  isActive,
  onClick,
}: {
  row: BrandFocusRow;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left shadow-sm transition hover:border-black hover:shadow-md ${
        isActive ? "border-black bg-gray-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-black">{row.brand}</p>
          <p className="mt-1 text-xs text-gray-500">
            {row.total} rows need review
          </p>
        </div>
        {row.high > 0 && (
          <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
            {row.high} high
          </span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl bg-gray-50 px-2 py-2">
          <p className="font-bold text-black">{row.energy}</p>
          <p className="text-gray-500">kcal</p>
        </div>
        <div className="rounded-xl bg-gray-50 px-2 py-2">
          <p className="font-bold text-black">{row.estimated}</p>
          <p className="text-gray-500">est.</p>
        </div>
        <div className="rounded-xl bg-gray-50 px-2 py-2">
          <p className="font-bold text-black">{row.health}</p>
          <p className="text-gray-500">health</p>
        </div>
      </div>
    </button>
  );
}

function visibilityHref(row: NutrientGapRow) {
  const params = new URLSearchParams({
    search: row.formula_key || `${row.brand} ${row.display_name}`,
  });

  return `/admin/foods/v2-recommendation-visibility?${params.toString()}`;
}

function countTopItems(rows: NutrientGapRow[], field: keyof NutrientGapRow) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const value = row[field];
    if (!Array.isArray(value)) continue;

    for (const item of value) {
      counts.set(item, (counts.get(item) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, 5);
}

function getBrandWorkPlan(brand: string, rows: NutrientGapRow[]) {
  if (!brand || rows.length === 0) return null;

  const plan: BrandWorkPlan = {
    brand,
    total: rows.length,
    high: rows.filter((row) => row.priority === "high").length,
    energy: rows.filter((row) =>
      row.missing_blockers.some((field) => field.includes("kcal"))
    ).length,
    estimated: rows.filter((row) => row.estimated_fields_to_replace.length > 0)
      .length,
    health: rows.filter((row) => row.health_context.length > 0).length,
    nextStep: "",
    topBlockers: countTopItems(rows, "missing_blockers"),
    topEstimates: countTopItems(rows, "estimated_fields_to_replace"),
  };

  if (plan.high > 0) {
    plan.nextStep = "Start with high-priority rows before importing more data.";
  } else if (plan.energy > 0) {
    plan.nextStep = "Confirm official kcal first so portion advice becomes reliable.";
  } else if (plan.estimated > 0) {
    plan.nextStep = "Replace calculated values with official label or PDF values.";
  } else if (plan.health > 0) {
    plan.nextStep = "Review health-sensitive formulas before recommending them confidently.";
  } else {
    plan.nextStep = "This brand is mostly cleanup-ready; review low-priority helpful gaps.";
  }

  return plan;
}

export default function FoodV2NutrientGapsPage() {
  const [report, setReport] = useState<NutrientGapResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("high");
  const [focusFilter, setFocusFilter] = useState<FocusFilter>("all");
  const [brandFilter, setBrandFilter] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");

  async function loadReport() {
    try {
      setError("");
      setIsLoading(true);
      const response = await fetch("/api/admin/foods/v2-nutrient-gaps", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load Food V2 nutrient gaps.");
      }

      setReport(result as NutrientGapResponse);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load Food V2 nutrient gaps."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReport();
  }, []);

  const brandOptions = useMemo(
    () =>
      Array.from(new Set((report?.rows ?? []).map((row) => row.brand)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [report]
  );

  const visibleRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return (report?.rows ?? []).filter((row) => {
      const matchesPriority =
        priorityFilter === "all" || row.priority === priorityFilter;
      const matchesBrand = !brandFilter || row.brand === brandFilter;
      const matchesSpecies = !speciesFilter || row.species === speciesFilter;
      const matchesFocus =
        focusFilter === "all" ||
        (focusFilter === "energy" &&
          row.missing_blockers.some((field) => field.includes("kcal"))) ||
        (focusFilter === "estimated" &&
          row.estimated_fields_to_replace.length > 0) ||
        (focusFilter === "health" && row.health_context.length > 0);
      const matchesSearch =
        !normalizedSearch ||
        `${row.brand} ${row.display_name} ${row.formula_key} ${row.missing_blockers.join(
          " "
        )} ${row.estimated_fields_to_replace.join(" ")} ${row.missing_helpful_fields.join(
          " "
        )} ${row.health_context.join(" ")} ${row.next_action}`
          .toLowerCase()
          .includes(normalizedSearch);

      return (
        matchesPriority &&
        matchesBrand &&
        matchesSpecies &&
        matchesFocus &&
        matchesSearch
      );
    });
  }, [brandFilter, focusFilter, priorityFilter, report, search, speciesFilter]);

  const actionCounts = useMemo(() => {
    const rows = report?.rows ?? [];
    return {
      high: rows.filter((row) => row.priority === "high").length,
      energy: rows.filter((row) =>
        row.missing_blockers.some((field) => field.includes("kcal"))
      ).length,
      estimated: rows.filter((row) => row.estimated_fields_to_replace.length > 0)
        .length,
      healthSensitive: rows.filter((row) => row.health_context.length > 0).length,
    };
  }, [report?.rows]);

  const brandFocusRows = useMemo(() => {
    const rowsByBrand = new Map<string, BrandFocusRow>();

    for (const row of report?.rows ?? []) {
      const brand = row.brand || "Unknown";
      const current =
        rowsByBrand.get(brand) ??
        {
          brand,
          total: 0,
          high: 0,
          energy: 0,
          estimated: 0,
          health: 0,
        };

      current.total += 1;
      if (row.priority === "high") current.high += 1;
      if (row.missing_blockers.some((field) => field.includes("kcal"))) {
        current.energy += 1;
      }
      if (row.estimated_fields_to_replace.length > 0) current.estimated += 1;
      if (row.health_context.length > 0) current.health += 1;

      rowsByBrand.set(brand, current);
    }

    return Array.from(rowsByBrand.values())
      .sort(
        (a, b) =>
          b.high - a.high ||
          b.health - a.health ||
          b.total - a.total ||
          a.brand.localeCompare(b.brand)
      )
      .slice(0, 12);
  }, [report?.rows]);

  const selectedBrandRows = useMemo(
    () => (report?.rows ?? []).filter((row) => row.brand === brandFilter),
    [brandFilter, report?.rows]
  );

  const selectedBrandWorkPlan = useMemo(
    () => getBrandWorkPlan(brandFilter, selectedBrandRows),
    [brandFilter, selectedBrandRows]
  );

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
                Nutrient gap priorities
              </h1>
              <p className="mt-2 max-w-3xl text-gray-600">
                Review which formulas need official kcal, calcium, phosphorus,
                ash, moisture, sodium, magnesium, omega, EPA or DHA backfill
                before confident recommendations.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadReport}
                disabled={isLoading}
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

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading && !report && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            Loading Food V2 nutrient gap priorities...
          </div>
        )}

        {report && (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Rows With Gaps"
                value={report.total_rows}
                helper="Rows in the generated priority queue"
              />
              <SummaryCard
                label="High Priority"
                value={report.summary.by_priority.high ?? 0}
                helper="Blockers or condition-sensitive gaps"
              />
              <SummaryCard
                label="Medium Priority"
                value={report.summary.by_priority.medium ?? 0}
                helper="Estimated values or useful backfills"
              />
              <SummaryCard
                label="Low Priority"
                value={report.summary.by_priority.low ?? 0}
                helper="Nice-to-have cleanup"
              />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-black">
                    Best next cleanup actions
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Use these shortcuts to focus on gaps that most affect
                    customer recommendations and confidence wording.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPriorityFilter("all");
                    setFocusFilter("all");
                    setSearch("");
                    setBrandFilter("");
                    setSpeciesFilter("");
                  }}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white"
                >
                  Clear filters
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                <ActionSummaryCard
                  label="High priority"
                  value={actionCounts.high}
                  helper="Blockers or condition-sensitive formula gaps"
                  onClick={() => {
                    setPriorityFilter("high");
                    setFocusFilter("all");
                    setSearch("");
                  }}
                />
                <ActionSummaryCard
                  label="Needs kcal"
                  value={actionCounts.energy}
                  helper="Rows where official or calculated energy should be confirmed"
                  onClick={() => {
                    setPriorityFilter("all");
                    setFocusFilter("energy");
                    setSearch("");
                  }}
                />
                <ActionSummaryCard
                  label="Replace estimates"
                  value={actionCounts.estimated}
                  helper="Rows using calculated values that should be replaced by source data"
                  onClick={() => {
                    setPriorityFilter("all");
                    setFocusFilter("estimated");
                    setSearch("");
                  }}
                />
                <ActionSummaryCard
                  label="Health context"
                  value={actionCounts.healthSensitive}
                  helper="Rows tied to urinary, renal, weight, growth, GI, or allergy logic"
                  onClick={() => {
                    setPriorityFilter("all");
                    setFocusFilter("health");
                    setSearch("");
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <CountList
                title="Top blockers"
                items={report.summary.top_blockers}
              />
              <CountList
                title="Estimated fields"
                items={report.summary.top_estimated_fields}
              />
              <CountList
                title="Health context"
                items={report.summary.top_health_context}
              />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-black">
                    Brand focus queue
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Prioritize cleanup brand by brand, with high-impact kcal,
                    estimated-value, and health-context gaps surfaced first.
                  </p>
                </div>
                {brandFilter && (
                  <button
                    type="button"
                    onClick={() => setBrandFilter("")}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-50"
                  >
                    Clear brand
                  </button>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {brandFocusRows.map((row) => (
                  <BrandFocusCard
                    key={row.brand}
                    row={row}
                    isActive={brandFilter === row.brand}
                    onClick={() => {
                      setBrandFilter(row.brand);
                      setPriorityFilter("all");
                      setFocusFilter("all");
                      setSearch("");
                    }}
                  />
                ))}
              </div>

              {selectedBrandWorkPlan && (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                        Selected brand work plan
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-emerald-950">
                        {selectedBrandWorkPlan.brand}
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm text-emerald-900">
                        {selectedBrandWorkPlan.nextStep}
                      </p>
                    </div>
                    <Link
                      href={`/admin/foods/v2-review?search=${encodeURIComponent(
                        selectedBrandWorkPlan.brand
                      )}`}
                      className="rounded-xl bg-emerald-700 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-800"
                    >
                      Open brand review
                    </Link>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                    <button
                      type="button"
                      onClick={() => {
                        setPriorityFilter("all");
                        setFocusFilter("all");
                      }}
                      className="rounded-xl bg-white p-3 text-left text-sm shadow-sm transition hover:ring-1 hover:ring-emerald-300"
                    >
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="mt-1 text-2xl font-bold text-black">
                        {selectedBrandWorkPlan.total}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPriorityFilter("high");
                        setFocusFilter("all");
                      }}
                      className="rounded-xl bg-white p-3 text-left text-sm shadow-sm transition hover:ring-1 hover:ring-emerald-300"
                    >
                      <p className="text-xs text-gray-500">High</p>
                      <p className="mt-1 text-2xl font-bold text-black">
                        {selectedBrandWorkPlan.high}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPriorityFilter("all");
                        setFocusFilter("energy");
                      }}
                      className="rounded-xl bg-white p-3 text-left text-sm shadow-sm transition hover:ring-1 hover:ring-emerald-300"
                    >
                      <p className="text-xs text-gray-500">Needs kcal</p>
                      <p className="mt-1 text-2xl font-bold text-black">
                        {selectedBrandWorkPlan.energy}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPriorityFilter("all");
                        setFocusFilter("estimated");
                      }}
                      className="rounded-xl bg-white p-3 text-left text-sm shadow-sm transition hover:ring-1 hover:ring-emerald-300"
                    >
                      <p className="text-xs text-gray-500">Estimates</p>
                      <p className="mt-1 text-2xl font-bold text-black">
                        {selectedBrandWorkPlan.estimated}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPriorityFilter("all");
                        setFocusFilter("health");
                      }}
                      className="rounded-xl bg-white p-3 text-left text-sm shadow-sm transition hover:ring-1 hover:ring-emerald-300"
                    >
                      <p className="text-xs text-gray-500">Health</p>
                      <p className="mt-1 text-2xl font-bold text-black">
                        {selectedBrandWorkPlan.health}
                      </p>
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl bg-white p-4">
                      <p className="text-sm font-semibold text-black">
                        Top blockers
                      </p>
                      <div className="mt-3 space-y-2 text-sm text-gray-700">
                        {selectedBrandWorkPlan.topBlockers.length === 0 ? (
                          <p className="text-gray-500">No blockers listed.</p>
                        ) : (
                          selectedBrandWorkPlan.topBlockers.map((item) => (
                            <p
                              key={item.key}
                              className="flex justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2"
                            >
                              <span>{item.key}</span>
                              <span className="font-semibold">{item.count}</span>
                            </p>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-white p-4">
                      <p className="text-sm font-semibold text-black">
                        Estimated fields to replace
                      </p>
                      <div className="mt-3 space-y-2 text-sm text-gray-700">
                        {selectedBrandWorkPlan.topEstimates.length === 0 ? (
                          <p className="text-gray-500">
                            No estimated fields listed.
                          </p>
                        ) : (
                          selectedBrandWorkPlan.topEstimates.map((item) => (
                            <p
                              key={item.key}
                              className="flex justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2"
                            >
                              <span>{item.key}</span>
                              <span className="font-semibold">{item.count}</span>
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search brand, formula, key..."
                  className="rounded-xl border border-gray-300 px-4 py-3 text-sm text-black outline-none focus:border-black"
                />
                <select
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(event.target.value as PriorityFilter)
                  }
                  className="rounded-xl border border-gray-300 px-4 py-3 text-sm text-black outline-none focus:border-black"
                >
                  <option value="all">All priorities</option>
                  <option value="high">High priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="low">Low priority</option>
                </select>
                <select
                  value={brandFilter}
                  onChange={(event) => setBrandFilter(event.target.value)}
                  className="rounded-xl border border-gray-300 px-4 py-3 text-sm text-black outline-none focus:border-black"
                >
                  <option value="">All brands</option>
                  {brandOptions.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
                <select
                  value={speciesFilter}
                  onChange={(event) => setSpeciesFilter(event.target.value)}
                  className="rounded-xl border border-gray-300 px-4 py-3 text-sm text-black outline-none focus:border-black"
                >
                  <option value="">All species</option>
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-5 py-4">
                <h2 className="text-lg font-semibold text-black">
                  Review queue
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Showing {visibleRows.length} of {report.total_rows} rows from{" "}
                  {report.generated_from}.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Food</th>
                      <th className="px-4 py-3">Blockers</th>
                      <th className="px-4 py-3">Estimated</th>
                      <th className="px-4 py-3">Helpful Gaps</th>
                      <th className="px-4 py-3">Next Action</th>
                      <th className="px-4 py-3">Admin Links</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleRows.slice(0, 250).map((row) => (
                      <tr key={row.formula_key} className="align-top">
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityClasses(
                              row.priority
                            )}`}
                          >
                            {row.priority} · {row.gap_score}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-black">
                            {row.brand} - {row.display_name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {row.species} / {row.format} / {row.life_stage} ·{" "}
                            {row.data_quality_status} · {row.source_priority}
                          </p>
                          {row.health_context.length > 0 && (
                            <p className="mt-1 text-xs text-gray-600">
                              Context: {row.health_context.join(", ")}
                            </p>
                          )}
                          <p className="mt-1 font-mono text-xs text-gray-400">
                            {row.formula_key}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          <ListText items={row.missing_blockers} />
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          <ListText items={row.estimated_fields_to_replace} />
                        </td>
                        <td className="max-w-xs px-4 py-4 text-gray-700">
                          <ListText items={row.missing_helpful_fields} />
                        </td>
                        <td className="max-w-sm px-4 py-4 text-gray-700">
                          <p>{row.next_action}</p>
                          <p className="mt-2 text-xs text-gray-500">
                            Evidence: {row.recommended_evidence}
                          </p>
                        </td>
                        <td className="min-w-44 px-4 py-4">
                          <div className="flex flex-col gap-2 text-xs font-semibold">
                            <Link
                              href={visibilityHref(row)}
                              className="rounded-lg border border-gray-300 px-3 py-2 text-center text-black transition hover:bg-gray-50"
                            >
                              Visibility
                            </Link>
                            <Link
                              href={`/admin/foods/v2-review?search=${encodeURIComponent(
                                row.formula_key || row.display_name
                              )}`}
                              className="rounded-lg border border-gray-300 px-3 py-2 text-center text-black transition hover:bg-gray-50"
                            >
                              Review
                            </Link>
                            {row.data_source_url && (
                              <a
                                href={row.data_source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg bg-black px-3 py-2 text-center text-white transition hover:opacity-90"
                              >
                                Source
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
