import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import {
  rankFoodV2ForPet,
  splitFoodV2Recommendations,
  type FoodV2RecommendationGoal,
} from "@/lib/food-v2/recommendationRanking";
import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";
import type { PetActivityLevel, PetSpecies } from "@/types/pet";

type FoodProductV2Row = FoodProductV2 & {
  id: string;
};

type FoodNutrientRow = FoodNutrientsV2 & {
  food_product_id: string;
};

const PRODUCT_COLUMNS = [
  "id",
  "brand",
  "formula_name",
  "display_name",
  "species",
  "format",
  "life_stage",
  "dog_size",
  "breed_target",
  "medical_tags",
  "commercial_tags",
  "ingredient_text",
  "ingredients",
  "primary_animal_proteins",
  "carbohydrate_sources",
  "fat_sources",
  "fiber_sources",
  "additives_text",
  "feeding_guide_text",
  "kcal_per_100g",
  "kcal_per_kg",
  "data_quality_status",
  "data_source_url",
  "source_priority",
  "source_notes",
  "formula_key",
  "ean",
  "is_recommendable",
].join(", ");

const VALID_GOALS = new Set<FoodV2RecommendationGoal>([
  "general",
  "premium",
  "value",
  "weight_control",
  "sensitive_digestion",
  "allergy",
  "urinary",
  "renal",
  "growth",
  "sterilised",
  "senior",
]);

function stringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function goalFrom(value: unknown): FoodV2RecommendationGoal {
  const goal = String(value ?? "general").trim() as FoodV2RecommendationGoal;
  return VALID_GOALS.has(goal) ? goal : "general";
}

function activityLevelFrom(value: unknown): PetActivityLevel {
  if (value === "low" || value === "normal" || value === "high") return value;
  return "normal";
}

function compactRanking(
  ranking: ReturnType<typeof rankFoodV2ForPet>,
  product: FoodProductV2Row,
  nutrients: FoodNutrientsV2
) {
  return {
    id: product.id,
    brand: product.brand,
    display_name: product.display_name,
    formula_key: product.formula_key,
    species: product.species,
    format: product.format,
    life_stage: product.life_stage,
    dog_size: product.dog_size,
    data_quality_status: product.data_quality_status,
    source_priority: product.source_priority,
    data_source_url: product.data_source_url,
    ranking,
    nutrition: {
      kcal_per_100g: product.kcal_per_100g,
      protein_percent: nutrients.protein_percent ?? null,
      fat_percent: nutrients.fat_percent ?? null,
      fiber_percent: nutrients.fiber_percent ?? null,
      calcium_percent: nutrients.calcium_percent ?? null,
      phosphorus_percent: nutrients.phosphorus_percent ?? null,
      sodium_percent: nutrients.sodium_percent ?? null,
      magnesium_percent: nutrients.magnesium_percent ?? null,
      omega3_percent: nutrients.omega3_percent ?? null,
      omega6_percent: nutrients.omega6_percent ?? null,
      epa_percent: nutrients.epa_percent ?? null,
      dha_percent: nutrients.dha_percent ?? null,
      epa_dha_percent: nutrients.epa_dha_percent ?? null,
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pet = body.pet ?? {};
    const species = String(pet.species ?? body.species ?? "").trim();
    const format = String(body.format ?? "dry").trim();
    const goal = goalFrom(body.goal);
    const limitPerBucket = Math.min(
      Math.max(numberValue(body.limit_per_bucket, 3), 1),
      6
    );

    if (species !== "dog" && species !== "cat") {
      return NextResponse.json(
        { error: "Provide pet.species as dog or cat." },
        { status: 400 }
      );
    }
    const petSpecies = species as PetSpecies;

    let productsQuery = supabaseAdmin
      .from("food_products_v2")
      .select(PRODUCT_COLUMNS)
      .eq("species", petSpecies)
      .eq("format", format)
      .neq("data_quality_status", "unknown")
      .neq("is_recommendable", false)
      .order("brand", { ascending: true })
      .order("display_name", { ascending: true })
      .limit(300);

    if (typeof body.brand === "string" && body.brand.trim()) {
      productsQuery = productsQuery.eq("brand", body.brand.trim());
    }

    const { data: products, error: productsError } = await productsQuery;
    if (productsError) throw productsError;

    const productRows = (products ?? []) as unknown as FoodProductV2Row[];
    const productIds = productRows.map((product) => product.id).filter(Boolean);

    if (productIds.length === 0) {
      return NextResponse.json({
        goal,
        premium: [],
        value: [],
        hold: [],
        total_candidates: 0,
      });
    }

    const { data: nutrientRows, error: nutrientsError } = await supabaseAdmin
      .from("food_product_nutrients_v2")
      .select("*")
      .in("food_product_id", productIds);

    if (nutrientsError) throw nutrientsError;

    const nutrientsByProductId = new Map(
      ((nutrientRows ?? []) as unknown as FoodNutrientRow[]).map((row) => [
        row.food_product_id,
        row,
      ])
    );

    const petContext = {
      species: petSpecies,
      breed: String(pet.breed ?? ""),
      age: numberValue(pet.age, petSpecies === "cat" ? 3 : 4),
      weight: numberValue(pet.weight, petSpecies === "cat" ? 4 : 10),
      activityLevel: activityLevelFrom(pet.activityLevel),
      neutered: Boolean(pet.neutered),
      allergies: stringArray(pet.allergies),
      healthIssues: stringArray(pet.healthIssues),
      excludedIngredients: stringArray(
        pet.excludedIngredients ?? pet.dislikedIngredients
      ),
      preferredProteins: stringArray(pet.preferredProteins ?? pet.preferredFlavors),
    };

    const rankedRows = productRows.map((product) => {
      const { food_product_id: ignoredFoodProductId, ...nutrients } =
        nutrientsByProductId.get(product.id) ?? ({} as FoodNutrientRow);

      void ignoredFoodProductId;

      return {
        product,
        nutrients,
        ranking: rankFoodV2ForPet({
          food: product,
          nutrients,
          pet: petContext,
          goal,
        }),
      };
    });

    const split = splitFoodV2Recommendations(
      rankedRows.map((row) => row.ranking),
      limitPerBucket
    );
    const rowsByFormulaKey = new Map(
      rankedRows.map((row) => [row.product.formula_key, row])
    );

    function hydrate(
      rankings: ReturnType<typeof splitFoodV2Recommendations>["premium"]
    ) {
      return rankings
        .map((ranking) => rowsByFormulaKey.get(ranking.formula_key))
        .filter((row): row is (typeof rankedRows)[number] => Boolean(row))
        .map((row) => compactRanking(row.ranking, row.product, row.nutrients));
    }

    return NextResponse.json({
      goal,
      pet: petContext,
      total_candidates: rankedRows.length,
      premium: hydrate(split.premium),
      value: hydrate(split.value),
      hold: hydrate(split.hold).slice(0, 10),
      notes: [
        "Value ranking is a proxy until price data is available.",
        "Medical-condition matches are ranking support, not diagnosis or treatment.",
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to rank Food V2 recommendations.",
      },
      { status: 500 }
    );
  }
}
