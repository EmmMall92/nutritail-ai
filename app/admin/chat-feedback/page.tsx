"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

function getFeedbackContext(log: AdminActivityLog) {
  const context = log.metadata?.context;
  return typeof context === "object" && context !== null
    ? (context as Record<string, unknown>)
    : {};
}

function getCurrentFoodName(log: AdminActivityLog) {
  const context = getFeedbackContext(log);
  return String(context.currentFoodName ?? log.metadata?.message ?? "").trim();
}

function getCleanupMetadata(log: AdminActivityLog) {
  const cleanup = log.metadata?.cleanup;
  return typeof cleanup === "object" && cleanup !== null
    ? (cleanup as Record<string, unknown>)
    : {};
}

function cleanupBatchHref(query: string) {
  const params = new URLSearchParams({
    search: query,
    source: "chat_feedback",
  });

  return `/admin/food-backfill?${params.toString()}`;
}

function getCleanupHref(log: AdminActivityLog, query: string) {
  const cleanup = getCleanupMetadata(log);
  const href = cleanup.href;
  return typeof href === "string" && href.startsWith("/admin/")
    ? href
    : cleanupBatchHref(query);
}

function getCleanupPriority(log: AdminActivityLog, fallbackCount: number) {
  const cleanup = getCleanupMetadata(log);
  const priority = cleanup.priority;
  if (typeof priority === "string" && priority) return priority;
  return fallbackCount >= 3 ? "high" : fallbackCount >= 2 ? "medium" : "watch";
}

function getQualityGroupKey(log: AdminActivityLog) {
  const context = getFeedbackContext(log);
  const food = String(context.currentFoodName ?? "").trim() || "No food";
  const goal = String(context.weightGoal ?? "").trim() || "No goal";
  const type = getFeedbackType(log);

  return `${type} | ${food} | ${goal}`;
}

export default function AdminChatFeedbackPage() {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

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
  const feedbackTypes = useMemo(
    () => [...new Set(feedbackLogs.map(getFeedbackType))].sort(),
    [feedbackLogs]
  );
  const feedbackRatings = useMemo(
    () =>
      [
        ...new Set(
          feedbackLogs.map((log) => String(log.metadata?.rating ?? "unknown"))
        ),
      ].sort(),
    [feedbackLogs]
  );
  const filteredFeedbackLogs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return feedbackLogs.filter((log) => {
      const type = getFeedbackType(log);
      const rating = String(log.metadata?.rating ?? "unknown");
      const context = getFeedbackContext(log);
      const searchable = [
        log.message,
        type,
        rating,
        context.currentFoodName,
        context.weightGoal,
        context.petSpecies,
        ...(Array.isArray(context.healthIssues) ? context.healthIssues : []),
        ...(Array.isArray(context.allergies) ? context.allergies : []),
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" ");

      return (
        (typeFilter === "all" || type === typeFilter) &&
        (ratingFilter === "all" || rating === ratingFilter) &&
        (!normalizedSearch || searchable.includes(normalizedSearch))
      );
    });
  }, [feedbackLogs, ratingFilter, search, typeFilter]);
  const failedMatches = feedbackLogs.filter(
    (log) => getFeedbackType(log) === "failed_food_match"
  );
  const helpful = feedbackLogs.filter(
    (log) => String(log.metadata?.rating ?? "") === "helpful"
  );
  const notHelpful = feedbackLogs.filter(
    (log) => String(log.metadata?.rating ?? "") === "not_helpful"
  );
  const helpfulnessTotal = helpful.length + notHelpful.length;
  const helpfulRate =
    helpfulnessTotal > 0 ? Math.round((helpful.length / helpfulnessTotal) * 100) : 0;
  const failedMatchGroups = failedMatches.reduce<
    Record<string, { count: number; latestLog: AdminActivityLog }>
  >((acc, log) => {
      const foodName = getCurrentFoodName(log) || "Unknown food query";
      acc[foodName] = {
        count: (acc[foodName]?.count ?? 0) + 1,
        latestLog: log,
      };
      return acc;
    }, {});
  const failedMatchTrends = Object.entries(failedMatchGroups)
    .map(([query, data]) => ({ query, count: data.count, latestLog: data.latestLog }))
    .sort((a, b) => b.count - a.count || a.query.localeCompare(b.query))
    .slice(0, 8);
  const cleanupBatches = failedMatchTrends.map((item) => ({
    query: item.query,
    count: item.count,
    href: getCleanupHref(item.latestLog, item.query),
    priority: getCleanupPriority(item.latestLog, item.count),
    reason:
      String(getCleanupMetadata(item.latestLog).reason ?? "").trim() ||
      "Repeated failed food match should be reviewed.",
  }));
  const responseQualityPriorities = notHelpful
    .slice()
    .sort((a, b) => {
      const aTime = new Date(a.createdAt ?? "").getTime();
      const bTime = new Date(b.createdAt ?? "").getTime();
      return bTime - aTime;
    })
    .slice(0, 5);
  const notHelpfulGroups = Object.entries(
    notHelpful.reduce<
      Record<string, { count: number; latestLog: AdminActivityLog }>
    >((acc, log) => {
      const key = getQualityGroupKey(log);
      acc[key] = {
        count: (acc[key]?.count ?? 0) + 1,
        latestLog: log,
      };
      return acc;
    }, {})
  )
    .map(([key, data]) => ({ key, ...data }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, 8);

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
          <p className="text-sm text-gray-500">Helpful rate</p>
          <p className="mt-2 text-3xl font-bold text-black">
            {helpfulnessTotal > 0 ? `${helpfulRate}%` : "-"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-black">
            Failed Match Trends
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Repeated queries here should feed the food-data cleanup backlog.
          </p>

          {failedMatchTrends.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">
              No failed food match trends yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {failedMatchTrends.map((item) => (
                <div
                  key={item.query}
                  className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
                >
                  <p className="break-words text-sm font-medium text-black">
                    {item.query}
                  </p>
                  <span className="rounded-full bg-black px-2 py-1 text-xs font-semibold text-white">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-black">
            Helpfulness Snapshot
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Lightweight feedback signal for chatbot answer quality.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700">Helpful</p>
              <p className="mt-2 text-2xl font-bold text-green-800">
                {helpful.length}
              </p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">Not helpful</p>
              <p className="mt-2 text-2xl font-bold text-red-800">
                {notHelpful.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-black">
          Feedback Cleanup Batches
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Turn repeated failed matches into focused food-data review searches.
        </p>

        {cleanupBatches.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">
            No cleanup batches are suggested yet.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {cleanupBatches.map((batch) => (
              <div
                key={batch.query}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-black">{batch.query}</p>
                  <span className="rounded-full border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700">
                    {batch.count} reports
                  </span>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                    {batch.priority}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {batch.reason}
                </p>
                <Link
                  href={batch.href}
                  className="mt-3 inline-flex rounded-lg border border-black px-3 py-2 text-sm font-medium text-black transition hover:bg-black hover:text-white"
                >
                  Open cleanup search
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-black">
          Response Quality Priorities
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Recent not-helpful ratings that should guide chatbot copy and safety
          polish.
        </p>

        {responseQualityPriorities.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">
            No not-helpful ratings have been recorded yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {responseQualityPriorities.map((log) => {
              const context = getFeedbackContext(log);

              return (
                <div
                  key={log.id}
                  className="rounded-xl border border-amber-200 bg-amber-50 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-black">{log.message}</p>
                      <p className="mt-1 text-sm text-amber-800">
                        Food:{" "}
                        {String(context.currentFoodName ?? "").trim() ||
                          "not provided"}
                      </p>
                      <p className="mt-1 text-sm text-amber-800">
                        Goal: {String(context.weightGoal ?? "unknown")}
                      </p>
                    </div>
                    <p className="text-sm text-amber-800">
                      {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-black">
          Not-Helpful Patterns
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Grouped signals by feedback type, current food, and weight goal.
        </p>

        {notHelpfulGroups.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">
            No not-helpful patterns yet.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {notHelpfulGroups.map((group) => {
              const context = getFeedbackContext(group.latestLog);

              return (
                <div
                  key={group.key}
                  className="rounded-xl border border-red-200 bg-red-50 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-red-700 px-2 py-1 text-xs font-semibold text-white">
                      {group.count}
                    </span>
                    <p className="font-semibold text-black">
                      {getFeedbackType(group.latestLog)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-red-900">
                    Food/query:{" "}
                    {String(context.currentFoodName ?? "").trim() ||
                      "not provided"}
                  </p>
                  <p className="mt-1 text-sm text-red-900">
                    Goal: {String(context.weightGoal ?? "unknown")}
                  </p>
                  <p className="mt-2 text-xs text-red-800">
                    Latest: {formatDateTime(group.latestLog.createdAt)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-black">
            Feedback Log
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Search and filter raw chatbot feedback events before deciding what
            to improve next.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search food, goal, message..."
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-black"
          />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-black"
          >
            <option value="all">All types</option>
            {feedbackTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            value={ratingFilter}
            onChange={(event) => setRatingFilter(event.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-black"
          >
            <option value="all">All ratings</option>
            {feedbackRatings.map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
        </div>

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
        ) : filteredFeedbackLogs.length === 0 ? (
          <p className="text-sm text-gray-600">
            No feedback matches the current filters.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Showing {filteredFeedbackLogs.length} of {feedbackLogs.length}{" "}
              feedback events.
            </p>
            {filteredFeedbackLogs.map((log) => (
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
