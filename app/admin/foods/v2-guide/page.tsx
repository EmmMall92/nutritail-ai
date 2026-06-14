import Link from "next/link";

const requiredFields = [
  "brand",
  "formula_name",
  "species",
  "format",
  "ingredient_text or ingredients",
  "kcal_per_100g or kcal_per_kg",
  "protein_percent",
  "fat_percent",
  "fiber_percent",
  "data_source_url or manual_photo source",
];

const recommendedFields = [
  "ash_percent",
  "moisture_percent when declared",
  "calcium_percent",
  "phosphorus_percent",
  "sodium_percent",
  "magnesium_percent",
  "source_notes with market and basis",
];

const photoPanels = [
  "front of pack",
  "barcode / EAN",
  "ingredients or composition panel",
  "analytical constituents panel",
  "calories / metabolizable energy panel",
  "feeding guide if visible",
];

const statuses = [
  {
    label: "verified",
    text: "Use only when the source is official and the row has strong core nutrition data.",
  },
  {
    label: "needs_review",
    text: "Use for manual photos, retailer sources, OCR, or rows that still need human QA.",
  },
  {
    label: "unknown",
    text: "Use as a temporary placeholder. Unknown rows should not be committed for chatbot use.",
  },
];

const retrievalArtifacts = [
  "lib/food-v2/retrieval.ts",
  "/api/account/foods/v2-search",
];

const sampleArtifacts = [
  "data/samples/food-v2-sample-import.csv",
  "npm.cmd run review:food-v2-sample",
];

const brandCleanupSteps = [
  {
    title: "1. Pick one brand",
    text: "Work one brand at a time so title cleanup, nutrient gaps, duplicates, and visibility decisions stay consistent.",
    href: "/admin/foods/v2-post-import-qa",
    cta: "Brand QA summary",
  },
  {
    title: "2. Fix nutrient blockers",
    text: "Use the brand work plan to prioritize kcal, estimated values, minerals, and health-sensitive rows first.",
    href: "/admin/foods/v2-nutrient-gaps",
    cta: "Nutrient gaps",
  },
  {
    title: "3. Review names and source notes",
    text: "Clean titles, formula keys, source priority, review buckets, and rows that came from retailer or photo evidence.",
    href: "/admin/foods/v2-review",
    cta: "Review queue",
  },
  {
    title: "4. Check duplicates",
    text: "Look for same formula across PDFs, retailer pages, official pages, or different pack sizes before enabling broadly.",
    href: "/admin/duplicates",
    cta: "Duplicates",
  },
  {
    title: "5. Decide recommendation visibility",
    text: "Keep every formula recommendable by default unless a brand, formula, or review state should be hidden from users.",
    href: "/admin/foods/v2-recommendation-visibility",
    cta: "Visibility",
  },
  {
    title: "6. Test real scenarios",
    text: "Run weight, allergy, growth, urinary, renal, senior, premium, and value examples before calling the brand customer-ready.",
    href: "/admin/foods/v2-recommendation-lab",
    cta: "Recommendation lab",
  },
];

export default function FoodV2GuidePage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Food V2 workflow
        </p>
        <h2 className="mt-2 text-2xl font-bold text-black">
          Import QA Guide
        </h2>
        <p className="mt-2 max-w-3xl text-gray-600">
          Use this checklist when filling the Food V2 template from official
          brand pages, brochures, manufacturer files, or shop photos.
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
            href="/admin/foods/v2-live-qa"
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Live QA Checklist
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Brand-by-brand cleanup
            </p>
            <h3 className="mt-2 text-xl font-bold text-emerald-950">
              Repeat this loop for each important brand
            </h3>
            <p className="mt-2 max-w-3xl text-sm text-emerald-900">
              Use this sequence after a brand import or when a brand starts
              appearing in customer recommendations. It keeps product names,
              nutrient confidence, visibility, and duplicate handling aligned.
            </p>
          </div>
          <Link
            href="/admin/foods/v2-post-import-qa"
            className="rounded-xl bg-emerald-700 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Start brand QA
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {brandCleanupSteps.map((step) => (
            <div key={step.title} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="font-semibold text-black">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">{step.text}</p>
              <Link
                href={step.href}
                className="mt-4 inline-flex rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
              >
                {step.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-black">
            Required Before Commit
          </h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-700">
            {requiredFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-black">
            Strongly Recommended
          </h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-700">
            {recommendedFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-black">
          Photo Evidence Checklist
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          For shop photos, capture enough panels so a row can be reviewed later
          without guessing.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {photoPanels.map((panel) => (
            <div
              key={panel}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-black"
            >
              {panel}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-black">
          Sample Import Fixture
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Use the checked sample CSV to test the preview and commit flow before
          importing a real store batch.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {sampleArtifacts.map((artifact) => (
            <div
              key={artifact}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-black"
            >
              {artifact}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {statuses.map((status) => (
          <div
            key={status.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-black">{status.label}</p>
            <p className="mt-2 text-sm text-gray-600">{status.text}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-semibold">Commit rule</p>
        <p className="mt-2">
          Preview first, fix blocked rows, then commit only rows that are
          importable. Rows from manual photos should normally remain
          needs_review until the label is checked against the product name,
          market, and nutrition panel.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-black">Retrieval Layer</h3>
        <p className="mt-2 text-sm text-gray-600">
          Food V2 rows are prepared for chatbot/search retrieval through these
          server-side artifacts.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {retrievalArtifacts.map((artifact) => (
            <div
              key={artifact}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-black"
            >
              {artifact}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
