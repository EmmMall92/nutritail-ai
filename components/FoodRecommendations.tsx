import type { FoodRecommendation } from "@/types/recommendation";

type FoodRecommendationsProps = {
  foods: FoodRecommendation[];
};

export default function FoodRecommendations({
  foods,
}: FoodRecommendationsProps) {
  return (
    <div>
      {foods.length === 0 ? (
        <p className="text-sm text-black">
          No suitable foods found yet for this pet profile.
        </p>
      ) : (
        <div className="space-y-4">
          {foods.map((item) => (
            <div
              key={item.food.id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <p className="font-semibold text-black">
                {item.food.brand} — {item.food.name}
              </p>

              <div className="mt-2 space-y-1 text-sm text-black">
                <p>
                  <span className="font-semibold">Recommendation Score:</span>{" "}
                  {item.score}
                </p>
                <p>
                  <span className="font-semibold">Nutrition Score:</span>{" "}
                  {item.nutritionScore}
                </p>
                <p>
                  <span className="font-semibold">Life Stage:</span>{" "}
                  {item.food.lifeStage}
                </p>
                <p>
                  <span className="font-semibold">Protein:</span>{" "}
                  {item.food.protein}%
                </p>
                <p>
                  <span className="font-semibold">Fat:</span> {item.food.fat}%
                </p>
                <p>
                  <span className="font-semibold">Fiber:</span>{" "}
                  {item.food.fiber}%
                </p>
                <p>
                  <span className="font-semibold">Sodium:</span>{" "}
                  {item.food.sodium}%
                </p>
                <p>
                  <span className="font-semibold">Magnesium:</span>{" "}
                  {item.food.magnesium}%
                </p>
                <p>
                  <span className="font-semibold">Calcium:</span>{" "}
                  {item.food.calcium}%
                </p>
                <p>
                  <span className="font-semibold">Phosphorus:</span>{" "}
                  {item.food.phosphorus}%
                </p>
                <p>
                  <span className="font-semibold">Ingredients:</span>{" "}
                  {item.food.ingredients.join(", ")}
                </p>
                <p>
                  <span className="font-semibold">Tags:</span>{" "}
                  {item.food.tags.join(", ")}
                </p>
              </div>

              <div className="mt-4">
                <p className="mb-2 font-semibold text-black">
                  Recommendation Reasons
                </p>
                <ul className="list-disc pl-5 text-sm text-black">
                  {item.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <p className="mb-2 font-semibold text-black">
                  Nutrition Score Reasons
                </p>
                <ul className="list-disc pl-5 text-sm text-black">
                  {item.nutritionReasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}