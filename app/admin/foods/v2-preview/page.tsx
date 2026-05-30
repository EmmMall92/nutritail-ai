"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import manualRows from "@/data/samples/manual-labels-v2.json";
import {
  previewFoodV2Csv,
  previewFoodV2ManualRows,
  type FoodV2PreviewResult,
} from "@/lib/food-v2/importPreview";

type ImportCommitResult = {
  success: boolean;
  totalRows: number;
  importedRows: number;
  insertedRows?: number;
  updatedRows?: number;
  skippedRows: number;
  failedRows?: number;
  auditRows: number;
  results: Array<{
    formula_key: string;
    display_name: string;
    success: boolean;
    action: string;
    error: string | null;
  }>;
};

type ExistingFormulaMatch = {
  formula_key: string;
  display_name: string;
  data_quality_status: string;
  updated_at: string | null;
};

type ConflictCheckResult = {
  existing: ExistingFormulaMatch[];
  existingCount: number;
  newCount: number;
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

function CountList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: Record<string, number>;
  emptyLabel: string;
}) {
  const entries = Object.entries(items).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-black">{title}</h2>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">{emptyLabel}</p>
      ) : (
        <div className="mt-4 space-y-2">
          {entries.map(([label, count]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3 text-sm"
            >
              <span className="text-gray-700">{label}</span>
              <span className="font-semibold text-black">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function downloadTemplate() {
  window.location.href = "/api/admin/foods/v2-template";
}

export default function FoodV2PreviewPage() {
  const [preview, setPreview] = useState<FoodV2PreviewResult>(() =>
    previewFoodV2ManualRows(manualRows as unknown[])
  );
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [commitResult, setCommitResult] = useState<ImportCommitResult | null>(
    null
  );
  const [conflictResult, setConflictResult] =
    useState<ConflictCheckResult | null>(null);

  const rowLimitNotice = useMemo(() => {
    if (preview.rows.length <= 25) return "";
    return `Showing first 25 of ${preview.rows.length} rows.`;
  }, [preview.rows.length]);

  async function handleCsvFile(file: File | null) {
    if (!file) return;

    try {
      setError("");
      setCommitResult(null);
      setConflictResult(null);
      const text = await file.text();
      setPreview(previewFoodV2Csv(text));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not parse this CSV file."
      );
    }
  }

  function loadSample() {
    setError("");
    setCommitResult(null);
    setConflictResult(null);
    setPreview(previewFoodV2ManualRows(manualRows as unknown[]));
  }

  async function checkExistingFormulaKeys() {
    try {
      setError("");
      setConflictResult(null);
      setIsCheckingConflicts(true);

      const response = await fetch("/api/admin/foods/v2-conflicts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formula_keys: preview.rows.map((row) => row.food.formula_key),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Food V2 conflict check failed.");
      }

      setConflictResult(result as ConflictCheckResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Food V2 conflict check failed."
      );
    } finally {
      setIsCheckingConflicts(false);
    }
  }

  async function commitImportableRows() {
    try {
      setError("");
      setCommitResult(null);
      setIsImporting(true);

      const response = await fetch("/api/admin/foods/v2-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rows: preview.rows }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Food V2 import failed.");
      }

      setCommitResult(result as ImportCommitResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Food V2 import failed.");
    } finally {
      setIsImporting(false);
    }
  }

  const existingFormulaKeyMap = useMemo(() => {
    return new Map(
      (conflictResult?.existing ?? []).map((row) => [row.formula_key, row])
    );
  }, [conflictResult]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Preview only
              </p>
              <h1 className="mt-2 text-3xl font-bold text-black">
                Food V2 Import Preview
              </h1>
              <p className="mt-2 max-w-3xl text-gray-600">
                Upload a CSV or load the manual-label sample to normalize rows,
                validate required fields, and review completeness before any
                database import is built.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={commitImportableRows}
                disabled={isImporting || preview.summary.importableRows === 0}
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
              >
                {isImporting ? "Importing..." : "Commit Importable"}
              </button>
              <button
                type="button"
                onClick={loadSample}
                className="rounded-xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-100"
              >
                Load Sample
              </button>
              <button
                type="button"
                onClick={checkExistingFormulaKeys}
                disabled={isCheckingConflicts || preview.rows.length === 0}
                className="rounded-xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-500"
              >
                {isCheckingConflicts ? "Checking..." : "Check Existing"}
              </button>
              <button
                type="button"
                onClick={downloadTemplate}
                className="rounded-xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-100"
              >
                Download Template
              </button>
              <Link
                href="/admin/foods"
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Back to Foods
              </Link>
              <Link
                href="/admin/foods/v2-review"
                className="rounded-xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-100"
              >
                Review V2 Data
              </Link>
              <Link
                href="/admin/foods/v2-guide"
                className="rounded-xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-100"
              >
                Import Guide
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">
            <label className="block text-sm font-semibold text-black">
              CSV preview file
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => handleCsvFile(event.target.files?.[0] ?? null)}
              className="mt-3 block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
            />
            <p className="mt-2 text-xs text-gray-500">
              This page does not write to Supabase. It only parses, normalizes,
              and validates the import rows in your browser session.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {commitResult && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-900">
            <p className="font-semibold">Food V2 import completed.</p>
            <p className="mt-2">
              Imported {commitResult.importedRows} rows (
              {commitResult.insertedRows ?? 0} inserted,{" "}
              {commitResult.updatedRows ?? 0} updated), skipped{" "}
              {commitResult.skippedRows} blocked rows, failed{" "}
              {commitResult.failedRows ?? 0} rows, and wrote{" "}
              {commitResult.auditRows} audit rows.
            </p>
            {commitResult.results.some((result) => result.error) && (
              <div className="mt-3 space-y-1">
                {commitResult.results
                  .filter((result) => result.error)
                  .slice(0, 5)
                  .map((result) => (
                    <p key={result.formula_key}>
                      {result.display_name}: {result.error}
                    </p>
                  ))}
              </div>
            )}
          </div>
        )}

        {conflictResult && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
            <p className="font-semibold">Existing key check complete.</p>
            <p className="mt-2">
              {conflictResult.newCount} rows look new and{" "}
              {conflictResult.existingCount} rows already exist in Food V2.
              Existing rows will be updated if committed.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Total Rows"
            value={preview.summary.totalRows}
            helper="Rows parsed for review"
          />
          <SummaryCard
            label="Importable"
            value={preview.summary.importableRows}
            helper="No blocking validation errors"
          />
          <SummaryCard
            label="Blocked"
            value={preview.summary.blockedRows}
            helper="Missing or impossible values"
          />
          <SummaryCard
            label="Completeness"
            value={`${preview.summary.averageCompleteness}%`}
            helper="Average row score"
          />
          <SummaryCard
            label="Issues"
            value={
              preview.summary.impossibleValueCount +
              preview.summary.conflictCount
            }
            helper="Impossible values and conflicts"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <CountList
            title="Missing Fields"
            items={preview.summary.missingFieldCounts}
            emptyLabel="No missing critical fields in this preview."
          />
          <CountList
            title="Warnings"
            items={preview.summary.warningCounts}
            emptyLabel="No warnings in this preview."
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-black">Preview Rows</h2>
              <p className="mt-1 text-sm text-gray-600">
                {rowLimitNotice || "Showing all preview rows."}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {preview.rows.slice(0, 25).map((row, index) => (
              <div
                key={`${row.food.formula_key}-${index}`}
                className="rounded-2xl border border-gray-200 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-black">
                        {row.food.display_name}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          row.validation.is_importable
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {row.validation.is_importable ? "importable" : "blocked"}
                      </span>
                      {conflictResult && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            existingFormulaKeyMap.has(row.food.formula_key)
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {existingFormulaKeyMap.has(row.food.formula_key)
                            ? "will update"
                            : "new row"}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-gray-600">
                      {row.food.brand} - {row.food.species} - {row.food.format} -{" "}
                      {row.food.life_stage}
                      {row.food.dog_size ? ` - ${row.food.dog_size}` : ""}
                    </p>
                    <p className="mt-2 break-all text-xs text-gray-500">
                      {row.food.formula_key}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 px-4 py-3 text-center">
                    <p className="text-xs text-gray-500">Score</p>
                    <p className="text-2xl font-bold text-black">
                      {row.validation.completeness_score}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm lg:grid-cols-5">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-gray-500">Ingredients</p>
                    <p className="mt-1 font-semibold text-black">
                      {row.food.ingredients.length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-gray-500">Kcal/100g</p>
                    <p className="mt-1 font-semibold text-black">
                      {row.food.kcal_per_100g ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-gray-500">Protein</p>
                    <p className="mt-1 font-semibold text-black">
                      {row.nutrients.protein_percent ?? "-"}%
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-gray-500">Source</p>
                    <p className="mt-1 font-semibold text-black">
                      {row.food.source_priority}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-gray-500">Quality</p>
                    <p className="mt-1 font-semibold text-black">
                      {row.food.data_quality_status}
                    </p>
                  </div>
                </div>

                {row.validation.missing_fields.length > 0 && (
                  <p className="mt-4 text-sm text-red-700">
                    Missing: {row.validation.missing_fields.join(", ")}
                  </p>
                )}
                {row.validation.impossible_values.length > 0 && (
                  <p className="mt-2 text-sm text-red-700">
                    Impossible values:{" "}
                    {row.validation.impossible_values.join(", ")}
                  </p>
                )}
                {row.validation.conflicts.length > 0 && (
                  <p className="mt-2 text-sm text-amber-700">
                    Conflicts: {row.validation.conflicts.join(", ")}
                  </p>
                )}
                {row.validation.warnings.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    Warnings: {row.validation.warnings.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
