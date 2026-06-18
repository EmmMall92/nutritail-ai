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

const weightControlFood = food({
  id: "weight-control",
  formula_key: "qa|weight-control|dog|dry",
  display_name: "Adult Light Weight Control Chicken",
  dog_size: "large",
  commercial_tags: ["weight_control"],
  ingredients: ["chicken", "rice", "beet pulp"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 320,
});
const highEnergyAdultFood = food({
  id: "high-energy-adult",
  formula_key: "qa|high-energy-adult|dog|dry",
  display_name: "Adult Chicken Energy Rich",
  dog_size: "large",
  ingredients: ["chicken", "rice"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 396,
});
const weightControlRanking = rankFoodV2ForPet({
  food: weightControlFood,
  nutrients: {
    ...nutrients(weightControlFood),
    protein_percent: 29,
    fat_percent: 9,
    fiber_percent: 7,
  },
  pet: weightSensitivePet,
  goal: "weight_control",
});
const highEnergyAdultRanking = rankFoodV2ForPet({
  food: highEnergyAdultFood,
  nutrients: {
    ...nutrients(highEnergyAdultFood),
    protein_percent: 25,
    fat_percent: 17,
    fiber_percent: 2,
  },
  pet: weightSensitivePet,
  goal: "weight_control",
});

if (weightControlRanking.total_score <= highEnergyAdultRanking.total_score) {
  console.error("Weight-control food should outrank high-energy adult food for weight-loss cases.");
  console.error({ weightControlRanking, highEnergyAdultRanking });
  process.exit(1);
}

if (!weightControlRanking.signals.some((signal) => signal.code === "obesity_satiety_fiber")) {
  console.error("Expected obesity_satiety_fiber signal for weight-control food.");
  console.error(weightControlRanking.signals);
  process.exit(1);
}

const highActivityPet = {
  ...pet,
  weight: 25,
  age: 3,
  neutered: false,
  activityLevel: "high" as const,
  healthIssues: [],
  excludedIngredients: [],
  preferredProteins: [],
};
const activeFitRanking = rankFoodV2ForPet({
  food: activeHighFat,
  nutrients: {
    ...nutrients(activeHighFat),
    fat_percent: 18,
    fiber_percent: 2,
  },
  pet: highActivityPet,
  goal: "general",
});

if (activeFitRanking.bucket === "hold") {
  console.error("Active foods should remain usable for genuinely high-activity adult dogs.");
  console.error(activeFitRanking);
  process.exit(1);
}

if (!activeFitRanking.signals.some((signal) => signal.code === "active_formula_activity_fit")) {
  console.error("Expected active_formula_activity_fit for high-activity adult dog.");
  console.error(activeFitRanking.signals);
  process.exit(1);
}

const seniorPet = {
  ...pet,
  weight: 15,
  age: 11,
  activityLevel: "low" as const,
  neutered: true,
  healthIssues: ["senior mobility"],
  excludedIngredients: [],
  preferredProteins: [],
};
const seniorFood = food({
  id: "senior-food",
  formula_key: "qa|senior-food|dog|dry",
  display_name: "Senior 8+ Chicken",
  life_stage: "senior",
  dog_size: "medium",
  ingredients: ["chicken", "rice"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 335,
});
const genericAdultFood = food({
  id: "generic-adult",
  formula_key: "qa|generic-adult|dog|dry",
  display_name: "Adult Maintenance Chicken",
  life_stage: "adult",
  dog_size: "medium",
  ingredients: ["chicken", "rice"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 360,
});
const seniorRanking = rankFoodV2ForPet({
  food: seniorFood,
  nutrients: {
    ...nutrients(seniorFood),
    protein_percent: 25,
    fat_percent: 10,
    fiber_percent: 4,
    epa_dha_percent: 0.25,
    glucosamine_mgkg: 400,
  },
  pet: seniorPet,
  goal: "senior",
});
const genericAdultSeniorRanking = rankFoodV2ForPet({
  food: genericAdultFood,
  nutrients: {
    ...nutrients(genericAdultFood),
    protein_percent: 23,
    fat_percent: 15,
    fiber_percent: 2,
  },
  pet: seniorPet,
  goal: "senior",
});

if (seniorRanking.total_score <= genericAdultSeniorRanking.total_score) {
  console.error("Senior-positioned food should outrank generic adult food for senior cases.");
  console.error({ seniorRanking, genericAdultSeniorRanking });
  process.exit(1);
}

if (!seniorRanking.signals.some((signal) => signal.code === "senior_mobility_support_signal")) {
  console.error("Expected senior_mobility_support_signal for senior mobility food.");
  console.error(seniorRanking.signals);
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

const genericPuppyFood = food({
  id: "generic-puppy",
  formula_key: "qa|generic-puppy|dog|dry",
  display_name: "Puppy Junior Chicken",
  life_stage: "puppy",
  dog_size: "all",
  ingredients: ["chicken", "rice"],
  primary_animal_proteins: ["chicken"],
});
const largeBreedPuppyFood = food({
  id: "large-breed-puppy",
  formula_key: "qa|large-breed-puppy|dog|dry",
  display_name: "Large Breed Puppy Chicken",
  life_stage: "puppy",
  dog_size: "large",
  ingredients: ["chicken", "rice"],
  primary_animal_proteins: ["chicken"],
});
const genericPuppyRanking = rankFoodV2ForPet({
  food: genericPuppyFood,
  nutrients: nutrients(genericPuppyFood),
  pet: twelveMonthGiantPuppy,
  goal: "growth",
});
const largeBreedPuppyRanking = rankFoodV2ForPet({
  food: largeBreedPuppyFood,
  nutrients: nutrients(largeBreedPuppyFood),
  pet: twelveMonthGiantPuppy,
  goal: "growth",
});

if (largeBreedPuppyRanking.total_score <= genericPuppyRanking.total_score) {
  console.error("Large-breed puppy food should outrank generic puppy food for giant-breed growth cases.");
  console.error({ largeBreedPuppyRanking, genericPuppyRanking });
  process.exit(1);
}

if (!largeBreedPuppyRanking.signals.some((signal) => signal.code === "large_breed_puppy_fit")) {
  console.error("Expected large_breed_puppy_fit signal.");
  console.error(largeBreedPuppyRanking.signals);
  process.exit(1);
}

console.log("Food V2 preference, weight, and puppy guard QA passed.");
