"use client";

import { useState } from "react";

type ExportKey = "foods" | "pets" | "activity";

async function downloadJson(url: string, filename: string) {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `Failed to export ${filename}`);
  }

  const blob = new Blob([JSON.stringify(result, null, 2)], {
    type: "application/json",
  });

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export default function AdminExportPage() {
  const [exporting, setExporting] = useState<ExportKey | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleExport(key: ExportKey, url: string, filename: string) {
    try {
      setExporting(key);
      setError("");
      setSuccessMessage("");

      await downloadJson(url, filename);
      setSuccessMessage(`${filename} downloaded successfully.`);
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black">Data Export</h2>
        <p className="mt-2 text-gray-600">
          Download JSON backups for core admin datasets.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-black">Export Foods</h3>
          <p className="mt-2 text-sm text-gray-600">
            Download the full foods catalog as JSON.
          </p>
          <button
            type="button"
            onClick={() =>
              handleExport(
                "foods",
                "/api/admin/export/foods",
                "foods-export.json"
              )
            }
            disabled={exporting !== null}
            className="mt-4 rounded-lg bg-black px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {exporting === "foods" ? "Downloading..." : "Download Foods"}
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-black">Export Pets</h3>
          <p className="mt-2 text-sm text-gray-600">
            Download all pet profiles as JSON.
          </p>
          <button
            type="button"
            onClick={() =>
              handleExport(
                "pets",
                "/api/admin/export/pets",
                "pets-export.json"
              )
            }
            disabled={exporting !== null}
            className="mt-4 rounded-lg bg-black px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {exporting === "pets" ? "Downloading..." : "Download Pets"}
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-black">Export Activity</h3>
          <p className="mt-2 text-sm text-gray-600">
            Download the admin activity log as JSON.
          </p>
          <button
            type="button"
            onClick={() =>
              handleExport(
                "activity",
                "/api/admin/export/activity",
                "activity-export.json"
              )
            }
            disabled={exporting !== null}
            className="mt-4 rounded-lg bg-black px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {exporting === "activity"
              ? "Downloading..."
              : "Download Activity"}
          </button>
        </div>
      </div>
    </section>
  );
}
