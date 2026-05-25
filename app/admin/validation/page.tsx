"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ValidationSeverity = "blocker" | "warning";

type ValidationIssue = {
  type: "food" | "pet";
  id: string;
  title: string;
  category: string;
  severity: ValidationSeverity;
  problems: string[];
};

type ValidationResponse = {
  totalIssues: number;
  summary: {
    blockers: number;
    warnings: number;
    affectedFoods: number;
    affectedPets: number;
    activeFoods: number;
    activePets: number;
  };
  issues: ValidationIssue[];
};

const FILTERS = ["all", "blocker", "warning"] as const;

function getIssueHref(issue: ValidationIssue) {
  return issue.type === "food"
    ? `/admin/foods/${issue.id}`
    : `/admin/pets/${issue.id}`;
}

function getIssueClasses(severity: ValidationSeverity) {
  return severity === "blocker"
    ? "border-red-200 bg-red-50"
    : "border-yellow-200 bg-yellow-50";
}

function getBadgeClasses(severity: ValidationSeverity) {
  return severity === "blocker"
    ? "bg-red-100 text-red-800"
    : "bg-yellow-100 text-yellow-800";
}

export default function AdminValidationPage() {
  const [data, setData] = useState<ValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  async function loadValidation() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/admin/validation", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load validation.");
      }

      setData(result as ValidationResponse);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load validation.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadValidation();
  }, []);

  const visibleIssues = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.issues;
    return data.issues.filter((issue) => issue.severity === filter);
  }, [data, filter]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Validation Checks</h2>
          <p className="mt-2 max-w-2xl text-gray-600">
            Review production blockers, food enrichment gaps, and customer data
            warnings before launch.
          </p>
        </div>

        <button
          type="button"
          onClick={loadValidation}
          className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
        >
          Run Checks Again
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">Running validation checks...</p>
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">No validation data available.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-xl border border-red-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-red-700">
                Blockers
              </p>
              <p className="mt-2 text-2xl font-bold text-black">
                {data.summary.blockers}
              </p>
            </div>

            <div className="rounded-xl border border-yellow-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-yellow-700">
                Warnings
              </p>
              <p className="mt-2 text-2xl font-bold text-black">
                {data.summary.warnings}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-600">
                Affected foods
              </p>
              <p className="mt-2 text-2xl font-bold text-black">
                {data.summary.affectedFoods}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-600">
                Affected pets
              </p>
              <p className="mt-2 text-2xl font-bold text-black">
                {data.summary.affectedPets}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-600">
                Active foods
              </p>
              <p className="mt-2 text-2xl font-bold text-black">
                {data.summary.activeFoods}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-600">
                Active pets
              </p>
              <p className="mt-2 text-2xl font-bold text-black">
                {data.summary.activePets}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-600">
              Showing {visibleIssues.length} of {data.totalIssues} issue(s).
            </p>

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-lg border px-4 py-2 text-sm capitalize transition ${
                    filter === option
                      ? "border-black bg-black text-white"
                      : "border-gray-300 text-black hover:bg-gray-100"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {visibleIssues.length === 0 ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
              <p className="text-sm font-medium text-green-800">
                No issues found for this filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleIssues.map((issue) => (
                <div
                  key={`${issue.severity}-${issue.type}-${issue.id}`}
                  className={`rounded-xl border p-4 shadow-sm ${getIssueClasses(
                    issue.severity
                  )}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getBadgeClasses(
                            issue.severity
                          )}`}
                        >
                          {issue.severity}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                          {issue.category}
                        </span>
                      </div>

                      <p className="mt-3 font-semibold text-black">
                        {issue.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {issue.type} - {issue.id}
                      </p>
                    </div>

                    <Link
                      href={getIssueHref(issue)}
                      className="inline-block rounded-lg border border-black bg-white px-4 py-2 text-center text-sm text-black transition hover:bg-gray-100"
                    >
                      Open Record
                    </Link>
                  </div>

                  <ul className="mt-4 list-disc pl-5 text-sm text-black">
                    {issue.problems.map((problem) => (
                      <li key={problem}>{problem}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
