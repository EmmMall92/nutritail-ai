import Link from "next/link";
import { readFileSync } from "node:fs";
import path from "node:path";

type ReadinessSummary = {
  result: string;
  suitesPassing: string;
  totalChecks: string;
  failedOrReview: string;
  passRate: string;
  readinessScore: string;
  minimumReadinessScore: string;
  customerReadyCoreStatus: string;
  fullOpenAiProofStatus: string;
  coreEvidenceScore: string;
  advisoryEvidenceScore: string;
  generated: string;
  maxReportAge: string;
  deployFreshnessGate: string;
  oldestSourceReport: string;
  nextStaleReport: string;
};

type CustomerProductProgressSummary = {
  estimate: string;
  latestMovement: string;
  whyItFeelsStuck: string[];
  nextScoreMoves: string[];
};

function readLiveReadinessSummary(): ReadinessSummary {
  const fallback = {
    result: "Not generated",
    suitesPassing: "unknown",
    totalChecks: "unknown",
    failedOrReview: "unknown",
    passRate: "unknown",
    readinessScore: "unknown",
    minimumReadinessScore: "unknown",
    customerReadyCoreStatus: "unknown",
    fullOpenAiProofStatus: "unknown",
    coreEvidenceScore: "unknown",
    advisoryEvidenceScore: "unknown",
    generated: "unknown",
    maxReportAge: "unknown",
    deployFreshnessGate: "unknown",
    oldestSourceReport: "unknown",
    nextStaleReport: "unknown",
  };

  try {
    const report = readFileSync(
      path.join(process.cwd(), "reports/live_readiness_dashboard.md"),
      "utf8",
    );

    return {
      result: report.match(/^Result:\s*([^\n\r]+)/im)?.[1]?.trim() ?? fallback.result,
      suitesPassing:
        report.match(/- Suites passing:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.suitesPassing,
      totalChecks:
        report.match(/- Total checks\/cases\/routes:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.totalChecks,
      failedOrReview:
        report.match(/- Failed or needs review:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.failedOrReview,
      passRate: report.match(/- Pass rate:\s*([^\n\r]+)/i)?.[1]?.trim() ?? fallback.passRate,
      readinessScore:
        report.match(/- 95% readiness score:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.readinessScore,
      minimumReadinessScore:
        report.match(/- Minimum readiness score:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.minimumReadinessScore,
      customerReadyCoreStatus:
        report.match(/- Customer-ready core status:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.customerReadyCoreStatus,
      fullOpenAiProofStatus:
        report.match(/- Full OpenAI proof status:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.fullOpenAiProofStatus,
      coreEvidenceScore:
        report.match(/- Core evidence score:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.coreEvidenceScore,
      advisoryEvidenceScore:
        report.match(/- Advisory evidence score:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.advisoryEvidenceScore,
      generated:
        report.match(/^Generated:\s*([^\n\r]+)/im)?.[1]?.trim() ?? fallback.generated,
      maxReportAge:
        report.match(/- Max report age:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.maxReportAge,
      deployFreshnessGate:
        report.match(/- Deploy freshness gate:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.deployFreshnessGate,
      oldestSourceReport:
        report.match(/- Oldest source report:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.oldestSourceReport,
      nextStaleReport:
        report.match(/- Next stale report:\s*([^\n\r]+)/i)?.[1]?.trim() ??
        fallback.nextStaleReport,
    };
  } catch {
    return fallback;
  }
}

function readCustomerProductProgressSummary(): CustomerProductProgressSummary {
  const fallback = {
    estimate: "unknown",
    latestMovement: "No product progress rubric found.",
    whyItFeelsStuck: [
      "Customer progress moves only when a real customer-visible risk is reduced.",
    ],
    nextScoreMoves: [
      "Run live chatbot QA, fix real recommendation mistakes, and lock fixes with tests.",
    ],
  };

  try {
    const doc = readFileSync(
      path.join(process.cwd(), "docs/product-progress-score.md"),
      "utf8",
    );

    const estimate =
      doc.match(/Customer product progress is currently \*\*([^*]+)\*\*/i)?.[1]?.trim() ??
      fallback.estimate;
    const latestMovement =
      doc.match(/## Latest Movement\s+([\s\S]*?)\n## /i)?.[1]?.trim().split("\n")[0] ??
      fallback.latestMovement;
    const whySection =
      doc.match(/## Why It Feels Stuck\s+([\s\S]*?)\n## /i)?.[1]?.trim() ?? "";
    const nextSection =
      doc.match(/## Next Score Moves\s+([\s\S]*?)\n## /i)?.[1]?.trim() ?? "";

    const whyItFeelsStuck =
      whySection
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("- "))
        .map((line) => line.replace(/^- /, ""))
        .slice(0, 5) || fallback.whyItFeelsStuck;

    const nextScoreMoves =
      nextSection
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => /^\d+\./.test(line))
        .map((line) => line.replace(/^\d+\.\s*/, ""))
        .slice(0, 5) || fallback.nextScoreMoves;

    return {
      estimate,
      latestMovement,
      whyItFeelsStuck: whyItFeelsStuck.length > 0 ? whyItFeelsStuck : fallback.whyItFeelsStuck,
      nextScoreMoves: nextScoreMoves.length > 0 ? nextScoreMoves : fallback.nextScoreMoves,
    };
  } catch {
    return fallback;
  }
}

const liveChecks = [
  {
    title: "Deploy sanity",
    checks: [
      "Open https://nutritail.ai and confirm the homepage loads.",
      "Open /login and confirm auth pages render with the current design.",
      "Open /account/chatbot after login and confirm the guided intake starts.",
      "Open /account and confirm the customer dashboard renders after login.",
      "Confirm /sitemap.xml, /robots.txt, /manifest.webmanifest, and /opengraph-image respond.",
    ],
  },
  {
    title: "Admin access",
    checks: [
      "Open /admin and confirm the admin nav loads.",
      "Open /admin/foods/v2-preview and confirm the page does not redirect after login.",
      "Open /admin/foods/v2-review and confirm summary cards render.",
      "Open /admin/foods/v2-recommendation-lab and confirm the ranking form renders.",
    ],
  },
  {
    title: "Preview flow",
    checks: [
      "Click Download Template and confirm a CSV downloads.",
      "Upload the template or sample CSV.",
      "Confirm missing fields, warnings, importable rows, and blocked rows appear.",
      "Click Check Existing before committing any real rows.",
    ],
  },
  {
    title: "Commit flow",
    checks: [
      "Commit only rows marked importable.",
      "Confirm the result shows inserted, updated, blocked, failed, and audit counts.",
      "Open Food V2 Review after commit.",
      "Confirm the committed row appears in recent products.",
    ],
  },
  {
    title: "Export flow",
    checks: [
      "Click Export Products CSV from Food V2 Review.",
      "Click Export Audit CSV from Food V2 Review.",
      "Open both files and confirm headers are readable.",
      "Confirm blocked rows stay visible in audit exports.",
    ],
  },
  {
    title: "Recommendation smoke",
    checks: [
      "Run a 30kg adult dog scenario in Recommendation Lab.",
      "Confirm the top pick is not small/mini positioned.",
      "Run a chicken allergy scenario and confirm chicken/poultry is not recommended.",
      "Run urinary cat and growth puppy scenarios and review the QA verdict.",
    ],
  },
  {
    title: "Account progress smoke",
    checks: [
      "Open /account/chatbot after login and choose a saved pet.",
      "Click Progress check and send a metric-only update such as 7 κιλά.",
      "Open /account/pets/[id] and confirm Latest progress and Progress timeline render.",
      "Open /print/pet-timeline/[id] and confirm progress check-ins appear in the printable timeline.",
    ],
  },
  {
    title: "Mobile customer journey",
    checks: [
      "Test on a phone-sized viewport from /login through /account without horizontal scrolling.",
      "Open /account/chatbot and confirm saved-pet cards, starter cards, quick replies, and sticky input fit the screen.",
      "Run chatbot intake until recommendations appear and confirm long food names wrap without covering buttons.",
      "Save an analysis and confirm Open profile, Open report, and New analysis actions are easy to tap.",
      "Open /account/pets/[id] and confirm Latest result, progress, report, and timeline actions stack cleanly.",
      "Open printable report and timeline on mobile and confirm headings, cards, and tables remain readable.",
    ],
  },
];

const liveUrls = [
  "/account",
  "/account/chatbot",
  "/account/pets",
  "/login",
  "/register",
  "/print/pet-report/test-id",
  "/print/pet-timeline/test-id",
  "/admin/foods/v2-guide",
  "/admin/foods/v2-preview",
  "/admin/foods/v2-review",
  "/admin/foods/v2-nutrient-gaps",
  "/admin/foods/v2-recommendation-lab",
  "/admin/chat-feedback",
  "/api/admin/foods/v2-template",
  "/api/admin/foods/v2-export?type=products",
  "/api/admin/foods/v2-export?type=audit",
];

export default function FoodV2LiveQaPage() {
  const readiness = readLiveReadinessSummary();
  const productProgress = readCustomerProductProgressSummary();
  const isPassing = readiness.result === "PASS";

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Live deploy QA
        </p>
        <h2 className="mt-2 text-2xl font-bold text-black">
          Food V2 Live Checklist
        </h2>
        <p className="mt-2 max-w-3xl text-gray-600">
          Run this checklist after each merge/deploy that touches the Food V2
          importer, recommendation flow, or customer progress experience. It
          keeps the live check focused and repeatable.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/foods/v2-preview"
            className="rounded-lg bg-black px-4 py-2 text-sm text-white transition hover:opacity-90"
          >
            Open Preview
          </Link>
          <Link
            href="/admin/foods/v2-review"
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Open Review
          </Link>
          <Link
            href="/admin/foods/v2-recommendation-lab"
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Open Lab
          </Link>
          <Link
            href="/admin/foods/v2-guide"
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Open Guide
          </Link>
          <a
            href="https://github.com/EmmMall92/nutritail-ai/blob/master/reports/live_readiness_dashboard.md"
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
            target="_blank"
            rel="noreferrer"
          >
            Readiness Report
          </a>
        </div>
      </div>

      <div
        className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-950 shadow-sm"
        data-testid="customer-product-progress-summary"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide">
              Customer product progress
            </p>
            <h3 className="mt-1 text-2xl font-bold">
              {productProgress.estimate}
            </h3>
            <p className="mt-2 max-w-3xl text-sm">
              This is the customer-experience estimate, separate from automated
              live readiness. It moves only when a real pet owner flow becomes
              clearer, safer, or more accurate.
            </p>
          </div>
          <Link
            href="https://github.com/EmmMall92/nutritail-ai/blob/master/docs/product-progress-score.md"
            className="rounded-lg border border-blue-900 px-4 py-2 text-sm font-semibold text-blue-950 transition hover:bg-blue-100"
            target="_blank"
            rel="noreferrer"
          >
            Open rubric
          </Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-xl border border-blue-200 bg-white/70 p-4">
            <p className="text-sm font-semibold">Why it may not move every PR</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              {productProgress.whyItFeelsStuck.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-blue-200 bg-white/70 p-4">
            <p className="text-sm font-semibold">Next moves toward 94-95%</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              {productProgress.nextScoreMoves.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
        </div>

        <p className="mt-4 rounded-xl border border-blue-200 bg-white/70 p-4 text-sm">
          Latest movement: {productProgress.latestMovement}
        </p>
      </div>

      <div
        className={`rounded-2xl border p-5 shadow-sm ${
          isPassing
            ? "border-green-200 bg-green-50 text-green-950"
            : "border-amber-200 bg-amber-50 text-amber-950"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide">
              Automated live readiness
            </p>
            <h3 className="mt-1 text-2xl font-bold">
              {isPassing ? "Live readiness passed" : "Live readiness needs review"}
            </h3>
            <p className="mt-2 max-w-3xl text-sm">
              Generated from route checks, customer-flow checks, and chatbot QA.
              Re-run the QA commands after deploys that touch account, chatbot,
              Food V2, or printable reports.
            </p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/60 px-4 py-3 text-sm">
            <p className="font-semibold">Last generated</p>
            <p className="mt-1 break-all">{readiness.generated}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-xl border border-current/20 bg-white/60 p-4">
            <p className="text-sm font-medium">Result</p>
            <p className="mt-2 text-2xl font-bold">{readiness.result}</p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/60 p-4">
            <p className="text-sm font-medium">Readiness score</p>
            <p className="mt-2 text-2xl font-bold">{readiness.readinessScore}</p>
            <p className="mt-1 text-xs">Minimum: {readiness.minimumReadinessScore}</p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/60 p-4">
            <p className="text-sm font-medium">Suites passing</p>
            <p className="mt-2 text-2xl font-bold">{readiness.suitesPassing}</p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/60 p-4">
            <p className="text-sm font-medium">Checks/routes/cases</p>
            <p className="mt-2 text-2xl font-bold">{readiness.totalChecks}</p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/60 p-4">
            <p className="text-sm font-medium">Review items</p>
            <p className="mt-2 text-2xl font-bold">{readiness.failedOrReview}</p>
            <p className="mt-1 text-xs">Pass rate: {readiness.passRate}</p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/60 p-4">
            <p className="text-sm font-medium">Freshness gate</p>
            <p className="mt-2 break-words text-sm font-semibold">
              {readiness.deployFreshnessGate}
            </p>
            <p className="mt-1 text-xs">Max age: {readiness.maxReportAge}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-current/20 bg-white/50 p-4 text-sm">
            <p className="font-semibold">Core evidence</p>
            <p className="mt-1 break-words">{readiness.coreEvidenceScore}</p>
            <p className="mt-1 text-xs">Status: {readiness.customerReadyCoreStatus}</p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/50 p-4 text-sm">
            <p className="font-semibold">Advisory evidence</p>
            <p className="mt-1 break-words">{readiness.advisoryEvidenceScore}</p>
            <p className="mt-1 text-xs">OpenAI proof: {readiness.fullOpenAiProofStatus}</p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/50 p-4 text-sm">
            <p className="font-semibold">Oldest source report</p>
            <p className="mt-1 break-words">{readiness.oldestSourceReport}</p>
          </div>
          <div className="rounded-xl border border-current/20 bg-white/50 p-4 text-sm">
            <p className="font-semibold">Next stale report</p>
            <p className="mt-1 break-words">{readiness.nextStaleReport}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Order</p>
          <p className="mt-2 text-3xl font-bold text-black">
            {liveChecks.length}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Deploy, admin access, import flow, recommendations, account progress,
            and mobile customer journey.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Critical routes</p>
          <p className="mt-2 text-3xl font-bold text-black">{liveUrls.length}</p>
          <p className="mt-2 text-sm text-gray-600">
            Routes and API exports that should work after deploy.
          </p>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-green-700">Pass signal</p>
          <p className="mt-2 text-3xl font-bold text-green-900">0</p>
          <p className="mt-2 text-sm text-green-800">
            No redirects, no blocked imports committed, no obvious bad top pick.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-amber-700">Review signal</p>
          <p className="mt-2 text-3xl font-bold text-amber-900">1+</p>
          <p className="mt-2 text-sm text-amber-800">
            Any QA verdict warning should become a follow-up task.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {liveChecks.map((group) => (
          <div
            key={group.title}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-black">{group.title}</h3>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-700">
              {group.checks.map((check) => (
                <li key={check}>{check}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-black">URLs To Verify</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {liveUrls.map((url) => (
            <div
              key={url}
              className="break-all rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-black"
            >
              {url}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-semibold">Pass condition</p>
        <p className="mt-2">
          The flow passes when the live site loads, an admin can preview rows,
          check existing formula keys, commit only importable rows, see them in
          review, export products/audit CSVs, and run Recommendation Lab
          scenarios without obvious size, allergy, urinary, or growth mistakes.
          Customer account progress also passes when a saved pet can continue
          from history, record a progress check, and show that progress in the
          pet profile and printable timeline.
        </p>
      </div>
    </section>
  );
}
