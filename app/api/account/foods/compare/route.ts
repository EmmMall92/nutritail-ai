import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { findFoodMatches, type FoodMatchRecord } from "@/lib/foods/foodMatcher";
import {
  searchFoodProductsV2,
  type FoodV2SearchResult,
} from "@/lib/food-v2/retrieval";
import { customerFoodDisplayName } from "@/lib/food-v2/customerFoodName";

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

function getComparisonCautions(nutrition: ReturnType<typeof getNutrition>) {
  const cautions: string[] = [];

  if (nutrition.kcal_per_100g === null) {
    cautions.push("Missing calories, so portion comparison is limited.");
  }

  if (nutrition.calcium_percent === null || nutrition.phosphorus_percent === null) {
    cautions.push("Missing calcium/phosphorus, so growth or kidney-sensitive comparisons need caution.");
  }

  if (nutrition.sodium_percent === null || nutrition.magnesium_percent === null) {
    cautions.push("Missing sodium or magnesium, so urinary/mineral review is incomplete.");
  }

  return cautions;
}

function getFoodV2Nutrition(food: FoodV2SearchResult) {
  return {
    kcal_per_100g: food.nutrition.kcal_per_100g ?? null,
    protein_percent: food.nutrition.protein_percent ?? null,
    fat_percent: food.nutrition.fat_percent ?? null,
    fiber_percent: food.nutrition.fiber_percent ?? null,
    calcium_percent: food.nutrition.calcium_percent ?? null,
    phosphorus_percent: food.nutrition.phosphorus_percent ?? null,
    sodium_percent: food.nutrition.sodium_percent ?? null,
    magnesium_percent: food.nutrition.magnesium_percent ?? null,
  };
}

function getFoodV2Confidence(food: FoodV2SearchResult) {
  if (food.data_quality_status === "verified" && food.match_confidence === "high") {
    return "high";
  }
  if (food.match_confidence === "low" || food.data_quality_status === "needs_review") {
    return "low";
  }
  return "moderate";
}

function getFoodV2CustomerDisplayName(food: FoodV2SearchResult) {
  return (
    customerFoodDisplayName({
      brand: food.brand,
      display_name: food.display_name,
    }) || food.display_name
  );
}

function buildComparisonSummary(
  matches: Array<{
    query: string;
    label: string;
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
      ).map((item) => item.label || item.query)[0] ?? null,
    highest_protein:
      withProtein.sort(
        (a, b) =>
          (b.nutrition.protein_percent ?? -Infinity) -
          (a.nutrition.protein_percent ?? -Infinity)
      ).map((item) => item.label || item.query)[0] ?? null,
    highest_fiber:
      withFiber.sort(
        (a, b) =>
          (b.nutrition.fiber_percent ?? -Infinity) -
          (a.nutrition.fiber_percent ?? -Infinity)
      ).map((item) => item.label || item.query)[0] ?? null,
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
    const foodV2Matches = await Promise.all(
      queries.map((query) =>
        searchFoodProductsV2({
          query,
          species: species === "dog" || species === "cat" ? species : null,
          format: "dry",
          limit: 3,
        })
      )
    );

    const comparisons = queries.map((query: string, index) => {
      const scored = findFoodMatches(foods, query);
      const best = scored[0];
      const bestV2 = foodV2Matches[index]?.[0] ?? null;
      const shouldUseV2 =
        bestV2 &&
        (bestV2.match_score >= (best?.score ?? 0) ||
          bestV2.match_confidence === "high");

      if (shouldUseV2 && bestV2) {
        const nutrition = getFoodV2Nutrition(bestV2);

        return {
          query,
          source: "food_v2",
          match: {
            id: bestV2.id,
            brand: bestV2.brand,
            name: getFoodV2CustomerDisplayName(bestV2),
            species: bestV2.species,
            life_stage: bestV2.life_stage,
            size: bestV2.dog_size,
            tags: [],
            ingredients: bestV2.ingredients,
            data_quality_status: bestV2.data_quality_status,
            data_source_url: bestV2.data_source_url,
            source_priority: bestV2.source_priority,
            formula_key: bestV2.formula_key,
          },
          match_score: bestV2.match_score,
          match_confidence: bestV2.match_confidence,
          data_confidence: getFoodV2Confidence(bestV2),
          nutrition,
          missing_nutrition_fields: [
            ...new Set([
              ...bestV2.missing_nutrition_fields,
              ...getMissingNutritionFields(nutrition),
            ]),
          ],
          cautions: getComparisonCautions(nutrition),
          candidates: bestV2
            ? foodV2Matches[index].slice(0, 3).map((item) => ({
                id: item.id,
                brand: item.brand,
                name: getFoodV2CustomerDisplayName(item),
                score: item.match_score,
                source: "food_v2",
              }))
            : [],
        };
      }

      if (!best) {
        return {
          query,
          source: bestV2 ? "food_v2" : "legacy_foods",
          match: null,
          match_score: 0,
          match_confidence: "none",
          candidates: [],
        };
      }

      const nutrition = getNutrition(best.food);

      return {
        query,
        source: "legacy_foods",
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
        match_confidence:
          best.score >= 90 ? "high" : best.score >= 45 ? "moderate" : "low",
        data_confidence: getDataConfidence(best.food),
        nutrition,
        missing_nutrition_fields: getMissingNutritionFields(nutrition),
        cautions: getComparisonCautions(nutrition),
        candidates: [
          ...scored.slice(0, 3).map((item) => ({
            id: item.food.id ?? null,
            brand: item.food.brand ?? null,
            name: item.food.name ?? null,
            score: item.score,
            source: "legacy_foods",
          })),
          ...foodV2Matches[index].slice(0, 3).map((item) => ({
            id: item.id,
            brand: item.brand,
            name: getFoodV2CustomerDisplayName(item),
            score: item.match_score,
            source: "food_v2",
          })),
        ].slice(0, 5),
      };
    });

    const matchedForSummary = comparisons
      .filter((item) => item.match && "nutrition" in item)
      .map((item) => ({
        query: item.query,
        label:
          [item.match?.brand, item.match?.name]
            .map((value) => String(value ?? "").trim())
            .filter(Boolean)
            .join(" - ") || item.query,
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
