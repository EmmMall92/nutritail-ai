import type { DbPet } from "@/types/db/db-pet";
import type { Pet } from "@/types/pet";

export function mapDbPetToPet(dbPet: DbPet): Pet {
  return {
    id: dbPet.id,
    ownerId: dbPet.owner_id,
    name: dbPet.name,
    species: dbPet.species,
    breed: dbPet.breed,
    age: dbPet.age,
    weight: dbPet.weight,
    activityLevel: dbPet.activity_level,
    neutered: dbPet.neutered,
    allergies: dbPet.allergies,
    healthIssues: dbPet.health_issues,
  };
}

export function mapPetToDbPet(pet: Pet): DbPet {
  const now = new Date().toISOString();

  return {
    id: pet.id,
    owner_id: pet.ownerId,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    age: pet.age,
    weight: pet.weight,
    activity_level: pet.activityLevel,
    neutered: pet.neutered,
    allergies: pet.allergies ?? [],
    health_issues: pet.healthIssues ?? [],
    created_at: now,
    updated_at: now,
  };
}