import type { Pet } from "@/types/pet";
import type { NutritionResult } from "@/lib/nutrition";

type PetSummaryStatsProps = {
  pet: Pet;
  nutrition: NutritionResult;
};

export default function PetSummaryStats({
  pet,
  nutrition,
}: PetSummaryStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-600">Pet</p>
        <p className="mt-2 text-lg font-semibold text-black">{pet.name}</p>
        <p className="text-sm text-black">
          {pet.species} • {pet.breed}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-600">Age & Weight</p>
        <p className="mt-2 text-lg font-semibold text-black">{pet.age} years</p>
        <p className="text-sm text-black">{pet.weight} kg</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-600">RER</p>
        <p className="mt-2 text-lg font-semibold text-black">
          {nutrition.rer} kcal
        </p>
        <p className="text-sm text-black">Resting Energy Requirement</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-600">DER</p>
        <p className="mt-2 text-lg font-semibold text-black">
          {nutrition.der} kcal
        </p>
        <p className="text-sm text-black">Daily Energy Requirement</p>
      </div>
    </div>
  );
}