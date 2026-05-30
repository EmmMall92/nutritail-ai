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

function downloadExport(type: "products" | "audit") {
  window.location.href = `/api/admin/foods/v2-export?type=${type}`;
}

export default function FoodV2ReviewPage() {
  const [data, setData] = useState<FoodV2ReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [search, setSearch] = useState("");

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
