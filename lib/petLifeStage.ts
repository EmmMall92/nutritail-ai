import type { Pet, PetLifeStage } from "@/types/pet";

export function getPetLifeStage(pet: Pet): PetLifeStage {
  const age = Number(pet.age);

  if (!Number.isFinite(age) || age < 0) {
    return "adult";
  }

  if (pet.species === "dog") {
    if (age < 1) return "young";
    if (age >= 7) return "senior";
    return "adult";
  }

  if (age < 1) return "young";
  if (age >= 10) return "senior";
  return "adult";
}
