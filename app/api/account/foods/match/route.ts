import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { findFoodMatches } from "@/lib/foods/foodMatcher";
import {
  searchFoodProductsV2,
  type FoodV2SearchResult,
} from "@/lib/food-v2/retrieval";

const FOOD_MATCH_FETCH_LIMIT = 500;
const MAX_FOOD_MATCH_QUERY_LENGTH = 160;

function getMatchConfidence(score: number) {
  if (score >= 100) return "high";
  if (score >= 50) return "moderate";
  if (score > 0) return "low";
  return "none";
}

function isConfidentScore(score: number) {
  return score >= 50;
}

function mapFoodV2ToLegacyMatch(food: FoodV2SearchResult) {
  return {
    id: food.id,
    brand: food.brand,
    name: food.display_name,
    species: food.species,
    life_stage: food.life_stage,
    size: food.dog_size,
    ingredients: food.ingredients,
    kcal_per_100g: food.nutrition.kcal_per_100g ?? null,
    protein_percent: food.nutrition.protein_percent ?? null,
    fat_percent: food.nutrition.fat_percent ?? null,
    fiber_percent: food.nutrition.fiber_percent ?? null,
    sodium_percent: food.nutrition.sodium_percent ?? null,
    magnesium_percent: food.nutrition.magnesium_percent ?? null,
    calcium_percent: food.nutrition.calcium_percent ?? null,
    phosphorus_percent: food.nutrition.phosphorus_percent ?? null,
    data_quality_status: food.data_quality_status,
    data_source_url: food.data_source_url,
    match_source: "food_v2",
    formula_key: food.formula_key,
    source_priority: food.source_priority,
    missing_nutrition_fields: food.missing_nutrition_fields,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const query = String(body.query ?? "")
      .trim()
      .slice(0, MAX_FOOD_MATCH_QUERY_LENGTH);
    const species = String(body.species ?? "").trim().toLowerCase();

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
      .limit(FOOD_MATCH_FETCH_LIMIT);

    if (species === "dog" || species === "cat") {
      foodsQuery = foodsQuery.eq("species", species);
    }

    const [{ data, error }, foodV2Candidates] = await Promise.all([
      foodsQuery,
      searchFoodProductsV2({
        query,
        species,
        limit: 5,
      }),
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const scoredFoods = findFoodMatches(data ?? [], query);
    const bestMatch = scoredFoods[0] ?? null;
    const bestFoodV2Match = foodV2Candidates[0] ?? null;
    const useFoodV2Match =
      bestFoodV2Match &&
      isConfidentScore(bestFoodV2Match.match_score) &&
      (!bestMatch || bestFoodV2Match.match_score > bestMatch.score);

    const selectedMatch = useFoodV2Match
      ? mapFoodV2ToLegacyMatch(bestFoodV2Match)
      : bestMatch?.food ?? null;
    const selectedScore = useFoodV2Match
      ? bestFoodV2Match.match_score
      : bestMatch?.score ?? 0;

    return NextResponse.json({
      match: selectedMatch,
      match_score: selectedScore,
      match_confidence: selectedScore > 0 ? getMatchConfidence(selectedScore) : "none",
      match_source: useFoodV2Match ? "food_v2" : bestMatch ? "foods" : "none",
      candidates: [
        ...scoredFoods.slice(0, 5).map((item) => ({
          ...item.food,
          match_score: item.score,
          match_confidence: getMatchConfidence(item.score),
          match_source: "foods",
        })),
        ...foodV2Candidates.map((item) => ({
          ...mapFoodV2ToLegacyMatch(item),
          match_score: item.match_score,
          match_confidence: item.match_confidence,
        })),
      ].slice(0, 8),
      v2_match: bestFoodV2Match ?? null,
      v2_candidates: foodV2Candidates,
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
