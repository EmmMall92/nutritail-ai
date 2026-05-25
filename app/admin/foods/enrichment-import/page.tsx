"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type ImportResult = {
  success: boolean;
  totalRows: number;
  updatedRows: number;
  failedRows: number;
  results: Array<{
    id: string | null;
    success: boolean;
    error: string | null;
  }>;
};

const exampleJson = `[
  {
    "id": "dog-001",
    "kcal_per_100g": 380,
    "protein_percent": 26,
    "fat_percent": 14,
    "fiber_percent": 3,
    "sodium_percent": 0.35,
    "magnesium_percent": 0.08,
    "calcium_percent": 1.2,
    "phosphorus_percent": 0.9,
    "data_quality_status": "verified",
    "data_source_url": "https://example.com/product",
    "data_notes": "Values copied from official product page."
  }
]`;

export default function FoodEnrichmentImportPage() {
  const [jsonText, setJsonText] = useState(exampleJson);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsImporting(true);
      setError("");
      setResult(null);

      const rows = JSON.parse(jsonText);

      if (!Array.isArray(rows)) {
        throw new Error("JSON must be an array of rows.");
      }

      const response = await fetch("/api/admin/foods/import-enrichment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rows }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed.");
      }

      setResult(data as ImportResult);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-black">
          Food Enrichment Import
        </h1>

        <p className="mt-2 text-gray-600">
          Paste enriched nutrition rows as JSON and update existing foods by ID.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/api/admin/foods/enrichment-template"
            className="rounded-xl border border-black px-4 py-2 text-sm text-black"
          >
            Download CSV template
          </Link>

          <Link
            href="/admin/foods"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-black"
          >
            Back to Foods
          </Link>
        </div>
      </div>

      <form
        onSubmit={handleImport}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <label className="mb-2 block text-sm font-medium text-black">
          Enrichment JSON
        </label>

        <textarea
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setError("");
            setResult(null);
          }}
          rows={18}
          className="w-full rounded-xl border border-gray-300 p-4 font-mono text-sm text-black"
        />

        <button
          type="submit"
          disabled={isImporting}
          className="mt-4 rounded-xl bg-black px-6 py-3 text-white disabled:opacity-50"
        >
          {isImporting ? "Importing..." : "Import enrichment data"}
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-black">Import Result</h2>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-white p-4">
              <p className="text-sm text-gray-600">Total rows</p>
              <p className="text-2xl font-bold text-black">
                {result.totalRows}
              </p>
            </div>

            <div className="rounded-xl bg-white p-4">
              <p className="text-sm text-gray-600">Updated</p>
              <p className="text-2xl font-bold text-black">
                {result.updatedRows}
              </p>
            </div>

            <div className="rounded-xl bg-white p-4">
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-black">
                {result.failedRows}
              </p>
            </div>
          </div>

          {result.failedRows > 0 && (
            <div className="mt-4 space-y-2">
              {result.results
                .filter((item) => !item.success)
                .map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="rounded-xl border border-red-200 bg-white p-3 text-sm text-red-700"
                  >
                    {item.id || "Unknown ID"}: {item.error}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
