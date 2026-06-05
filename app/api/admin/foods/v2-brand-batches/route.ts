import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

type CsvRow = Record<string, string>;

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
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
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  ) as CsvRow[];
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET() {
  const forbidden = await requireAdminApiAccess();
  if (forbidden) return forbidden;

  const csvPath = path.join(
    process.cwd(),
    "data",
    "review",
    "food_v2_brand_import_batches.csv"
  );
  const csv = await readFile(csvPath, "utf8");
  const rows = parseCsv(csv);

  return NextResponse.json({
    totalBatches: rows.length,
    firstWaveCount: rows.filter(
      (row) => row.readiness_status === "ready_for_controlled_import"
    ).length,
    secondWaveCount: rows.filter(
      (row) => row.readiness_status === "review_before_import"
    ).length,
    batches: rows.map((row) => ({
      batch_number: numberValue(row.batch_number),
      brand: row.brand,
      rows_to_review: numberValue(row.rows_to_review),
      readiness_status: row.readiness_status,
      avg_core_score: numberValue(row.avg_core_score),
      label_kcal_rows: numberValue(row.label_kcal_rows),
      estimated_kcal_rows: numberValue(row.estimated_kcal_rows),
      admin_brand_filter: row.admin_brand_filter,
      admin_row_filter: row.admin_row_filter,
      admin_source_filter: row.admin_source_filter,
      admin_quality_filter: row.admin_quality_filter,
      recommended_action: row.recommended_action,
    })),
  });
}
