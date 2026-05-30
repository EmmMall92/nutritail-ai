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
    </section>
  );
}
