import { supabase } from "@/lib/db/supabase";
import { mapDbFoodToFood } from "@/mappers/foodMapper";
import type { DbFood } from "@/types/db/db-food";
import type { Food } from "@/types/food";

function toReadableError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    return error;
  }

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

export const supabaseFoodRepository = {
  async getAll(): Promise<Food[]> {
    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .is("deleted_at", null)
      .in("data_quality_status", ["partial", "verified"])
      .order("brand", { ascending: true });

    if (error) {
      console.error("Supabase getAll foods error:", error);
      throw toReadableError(error, "Failed to fetch foods from Supabase.");
    }

    return (data as DbFood[]).map(mapDbFoodToFood);
  },

  async getBySpecies(species: "dog" | "cat"): Promise<Food[]> {
    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .is("deleted_at", null)
      .eq("species", species)
      .in("data_quality_status", ["partial", "verified"])
      .order("brand", { ascending: true });

    if (error) {
      console.error("Supabase getBySpecies foods error:", error);
      throw toReadableError(error, "Failed to fetch foods by species.");
    }

    return (data as DbFood[]).map(mapDbFoodToFood);
  },

  async getById(foodId: string): Promise<Food | null> {
    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .eq("id", foodId)
      .is("deleted_at", null)
      .in("data_quality_status", ["partial", "verified"])
      .maybeSingle();

    if (error) {
      console.error("Supabase getById food error:", error);
      throw toReadableError(error, "Failed to fetch food by id.");
    }

    return data ? mapDbFoodToFood(data as DbFood) : null;
  },
};
