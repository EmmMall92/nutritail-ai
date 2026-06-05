import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  batches: "data/review/food_v2_brand_import_batches.csv",
  candidates: "data/imports/food_v2_best_candidate_preview.csv",
  round1Rows: "data/imports/food_v2_controlled_import_round1_preview.csv",
  round1Brands: "data/review/food_v2_controlled_import_round1_brands.csv",
  report: "reports/food_v2_controlled_import_round1.md",
};

const brandHeaders = [
  "round_order",
  "brand",
  "rows_to_review",
  "avg_core_score",
  "label_kcal_rows",
  "estimated_kcal_rows",
  "admin_brand_filter",
  "admin_row_filter",
  "admin_source_filter",
  "admin_quality_filter",
  "recommended_action",
];

const maxRoundRows = 30;
const minBrandRows = 5;
const maxBrandRows = 15;

function parseCsvWithHeaders(text) {
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

  const headers = (rows[0] ?? []).map((header) =>
    header.replace(/^\uFEFF/u, "").trim()
  );
  return {
    headers,
    rows: rows.slice(1).map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
    ),
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/u.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(headers, rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isRound1Eligible(row) {
  const rowsToReview = numberValue(row.rows_to_review);
  return (
    row.readiness_status === "ready_for_controlled_import" &&
    rowsToReview >= minBrandRows &&
    rowsToReview <= maxBrandRows &&
    numberValue(row.avg_core_score) >= 95 &&
    numberValue(row.label_kcal_rows) === rowsToReview &&
    numberValue(row.estimated_kcal_rows) === 0
  );
}

function chooseRound1Brands(batchRows) {
  const selected = [];
  let totalRows = 0;

  const eligible = batchRows.filter(isRound1Eligible).sort((a, b) => {
    return (
      numberValue(b.avg_core_score) - numberValue(a.avg_core_score) ||
      numberValue(b.rows_to_review) - numberValue(a.rows_to_review) ||
      a.brand.localeCompare(b.brand)
    );
  });

  for (const brand of eligible) {
    const rowsToReview = numberValue(brand.rows_to_review);
    if (totalRows + rowsToReview > maxRoundRows) continue;
    selected.push(brand);
    totalRows += rowsToReview;
    if (totalRows >= maxRoundRows) break;
  }

  return selected.map((row, index) => ({
    round_order: index + 1,
    brand: row.brand,
    rows_to_review: row.rows_to_review,
    avg_core_score: row.avg_core_score,
    label_kcal_rows: row.label_kcal_rows,
    estimated_kcal_rows: row.estimated_kcal_rows,
    admin_brand_filter: row.admin_brand_filter,
    admin_row_filter: row.admin_row_filter,
    admin_source_filter: row.admin_source_filter,
    admin_quality_filter: row.admin_quality_filter,
    recommended_action:
      "Load Best Candidates, apply this brand filter, run Check Existing, export selected review CSV, then Commit Selected if duplicates look safe.",
  }));
}

function renderReport({ brandRows, selectedCandidateRows }) {
  const totalRows = selectedCandidateRows.length;
  const brandList = brandRows
    .map(
      (row) =>
        `- #${row.round_order} ${row.brand}: ${row.rows_to_review} rows, score ${row.avg_core_score}, source filter ${row.admin_source_filter || "any"}`
    )
    .join("\n");

  return `# Food V2 Controlled Import Round 1

Generated: ${new Date().toISOString()}

## Summary

- Round 1 brands: ${brandRows.length}
- Round 1 preview rows: ${totalRows}
- Max target rows: ${maxRoundRows}
- Source batch plan: ${paths.batches}
- Review CSV: ${paths.round1Brands}
- Import preview CSV: ${paths.round1Rows}

## Selected Brands

${brandList || "- none"}

## Admin Workflow

1. Open /admin/foods/v2-preview.
2. Load Best Candidates.
3. For each selected brand, apply the brand/source/quality filters listed in ${paths.round1Brands}.
4. Run Check Existing.
5. Export selected review CSV.
6. Commit Selected only if duplicate groups and titles look safe.

## Safety Rule

This plan does not write to Supabase. Keep Round 1 as a controlled pilot before large brands such as Brit or Josera, even when those brands have strong scores.
`;
}

async function main() {
  const batchFile = parseCsvWithHeaders(await readFile(paths.batches, "utf8"));
  const candidateFile = parseCsvWithHeaders(await readFile(paths.candidates, "utf8"));
  const brandRows = chooseRound1Brands(batchFile.rows);
  const selectedBrands = new Set(brandRows.map((row) => row.brand));
  const selectedCandidateRows = candidateFile.rows.filter((row) =>
    selectedBrands.has(row.brand)
  );

  await mkdir(path.dirname(paths.round1Rows), { recursive: true });
  await mkdir(path.dirname(paths.round1Brands), { recursive: true });
  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(
    paths.round1Rows,
    writeCsv(candidateFile.headers, selectedCandidateRows),
    "utf8"
  );
  await writeFile(paths.round1Brands, writeCsv(brandHeaders, brandRows), "utf8");
  await writeFile(
    paths.report,
    renderReport({ brandRows, selectedCandidateRows }),
    "utf8"
  );

  console.log(`Food V2 controlled import round 1 brands: ${brandRows.length}`);
  console.log(`Food V2 controlled import round 1 rows: ${selectedCandidateRows.length}`);
  console.log(`Wrote ${paths.round1Rows}`);
  console.log(`Wrote ${paths.round1Brands}`);
  console.log(`Wrote ${paths.report}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
