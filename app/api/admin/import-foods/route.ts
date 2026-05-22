import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { mapFoodToDbFood } from "@/mappers/foodMapper";
import { parseImportFoods } from "@/lib/import/foodImportParser";
import { adminActivityLogService } from "@/services/adminActivityLogService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const foods = parseImportFoods(body);
    const dbFoods = foods.map(mapFoodToDbFood);

    const { data, error } = await supabase
      .from("foods")
      .upsert(dbFoods)
      .select("id");

    if (error) {
      console.error("Import foods error:", error);
      return NextResponse.json(
        { error: "Failed to import foods." },
        { status: 500 }
      );
    }

    await adminActivityLogService.log({
      action: "import",
      entityType: "food",
      entityId: "bulk-import",
      message: `Imported ${data?.length ?? 0} food records`,
      metadata: {
        imported: data?.length ?? 0,
      },
    });

    return NextResponse.json({
      success: true,
      imported: data?.length ?? 0,
    });
  } catch (error) {
    console.error("Import foods route error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected import error.",
      },
      { status: 400 }
    );
  }
}