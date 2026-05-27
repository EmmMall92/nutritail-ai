import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
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

    const { data, error } = await supabase
      .from("foods")
      .select("id, species, brand, data_quality_status")
      .is("deleted_at", null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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
