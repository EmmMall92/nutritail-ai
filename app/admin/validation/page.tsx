"use client";

import { useEffect, useState } from "react";

type ValidationIssue = {
  type: "food" | "pet";
  id: string;
  title: string;
  problems: string[];
};

type ValidationResponse = {
  totalIssues: number;
  issues: ValidationIssue[];
};

export default function AdminValidationPage() {
  const [data, setData] = useState<ValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Validation Checks</h2>
          <p className="mt-2 text-gray-600">
            Review potential data quality issues across foods and pets.
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

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-600">Running validation checks...</p>
        ) : !data || data.issues.length === 0 ? (
          <p className="text-sm text-gray-600">No issues found.</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-600">
              Found {data.totalIssues} issue(s).
            </p>

            <div className="space-y-4">
              {data.issues.map((issue) => (
                <div
                  key={`${issue.type}-${issue.id}`}
                  className="rounded-xl border border-yellow-200 bg-yellow-50 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-black">{issue.title}</p>
                      <p className="mt-1 text-sm text-gray-700">
                        {issue.type} • {issue.id}
                      </p>
                    </div>

                    <a
                      href={
                        issue.type === "food"
                          ? `/admin/foods/${issue.id}`
                          : `/admin/pets/${issue.id}`
                      }
                      className="inline-block rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-white"
                    >
                      Open Record
                    </a>
                  </div>

                  <ul className="mt-3 list-disc pl-5 text-sm text-black">
                    {issue.problems.map((problem, index) => (
                      <li key={index}>{problem}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}