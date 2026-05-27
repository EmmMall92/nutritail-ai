import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  foods: "data/imports/nutritail_foods_euuk_v1.json",
  report: "reports/food_backfill_priority_queue.md",
  csv: "data/review/food_backfill_priority_queue.csv",
  json: "data/review/food_backfill_priority_queue.json",
  requests: "reports/food_backfill_evidence_requests.md",
};

const coreFields = [
  "kcal_per_100g",
  "protein_percent",
  "fat_percent",
  "fiber_percent",
  "calcium_percent",
  "phosphorus_percent",
];

const optionalMineralFields = ["sodium_percent", "magnesium_percent"];

function missingFields(row, fields) {
  return fields.filter((field) => row[field] === null || row[field] === undefined);
}

function priorityFor(row, missingCore, missingOptionalMinerals) {
  if (missingCore.length > 0) return "high";
  if (row.data_quality_status === "needs_review") return "high";
  if (missingOptionalMinerals.length > 0) return "medium";
  if (row.data_quality_status === "partial") return "medium";
  return "low";
}

function rowLabel(row) {
  return `${row.brand ?? "Unknown brand"} - ${row.name ?? "Unnamed formula"}`;
}

function marketFromNotes(notes) {
  const match = String(notes ?? "").match(/(?:^|;\s*)market=([^;]+)/i);
  return match?.[1]?.trim() || "source market";
}

function buildRequestText(item) {
  const market = marketFromNotes(item.notes);
  const missing = item.missing.join(", ");
  const label = `${item.brand} ${item.name}`.trim();

  return [
    `Please provide official labelled/as-fed analytical values for ${label} (${item.species}, ${market}).`,
    `Missing fields: ${missing}.`,
    "Accepted evidence: current manufacturer PDF, official technical sheet, manufacturer support response, or clear label photos for the exact formula and market.",
    `Current source: ${item.source || "not recorded"}.`,
  ].join(" ");
}

function buildQueue(rows) {
  return rows
    .map((row) => {
      const missingCore = missingFields(row, coreFields);
      const missingOptionalMinerals = missingFields(row, optionalMineralFields);
      const priority = priorityFor(row, missingCore, missingOptionalMinerals);
      const missing = [...missingCore, ...missingOptionalMinerals];
      const evidenceNeeded =
        missingCore.length > 0
          ? "official_pdf_or_label_photo"
          : "official_pdf_manufacturer_response_or_label_photo";

      const item = {
        label: rowLabel(row),
        brand: row.brand ?? "",
        name: row.name ?? "",
        species: row.species ?? "",
        status: row.data_quality_status ?? "unknown",
        priority,
        missingCore,
        missingOptionalMinerals,
        missing,
        evidenceNeeded,
        source: row.data_source_url ?? "",
        notes: row.data_notes ?? "",
      };

      return {
        ...item,
        requestText: buildRequestText(item),
      };
    })
    .filter(
      (item) =>
        item.priority !== "low" ||
        item.missingCore.length > 0 ||
        item.missingOptionalMinerals.length > 0
    )
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[a.priority] - rank[b.priority] || a.label.localeCompare(b.label);
    });
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join("|") : String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function renderCsv(queue) {
  const headers = [
    "priority",
    "brand",
    "name",
    "species",
    "status",
    "missing_fields",
    "evidence_needed",
    "request_text",
    "source_url",
    "notes",
  ];

  return [
    headers.join(","),
    ...queue.map((item) =>
      [
        item.priority,
        item.brand,
        item.name,
        item.species,
        item.status,
        item.missing,
        item.evidenceNeeded,
        item.requestText,
        item.source,
        item.notes,
      ]
        .map(csvEscape)
        .join(",")
    ),
  ].join("\n");
}

function renderReport(rows) {
  const now = new Date().toISOString();
  const queue = buildQueue(rows);

  const counts = queue.reduce(
    (acc, item) => {
      acc[item.priority] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );

  const highItems = queue.filter((item) => item.priority === "high").slice(0, 20);
  const mediumItems = queue
    .filter((item) => item.priority === "medium")
    .slice(0, 20);

  return `# Food Backfill Priority Queue

Generated: ${now}

## Summary

- Total formulas reviewed: ${rows.length}
- Backfill queue rows: ${queue.length}
- High priority: ${counts.high}
- Medium priority: ${counts.medium}
- Low priority: ${counts.low}
- CSV queue: ${paths.csv}
- JSON queue: ${paths.json}
- Evidence request templates: ${paths.requests}

## High Priority

${highItems
  .map(
    (item) =>
      `- ${item.label}: status=${item.status}; missing_core=${
        item.missingCore.join(", ") || "none"
      }; missing_optional_minerals=${
        item.missingOptionalMinerals.join(", ") || "none"
      }; evidence=${item.evidenceNeeded}; source=${item.source || "missing"}`
  )
  .join("\n") || "- none"}

## Medium Priority

${mediumItems
  .map(
    (item) =>
      `- ${item.label}: status=${item.status}; missing_optional_minerals=${
        item.missingOptionalMinerals.join(", ") || "none"
      }; evidence=${item.evidenceNeeded}; source=${item.source || "missing"}`
  )
  .join("\n") || "- none"}

## Recommended Backfill Workflow

1. Resolve high-priority rows first: missing kcal, calcium, or phosphorus blocks confident recommendations.
2. Use official manufacturer pages or PDFs before retailer sources.
3. Use label photos only for rows that official sources cannot complete.
4. Keep rows as partial or needs_review until source evidence is strong enough.
5. Re-run npm run review:backfill after every batch.
`;
}

function renderEvidenceRequests(queue) {
  const now = new Date().toISOString();
  const byBrand = queue.reduce((acc, item) => {
    acc[item.brand] ??= [];
    acc[item.brand].push(item);
    return acc;
  }, {});

  const sections = Object.entries(byBrand)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([brand, items]) => {
      const rows = items
        .map(
          (item) =>
            `- ${item.name} (${item.species}): missing ${item.missing.join(
              ", "
            )}; market=${marketFromNotes(item.notes)}; source=${
              item.source || "n/a"
            }`
        )
        .join("\n");

      return `## ${brand}

Request:

Hello ${brand} team,

We are verifying nutrition data for NutriTail AI. Could you please provide official as-fed analytical values or a technical sheet for the formulas below, specifically for the missing fields listed? We are looking for kcal/100g or kcal/kg, calcium, phosphorus, sodium, and magnesium where available, plus confirmation of market/pack variant.

Rows:

${rows}
`;
    })
    .join("\n");

  return `# Food Backfill Evidence Requests

Generated: ${now}

Use these request blocks for manufacturer support emails, official distributor contacts, or label-photo collection planning. Do not update production rows until the evidence source is saved in notes and the row is re-reviewed.

${sections}
`;
}

async function main() {
  const raw = await readFile(paths.foods, "utf8");
  const rows = JSON.parse(raw);

  if (!Array.isArray(rows)) {
    throw new Error("Food import JSON must be an array.");
  }

  const report = renderReport(rows);
  const queue = buildQueue(rows);
  const csv = renderCsv(queue);
  await mkdir(path.dirname(paths.report), { recursive: true });
  await mkdir(path.dirname(paths.csv), { recursive: true });
  await writeFile(paths.report, report);
  await writeFile(paths.csv, `${csv}\n`);
  await writeFile(paths.json, `${JSON.stringify(queue, null, 2)}\n`);
  await writeFile(paths.requests, renderEvidenceRequests(queue));

  console.log(`Reviewed ${rows.length} food rows for backfill priorities.`);
  console.log(`Report written to ${paths.report}`);
  console.log(`CSV written to ${paths.csv}`);
  console.log(`JSON written to ${paths.json}`);
  console.log(`Evidence requests written to ${paths.requests}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
