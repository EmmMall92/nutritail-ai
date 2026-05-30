import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

export async function PATCH(request: Request) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const body = await request.json();
    const isRecommendable = body.is_recommendable !== false;
    const brand = String(body.brand ?? "").trim();
    const foodIds = Array.isArray(body.food_ids)
      ? body.food_ids.map((id: unknown) => String(id).trim()).filter(Boolean)
      : [];

    if (!brand && foodIds.length === 0) {
      return NextResponse.json(
        { error: "Provide a brand or food_ids to update." },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("foods")
      .update({
        is_recommendable: isRecommendable,
        updated_at: new Date().toISOString(),
      })
      .is("deleted_at", null);

    if (foodIds.length > 0) {
      query = query.in("id", foodIds);
    } else {
      query = query.eq("brand", brand);
    }

    const { data, error } = await query.select("id, brand, name, is_recommendable");

    if (error) throw error;

    if (brand) {
      await supabaseAdmin
        .from("food_brand_recommendation_controls")
        .upsert(
          {
            brand,
            is_recommendable: isRecommendable,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "brand" }
        );
    }

    return NextResponse.json({
      success: true,
      updatedRows: data?.length ?? 0,
      foods: data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update recommendation visibility.",
      },
      { status: 500 }
    );
  }
}
