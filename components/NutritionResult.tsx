import type { NutritionResult as NutritionResultType } from "@/lib/nutrition";

type NutritionResultProps = {
  result: NutritionResultType;
};

export default function NutritionResult({ result }: NutritionResultProps) {
  return (
    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
      <p className="text-black">
        <span className="font-semibold">Protein:</span> {result.protein}
      </p>
      <p className="text-black">
        <span className="font-semibold">Fat:</span> {result.fat}
      </p>
      <p className="text-black">
        <span className="font-semibold">Fiber:</span> {result.fiber}
      </p>
      <p className="text-black">
        <span className="font-semibold">Sodium:</span> {result.sodium}
      </p>
      <p className="text-black">
        <span className="font-semibold">Magnesium:</span> {result.magnesium}
      </p>
      <p className="text-black">
        <span className="font-semibold">Calcium:</span> {result.calcium}
      </p>
      <p className="text-black">
        <span className="font-semibold">Phosphorus:</span> {result.phosphorus}
      </p>
    </div>
  );
}