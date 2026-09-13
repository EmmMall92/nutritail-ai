import { NextResponse } from "next/server";

import { requireAdminOnlyApiAccess } from "@/lib/auth/adminApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

export const dynamic = "force-dynamic";

type FoodRow = {
  id: string;
  brand: string;
  display_name: string;
  species: string;
  format: string;
  is_recommendable: boolean | null;
};

function mapFood(food: FoodRow) {
  return {
    id: food.id,
    brand: food.brand,
    displayName: food.display_name,
    species: food.species,
    format: food.format,
    isRecommendable: food.is_recommendable !== false,
  };
}

export async function GET(request: Request) {
  try {
    const forbidden = await requireAdminOnlyApiAccess();
    if (forbidden) return forbidden;

    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (query.length === 1) {
      return NextResponse.json({ foods: [] });
    }

    if (!query) {
      const { data, error } = await supabaseAdmin
        .from("food_products_v2")
        .select("id, brand, display_name, species, format, is_recommendable")
        .eq("is_recommendable", true)
        .order("brand", { ascending: true })
        .order("display_name", { ascending: true })
        .limit(40);

      if (error) throw error;
      return NextResponse.json({ foods: ((data ?? []) as FoodRow[]).map(mapFood) });
    }

    const pattern = `%${query.slice(0, 100)}%`;
    const [brandResult, nameResult] = await Promise.all([
      supabaseAdmin
        .from("food_products_v2")
        .select("id, brand, display_name, species, format, is_recommendable")
        .ilike("brand", pattern)
        .order("brand", { ascending: true })
        .order("display_name", { ascending: true })
        .limit(30),
      supabaseAdmin
        .from("food_products_v2")
        .select("id, brand, display_name, species, format, is_recommendable")
        .ilike("display_name", pattern)
        .order("brand", { ascending: true })
        .order("display_name", { ascending: true })
        .limit(30),
    ]);

    if (brandResult.error) throw brandResult.error;
    if (nameResult.error) throw nameResult.error;

    const foodById = new Map<string, FoodRow>();
    for (const food of [
      ...((brandResult.data ?? []) as FoodRow[]),
      ...((nameResult.data ?? []) as FoodRow[]),
    ]) {
      foodById.set(food.id, food);
    }

    return NextResponse.json({
      foods: [...foodById.values()].slice(0, 40).map(mapFood),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to search Food V2.",
      },
      { status: 500 }
    );
  }
}
