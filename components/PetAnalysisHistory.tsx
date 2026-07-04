"use client";

import { useEffect, useMemo, useState } from "react";
import { getFoodLabelsMap } from "@/services/foodLabelService";
import type { PetAnalysisHistory } from "@/types/pet-analysis-history";

type Props = {
  history: PetAnalysisHistory[];
  loading?: boolean;
};

type FilterMode = "all" | "recent5" | "withWeight";

export default function PetAnalysisHistory({ history, loading }: Props) {
  const [foodLabels, setFoodLabels] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  useEffect(() => {
    async function loadFoodLabels() {
      const allFoodIds = history.flatMap((item) => item.recommendedFoodIds);

      if (allFoodIds.length === 0) {
        setFoodLabels({});
        return;
      }

      const result = await getFoodLabelsMap(allFoodIds);
      setFoodLabels(result);
    }

    loadFoodLabels();
  }, [history]);

  const filteredHistory = useMemo(() => {
    let items = [...history];

    if (filterMode === "recent5") {
      items = items.slice(0, 5);
    }

    if (filterMode === "withWeight") {
      items = items.filter((item) => typeof item.weight === "number");
    }

    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter((item) => {
      const foodsText = item.recommendedFoodIds
        .map((id) => foodLabels[id] ?? id)
        .join(" ")
        .toLowerCase();

      const allergiesText = item.allergies.join(" ").toLowerCase();
      const healthIssuesText = item.healthIssues.join(" ").toLowerCase();
      const activityText = (item.activityLevel ?? "").toLowerCase();
      const notesText = (item.notes ?? "").toLowerCase();
      const dateText = new Date(item.createdAt).toLocaleString().toLowerCase();

      return (
        foodsText.includes(term) ||
        allergiesText.includes(term) ||
        healthIssuesText.includes(term) ||
        activityText.includes(term) ||
        notesText.includes(term) ||
        dateText.includes(term)
      );
    });
  }, [history, search, filterMode, foodLabels]);

  if (loading) {
    return <div className="rounded-xl border p-4">Loading history...</div>;
  }

  if (history.length === 0) {
    return <div className="rounded-xl border p-4">No analysis history yet.</div>;
  }

  return (
    <div className="rounded-xl border p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-black">Analysis History</h3>
        <p className="mt-1 text-sm text-gray-600">
          Browse previous nutrition analyses for this pet.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-black">
            Search history
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by food, allergies, health issues, notes..."
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Filter
          </label>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as FilterMode)}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          >
            <option value="all">All entries</option>
            <option value="recent5">Last 5 analyses</option>
            <option value="withWeight">Only entries with weight</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Showing {filteredHistory.length} of {history.length} analyses.
      </p>

      <div className="space-y-3">
        {filteredHistory.map((item) => (
          <div key={item.id} className="rounded-lg border p-3 text-sm space-y-1">
            <div>Date: {new Date(item.createdAt).toLocaleString()}</div>
            <div>Resting calories: {item.rer} kcal/day</div>
            <div>Daily target: {item.mer} kcal/day</div>
            <div>Weight: {item.weight ?? "-"} kg</div>
            <div>Age: {item.age ?? "-"}</div>
            <div>Activity: {item.activityLevel ?? "-"}</div>
            <div>
              Neutered:{" "}
              {item.neutered === undefined ? "-" : item.neutered ? "Yes" : "No"}
            </div>
            <div>
              Allergies:{" "}
              {item.allergies.length > 0 ? item.allergies.join(", ") : "None"}
            </div>
            <div>
              Health Issues:{" "}
              {item.healthIssues.length > 0
                ? item.healthIssues.join(", ")
                : "None"}
            </div>
            <div>
              Foods:{" "}
              {item.recommendedFoodIds.length > 0
                ? item.recommendedFoodIds
                    .map((id) => foodLabels[id] ?? id)
                    .join(", ")
                : "None"}
            </div>
            {item.notes && <div>Notes: {item.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
