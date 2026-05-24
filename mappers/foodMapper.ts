import type { DbFood } from "@/types/db/db-food";
import type { Food } from "@/types/food";

export function mapDbFoodToFood(dbFood: DbFood): Food {
  return {
    id: dbFood.id,
    brand: dbFood.brand,
    name: dbFood.name,
    species: dbFood.species,
    lifeStage: dbFood.life_stage,
    activitySupport: dbFood.activity_support,
    healthSupport: dbFood.health_support,
    protein: dbFood.protein,
    fat: dbFood.fat,
    fiber: dbFood.fiber,
    sodium: dbFood.sodium,
    magnesium: dbFood.magnesium,
    calcium: dbFood.calcium,
    phosphorus: dbFood.phosphorus,
    ingredients: dbFood.ingredients,
    tags: dbFood.tags,
    kcalPer100g: dbFood.kcal_per_100g ?? null,
    proteinPercent: dbFood.protein_percent ?? null,
    fatPercent: dbFood.fat_percent ?? null,
    fiberPercent: dbFood.fiber_percent ?? null,
    sodiumPercent: dbFood.sodium_percent ?? null,
    magnesiumPercent: dbFood.magnesium_percent ?? null,
    calciumPercent: dbFood.calcium_percent ?? null,
    phosphorusPercent: dbFood.phosphorus_percent ?? null,
    dataQualityStatus: dbFood.data_quality_status ?? null,
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
    created_at: now,
    updated_at: now,
  };
}
