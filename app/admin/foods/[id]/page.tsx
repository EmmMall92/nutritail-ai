"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type AdminFood = {
  id: string;
  brand: string;
  name: string;
  species: "dog" | "cat";
  life_stage: string;
  activity_support: string[] | string | null;
  health_support: string[] | string | null;
  protein: number;
  fat: number;
  fiber: number;
  sodium: number;
  magnesium: number;
  calcium: number;
  phosphorus: number;
  ingredients: string[] | string | null;
  tags: string[] | string | null;
  created_at?: string;
  updated_at?: string;
  kcal_per_100g?: number | null;
protein_percent?: number | null;
fat_percent?: number | null;
fiber_percent?: number | null;
sodium_percent?: number | null;
magnesium_percent?: number | null;
calcium_percent?: number | null;
phosphorus_percent?: number | null;
data_quality_status?: "needs_review" | "partial" | "verified" | "unknown";
data_source_url?: string | null;
data_notes?: string | null;
};

function parseCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toCommaText(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

export default function AdminFoodDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [food, setFood] = useState<AdminFood | null>(null);
  const [ingredientsText, setIngredientsText] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [activitySupportText, setActivitySupportText] = useState("");
  const [healthSupportText, setHealthSupportText] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    async function loadFood() {
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

        const loadedFood = result as AdminFood;
        setFood(loadedFood);
        setIngredientsText(toCommaText(loadedFood.ingredients));
        setTagsText(toCommaText(loadedFood.tags));
        setActivitySupportText(toCommaText(loadedFood.activity_support));
        setHealthSupportText(toCommaText(loadedFood.health_support));
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load food.");
      } finally {
        setIsLoading(false);
      }
    }

    if (params?.id) {
      loadFood();
    }
  }, [params]);

  async function handleSave() {
    if (!food) return;

    try {
      setIsSaving(true);
      setError("");
      setSavedMessage("");

      const response = await fetch(`/api/admin/foods/${food.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...food,
          ingredients: parseCommaList(ingredientsText),
          tags: parseCommaList(tagsText),
          activity_support: parseCommaList(activitySupportText),
          health_support: parseCommaList(healthSupportText),
        kcal_per_100g: food.kcal_per_100g ?? null,
protein_percent: food.protein_percent ?? null,
fat_percent: food.fat_percent ?? null,
fiber_percent: food.fiber_percent ?? null,
sodium_percent: food.sodium_percent ?? null,
magnesium_percent: food.magnesium_percent ?? null,
calcium_percent: food.calcium_percent ?? null,
phosphorus_percent: food.phosphorus_percent ?? null,
data_quality_status: food.data_quality_status ?? "needs_review",
data_source_url: food.data_source_url ?? null,
data_notes: food.data_notes ?? null,

        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update food.");
      }

      const updatedFood = result as AdminFood;
      setFood(updatedFood);
      setIngredientsText(toCommaText(updatedFood.ingredients));
      setTagsText(toCommaText(updatedFood.tags));
      setActivitySupportText(toCommaText(updatedFood.activity_support));
      setHealthSupportText(toCommaText(updatedFood.health_support));
      setSavedMessage("Food updated successfully.");

      setTimeout(() => {
        setSavedMessage("");
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update food.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!food) return;

    const confirmed = window.confirm(
     `This will move the food to Trash. You can restore it later.\n\nContinue?`
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      setError("");

      const response = await fetch(`/api/admin/foods/${food.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete food.");
      }

      router.push("/admin/foods");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to delete food.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="space-y-6">
        <p className="text-gray-600">Loading food details...</p>
      </section>
    );
  }

  if (error && !food) {
    return (
      <section className="space-y-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
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
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">
            {food.brand} — {food.name}
          </h2>
          <p className="mt-2 text-gray-600">
            Edit the food record and manage its nutritional profile.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href="/admin/foods"
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Back to Foods
          </a>

          <button
            type="button"
            onClick={async () => {
              try {
                const response = await fetch(`/api/admin/foods/${food.id}/export`, {
                  method: "GET",
                  cache: "no-store",
                });

                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.error || "Failed to export food bundle.");
                }

                const blob = new Blob([JSON.stringify(result, null, 2)], {
                  type: "application/json",
                });

                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `food-bundle-${food.id}.json`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
              } catch (error) {
                console.error(error);
                alert(
                  error instanceof Error ? error.message : "Failed to export food bundle."
                );
              }
            }}
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Export Bundle
          </button>

          <a
            href={`/api/admin/foods/${food.id}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-gray-400 px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Open API
          </a>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {savedMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
          {savedMessage}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Brand
            </label>
            <input
              value={food.brand}
              onChange={(e) =>
                setFood((prev) => (prev ? { ...prev, brand: e.target.value } : prev))
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
                setFood((prev) => (prev ? { ...prev, name: e.target.value } : prev))
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
                  prev ? { ...prev, species: e.target.value as "dog" | "cat" } : prev
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
              Life Stage
            </label>
            <input
              value={food.life_stage}
              onChange={(e) =>
                setFood((prev) =>
                  prev ? { ...prev, life_stage: e.target.value } : prev
                )
              }
              className="w-full rounded-lg border border-gray-300 p-3 text-black"
              placeholder="e.g. puppy, adult, senior"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Protein
            </label>
            <input
              type="number"
              value={food.protein}
              onChange={(e) =>
                setFood((prev) =>
                  prev ? { ...prev, protein: Number(e.target.value) } : prev
                )
              }
              className="w-full rounded-lg border border-gray-300 p-3 text-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Fat
            </label>
            <input
              type="number"
              value={food.fat}
              onChange={(e) =>
                setFood((prev) =>
                  prev ? { ...prev, fat: Number(e.target.value) } : prev
                )
              }
              className="w-full rounded-lg border border-gray-300 p-3 text-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Fiber
            </label>
            <input
              type="number"
              value={food.fiber}
              onChange={(e) =>
                setFood((prev) =>
                  prev ? { ...prev, fiber: Number(e.target.value) } : prev
                )
              }
              className="w-full rounded-lg border border-gray-300 p-3 text-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Sodium
            </label>
            <input
              type="number"
              value={food.sodium}
              onChange={(e) =>
                setFood((prev) =>
                  prev ? { ...prev, sodium: Number(e.target.value) } : prev
                )
              }
              className="w-full rounded-lg border border-gray-300 p-3 text-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Magnesium
            </label>
            <input
              type="number"
              value={food.magnesium}
              onChange={(e) =>
                setFood((prev) =>
                  prev ? { ...prev, magnesium: Number(e.target.value) } : prev
                )
              }
              className="w-full rounded-lg border border-gray-300 p-3 text-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Calcium
            </label>
            <input
              type="number"
              value={food.calcium}
              onChange={(e) =>
                setFood((prev) =>
                  prev ? { ...prev, calcium: Number(e.target.value) } : prev
                )
              }
              className="w-full rounded-lg border border-gray-300 p-3 text-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Phosphorus
            </label>
            <input
              type="number"
              value={food.phosphorus}
              onChange={(e) =>
                setFood((prev) =>
                  prev ? { ...prev, phosphorus: Number(e.target.value) } : prev
                )
              }
              className="w-full rounded-lg border border-gray-300 p-3 text-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-black">
              Ingredients
            </label>
            <input
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-black"
              placeholder="comma separated ingredients"
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
              placeholder="comma separated tags"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Activity Support
            </label>
            <input
              value={activitySupportText}
              onChange={(e) => setActivitySupportText(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-black"
              placeholder="comma separated values"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-black">
              Health Support
            </label>
            <input
              value={healthSupportText}
              onChange={(e) => setHealthSupportText(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-black"
              placeholder="comma separated values"
            />
          </div>
           <div>
  <label className="mb-2 block text-sm font-medium text-black">
    Kcal per 100g
  </label>
  <input
    type="number"
    value={food.kcal_per_100g ?? ""}
    onChange={(e) =>
      setFood((prev) =>
        prev
          ? {
              ...prev,
              kcal_per_100g:
                e.target.value === "" ? null : Number(e.target.value),
            }
          : prev
      )
    }
    className="w-full rounded-lg border border-gray-300 p-3 text-black"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-black">
    Protein %
  </label>
  <input
    type="number"
    value={food.protein_percent ?? ""}
    onChange={(e) =>
      setFood((prev) =>
        prev
          ? {
              ...prev,
              protein_percent:
                e.target.value === "" ? null : Number(e.target.value),
            }
          : prev
      )
    }
    className="w-full rounded-lg border border-gray-300 p-3 text-black"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-black">
    Fat %
  </label>
  <input
    type="number"
    value={food.fat_percent ?? ""}
    onChange={(e) =>
      setFood((prev) =>
        prev
          ? {
              ...prev,
              fat_percent:
                e.target.value === "" ? null : Number(e.target.value),
            }
          : prev
      )
    }
    className="w-full rounded-lg border border-gray-300 p-3 text-black"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-black">
    Fiber %
  </label>
  <input
    type="number"
    value={food.fiber_percent ?? ""}
    onChange={(e) =>
      setFood((prev) =>
        prev
          ? {
              ...prev,
              fiber_percent:
                e.target.value === "" ? null : Number(e.target.value),
            }
          : prev
      )
    }
    className="w-full rounded-lg border border-gray-300 p-3 text-black"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-black">
    Sodium %
  </label>
  <input
    type="number"
    value={food.sodium_percent ?? ""}
    onChange={(e) =>
      setFood((prev) =>
        prev
          ? {
              ...prev,
              sodium_percent:
                e.target.value === "" ? null : Number(e.target.value),
            }
          : prev
      )
    }
    className="w-full rounded-lg border border-gray-300 p-3 text-black"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-black">
    Magnesium %
  </label>
  <input
    type="number"
    value={food.magnesium_percent ?? ""}
    onChange={(e) =>
      setFood((prev) =>
        prev
          ? {
              ...prev,
              magnesium_percent:
                e.target.value === "" ? null : Number(e.target.value),
            }
          : prev
      )
    }
    className="w-full rounded-lg border border-gray-300 p-3 text-black"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-black">
    Calcium %
  </label>
  <input
    type="number"
    value={food.calcium_percent ?? ""}
    onChange={(e) =>
      setFood((prev) =>
        prev
          ? {
              ...prev,
              calcium_percent:
                e.target.value === "" ? null : Number(e.target.value),
            }
          : prev
      )
    }
    className="w-full rounded-lg border border-gray-300 p-3 text-black"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium text-black">
    Phosphorus %
  </label>
  <input
    type="number"
    value={food.phosphorus_percent ?? ""}
    onChange={(e) =>
      setFood((prev) =>
        prev
          ? {
              ...prev,
              phosphorus_percent:
                e.target.value === "" ? null : Number(e.target.value),
            }
          : prev
      )
    }
    className="w-full rounded-lg border border-gray-300 p-3 text-black"
  />
</div>   
<div className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
  <h3 className="text-lg font-semibold text-black">Data Quality</h3>

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
                  data_quality_status: e.target.value as
                    | "needs_review"
                    | "partial"
                    | "verified"
                    | "unknown",
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
        placeholder="π.χ. Values copied from official product page, checked on..."
      />
    </div>
  </div>
</div>  
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-black px-5 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Food Changes"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg border border-red-600 px-5 py-3 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete Food"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}