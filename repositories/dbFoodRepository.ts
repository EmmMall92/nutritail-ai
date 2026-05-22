import { foods } from "@/database/foods";
import { mapDbFoodToFood } from "@/mappers/foodMapper";
import type { DbFood } from "@/types/db/db-food";
import type { Food } from "@/types/food";

function buildMockDbFoods(): DbFood[] {
  const now = new Date().toISOString();

  return foods.map((food) => ({
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
  }));
}

export const dbFoodRepository = {
  getAll(): Food[] {
    const dbFoods = buildMockDbFoods();
    return dbFoods.map(mapDbFoodToFood);
  },

  getBySpecies(species: "dog" | "cat"): Food[] {
    const dbFoods = buildMockDbFoods().filter((food) => food.species === species);
    return dbFoods.map(mapDbFoodToFood);
  },

  getById(foodId: string): Food | null {
    const dbFood = buildMockDbFoods().find((food) => food.id === foodId);
    return dbFood ? mapDbFoodToFood(dbFood) : null;
  },
};