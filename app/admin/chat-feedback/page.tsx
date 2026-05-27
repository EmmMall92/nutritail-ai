"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminActivityLog } from "@/types/admin-activity-log";

function formatDateTime(value?: string | null) {
  if (!value) return "Unknown date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleString();
}

function getFeedbackType(log: AdminActivityLog) {
  return String(log.metadata?.eventType ?? log.action ?? "unknown");
}

export default function AdminChatFeedbackPage() {
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
          throw new Error(result.error || "Failed to load chatbot feedback.");
        }

        setLogs(result as AdminActivityLog[]);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Failed to load chatbot feedback."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadLogs();
  }, []);

  const feedbackLogs = useMemo(
    () => logs.filter((log) => log.entityType === "chatbot_feedback"),
    [logs]
  );
  const failedMatches = feedbackLogs.filter(
    (log) => getFeedbackType(log) === "failed_food_match"
  );
  const helpful = feedbackLogs.filter(
    (log) => String(log.metadata?.rating ?? "") === "helpful"
  );
  const notHelpful = feedbackLogs.filter(
    (log) => String(log.metadata?.rating ?? "") === "not_helpful"
  );

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black">Chatbot Feedback</h2>
        <p className="mt-2 text-gray-600">
          Review failed food matches and helpfulness signals captured from the
          account chatbot.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total feedback</p>
          <p className="mt-2 text-3xl font-bold text-black">
            {feedbackLogs.length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Failed matches</p>
          <p className="mt-2 text-3xl font-bold text-black">
            {failedMatches.length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Helpful</p>
          <p className="mt-2 text-3xl font-bold text-black">
            {helpful.length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Not helpful</p>
          <p className="mt-2 text-3xl font-bold text-black">
            {notHelpful.length}
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
          <p className="text-sm text-gray-600">Loading feedback...</p>
        ) : feedbackLogs.length === 0 ? (
          <p className="text-sm text-gray-600">
            No chatbot feedback has been recorded yet.
          </p>
        ) : (
          <div className="space-y-4">
            {feedbackLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-black">{log.message}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {getFeedbackType(log)} /{" "}
                      {String(log.metadata?.rating ?? "unknown")}
                    </p>
                    <pre className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
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
