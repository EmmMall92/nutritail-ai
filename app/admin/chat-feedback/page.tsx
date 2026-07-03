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

function getSelectedFoodName(log: AdminActivityLog) {
  const context = getFeedbackContext(log);
  return String(context.selectedFoodName ?? context.currentFoodName ?? "").trim();
}

function getSelectedFoodBrand(log: AdminActivityLog) {
  const context = getFeedbackContext(log);
  return String(context.selectedFoodBrand ?? "").trim() || "Unknown brand";
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

function getLaunchSignalStatus({
  foodSelectionRate,
  planSaveRate,
  helpfulRate,
  highPriorityCleanupCount,
}: {
  foodSelectionRate: number;
  planSaveRate: number;
  helpfulRate: number;
  highPriorityCleanupCount: number;
}) {
  if (highPriorityCleanupCount > 0) {
    return {
      label: "Data cleanup first",
      detail:
        "Repeated failed food matches should be fixed before trusting broader launch traffic.",
      tone: "warning" as const,
    };
  }

  if (helpfulRate >= 80 && foodSelectionRate >= 35 && planSaveRate >= 25) {
    return {
      label: "Launch signal looks healthy",
      detail:
        "Customers are choosing foods, saving plans, and rating answers positively.",
      tone: "good" as const,
    };
  }

  if (helpfulRate > 0 || foodSelectionRate > 0 || planSaveRate > 0) {
    return {
      label: "Keep testing before scale",
      detail:
        "There is useful signal, but recommendation copy, food choices, or save flow still need observation.",
      tone: "watch" as const,
    };
  }

  return {
    label: "Need more live feedback",
    detail:
      "Run more real customer/chatbot cases before treating the numbers as launch evidence.",
    tone: "neutral" as const,
  };
}

function getDropoffPriorityItems({
  analysisWithoutFoodChoiceCount,
  foodChoiceWithoutSaveCount,
  failedMatchCount,
  notHelpfulCount,
}: {
  analysisWithoutFoodChoiceCount: number;
  foodChoiceWithoutSaveCount: number;
  failedMatchCount: number;
  notHelpfulCount: number;
}) {
  return [
    {
      label: "Analysis without food choice",
      value: analysisWithoutFoodChoiceCount,
      helper:
        "Customers finished an analysis but did not tap a recommended food.",
      action: "Review whether the shortlist is clear, relevant, and easy to act on.",
      typeFilter: "analysis_completed",
      ratingFilter: "all",
      tone: "amber" as const,
    },
    {
      label: "Food choice without save",
      value: foodChoiceWithoutSaveCount,
      helper:
        "Customers selected a food but did not save the plan to their account.",
      action: "Check the save CTA, final summary, and grams/day confidence.",
      typeFilter: "food_choice_selected",
      ratingFilter: "all",
      tone: "blue" as const,
    },
    {
      label: "Failed food match",
      value: failedMatchCount,
      helper:
        "Food names or current diets that NutriTail could not resolve confidently.",
      action: "Add aliases, fix canonical names, or backfill missing Food V2 rows.",
      typeFilter: "failed_food_match",
      ratingFilter: "all",
      tone: "red" as const,
    },
    {
      label: "Not helpful feedback",
      value: notHelpfulCount,
      helper:
        "Customers explicitly said the answer was not useful enough.",
      action: "Inspect the exact query, goal, foods, and wording before changing rules.",
      typeFilter: "all",
      ratingFilter: "not_helpful",
      tone: "slate" as const,
    },
  ].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function getNextFeedbackFix(
  dropoffPriorityItems: ReturnType<typeof getDropoffPriorityItems>
) {
  const topIssue = dropoffPriorityItems.find((item) => item.value > 0);

  if (!topIssue) {
    return {
      title: "Collect more live feedback",
      detail:
        "No clear customer drop-off is visible yet. Run more live chatbot journeys before changing rules.",
      action: "Test real pet profiles and ask users to choose a food, save the plan, and rate the answer.",
      typeFilter: "all",
      ratingFilter: "all",
    };
  }

  return {
    title: topIssue.label,
    detail: topIssue.helper,
    action: topIssue.action,
    typeFilter: topIssue.typeFilter,
    ratingFilter: topIssue.ratingFilter,
  };
}

function getCustomerFrictionScorecards(
  dropoffPriorityItems: ReturnType<typeof getDropoffPriorityItems>
) {
  return dropoffPriorityItems.map((item, index) => {
    const priority =
      item.value >= 5 ? "Fix first" : item.value > 0 ? "Watch closely" : "No signal";
    const customerImpact =
      item.label === "Analysis without food choice"
        ? "The customer saw results but did not choose a food."
        : item.label === "Food choice without save"
          ? "The customer chose a food but did not keep the plan."
          : item.label === "Failed food match"
            ? "The customer mentioned a food we could not resolve."
            : "The customer told us the answer was not useful enough.";

    return {
      ...item,
      priority,
      customerImpact,
      rank: index + 1,
    };
  });
}

function TriageButton({
  label,
  value,
  helper,
  onClick,
}: {
  label: string;
  value: number | string;
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
        context.selectedFoodName,
        context.selectedFoodBrand,
        context.selectedFoodRole,
        context.weightGoal,
        context.petSpecies,
        ...(Array.isArray(context.recommendedFoodBrands)
          ? context.recommendedFoodBrands
          : []),
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
  const followUpActions = feedbackLogs.filter(
    (log) => getFeedbackType(log) === "chat_followup_action"
  );
  const selectedFoodChoices = feedbackLogs.filter(
    (log) => getFeedbackType(log) === "food_choice_selected"
  );
  const analysisCompleted = feedbackLogs.filter(
    (log) => getFeedbackType(log) === "analysis_completed"
  );
  const savedPlans = feedbackLogs.filter(
    (log) => getFeedbackType(log) === "plan_saved"
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
  const foodSelectionRate =
    analysisCompleted.length > 0
      ? Math.round((selectedFoodChoices.length / analysisCompleted.length) * 100)
      : 0;
  const planSaveRate =
    analysisCompleted.length > 0
      ? Math.round((savedPlans.length / analysisCompleted.length) * 100)
      : 0;
  const analysisWithoutFoodChoiceCount = Math.max(
    0,
    analysisCompleted.length - selectedFoodChoices.length
  );
  const foodChoiceWithoutSaveCount = Math.max(
    0,
    selectedFoodChoices.length - savedPlans.length
  );
  const selectedFoodGroups = selectedFoodChoices.reduce<
    Record<string, { count: number; latestLog: AdminActivityLog }>
  >((acc, log) => {
    const foodName = getSelectedFoodName(log) || "Unknown selected food";
    acc[foodName] = {
      count: (acc[foodName]?.count ?? 0) + 1,
      latestLog: log,
    };
    return acc;
  }, {});
  const selectedFoodTrends = Object.entries(selectedFoodGroups)
    .map(([foodName, data]) => ({
      foodName,
      count: data.count,
      latestLog: data.latestLog,
    }))
    .sort((a, b) => b.count - a.count || a.foodName.localeCompare(b.foodName))
    .slice(0, 8);
  const selectedBrandGroups = selectedFoodChoices.reduce<
    Record<string, { count: number; latestLog: AdminActivityLog }>
  >((acc, log) => {
    const brand = getSelectedFoodBrand(log);
    acc[brand] = {
      count: (acc[brand]?.count ?? 0) + 1,
      latestLog: log,
    };
    return acc;
  }, {});
  const selectedBrandTrends = Object.entries(selectedBrandGroups)
    .map(([brand, data]) => ({
      brand,
      count: data.count,
      latestLog: data.latestLog,
    }))
    .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand))
    .slice(0, 8);
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
  const highPriorityCleanupCount = cleanupBatches.filter(
    (batch) => batch.priority === "high"
  ).length;
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
  const launchSignalStatus = getLaunchSignalStatus({
    foodSelectionRate,
    planSaveRate,
    helpfulRate,
    highPriorityCleanupCount,
  });
  const dropoffPriorityItems = getDropoffPriorityItems({
    analysisWithoutFoodChoiceCount,
    foodChoiceWithoutSaveCount,
    failedMatchCount: failedMatches.length,
    notHelpfulCount: notHelpful.length,
  });
  const nextFeedbackFix = getNextFeedbackFix(dropoffPriorityItems);
  const customerFrictionScorecards =
    getCustomerFrictionScorecards(dropoffPriorityItems);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black">Chatbot Feedback</h2>
        <p className="mt-2 text-gray-600">
          Review failed food matches and helpfulness signals captured from the
          account chatbot.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total feedback</p>
          <p className="mt-2 text-3xl font-bold text-black">
            {feedbackLogs.length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Analyses</p>
          <p className="mt-2 text-3xl font-bold text-black">
            {analysisCompleted.length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Saved plans</p>
          <p className="mt-2 text-3xl font-bold text-black">
            {savedPlans.length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Failed matches</p>
          <p className="mt-2 text-3xl font-bold text-black">
            {failedMatches.length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Follow-ups</p>
          <p className="mt-2 text-3xl font-bold text-black">
            {followUpActions.length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Food choices</p>
          <p className="mt-2 text-3xl font-bold text-black">
            {selectedFoodChoices.length}
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

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black">Triage shortcuts</h3>
            <p className="mt-1 text-sm text-gray-600">
              Jump straight to the feedback signals that can improve customer
              chatbot answers fastest.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setTypeFilter("all");
              setRatingFilter("all");
            }}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white"
          >
            Clear filters
          </button>
        </div>

        <div
          className="mt-4 rounded-2xl border border-black bg-white p-5 shadow-sm"
          data-testid="chat-feedback-next-best-fix"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                Next best fix
              </p>
              <h3 className="mt-2 text-xl font-bold text-black">
                {nextFeedbackFix.title}
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                {nextFeedbackFix.detail}
              </p>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-black">
                {nextFeedbackFix.action}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTypeFilter(nextFeedbackFix.typeFilter);
                setRatingFilter(nextFeedbackFix.ratingFilter);
                setSearch("");
              }}
              className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Open this queue
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TriageButton
            label="Analyses"
            value={analysisCompleted.length}
            helper="Completed nutrition analyses from the customer chatbot"
            onClick={() => {
              setTypeFilter("analysis_completed");
              setRatingFilter("all");
              setSearch("");
            }}
          />
          <TriageButton
            label="Saved plans"
            value={savedPlans.length}
            helper="Customers who saved the result to their account"
            onClick={() => {
              setTypeFilter("plan_saved");
              setRatingFilter("all");
              setSearch("");
            }}
          />
          <TriageButton
            label="Failed matches"
            value={failedMatches.length}
            helper="Food names the database or matcher could not resolve"
            onClick={() => {
              setTypeFilter("failed_food_match");
              setRatingFilter("all");
              setSearch("");
            }}
          />
          <TriageButton
            label="Follow-ups"
            value={followUpActions.length}
            helper="Progress, no-result, timeline, or alternative-food actions"
            onClick={() => {
              setTypeFilter("chat_followup_action");
              setRatingFilter("all");
              setSearch("");
            }}
          />
          <TriageButton
            label="Food choices"
            value={selectedFoodChoices.length}
            helper="Recommended foods customers actually tapped"
            onClick={() => {
              setTypeFilter("food_choice_selected");
              setRatingFilter("all");
              setSearch("");
            }}
          />
          <TriageButton
            label="Not helpful"
            value={notHelpful.length}
            helper="Answers that need wording, safety, or recommendation polish"
            onClick={() => {
              setTypeFilter("all");
              setRatingFilter("not_helpful");
              setSearch("");
            }}
          />
          <TriageButton
            label="High cleanup"
            value={highPriorityCleanupCount}
            helper="Repeated failed food matches worth fixing first"
            onClick={() => {
              setTypeFilter("failed_food_match");
              setRatingFilter("all");
              setSearch("");
            }}
          />
          <TriageButton
            label="Helpful rate"
            value={helpfulnessTotal > 0 ? `${helpfulRate}%` : "-"}
            helper="Quick signal for chatbot answer quality"
            onClick={() => {
              setTypeFilter("all");
              setRatingFilter("helpful");
              setSearch("");
            }}
          />
        </div>
      </div>

      <div
        className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm"
        data-testid="chat-feedback-launch-triage"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
              Launch signal
            </p>
            <h3 className="mt-1 text-xl font-bold text-indigo-950">
              {launchSignalStatus.label}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-indigo-900">
              {launchSignalStatus.detail}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              launchSignalStatus.tone === "good"
                ? "bg-green-100 text-green-800"
                : launchSignalStatus.tone === "warning"
                  ? "bg-amber-100 text-amber-800"
                  : launchSignalStatus.tone === "watch"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-white text-indigo-900"
            }`}
          >
            {launchSignalStatus.tone}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-indigo-100 bg-white p-4">
            <p className="text-sm text-indigo-700">Food selection</p>
            <p className="mt-2 text-2xl font-bold text-indigo-950">
              {analysisCompleted.length > 0 ? `${foodSelectionRate}%` : "-"}
            </p>
            <p className="mt-1 text-xs leading-5 text-indigo-800">
              Users who tapped a recommended food after analysis.
            </p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white p-4">
            <p className="text-sm text-indigo-700">Plan save</p>
            <p className="mt-2 text-2xl font-bold text-indigo-950">
              {analysisCompleted.length > 0 ? `${planSaveRate}%` : "-"}
            </p>
            <p className="mt-1 text-xs leading-5 text-indigo-800">
              Users who saved the result after completing an analysis.
            </p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white p-4">
            <p className="text-sm text-indigo-700">Helpful rate</p>
            <p className="mt-2 text-2xl font-bold text-indigo-950">
              {helpfulnessTotal > 0 ? `${helpfulRate}%` : "-"}
            </p>
            <p className="mt-1 text-xs leading-5 text-indigo-800">
              Lightweight customer signal for answer quality.
            </p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white p-4">
            <p className="text-sm text-indigo-700">Cleanup risk</p>
            <p className="mt-2 text-2xl font-bold text-indigo-950">
              {highPriorityCleanupCount}
            </p>
            <p className="mt-1 text-xs leading-5 text-indigo-800">
              High-priority repeated failed matches to fix first.
            </p>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        data-testid="chat-feedback-dropoff-priority"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black">
              Customer Drop-Off Priority
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              The next fixes that can move customer-product progress toward
              95%: choice clarity, save confidence, food matching, and answer
              usefulness.
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            Sorted by impact
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dropoffPriorityItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setTypeFilter(item.typeFilter);
                setRatingFilter(item.ratingFilter);
                setSearch("");
              }}
              className={`rounded-xl border p-4 text-left transition hover:border-black hover:bg-white ${
                item.tone === "amber"
                  ? "border-amber-200 bg-amber-50"
                  : item.tone === "blue"
                    ? "border-blue-200 bg-blue-50"
                    : item.tone === "red"
                      ? "border-red-200 bg-red-50"
                      : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-black">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-black">
                    {item.value}
                  </p>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-gray-700">
                  open
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                {item.helper}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Next action
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-700">
                {item.action}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm"
        data-testid="chat-feedback-customer-friction-scorecard"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">
              Customer friction scorecard
            </p>
            <h3 className="mt-1 text-xl font-bold text-rose-950">
              Which part of the customer journey should we fix next?
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-rose-900">
              This turns raw feedback into a practical QA queue: choice clarity,
              save confidence, food matching, or answer usefulness.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setTypeFilter(nextFeedbackFix.typeFilter);
              setRatingFilter(nextFeedbackFix.ratingFilter);
              setSearch("");
            }}
            className="rounded-xl bg-rose-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-800"
          >
            Open top friction queue
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {customerFrictionScorecards.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setTypeFilter(item.typeFilter);
                setRatingFilter(item.ratingFilter);
                setSearch("");
              }}
              className="rounded-xl border border-rose-100 bg-white p-4 text-left transition hover:border-rose-400 hover:bg-rose-100"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                    #{item.rank} {item.priority}
                  </p>
                  <h4 className="mt-2 font-bold text-rose-950">{item.label}</h4>
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-bold text-rose-900">
                  {item.value}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-rose-900">
                {item.customerImpact}
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-rose-950">
                {item.action}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-black">Analysis Funnel</h3>
        <p className="mt-1 text-sm text-gray-600">
          Customer path from completed nutrition analysis to selected food and
          saved plan.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">Completed analyses</p>
            <p className="mt-2 text-2xl font-bold text-black">
              {analysisCompleted.length}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">Food selection rate</p>
            <p className="mt-2 text-2xl font-bold text-emerald-800">
              {analysisCompleted.length > 0 ? `${foodSelectionRate}%` : "-"}
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              {selectedFoodChoices.length} selected food events
            </p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-700">Save rate</p>
            <p className="mt-2 text-2xl font-bold text-blue-800">
              {analysisCompleted.length > 0 ? `${planSaveRate}%` : "-"}
            </p>
            <p className="mt-1 text-xs text-blue-700">
              {savedPlans.length} saved nutrition plans
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-black">
          Brand Selection Trends
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Brands customers choose after the recommendation cards. Use this to
          spot which premium/value suggestions are actually converting.
        </p>

        {selectedBrandTrends.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">
            No selected brand events have been recorded yet.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {selectedBrandTrends.map((item) => {
              const context = getFeedbackContext(item.latestLog);

              return (
                <button
                  key={item.brand}
                  type="button"
                  onClick={() => {
                    setTypeFilter("food_choice_selected");
                    setRatingFilter("all");
                    setSearch(item.brand === "Unknown brand" ? "" : item.brand);
                  }}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-left transition hover:border-black hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-black">{item.brand}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Latest goal: {String(context.weightGoal ?? "unknown")}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Latest role:{" "}
                        {String(context.selectedFoodRole ?? "unknown")}
                      </p>
                    </div>
                    <span className="rounded-full bg-black px-2 py-1 text-xs font-semibold text-white">
                      {item.count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
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
          Selected Food Trends
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Foods customers tapped after seeing the recommendation cards.
        </p>

        {selectedFoodTrends.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">
            No selected food events have been recorded yet.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {selectedFoodTrends.map((item) => {
              const context = getFeedbackContext(item.latestLog);

              return (
                <div
                  key={item.foodName}
                  className="rounded-xl border border-green-200 bg-green-50 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-black">{item.foodName}</p>
                      <p className="mt-1 text-sm text-green-800">
                        Brand: {String(context.selectedFoodBrand ?? "unknown")}
                      </p>
                      <p className="mt-1 text-sm text-green-800">
                        Goal: {String(context.weightGoal ?? "unknown")} / Role:{" "}
                        {String(context.selectedFoodRole ?? "unknown")}
                      </p>
                      <p className="mt-1 text-sm text-green-800">
                        Portion:{" "}
                        {context.feedingGramsPerDay
                          ? `${String(context.feedingGramsPerDay)}g/day`
                          : "not estimated"}
                      </p>
                    </div>
                    <span className="rounded-full bg-green-700 px-2 py-1 text-xs font-semibold text-white">
                      {item.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
