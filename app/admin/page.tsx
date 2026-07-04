"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AdminStats = {
  totalFoods: number;
  dogFoods: number;
  catFoods: number;
  uniqueBrands: number;

  needsReviewFoods: number;
  partialFoods: number;
  verifiedFoods: number;
  unknownFoods: number;
  foodV2Total: number;
  foodV2DogFoods: number;
  foodV2CatFoods: number;
  foodV2Verified: number;
  foodV2NeedsReview: number;
  foodV2Unknown: number;
  foodV2Recommendable: number;
  foodV2Official: number;
  foodV2Retailer: number;
  foodV2AuditRows: number;
  foodV2BlockedAuditRows: number;
};

function StatCard({
  title,
  value,
  description,
  tone = "default",
}: {
  title: string;
  value: number;
  description: string;
  tone?: "default" | "good" | "warning" | "dark";
}) {
  const toneClass =
    tone === "good"
      ? "border-green-200 bg-green-50"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50"
        : tone === "dark"
          ? "border-black bg-black text-white"
          : "border-gray-200 bg-white";
  const titleClass = tone === "dark" ? "text-gray-300" : "text-gray-500";
  const valueClass = tone === "dark" ? "text-white" : "text-black";
  const descriptionClass = tone === "dark" ? "text-gray-300" : "text-gray-600";

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${toneClass}`}>
      <p className={`text-sm font-medium ${titleClass}`}>{title}</p>

      <p className={`mt-3 text-3xl font-bold ${valueClass}`}>{value}</p>

      <p className={`mt-2 text-sm ${descriptionClass}`}>{description}</p>
    </div>
  );
}

function ActionCard({
  href,
  title,
  description,
  label,
}: {
  href: string;
  title: string;
  description: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-green-700">
        {label}
      </p>
      <h3 className="mt-3 text-lg font-semibold text-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
    </Link>
  );
}

function InlineMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-black">{value}</p>
      <p className="mt-1 text-sm text-gray-600">{helper}</p>
    </div>
  );
}

const launchProgressSnapshot = [
  {
    label: "Customer UX readiness",
    value: "88%",
    helper:
      "Chatbot intake, 3 + 3 food cards, grams/day, save, report, timeline, and returning-pet flows are QA-proven.",
  },
  {
    label: "Recommendation engine",
    value: "95%",
    helper:
      "Food V2 retrieval, deterministic ranking, OpenAI extraction, and dog/cat QA banks are beta-candidate strong.",
  },
  {
    label: "Overall SaaS launch",
    value: "90%",
    helper:
      "The product is in launch hardening. The next move needs real beta-user proof, monitoring, legal, and business gates.",
  },
] as const;

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/admin/stats", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load stats.");
      }

      setStats(result as AdminStats);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Failed to load dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-green-700">
              Operations
            </p>
            <h1 className="mt-2 text-3xl font-bold text-black">
              Nutritail AI Admin
            </h1>

            <p className="mt-2 max-w-3xl text-gray-600">
              Monitor catalog quality, imports, recommendations, customers, pets,
              and the review queues that affect the live customer experience.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/admin/foods/v2-preview"
              className="rounded-xl bg-black px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Preview import
            </Link>
            <Link
              href="/admin/foods/v2-review"
              className="rounded-xl border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-black transition hover:bg-gray-100"
            >
              Review Food V2
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-black">Loading dashboard...</p>
          <p className="mt-2 text-sm text-gray-600">
            We are collecting admin database stats.
          </p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Food V2 Products"
              value={stats?.foodV2Total ?? 0}
              description={`${stats?.foodV2DogFoods ?? 0} dog, ${
                stats?.foodV2CatFoods ?? 0
              } cat`}
              tone="dark"
            />
            <StatCard
              title="Recommendable"
              value={stats?.foodV2Recommendable ?? 0}
              description={`${percent(
                stats?.foodV2Recommendable ?? 0,
                stats?.foodV2Total ?? 0
              )}% of Food V2 catalog can appear in recommendations`}
              tone="good"
            />
            <StatCard
              title="Needs Review"
              value={stats?.foodV2NeedsReview ?? 0}
              description="Rows usable with cautious wording or review required"
              tone="warning"
            />
            <StatCard
              title="Blocked Audits"
              value={stats?.foodV2BlockedAuditRows ?? 0}
              description={`${stats?.foodV2AuditRows ?? 0} total import audit rows`}
              tone="warning"
            />
          </section>

          <section
            data-testid="admin-launch-progress-snapshot"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  Launch progress
                </p>
                <h2 className="mt-2 text-2xl font-bold text-black">
                  NutriTail is not in the 78-80% foundation stage anymore
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-950">
                  The honest current view is 88% customer UX readiness, 95%
                  recommendation-engine beta confidence, and 90% overall SaaS
                  launch progress. These numbers move only when customer-visible
                  risk is reduced with evidence, not just because a PR merged.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/admin/foods/v2-live-qa"
                  className="rounded-xl bg-emerald-700 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  View live QA
                </Link>
                <Link
                  href="/admin/activity"
                  className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-center text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100"
                >
                  Beta proof queue
                </Link>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
              {launchProgressSnapshot.map((item) => (
                <div
                  key={item.label}
                  data-testid="admin-launch-progress-snapshot-item"
                  className="rounded-xl border border-white/80 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm font-medium text-gray-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold text-black">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {item.helper}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm leading-6 text-emerald-950">
              <span className="font-semibold">Next honest unlock:</span> three
              real beta journeys without manual help: one dog owner, one cat
              owner, and one returning saved-pet user.
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-black">
                    Food V2 catalog health
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    This is the catalog that powers the recommendation work.
                  </p>
                </div>
                <Link
                  href="/admin/foods/v2-nutrient-gaps"
                  className="rounded-xl border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-black transition hover:bg-gray-100"
                >
                  View gaps
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 border-t border-gray-100 pt-5 sm:grid-cols-3">
                <InlineMetric
                  label="Verified"
                  value={stats?.foodV2Verified ?? 0}
                  helper="Highest confidence product rows"
                />
                <InlineMetric
                  label="Official Sources"
                  value={stats?.foodV2Official ?? 0}
                  helper="Manufacturer or official evidence"
                />
                <InlineMetric
                  label="Retailer Sources"
                  value={stats?.foodV2Retailer ?? 0}
                  helper="Useful rows that need cautious wording"
                />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-black">Next best actions</h2>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <p>
                  1. Review blocked imports before committing more large batches.
                </p>
                <p>
                  2. Check recommendation lab for size, allergy, and therapeutic
                  mismatches.
                </p>
                <p>
                  3. Merge obvious duplicates before customer-facing testing.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-black">
              Legacy catalog snapshot
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Foods"
                value={stats?.totalFoods ?? 0}
                description="All active foods in database"
              />

              <StatCard
                title="Dog Foods"
                value={stats?.dogFoods ?? 0}
                description="Foods for dogs"
              />

              <StatCard
                title="Cat Foods"
                value={stats?.catFoods ?? 0}
                description="Foods for cats"
              />

              <StatCard
                title="Brands"
                value={stats?.uniqueBrands ?? 0}
                description="Unique food brands"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-black">
                Nutrition Data Quality
              </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Needs Review"
                  value={stats?.needsReviewFoods ?? 0}
                  description="Foods that need nutrition review"
                />

                <StatCard
                  title="Partial Data"
                  value={stats?.partialFoods ?? 0}
                  description="Foods with incomplete nutrition data"
                />

                <StatCard
                  title="Verified Foods"
                  value={stats?.verifiedFoods ?? 0}
                  description="Foods with checked nutrition data"
                />

                <StatCard
                  title="Unknown Data"
                  value={stats?.unknownFoods ?? 0}
                  description="Foods where data could not be found"
                />
              </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-black">
              Admin workflows
            </h2>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <ActionCard
                href="/admin/foods"
                label="Catalog"
                title="Foods Database"
                description="Manage legacy foods, nutrition fields, enrichment data, and quality status."
              />
              <ActionCard
                href="/admin/foods/v2-preview"
                label="Import"
                title="Food V2 Preview"
                description="Preview normalized Food V2 imports, validation issues, and completeness before writing to the database."
              />
              <ActionCard
                href="/admin/foods/v2-review"
                label="Review"
                title="Food V2 Review"
                description="Inspect imported products, blocked rows, review buckets, and export queues."
              />
              <ActionCard
                href="/admin/duplicates"
                label="Cleanup"
                title="Duplicates"
                description="Find possible duplicates across sources, PDFs, pack sizes, and retailer pages."
              />
              <ActionCard
                href="/admin/foods/v2-recommendation-lab"
                label="QA"
                title="Recommendation Lab"
                description="Check how Food V2 behaves for real pet profiles before exposing recommendations to customers."
              />
              <ActionCard
                href="/admin/chat-feedback"
                label="Feedback"
                title="Chatbot Feedback"
                description="Review failed matches and helpfulness signals from customer chatbot sessions."
              />
              <ActionCard
                href="/admin/customers"
                label="CRM"
                title="Customers"
                description="Review customer accounts, contact details, and saved profile records."
              />
              <ActionCard
                href="/admin/pets"
                label="Customer data"
                title="Pets & Analyses"
                description="View saved pets, nutrition analyses, and account-linked pet data."
              />
              <ActionCard
                href="/admin/food-backfill"
                label="Evidence"
                title="Food Backfill Queue"
                description="Prioritize missing nutrition values using official sources, manufacturer evidence, or label photos."
              />
            </div>
          </section>
        </>
      )}
    </main>
  );
}
