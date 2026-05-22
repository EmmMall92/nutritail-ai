import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";

export async function GET() {
  try {
    const [{ data: pets, error: petsError }, { data: foods, error: foodsError }] =
      await Promise.all([
        supabase
          .from("pets")
          .select("*")
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false }),
        supabase
          .from("foods")
          .select("*")
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false }),
      ]);

    if (petsError) {
      return NextResponse.json({ error: petsError.message }, { status: 500 });
    }

    if (foodsError) {
      return NextResponse.json({ error: foodsError.message }, { status: 500 });
    }

    return NextResponse.json({
      pets: pets ?? [],
      foods: foods ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load trash." },
      { status: 500 }
    );
  }
}