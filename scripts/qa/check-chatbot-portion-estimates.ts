import { calculateMainFoodPortionEstimate } from "@/lib/chatbot/portionEstimate";

type Case = {
  label: string;
  finalDailyCalories: number;
  kcalPer100g: number;
  expectedMainFoodCalories: number;
  expectedMaxTreatCalories: number;
  expectedGramsPerDay: number;
};

const cases: Case[] = [
  {
    label: "small sterilised dog maintenance",
    finalDailyCalories: 322,
    kcalPer100g: 338.8,
    expectedMainFoodCalories: 290,
    expectedMaxTreatCalories: 32,
    expectedGramsPerDay: 86,
  },
  {
    label: "medium dog maintenance",
    finalDailyCalories: 630,
    kcalPer100g: 344.2,
    expectedMainFoodCalories: 567,
    expectedMaxTreatCalories: 63,
    expectedGramsPerDay: 165,
  },
  {
    label: "large dog maintenance",
    finalDailyCalories: 2106,
    kcalPer100g: 332,
    expectedMainFoodCalories: 1895,
    expectedMaxTreatCalories: 211,
    expectedGramsPerDay: 571,
  },
];

function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

for (const testCase of cases) {
  const result = calculateMainFoodPortionEstimate({
    finalDailyCalories: testCase.finalDailyCalories,
    kcalPer100g: testCase.kcalPer100g,
  });

  if (!result) {
    throw new Error(`${testCase.label}: expected a portion estimate`);
  }

  assertEqual(
    `${testCase.label} main food calories`,
    result.mainFoodCalories,
    testCase.expectedMainFoodCalories
  );
  assertEqual(
    `${testCase.label} max treat calories`,
    result.maxTreatCalories,
    testCase.expectedMaxTreatCalories
  );
  assertEqual(
    `${testCase.label} grams per day`,
    result.gramsPerDay,
    testCase.expectedGramsPerDay
  );
}

const invalid = calculateMainFoodPortionEstimate({
  finalDailyCalories: 630,
  kcalPer100g: null,
});

if (invalid !== null) {
  throw new Error("missing kcalPer100g should not produce a portion estimate");
}

console.log(
  JSON.stringify(
    {
      status: "pass",
      checkedCases: cases.length,
      rule: "grams_per_day_uses_main_food_calories_after_10_percent_treat_allowance",
    },
    null,
    2
  )
);
