import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { findFoodMatches, type FoodMatchRecord } from "@/lib/foods/foodMatcher";

const MAX_COMPARE_ITEMS = 5;

function getNumber(food: FoodMatchRecord, keys: string[]) {
  for (const key of keys) {
    const value = food[key];

    if (value === null || value === undefined || value === "") continue;

    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }

  return null;
}

function getStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getNutrition(food: FoodMatchRecord) {
  return {
    kcal_per_100g: getNumber(food, ["kcal_per_100g", "kcalPer100g"]),
    protein_percent: getNumber(food, [
      "protein_percent",
      "protein",
      "proteinPercent",
    ]),
    fat_percent: getNumber(food, ["fat_percent", "fat", "fatPercent"]),
    fiber_percent: getNumber(food, ["fiber_percent", "fiber", "fiberPercent"]),
    calcium_percent: getNumber(food, [
      "calcium_percent",
      "calcium",
      "calciumPercent",
    ]),
    phosphorus_percent: getNumber(food, [
      "phosphorus_percent",
      "phosphorus",
      "phosphorusPercent",
    ]),
    sodium_percent: getNumber(food, ["sodium_percent", "sodium", "sodiumPercent"]),
    magnesium_percent: getNumber(food, [
      "magnesium_percent",
      "magnesium",
      "magnesiumPercent",
    ]),
  };
}

function getMissingNutritionFields(nutrition: ReturnType<typeof getNutrition>) {
  return Object.entries(nutrition)
    .filter(([, value]) => value === null)
    .map(([key]) => key);
}

function getDataConfidence(food: FoodMatchRecord) {
  const status = String(food.data_quality_status ?? "unknown");

  if (status === "verified") return "high";
  if (status === "partial") return "moderate";
  return "low";
}

function buildComparisonSummary(
  matches: Array<{
    query: string;
    match: FoodMatchRecord;
    nutrition: ReturnType<typeof getNutrition>;
  }>
) {
  const withKcal = matches.filter((item) => item.nutrition.kcal_per_100g !== null);
  const withProtein = matches.filter(
    (item) => item.nutrition.protein_percent !== null
  );
  const withFiber = matches.filter(
    (item) => item.nutrition.fiber_percent !== null
  );

  return {
    lowest_calorie:
      withKcal.sort(
        (a, b) =>
          (a.nutrition.kcal_per_100g ?? Infinity) -
          (b.nutrition.kcal_per_100g ?? Infinity)
      )[0]?.query ?? null,
    highest_protein:
      withProtein.sort(
        (a, b) =>
          (b.nutrition.protein_percent ?? -Infinity) -
          (a.nutrition.protein_percent ?? -Infinity)
      )[0]?.query ?? null,
    highest_fiber:
      withFiber.sort(
        (a, b) =>
          (b.nutrition.fiber_percent ?? -Infinity) -
          (a.nutrition.fiber_percent ?? -Infinity)
      )[0]?.query ?? null,
    note:
      "Use this as a structured comparison aid; medical-condition recommendations still need pet context and safety checks.",
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      queries?: unknown;
      species?: unknown;
    };
    const queries: string[] = Array.isArray(body.queries)
      ? body.queries
          .map((item: unknown) => String(item ?? "").trim())
          .filter(Boolean)
          .slice(0, MAX_COMPARE_ITEMS)
      : [];
    const species = String(body.species ?? "").trim();

    if (queries.length < 2) {
      return NextResponse.json(
        { error: "Provide at least two food names to compare." },
        { status: 400 }
      );
    }

    let foodsQuery = supabaseAdmin
      .from("foods")
      .select("*")
      .is("deleted_at", null)
      .in("data_quality_status", ["partial", "verified"])
      .order("brand", { ascending: true })
      .order("name", { ascending: true })
      .limit(250);

    if (species === "dog" || species === "cat") {
      foodsQuery = foodsQuery.eq("species", species);
    }

    const { data, error } = await foodsQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const foods = data ?? [];
    const comparisons = queries.map((query: string) => {
      const scored = findFoodMatches(foods, query);
      const best = scored[0];

      if (!best) {
        return {
          query,
          match: null,
          match_score: 0,
          candidates: [],
        };
      }

      const nutrition = getNutrition(best.food);

      return {
        query,
        match: {
          id: best.food.id ?? null,
          brand: best.food.brand ?? null,
          name: best.food.name ?? null,
          species: best.food.species ?? null,
          life_stage: best.food.life_stage ?? null,
          size: best.food.size ?? null,
          tags: getStringArray(best.food.tags),
          ingredients: getStringArray(best.food.ingredients),
          data_quality_status: best.food.data_quality_status ?? null,
          data_source_url: best.food.data_source_url ?? null,
        },
        match_score: best.score,
        data_confidence: getDataConfidence(best.food),
        nutrition,
        missing_nutrition_fields: getMissingNutritionFields(nutrition),
        candidates: scored.slice(0, 3).map((item) => ({
          id: item.food.id ?? null,
          brand: item.food.brand ?? null,
          name: item.food.name ?? null,
          score: item.score,
        })),
      };
    });

    const matchedForSummary = comparisons
      .filter((item) => item.match && "nutrition" in item)
      .map((item) => ({
        query: item.query,
        match: item.match as FoodMatchRecord,
        nutrition: item.nutrition as ReturnType<typeof getNutrition>,
      }));

    return NextResponse.json({
      comparisons,
      summary:
        matchedForSummary.length >= 2
          ? buildComparisonSummary(matchedForSummary)
          : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to compare foods.",
      },
      { status: 500 }
    );
  }
}
