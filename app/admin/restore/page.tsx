"use client";

import { useState } from "react";

type DatasetType = "foods" | "pets" | "activity";

type RestorePreview = {
  total: number;
  ids: string[];
  existingIds: string[];
  existingCount: number;
  newCount: number;
};

export default function AdminRestorePage() {
  const [dataset, setDataset] = useState<DatasetType>("foods");
  const [rawText, setRawText] = useState("");
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [error, setError] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed)) {
        throw new Error("The uploaded JSON must contain an array.");
      }

      setRawText(text);
      setParsedCount(parsed.length);
      setPreview(null);
      setError("");
      setResultMessage("");
    } catch (err) {
      console.error(err);
      setRawText("");
      setParsedCount(null);
      setPreview(null);
      setError(err instanceof Error ? err.message : "Invalid JSON file.");
      setResultMessage("");
    }
  }

  async function handlePreview() {
    try {
      setIsPreviewing(true);
      setError("");
      setResultMessage("");

      if (!rawText.trim()) {
        throw new Error("Please upload a JSON file first.");
      }

      const parsed = JSON.parse(rawText);

      const response = await fetch(`/api/admin/restore-preview/${dataset}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Preview failed.");
      }

      setPreview(result as RestorePreview);
    } catch (err) {
      console.error(err);
      setPreview(null);
      setError(err instanceof Error ? err.message : "Preview failed.");
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleRestore() {
    try {
      setIsRestoring(true);
      setError("");
      setResultMessage("");

      if (!rawText.trim()) {
        throw new Error("Please upload a JSON file first.");
      }

      const parsed = JSON.parse(rawText);

      const confirmed =
        !preview || preview.existingCount === 0
          ? true
          : window.confirm(
              `This restore may overwrite ${preview.existingCount} existing records. Continue?`
            );

      if (!confirmed) {
        setIsRestoring(false);
        return;
      }

      const response = await fetch(`/api/admin/restore/${dataset}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Restore failed.");
      }

      setResultMessage(`Restore successful. Restored ${result.restored} records.`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Restore failed.");
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black">Restore Data</h2>
        <p className="mt-2 text-gray-600">
          Re-import previously exported JSON backup files into the system.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Dataset
          </label>
          <select
            value={dataset}
            onChange={(e) => {
              setDataset(e.target.value as DatasetType);
              setPreview(null);
              setResultMessage("");
              setError("");
            }}
            className="w-full rounded-lg border border-gray-300 p-3 text-black md:max-w-sm"
          >
            <option value="foods">Foods</option>
            <option value="pets">Pets</option>
            <option value="activity">Activity Logs</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Upload JSON Backup File
          </label>
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="block w-full text-black"
          />
        </div>

        {parsedCount !== null && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
            Parsed {parsedCount} records from uploaded file.
          </div>
        )}

        {preview && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 space-y-2">
            <p>Total records: {preview.total}</p>
            <p>New records: {preview.newCount}</p>
            <p>Existing records (possible overwrite): {preview.existingCount}</p>

            {preview.ids.length > 0 && (
              <div>
                <p className="font-medium">Sample IDs:</p>
                <p className="text-sm">{preview.ids.join(", ")}</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {resultMessage && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
            {resultMessage}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePreview}
            disabled={isPreviewing}
            className="rounded-lg border border-black px-5 py-3 text-black transition hover:bg-gray-100 disabled:opacity-50"
          >
            {isPreviewing ? "Previewing..." : "Preview Restore"}
          </button>

          <button
            type="button"
            onClick={handleRestore}
            disabled={isRestoring}
            className="rounded-lg bg-black px-5 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isRestoring ? "Restoring..." : "Restore Data"}
          </button>
        </div>
      </div>
    </section>
  );
}