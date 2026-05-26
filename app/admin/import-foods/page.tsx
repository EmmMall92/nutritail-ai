"use client";

import { useState } from "react";
import { previewCsvFoods } from "@/lib/import/csvFoodImporter";
import type { Food } from "@/types/food";
import type { ImportRowScore, ImportWarning } from "@/types/import-preview";

type ImportResponse = {
  success: boolean;
  imported: number;
  updatedIds: string[];
  insertedIds: string[];
};

export default function ImportFoodsPage() {
  const [previewFoods, setPreviewFoods] = useState<Food[]>([]);
  const [warnings, setWarnings] = useState<ImportWarning[]>([]);
  const [rowScores, setRowScores] = useState<ImportRowScore[]>([]);
  const [invalidCount, setInvalidCount] = useState(0);
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      setImportResult(null);

      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".csv")) {
        const text = await file.text();

        const preview = previewCsvFoods(text);

        setPreviewFoods(preview.foods);
        setWarnings(preview.warnings);
        setRowScores(preview.rowScores);
        setInvalidCount(preview.invalidCount);
        return;
      }

      throw new Error("Unsupported file type. Please upload a CSV file.");
    } catch (err) {
      console.error(err);
      setPreviewFoods([]);
      setWarnings([]);
      setRowScores([]);
      setInvalidCount(0);
      setError(
        err instanceof Error ? err.message : "Failed to parse import file."
      );
      setImportResult(null);
    }
  }

  async function handleImport() {
    try {
      setIsImporting(true);
      setError("");
      setImportResult(null);

      if (invalidCount > 0) {
        throw new Error("Fix invalid rows before importing foods.");
      }

      const response = await fetch("/api/admin/import-foods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(previewFoods),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Import failed.");
      }

      setImportResult(result as ImportResponse);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to import foods.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-bold text-black">Admin: Import Foods</h1>
        <p className="mt-2 text-gray-600">
          Upload a CSV file, preview the parsed foods, and import them into the
          database.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-black">
          Upload CSV file
        </label>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="block w-full text-black"
        />
      </div>

      <a
        href="/admin"
        className="inline-block rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
      >
        Back to Admin Dashboard
      </a>
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          <h2 className="mb-2 text-lg font-semibold">Import Warnings</h2>
          <div className="space-y-2 text-sm">
            {warnings.slice(0, 10).map((warning, index) => (
              <p key={index}>
                Row {warning.rowIndex} - {warning.severity ?? "warning"} -{" "}
                {warning.field}: {warning.message}
              </p>
            ))}
          </div>
          {warnings.length > 10 && (
            <p className="mt-2 text-sm">Showing first 10 warnings only.</p>
          )}
        </div>
      )}

      {importResult && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700 space-y-2">
          <p>Import successful. Imported {importResult.imported} foods.</p>
          <p>Inserted: {importResult.insertedIds.length}</p>
          <p>Updated: {importResult.updatedIds.length}</p>
        </div>
      )}

      {previewFoods.length > 0 && (
        <>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-black">Preview</h2>
                <p className="text-sm text-gray-600">
                  Parsed {previewFoods.length} foods from the file.{" "}
                  {invalidCount > 0
                    ? `${invalidCount} invalid rows need review.`
                    : "All rows are importable."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting || invalidCount > 0}
                className="rounded-lg bg-black px-5 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {isImporting ? "Importing..." : "Import Foods"}
              </button>
            </div>

            <div className="space-y-4">
              {previewFoods.slice(0, 10).map((food) => {
                const rowScore = rowScores.find((score) => score.id === food.id);

                return (
                  <div
                    key={food.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-black">
                        {food.brand} - {food.name}
                      </p>
                      {rowScore && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            rowScore.isValid
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          Score {rowScore.completenessScore}/100
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-black">
                      {food.species} / {food.lifeStage} / protein{" "}
                      {food.protein}%{" / "}fat {food.fat}%
                    </p>
                    <p className="mt-1 text-sm text-black">
                      Ingredients: {food.ingredients.join(", ")}
                    </p>
                    <p className="text-sm text-black">
                      Tags: {food.tags.join(", ")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {previewFoods.length > 10 && (
            <p className="text-sm text-gray-600">
              Showing first 10 rows only.
            </p>
          )}
        </>
      )}
    </main>
  );
}
