"use client";

import { useEffect, useState } from "react";
import { getFoodLabelsMap } from "@/services/foodLabelService";
import type { PetAnalysisComparison } from "@/services/petAnalysisComparisonService";

type Props = {
  comparison: PetAnalysisComparison;
};

function formatDelta(value: number) {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

export default function PetAnalysisComparison({ comparison }: Props) {
  const [foodLabels, setFoodLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadFoodLabels() {
      const allIds = [
        ...comparison.previousFoodIds,
        ...comparison.currentFoodIds,
        ...comparison.addedFoodIds,
        ...comparison.removedFoodIds,
      ];

      if (allIds.length === 0) {
        setFoodLabels({});
        return;
      }

      const result = await getFoodLabelsMap(allIds);
      setFoodLabels(result);
    }

    loadFoodLabels();
  }, [comparison]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-black">
          Latest Analysis Comparison
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Compare the latest plan with the previous saved one.
        </p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="mb-2 font-semibold text-black">Summary</p>
        <ul className="list-disc pl-5 text-sm text-black">
          {comparison.summary.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">Resting calories</p>
          <p className="mt-2 text-sm text-black">
            Previous:{" "}
            <span className="font-semibold">{comparison.previousRer}</span>
          </p>
          <p className="text-sm text-black">
            Current:{" "}
            <span className="font-semibold">{comparison.currentRer}</span>
          </p>
          <p className="text-sm text-black">
            Delta:{" "}
            <span className="font-semibold">
              {formatDelta(comparison.rerDelta)}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">Daily target</p>
          <p className="mt-2 text-sm text-black">
            Previous:{" "}
            <span className="font-semibold">{comparison.previousMer}</span>
          </p>
          <p className="text-sm text-black">
            Current:{" "}
            <span className="font-semibold">{comparison.currentMer}</span>
          </p>
          <p className="text-sm text-black">
            Delta:{" "}
            <span className="font-semibold">
              {formatDelta(comparison.merDelta)}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">Weight</p>
          <p className="mt-2 text-sm text-black">
            Previous:{" "}
            <span className="font-semibold">
              {comparison.previousWeight ?? "-"}
            </span>
          </p>
          <p className="text-sm text-black">
            Current:{" "}
            <span className="font-semibold">
              {comparison.currentWeight ?? "-"}
            </span>
          </p>
          <p className="text-sm text-black">
            Delta:{" "}
            <span className="font-semibold">
              {comparison.weightDelta === undefined
                ? "-"
                : formatDelta(comparison.weightDelta)}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="mb-2 font-semibold text-black">New food signals</p>
          {comparison.addedFoodIds.length === 0 ? (
            <p className="text-sm text-gray-600">No newly added foods.</p>
          ) : (
            <ul className="list-disc pl-5 text-sm text-black">
              {comparison.addedFoodIds.map((id) => (
                <li key={id}>{foodLabels[id] ?? id}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="mb-2 font-semibold text-black">Removed food signals</p>
          {comparison.removedFoodIds.length === 0 ? (
            <p className="text-sm text-gray-600">No removed foods.</p>
          ) : (
            <ul className="list-disc pl-5 text-sm text-black">
              {comparison.removedFoodIds.map((id) => (
                <li key={id}>{foodLabels[id] ?? id}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
