import type { Pet } from "@/types/pet";
import type { PetNutritionSession } from "@/types/nutrition";

const SESSION_STORAGE_KEY = "nutritail_pet_session";
const PETS_STORAGE_KEY = "nutritail_saved_pets";
const EDITING_PET_KEY = "nutritail_editing_pet";

export function savePetSession(data: PetNutritionSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
}

export function getPetSession(): PetNutritionSession | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PetNutritionSession;
  } catch {
    return null;
  }
}

export function clearPetSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function getAllSavedPetsRaw(): Pet[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(PETS_STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as Pet[];
  } catch {
    return [];
  }
}

export function getSavedPets(ownerId?: string): Pet[] {
  const allPets = getAllSavedPetsRaw();

  if (!ownerId) return allPets;

  return allPets.filter((pet) => pet.ownerId === ownerId);
}

export function savePetToLibrary(pet: Pet) {
  if (typeof window === "undefined") return;

  const existingPets = getAllSavedPetsRaw();
  const existingIndex = existingPets.findIndex((item) => item.id === pet.id);

  let updatedPets: Pet[];

  if (existingIndex >= 0) {
    updatedPets = [...existingPets];
    updatedPets[existingIndex] = pet;
  } else {
    updatedPets = [pet, ...existingPets];
  }

  localStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(updatedPets));
}

export function deletePetFromLibrary(petId: string) {
  if (typeof window === "undefined") return;

  const existingPets = getAllSavedPetsRaw();
  const updatedPets = existingPets.filter((pet) => pet.id !== petId);

  localStorage.setItem(PETS_STORAGE_KEY, JSON.stringify(updatedPets));
}

export function getPetById(petId: string): Pet | null {
  const pets = getAllSavedPetsRaw();
  return pets.find((pet) => pet.id === petId) ?? null;
}

export function clearSavedPets() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PETS_STORAGE_KEY);
}

export function saveEditingPet(pet: Pet) {
  if (typeof window === "undefined") return;
  localStorage.setItem(EDITING_PET_KEY, JSON.stringify(pet));
}

export function getEditingPet(): Pet | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(EDITING_PET_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Pet;
  } catch {
    return null;
  }
}

export function clearEditingPet() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EDITING_PET_KEY);
}