import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

function getQualityStatus(value: unknown) {
  const status = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  return status === "needs review" ? "needs_review" : status;
}

export async function GET() {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const [
      legacyFoodsResult,
      foodV2TotalResult,
      foodV2DogResult,
      foodV2CatResult,
      foodV2VerifiedResult,
      foodV2NeedsReviewResult,
      foodV2UnknownResult,
      foodV2RecommendableResult,
      foodV2OfficialResult,
      foodV2RetailerResult,
      foodV2AuditRowsResult,
      foodV2BlockedAuditRowsResult,
    ] = await Promise.all([
      supabase
        .from("foods")
        .select("id, species, brand, data_quality_status")
        .is("deleted_at", null),
      supabaseAdmin
        .from("food_products_v2")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("food_products_v2")
        .select("id", { count: "exact", head: true })
        .eq("species", "dog"),
      supabaseAdmin
        .from("food_products_v2")
        .select("id", { count: "exact", head: true })
        .eq("species", "cat"),
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
        .from("food_products_v2")
        .select("id", { count: "exact", head: true })
        .eq("is_recommendable", true),
      supabaseAdmin
        .from("food_products_v2")
        .select("id", { count: "exact", head: true })
        .eq("source_priority", "official"),
      supabaseAdmin
        .from("food_products_v2")
        .select("id", { count: "exact", head: true })
        .eq("source_priority", "retailer"),
      supabaseAdmin
        .from("food_import_audit_v2")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("food_import_audit_v2")
        .select("id", { count: "exact", head: true })
        .eq("importable", false),
    ]);

    const { data, error } = legacyFoodsResult;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const foodV2Errors = [
      foodV2TotalResult.error,
      foodV2DogResult.error,
      foodV2CatResult.error,
      foodV2VerifiedResult.error,
      foodV2NeedsReviewResult.error,
      foodV2UnknownResult.error,
      foodV2RecommendableResult.error,
      foodV2OfficialResult.error,
      foodV2RetailerResult.error,
      foodV2AuditRowsResult.error,
      foodV2BlockedAuditRowsResult.error,
    ].filter(Boolean);

    if (foodV2Errors.length > 0) {
      return NextResponse.json(
        { error: foodV2Errors[0]?.message ?? "Failed to load Food V2 stats." },
        { status: 500 }
      );
    }

    const foods = data ?? [];

    const totalFoods = foods.length;
    const dogFoods = foods.filter((food) => food.species === "dog").length;
    const catFoods = foods.filter((food) => food.species === "cat").length;

    const uniqueBrands = new Set(
      foods
        .map((food) => String(food.brand ?? "").trim().toLowerCase())
        .filter(Boolean)
    ).size;

    const needsReviewFoods = foods.filter(
      (food) => {
        const status = getQualityStatus(food.data_quality_status);
        return status === "needs_review" || !status;
      }
    ).length;

    const partialFoods = foods.filter(
      (food) => getQualityStatus(food.data_quality_status) === "partial"
    ).length;

    const verifiedFoods = foods.filter(
      (food) => getQualityStatus(food.data_quality_status) === "verified"
    ).length;

    const unknownFoods = foods.filter(
      (food) => getQualityStatus(food.data_quality_status) === "unknown"
    ).length;

    return NextResponse.json({
      totalFoods,
      dogFoods,
      catFoods,
      uniqueBrands,
      needsReviewFoods,
      partialFoods,
      verifiedFoods,
      unknownFoods,
      foodV2Total: foodV2TotalResult.count ?? 0,
      foodV2DogFoods: foodV2DogResult.count ?? 0,
      foodV2CatFoods: foodV2CatResult.count ?? 0,
      foodV2Verified: foodV2VerifiedResult.count ?? 0,
      foodV2NeedsReview: foodV2NeedsReviewResult.count ?? 0,
      foodV2Unknown: foodV2UnknownResult.count ?? 0,
      foodV2Recommendable: foodV2RecommendableResult.count ?? 0,
      foodV2Official: foodV2OfficialResult.count ?? 0,
      foodV2Retailer: foodV2RetailerResult.count ?? 0,
      foodV2AuditRows: foodV2AuditRowsResult.count ?? 0,
      foodV2BlockedAuditRows: foodV2BlockedAuditRowsResult.count ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load admin stats.",
      },
      { status: 500 }
    );
  }
}
