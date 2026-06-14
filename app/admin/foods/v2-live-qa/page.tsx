import Link from "next/link";

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
