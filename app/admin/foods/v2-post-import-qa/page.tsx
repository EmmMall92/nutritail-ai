"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BrandSummary = {
  brand: string;
  total_rows: number;
  recommendable_rows: number;
  estimated_kcal_rows: number;
  label_kcal_rows: number;
  missing_core_nutrient_rows: number;
  retailer_rows: number;
  official_rows: number;
};

type QaReport = {
  generated_at: string;
  totals: {
    products: number;
    nutrients: number;
    audit_rows: number;
    recommendable_products: number;
    needs_review_products: number;
    retailer_products: number;
    official_products: number;
    products_with_energy: number;
    products_with_label_energy: number;
    products_with_estimated_energy: number;
    products_with_core_nutrients: number;
    products_with_calcium_phosphorus: number;
    products_with_epa_dha: number;
  };
  recent_audit: {
    rows_checked: number;
    importable: number;
    blocked: number;
    missing_fields: number;
    warnings: number;
    impossible_values: number;
    conflicts: number;
    latest_created_at: string | null;
  };
  brand_summaries: BrandSummary[];
  qa_flags: {
    missing_nutrient_rows: number;
    missing_energy_rows: number;
    estimated_energy_rows: number;
    non_recommendable_rows: number;
  };
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

function percent(part: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

export default function FoodV2PostImportQaPage() {
  const [report, setReport] = useState<QaReport | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadReport() {
    try {
      setError("");
      setIsLoading(true);
      const response = await fetch("/api/admin/foods/v2-post-import-qa", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load Food V2 QA report.");
      }

      setReport(result as QaReport);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load Food V2 QA report."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReport();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Food V2
              </p>
              <h1 className="mt-2 text-3xl font-bold text-black">
                Post-import QA report
              </h1>
              <p className="mt-2 max-w-3xl text-gray-600">
                Review live Food V2 coverage after imports: recommendation
                visibility, source mix, estimated calories, nutrient coverage,
                and recent audit issues.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadReport}
                disabled={isLoading}
                className="rounded-xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-500"
              >
                {isLoading ? "Loading..." : "Refresh"}
              </button>
              <Link
                href="/admin/foods/v2-preview"
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Import Preview
              </Link>
              <Link
                href="/admin/foods"
                className="rounded-xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-100"
              >
                Back to Foods
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading && !report && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            Loading Food V2 QA report...
          </div>
        )}

        {report && (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Products"
                value={report.totals.products}
                helper="Live Food V2 product rows"
              />
              <SummaryCard
                label="Recommendable"
                value={`${report.totals.recommendable_products} (${percent(
                  report.totals.recommendable_products,
                  report.totals.products
                )})`}
                helper="Allowed in recommendation flows"
              />
              <SummaryCard
                label="Needs Review"
                value={report.totals.needs_review_products}
                helper="Rows still marked for QA"
              />
              <SummaryCard
                label="Audit Rows"
                value={report.totals.audit_rows}
                helper="Food V2 import audit history"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Label Kcal"
                value={report.totals.products_with_label_energy}
                helper="Energy from label/source"
              />
              <SummaryCard
                label="Estimated Kcal"
                value={report.totals.products_with_estimated_energy}
                helper="Calculated fallback energy"
              />
              <SummaryCard
                label="Core Nutrients"
                value={`${report.totals.products_with_core_nutrients} (${percent(
                  report.totals.products_with_core_nutrients,
                  report.totals.products
                )})`}
                helper="Protein, fat, and fiber present"
              />
              <SummaryCard
                label="Ca/P Coverage"
                value={report.totals.products_with_calcium_phosphorus}
                helper="Calcium and phosphorus present"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-black">
                  Recent import audit
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Latest audit timestamp:{" "}
                  {report.recent_audit.latest_created_at || "-"}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-gray-500">Rows checked</p>
                    <p className="mt-1 text-xl font-bold text-black">
                      {report.recent_audit.rows_checked}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-gray-500">Blocked</p>
                    <p className="mt-1 text-xl font-bold text-black">
                      {report.recent_audit.blocked}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-gray-500">Warnings</p>
                    <p className="mt-1 text-xl font-bold text-black">
                      {report.recent_audit.warnings}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-gray-500">Conflicts</p>
                    <p className="mt-1 text-xl font-bold text-black">
                      {report.recent_audit.conflicts}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-black">QA flags</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <span className="text-gray-700">Missing nutrient rows</span>
                    <span className="font-semibold text-black">
                      {report.qa_flags.missing_nutrient_rows}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <span className="text-gray-700">Missing energy rows</span>
                    <span className="font-semibold text-black">
                      {report.qa_flags.missing_energy_rows}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <span className="text-gray-700">Estimated energy rows</span>
                    <span className="font-semibold text-black">
                      {report.qa_flags.estimated_energy_rows}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <span className="text-gray-700">
                      Non-recommendable rows
                    </span>
                    <span className="font-semibold text-black">
                      {report.qa_flags.non_recommendable_rows}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-black">
                    Brand QA summary
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Top brands by imported Food V2 row count.
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  Generated {report.generated_at}
                </p>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                      <th className="px-3 py-2">Brand</th>
                      <th className="px-3 py-2">Rows</th>
                      <th className="px-3 py-2">Recommendable</th>
                      <th className="px-3 py-2">Label kcal</th>
                      <th className="px-3 py-2">Estimated kcal</th>
                      <th className="px-3 py-2">Missing core</th>
                      <th className="px-3 py-2">Sources</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.brand_summaries.map((brand) => (
                      <tr key={brand.brand} className="border-b border-gray-100">
                        <td className="px-3 py-3 font-semibold text-black">
                          {brand.brand}
                        </td>
                        <td className="px-3 py-3 text-gray-700">
                          {brand.total_rows}
                        </td>
                        <td className="px-3 py-3 text-gray-700">
                          {brand.recommendable_rows}
                        </td>
                        <td className="px-3 py-3 text-gray-700">
                          {brand.label_kcal_rows}
                        </td>
                        <td className="px-3 py-3 text-gray-700">
                          {brand.estimated_kcal_rows}
                        </td>
                        <td className="px-3 py-3 text-gray-700">
                          {brand.missing_core_nutrient_rows}
                        </td>
                        <td className="px-3 py-3 text-gray-700">
                          {brand.official_rows} official / {brand.retailer_rows}{" "}
                          retailer
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
