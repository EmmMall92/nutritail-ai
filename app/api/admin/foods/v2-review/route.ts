import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

const PRODUCT_LIMIT = 100;
const AUDIT_LIMIT = 50;
const QUEUE_LIMIT = 500;

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
    header.replace(/^\uFEFF/, "").trim()
  );

  return rows.slice(1).map((values) =>
    Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    )
  );
}

async function readImportQueue() {
  try {
    const csv = await readFile(
      "data/review/food_v2_import_candidate_queue.csv",
      "utf8"
    );
    const rows = parseCsv(csv);

    const decisionCounts = rows.reduce<Record<string, number>>((acc, row) => {
      const decision = row.decision || "unknown";
      acc[decision] = (acc[decision] ?? 0) + 1;
      return acc;
    }, {});

    const brandCounts = rows.reduce<Record<string, number>>((acc, row) => {
      const brand = row.brand || "Unknown";
      acc[brand] = (acc[brand] ?? 0) + 1;
      return acc;
    }, {});

    const missingFieldCounts = rows.reduce<Record<string, number>>(
      (acc, row) => {
        String(row.missing_blockers ?? "")
          .split("|")
          .map((field) => field.trim())
          .filter(Boolean)
          .forEach((field) => {
            acc[field] = (acc[field] ?? 0) + 1;
          });
        return acc;
      },
      {}
    );

    return {
      summary: {
        totalRows: rows.length,
        decisionCounts,
        brandCounts,
        missingFieldCounts,
      },
      rows: rows.slice(0, QUEUE_LIMIT),
    };
  } catch {
    return {
      summary: {
        totalRows: 0,
        decisionCounts: {},
        brandCounts: {},
        missingFieldCounts: {},
      },
      rows: [],
    };
  }
}

export async function GET() {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const [
      totalProductsResult,
      verifiedProductsResult,
      needsReviewProductsResult,
      unknownProductsResult,
      totalAuditRowsResult,
      blockedAuditRowsResult,
      { data: products, error: productsError },
      { data: auditRows, error: auditError },
      importQueue,
    ] = await Promise.all([
      supabaseAdmin
        .from("food_products_v2")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("food_products_v2")
        .select("id", { count: "exact", head: true })
        .eq("data_quality_status", "verified"),
      supabaseAdmin
        .from("food_products_v2")
        .select("id", { count: "exact", head: true })
        .eq("data_quality_status", "needs_review"),
      supabaseAdmin
        .from("food_products_v2")
        .select("id", { count: "exact", head: true })
        .eq("data_quality_status", "unknown"),
      supabaseAdmin
        .from("food_import_audit_v2")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("food_import_audit_v2")
        .select("id", { count: "exact", head: true })
        .eq("importable", false),
      supabaseAdmin
        .from("food_products_v2")
        .select(
          "id, brand, display_name, species, format, life_stage, dog_size, data_quality_status, source_priority, formula_key, kcal_per_100g, created_at, updated_at"
        )
        .order("updated_at", { ascending: false })
        .limit(PRODUCT_LIMIT),
      supabaseAdmin
        .from("food_import_audit_v2")
        .select(
          "id, formula_key, importable, completeness_score, missing_fields, warnings, impossible_values, conflicts, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(AUDIT_LIMIT),
      readImportQueue(),
    ]);

    if (totalProductsResult.error) throw totalProductsResult.error;
    if (verifiedProductsResult.error) throw verifiedProductsResult.error;
    if (needsReviewProductsResult.error) throw needsReviewProductsResult.error;
    if (unknownProductsResult.error) throw unknownProductsResult.error;
    if (totalAuditRowsResult.error) throw totalAuditRowsResult.error;
    if (blockedAuditRowsResult.error) throw blockedAuditRowsResult.error;
    if (productsError) throw productsError;
    if (auditError) throw auditError;

    return NextResponse.json({
      summary: {
        totalProducts: totalProductsResult.count ?? 0,
        verifiedProducts: verifiedProductsResult.count ?? 0,
        needsReviewProducts: needsReviewProductsResult.count ?? 0,
        unknownProducts: unknownProductsResult.count ?? 0,
        totalAuditRows: totalAuditRowsResult.count ?? 0,
        blockedAuditRows: blockedAuditRowsResult.count ?? 0,
      },
      products: products ?? [],
      auditRows: auditRows ?? [],
      importQueue,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load Food V2 review data.",
      },
      { status: 500 }
    );
  }
}
