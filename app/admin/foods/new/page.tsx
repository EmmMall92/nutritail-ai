"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Food } from "@/types/food";

const initialFood: Food = {
  id: "",
  brand: "",
  name: "",
  species: "dog",
  lifeStage: "adult",
  activitySupport: "normal",
  healthSupport: [],
  protein: 0,
  fat: 0,
  fiber: 0,
  sodium: 0,
  magnesium: 0,
  calcium: 0,
  phosphorus: 0,
  ingredients: [],
  tags: [],
};

export default function NewFoodPage() {
  const router = useRouter();
  const [food, setFood] = useState<Food>(initialFood);
  const [healthSupportText, setHealthSupportText] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof Food>(key: K, value: Food[K]) {
    setFood((prev) => ({ ...prev, [key]: value }));
  }

  function parsePipeList(value: string): string[] {
    return value
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      setError("");

      const payload: Food = {
        ...food,
        id: food.id.trim(),
        brand: food.brand.trim(),
        name: food.name.trim(),
        healthSupport: parsePipeList(healthSupportText),
        ingredients: parsePipeList(ingredientsText),
        tags: parsePipeList(tagsText),
      };

      const response = await fetch("/api/admin/foods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create food.");
      }

      router.push("/admin/foods");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create food.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-bold text-black">Create New Food</h1>
        <p className="mt-2 text-gray-600">
          Add a single food manually to the catalog.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-black">ID</label>
          <input
            value={food.id}
            onChange={(e) => updateField("id", e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
            placeholder="e.g. dog-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">Brand</label>
          <input
            value={food.brand}
            onChange={(e) => updateField("brand", e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-black">Name</label>
          <input
            value={food.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">Species</label>
          <select
            value={food.species}
            onChange={(e) => updateField("species", e.target.value as "dog" | "cat")}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          >
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">Life Stage</label>
          <select
            value={food.lifeStage}
            onChange={(e) =>
              updateField("lifeStage", e.target.value as "young" | "adult" | "senior" | "all")
            }
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          >
            <option value="young">Young</option>
            <option value="adult">Adult</option>
            <option value="senior">Senior</option>
            <option value="all">All</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">Activity Support</label>
          <select
            value={food.activitySupport}
            onChange={(e) =>
              updateField("activitySupport", e.target.value as "low" | "normal" | "high" | "all")
            }
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="all">All</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">Protein</label>
          <input
            type="number"
            value={food.protein}
            onChange={(e) => updateField("protein", Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">Fat</label>
          <input
            type="number"
            value={food.fat}
            onChange={(e) => updateField("fat", Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">Fiber</label>
          <input
            type="number"
            value={food.fiber}
            onChange={(e) => updateField("fiber", Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">Sodium</label>
          <input
            type="number"
            value={food.sodium}
            onChange={(e) => updateField("sodium", Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">Magnesium</label>
          <input
            type="number"
            value={food.magnesium}
            onChange={(e) => updateField("magnesium", Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">Calcium</label>
          <input
            type="number"
            value={food.calcium}
            onChange={(e) => updateField("calcium", Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">Phosphorus</label>
          <input
            type="number"
            value={food.phosphorus}
            onChange={(e) => updateField("phosphorus", Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-black">
            Health Support (use | separator)
          </label>
          <input
            value={healthSupportText}
            onChange={(e) => setHealthSupportText(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
            placeholder="e.g. general|weight control"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-black">
            Ingredients (use | separator)
          </label>
          <input
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
            placeholder="e.g. chicken|rice|corn"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-black">
            Tags (use | separator)
          </label>
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
            placeholder="e.g. adult|general"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg bg-black px-5 py-3 text-white disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Create Food"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/foods")}
          className="rounded-lg border border-black px-5 py-3 text-black"
        >
          Back to Catalog
        </button>
        <a
            href="/admin"
            className="inline-block rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
            >
            Back to Admin Dashboard
            </a>
      </div>
    </main>
  );
}