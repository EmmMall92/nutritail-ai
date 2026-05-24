import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { mapFoodToDbFood } from "@/mappers/foodMapper";
import { foodsSeed } from "@/database/seeds/foods.seed";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

export async function POST() {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const dbFoods = foodsSeed.map(mapFoodToDbFood);

    const { data, error } = await supabase
      .from("foods")
      .upsert(dbFoods)
      .select("id");

    if (error) {
      console.error("Seed foods error:", error);
      return NextResponse.json(
        { error: "Failed to seed foods." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inserted: data?.length ?? 0,
    });
  } catch (error) {
    console.error("Seed foods route error:", error);
    return NextResponse.json(
      { error: "Unexpected error while seeding foods." },
      { status: 500 }
    );
  }
}