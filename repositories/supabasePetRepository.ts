import { supabase } from "@/lib/db/supabase";
import { mapDbPetToPet, mapPetToDbPet } from "@/mappers/petMapper";
import type { Pet } from "@/types/pet";
import type { DbPet } from "@/types/db/db-pet";

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

export const supabasePetRepository = {
  async getAllByOwner(ownerId: string): Promise<Pet[]> {
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase getAllByOwner error:", error);
      throw toReadableError(error, "Failed to fetch pets from Supabase.");
    }

    return (data as DbPet[]).map(mapDbPetToPet);
  },

  async save(pet: Pet): Promise<Pet> {
    const dbPet = mapPetToDbPet(pet);

    const { data, error } = await supabase
      .from("pets")
      .upsert(dbPet)
      .select()
      .single();

    if (error) {
      console.error("Supabase save pet error:", error);
      throw toReadableError(error, "Failed to save pet to Supabase.");
    }

    return mapDbPetToPet(data as DbPet);
  },

  async delete(petId: string): Promise<void> {
    const { error } = await supabase.from("pets").delete().eq("id", petId);

    if (error) {
      console.error("Supabase delete pet error:", error);
      throw toReadableError(error, "Failed to delete pet from Supabase.");
    }
  },
};