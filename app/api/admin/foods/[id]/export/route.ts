import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Context) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const { id } = await context.params;

    const { data: food, error } = await supabase
      .from("foods")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!food) {
      return NextResponse.json({ error: "Food not found." }, { status: 404 });
    }

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      summary: {
        foodId: food.id,
        brand: food.brand,
        name: food.name,
        species: food.species,
        lifeStage: food.life_stage,
      },
      food,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to export food bundle.",
      },
      { status: 500 }
    );
  }
}