"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import { editingPetRepository } from "@/repositories/editingPetRepository";
import { sessionRepository } from "@/repositories/sessionRepository";
import { petAnalysisHistoryService } from "@/services/petAnalysisHistoryService";
import { buildPetAnalysisHistoryRecord } from "@/services/petAnalysisHistoryBuilder";
import { petAnalysisService } from "@/services/petAnalysisService";
import { petLibraryService } from "@/services/petLibraryService";
import type { Pet } from "@/types/pet";

type FormErrors = {
  name?: string;
  breed?: string;
  age?: string;
  weight?: string;
};

const initialPet: Pet = {
  id: "",
  ownerId: "",
  name: "",
  species: "dog",
  breed: "",
  age: 1,
  weight: 1,
  activityLevel: "normal",
  neutered: false,
  allergies: [],
  healthIssues: [],
};

export default function PetForm() {
  const router = useRouter();
  const [pet, setPet] = useState<Pet>(initialPet);
  const [allergiesText, setAllergiesText] = useState("");
  const [healthIssuesText, setHealthIssuesText] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const editingPet = editingPetRepository.get();

    if (!editingPet) return;

    setPet(editingPet);
    setAllergiesText(editingPet.allergies?.join(", ") ?? "");
    setHealthIssuesText(editingPet.healthIssues?.join(", ") ?? "");
    setIsEditing(true);
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setPet((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    setPet((prev) => ({
      ...prev,
      [name]: name === "age" || name === "weight" ? Number(value) : value,
    }));
  }

  function validateForm() {
    const newErrors: FormErrors = {};

    if (!pet.name.trim()) {
      newErrors.name = "Pet name is required.";
    }

    if (!pet.breed.trim()) {
      newErrors.breed = "Breed is required.";
    }

    if (!Number.isFinite(pet.age) || pet.age < 0) {
      newErrors.age = "Age must be 0 or greater.";
    }

    if (!Number.isFinite(pet.weight) || pet.weight <= 0) {
      newErrors.weight = "Weight must be greater than 0.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function parseCommaSeparatedList(value: string) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const currentUser = getCurrentUser();

      const formattedPet: Pet = {
        ...pet,
        id: pet.id || crypto.randomUUID(),
        ownerId: pet.ownerId || currentUser.id,
        name: pet.name.trim(),
        breed: pet.breed.trim(),
        allergies: parseCommaSeparatedList(allergiesText),
        healthIssues: parseCommaSeparatedList(healthIssuesText),
      };

      const savedPet = await petLibraryService.savePet(formattedPet);

      const analysis = await petAnalysisService.analyzePet(savedPet);

      const historyRecord = buildPetAnalysisHistoryRecord(savedPet, analysis);
      await petAnalysisHistoryService.saveAnalysis(historyRecord);

      sessionRepository.save({
        pet: savedPet,
        nutrition: analysis.nutrition,
      });

      editingPetRepository.clear();
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to save pet profile:", error);
      alert("Failed to save pet profile.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-black">
          Pet Name
        </label>
        <input
          type="text"
          name="name"
          value={pet.name}
          onChange={handleChange}
          placeholder="e.g. Max"
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        />
        {errors.name && (
          <p className="mt-2 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-black">
          Species
        </label>
        <select
          name="species"
          value={pet.species}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        >
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-black">
          Breed
        </label>
        <input
          type="text"
          name="breed"
          value={pet.breed}
          onChange={handleChange}
          placeholder="e.g. Labrador Retriever"
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        />
        {errors.breed && (
          <p className="mt-2 text-sm text-red-600">{errors.breed}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Age (years)
          </label>
          <input
            type="number"
            name="age"
            value={pet.age}
            onChange={handleChange}
            min={0}
            step={0.1}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
          {errors.age && (
            <p className="mt-2 text-sm text-red-600">{errors.age}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Weight (kg)
          </label>
          <input
            type="number"
            name="weight"
            value={pet.weight}
            onChange={handleChange}
            min={0}
            step={0.1}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
          {errors.weight && (
            <p className="mt-2 text-sm text-red-600">{errors.weight}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-black">
          Activity Level
        </label>
        <select
          name="activityLevel"
          value={pet.activityLevel}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="neutered"
          type="checkbox"
          name="neutered"
          checked={pet.neutered}
          onChange={handleChange}
          className="h-4 w-4"
        />
        <label htmlFor="neutered" className="text-sm font-medium text-black">
          Neutered / Spayed
        </label>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-black">
          Allergies
        </label>
        <input
          type="text"
          value={allergiesText}
          onChange={(e) => setAllergiesText(e.target.value)}
          placeholder="e.g. chicken, beef, wheat"
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        />
        <p className="mt-1 text-xs text-gray-700">
          Separate multiple allergies with commas.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-black">
          Health Issues
        </label>
        <input
          type="text"
          value={healthIssuesText}
          onChange={(e) => setHealthIssuesText(e.target.value)}
          placeholder="e.g. obesity, kidney support, sensitive stomach"
          className="w-full rounded-lg border border-gray-300 p-3 text-black"
        />
        <p className="mt-1 text-xs text-gray-700">
          Separate multiple items with commas.
        </p>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-black py-3 font-medium text-white transition hover:opacity-90"
      >
        {isEditing ? "Update Pet Profile" : "Save Pet Profile"}
      </button>
    </form>
  );
}