import type { Pet } from "@/types/pet";

export async function fetchPets(): Promise<Pet[]> {
  const response = await fetch("/api/pets", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch pets.");
  }

  return response.json();
}

export async function savePet(pet: Pet): Promise<Pet> {
  const response = await fetch("/api/pets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pet),
  });

  if (!response.ok) {
    throw new Error("Failed to save pet.");
  }

  const data = await response.json();
  return data.pet as Pet;
}

export async function deletePet(petId: string): Promise<void> {
  const response = await fetch(`/api/pets/${petId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete pet.");
  }
}