import {
  rankFoodV2ForPet,
  splitFoodV2Recommendations,
} from "@/lib/food-v2/recommendationRanking";
import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";

function catFood(overrides: Partial<FoodProductV2>): FoodProductV2 {
  return {
    id: overrides.id ?? "qa-cat-food",
    brand: overrides.brand ?? "QA Cat",
    formula_name: overrides.formula_name ?? overrides.display_name ?? "Adult Chicken",
    display_name: overrides.display_name ?? overrides.formula_name ?? "Adult Chicken",
    species: "cat",
    format: "dry",
    life_stage: "adult",
    dog_size: null,
    breed_target: null,
    medical_tags: [],
    commercial_tags: [],
    ingredient_text: null,
    ingredients: overrides.ingredients ?? ["chicken", "rice", "minerals"],
    primary_animal_proteins: overrides.primary_animal_proteins ?? ["chicken"],
    carbohydrate_sources: ["rice"],
    fat_sources: ["fish oil"],
    fiber_sources: ["beet pulp"],
    kcal_per_100g: 360,
    data_quality_status: "verified",
    source_priority: "official",
    formula_key: overrides.formula_key ?? overrides.id ?? "qa-cat|adult-chicken|cat|dry",
    ...overrides,
  };
}

function nutrients(overrides: Partial<FoodNutrientsV2> = {}): FoodNutrientsV2 {
  return {
    protein_percent: 32,
    fat_percent: 14,
    fiber_percent: 3,
    calcium_percent: 1.1,
    phosphorus_percent: 0.9,
    sodium_percent: 0.35,
    magnesium_percent: 0.08,
    ...overrides,
  };
}

const adultNonNeuteredCat = {
  species: "cat" as const,
  breed: "",
  weight: 4,
  age: 4,
  activityLevel: "normal" as const,
  neutered: false,
  healthIssues: [],
  allergies: [],
  excludedIngredients: [],
  preferredProteins: [],
};

const regularAdult = catFood({
  id: "regular-adult",
  formula_key: "qa-cat|regular-adult|cat|dry",
  display_name: "Adult Chicken",
  commercial_tags: ["adult"],
});
const sterilisedAdult = catFood({
  id: "sterilised-adult",
  formula_key: "qa-cat|sterilised-adult|cat|dry",
  display_name: "Sterilised Tuna",
  primary_animal_proteins: ["tuna"],
  ingredients: ["tuna", "rice", "minerals"],
  commercial_tags: ["sterilised"],
  kcal_per_100g: 340,
});

const regularRanking = rankFoodV2ForPet({
  food: regularAdult,
  nutrients: nutrients(),
  pet: adultNonNeuteredCat,
  goal: "general",
});
const sterilisedRanking = rankFoodV2ForPet({
  food: sterilisedAdult,
  nutrients: nutrients({ fat_percent: 10 }),
  pet: adultNonNeuteredCat,
  goal: "general",
});

if (sterilisedRanking.total_score >= regularRanking.total_score) {
  console.error("Non-neutered general cat should not default to a sterilised/light formula.");
  console.error({ regularRanking, sterilisedRanking });
  process.exit(1);
}

if (
  !sterilisedRanking.signals.some(
    (signal) => signal.code === "cat_weight_positioning_without_context"
  )
) {
  console.error("Expected cat_weight_positioning_without_context signal.");
  console.error(sterilisedRanking.signals);
  process.exit(1);
}

const kittenPet = {
  ...adultNonNeuteredCat,
  age: 0.4,
  weight: 2,
};
const kittenFood = catFood({
  id: "kitten",
  formula_key: "qa-cat|kitten|cat|dry",
  display_name: "Kitten Chicken",
  life_stage: "kitten",
  commercial_tags: ["kitten"],
});
const adultSevenPlus = catFood({
  id: "adult-seven-plus",
  formula_key: "qa-cat|adult-seven-plus|cat|dry",
  display_name: "Sterilised +7",
  life_stage: "adult",
  commercial_tags: ["sterilised", "senior"],
});
const mislabeledDentalCare = catFood({
  id: "mislabeled-dental-care",
  formula_key: "qa-cat|mislabeled-dental-care|cat|dry",
  display_name: "Dental Care",
  life_stage: "kitten",
  commercial_tags: ["dental", "kitten"],
  kcal_per_100g: 335,
});
const allLifeFitTrim = catFood({
  id: "all-life-fit-trim",
  formula_key: "qa-cat|all-life-fit-trim|cat|dry",
  display_name: "Cat & Kitten Fit & Trim",
  life_stage: "all_life_stages",
  commercial_tags: ["cat_kitten", "fit_trim"],
  kcal_per_100g: 340,
});

const kittenRankings = [kittenFood, adultSevenPlus, mislabeledDentalCare, allLifeFitTrim].map((food) =>
  rankFoodV2ForPet({
    food,
    nutrients: nutrients(food === adultSevenPlus ? { fat_percent: 10 } : {}),
    pet: kittenPet,
    goal: "growth",
  })
);
const kittenSplit = splitFoodV2Recommendations(kittenRankings, 2, "growth");
const adultSevenPlusRanking = kittenRankings.find(
  (ranking) => ranking.formula_key === "qa-cat|adult-seven-plus|cat|dry"
);
const mislabeledDentalCareRanking = kittenRankings.find(
  (ranking) => ranking.formula_key === "qa-cat|mislabeled-dental-care|cat|dry"
);
const allLifeFitTrimRanking = kittenRankings.find(
  (ranking) => ranking.formula_key === "qa-cat|all-life-fit-trim|cat|dry"
);

if (!adultSevenPlusRanking || adultSevenPlusRanking.bucket !== "hold") {
  console.error("Adult/senior visible food should stay on hold for kitten growth.");
  console.error(adultSevenPlusRanking);
  process.exit(1);
}

if (
  !adultSevenPlusRanking.signals.some(
    (signal) => signal.code === "adult_food_for_growth_pet"
  )
) {
  console.error("Expected adult_food_for_growth_pet signal for kitten growth mismatch.");
  console.error(adultSevenPlusRanking.signals);
  process.exit(1);
}

if (kittenSplit.premium[0]?.formula_key !== "qa-cat|kitten|cat|dry") {
  console.error("Kitten food should be the visible first growth recommendation.");
  console.error(kittenSplit);
  process.exit(1);
}

if (allLifeFitTrimRanking?.formula_key === kittenSplit.premium[0]?.formula_key) {
  console.error("Fit/trim all-life-stage cat food should not be the first kitten growth recommendation.");
  console.error({ allLifeFitTrimRanking, kittenSplit });
  process.exit(1);
}

if (
  !allLifeFitTrimRanking?.signals.some(
    (signal) => signal.code === "kitten_growth_weight_control_positioning"
  )
) {
  console.error("Expected kitten_growth_weight_control_positioning signal for fit/trim kitten growth candidate.");
  console.error(allLifeFitTrimRanking?.signals);
  process.exit(1);
}

if (!mislabeledDentalCareRanking || mislabeledDentalCareRanking.bucket !== "hold") {
  console.error("A dental/adult-style cat food with stale kitten metadata should stay on hold for kitten growth.");
  console.error(mislabeledDentalCareRanking);
  process.exit(1);
}

if (
  !mislabeledDentalCareRanking.signals.some(
    (signal) => signal.code === "adult_food_for_kitten_growth"
  )
) {
  console.error("Expected adult_food_for_kitten_growth for stale kitten metadata without visible kitten title.");
  console.error(mislabeledDentalCareRanking.signals);
  process.exit(1);
}

const activeCatRanking = rankFoodV2ForPet({
  food: catFood({
    id: "active-adult",
    formula_key: "qa-cat|active-adult|cat|dry",
    display_name: "Adult Active Chicken",
    commercial_tags: ["active"],
    kcal_per_100g: 395,
  }),
  nutrients: nutrients({ protein_percent: 34, fat_percent: 18 }),
  pet: {
    ...adultNonNeuteredCat,
    activityLevel: "high",
  },
  goal: "general",
});
const activeCatCopy = [...activeCatRanking.reasons, ...activeCatRanking.cautions].join(" ");

if (/\bdog\b|\bdogs\b|working-dog|working dog/i.test(activeCatCopy)) {
  console.error("Cat active-food ranking copy should not mention dogs.");
  console.error(activeCatRanking);
  process.exit(1);
}

console.log("Cat Food V2 ranking balance checks passed.");
