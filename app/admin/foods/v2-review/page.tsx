"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type FoodV2Product = {
  id: string;
  brand: string;
  display_name: string;
  species: string;
  format: string;
  life_stage: string;
  dog_size: string | null;
  data_quality_status: string;
  source_priority: string;
  formula_key: string;
  kcal_per_100g: number | null;
  updated_at: string | null;
};

type FoodV2AuditRow = {
  id: string;
  formula_key: string | null;
  importable: boolean | null;
  completeness_score: number | null;
  missing_fields: string[] | null;
  warnings: string[] | null;
  impossible_values: string[] | null;
  conflicts: string[] | null;
  created_at: string | null;
};

type FoodV2QueueRow = {
  decision: string;
  dataset_file: string;
  formula_key: string;
  brand: string;
  formula_name: string;
  display_brand: string;
  display_formula_name: string;
  species: string;
  quality_status: string;
  source_priority: string;
  missing_blockers: string;
  next_action: string;
  text_issues: string;
  review_bucket: string;
  preview_row: Record<string, string>;
};

type FoodV2ReviewResponse = {
  summary: {
    totalProducts: number;
    verifiedProducts: number;
    needsReviewProducts: number;
    unknownProducts: number;
    totalAuditRows: number;
    blockedAuditRows: number;
  };
  products: FoodV2Product[];
  auditRows: FoodV2AuditRow[];
  importQueue: {
    summary: {
      totalRows: number;
      decisionCounts: Record<string, number>;
      brandCounts: Record<string, number>;
      missingFieldCounts: Record<string, number>;
      datasetCounts: Record<string, number>;
      speciesCounts: Record<string, number>;
      qualityStatusCounts: Record<string, number>;
      reviewBucketCounts: Record<string, number>;
      textIssueCounts: Record<string, number>;
      previewHeaders: string[];
    };
    rows: FoodV2QueueRow[];
  };
};

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-black">{value}</p>
      <p className="mt-1 text-xs text-gray-600">{helper}</p>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function issueList(row: FoodV2AuditRow) {
  return [
    ...(row.missing_fields ?? []),
    ...(row.impossible_values ?? []),
    ...(row.conflicts ?? []),
    ...(row.warnings ?? []),
  ];
}

function reviewRowTitle(row: FoodV2QueueRow) {
  return (
    row.preview_row?.display_name ||
    [row.display_brand || row.brand, row.display_formula_name || row.formula_name]
      .filter(Boolean)
      .join(" ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function downloadExport(type: "products" | "audit") {
  window.location.href = `/api/admin/foods/v2-export?type=${type}`;
}

function sortCounts(counts: Record<string, number>) {
  return Object.entries(counts).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );
}

async function copyText(value: string) {
  if (!value) return;
  await navigator.clipboard.writeText(value);
}

function queueReviewNote(row: FoodV2QueueRow) {
  return [
    `formula_key=${row.formula_key}`,
    `brand=${row.display_brand || row.brand}`,
    `formula=${reviewRowTitle(row)}`,
    `review_bucket=${row.review_bucket}`,
    `source_file=${row.dataset_file}`,
    `missing=${row.missing_blockers || "none"}`,
    `next=${row.next_action || "manual review"}`,
  ].join("\n");
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, headers: string[], rows: FoodV2QueueRow[]) {
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => csvCell(row.preview_row?.[header] ?? "")).join(",")
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

export default function FoodV2ReviewPage() {
  const [data, setData] = useState<FoodV2ReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [queueSearch, setQueueSearch] = useState("");
  const [queueDecisionFilter, setQueueDecisionFilter] = useState("all");
  const [queueBlockerFilter, setQueueBlockerFilter] = useState("all");
  const [queueBrandFilter, setQueueBrandFilter] = useState("all");
  const [queueSpeciesFilter, setQueueSpeciesFilter] = useState("all");
  const [queueDatasetFilter, setQueueDatasetFilter] = useState("all");
  const [queueBucketFilter, setQueueBucketFilter] = useState("all");
  const [selectedQueueKey, setSelectedQueueKey] = useState<string | null>(null);
  const [selectedQueueKeys, setSelectedQueueKeys] = useState<string[]>([]);

  async function loadReview() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/admin/foods/v2-review", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load Food V2 review.");
      }

      setData(result as FoodV2ReviewResponse);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load Food V2 review."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReview();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSearch = params.get("search");

    if (requestedSearch) {
      setSearch(requestedSearch);
      setQueueSearch(requestedSearch);
    }
  }, []);

  const visibleProducts = useMemo(() => {
    const products = data?.products ?? [];
    const searchText = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuality =
        qualityFilter === "all" ||
        product.data_quality_status === qualityFilter;
      const matchesSearch =
        !searchText ||
        `${product.brand} ${product.display_name} ${product.formula_key}`
          .toLowerCase()
          .includes(searchText);

      return matchesQuality && matchesSearch;
    });
  }, [data?.products, qualityFilter, search]);

  const queueSummary = data?.importQueue?.summary;
  const topMissingFields = useMemo(() => {
    return sortCounts(queueSummary?.missingFieldCounts ?? {}).slice(0, 8);
  }, [queueSummary?.missingFieldCounts]);

  const topBrands = useMemo(() => {
    return sortCounts(queueSummary?.brandCounts ?? {}).slice(0, 10);
  }, [queueSummary?.brandCounts]);

  const datasetOptions = useMemo(() => {
    return sortCounts(queueSummary?.datasetCounts ?? {});
  }, [queueSummary?.datasetCounts]);

  const speciesOptions = useMemo(() => {
    return sortCounts(queueSummary?.speciesCounts ?? {});
  }, [queueSummary?.speciesCounts]);

  const reviewBucketOptions = useMemo(() => {
    return sortCounts(queueSummary?.reviewBucketCounts ?? {});
  }, [queueSummary?.reviewBucketCounts]);

  const visibleQueueRows = useMemo(() => {
    const queueRows = data?.importQueue?.rows ?? [];
    const searchText = queueSearch.trim().toLowerCase();

    return queueRows.filter((row) => {
      const matchesSearch =
        !searchText ||
        `${row.brand} ${row.formula_name} ${row.formula_key} ${row.dataset_file}`
          .toLowerCase()
          .includes(searchText);
      const matchesDecision =
        queueDecisionFilter === "all" || row.decision === queueDecisionFilter;
      const matchesBlocker =
        queueBlockerFilter === "all" ||
        row.missing_blockers.split("|").includes(queueBlockerFilter);
      const matchesBrand =
        queueBrandFilter === "all" ||
        (row.display_brand || row.brand) === queueBrandFilter;
      const matchesSpecies =
        queueSpeciesFilter === "all" || row.species === queueSpeciesFilter;
      const matchesDataset =
        queueDatasetFilter === "all" || row.dataset_file === queueDatasetFilter;
      const matchesBucket =
        queueBucketFilter === "all" || row.review_bucket === queueBucketFilter;

      return (
        matchesSearch &&
        matchesDecision &&
        matchesBlocker &&
        matchesBrand &&
        matchesSpecies &&
        matchesDataset &&
        matchesBucket
      );
    });
  }, [
    data?.importQueue?.rows,
    queueBlockerFilter,
    queueBrandFilter,
    queueBucketFilter,
    queueDatasetFilter,
    queueDecisionFilter,
    queueSearch,
    queueSpeciesFilter,
  ]);

  const selectedQueueRow = useMemo(() => {
    if (!selectedQueueKey) return null;
    return (
      visibleQueueRows.find(
        (row) => `${row.dataset_file}-${row.formula_key}` === selectedQueueKey
      ) ?? null
    );
  }, [selectedQueueKey, visibleQueueRows]);

  const queueLimitNotice =
    visibleQueueRows.length > 120
      ? `Showing first 120 of ${visibleQueueRows.length} matching rows.`
      : `Showing ${visibleQueueRows.length} matching rows.`;

  const visibleDecisionCounts = useMemo(() => {
    return visibleQueueRows.reduce<Record<string, number>>((acc, row) => {
      const decision = row.decision || "unknown";
      acc[decision] = (acc[decision] ?? 0) + 1;
      return acc;
    }, {});
  }, [visibleQueueRows]);

  const visibleTopMissingFields = useMemo(() => {
    return sortCounts(
      visibleQueueRows.reduce<Record<string, number>>((acc, row) => {
        String(row.missing_blockers ?? "")
          .split("|")
          .map((field) => field.trim())
          .filter(Boolean)
          .forEach((field) => {
            acc[field] = (acc[field] ?? 0) + 1;
          });
        return acc;
      }, {})
    ).slice(0, 6);
  }, [visibleQueueRows]);

  const visibleCandidateRows = useMemo(() => {
    return visibleQueueRows.filter((row) => row.decision === "candidate");
  }, [visibleQueueRows]);

  const activeDatasetLabel =
    queueDatasetFilter === "all" ? "All source files" : queueDatasetFilter;

  const selectedQueueRows = useMemo(() => {
    const selected = new Set(selectedQueueKeys);
    return (data?.importQueue?.rows ?? []).filter((row) =>
      selected.has(`${row.dataset_file}-${row.formula_key}`)
    );
  }, [data?.importQueue?.rows, selectedQueueKeys]);

  function toggleQueueSelection(row: FoodV2QueueRow) {
    const key = `${row.dataset_file}-${row.formula_key}`;
    setSelectedQueueKeys((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    );
  }

  function selectVisibleCandidates() {
    const candidateKeys = visibleCandidateRows.map(
      (row) => `${row.dataset_file}-${row.formula_key}`
    );
    setSelectedQueueKeys((current) =>
      Array.from(new Set([...current, ...candidateKeys]))
    );
  }

  function downloadPreviewCsv(rows: FoodV2QueueRow[], filename: string) {
    const headers = data?.importQueue?.summary.previewHeaders ?? [];
    if (headers.length === 0 || rows.length === 0) return;
    downloadCsv(filename, headers, rows);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">Food V2 Review</h2>
          <p className="mt-2 max-w-2xl text-gray-600">
            Review committed Food V2 rows and the latest import audit history.
            This page is read-only.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadReview}
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => downloadExport("products")}
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Export Products CSV
          </button>
          <button
            type="button"
            onClick={() => downloadExport("audit")}
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Export Audit CSV
          </button>
          <Link
            href="/admin/foods/v2-preview"
            className="rounded-lg bg-black px-4 py-2 text-sm text-white transition hover:opacity-90"
          >
            Open Import Preview
          </Link>
          <Link
            href="/admin/foods/v2-guide"
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Import Guide
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">Loading Food V2 review...</p>
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">No Food V2 review data found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="V2 Products"
              value={data.summary.totalProducts}
              helper="Rows in food_products_v2"
            />
            <StatCard
              label="Verified"
              value={data.summary.verifiedProducts}
              helper="Official or reviewed rows"
            />
            <StatCard
              label="Needs Review"
              value={data.summary.needsReviewProducts}
              helper="Rows still needing QA"
            />
            <StatCard
              label="Unknown"
              value={data.summary.unknownProducts}
              helper="Rows with weak status"
            />
            <StatCard
              label="Audit Rows"
              value={data.summary.totalAuditRows}
              helper="Import attempts logged"
            />
            <StatCard
              label="Blocked Audit"
              value={data.summary.blockedAuditRows}
              helper="Rows not importable"
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-black">
                  Search
                </label>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search brand, formula, or formula key..."
                  className="w-full rounded-xl border border-gray-300 p-3 text-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Quality
                </label>
                <select
                  value={qualityFilter}
                  onChange={(event) => setQualityFilter(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-3 text-black"
                >
                  <option value="all">All</option>
                  <option value="verified">Verified</option>
                  <option value="needs_review">Needs review</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-black">
                  Import Candidate Queue
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Review extracted Food V2 rows before they move to admin
                  preview. This list is generated from the local review queue.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-black">
                  {queueSummary?.totalRows ?? 0} queued
                </span>
                {Object.entries(queueSummary?.decisionCounts ?? {}).map(
                  ([decision, count]) => (
                    <span
                      key={decision}
                      className="rounded-full bg-gray-100 px-3 py-1 text-black"
                    >
                      {decision}: {count}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-medium text-black">
                  Queue search
                </label>
                <input
                  value={queueSearch}
                  onChange={(event) => setQueueSearch(event.target.value)}
                  placeholder="Search queued brand, formula, source file..."
                  className="w-full rounded-xl border border-gray-300 p-3 text-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Decision
                </label>
                <select
                  value={queueDecisionFilter}
                  onChange={(event) =>
                    setQueueDecisionFilter(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 p-3 text-black"
                >
                  <option value="all">All</option>
                  <option value="candidate">Candidate</option>
                  <option value="hold">Hold</option>
                  <option value="reject">Reject</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Review bucket
                </label>
                <select
                  value={queueBucketFilter}
                  onChange={(event) =>
                    setQueueBucketFilter(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 p-3 text-black"
                >
                  <option value="all">All</option>
                  {reviewBucketOptions.map(([bucket, count]) => (
                    <option key={bucket} value={bucket}>
                      {bucket} ({count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Brand
                </label>
                <select
                  value={queueBrandFilter}
                  onChange={(event) => setQueueBrandFilter(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-3 text-black"
                >
                  <option value="all">All</option>
                  {topBrands.map(([brand, count]) => (
                    <option key={brand} value={brand}>
                      {brand} ({count})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Species
                </label>
                <select
                  value={queueSpeciesFilter}
                  onChange={(event) =>
                    setQueueSpeciesFilter(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 p-3 text-black"
                >
                  <option value="all">All</option>
                  {speciesOptions.map(([species, count]) => (
                    <option key={species} value={species}>
                      {species} ({count})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Missing blocker
                </label>
                <select
                  value={queueBlockerFilter}
                  onChange={(event) =>
                    setQueueBlockerFilter(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 p-3 text-black"
                >
                  <option value="all">All</option>
                  {topMissingFields.map(([field, count]) => (
                    <option key={field} value={field}>
                      {field} ({count})
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-medium text-black">
                  Source file
                </label>
                <select
                  value={queueDatasetFilter}
                  onChange={(event) =>
                    setQueueDatasetFilter(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 p-3 text-black"
                >
                  <option value="all">All</option>
                  {datasetOptions.map(([dataset, count]) => (
                    <option key={dataset} value={dataset}>
                      {dataset} ({count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Active source
                  </p>
                  <p className="mt-1 break-all text-sm font-semibold text-black">
                    {activeDatasetLabel}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Visible rows
                  </p>
                  <p className="mt-1 text-sm font-semibold text-black">
                    {visibleQueueRows.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Importable candidates
                  </p>
                  <p className="mt-1 text-sm font-semibold text-green-700">
                    {visibleDecisionCounts.candidate ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Hold / blocked
                  </p>
                  <p className="mt-1 text-sm font-semibold text-amber-700">
                    {visibleDecisionCounts.hold ?? 0}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {visibleTopMissingFields.length === 0 ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-800">
                    no visible blockers
                  </span>
                ) : (
                  visibleTopMissingFields.map(([field, count]) => (
                    <button
                      key={field}
                      type="button"
                      onClick={() => setQueueBlockerFilter(field)}
                      className="rounded-full bg-white px-3 py-1 text-xs text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-100"
                    >
                      {field}: {count}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-sm text-gray-600">{queueLimitNotice}</p>
              <button
                type="button"
                onClick={() =>
                  downloadPreviewCsv(
                    selectedQueueRows.length > 0
                      ? selectedQueueRows
                      : visibleQueueRows,
                    selectedQueueRows.length > 0
                      ? "nutritail-selected-food-v2-preview.csv"
                      : "nutritail-filtered-food-v2-preview.csv"
                  )
                }
                disabled={
                  (selectedQueueRows.length > 0
                    ? selectedQueueRows.length
                    : visibleQueueRows.length) === 0
                }
                className="rounded-lg bg-black px-3 py-2 text-xs text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Download preview CSV
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadPreviewCsv(
                    visibleCandidateRows,
                    "nutritail-visible-candidate-food-v2-preview.csv"
                  )
                }
                disabled={visibleCandidateRows.length === 0}
                className="rounded-lg border border-green-700 px-3 py-2 text-xs text-green-800 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
              >
                Download candidates only
              </button>
              <button
                type="button"
                onClick={selectVisibleCandidates}
                disabled={visibleCandidateRows.length === 0}
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                Select visible candidates
              </button>
              <Link
                href="/admin/foods/v2-preview"
                className="rounded-lg border border-black px-3 py-2 text-xs text-black transition hover:bg-gray-100"
              >
                Open preview
              </Link>
              <button
                type="button"
                onClick={() => {
                  setQueueSearch("");
                  setQueueDecisionFilter("all");
                  setQueueBlockerFilter("all");
                  setQueueBrandFilter("all");
                  setQueueSpeciesFilter("all");
                  setQueueDatasetFilter("all");
                  setQueueBucketFilter("all");
                  setSelectedQueueKey(null);
                  setSelectedQueueKeys([]);
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-black transition hover:bg-gray-100"
              >
                Clear queue filters
              </button>
              {selectedQueueRows.length > 0 && (
                <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-black">
                  {selectedQueueRows.length} selected
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {reviewBucketOptions.slice(0, 8).map(([bucket, count]) => (
                <button
                  key={bucket}
                  type="button"
                  onClick={() => setQueueBucketFilter(bucket)}
                  className="rounded-xl border border-gray-200 bg-white p-3 text-left text-sm transition hover:bg-gray-50"
                >
                  <span className="block font-semibold text-black">
                    {count}
                  </span>
                  <span className="mt-1 block break-all text-xs text-gray-600">
                    {bucket}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {topMissingFields.map(([field, count]) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => setQueueBlockerFilter(field)}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-left text-sm transition hover:bg-gray-100"
                >
                  <span className="block font-semibold text-black">
                    {count}
                  </span>
                  <span className="mt-1 block break-all text-xs text-gray-600">
                    {field}
                  </span>
                </button>
              ))}
            </div>

            {selectedQueueRow && (
              <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-950">
                      Selected review row
                    </p>
                    <p className="mt-1 text-sm text-blue-900">
                      {reviewRowTitle(selectedQueueRow)}
                    </p>
                    <p className="mt-2 break-all text-xs text-blue-800">
                      {selectedQueueRow.formula_key}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => copyText(selectedQueueRow.formula_key)}
                      className="rounded-lg border border-blue-900 px-3 py-2 text-xs text-blue-950 transition hover:bg-blue-100"
                    >
                      Copy formula key
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(queueReviewNote(selectedQueueRow))}
                      className="rounded-lg bg-blue-950 px-3 py-2 text-xs text-white transition hover:opacity-90"
                    >
                      Copy review note
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
                  <div className="rounded-lg bg-white/70 p-3">
                    <p className="font-semibold text-blue-950">Missing</p>
                    <p className="mt-1 break-all text-blue-900">
                      {selectedQueueRow.missing_blockers || "-"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/70 p-3">
                    <p className="font-semibold text-blue-950">Next action</p>
                    <p className="mt-1 text-blue-900">
                      {selectedQueueRow.next_action || "-"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/70 p-3">
                    <p className="font-semibold text-blue-950">Source file</p>
                    <p className="mt-1 break-all text-blue-900">
                      {selectedQueueRow.dataset_file}
                    </p>
                  </div>
                </div>
                {selectedQueueRow.text_issues && (
                  <p className="mt-3 text-xs text-blue-900">
                    Text cleanup: {selectedQueueRow.text_issues}
                  </p>
                )}
              </div>
            )}

            <div className="mt-5 space-y-3">
              {visibleQueueRows.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No queued rows match this filter.
                </p>
              ) : (
                visibleQueueRows.slice(0, 120).map((row) => (
                  <div
                    key={`${row.dataset_file}-${row.formula_key}`}
                    className={`rounded-xl border p-4 ${
                      selectedQueueKey === `${row.dataset_file}-${row.formula_key}`
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold text-black">
                          {reviewRowTitle(row)}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {row.display_brand || row.brand} - {row.species} -{" "}
                          {row.quality_status}
                        </p>
                        <p className="mt-2 break-all text-xs text-gray-500">
                          {row.dataset_file}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs text-black">
                          {row.decision}
                        </span>
                        <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-800">
                          {row.review_bucket}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(row.missing_blockers || "")
                        .split("|")
                        .map((field) => field.trim())
                        .filter(Boolean)
                        .slice(0, 5)
                        .map((field) => (
                          <span
                            key={field}
                            className="rounded-full bg-red-50 px-2 py-1 text-xs text-red-700"
                          >
                            {field}
                          </span>
                        ))}
                      {!row.missing_blockers && (
                        <span className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">
                          no blockers
                        </span>
                      )}
                      {row.text_issues && (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                          text cleanup
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                      Next: {row.next_action}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs text-black">
                        <input
                          type="checkbox"
                          checked={selectedQueueKeys.includes(
                            `${row.dataset_file}-${row.formula_key}`
                          )}
                          onChange={() => toggleQueueSelection(row)}
                          className="h-4 w-4"
                        />
                        Select
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedQueueKey(
                            `${row.dataset_file}-${row.formula_key}`
                          )
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-black transition hover:bg-gray-100"
                      >
                        Review row
                      </button>
                      <button
                        type="button"
                        onClick={() => copyText(row.formula_key)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-black transition hover:bg-gray-100"
                      >
                        Copy key
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-black">
              Manual Evidence Workflow
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Use this when a queued food needs calories, minerals, ingredient
              panel photos, a barcode, or an official PDF before import.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="font-semibold text-black">1. Collect evidence</p>
                <p className="mt-1 text-sm text-gray-600">
                  Front, barcode, ingredients, analysis, calories and pack size.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="font-semibold text-black">2. Fill manifest</p>
                <p className="mt-1 break-all text-sm text-gray-600">
                  data/templates/food-evidence-manifest-template.csv
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="font-semibold text-black">3. Preview first</p>
                <p className="mt-1 text-sm text-gray-600">
                  Backfilled rows still go through Food V2 Preview before
                  commit.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-black">
              Committed Products
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Showing {visibleProducts.length} of {data.products.length} recent
              v2 product rows.
            </p>

            <div className="mt-4 space-y-3">
              {visibleProducts.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No v2 products match this filter.
                </p>
              ) : (
                visibleProducts.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold text-black">
                          {product.display_name}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {product.brand} - {product.species} - {product.format}{" "}
                          - {product.life_stage}
                          {product.dog_size ? ` - ${product.dog_size}` : ""}
                        </p>
                        <p className="mt-2 break-all text-xs text-gray-500">
                          {product.formula_key}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-black">
                          {product.data_quality_status}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-black">
                          {product.source_priority}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-black">
                          {product.kcal_per_100g ?? "-"} kcal/100g
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-gray-500">
                      Updated {formatDate(product.updated_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-black">
              Latest Import Audit
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Most recent audit rows from Food V2 import attempts.
            </p>

            <div className="mt-4 space-y-3">
              {data.auditRows.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No Food V2 audit rows yet.
                </p>
              ) : (
                data.auditRows.map((row) => {
                  const issues = issueList(row);

                  return (
                    <div
                      key={row.id}
                      className={`rounded-xl border p-4 ${
                        row.importable
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="break-all font-semibold text-black">
                            {row.formula_key ?? "Unknown formula key"}
                          </p>
                          <p className="mt-1 text-sm text-gray-700">
                            {row.importable ? "Importable" : "Blocked"} -{" "}
                            {row.completeness_score ?? 0}% complete
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDate(row.created_at)}
                        </p>
                      </div>

                      {issues.length > 0 && (
                        <ul className="mt-3 list-disc pl-5 text-sm text-black">
                          {issues.slice(0, 6).map((issue) => (
                            <li key={issue}>{issue}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
