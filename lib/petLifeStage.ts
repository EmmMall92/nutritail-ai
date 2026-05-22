import type { Pet, PetLifeStage } from "@/types/pet";

export function getPetLifeStage(pet: Pet): PetLifeStage {
  if (pet.species === "dog") {
    if (pet.age < 1) return "young";
    if (pet.age >= 7) return "senior";
    return "adult";
  }

  if (pet.age < 1) return "young";
  if (pet.age >= 10) return "senior";
  return "adult";
}