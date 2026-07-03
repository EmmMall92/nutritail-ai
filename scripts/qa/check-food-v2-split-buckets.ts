import {
  splitFoodV2Recommendations,
  type FoodV2RankingResult,
} from "@/lib/food-v2/recommendationRanking";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function ranking(
  formulaKey: string,
  bucket: FoodV2RankingResult["bucket"],
  totalScore: number,
  valueScore: number
): FoodV2RankingResult {
  return {
    formula_key: formulaKey,
    display_name: formulaKey.replaceAll("-", " "),
    brand: formulaKey.split("-")[0] ?? "QA",
    total_score: totalScore,
    fit_score: totalScore,
    quality_score: totalScore,
    value_score: valueScore,
    confidence: "high",
    bucket,
    value_tier: bucket === "value" ? "value_candidate" : "premium_candidate",
    reasons: ["QA split bucket fixture."],
    cautions: [],
    signals: [],
  };
}

const rankings: FoodV2RankingResult[] = [
  ranking("premium-one", "premium", 92, 60),
  ranking("premium-two", "premium", 88, 58),
  ranking("premium-three", "premium", 84, 57),
  ranking("value-one", "value", 96, 94),
  ranking("value-two", "value", 91, 92),
  ranking("value-three", "value", 86, 90),
  ranking("value-four", "value", 81, 88),
  ranking("value-five", "value", 78, 86),
  ranking("value-six", "value", 75, 84),
];

const split = splitFoodV2Recommendations(rankings, 3, "sterilised");

assert(
  split.premium.length === 3,
  `Expected 3 first choices, got ${split.premium.length}.`
);
assert(
  split.value.length === 3,
  `Expected 3 practical alternatives, got ${split.value.length}.`
);
assert(
  split.premium[0]?.formula_key === "value-one",
  "First-choice section must keep the best overall food, even when it is internally value-positioned."
);
assert(
  split.value.every((item) => !split.premium.some((top) => top.formula_key === item.formula_key)),
  "Practical alternatives must not duplicate the first-choice foods."
);
assert(
  split.value.every((item) => item.value_score >= 84),
  "Practical alternatives should be chosen by value strength after first-choice foods are removed."
);
assert(
  !split.premium.some((premium) =>
    split.value.some((value) => value.formula_key === premium.formula_key)
  ),
  "Premium and value sections must not duplicate the same formula."
);

console.log("Food V2 split bucket contract passed.");
