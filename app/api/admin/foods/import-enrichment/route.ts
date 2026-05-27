import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

type EnrichmentRow = {
  id: string;
  kcal_per_100g?: string | number | null;
  protein_percent?: string | number | null;
  fat_percent?: string | number | null;
  fiber_percent?: string | number | null;
  sodium_percent?: string | number | null;
  magnesium_percent?: string | number | null;
  calcium_percent?: string | number | null;
  phosphorus_percent?: string | number | null;
  data_quality_status?: string | null;
  data_source_url?: string | null;
  data_notes?: string | null;
};

function toNumberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(String(value).replace(",", "."));

  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeStatus(value: unknown) {
  const status = String(value ?? "needs_review").trim().toLowerCase();

  if (["needs_review", "partial", "verified", "unknown"].includes(status)) {
    return status;
  }

  if (status === "needs review") return "needs_review";

  return "needs_review";
}

export async function POST(request: Request) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const body = await request.json();

    const rows: EnrichmentRow[] = Array.isArray(body.rows) ? body.rows : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No enrichment rows provided." },
        { status: 400 }
      );
    }

    const results = [];

    for (const row of rows) {
      const id = String(row.id ?? "").trim();

      if (!id) {
        results.push({
          id: null,
          success: false,
          error: "Missing food id.",
        });
        continue;
      }

      const payload = {
        kcal_per_100g: toNumberOrNull(row.kcal_per_100g),
        protein_percent: toNumberOrNull(row.protein_percent),
        fat_percent: toNumberOrNull(row.fat_percent),
        fiber_percent: toNumberOrNull(row.fiber_percent),
        sodium_percent: toNumberOrNull(row.sodium_percent),
        magnesium_percent: toNumberOrNull(row.magnesium_percent),
        calcium_percent: toNumberOrNull(row.calcium_percent),
        phosphorus_percent: toNumberOrNull(row.phosphorus_percent),
        data_quality_status: normalizeStatus(row.data_quality_status),
        data_source_url: row.data_source_url
          ? String(row.data_source_url).trim()
          : null,
        data_notes: row.data_notes ? String(row.data_notes).trim() : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseAdmin
        .from("foods")
        .update(payload)
        .eq("id", id);

      results.push({
        id,
        success: !error,
        error: error?.message ?? null,
      });
    }

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      updatedRows: results.filter((item) => item.success).length,
      failedRows: results.filter((item) => !item.success).length,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to import enrichment data.",
      },
      { status: 500 }
    );
  }
}
