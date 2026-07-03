"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminActivityLog } from "@/types/admin-activity-log";

function getMetadataText(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
  fallback = "Not provided"
) {
  const value = metadata?.[key];
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Unknown date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleString();
}

function isBetaWaitlistLog(log: AdminActivityLog) {
  return log.action === "beta_waitlist_signup";
}

function isRuntimeMonitoringLog(log: AdminActivityLog) {
  return log.entityType === "runtime_monitoring";
}

function isClientRuntimeError(log: AdminActivityLog) {
  return log.action === "client_runtime_error";
}

function isWebVitalThreshold(log: AdminActivityLog) {
  return log.action === "web_vital_threshold";
}

function getMonitoringPath(log: AdminActivityLog) {
  return getMetadataText(log.metadata, "path", "unknown path");
}

function getMonitoringMetric(log: AdminActivityLog) {
  const metric = getMetadataText(log.metadata, "metricName", "");
  const rating = getMetadataText(log.metadata, "rating", "");
  const value = getMetadataText(log.metadata, "value", "");

  return [metric, rating, value].filter(Boolean).join(" / ") || "runtime error";
}

function getBetaSignupText(log: AdminActivityLog) {
  const metadata = log.metadata ?? {};

  return [
    getMetadataText(metadata, "role", ""),
    getMetadataText(metadata, "pets", ""),
    getMetadataText(metadata, "goal", ""),
  ]
    .join(" ")
    .toLowerCase();
}

function matchesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function hasDogSignal(log: AdminActivityLog) {
  return matchesAny(getBetaSignupText(log), [
    "dog",
    "dogs",
    "σκυ",
    "σκύ",
    "σκυλ",
    "σκύλ",
    "puppy",
    "κουταβ",
  ]);
}

function hasCatSignal(log: AdminActivityLog) {
  return matchesAny(getBetaSignupText(log), [
    "cat",
    "cats",
    "γατ",
    "γατ",
    "kitten",
    "γατακ",
    "γατάκ",
  ]);
}

function BetaSignupDetails({ log }: { log: AdminActivityLog }) {
  const metadata = log.metadata ?? {};

  return (
    <div
      className="mt-3 grid gap-3 rounded-lg border border-blue-100 bg-white p-3 text-sm text-gray-700 md:grid-cols-2"
      data-testid="admin-beta-waitlist-activity"
    >
      <div>
        <p className="text-xs font-semibold uppercase text-blue-700">Contact</p>
        <p className="mt-1 font-medium text-gray-950">
          {getMetadataText(metadata, "name")}
        </p>
        <p>{getMetadataText(metadata, "email")}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-blue-700">
          Beta plan
        </p>
        <p className="mt-1">
          {getMetadataText(metadata, "accessPlan", "unknown plan")}
        </p>
        <p>
          {getMetadataText(metadata, "petLimit", "?")} pets /{" "}
          {getMetadataText(metadata, "monthlyAnalysisLimit", "?")} analyses per
          month
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-blue-700">Role</p>
        <p className="mt-1">{getMetadataText(metadata, "role")}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-blue-700">Pets</p>
        <p className="mt-1">{getMetadataText(metadata, "pets")}</p>
      </div>
      <div className="md:col-span-2">
        <p className="text-xs font-semibold uppercase text-blue-700">Goal</p>
        <p className="mt-1">{getMetadataText(metadata, "goal")}</p>
      </div>
    </div>
  );
}

const betaRolloutReadinessItems = [
  {
    track: "Beta access",
    status: "Soft launch only",
    proof: "Waitlist signups are captured with plan metadata and current limits.",
    nextAction: "Invite a small batch only when dog, cat, and returning-pet proof slots are covered.",
  },
  {
    track: "Customer proof",
    status: "Needs real users",
    proof: "The next Customer UX move needs three complete beta journeys without manual help.",
    nextAction: "Run the beta session playbook and record evidence in the local beta-user proof file.",
  },
  {
    track: "Usage limits",
    status: "Soft warn only",
    proof: "Beta limits are visible to customers but do not block use yet.",
    nextAction: "Review over-limit usage before deciding paid-plan thresholds.",
  },
  {
    track: "Paid-plan decision",
    status: "Not active",
    proof: "Plans page explains Beta, Personal, and Pro direction without taking payment.",
    nextAction: "Do not add checkout until pricing, cancellation, legal copy, and support flow are ready.",
  },
] as const;

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const betaSignupLogs = logs.filter(isBetaWaitlistLog);
  const runtimeMonitoringLogs = logs.filter(isRuntimeMonitoringLog);
  const clientRuntimeErrors = runtimeMonitoringLogs.filter(isClientRuntimeError);
  const webVitalThresholds = runtimeMonitoringLogs.filter(isWebVitalThreshold);
  const monitoredPaths = [
    ...new Set(runtimeMonitoringLogs.map(getMonitoringPath).filter(Boolean)),
  ].slice(0, 5);
  const latestRuntimeMonitoring = runtimeMonitoringLogs[0];
  const latestBetaSignup = betaSignupLogs[0];
  const latestBetaMetadata = latestBetaSignup?.metadata ?? {};
  const betaDogProspects = betaSignupLogs.filter(hasDogSignal);
  const betaCatProspects = betaSignupLogs.filter(hasCatSignal);
  const betaReturningProspects = betaSignupLogs.filter((log) =>
    matchesAny(getBetaSignupText(log), [
      "progress",
      "timeline",
      "return",
      "again",
      "ξανα",
      "προοδο",
      "πρόοδο",
      "αλλαγη",
      "αλλαγή",
    ])
  );
  const betaProofSlots = [
    {
      label: "Dog owner journey",
      status: betaDogProspects.length > 0 ? "candidate found" : "needs signup",
      count: betaDogProspects.length,
      detail:
        "Needs one dog owner to finish signup/login, pet intake, food choice, grams/day, save, report, and feedback.",
    },
    {
      label: "Cat owner journey",
      status: betaCatProspects.length > 0 ? "candidate found" : "needs signup",
      count: betaCatProspects.length,
      detail:
        "Needs one cat owner to finish the same journey so cat UX is proven too.",
    },
    {
      label: "Returning saved-pet journey",
      status:
        betaReturningProspects.length > 0 ? "candidate found" : "schedule after first save",
      count: betaReturningProspects.length,
      detail:
        "Needs one saved-pet user to return for progress, timeline, new food, or flavour/brand change.",
    },
  ];

  useEffect(() => {
    async function loadLogs() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/admin/activity", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load activity logs.");
        }

        setLogs(result as AdminActivityLog[]);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Failed to load activity logs."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadLogs();
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black">Activity Log</h2>
        <p className="mt-2 text-gray-600">
          View recent admin actions across pets, foods, imports, and beta
          access requests.
        </p>
      </div>

      <div
        className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm"
        data-testid="admin-beta-waitlist-summary"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Beta waitlist
            </p>
            <h3 className="mt-1 text-xl font-bold text-gray-950">
              {betaSignupLogs.length} signup
              {betaSignupLogs.length === 1 ? "" : "s"} captured
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-blue-950">
              Use this as the quick launch-control view for beta interest,
              customer role, pet context, and the access limits attached to each
              signup.
            </p>
          </div>

          <div className="grid gap-2 text-sm text-blue-950 md:min-w-72">
            <div className="rounded-xl bg-white p-3">
              <span className="block text-xs font-semibold uppercase text-blue-700">
                Current plan
              </span>
              {getMetadataText(latestBetaMetadata, "accessPlan", "No signup yet")}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white p-3">
                <span className="block text-xs font-semibold uppercase text-blue-700">
                  Pets
                </span>
                {getMetadataText(latestBetaMetadata, "petLimit", "-")}
              </div>
              <div className="rounded-xl bg-white p-3">
                <span className="block text-xs font-semibold uppercase text-blue-700">
                  Analyses
                </span>
                {getMetadataText(latestBetaMetadata, "monthlyAnalysisLimit", "-")}
                /month
              </div>
            </div>
          </div>
        </div>

        {betaSignupLogs.length > 0 && (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {betaSignupLogs.slice(0, 3).map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-blue-100 bg-white p-4 text-sm"
                data-testid="admin-beta-waitlist-card"
              >
                <p className="font-semibold text-gray-950">
                  {getMetadataText(log.metadata, "name")}
                </p>
                <p className="mt-1 text-gray-600">
                  {getMetadataText(log.metadata, "email")}
                </p>
                <p className="mt-3 text-gray-700">
                  {getMetadataText(log.metadata, "role")} ·{" "}
                  {getMetadataText(log.metadata, "pets")}
                </p>
                <p className="mt-3 text-xs text-gray-500">
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm"
        data-testid="admin-beta-proof-recruiting-board"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
              Beta proof recruiting
            </p>
            <h3 className="mt-1 text-xl font-bold text-gray-950">
              3 real journeys needed for the 88-90% Customer UX move
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-amber-950">
              Use the waitlist to pick one dog owner, one cat owner, and one
              returning saved-pet user. Each must complete the full customer
              journey without manual help and leave feedback.
            </p>
          </div>

          <Link
            href="/admin/foods/v2-live-qa"
            className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-100"
          >
            Open proof gate
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {betaProofSlots.map((slot) => (
            <article
              key={slot.label}
              className="rounded-xl border border-amber-200 bg-white p-4 text-sm"
              data-testid="admin-beta-proof-slot"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-gray-950">{slot.label}</p>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                  {slot.count}
                </span>
              </div>
              <p className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900">
                {slot.status}
              </p>
              <p className="mt-3 text-gray-700">{slot.detail}</p>
            </article>
          ))}
        </div>

        <div
          className="mt-5 rounded-xl border border-amber-200 bg-white p-4 text-sm text-gray-700"
          data-testid="admin-beta-proof-evidence-checklist"
        >
          <p className="font-semibold text-gray-950">Evidence to collect</p>
          <p className="mt-2">
            signup/login, pet intake, food cards, selected food, grams/day,
            save, report, timeline or progress, feedback, no manual help.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Store final proof locally in .qa-secrets/beta-user-proof.json, then
            run npm.cmd run qa:beta-user-proof-contract.
          </p>
        </div>

        <div
          className="mt-4 rounded-xl border border-amber-200 bg-white p-4 text-sm text-gray-700"
          data-testid="admin-beta-session-playbook"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-semibold text-gray-950">
                Session playbook for real beta proof
              </p>
              <p className="mt-2">
                Run the test like a real customer session: the moderator can ask
                the tester to open NutriTail and think out loud, but must not
                explain which button to press, which food to choose, or what the
                recommendation means before the tester reacts.
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Outcome rule: pass, review, or fail. Review/fail sessions should
                become follow-up work in chatbot experience, report/account
                clarity, recommendation accuracy, feedback loop, launch QA, or
                business layer.
              </p>
            </div>
            <a
              href="https://github.com/EmmMall92/nutritail-ai/blob/master/docs/beta-user-session-playbook.md"
              className="inline-flex rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-100"
            >
              Open session playbook
            </a>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm"
        data-testid="admin-beta-rollout-readiness"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Beta rollout readiness
            </p>
            <h3 className="mt-1 text-xl font-bold">
              What must be true before opening access wider?
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              This keeps the business layer honest: beta access can grow only
              when customer proof, soft-limit usage, feedback quality, and paid
              plan readiness are clear enough.
            </p>
          </div>
          <Link
            href="/plans"
            className="rounded-lg border border-white/20 bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Review public plans
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {betaRolloutReadinessItems.map((item) => (
            <article
              key={item.track}
              className="rounded-xl border border-slate-700 bg-white/10 p-4 text-sm"
              data-testid="admin-beta-rollout-readiness-item"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-bold text-white">{item.track}</h4>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-950">
                  {item.status}
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Current proof
              </p>
              <p className="mt-1 leading-6 text-slate-200">{item.proof}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Next business action
              </p>
              <p className="mt-1 font-semibold leading-6 text-white">
                {item.nextAction}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm"
        data-testid="admin-runtime-monitoring-board"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
              Runtime monitoring
            </p>
            <h3 className="mt-1 text-xl font-bold text-gray-950">
              Are live customer sessions producing errors or slow pages?
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-red-950">
              Client runtime errors and poor Web Vitals are logged into admin
              activity. Use this board after deploys and beta sessions before
              trusting wider launch traffic.
            </p>
          </div>
          <Link
            href="/admin/foods/v2-live-qa"
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-950 transition hover:bg-red-100"
          >
            Open live QA
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-red-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Monitoring events
            </p>
            <p className="mt-2 text-3xl font-black text-gray-950">
              {runtimeMonitoringLogs.length}
            </p>
          </div>
          <div className="rounded-xl border border-red-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Runtime errors
            </p>
            <p className="mt-2 text-3xl font-black text-gray-950">
              {clientRuntimeErrors.length}
            </p>
          </div>
          <div className="rounded-xl border border-red-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Web Vital warnings
            </p>
            <p className="mt-2 text-3xl font-black text-gray-950">
              {webVitalThresholds.length}
            </p>
          </div>
          <div className="rounded-xl border border-red-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Latest signal
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-gray-950">
              {latestRuntimeMonitoring
                ? `${latestRuntimeMonitoring.action} on ${getMonitoringPath(latestRuntimeMonitoring)}`
                : "No runtime monitoring events yet"}
            </p>
            {latestRuntimeMonitoring && (
              <p className="mt-1 text-xs text-gray-600">
                {getMonitoringMetric(latestRuntimeMonitoring)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div
            className="rounded-xl border border-red-100 bg-white p-4 text-sm"
            data-testid="admin-runtime-monitoring-paths"
          >
            <p className="font-semibold text-gray-950">Affected paths</p>
            {monitoredPaths.length > 0 ? (
              <ul className="mt-3 space-y-2 text-gray-700">
                {monitoredPaths.map((path) => (
                  <li key={path} className="rounded-lg bg-red-50 px-3 py-2">
                    {path}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-gray-700">
                No runtime paths have been logged yet.
              </p>
            )}
          </div>
          <div className="rounded-xl border border-red-100 bg-white p-4 text-sm">
            <p className="font-semibold text-gray-950">Next launch action</p>
            <p className="mt-3 leading-6 text-gray-700">
              If runtime errors or poor Web Vitals appear after a deploy, test
              that exact path, fix the customer-facing failure, and rerun live
              readiness before inviting more beta users.
            </p>
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 font-mono text-xs text-red-950">
              npm.cmd run qa:live-readiness-deploy-freshness
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-600">Loading activity...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-600">
            No admin activity has been recorded yet.
          </p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-black">{log.message}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {log.action} / {log.entityType} / {log.entityId}
                    </p>

                    {isBetaWaitlistLog(log) ? (
                      <BetaSignupDetails log={log} />
                    ) : Object.keys(log.metadata ?? {}).length > 0 ? (
                      <pre className="mt-3 overflow-x-auto rounded-lg bg-white p-3 text-xs text-gray-700 border border-gray-200">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    ) : null}
                  </div>

                  <div className="text-sm text-gray-600">
                    {formatDateTime(log.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
