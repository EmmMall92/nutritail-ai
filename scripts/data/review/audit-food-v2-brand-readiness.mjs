import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  input: "data/imports/food_v2_best_candidate_preview.csv",
  output: "data/review/food_v2_brand_readiness_audit.csv",
  report: "reports/food_v2_brand_readiness_audit.md",
};

const headers = [
  "brand",
  "total_rows",
  "recommendable_rows",
  "official_rows",
  "retailer_rows",
  "label_kcal_rows",
  "estimated_kcal_rows",
  "ash_rows",
  "calcium_phosphorus_rows",
  "epa_dha_rows",
  "avg_core_score",
  "readiness_status",
  "recommended_next_action",
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += char;
  }

  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);

  const csvHeaders = (rows[0] ?? []).map((header) =>
    header.replace(/^\uFEFF/u, "").trim()
  );
  return rows.slice(1).map((values) =>
    Object.fromEntries(csvHeaders.map((header, index) => [header, values[index] ?? ""]))
  );
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/u.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

function hasValue(value) {
  return String(value ?? "").trim().length > 0;
}

function hasAnyValue(row, fields) {
  return fields.some((field) => hasValue(row[field]));
}

function hasBothValues(row, fields) {
  return fields.every((field) => hasValue(row[field]));
}

function sourceNotes(row) {
  return String(row.source_notes ?? "").toLowerCase();
}

function coreScore(row) {
  let score = 0;
  if (hasValue(row.ingredient_text) || hasValue(row.ingredients)) score += 20;
  if (hasAnyValue(row, ["kcal_per_100g", "kcal_per_kg"])) score += 15;
  if (hasValue(row.protein_percent)) score += 15;
  if (hasValue(row.fat_percent)) score += 15;
  if (hasValue(row.fiber_percent)) score += 10;
  if (hasValue(row.ash_percent)) score += 10;
  if (hasBothValues(row, ["calcium_percent", "phosphorus_percent"])) score += 10;
  if (hasAnyValue(row, ["epa_dha_percent", "epa_percent", "dha_percent", "omega3_percent"])) {
    score += 5;
  }
  return score;
}

function readinessStatus(summary) {
  const officialRate =
    summary.total_rows > 0 ? summary.official_rows / summary.total_rows : 0;
  const labelKcalRate =
    summary.total_rows > 0 ? summary.label_kcal_rows / summary.total_rows : 0;

  if (summary.total_rows >= 5 && summary.avg_core_score >= 90 && labelKcalRate >= 0.5) {
    return "ready_for_controlled_import";
  }
  if (summary.total_rows >= 5 && summary.avg_core_score >= 70) {
    return "review_before_import";
  }
  if (summary.total_rows < 3 && summary.avg_core_score >= 80) {
    return "small_batch_review";
  }
  if (officialRate === 0 && summary.avg_core_score < 70) {
    return "needs_source_backfill";
  }
  return "needs_data_cleanup";
}

function nextAction(summary) {
  if (summary.readiness_status === "ready_for_controlled_import") {
    return "Filter this brand in admin preview, run Check Existing, then import selected rows.";
  }
  if (summary.readiness_status === "review_before_import") {
    return "Export selected review CSV, spot-check titles and kcal/ash provenance, then import a small batch.";
  }
  if (summary.readiness_status === "small_batch_review") {
    return "Review manually; batch is small enough to import only after source/title spot-check.";
  }
  if (summary.official_rows === 0) {
    return "Find official/PDF source or stronger retailer evidence before broad import.";
  }
  return "Clean missing nutrition fields and title/source notes before import.";
}

function summarizeBrand(brand, rows) {
  const scores = rows.map(coreScore);
  const avgCoreScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

  const summary = {
    brand,
    total_rows: rows.length,
    recommendable_rows: rows.filter((row) => row.is_recommendable === "true").length,
    official_rows: rows.filter((row) => row.source_priority === "official").length,
    retailer_rows: rows.filter((row) => row.source_priority === "retailer").length,
    label_kcal_rows: rows.filter(
      (row) =>
        hasAnyValue(row, ["kcal_per_100g", "kcal_per_kg"]) &&
        !sourceNotes(row).includes("kcal_estimated=true")
    ).length,
    estimated_kcal_rows: rows.filter((row) =>
      sourceNotes(row).includes("kcal_estimated=true")
    ).length,
    ash_rows: rows.filter((row) => hasValue(row.ash_percent)).length,
    calcium_phosphorus_rows: rows.filter((row) =>
      hasBothValues(row, ["calcium_percent", "phosphorus_percent"])
    ).length,
    epa_dha_rows: rows.filter((row) =>
      hasAnyValue(row, ["epa_dha_percent", "epa_percent", "dha_percent"])
    ).length,
    avg_core_score: avgCoreScore,
    readiness_status: "",
    recommended_next_action: "",
  };

  summary.readiness_status = readinessStatus(summary);
  summary.recommended_next_action = nextAction(summary);
  return summary;
}

function renderReport(rows) {
  const ready = rows.filter((row) => row.readiness_status === "ready_for_controlled_import");
  const review = rows.filter((row) => row.readiness_status === "review_before_import");
  const small = rows.filter((row) => row.readiness_status === "small_batch_review");
  const cleanup = rows.filter((row) =>
    ["needs_source_backfill", "needs_data_cleanup"].includes(row.readiness_status)
  );

  const renderList = (items) =>
    items
      .slice(0, 20)
      .map(
        (row) =>
          `- ${row.brand}: ${row.total_rows} rows, avg score ${row.avg_core_score}, recommendable ${row.recommendable_rows}`
      )
      .join("\n") || "- none";

  return `# Food V2 Brand Readiness Audit

Generated: ${new Date().toISOString()}

## Summary

- Brands reviewed: ${rows.length}
- Ready for controlled import: ${ready.length}
- Review before import: ${review.length}
- Small batch review: ${small.length}
- Needs cleanup/source backfill: ${cleanup.length}
- Input: ${paths.input}
- CSV: ${paths.output}

## Ready For Controlled Import

${renderList(ready)}

## Review Before Import

${renderList(review)}

## Small Batch Review

${renderList(small)}

## Needs Cleanup Or Source Backfill

${renderList(cleanup)}

## Operating Rule

Use this audit to choose brand-by-brand import batches. It does not write to Supabase and does not replace human review; it ranks brands by current preview completeness and provenance so the admin import can move in controlled batches.
`;
}

async function main() {
  const rows = parseCsv(await readFile(paths.input, "utf8"));
  const byBrand = new Map();

  for (const row of rows) {
    const brand = row.brand || "Unknown";
    byBrand.set(brand, [...(byBrand.get(brand) ?? []), row]);
  }

  const summaries = [...byBrand.entries()]
    .map(([brand, brandRows]) => summarizeBrand(brand, brandRows))
    .sort(
      (a, b) =>
        b.avg_core_score - a.avg_core_score ||
        b.total_rows - a.total_rows ||
        a.brand.localeCompare(b.brand)
    );

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(summaries), "utf8");
  await writeFile(paths.report, renderReport(summaries), "utf8");

  console.log(`Food V2 brand readiness rows: ${summaries.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
