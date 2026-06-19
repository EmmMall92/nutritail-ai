import {
  rankFoodV2ForPet,
  splitFoodV2Recommendations,
} from "@/lib/food-v2/recommendationRanking";
import { detectFoodV2RecommendationGuardFlags } from "@/lib/food-v2/recommendationGuards";
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

const contradictoryPreferencePet = {
  ...pet,
  excludedIngredients: ["salmon"],
  preferredProteins: ["salmon", "chicken"],
};
const salmonFoodWithContradictoryPreference = food({
  id: "salmon-contradictory-preference",
  formula_key: "qa|salmon-contradictory-preference|dog|dry",
  display_name: "Adult Salmon",
  primary_animal_proteins: ["salmon"],
  ingredients: ["salmon", "rice"],
});
const contradictoryPreferenceRanking = rankFoodV2ForPet({
  food: salmonFoodWithContradictoryPreference,
  nutrients: nutrients(salmonFoodWithContradictoryPreference),
  pet: contradictoryPreferencePet,
  goal: "general",
});

if (contradictoryPreferenceRanking.bucket !== "hold") {
  console.error("Excluded ingredient should win over a contradictory preferred protein.");
  console.error(contradictoryPreferenceRanking);
  process.exit(1);
}

if (
  contradictoryPreferenceRanking.signals.some(
    (signal) => signal.code === "preferred_protein_match"
  )
) {
  console.error("Avoided protein must not receive a preferred protein boost.");
  console.error(contradictoryPreferenceRanking.signals);
  process.exit(1);
}

const riceAndPeaFood = food({
  id: "rice-pea",
  formula_key: "qa|rice-pea|dog|dry",
  display_name: "Adult Duck With Rice And Peas",
  primary_animal_proteins: ["duck"],
  carbohydrate_sources: ["rice", "peas"],
  ingredients: ["duck", "rice", "peas"],
});
const ricePeaRanking = rankFoodV2ForPet({
  food: riceAndPeaFood,
  nutrients: nutrients(riceAndPeaFood),
  pet: {
    ...pet,
    excludedIngredients: ["rice", "legumes"],
    preferredProteins: ["duck"],
  },
  goal: "allergy",
});

if (ricePeaRanking.bucket !== "hold") {
  console.error("Foods with explicitly excluded rice/legumes should be held.");
  console.error(ricePeaRanking);
  process.exit(1);
}

if (
  !ricePeaRanking.signals.some((signal) =>
    signal.code.startsWith("excluded_ingredient_preference")
  )
) {
  console.error("Expected excluded_ingredient_preference signal for rice/legumes.");
  console.error(ricePeaRanking.signals);
  process.exit(1);
}

const broadAnimalFood = food({
  id: "broad-animal",
  formula_key: "qa|broad-animal|dog|dry",
  display_name: "Sensitive Adult Animal Protein",
  ingredients: ["animal protein", "rice", "animal fat"],
  primary_animal_proteins: ["animal protein"],
});
const broadAnimalRanking = rankFoodV2ForPet({
  food: broadAnimalFood,
  nutrients: nutrients(broadAnimalFood),
  pet: {
    ...pet,
    allergies: ["chicken"],
    excludedIngredients: ["chicken"],
    preferredProteins: [],
  },
  goal: "allergy",
});

if (
  !broadAnimalRanking.signals.some(
    (signal) => signal.code === "broad_animal_terms_allergy_uncertainty"
  )
) {
  console.error("Expected broad animal terms to reduce allergy confidence.");
  console.error(broadAnimalRanking.signals);
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

const sterilisedLeanFood = food({
  id: "sterilised-lean",
  formula_key: "qa|sterilised-lean|dog|dry",
  display_name: "Adult Sterilised Light Chicken",
  dog_size: "small",
  commercial_tags: ["sterilised", "weight_control"],
  ingredients: ["chicken", "rice", "beet pulp"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 332,
});
const sterilisedRicherFood = food({
  id: "sterilised-richer",
  formula_key: "qa|sterilised-richer|dog|dry",
  display_name: "Neutered Adult Duck Mini",
  dog_size: "small",
  commercial_tags: ["sterilised"],
  ingredients: ["duck", "quinoa", "pea fiber"],
  primary_animal_proteins: ["duck"],
  kcal_per_100g: 344.4,
});
const sterilisedLeanRanking = rankFoodV2ForPet({
  food: sterilisedLeanFood,
  nutrients: {
    ...nutrients(sterilisedLeanFood),
    protein_percent: 22,
    fat_percent: 9,
    fiber_percent: 2.5,
  },
  pet: {
    ...pet,
    weight: 8,
    age: 5,
    activityLevel: "low",
    neutered: true,
    excludedIngredients: [],
    preferredProteins: [],
  },
  goal: "sterilised",
});
const sterilisedRicherRanking = rankFoodV2ForPet({
  food: sterilisedRicherFood,
  nutrients: {
    ...nutrients(sterilisedRicherFood),
    protein_percent: 30,
    fat_percent: 11,
    fiber_percent: 5.7,
  },
  pet: {
    ...pet,
    weight: 8,
    age: 5,
    activityLevel: "low",
    neutered: true,
    excludedIngredients: [],
    preferredProteins: [],
  },
  goal: "sterilised",
});

if (sterilisedLeanRanking.total_score <= sterilisedRicherRanking.total_score) {
  console.error("Lower-kcal/lower-fat food should outrank richer options for sterilised cases.");
  console.error({ sterilisedLeanRanking, sterilisedRicherRanking });
  process.exit(1);
}

if (
  !sterilisedLeanRanking.signals.some(
    (signal) => signal.code === "sterilised_lower_fat_density"
  )
) {
  console.error("Expected sterilised_lower_fat_density signal.");
  console.error(sterilisedLeanRanking.signals);
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

const workingDogContextRanking = rankFoodV2ForPet({
  food: activeHighFat,
  nutrients: {
    ...nutrients(activeHighFat),
    fat_percent: 18,
    fiber_percent: 2,
  },
  pet: {
    ...highActivityPet,
    activityLevel: "normal" as const,
    healthIssues: ["working dog", "daily mountain training"],
  },
  goal: "general",
});

if (workingDogContextRanking.bucket === "hold") {
  console.error("Working-dog context should keep active foods usable even when activityLevel is not explicit.");
  console.error(workingDogContextRanking);
  process.exit(1);
}

if (!workingDogContextRanking.signals.some((signal) => signal.code === "active_formula_activity_fit")) {
  console.error("Expected active_formula_activity_fit from working-dog context.");
  console.error(workingDogContextRanking.signals);
  process.exit(1);
}

const workingDogWeightGainPet = {
  ...highActivityPet,
  healthIssues: ["working dog", "daily mountain training", "needs weight gain"],
  preferredProteins: ["salmon"],
};
const preferredButNotActiveSalmon = food({
  id: "preferred-salmon-not-active",
  formula_key: "qa|preferred-salmon-not-active|dog|dry",
  display_name: "Adult Salmon Maintenance",
  dog_size: "large",
  ingredients: ["salmon", "rice"],
  primary_animal_proteins: ["salmon"],
  kcal_per_100g: 352,
});
const activeWeightGainRanking = rankFoodV2ForPet({
  food: activeHighFat,
  nutrients: {
    ...nutrients(activeHighFat),
    fat_percent: 18,
    fiber_percent: 2,
  },
  pet: workingDogWeightGainPet,
  goal: "general",
});
const preferredButNotActiveRanking = rankFoodV2ForPet({
  food: preferredButNotActiveSalmon,
  nutrients: {
    ...nutrients(preferredButNotActiveSalmon),
    fat_percent: 12,
    fiber_percent: 3,
  },
  pet: workingDogWeightGainPet,
  goal: "general",
});

if (activeWeightGainRanking.total_score <= preferredButNotActiveRanking.total_score) {
  console.error("Active/energy fit should outrank flavor preference for working weight-gain cases.");
  console.error({ activeWeightGainRanking, preferredButNotActiveRanking });
  process.exit(1);
}

if (
  !preferredButNotActiveRanking.signals.some(
    (signal) => signal.code === "weight_gain_without_active_positioning"
  )
) {
  console.error("Expected weight_gain_without_active_positioning for non-active weight-gain option.");
  console.error(preferredButNotActiveRanking.signals);
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
const adultLabelledSeniorMetadataFood = food({
  id: "adult-labelled-senior-metadata",
  formula_key: "qa|adult-labelled-senior-metadata|dog|dry",
  display_name: "Neutered Adult Duck Medium",
  life_stage: "senior",
  dog_size: "medium",
  commercial_tags: ["senior", "sterilised"],
  ingredients: ["duck", "rice", "pea fiber"],
  primary_animal_proteins: ["duck"],
  kcal_per_100g: 335,
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
const adultLabelledSeniorMetadataRanking = rankFoodV2ForPet({
  food: adultLabelledSeniorMetadataFood,
  nutrients: {
    ...nutrients(adultLabelledSeniorMetadataFood),
    protein_percent: 27,
    fat_percent: 10,
    fiber_percent: 6,
  },
  pet: seniorPet,
  goal: "senior",
});

if (seniorRanking.total_score <= genericAdultSeniorRanking.total_score) {
  console.error("Senior-positioned food should outrank generic adult food for senior cases.");
  console.error({ seniorRanking, genericAdultSeniorRanking });
  process.exit(1);
}

if (seniorRanking.total_score <= adultLabelledSeniorMetadataRanking.total_score) {
  console.error("Clear senior title should outrank adult-labelled food with senior metadata.");
  console.error({ seniorRanking, adultLabelledSeniorMetadataRanking });
  process.exit(1);
}

if (
  !adultLabelledSeniorMetadataRanking.signals.some(
    (signal) => signal.code === "adult_title_for_senior_shortlist"
  )
) {
  console.error("Expected adult_title_for_senior_shortlist for adult-labelled senior metadata.");
  console.error(adultLabelledSeniorMetadataRanking.signals);
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

const adultSensitivePet = {
  ...pet,
  weight: 16,
  age: 4,
  activityLevel: "normal" as const,
  neutered: true,
  healthIssues: ["sensitive digestion", "soft stool"],
  excludedIngredients: [],
  preferredProteins: [],
};
const digestiveAdultFood = food({
  id: "digestive-adult",
  formula_key: "qa|digestive-adult|dog|dry",
  display_name: "Adult Sensitive Digestion Chicken",
  life_stage: "adult",
  ingredients: ["chicken", "rice", "beet pulp", "chicory"],
  fiber_sources: ["beet pulp", "chicory"],
  commercial_tags: ["sensitive_digestion"],
  primary_animal_proteins: ["chicken"],
});
const neuteredNonDigestiveFood = food({
  id: "neutered-non-digestive",
  formula_key: "qa|neutered-non-digestive|dog|dry",
  display_name: "Neutered Adult Duck Mini",
  life_stage: "adult",
  ingredients: ["duck", "quinoa", "pea fiber"],
  commercial_tags: ["sterilised"],
  primary_animal_proteins: ["duck"],
});
const digestiveAdultRanking = rankFoodV2ForPet({
  food: digestiveAdultFood,
  nutrients: {
    ...nutrients(digestiveAdultFood),
    fiber_percent: 3.8,
  },
  pet: adultSensitivePet,
  goal: "sensitive_digestion",
});
const neuteredNonDigestiveRanking = rankFoodV2ForPet({
  food: neuteredNonDigestiveFood,
  nutrients: {
    ...nutrients(neuteredNonDigestiveFood),
    protein_percent: 30,
    fat_percent: 11,
    fiber_percent: 5.7,
  },
  pet: adultSensitivePet,
  goal: "sensitive_digestion",
});

if (digestiveAdultRanking.total_score <= neuteredNonDigestiveRanking.total_score) {
  console.error("Digestive-positioned food should outrank neutered-only food for sensitive digestion.");
  console.error({ digestiveAdultRanking, neuteredNonDigestiveRanking });
  process.exit(1);
}

if (!digestiveAdultRanking.signals.some((signal) => signal.code === "sensitive_digestive_positioning")) {
  console.error("Expected sensitive_digestive_positioning for digestive adult food.");
  console.error(digestiveAdultRanking.signals);
  process.exit(1);
}

if (
  !neuteredNonDigestiveRanking.signals.some(
    (signal) => signal.code === "weight_positioning_not_digestive_fit"
  )
) {
  console.error("Expected weight_positioning_not_digestive_fit for neutered-only sensitive case.");
  console.error(neuteredNonDigestiveRanking.signals);
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

const pickySmallDog = {
  ...pet,
  weight: 6,
  age: 4,
  activityLevel: "normal" as const,
  neutered: false,
  healthIssues: ["picky eater", "likes fish"],
  excludedIngredients: [],
  preferredProteins: ["salmon"],
};
const preferredSalmonFood = food({
  id: "preferred-salmon",
  formula_key: "qa|preferred-salmon|dog|dry",
  display_name: "Small Adult Salmon",
  dog_size: "small",
  ingredients: ["salmon", "potato", "fish oil"],
  primary_animal_proteins: ["salmon"],
});
const genericChickenFood = food({
  id: "generic-chicken",
  formula_key: "qa|generic-chicken|dog|dry",
  display_name: "Small Adult Chicken",
  dog_size: "small",
  ingredients: ["chicken", "rice"],
  primary_animal_proteins: ["chicken"],
});
const preferredSalmonRanking = rankFoodV2ForPet({
  food: preferredSalmonFood,
  nutrients: nutrients(preferredSalmonFood),
  pet: pickySmallDog,
  goal: "general",
});
const genericChickenRanking = rankFoodV2ForPet({
  food: genericChickenFood,
  nutrients: nutrients(genericChickenFood),
  pet: pickySmallDog,
  goal: "general",
});

if (preferredSalmonRanking.total_score <= genericChickenRanking.total_score) {
  console.error("Preferred protein should materially influence the customer-facing shortlist.");
  console.error({ preferredSalmonRanking, genericChickenRanking });
  process.exit(1);
}

if (!preferredSalmonRanking.signals.some((signal) => signal.code === "preferred_protein_match")) {
  console.error("Expected preferred_protein_match for salmon preference.");
  console.error(preferredSalmonRanking.signals);
  process.exit(1);
}

if (!genericChickenRanking.signals.some((signal) => signal.code === "preferred_protein_missing")) {
  console.error("Expected preferred_protein_missing for a non-preferred alternative.");
  console.error(genericChickenRanking.signals);
  process.exit(1);
}

const renalPet = {
  ...pet,
  species: "cat" as const,
  weight: 4.2,
  age: 12,
  activityLevel: "low" as const,
  neutered: true,
  healthIssues: ["renal", "kidney disease"],
  excludedIngredients: [],
  preferredProteins: [],
};
const urinaryOnlyFood = food({
  id: "urinary-only",
  formula_key: "qa|urinary-only|cat|dry",
  brand: "QA Vet",
  display_name: "Vetsolution Urinary Oxalate",
  species: "cat",
  life_stage: "adult",
  ingredients: ["chicken", "rice"],
  medical_tags: ["urinary"],
});
const urinaryOnlyRenalRanking = rankFoodV2ForPet({
  food: urinaryOnlyFood,
  nutrients: {
    ...nutrients(urinaryOnlyFood),
    phosphorus_percent: 0.7,
  },
  pet: renalPet,
  goal: "renal",
});
const urinaryOnlyRenalGuards = detectFoodV2RecommendationGuardFlags(urinaryOnlyRenalRanking);

if (urinaryOnlyRenalRanking.bucket !== "hold") {
  console.error("Urinary-only food should be held for renal cases.");
  console.error(urinaryOnlyRenalRanking);
  process.exit(1);
}

if (!urinaryOnlyRenalRanking.signals.some((signal) => signal.code === "renal_urinary_mismatch")) {
  console.error("Expected renal_urinary_mismatch signal for urinary-only renal mismatch.");
  console.error(urinaryOnlyRenalRanking.signals);
  process.exit(1);
}

if (!urinaryOnlyRenalGuards.some((flag) => flag.code === "renal_urinary_mismatch" && flag.severity === "block")) {
  console.error("Expected renal_urinary_mismatch to be exposed as a block guard.");
  console.error(urinaryOnlyRenalGuards);
  process.exit(1);
}

const renalFood = food({
  id: "renal-food",
  formula_key: "qa|renal|cat|dry",
  brand: "QA Vet",
  display_name: "Vetsolution Renal",
  species: "cat",
  life_stage: "senior",
  ingredients: ["rice", "egg", "fish oil"],
  medical_tags: ["renal"],
});
const renalRanking = rankFoodV2ForPet({
  food: renalFood,
  nutrients: {
    ...nutrients(renalFood),
    protein_percent: 25,
    fat_percent: 15,
    phosphorus_percent: 0.45,
    sodium_percent: 0.25,
    epa_dha_percent: 0.35,
  },
  pet: renalPet,
  goal: "renal",
});

if (renalRanking.bucket === "hold") {
  console.error("Renal-positioned food with phosphorus data should remain usable for renal cases.");
  console.error(renalRanking);
  process.exit(1);
}

if (renalRanking.total_score <= urinaryOnlyRenalRanking.total_score) {
  console.error("Renal-positioned food should outrank urinary-only food for renal cases.");
  console.error({ renalRanking, urinaryOnlyRenalRanking });
  process.exit(1);
}

if (!renalRanking.signals.some((signal) => signal.code === "renal_formula_positioning")) {
  console.error("Expected renal_formula_positioning from renal rules.");
  console.error(renalRanking.signals);
  process.exit(1);
}

const urinaryPet = {
  ...pet,
  species: "cat" as const,
  weight: 5,
  age: 5,
  activityLevel: "normal" as const,
  neutered: true,
  healthIssues: ["urinary", "struvite history"],
  excludedIngredients: [],
  preferredProteins: [],
};
const urinaryFood = food({
  id: "urinary-food",
  formula_key: "qa|urinary|cat|dry",
  brand: "QA Vet",
  display_name: "Urinary Struvite",
  species: "cat",
  life_stage: "adult",
  ingredients: ["chicken", "rice"],
  medical_tags: ["urinary"],
});
const renalOnlyForUrinaryFood = food({
  id: "renal-only-urinary-context",
  formula_key: "qa|renal-only-urinary-context|cat|dry",
  brand: "QA Vet",
  display_name: "Renal Support",
  species: "cat",
  life_stage: "adult",
  ingredients: ["rice", "egg"],
  medical_tags: ["renal"],
});
const urinaryRanking = rankFoodV2ForPet({
  food: urinaryFood,
  nutrients: {
    ...nutrients(urinaryFood),
    magnesium_percent: 0.07,
    phosphorus_percent: 0.75,
  },
  pet: urinaryPet,
  goal: "urinary",
});
const renalOnlyUrinaryRanking = rankFoodV2ForPet({
  food: renalOnlyForUrinaryFood,
  nutrients: nutrients(renalOnlyForUrinaryFood),
  pet: urinaryPet,
  goal: "urinary",
});

if (urinaryRanking.bucket === "hold") {
  console.error("Urinary-positioned food should remain usable for urinary cases.");
  console.error(urinaryRanking);
  process.exit(1);
}

if (renalOnlyUrinaryRanking.bucket !== "hold") {
  console.error("Renal-only food should be held for urinary cases.");
  console.error(renalOnlyUrinaryRanking);
  process.exit(1);
}

if (!urinaryRanking.signals.some((signal) => signal.code === "urinary_formula_positioning")) {
  console.error("Expected urinary_formula_positioning from urinary rules.");
  console.error(urinaryRanking.signals);
  process.exit(1);
}

if (!renalOnlyUrinaryRanking.signals.some((signal) => signal.code === "urinary_renal_mismatch")) {
  console.error("Expected urinary_renal_mismatch for renal-only urinary mismatch.");
  console.error(renalOnlyUrinaryRanking.signals);
  process.exit(1);
}

const generalSkinPet = {
  ...pet,
  weight: 6,
  age: 3,
  activityLevel: "high" as const,
  neutered: false,
  healthIssues: ["itchy skin"],
  excludedIngredients: [],
  preferredProteins: ["salmon"],
};
const unrelatedGastroFood = food({
  id: "unrelated-gastro",
  formula_key: "qa|josera-gastro-dry|dog|dry",
  brand: "Josera",
  display_name: "Josera GASTRO DRY",
  formula_name: "GASTRO DRY",
  ingredients: ["poultry", "rice"],
});
const unrelatedLiverFood = food({
  id: "unrelated-liver",
  formula_key: "qa|josera-liver-dry|dog|dry",
  brand: "Josera",
  display_name: "Josera LIVER DRY",
  formula_name: "LIVER DRY",
  ingredients: ["poultry", "rice"],
});

for (const item of [unrelatedGastroFood, unrelatedLiverFood]) {
  const ranking = rankFoodV2ForPet({
    food: item,
    nutrients: nutrients(item),
    pet: generalSkinPet,
    goal: "general",
  });

  if (ranking.bucket !== "hold") {
    console.error("Unrelated therapeutic food should be held for general/skin context.");
    console.error(ranking);
    process.exit(1);
  }

  if (
    !ranking.signals.some(
      (signal) => signal.code === "therapeutic_food_without_matching_condition"
    )
  ) {
    console.error("Expected unrelated therapeutic food to expose the therapeutic mismatch signal.");
    console.error(ranking.signals);
    process.exit(1);
  }
}

const budgetPet = {
  ...pet,
  weight: 16,
  age: 4,
  neutered: false,
  healthIssues: [],
  excludedIngredients: [],
  preferredProteins: [],
};
const valueAdultFood = food({
  id: "value-adult",
  formula_key: "qa|value-adult|dog|dry",
  brand: "Value Brand",
  display_name: "Classic Adult Complete",
  formula_name: "Classic Adult Complete",
  dog_size: "medium",
  commercial_tags: ["classic", "complete"],
  data_quality_status: "verified",
  source_priority: "official",
});
const premiumAdultFood = food({
  id: "premium-adult",
  formula_key: "qa|premium-adult|dog|dry",
  brand: "Premium Brand",
  display_name: "Grain Free Monoprotein Adult Salmon",
  formula_name: "Grain Free Monoprotein Adult Salmon",
  dog_size: "medium",
  commercial_tags: ["grain_free", "monoprotein"],
  data_quality_status: "verified",
  source_priority: "official",
});
const budgetSplit = splitFoodV2Recommendations(
  [
    rankFoodV2ForPet({
      food: premiumAdultFood,
      nutrients: nutrients(premiumAdultFood),
      pet: budgetPet,
      goal: "value",
    }),
    rankFoodV2ForPet({
      food: valueAdultFood,
      nutrients: nutrients(valueAdultFood),
      pet: budgetPet,
      goal: "value",
    }),
  ],
  3,
  "value"
);

if (budgetSplit.premium[0]?.formula_key !== valueAdultFood.formula_key) {
  console.error("Value goal should present value-positioned foods first.");
  console.error(budgetSplit);
  process.exit(1);
}

if (budgetSplit.premium[0]?.bucket !== "value") {
  console.error("Value-first presentation should preserve value bucket metadata.");
  console.error(budgetSplit.premium[0]);
  process.exit(1);
}

console.log("Food V2 preference, weight, and puppy guard QA passed.");
