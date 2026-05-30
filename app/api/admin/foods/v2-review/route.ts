import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

const PRODUCT_LIMIT = 100;
const AUDIT_LIMIT = 50;

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
