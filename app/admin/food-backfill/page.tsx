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
        ) : (
          <div className="space-y-4">
            {queue.map((item) => (
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
