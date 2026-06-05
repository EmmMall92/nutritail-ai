import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import type { Food } from "@/types/food";
import type { FoodNutrientsV2, LifeStage } from "@/types/food-v2";

type FoodProductV2RecommendationRow = {
  id: string;
  brand: string;
  formula_name: string;
  display_name: string;
  species: "dog" | "cat";
  life_stage: LifeStage;
  medical_tags: string[] | null;
  commercial_tags: string[] | null;
  ingredients: string[] | null;
  kcal_per_100g: number | null;
  data_quality_status: "verified" | "needs_review" | "unknown";
  data_source_url: string | null;
  source_notes: string | null;
  is_recommendable: boolean | null;
};

type FoodNutrientV2RecommendationRow = FoodNutrientsV2 & {
  food_product_id: string;
};

const RECOMMENDATION_FETCH_LIMIT = 500;

function toReadableError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) return error;

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return new Error((error as { message: string }).message);
  }

  return new Error(fallbackMessage);
}

function mapLifeStage(lifeStage: LifeStage): Food["lifeStage"] {
  if (lifeStage === "puppy" || lifeStage === "kitten") return "young";
  if (lifeStage === "senior") return "senior";
  if (lifeStage === "all_life_stages") return "all";
  return "adult";
}

function safeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function uniqueTags(row: FoodProductV2RecommendationRow) {
  return [
    ...(row.medical_tags ?? []),
    ...(row.commercial_tags ?? []),
    row.data_quality_status ? `food_v2_${row.data_quality_status}` : "",
  ]
    .map((tag) => String(tag ?? "").trim())
    .filter(Boolean)
    .filter((tag, index, tags) => tags.indexOf(tag) === index);
}

function mapFoodV2ToFood(
  row: FoodProductV2RecommendationRow,
  nutrients: FoodNutrientV2RecommendationRow | undefined
): Food {
  const tags = uniqueTags(row);
  const healthSupport = tags.filter((tag) =>
    /renal|urinary|obesity|weight|allergy|gi|digest|skin|hairball|sterilised/i.test(
      tag
    )
  );

  return {
    id: `food-v2:${row.id}`,
    brand: row.brand,
    name: row.display_name || row.formula_name,
    species: row.species,
    lifeStage: mapLifeStage(row.life_stage),
    activitySupport: "all",
    healthSupport,
    protein: safeNumber(nutrients?.protein_percent),
    fat: safeNumber(nutrients?.fat_percent),
    fiber: safeNumber(nutrients?.fiber_percent),
    sodium: safeNumber(nutrients?.sodium_percent),
    magnesium: safeNumber(nutrients?.magnesium_percent),
    calcium: safeNumber(nutrients?.calcium_percent),
    phosphorus: safeNumber(nutrients?.phosphorus_percent),
    ingredients: row.ingredients ?? [],
    tags,
    kcalPer100g: row.kcal_per_100g,
    proteinPercent: nutrients?.protein_percent ?? null,
    fatPercent: nutrients?.fat_percent ?? null,
    fiberPercent: nutrients?.fiber_percent ?? null,
    sodiumPercent: nutrients?.sodium_percent ?? null,
    magnesiumPercent: nutrients?.magnesium_percent ?? null,
    calciumPercent: nutrients?.calcium_percent ?? null,
    phosphorusPercent: nutrients?.phosphorus_percent ?? null,
    dataQualityStatus: row.data_quality_status,
    dataSourceUrl: row.data_source_url,
    dataNotes: [
      "source=food_v2",
      row.source_notes ?? "",
      row.is_recommendable === true ? "recommendable=true" : "",
    ]
      .filter(Boolean)
      .join("; "),
    isRecommendable: row.is_recommendable,
  };
}

async function getFoodV2RecommendationsBySpecies(
  species?: "dog" | "cat"
): Promise<Food[]> {
  let query = supabaseAdmin
    .from("food_products_v2")
    .select(
      "id, brand, formula_name, display_name, species, life_stage, medical_tags, commercial_tags, ingredients, kcal_per_100g, data_quality_status, data_source_url, source_notes, is_recommendable"
    )
    .neq("data_quality_status", "unknown")
    .eq("is_recommendable", true)
    .order("brand", { ascending: true })
    .order("display_name", { ascending: true })
    .limit(RECOMMENDATION_FETCH_LIMIT);

  if (species) query = query.eq("species", species);

  const { data: products, error: productsError } = await query;
  if (productsError) {
    throw toReadableError(productsError, "Failed to fetch Food V2 products.");
  }

  const productRows = (products ?? []) as unknown as FoodProductV2RecommendationRow[];
  if (productRows.length === 0) return [];

  const productIds = productRows.map((row) => row.id);
  const { data: nutrients, error: nutrientsError } = await supabaseAdmin
    .from("food_product_nutrients_v2")
    .select("*")
    .in("food_product_id", productIds);

  if (nutrientsError) {
    throw toReadableError(nutrientsError, "Failed to fetch Food V2 nutrients.");
  }

  const nutrientsByProductId = new Map(
    ((nutrients ?? []) as unknown as FoodNutrientV2RecommendationRow[]).map(
      (row) => [row.food_product_id, row]
    )
  );

  return productRows.map((row) => mapFoodV2ToFood(row, nutrientsByProductId.get(row.id)));
}

export const supabaseFoodV2RecommendationRepository = {
  getAll() {
    return getFoodV2RecommendationsBySpecies();
  },

  getBySpecies(species: "dog" | "cat") {
    return getFoodV2RecommendationsBySpecies(species);
  },
};
