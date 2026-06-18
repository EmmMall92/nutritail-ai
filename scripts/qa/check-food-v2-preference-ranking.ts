import {
  rankFoodV2ForPet,
  splitFoodV2Recommendations,
} from "@/lib/food-v2/recommendationRanking";
import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";

function food(overrides: Partial<FoodProductV2>): FoodProductV2 {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    brand: overrides.brand ?? "QA Brand",
    display_name: overrides.display_name ?? "QA Food",
    formula_name: overrides.formula_name ?? overrides.display_name ?? "QA Food",
    species: "dog",
    format: "dry",
    life_stage: "adult",
    dog_size: "small",
    ingredient_text: null,
    ingredients: overrides.ingredients ?? [],
    primary_animal_proteins: overrides.primary_animal_proteins ?? [],
    carbohydrate_sources: [],
    fat_sources: [],
    fiber_sources: [],
    medical_tags: [],
    commercial_tags: [],
    data_quality_status: "verified",
    source_priority: "official",
    kcal_per_100g: 340,
    formula_key: overrides.formula_key ?? overrides.id ?? "qa-food",
    ...overrides,
  };
}

function nutrients(food: FoodProductV2): FoodNutrientsV2 {
  void food;

  return {
    protein_percent: 24,
    fat_percent: 11,
    fiber_percent: 3,
    calcium_percent: 1,
    phosphorus_percent: 0.8,
    sodium_percent: 0.3,
    magnesium_percent: 0.08,
  };
}

const foods = [
  food({
    id: "chicken",
    formula_key: "qa|small-adult-chicken|dog|dry",
    display_name: "Small Adult Chicken",
    primary_animal_proteins: ["chicken"],
    ingredients: ["chicken", "rice"],
  }),
  food({
    id: "salmon-with-poultry-fat",
    formula_key: "qa|small-adult-salmon|dog|dry",
    display_name: "Small Adult Salmon",
    primary_animal_proteins: ["salmon"],
    ingredients: ["salmon", "potato", "poultry fat"],
  }),
  food({
    id: "feline-urinary-mislabeled-dog",
    formula_key: "qa|urinary-feline|dog|dry",
    display_name: "Urinary Feline Rich In Chicken",
    primary_animal_proteins: ["chicken"],
    ingredients: ["chicken", "rice"],
  }),
];

const pet = {
  species: "dog" as const,
  breed: "",
  weight: 10,
  age: 5,
  activityLevel: "normal" as const,
  neutered: true,
  healthIssues: [],
  allergies: [],
  excludedIngredients: ["lamb", "beef"],
  preferredProteins: ["chicken"],
};

const rankings = foods.map((item) =>
  rankFoodV2ForPet({
    food: item,
    nutrients: nutrients(item),
    pet,
    goal: "sterilised",
  })
);
const result = splitFoodV2Recommendations(rankings);

const chicken = [...result.premium, ...result.value, ...result.hold].find(
  (item) => item.formula_key === "qa|small-adult-chicken|dog|dry"
);
const salmon = [...result.premium, ...result.value, ...result.hold].find(
  (item) => item.formula_key === "qa|small-adult-salmon|dog|dry"
);
const felineNamedDogFood = [...result.premium, ...result.value, ...result.hold].find(
  (item) => item.formula_key === "qa|urinary-feline|dog|dry"
);

if (!chicken) {
  console.error("Expected chicken food to be recommended.");
  process.exit(1);
}

if (!chicken.signals.some((signal) => signal.code === "preferred_protein_match")) {
  console.error("Expected chicken food to receive preferred_protein_match.");
  console.error(chicken.signals);
  process.exit(1);
}

if (
  salmon?.signals.some((signal) => signal.code === "preferred_protein_match")
) {
  console.error("Salmon food with poultry fat should not match chicken preference.");
  console.error(salmon.signals);
  process.exit(1);
}

if (felineNamedDogFood?.bucket !== "hold") {
  console.error("Dog recommendations should hold products with feline/cat-specific titles.");
  console.error(felineNamedDogFood);
  process.exit(1);
}

if (
  !felineNamedDogFood?.signals.some(
    (signal) => signal.code === "contradicting_species_label"
  )
) {
  console.error("Expected contradicting_species_label signal.");
  console.error(felineNamedDogFood?.signals);
  process.exit(1);
}

const weightSensitivePet = {
  ...pet,
  weight: 34,
  age: 9,
  neutered: true,
  activityLevel: "low" as const,
  healthIssues: ["weight control"],
  excludedIngredients: [],
  preferredProteins: [],
};
const activeHighFat = food({
  id: "active-high-fat",
  formula_key: "qa|active-high-fat|dog|dry",
  display_name: "Team Breeder Top Active Chicken",
  ingredients: ["chicken", "rice"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 404,
});
const activeHighFatRanking = rankFoodV2ForPet({
  food: activeHighFat,
  nutrients: {
    ...nutrients(activeHighFat),
    fat_percent: 21.5,
    fiber_percent: 2,
  },
  pet: weightSensitivePet,
  goal: "senior",
});

if (activeHighFatRanking.bucket !== "hold") {
  console.error("High-kcal/high-fat active foods should be held for senior weight-control cases.");
  console.error(activeHighFatRanking);
  process.exit(1);
}

const puppyPet = {
  ...pet,
  age: 0.5,
  weight: 9,
  healthIssues: ["sensitive digestion"],
  excludedIngredients: [],
  preferredProteins: [],
};
const adultGi = food({
  id: "adult-gi",
  formula_key: "qa|adult-gi|dog|dry",
  display_name: "Gastrointestinal Adult",
  life_stage: "adult",
  ingredients: ["chicken", "rice"],
  primary_animal_proteins: ["chicken"],
});
const adultGiRanking = rankFoodV2ForPet({
  food: adultGi,
  nutrients: nutrients(adultGi),
  pet: puppyPet,
  goal: "sensitive_digestion",
});

if (adultGiRanking.bucket !== "hold") {
  console.error("Adult GI foods should be held when the pet is still a puppy.");
  console.error(adultGiRanking);
  process.exit(1);
}

const twelveMonthGiantPuppy = {
  ...pet,
  breed: "Cane Corso",
  age: 1,
  weight: 55,
  excludedIngredients: [],
  preferredProteins: [],
};
const adultLargeBreedFood = food({
  id: "adult-large-breed",
  formula_key: "qa|adult-large-breed|dog|dry",
  display_name: "Adult Med/maxi Chicken",
  life_stage: "adult",
  dog_size: "large",
  ingredients: ["chicken", "rice"],
  primary_animal_proteins: ["chicken"],
});
const adultLargeBreedRanking = rankFoodV2ForPet({
  food: adultLargeBreedFood,
  nutrients: nutrients(adultLargeBreedFood),
  pet: twelveMonthGiantPuppy,
  goal: "growth",
});

if (adultLargeBreedRanking.bucket !== "hold") {
  console.error("Adult large-breed food should be held for 12-month giant-breed growth cases.");
  console.error(adultLargeBreedRanking);
  process.exit(1);
}

console.log("Food V2 preference, weight, and puppy guard QA passed.");
