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

export default function FoodV2NutrientGapsPage() {
  const [report, setReport] = useState<NutrientGapResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("high");
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
      const matchesSearch =
        !normalizedSearch ||
        `${row.brand} ${row.display_name} ${row.formula_key}`
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesPriority && matchesBrand && matchesSpecies && matchesSearch;
    });
  }, [brandFilter, priorityFilter, report, search, speciesFilter]);

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
