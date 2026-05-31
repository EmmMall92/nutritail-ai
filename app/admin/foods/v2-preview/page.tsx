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
  likelyDuplicates?: Array<{
    canonical_formula_key: string;
    incoming: Array<{
      formula_key: string;
      display_name: string;
      canonical_formula_key: string;
    }>;
    existing: ExistingFormulaMatch[];
  }>;
};

type RowFilter = "all" | "importable" | "blocked" | "new" | "update";

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

function formatNutrient(value: number | null | undefined, suffix = "%") {
  if (value === null || value === undefined) return "-";
  return `${value}${suffix}`;
}

function csvCell(value: unknown) {
  if (Array.isArray(value)) return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
  if (value && typeof value === "object") {
    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
  }
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadRowsCsv(
  filename: string,
  rows: FoodV2PreviewResult["rows"]
) {
  const headers = [
    "formula_key",
    "canonical_formula_key",
    "standard_display_name",
    "brand",
    "formula_name",
    "display_name",
    "species",
    "format",
    "life_stage",
    "dog_size",
    "data_quality_status",
    "source_priority",
    "data_source_url",
    "completeness_score",
    "is_importable",
    "missing_fields",
    "warnings",
    "impossible_values",
    "conflicts",
  ];
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.food.formula_key,
        row.canonical?.canonical_formula_key ?? "",
        row.canonical?.standard_display_name ?? row.food.display_name,
        row.food.brand,
        row.food.formula_name,
        row.food.display_name,
        row.food.species,
        row.food.format,
        row.food.life_stage,
        row.food.dog_size ?? "",
        row.food.data_quality_status,
        row.food.source_priority,
        row.food.data_source_url ?? "",
        row.validation.completeness_score,
        row.validation.is_importable ? "true" : "false",
        row.validation.missing_fields,
        row.validation.warnings,
        row.validation.impossible_values,
        row.validation.conflicts,
      ]
        .map(csvCell)
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function FoodV2PreviewPage() {
  const [preview, setPreview] = useState<FoodV2PreviewResult>(() =>
    previewFoodV2ManualRows(manualRows as unknown[])
  );
  const [sourceLabel, setSourceLabel] = useState("Manual sample");
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [showCommitConfirm, setShowCommitConfirm] = useState(false);
  const [rowFilter, setRowFilter] = useState<RowFilter>("all");
  const [rowSearch, setRowSearch] = useState("");
  const [selectedFormulaKeys, setSelectedFormulaKeys] = useState<string[]>([]);
  const [commitResult, setCommitResult] = useState<ImportCommitResult | null>(
    null
  );
  const [conflictResult, setConflictResult] =
    useState<ConflictCheckResult | null>(null);

  const existingFormulaKeyMap = useMemo(() => {
    return new Map(
      (conflictResult?.existing ?? []).map((row) => [row.formula_key, row])
    );
  }, [conflictResult]);

  const visibleRows = useMemo(() => {
    const searchText = rowSearch.trim().toLowerCase();

    return preview.rows.filter((row) => {
      const exists = existingFormulaKeyMap.has(row.food.formula_key);
      const matchesFilter =
        rowFilter === "all" ||
        (rowFilter === "importable" && row.validation.is_importable) ||
        (rowFilter === "blocked" && !row.validation.is_importable) ||
        (rowFilter === "new" && conflictResult && !exists) ||
        (rowFilter === "update" && conflictResult && exists);
      const matchesSearch =
        !searchText ||
        `${row.food.brand} ${row.food.display_name} ${row.food.formula_key} ${row.canonical?.canonical_formula_key ?? ""} ${row.canonical?.standard_display_name ?? ""}`
          .toLowerCase()
          .includes(searchText);

      return matchesFilter && matchesSearch;
    });
  }, [conflictResult, existingFormulaKeyMap, preview.rows, rowFilter, rowSearch]);

  const selectedRows = useMemo(() => {
    const selected = new Set(selectedFormulaKeys);
    return preview.rows.filter((row) => selected.has(row.food.formula_key));
  }, [preview.rows, selectedFormulaKeys]);

  const rowsForCommit =
    selectedRows.length > 0 ? selectedRows : preview.rows;
  const importableRowsForCommit = rowsForCommit.filter(
    (row) => row.validation.is_importable
  );

  const rowLimitNotice = useMemo(() => {
    if (visibleRows.length <= 50) return "Showing all matching preview rows.";
    return `Showing first 50 of ${visibleRows.length} matching rows.`;
  }, [visibleRows.length]);

  async function handleCsvFile(file: File | null) {
    if (!file) return;

    try {
      setError("");
      setCommitResult(null);
      setConflictResult(null);
      setShowCommitConfirm(false);
      setSelectedFormulaKeys([]);
      setRowFilter("all");
      const text = await file.text();
      setPreview(previewFoodV2Csv(text));
      setSourceLabel(file.name);
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
    setShowCommitConfirm(false);
    setSelectedFormulaKeys([]);
    setRowFilter("all");
    setRowSearch("");
    setSourceLabel("Manual sample");
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
          formula_keys: rowsForCommit.map((row) => row.food.formula_key),
          rows: rowsForCommit,
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
      setShowCommitConfirm(false);
      setIsImporting(true);

      const response = await fetch("/api/admin/foods/v2-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rows: rowsForCommit }),
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

  function toggleRowSelection(formulaKey: string) {
    setSelectedFormulaKeys((current) =>
      current.includes(formulaKey)
        ? current.filter((key) => key !== formulaKey)
        : [...current, formulaKey]
    );
  }

  function selectVisibleImportableRows() {
    setSelectedFormulaKeys([
      ...new Set(
        visibleRows
          .filter((row) => row.validation.is_importable)
          .map((row) => row.food.formula_key)
      ),
    ]);
  }

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
                onClick={() => setShowCommitConfirm(true)}
                disabled={isImporting || importableRowsForCommit.length === 0}
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
              >
                {isImporting
                  ? "Importing..."
                  : selectedRows.length > 0
                    ? "Commit Selected"
                    : "Commit Importable"}
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
                disabled={isCheckingConflicts || rowsForCommit.length === 0}
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
            <p className="mt-2 text-xs text-gray-500">
              Current source: {sourceLabel}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {showCommitConfirm && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-semibold">Confirm Food V2 commit</p>
                <p className="mt-2">
                  This will write {importableRowsForCommit.length} importable
                  rows to Food V2 tables and audit {rowsForCommit.length}{" "}
                  selected preview rows. Blocked selected rows will not be
                  imported.
                </p>
                {conflictResult && (
                  <p className="mt-2">
                    Existing-key check: {conflictResult.newCount} new rows and{" "}
                    {conflictResult.existingCount} rows that will update
                    existing Food V2 records.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShowCommitConfirm(false)}
                  className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-amber-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={commitImportableRows}
                  disabled={isImporting}
                  className="rounded-lg bg-black px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Confirm Commit
                </button>
              </div>
            </div>
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
            {(conflictResult.likelyDuplicates?.length ?? 0) > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <p className="font-semibold">
                  {conflictResult.likelyDuplicates?.length} possible canonical
                  duplicate groups found.
                </p>
                <p className="mt-1">
                  These may be the same formula from another site, PDF, or pack
                  size. Review before committing.
                </p>
                <div className="mt-3 space-y-2">
                  {conflictResult.likelyDuplicates?.slice(0, 5).map((group) => (
                    <div
                      key={group.canonical_formula_key}
                      className="rounded-lg bg-white/70 p-3"
                    >
                      <p className="break-all text-xs font-semibold">
                        {group.canonical_formula_key}
                      </p>
                      <p className="mt-1 text-xs">
                        Incoming: {group.incoming.length}
                        {group.existing.length > 0
                          ? ` - Existing DB matches: ${group.existing.length}`
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-black">
                Import Decision Controls
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Filter rows, select only the formulas you want, then run
                conflict check and commit that exact selection.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-black">
                {visibleRows.length} visible
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-black">
                {selectedRows.length} selected
              </span>
              <span className="rounded-full bg-green-50 px-3 py-1 text-green-800">
                {importableRowsForCommit.length} commit-ready
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-black">
                Row search
              </label>
              <input
                value={rowSearch}
                onChange={(event) => setRowSearch(event.target.value)}
                placeholder="Search brand, formula, key..."
                className="w-full rounded-xl border border-gray-300 p-3 text-black"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black">
                Row filter
              </label>
              <select
                value={rowFilter}
                onChange={(event) => setRowFilter(event.target.value as RowFilter)}
                className="w-full rounded-xl border border-gray-300 p-3 text-black"
              >
                <option value="all">All rows</option>
                <option value="importable">Importable only</option>
                <option value="blocked">Blocked only</option>
                <option value="new">New after conflict check</option>
                <option value="update">Will update after conflict check</option>
              </select>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                onClick={selectVisibleImportableRows}
                className="rounded-xl border border-black px-4 py-3 text-sm font-medium text-black transition hover:bg-gray-100"
              >
                Select Visible Importable
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormulaKeys([])}
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-black transition hover:bg-gray-100"
              >
                Clear Selection
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                downloadRowsCsv(
                  "nutritail-food-v2-visible-preview-review.csv",
                  visibleRows
                )
              }
              disabled={visibleRows.length === 0}
              className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              Export visible review CSV
            </button>
            <button
              type="button"
              onClick={() =>
                downloadRowsCsv(
                  "nutritail-food-v2-blocked-preview-review.csv",
                  preview.rows.filter((row) => !row.validation.is_importable)
                )
              }
              disabled={preview.summary.blockedRows === 0}
              className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              Export blocked rows
            </button>
          </div>
        </div>

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
            {visibleRows.slice(0, 50).map((row, index) => (
              <div
                key={`${row.food.formula_key}-${index}`}
                className={`rounded-2xl border p-5 ${
                  selectedFormulaKeys.includes(row.food.formula_key)
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
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
                    {row.canonical && (
                      <div className="mt-3 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                        <p>
                          <span className="font-semibold text-black">
                            Standard:
                          </span>{" "}
                          {row.canonical.standard_display_name}
                        </p>
                        <p className="mt-1 break-all">
                          <span className="font-semibold text-black">
                            Canonical:
                          </span>{" "}
                          {row.canonical.canonical_formula_key}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-start gap-3">
                    <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black">
                      <input
                        type="checkbox"
                        checked={selectedFormulaKeys.includes(
                          row.food.formula_key
                        )}
                        onChange={() => toggleRowSelection(row.food.formula_key)}
                        className="h-4 w-4"
                      />
                      Select
                    </label>
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center">
                      <p className="text-xs text-gray-500">Score</p>
                      <p className="text-2xl font-bold text-black">
                        {row.validation.completeness_score}%
                      </p>
                    </div>
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

                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-black">
                    Extracted nutrients
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4 xl:grid-cols-8">
                    <div>
                      <p className="text-gray-500">Fat</p>
                      <p className="font-semibold text-black">
                        {formatNutrient(row.nutrients.fat_percent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fiber</p>
                      <p className="font-semibold text-black">
                        {formatNutrient(row.nutrients.fiber_percent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ash</p>
                      <p className="font-semibold text-black">
                        {formatNutrient(row.nutrients.ash_percent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Moisture</p>
                      <p className="font-semibold text-black">
                        {formatNutrient(row.nutrients.moisture_percent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Calcium</p>
                      <p className="font-semibold text-black">
                        {formatNutrient(row.nutrients.calcium_percent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Phosphorus</p>
                      <p className="font-semibold text-black">
                        {formatNutrient(row.nutrients.phosphorus_percent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Omega 3</p>
                      <p className="font-semibold text-black">
                        {formatNutrient(row.nutrients.omega3_percent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Omega 6</p>
                      <p className="font-semibold text-black">
                        {formatNutrient(row.nutrients.omega6_percent)}
                      </p>
                    </div>
                  </div>
                </div>

                {(row.food.medical_tags.length > 0 ||
                  row.food.commercial_tags.length > 0) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      ...new Set([
                        ...row.food.medical_tags,
                        ...row.food.commercial_tags,
                      ]),
                    ].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                )}

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
