"use client";

import { useEffect, useState } from "react";
import type { AdminActivityLog } from "@/types/admin-activity-log";

function formatDateTime(value?: string | null) {
  if (!value) return "Unknown date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleString();
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLogs() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/admin/activity", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load activity logs.");
        }

        setLogs(result as AdminActivityLog[]);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Failed to load activity logs."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadLogs();
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black">Activity Log</h2>
        <p className="mt-2 text-gray-600">
          View recent admin actions across pets, foods, and imports.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-600">Loading activity...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-600">
            No admin activity has been recorded yet.
          </p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-black">{log.message}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {log.action} / {log.entityType} / {log.entityId}
                    </p>

                    {Object.keys(log.metadata ?? {}).length > 0 && (
                      <pre className="mt-3 overflow-x-auto rounded-lg bg-white p-3 text-xs text-gray-700 border border-gray-200">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>

                  <div className="text-sm text-gray-600">
                    {formatDateTime(log.createdAt)}
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
