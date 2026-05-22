import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const query = String(body.query ?? "").trim();
    const species = String(body.species ?? "").trim();

    if (!query) {
      return NextResponse.json({ match: null });
    }

    let foodsQuery = supabaseAdmin
      .from("foods")
      .select("*")
      .is("deleted_at", null)
      .limit(10);

    if (species === "dog" || species === "cat") {
      foodsQuery = foodsQuery.eq("species", species);
    }

    const { data, error } = await foodsQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const normalizedQuery = query.toLowerCase();

    const scoredFoods = (data ?? [])
      .map((food) => {
        const brand = String(food.brand ?? "").toLowerCase();
        const name = String(food.name ?? "").toLowerCase();
        const fullName = `${brand} ${name}`;

        let score = 0;

        if (fullName.includes(normalizedQuery)) score += 100;
        if (normalizedQuery.includes(brand) && brand) score += 30;
        if (normalizedQuery.includes(name) && name) score += 50;

        for (const word of normalizedQuery.split(" ").filter(Boolean)) {
          if (fullName.includes(word)) score += 10;
        }

        return {
          food,
          score,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const bestMatch = scoredFoods[0]?.food ?? null;

    return NextResponse.json({
      match: bestMatch,
      candidates: scoredFoods.slice(0, 5).map((item) => item.food),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to match food.",
      },
      { status: 500 }
    );
  }
}