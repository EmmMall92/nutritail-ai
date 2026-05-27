import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { findFoodMatches } from "@/lib/foods/foodMatcher";

function getMatchConfidence(score: number) {
  if (score >= 100) return "high";
  if (score >= 50) return "moderate";
  if (score > 0) return "low";
  return "none";
}

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
      .in("data_quality_status", ["partial", "verified"])
      .order("brand", { ascending: true })
      .order("name", { ascending: true })
      .limit(50);

    if (species === "dog" || species === "cat") {
      foodsQuery = foodsQuery.eq("species", species);
    }

    const { data, error } = await foodsQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const scoredFoods = findFoodMatches(data ?? [], query);
    const bestMatch = scoredFoods[0] ?? null;

    return NextResponse.json({
      match: bestMatch?.food ?? null,
      match_score: bestMatch?.score ?? 0,
      match_confidence: bestMatch
        ? getMatchConfidence(bestMatch.score)
        : "none",
      candidates: scoredFoods.slice(0, 5).map((item) => ({
        ...item.food,
        match_score: item.score,
        match_confidence: getMatchConfidence(item.score),
      })),
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
