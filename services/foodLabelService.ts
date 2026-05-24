import { foodCatalogService } from "@/services/foodCatalogService";

export async function getFoodLabelsMap(
  foodIds: string[]
): Promise<Record<string, string>> {
  const uniqueIds = Array.from(new Set(foodIds));
  const entries = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const food = await foodCatalogService.getFoodById(id);

        if (!food) {
          return [id, id] as const;
        }

        return [id, `${food.brand} - ${food.name}`] as const;
      } catch {
        return [id, id] as const;
      }
    })
  );

  return Object.fromEntries(entries);
}
