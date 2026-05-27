"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type DataQualityStatus = "needs_review" | "partial" | "verified" | "unknown";

type AdminFood = {
  id: string;
  brand: string;
  name: string;
  species: string;
  life_stage?: string | null;
  size?: string | null;
  tags?: string[] | string | null;
  ingredients?: string[] | string | null;

  kcal_per_100g?: number | null;
  protein_percent?: number | null;
  fat_percent?: number | null;
  fiber_percent?: number | null;
  sodium_percent?: number | null;
  magnesium_percent?: number | null;
  calcium_percent?: number | null;
  phosphorus_percent?: number | null;

  data_quality_status?: DataQualityStatus;
  data_source_url?: string | null;
  data_notes?: string | null;

  created_at?: string;
  updated_at?: string;
};

function toText(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) return value.join(", ");
  return value ?? "";
}

function parseList(value: string) {
  const seen = new Set<string>();
  const items: string[] = [];

  value
    .split(/[,|\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return;

      seen.add(key);
      items.push(item);
    });

  return items;
}

function toNumberOrNull(value: string) {
  if (value.trim() === "") return null;

  const numberValue = Number(value.replace(",", "."));

  return Number.isFinite(numberValue) ? numberValue : null;
}

function NumberInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-black">
        {label}
      </label>

      <input
        type="number"
        step="any"
        value={value ?? ""}
        onChange={(e) => onChange(toNumberOrNull(e.target.value))}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 p-3 text-black"
      />
    </div>
  );
}

export default function AdminFoodDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [food, setFood] = useState<AdminFood | null>(null);
  const [tagsText, setTagsText] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const isNew = params.id === "new";

  const loadFood = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`/api/admin/foods/${params.id}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load food.");
      }

      const loadedFood = (result.food ?? result) as AdminFood;

      setFood(loadedFood);
      setTagsText(toText(loadedFood.tags));
      setIngredientsText(toText(loadedFood.ingredients));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load food.");
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (isNew) {
      const emptyFood: AdminFood = {
        id: "new",
        brand: "",
        name: "",
        species: "dog",
        life_stage: "",
        size: "",
        tags: [],
        ingredients: [],
        kcal_per_100g: null,
        protein_percent: null,
        fat_percent: null,
        fiber_percent: null,
        sodium_percent: null,
        magnesium_percent: null,
        calcium_percent: null,
        phosphorus_percent: null,
        data_quality_status: "needs_review",
        data_source_url: null,
        data_notes: null,
      };

      setFood(emptyFood);
      setTagsText("");
      setIngredientsText("");
      setIsLoading(false);
      return;
    }

    loadFood();
  }, [isNew, loadFood]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!food) return;

    try {
      setIsSaving(true);
      setError("");
      setSavedMessage("");

      if (!food.brand.trim()) {
        throw new Error("Brand is required.");
      }

      if (!food.name.trim()) {
        throw new Error("Name is required.");
      }

      if (!food.species.trim()) {
        throw new Error("Species is required.");
      }

      const payload = {
        brand: food.brand.trim(),
        name: food.name.trim(),
        species: food.species,
        life_stage: food.life_stage || null,
        size: food.size || null,
        tags: parseList(tagsText),
        ingredients: parseList(ingredientsText),

        kcal_per_100g: food.kcal_per_100g ?? null,
        protein_percent: food.protein_percent ?? null,
        fat_percent: food.fat_percent ?? null,
        fiber_percent: food.fiber_percent ?? null,
        sodium_percent: food.sodium_percent ?? null,
        magnesium_percent: food.magnesium_percent ?? null,
        calcium_percent: food.calcium_percent ?? null,
        phosphorus_percent: food.phosphorus_percent ?? null,

        data_quality_status: food.data_quality_status ?? "needs_review",
        data_source_url: food.data_source_url || null,
        data_notes: food.data_notes || null,
      };

      const response = await fetch(
        isNew ? "/api/admin/foods" : `/api/admin/foods/${food.id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save food.");
      }

      const savedFood = (result.food ?? result) as AdminFood;

      setFood(savedFood);
      setTagsText(toText(savedFood.tags));
      setIngredientsText(toText(savedFood.ingredients));
      setSavedMessage("Food saved successfully.");

      if (isNew && savedFood.id) {
        router.replace(`/admin/foods/${savedFood.id}`);
      }

      setTimeout(() => {
        setSavedMessage("");
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save food.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!food || isNew) return;

    const confirmed = window.confirm(
      "Are you sure you want to move this food to trash?"
    );

    if (!confirmed) return;

    try {
      setIsSaving(true);
      setError("");

      const response = await fetch(`/api/admin/foods/${food.id}`, {
        method: "DELETE",
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete food.");
      }

      router.push("/admin/foods");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to delete food.");
    } finally {
      setIsSaving(false);
    }
  }

  const completeness = useMemo(() => {
    if (!food) return { filled: 0, total: 8 };

    const values = [
      food.kcal_per_100g,
      food.protein_percent,
      food.fat_percent,
      food.fiber_percent,
      food.sodium_percent,
      food.magnesium_percent,
      food.calcium_percent,
      food.phosphorus_percent,
    ];

    const filled = values.filter(
      (value) => typeof value === "number" && Number.isFinite(value)
    ).length;

    return {
      filled,
      total: values.length,
    };
  }, [food]);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-black">Loading food...</p>
          <p className="mt-2 text-sm text-gray-600">
            We are fetching product details and nutrition fields.
          </p>
        </div>
      </section>
    );
  }

  if (!food) {
    return (
      <section className="space-y-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          Food not found.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">
            {isNew ? "Add Food" : "Edit Food"}
          </h1>

          <p className="mt-2 text-gray-600">
            Manage product details, nutrition data, ingredients and data quality.
          </p>
        </div>

        <Link
          href="/admin/foods"
          className="rounded-xl border border-black px-4 py-2 text-center text-sm text-black transition hover:bg-gray-100"
        >
          Back to Foods
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {savedMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {savedMessage}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-2"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Brand
          </label>

          <input
            value={food.brand}
            onChange={(e) =>
              setFood((prev) =>
                prev ? { ...prev, brand: e.target.value } : prev
              )
            }
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Name
          </label>

          <input
            value={food.name}
            onChange={(e) =>
              setFood((prev) =>
                prev ? { ...prev, name: e.target.value } : prev
              )
            }
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Species
          </label>

          <select
            value={food.species}
            onChange={(e) =>
              setFood((prev) =>
                prev ? { ...prev, species: e.target.value } : prev
              )
            }
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          >
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Life stage
          </label>

          <input
            value={food.life_stage ?? ""}
            onChange={(e) =>
              setFood((prev) =>
                prev ? { ...prev, life_stage: e.target.value || null } : prev
              )
            }
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
            placeholder="adult, puppy, kitten, senior..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Size
          </label>

          <input
            value={food.size ?? ""}
            onChange={(e) =>
              setFood((prev) =>
                prev ? { ...prev, size: e.target.value || null } : prev
              )
            }
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
            placeholder="small, medium, large..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Tags
          </label>

          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
            placeholder="sterilised, sensitive, grain-free..."
          />
        </div>

        <div className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-black">
              Nutrition Data
            </h2>

            <p className="text-sm text-gray-600">
              {completeness.filled}/{completeness.total} complete
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <NumberInput
              label="Kcal per 100g"
              value={food.kcal_per_100g}
              onChange={(value) =>
                setFood((prev) =>
                  prev ? { ...prev, kcal_per_100g: value } : prev
                )
              }
            />

            <NumberInput
              label="Protein %"
              value={food.protein_percent}
              onChange={(value) =>
                setFood((prev) =>
                  prev ? { ...prev, protein_percent: value } : prev
                )
              }
            />

            <NumberInput
              label="Fat %"
              value={food.fat_percent}
              onChange={(value) =>
                setFood((prev) =>
                  prev ? { ...prev, fat_percent: value } : prev
                )
              }
            />

            <NumberInput
              label="Fiber %"
              value={food.fiber_percent}
              onChange={(value) =>
                setFood((prev) =>
                  prev ? { ...prev, fiber_percent: value } : prev
                )
              }
            />

            <NumberInput
              label="Sodium %"
              value={food.sodium_percent}
              onChange={(value) =>
                setFood((prev) =>
                  prev ? { ...prev, sodium_percent: value } : prev
                )
              }
            />

            <NumberInput
              label="Magnesium %"
              value={food.magnesium_percent}
              onChange={(value) =>
                setFood((prev) =>
                  prev ? { ...prev, magnesium_percent: value } : prev
                )
              }
            />

            <NumberInput
              label="Calcium %"
              value={food.calcium_percent}
              onChange={(value) =>
                setFood((prev) =>
                  prev ? { ...prev, calcium_percent: value } : prev
                )
              }
            />

            <NumberInput
              label="Phosphorus %"
              value={food.phosphorus_percent}
              onChange={(value) =>
                setFood((prev) =>
                  prev ? { ...prev, phosphorus_percent: value } : prev
                )
              }
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-black">
            Ingredients
          </label>

          <textarea
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
            placeholder="chicken, rice, salmon oil, minerals..."
          />
        </div>

        <div className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h2 className="text-lg font-semibold text-black">Data Quality</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-black">
                Status
              </label>

              <select
                value={food.data_quality_status ?? "needs_review"}
                onChange={(e) =>
                  setFood((prev) =>
                    prev
                      ? {
                          ...prev,
                          data_quality_status: e.target
                            .value as DataQualityStatus,
                        }
                      : prev
                  )
                }
                className="w-full rounded-lg border border-gray-300 p-3 text-black"
              >
                <option value="needs_review">Needs review</option>
                <option value="partial">Partial</option>
                <option value="verified">Verified</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black">
                Data source URL
              </label>

              <input
                value={food.data_source_url ?? ""}
                onChange={(e) =>
                  setFood((prev) =>
                    prev
                      ? {
                          ...prev,
                          data_source_url: e.target.value || null,
                        }
                      : prev
                  )
                }
                className="w-full rounded-lg border border-gray-300 p-3 text-black"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-black">
                Data notes
              </label>

              <textarea
                value={food.data_notes ?? ""}
                onChange={(e) =>
                  setFood((prev) =>
                    prev
                      ? {
                          ...prev,
                          data_notes: e.target.value || null,
                        }
                      : prev
                  )
                }
                rows={3}
                className="w-full rounded-lg border border-gray-300 p-3 text-black"
                placeholder="Values copied from official product page..."
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-black px-6 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Food"}
          </button>

          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="rounded-xl border border-red-600 px-6 py-3 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              Move to Trash
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
