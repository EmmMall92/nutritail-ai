import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  input: "data/review/food_v2_brand_readiness_audit.csv",
  output: "data/review/food_v2_brand_import_batches.csv",
  report: "reports/food_v2_brand_import_batches.md",
};

const headers = [
  "batch_number",
  "brand",
  "rows_to_review",
  "readiness_status",
  "avg_core_score",
  "label_kcal_rows",
  "estimated_kcal_rows",
  "admin_brand_filter",
  "admin_row_filter",
  "admin_source_filter",
  "admin_quality_filter",
  "recommended_action",
];

const statusRank = {
  ready_for_controlled_import: 1,
  review_before_import: 2,
  small_batch_review: 3,
  needs_data_cleanup: 4,
  needs_source_backfill: 5,
};

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

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function actionFor(row) {
  if (row.readiness_status === "ready_for_controlled_import") {
    return "Load Best Candidates, filter this brand, run Check Existing, export selected review CSV, then commit selected rows if duplicates look safe.";
  }
  if (row.readiness_status === "review_before_import") {
    return "Filter this brand, export selected review CSV, spot-check title/kcal/source notes, then import only confirmed rows.";
  }
  if (row.readiness_status === "small_batch_review") {
    return "Review manually as a small batch; import only if title and source evidence are clear.";
  }
  return "Do not import yet; use source backfill or title cleanup before this brand enters the import batch.";
}

function sourceFilterFor(row) {
  const official = numberValue(row.official_rows);
  const retailer = numberValue(row.retailer_rows);
  if (official > 0 && retailer === 0) return "official";
  if (retailer > 0 && official === 0) return "retailer";
  return "";
}

function qualityFilterFor(row) {
  if (
    ["ready_for_controlled_import", "review_before_import", "small_batch_review"].includes(
      row.readiness_status
    )
  ) {
    return "needs_review";
  }
  return "";
}

function buildBatchRows(readinessRows) {
  const eligibleRows = readinessRows
    .filter((row) => row.readiness_status !== "needs_source_backfill")
    .sort((a, b) => {
      const rankDelta =
        (statusRank[a.readiness_status] ?? 99) -
        (statusRank[b.readiness_status] ?? 99);
      if (rankDelta !== 0) return rankDelta;
      return (
        numberValue(b.avg_core_score) - numberValue(a.avg_core_score) ||
        numberValue(b.total_rows) - numberValue(a.total_rows) ||
        a.brand.localeCompare(b.brand)
      );
    });

  return eligibleRows.map((row, index) => ({
    batch_number: index + 1,
    brand: row.brand,
    rows_to_review: row.total_rows,
    readiness_status: row.readiness_status,
    avg_core_score: row.avg_core_score,
    label_kcal_rows: row.label_kcal_rows,
    estimated_kcal_rows: row.estimated_kcal_rows,
    admin_brand_filter: row.brand,
    admin_row_filter: "importable",
    admin_source_filter: sourceFilterFor(row),
    admin_quality_filter: qualityFilterFor(row),
    recommended_action: actionFor(row),
  }));
}

function renderReport(rows) {
  const firstWave = rows.slice(0, 20);
  const secondWave = rows.slice(20, 40);
  const renderWave = (items) =>
    items
      .map(
        (row) =>
          `- #${row.batch_number} ${row.brand}: ${row.rows_to_review} rows, ${row.readiness_status}, score ${row.avg_core_score}`
      )
      .join("\n") || "- none";

  return `# Food V2 Brand Import Batch Plan

Generated: ${new Date().toISOString()}

## Summary

- Planned brand batches: ${rows.length}
- First-wave controlled import candidates: ${firstWave.length}
- Second-wave review candidates: ${secondWave.length}
- Input: ${paths.input}
- CSV: ${paths.output}

## First Wave

${renderWave(firstWave)}

## Second Wave

${renderWave(secondWave)}

## Admin Flow

1. Open /admin/foods/v2-preview.
2. Load Best Candidates.
3. Use the brand/source/quality filters from the CSV.
4. Run Check Existing.
5. Export selected review CSV.
6. Commit selected rows only after duplicate groups look safe.
`;
}

async function main() {
  const readinessRows = parseCsv(await readFile(paths.input, "utf8"));
  const rows = buildBatchRows(readinessRows);

  await mkdir(path.dirname(paths.output), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.output, writeCsv(rows), "utf8");
  await writeFile(paths.report, renderReport(rows), "utf8");

  console.log(`Food V2 brand import batches: ${rows.length}`);
  console.log(`Wrote ${paths.output}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
