import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import type { FoodNutrientsV2 } from "@/types/food-v2";

export type FoodV2SearchParams = {
  query: string;
  species?: string | null;
  format?: string | null;
  lifeStage?: string | null;
  limit?: number;
};

export type FoodV2SearchResult = {
  id: string;
  brand: string;
  display_name: string;
  species: string;
  format: string;
  life_stage: string;
  dog_size: string | null;
  formula_key: string;
  data_quality_status: string;
  source_priority: string;
  data_source_url: string | null;
  match_score: number;
  match_confidence: "high" | "moderate" | "low";
  nutrition: FoodNutrientsV2 & {
    kcal_per_100g?: number | null;
    kcal_per_kg?: number | null;
  };
  missing_nutrition_fields: string[];
};

type FoodV2ProductRow = {
  id: string;
  brand: string;
  formula_name: string;
  display_name: string;
  species: string;
  format: string;
  life_stage: string;
  dog_size: string | null;
  medical_tags: string[] | null;
  commercial_tags: string[] | null;
  ingredients: string[] | null;
  formula_key: string;
  data_quality_status: string;
  source_priority: string;
  data_source_url: string | null;
  kcal_per_100g: number | null;
  kcal_per_kg: number | null;
};

type FoodV2NutrientRow = FoodNutrientsV2 & {
  food_product_id: string;
};

const MAX_LIMIT = 25;
const DEFAULT_FETCH_LIMIT = 250;
const CORE_NUTRITION_FIELDS = [
  "kcal_per_100g",
  "protein_percent",
  "fat_percent",
  "fiber_percent",
  "calcium_percent",
  "phosphorus_percent",
] as const;

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9α-ω]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length >= 2);
}

function scoreProduct(product: FoodV2ProductRow, query: string) {
  const normalizedQuery = normalizeText(query);
  const tokens = tokenize(query);
  const searchable = normalizeText(
    [
      product.brand,
      product.formula_name,
      product.display_name,
      product.formula_key,
      ...(product.medical_tags ?? []),
      ...(product.commercial_tags ?? []),
      ...(product.ingredients ?? []),
    ].join(" ")
  );

  if (!normalizedQuery) return 0;
  if (searchable.includes(normalizedQuery)) return 100;

  return tokens.reduce((score, token) => {
    if (searchable.includes(token)) return score + 18;
    return score;
  }, 0);
}

function confidenceForScore(score: number) {
  if (score >= 90) return "high";
  if (score >= 45) return "moderate";
  return "low";
}

function missingNutritionFields(
  product: FoodV2ProductRow,
  nutrients: FoodNutrientsV2
) {
  const combined = {
    ...nutrients,
    kcal_per_100g: product.kcal_per_100g,
  };

  return CORE_NUTRITION_FIELDS.filter((field) => {
    const value = combined[field];
    return value === null || value === undefined;
  });
}

function cleanNutrientRow(row: FoodV2NutrientRow | Record<string, never>) {
  const { food_product_id: ignoredFoodProductId, ...nutrients } =
    row as FoodV2NutrientRow;

  void ignoredFoodProductId;

  return nutrients;
}

export async function searchFoodProductsV2({
  query,
  species,
  format,
  lifeStage,
  limit = 8,
}: FoodV2SearchParams): Promise<FoodV2SearchResult[]> {
  const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const normalizedQuery = query.trim().slice(0, 160);

  if (!normalizedQuery) return [];

  let productsQuery = supabaseAdmin
    .from("food_products_v2")
    .select(
      "id, brand, formula_name, display_name, species, format, life_stage, dog_size, medical_tags, commercial_tags, ingredients, formula_key, data_quality_status, source_priority, data_source_url, kcal_per_100g, kcal_per_kg"
    )
    .neq("data_quality_status", "unknown")
    .order("brand", { ascending: true })
    .order("display_name", { ascending: true })
    .limit(DEFAULT_FETCH_LIMIT);

  if (species === "dog" || species === "cat") {
    productsQuery = productsQuery.eq("species", species);
  }

  if (format && ["dry", "wet", "treat", "supplement"].includes(format)) {
    productsQuery = productsQuery.eq("format", format);
  }

  if (lifeStage && lifeStage !== "unknown") {
    productsQuery = productsQuery.in("life_stage", [lifeStage, "all_life_stages"]);
  }

  const { data: products, error: productsError } = await productsQuery;

  if (productsError) throw productsError;

  const scored = ((products ?? []) as unknown as FoodV2ProductRow[])
    .map((product) => ({
      product,
      score: scoreProduct(product, normalizedQuery),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit);

  if (scored.length === 0) return [];

  const productIds = scored.map((item) => item.product.id);
  const { data: nutrients, error: nutrientsError } = await supabaseAdmin
    .from("food_product_nutrients_v2")
    .select("*")
    .in("food_product_id", productIds);

  if (nutrientsError) throw nutrientsError;

  const nutrientsByProductId = new Map(
    ((nutrients ?? []) as unknown as FoodV2NutrientRow[]).map((row) => [
      row.food_product_id,
      row,
    ])
  );

  return scored.map(({ product, score }) => {
    const nutrientRow = nutrientsByProductId.get(product.id) ?? {};
    const cleanNutrients = cleanNutrientRow(nutrientRow);

    return {
      id: product.id,
      brand: product.brand,
      display_name: product.display_name,
      species: product.species,
      format: product.format,
      life_stage: product.life_stage,
      dog_size: product.dog_size,
      formula_key: product.formula_key,
      data_quality_status: product.data_quality_status,
      source_priority: product.source_priority,
      data_source_url: product.data_source_url,
      match_score: score,
      match_confidence: confidenceForScore(score),
      nutrition: {
        ...cleanNutrients,
        kcal_per_100g: product.kcal_per_100g,
        kcal_per_kg: product.kcal_per_kg,
      },
      missing_nutrition_fields: missingNutritionFields(product, cleanNutrients),
    };
  });
}
