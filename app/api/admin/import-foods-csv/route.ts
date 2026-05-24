import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { mapFoodToDbFood } from "@/mappers/foodMapper";
import { convertCsvToFoods } from "@/lib/import/csvFoodImporter";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

export async function POST(request: Request) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const csvText = await request.text();
    const foods = convertCsvToFoods(csvText);

    const ids = foods.map((food) => food.id);

    const { data: existingFoods, error: existingError } = await supabase
      .from("foods")
      .select("id")
      .in("id", ids);

    if (existingError) {
      console.error("Existing foods lookup error:", existingError);
      return NextResponse.json(
        { error: "Failed to check existing foods." },
        { status: 500 }
      );
    }

    const existingIds = new Set((existingFoods ?? []).map((item) => item.id));

    const dbFoods = foods.map(mapFoodToDbFood);

    const { data, error } = await supabase
      .from("foods")
      .upsert(dbFoods)
      .select("id");

    if (error) {
      console.error("CSV import foods error:", error);

      return NextResponse.json(
        { error: "Failed to import CSV foods." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imported: data?.length ?? 0,
      updatedIds: ids.filter((id) => existingIds.has(id)),
      insertedIds: ids.filter((id) => !existingIds.has(id)),
    });
  } catch (error) {
    console.error("CSV import route error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected CSV import error.",
      },
      { status: 400 }
    );
  }
}