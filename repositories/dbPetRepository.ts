import { mapDbPetToPet, mapPetToDbPet } from "@/mappers/petMapper";
import type { DbPet } from "@/types/db/db-pet";
import type { Pet } from "@/types/pet";

const DB_PETS_STORAGE_KEY = "nutritail_db_pets";

function getAllDbPets(): DbPet[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(DB_PETS_STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as DbPet[];
  } catch {
    return [];
  }
}

function saveAllDbPets(dbPets: DbPet[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DB_PETS_STORAGE_KEY, JSON.stringify(dbPets));
}

export const dbPetRepository = {
  getAllByOwner(ownerId: string): Pet[] {
    const dbPets = getAllDbPets().filter((pet) => pet.owner_id === ownerId);
    return dbPets.map(mapDbPetToPet);
  },

  getById(petId: string): Pet | null {
    const dbPet = getAllDbPets().find((pet) => pet.id === petId);
    return dbPet ? mapDbPetToPet(dbPet) : null;
  },

  save(pet: Pet): Pet {
    const dbPets = getAllDbPets();
    const dbPet = mapPetToDbPet(pet);

    const existingIndex = dbPets.findIndex((item) => item.id === dbPet.id);

    let updatedDbPets: DbPet[];

    if (existingIndex >= 0) {
      const existingCreatedAt = dbPets[existingIndex].created_at;

      updatedDbPets = [...dbPets];
      updatedDbPets[existingIndex] = {
        ...dbPet,
        created_at: existingCreatedAt,
        updated_at: new Date().toISOString(),
      };
    } else {
      updatedDbPets = [dbPet, ...dbPets];
    }

    saveAllDbPets(updatedDbPets);

    return mapDbPetToPet(
      updatedDbPets.find((item) => item.id === dbPet.id) as DbPet
    );
  },

  delete(petId: string): void {
    const dbPets = getAllDbPets();
    const updatedDbPets = dbPets.filter((pet) => pet.id !== petId);

    saveAllDbPets(updatedDbPets);
  },
};