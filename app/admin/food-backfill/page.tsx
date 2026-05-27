"use client";

import { useEffect, useMemo, useState } from "react";

type BackfillQueueItem = {
  label: string;
  brand: string;
  name: string;
  species: string;
  status: string;
  priority: "high" | "medium" | "low";
  missingCore: string[];
  missingOptionalMinerals: string[];
  missing: string[];
  evidenceNeeded: string;
  source: string;
  notes: string;
  requestText?: string;
};

function priorityClass(priority: string) {
  if (priority === "high") return "border-red-200 bg-red-50 text-red-700";
  if (priority === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-gray-200 bg-gray-50 text-gray-700";
}

export default function AdminFoodBackfillPage() {
  const [queue, setQueue] = useState<BackfillQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadQueue() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/admin/food-backfill-queue", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load backfill queue.");
        }

        setQueue(result.queue ?? []);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Failed to load backfill queue."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadQueue();
  }, []);

  const counts = useMemo(
    () => ({
      high: queue.filter((item) => item.priority === "high").length,
      medium: queue.filter((item) => item.priority === "medium").length,
      low: queue.filter((item) => item.priority === "low").length,
    }),
    [queue]
  );
  const brands = useMemo(
    () => Array.from(new Set(queue.map((item) => item.brand))).sort(),
    [queue]
  );
  const brandCounts = useMemo(
    () =>
      brands
        .map((brand) => ({
          brand,
          count: queue.filter((item) => item.brand === brand).length,
          high: queue.filter(
            (item) => item.brand === brand && item.priority === "high"
          ).length,
        }))
        .sort((a, b) => b.high - a.high || b.count - a.count || a.brand.localeCompare(b.brand)),
    [brands, queue]
  );
  const filteredQueue = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return queue.filter((item) => {
      if (priorityFilter !== "all" && item.priority !== priorityFilter) {
        return false;
      }

      if (brandFilter !== "all" && item.brand !== brandFilter) {
        return false;
      }

      if (!normalizedSearch) return true;

      return [
        item.label,
        item.brand,
        item.name,
        item.species,
        item.status,
        item.evidenceNeeded,
        item.missing.join(" "),
        item.notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [brandFilter, priorityFilter, queue, searchTerm]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black">Food Backfill Queue</h2>
        <p className="mt-2 text-gray-600">
          Prioritized formulas that need official PDFs, manufacturer responses,
          or label photos before the chatbot can speak confidently.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Generated artifacts: data/review/food_backfill_priority_queue.csv,
          data/review/food_backfill_priority_queue.json, and
          reports/food_backfill_evidence_requests.md.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total rows</p>
          <p className="mt-2 text-3xl font-bold text-black">{queue.length}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm text-red-700">High priority</p>
          <p className="mt-2 text-3xl font-bold text-red-800">
            {counts.high}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm text-amber-700">Medium priority</p>
          <p className="mt-2 text-3xl font-bold text-amber-800">
            {counts.medium}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Low priority</p>
          <p className="mt-2 text-3xl font-bold text-black">{counts.low}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-black">Brand backlog</p>
          <div className="mt-3 space-y-2">
            {brandCounts.slice(0, 8).map((item) => (
              <div
                key={item.brand}
                className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-black">{item.brand}</span>
                <span className="text-gray-600">
                  {item.count} rows{item.high > 0 ? ` / ${item.high} high` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-black">Review filters</p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="text-sm text-gray-700">
              Priority
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black"
              >
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label className="text-sm text-gray-700">
              Brand
              <select
                value={brandFilter}
                onChange={(event) => setBrandFilter(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black"
              >
                <option value="all">All brands</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-gray-700">
              Search
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Formula, field, evidence..."
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black"
              />
            </label>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Showing {filteredQueue.length} of {queue.length} queued rows.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-600">Loading backfill queue...</p>
        ) : queue.length === 0 ? (
          <p className="text-sm text-gray-600">
            No food backfill rows are currently queued.
          </p>
        ) : filteredQueue.length === 0 ? (
          <p className="text-sm text-gray-600">
            No queued rows match the current filters.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredQueue.map((item) => (
              <div
                key={`${item.brand}-${item.name}-${item.priority}`}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-black">{item.label}</p>
                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-semibold ${priorityClass(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {item.species} / {item.status} / {item.evidenceNeeded}
                    </p>
                    <p className="mt-2 text-sm text-gray-700">
                      Missing: {item.missing.join(", ")}
                    </p>
                    {item.source && (
                      <a
                        href={item.source}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block break-all text-sm text-blue-700 hover:underline"
                      >
                        {item.source}
                      </a>
                    )}
                    {item.requestText && (
                      <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                          Request text
                        </p>
                        <p className="mt-1 text-sm text-blue-900">
                          {item.requestText}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="max-w-xl text-sm text-gray-600">
                    {item.notes}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
