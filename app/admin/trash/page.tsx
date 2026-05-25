"use client";

import { useEffect, useState } from "react";

type TrashPet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  deleted_at: string;
};

type TrashFood = {
  id: string;
  brand: string;
  name: string;
  species: string;
  deleted_at: string;
};

type TrashResponse = {
  pets: TrashPet[];
  foods: TrashFood[];
};

export default function AdminTrashPage() {
  const [data, setData] = useState<TrashResponse>({ pets: [], foods: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [restoringId, setRestoringId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadTrash() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/admin/trash", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load trash.");
      }

      setData(result as TrashResponse);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load trash.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTrash();
  }, []);

  async function restoreRecord(type: "pet" | "food", id: string) {
    try {
      setRestoringId(`${type}-${id}`);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/admin/trash/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to restore record.");
      }

      await loadTrash();
      setSuccessMessage(
        `${type === "pet" ? "Pet" : "Food"} restored successfully.`
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to restore record.");
    } finally {
      setRestoringId("");
    }
  }

  const total = data.pets.length + data.foods.length;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black">Trash</h2>
        <p className="mt-2 text-gray-600">
          Review and restore soft-deleted pet and food records.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-600">Loading trash...</p>
        ) : total === 0 ? (
          <p className="text-sm text-gray-600">Trash is empty.</p>
        ) : (
          <div className="space-y-6">
            {/* PETS */}
            <div>
              <h3 className="text-xl font-semibold text-black">Deleted Pets</h3>

              <div className="mt-3 space-y-3">
                {data.pets.length === 0 ? (
                  <p className="text-sm text-gray-600">No deleted pets.</p>
                ) : (
                  data.pets.map((pet) => (
                    <div
                      key={pet.id}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <p className="font-semibold text-black">
                        {pet.name} - {pet.breed || "Unknown breed"}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {pet.species} / deleted{" "}
                        {new Date(pet.deleted_at).toLocaleString()}
                      </p>

                      <button
                        type="button"
                        onClick={() => restoreRecord("pet", pet.id)}
                        disabled={restoringId === `pet-${pet.id}`}
                        className="mt-3 rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-white disabled:opacity-50"
                      >
                        {restoringId === `pet-${pet.id}`
                          ? "Restoring..."
                          : "Restore Pet"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* FOODS */}
            <div>
              <h3 className="text-xl font-semibold text-black">Deleted Foods</h3>

              <div className="mt-3 space-y-3">
                {data.foods.length === 0 ? (
                  <p className="text-sm text-gray-600">No deleted foods.</p>
                ) : (
                  data.foods.map((food) => (
                    <div
                      key={food.id}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <p className="font-semibold text-black">
                        {food.brand} - {food.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {food.species} / deleted{" "}
                        {new Date(food.deleted_at).toLocaleString()}
                      </p>

                      <button
                        type="button"
                        onClick={() => restoreRecord("food", food.id)}
                        disabled={restoringId === `food-${food.id}`}
                        className="mt-3 rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-white disabled:opacity-50"
                      >
                        {restoringId === `food-${food.id}`
                          ? "Restoring..."
                          : "Restore Food"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
