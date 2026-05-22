import { NextResponse } from "next/server";
import { foodCatalogService } from "@/services/foodCatalogService";
import { parseImportFoodRow } from "@/lib/import/foodImportParser";
import { mapFoodToDbFood, mapDbFoodToFood } from "@/mappers/foodMapper";
import { supabase } from "@/lib/db/supabase";
import { adminActivityLogService } from "@/services/adminActivityLogService";
import type { DbFood } from "@/types/db/db-food";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const species = searchParams.get("species");

    const foods =
      species === "dog" || species === "cat"
        ? await foodCatalogService.getFoodsBySpecies(species)
        : await foodCatalogService.getAllFoods();

    return NextResponse.json(foods);
  } catch (error) {
    console.error("GET /api/admin/foods error:", error);

    return NextResponse.json(
      { error: "Failed to load foods." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedFood = parseImportFoodRow(body);
    const dbFood = mapFoodToDbFood(parsedFood);

    const { data, error } = await supabase
      .from("foods")
      .insert(dbFood)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await adminActivityLogService.log({
      action: "create",
      entityType: "food",
      entityId: String(data.id),
      message: `Created food ${data.brand} — ${data.name}`,
      metadata: {
        species: data.species,
        brand: data.brand,
        name: data.name,
      },
    });

    return NextResponse.json(mapDbFoodToFood(data as DbFood));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create food." },
      { status: 400 }
    );
  }
}