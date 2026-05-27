import type { DbFood } from "@/types/db/db-food";
import type { Food } from "@/types/food";

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

export function mapDbFoodToFood(dbFood: DbFood): Food {
  return {
    id: dbFood.id,
    brand: dbFood.brand,
    name: dbFood.name,
    species: dbFood.species,
    lifeStage: dbFood.life_stage,
    activitySupport: dbFood.activity_support,
    healthSupport: normalizeStringArray(dbFood.health_support),
    protein: dbFood.protein,
    fat: dbFood.fat,
    fiber: dbFood.fiber,
    sodium: dbFood.sodium,
    magnesium: dbFood.magnesium,
    calcium: dbFood.calcium,
    phosphorus: dbFood.phosphorus,
    ingredients: normalizeStringArray(dbFood.ingredients),
    tags: normalizeStringArray(dbFood.tags),
    kcalPer100g: dbFood.kcal_per_100g ?? null,
    proteinPercent: dbFood.protein_percent ?? null,
    fatPercent: dbFood.fat_percent ?? null,
    fiberPercent: dbFood.fiber_percent ?? null,
    sodiumPercent: dbFood.sodium_percent ?? null,
    magnesiumPercent: dbFood.magnesium_percent ?? null,
    calciumPercent: dbFood.calcium_percent ?? null,
    phosphorusPercent: dbFood.phosphorus_percent ?? null,
    dataQualityStatus: dbFood.data_quality_status ?? null,
    dataSourceUrl: dbFood.data_source_url ?? null,
    dataNotes: dbFood.data_notes ?? null,
  };
}

export function mapFoodToDbFood(food: Food): DbFood {
  const now = new Date().toISOString();

  return {
    id: food.id,
    brand: food.brand,
    name: food.name,
    species: food.species,
    life_stage: food.lifeStage,
    activity_support: food.activitySupport,
    health_support: food.healthSupport,
    protein: food.protein,
    fat: food.fat,
    fiber: food.fiber,
    sodium: food.sodium,
    magnesium: food.magnesium,
    calcium: food.calcium,
    phosphorus: food.phosphorus,
    ingredients: food.ingredients,
    tags: food.tags,
    kcal_per_100g: food.kcalPer100g ?? null,
    protein_percent: food.proteinPercent ?? food.protein ?? null,
    fat_percent: food.fatPercent ?? food.fat ?? null,
    fiber_percent: food.fiberPercent ?? food.fiber ?? null,
    sodium_percent: food.sodiumPercent ?? food.sodium ?? null,
    magnesium_percent: food.magnesiumPercent ?? food.magnesium ?? null,
    calcium_percent: food.calciumPercent ?? food.calcium ?? null,
    phosphorus_percent: food.phosphorusPercent ?? food.phosphorus ?? null,
    data_quality_status: food.dataQualityStatus ?? null,
    data_source_url: food.dataSourceUrl ?? null,
    data_notes: food.dataNotes ?? null,
    created_at: now,
    updated_at: now,
  };
}
