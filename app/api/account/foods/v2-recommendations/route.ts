import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import {
  rankFoodV2ForPet,
  splitFoodV2Recommendations,
} from "@/lib/food-v2/recommendationRanking";
import {
  normalizeFoodV2RecommendationPetContext,
  numberFromRecommendationValue,
  recommendationGoalFrom,
  stringArrayFromRecommendationValue,
} from "@/lib/food-v2/recommendationRequest";
import { normalizeBrandlessFoodDisplayName } from "@/lib/food-v2/canonicalFood";
import { customerFoodDisplayName } from "@/lib/food-v2/customerFoodName";
import { detectFoodV2RecommendationGuardFlags } from "@/lib/food-v2/recommendationGuards";
import { isLikelyNonCompleteFoodProduct } from "@/lib/food-v2/productFormGuards";
import { getFoodV2NutritionConfidence } from "@/lib/food-v2/nutritionConfidence";
import { evaluateFoodIntelligence } from "@/lib/food-intelligence/evaluateFood";
import { detectSafetyWarnings, hasHardStop } from "@/lib/chatbot/safetyRules";
import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";
import type { PetSpecies } from "@/types/pet";

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

function normalizedText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function safetyMessageFromRequest(body: Record<string, unknown>, pet: Record<string, unknown>) {
  return [
    body.message,
    body.prompt,
    body.query,
    pet.currentFood,
    pet.currentFoodName,
    ...stringArrayFromRecommendationValue(pet.healthIssues ?? pet.health_issues),
    ...stringArrayFromRecommendationValue(pet.allergies),
    ...stringArrayFromRecommendationValue(
      pet.excludedIngredients ?? pet.excluded_ingredients
    ),
    ...stringArrayFromRecommendationValue(
      pet.dislikedIngredients ?? pet.disliked_ingredients
    ),
  ]
    .filter(Boolean)
    .join(" ");
}

function compactRanking(
  ranking: ReturnType<typeof rankFoodV2ForPet>,
  product: FoodProductV2Row,
  nutrients: FoodNutrientsV2
) {
  const displayName =
    customerFoodDisplayName({
      brand: product.brand,
      display_name: product.display_name,
      formula_name: product.formula_name,
    }) ||
    normalizeBrandlessFoodDisplayName({
      brand: product.brand,
      display_name: product.display_name,
      formula_name: product.formula_name,
    });
  const foodIntelligence = evaluateFoodIntelligence({
    species: product.species,
    life_stage: product.life_stage,
    dog_size: product.dog_size,
    ingredient_tags: [
      ...product.primary_animal_proteins,
      ...product.carbohydrate_sources,
      ...product.fat_sources,
      ...product.fiber_sources,
      ...product.commercial_tags,
    ],
    health_tags: product.commercial_tags,
    medical_tags: product.medical_tags,
    data_quality_status: product.data_quality_status,
    source_priority: product.source_priority,
    nutrients: {
      kcal_per_100g: product.kcal_per_100g,
      protein_percent: nutrients.protein_percent ?? null,
      fat_percent: nutrients.fat_percent ?? null,
      fiber_percent: nutrients.fiber_percent ?? null,
      calcium_percent: nutrients.calcium_percent ?? null,
      phosphorus_percent: nutrients.phosphorus_percent ?? null,
      magnesium_percent: nutrients.magnesium_percent ?? null,
      sodium_percent: nutrients.sodium_percent ?? null,
      epa_percent: nutrients.epa_percent ?? null,
      dha_percent: nutrients.dha_percent ?? null,
      epa_dha_percent: nutrients.epa_dha_percent ?? null,
    },
  });

  return {
    id: product.id,
    brand: product.brand,
    display_name: displayName,
    formula_key: product.formula_key,
    species: product.species,
    format: product.format,
    life_stage: product.life_stage,
    dog_size: product.dog_size,
    data_quality_status: product.data_quality_status,
    source_priority: product.source_priority,
    data_source_url: product.data_source_url,
    ranking: {
      ...ranking,
      display_name: displayName,
    },
    guard_flags: detectFoodV2RecommendationGuardFlags(ranking),
    food_intelligence: {
      score: foodIntelligence.score,
      confidence_level: foodIntelligence.confidence_level,
      strengths: foodIntelligence.food_strengths.slice(0, 4),
      cautions: foodIntelligence.food_cautions.slice(0, 4),
      best_use_cases: foodIntelligence.best_use_cases.slice(0, 4),
      not_ideal_cases: foodIntelligence.not_ideal_cases.slice(0, 4),
    },
    nutrition_confidence: getFoodV2NutritionConfidence(product, nutrients),
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

function enforceUserVisibleRecommendationEligibility(
  ranking: ReturnType<typeof rankFoodV2ForPet>
) {
  const shouldHold =
    ranking.confidence === "low" ||
    ranking.total_score < 45 ||
    ranking.quality_score < 35;

  if (!shouldHold || ranking.bucket === "hold") return ranking;

  return {
    ...ranking,
    bucket: "hold" as const,
    cautions: [
      "Candidate kept out of user shortlist because recommendation confidence is too low.",
      ...ranking.cautions,
    ].slice(0, 6),
    signals: [
      ...ranking.signals,
      {
        type: "exclude" as const,
        code: "user_visible_confidence_hold",
        points: -25,
        message:
          "Candidate kept out of user shortlist because recommendation confidence is too low.",
      },
    ],
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pet = body.pet ?? {};
    const species = String(pet.species ?? body.species ?? "").trim();
    const format = String(body.format ?? "dry").trim();
    const goal = recommendationGoalFrom(body.goal);
    const limitPerBucket = Math.min(
      Math.max(numberFromRecommendationValue(body.limit_per_bucket, 3), 1),
      6
    );

    if (species !== "dog" && species !== "cat") {
      return NextResponse.json(
        { error: "Provide pet.species as dog or cat." },
        { status: 400 }
      );
    }
    const petSpecies = species as PetSpecies;
    const petContext = normalizeFoodV2RecommendationPetContext({
      pet,
      body,
      species: petSpecies,
    });
    const safetyWarnings = detectSafetyWarnings({
      message: safetyMessageFromRequest(body, pet),
      pet: petContext,
      locale: "el",
    });

    if (hasHardStop(safetyWarnings)) {
      return NextResponse.json({
        goal,
        pet: petContext,
        total_candidates: 0,
        premium: [],
        value: [],
        hold: [],
        safety: {
          hard_stop: true,
          warnings: safetyWarnings,
        },
        notes: [
          "Urgent symptom safety interrupt blocked customer-facing food recommendations.",
          "Recommend veterinary assessment before shopping-mode food advice.",
        ],
      });
    }

    let productsQuery = supabaseAdmin
      .from("food_products_v2")
      .select(PRODUCT_COLUMNS)
      .eq("species", petSpecies)
      .eq("format", format)
      .neq("data_quality_status", "unknown")
      .neq("is_recommendable", false)
      .order("brand", { ascending: true })
      .order("display_name", { ascending: true })
      .limit(1000);

    if (typeof body.brand === "string" && body.brand.trim()) {
      productsQuery = productsQuery.eq("brand", body.brand.trim());
    }

    const { data: products, error: productsError } = await productsQuery;
    if (productsError) throw productsError;

    const excludedBrands = new Set(
      stringArrayFromRecommendationValue(
        body.excluded_brands ?? body.excludedBrands
      ).map(normalizedText)
    );
    const productRows = ((products ?? []) as unknown as FoodProductV2Row[])
      .filter((product) => !isLikelyNonCompleteFoodProduct(product))
      .filter((product) => !excludedBrands.has(normalizedText(product.brand)));
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

    const rankedRows = productRows.map((product) => {
      const { food_product_id: ignoredFoodProductId, ...nutrients } =
        nutrientsByProductId.get(product.id) ?? ({} as FoodNutrientRow);

      void ignoredFoodProductId;

      return {
        product,
        nutrients,
        ranking: enforceUserVisibleRecommendationEligibility(
          rankFoodV2ForPet({
            food: product,
            nutrients,
            pet: petContext,
            goal,
          })
        ),
      };
    });

    const split = splitFoodV2Recommendations(
      rankedRows.map((row) => row.ranking),
      limitPerBucket,
      goal
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
