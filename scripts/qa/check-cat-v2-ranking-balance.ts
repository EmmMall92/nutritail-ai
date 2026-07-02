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
const wetSterilisedMisbrandedAsVet = catFood({
  id: "wet-sterilised-misbranded-vet",
  brand: "Purina Pro Plan Veterinary Diets",
  formula_key: "qa-cat|wet-sterilised-misbranded-vet|cat|wet",
  format: "wet",
  display_name: "Nutrisavour Sterilised Chicken in Gravy",
  formula_name: "Purina Pro Plan Veterinary Diets Nutrisavour Sterilised Chicken in Gravy",
  primary_animal_proteins: ["chicken"],
  ingredients: ["chicken", "minerals", "inulin"],
  commercial_tags: ["sterilised"],
  medical_tags: [],
  kcal_per_100g: 85,
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
const wetSterilisedMisbrandedVetRanking = rankFoodV2ForPet({
  food: wetSterilisedMisbrandedAsVet,
  nutrients: nutrients({ protein_percent: 13, fat_percent: 3.3, fiber_percent: 0.4 }),
  pet: { ...adultNonNeuteredCat, neutered: true },
  goal: "sterilised",
});

if (wetSterilisedMisbrandedVetRanking.bucket === "hold") {
  console.error(
    "Plain sterilised wet cat food should not be blocked only because the canonical brand includes Veterinary Diets."
  );
  console.error(wetSterilisedMisbrandedVetRanking);
  process.exit(1);
}

if (
  wetSterilisedMisbrandedVetRanking.signals.some(
    (signal) => signal.code === "therapeutic_food_without_matching_condition"
  )
) {
  console.error(
    "Brand-only veterinary wording should not trigger the therapeutic mismatch guard without medical title/tags."
  );
  console.error(wetSterilisedMisbrandedVetRanking.signals);
  process.exit(1);
}

const wetSterilisedMisbrandedVetSplit = splitFoodV2Recommendations(
  [wetSterilisedMisbrandedVetRanking],
  2,
  "sterilised"
);
if (
  ![
    ...wetSterilisedMisbrandedVetSplit.premium,
    ...wetSterilisedMisbrandedVetSplit.value,
  ].some((ranking) => ranking.formula_key === wetSterilisedMisbrandedAsVet.formula_key)
) {
  console.error(
    "Plain sterilised wet cat food should remain customer-visible after splitting recommendations."
  );
  console.error(wetSterilisedMisbrandedVetSplit);
  process.exit(1);
}
const lowActivityNonNeuteredCat = {
  ...adultNonNeuteredCat,
  age: 2,
  activityLevel: "low" as const,
};
const culinesseAdult = catFood({
  id: "culinesse-adult",
  brand: "Josera",
  formula_key: "josera|culinesse-adult|cat|dry",
  display_name: "Culinesse Adult",
  commercial_tags: ["adult"],
  kcal_per_100g: 347.5,
});
const culinesseGeneralRanking = rankFoodV2ForPet({
  food: culinesseAdult,
  nutrients: nutrients({ fat_percent: 13.5 }),
  pet: lowActivityNonNeuteredCat,
  goal: "general",
});

if (
  culinesseGeneralRanking.signals.some((signal) =>
    [
      "lower_calorie_weight_sensitive",
      "acceptable_energy_neutered",
      "fat_dense_neutered",
      "sterilised_fit",
    ].includes(signal.code)
  )
) {
  console.error(
    "Low activity alone should not turn a non-neutered general cat into a sterilised/weight-sensitive recommendation."
  );
  console.error(culinesseGeneralRanking.signals);
  process.exit(1);
}

if (sterilisedRanking.total_score >= regularRanking.total_score) {
  console.error("Non-neutered general cat should not default to a sterilised/light formula.");
  console.error({ regularRanking, sterilisedRanking });
  process.exit(1);
}

if (
  !sterilisedRanking.signals.some(
    (signal) =>
      signal.code === "cat_weight_positioning_without_context" && signal.type === "exclude"
  )
) {
  console.error("Expected cat_weight_positioning_without_context exclude signal.");
  console.error(sterilisedRanking.signals);
  process.exit(1);
}

if (sterilisedRanking.bucket !== "hold") {
  console.error("Expected sterilised/light cat food to be held for non-neutered general cat context.");
  console.error(sterilisedRanking);
  process.exit(1);
}

const indoorSterilisedAdult = catFood({
  id: "indoor-sterilised-adult",
  formula_key: "qa-cat|indoor-sterilised-adult|cat|dry",
  display_name: "Indoor Grain Free Sterilised",
  ingredients: ["chicken", "rice", "minerals"],
  commercial_tags: ["indoor", "sterilised"],
  kcal_per_100g: 335,
});
const nonNeuteredGeneralSplit = splitFoodV2Recommendations(
  [regularAdult, sterilisedAdult, indoorSterilisedAdult].map((food) =>
    rankFoodV2ForPet({
      food,
      nutrients: nutrients(),
      pet: adultNonNeuteredCat,
      goal: "general",
    })
  ),
  3,
  "general"
);
const visibleNonNeuteredCatFoods = [
  ...nonNeuteredGeneralSplit.premium,
  ...nonNeuteredGeneralSplit.value,
];

if (
  visibleNonNeuteredCatFoods.some((food) =>
    /sterilised|neutered|light/i.test([food.display_name, food.formula_key].join(" "))
  )
) {
  console.error("Non-neutered general cat shortlist should not expose sterilised/light foods.");
  console.error(visibleNonNeuteredCatFoods.map((food) => food.display_name));
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

const sterilisedIndoorCat = {
  ...adultNonNeuteredCat,
  weight: 5.5,
  activityLevel: "low" as const,
  neutered: true,
  healthIssues: ["sterilised", "indoor"],
};
const leanSterilisedCat = catFood({
  id: "lean-sterilised-cat",
  formula_key: "qa-cat|lean-sterilised|cat|dry",
  display_name: "Sterilised Light Chicken",
  commercial_tags: ["sterilised", "light"],
  kcal_per_100g: 330,
});
const richAdultCat = catFood({
  id: "rich-adult-cat",
  formula_key: "qa-cat|rich-adult|cat|dry",
  display_name: "Adult Active Chicken",
  commercial_tags: ["adult", "active"],
  kcal_per_100g: 390,
});
const sterilisedRankings = [leanSterilisedCat, richAdultCat].map((food) =>
  rankFoodV2ForPet({
    food,
    nutrients: nutrients(
      food === richAdultCat
        ? { protein_percent: 34, fat_percent: 18 }
        : { protein_percent: 32, fat_percent: 9 }
    ),
    pet: sterilisedIndoorCat,
    goal: "sterilised",
  })
);
const sterilisedSplit = splitFoodV2Recommendations(sterilisedRankings, 2, "sterilised");
const richAdultRanking = sterilisedRankings.find(
  (ranking) => ranking.formula_key === "qa-cat|rich-adult|cat|dry"
);

if (sterilisedSplit.premium[0]?.formula_key !== "qa-cat|lean-sterilised|cat|dry") {
  console.error("Sterilised indoor cat should start from a lean sterilised-positioned food.");
  console.error({ sterilisedRankings, sterilisedSplit });
  process.exit(1);
}

if (!richAdultRanking?.signals.some((signal) => signal.code === "sterilised_rich_formula_mismatch")) {
  console.error("Expected rich adult cat food to be rejected for sterilised cat shortlist.");
  console.error(richAdultRanking);
  process.exit(1);
}

const renalCatPet = {
  ...adultNonNeuteredCat,
  age: 12,
  weight: 4.2,
  activityLevel: "low" as const,
  neutered: true,
  healthIssues: ["renal", "kidney disease"],
};
const renalCatFood = catFood({
  id: "renal-cat",
  formula_key: "qa-cat|renal|cat|dry",
  display_name: "Renal Cat",
  medical_tags: ["renal"],
  commercial_tags: ["veterinary"],
  kcal_per_100g: 400,
});
const urinaryOnlyCatFood = catFood({
  id: "urinary-only-cat",
  formula_key: "qa-cat|urinary-only|cat|dry",
  display_name: "Urinary Oxalate Cat",
  medical_tags: ["urinary"],
  commercial_tags: ["veterinary", "urinary", "oxalate"],
  kcal_per_100g: 370,
});
const renalRankings = [renalCatFood, urinaryOnlyCatFood].map((food) =>
  rankFoodV2ForPet({
    food,
    nutrients: nutrients(
      food === renalCatFood
        ? { phosphorus_percent: 0.45, sodium_percent: 0.25, protein_percent: 26 }
        : { phosphorus_percent: 0.9, sodium_percent: 0.4, protein_percent: 32 }
    ),
    pet: renalCatPet,
    goal: "renal",
  })
);
const renalSplit = splitFoodV2Recommendations(renalRankings, 2, "renal");
const urinaryOnlyRenalRanking = renalRankings.find(
  (ranking) => ranking.formula_key === "qa-cat|urinary-only|cat|dry"
);

if (renalSplit.premium[0]?.formula_key !== "qa-cat|renal|cat|dry") {
  console.error("Renal cat should start from renal-positioned food.");
  console.error({ renalRankings, renalSplit });
  process.exit(1);
}

if (
  urinaryOnlyRenalRanking?.bucket !== "hold" ||
  !urinaryOnlyRenalRanking.signals.some((signal) => signal.code === "renal_urinary_mismatch")
) {
  console.error("Urinary-only cat food should stay on hold for renal cat cases.");
  console.error(urinaryOnlyRenalRanking);
  process.exit(1);
}

const seniorCatPet = {
  ...adultNonNeuteredCat,
  age: 13,
  weight: 4.8,
  activityLevel: "low" as const,
  neutered: true,
  healthIssues: ["senior", "low activity"],
};
const seniorCatFood = catFood({
  id: "senior-cat",
  formula_key: "qa-cat|senior|cat|dry",
  display_name: "Senior 11+ Chicken",
  life_stage: "senior",
  commercial_tags: ["senior"],
  kcal_per_100g: 350,
});
const renalTherapeuticForSenior = catFood({
  id: "renal-therapeutic-for-senior",
  formula_key: "qa-cat|renal-therapeutic-for-senior|cat|dry",
  display_name: "Renal Cat",
  medical_tags: ["renal"],
  commercial_tags: ["veterinary", "renal"],
  kcal_per_100g: 390,
});
const seniorRankings = [seniorCatFood, renalTherapeuticForSenior].map((food) =>
  rankFoodV2ForPet({
    food,
    nutrients: nutrients(
      food === seniorCatFood
        ? { protein_percent: 30, fat_percent: 12 }
        : { protein_percent: 26, fat_percent: 17, phosphorus_percent: 0.45 }
    ),
    pet: seniorCatPet,
    goal: "senior",
  })
);
const seniorSplit = splitFoodV2Recommendations(seniorRankings, 2, "senior");
const renalTherapeuticSeniorRanking = seniorRankings.find(
  (ranking) => ranking.formula_key === "qa-cat|renal-therapeutic-for-senior|cat|dry"
);

if (seniorSplit.premium[0]?.formula_key !== "qa-cat|senior|cat|dry") {
  console.error("Senior cat without renal history should start from visible senior food.");
  console.error({ seniorRankings, seniorSplit });
  process.exit(1);
}

if (
  renalTherapeuticSeniorRanking?.bucket !== "hold" ||
  !renalTherapeuticSeniorRanking.signals.some(
    (signal) => signal.code === "therapeutic_food_without_matching_condition"
  )
) {
  console.error("Renal therapeutic food should not be visible for senior cat without renal context.");
  console.error(renalTherapeuticSeniorRanking);
  process.exit(1);
}

const sensitiveDigestionCatPet = {
  ...adultNonNeuteredCat,
  age: 4,
  weight: 4.5,
  healthIssues: ["sensitive digestion", "soft stool"],
};
const digestiveCatFood = catFood({
  id: "digestive-cat",
  formula_key: "qa-cat|digestive|cat|dry",
  display_name: "Sensitive Digestion Chicken",
  commercial_tags: ["sensitive_digestion", "digestive"],
  fiber_sources: ["beet pulp", "psyllium"],
  kcal_per_100g: 365,
});
const renalCatWithoutRenalContext = catFood({
  id: "renal-cat-without-renal-context",
  formula_key: "qa-cat|renal-without-context|cat|dry",
  display_name: "Vet Diet Cat Renal",
  medical_tags: ["renal"],
  commercial_tags: ["veterinary", "renal"],
  kcal_per_100g: 390,
});
const urinaryCatWithoutUrinaryContext = catFood({
  id: "urinary-cat-without-urinary-context",
  formula_key: "qa-cat|urinary-without-context|cat|dry",
  display_name: "Vet Diet Cat Urinary S/O",
  medical_tags: ["urinary"],
  commercial_tags: ["veterinary", "urinary"],
  kcal_per_100g: 370,
});
const sensitiveDigestionRankings = [
  digestiveCatFood,
  renalCatWithoutRenalContext,
  urinaryCatWithoutUrinaryContext,
].map((food) =>
  rankFoodV2ForPet({
    food,
    nutrients: nutrients(
      food === digestiveCatFood
        ? { protein_percent: 32, fat_percent: 13, fiber_percent: 4 }
        : { protein_percent: 28, fat_percent: 16, fiber_percent: 3 }
    ),
    pet: sensitiveDigestionCatPet,
    goal: "sensitive_digestion",
  })
);
const sensitiveDigestionSplit = splitFoodV2Recommendations(
  sensitiveDigestionRankings,
  2,
  "sensitive_digestion"
);
const renalSensitiveMismatch = sensitiveDigestionRankings.find(
  (ranking) => ranking.formula_key === "qa-cat|renal-without-context|cat|dry"
);
const urinarySensitiveMismatch = sensitiveDigestionRankings.find(
  (ranking) => ranking.formula_key === "qa-cat|urinary-without-context|cat|dry"
);

if (sensitiveDigestionSplit.premium[0]?.formula_key !== "qa-cat|digestive|cat|dry") {
  console.error("Sensitive-digestion cat should start from digestive-positioned food.");
  console.error({ sensitiveDigestionRankings, sensitiveDigestionSplit });
  process.exit(1);
}

for (const ranking of [renalSensitiveMismatch, urinarySensitiveMismatch]) {
  if (
    ranking?.bucket !== "hold" ||
    !ranking.signals.some((signal) => signal.code === "medical_diet_not_digestive_fit")
  ) {
    console.error("Renal/urinary vet diets should not be visible for digestive-only cat cases.");
    console.error(ranking);
    process.exit(1);
  }
}

console.log("Cat Food V2 ranking balance checks passed.");
