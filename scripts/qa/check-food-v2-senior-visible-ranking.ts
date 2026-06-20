import { rankFoodV2ForPet } from "@/lib/food-v2/recommendationRanking";
import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";

function makeFood(overrides: Partial<FoodProductV2>): FoodProductV2 {
  return {
    brand: "Test Brand",
    formula_name: "Adult Neutered",
    display_name: "Adult Neutered",
    species: "dog",
    format: "dry",
    life_stage: "adult",
    dog_size: "small",
    breed_target: null,
    medical_tags: [],
    commercial_tags: ["weight_control", "senior"],
    ingredient_text: null,
    ingredients: ["duck", "rice", "pea fiber", "minerals", "fish oil"],
    primary_animal_proteins: ["duck"],
    carbohydrate_sources: ["rice"],
    fat_sources: ["fish oil"],
    fiber_sources: ["pea fiber"],
    kcal_per_100g: 344,
    data_quality_status: "needs_review",
    source_priority: "retailer",
    formula_key: "test-brand|adult-neutered|dog|dry",
    ...overrides,
  };
}

const nutrients: FoodNutrientsV2 = {
  protein_percent: 26,
  fat_percent: 11,
  fiber_percent: 5,
  calcium_percent: 1.1,
  phosphorus_percent: 0.8,
};

const pet = {
  species: "dog" as const,
  breed: "Yorkshire Terrier",
  age: 11,
  weight: 5,
  activityLevel: "low" as const,
  neutered: true,
  allergies: [],
  healthIssues: ["senior", "low activity"],
};

const jointPet = {
  ...pet,
  breed: "Mixed breed",
  weight: 18,
  healthIssues: ["senior", "joint support"],
};
const greekJointPet = {
  ...pet,
  breed: "Mixed breed",
  weight: 18,
  healthIssues: ["αρθρίτιδα", "δυσπλασία ισχίου"],
};

const adultHiddenSenior = rankFoodV2ForPet({
  food: makeFood({}),
  nutrients,
  pet,
  goal: "senior",
});

const visibleSenior = rankFoodV2ForPet({
  food: makeFood({
    formula_name: "Senior Small",
    display_name: "Senior Small",
    life_stage: "senior",
    commercial_tags: ["senior"],
    formula_key: "test-brand|senior-small|dog|dry",
  }),
  nutrients,
  pet,
  goal: "senior",
});

const hiddenAdultSignal = adultHiddenSenior.signals.find(
  (signal) => signal.code === "adult_title_for_senior_shortlist"
);
const visibleSeniorSignal = visibleSenior.signals.find(
  (signal) => signal.code === "customer_visible_senior_positioning"
);
const hiddenSterilisedSenior = rankFoodV2ForPet({
  food: makeFood({
    formula_name: "Sterilised Tuna With Peas",
    display_name: "Sterilised Tuna With Peas",
    life_stage: "adult",
    commercial_tags: ["senior", "sterilised"],
    formula_key: "test-brand|sterilised-tuna-hidden-senior|dog|dry",
  }),
  nutrients,
  pet,
  goal: "senior",
});
const hiddenSterilisedSeniorSignal = hiddenSterilisedSenior.signals.find(
  (signal) => signal.code === "senior_positioning_not_customer_visible"
);

if (!hiddenAdultSignal || hiddenAdultSignal.points > -40) {
  console.error("Adult-labelled senior candidate did not receive the stronger visible-title penalty.");
  process.exit(1);
}

if (!visibleSeniorSignal || visibleSeniorSignal.points < 15) {
  console.error("Customer-visible senior candidate did not receive a senior-title boost.");
  process.exit(1);
}

if (visibleSenior.total_score <= adultHiddenSenior.total_score) {
  console.error("Visible senior food should outrank an adult-labelled hidden senior candidate.");
  console.error(
    JSON.stringify(
      {
        adultHiddenSenior: {
          total_score: adultHiddenSenior.total_score,
          fit_score: adultHiddenSenior.fit_score,
          cautions: adultHiddenSenior.cautions,
        },
        visibleSenior: {
          total_score: visibleSenior.total_score,
          fit_score: visibleSenior.fit_score,
          reasons: visibleSenior.reasons,
        },
      },
      null,
      2
    )
  );
  process.exit(1);
}

const elevenPlusSenior = rankFoodV2ForPet({
  food: makeFood({
    formula_name: "Adult 11+ Small",
    display_name: "Adult 11+ Small",
    life_stage: "adult",
    commercial_tags: [],
    formula_key: "test-brand|adult-11-plus-small|dog|dry",
  }),
  nutrients,
  pet,
  goal: "senior",
});
const elevenPlusSignal = elevenPlusSenior.signals.find(
  (signal) => signal.code === "customer_visible_senior_positioning"
);

if (!elevenPlusSignal || elevenPlusSenior.bucket === "hold") {
  console.error("Customer-visible 11+ title should count as senior positioning.");
  console.error(elevenPlusSenior);
  process.exit(1);
}

if (!hiddenSterilisedSeniorSignal || hiddenSterilisedSeniorSignal.points > -25) {
  console.error("Hidden senior metadata without a customer-visible senior title should be penalized.");
  console.error(hiddenSterilisedSenior.signals);
  process.exit(1);
}

if (hiddenSterilisedSenior.bucket !== "hold") {
  console.error("Hidden senior metadata without a customer-visible senior title should be held.");
  console.error(hiddenSterilisedSenior);
  process.exit(1);
}

if (visibleSenior.total_score <= hiddenSterilisedSenior.total_score) {
  console.error("Visible senior food should outrank a hidden senior-tagged sterilised candidate.");
  console.error(
    JSON.stringify(
      {
        hiddenSterilisedSenior: {
          total_score: hiddenSterilisedSenior.total_score,
          fit_score: hiddenSterilisedSenior.fit_score,
          cautions: hiddenSterilisedSenior.cautions,
        },
        visibleSenior: {
          total_score: visibleSenior.total_score,
          fit_score: visibleSenior.fit_score,
          reasons: visibleSenior.reasons,
        },
      },
      null,
      2
    )
  );
  process.exit(1);
}

const plainSenior = rankFoodV2ForPet({
  food: makeFood({
    formula_name: "Senior Chicken",
    display_name: "Senior Chicken",
    life_stage: "senior",
    dog_size: "medium",
    commercial_tags: ["senior"],
    formula_key: "test-brand|senior-chicken|dog|dry",
  }),
  nutrients,
  pet: jointPet,
  goal: "senior",
});

const mobilitySenior = rankFoodV2ForPet({
  food: makeFood({
    formula_name: "Senior Joint Mobility Chicken",
    display_name: "Senior Joint Mobility Chicken",
    life_stage: "senior",
    dog_size: "medium",
    commercial_tags: ["senior", "mobility"],
    medical_tags: ["mobility"],
    formula_key: "test-brand|senior-joint-mobility|dog|dry",
  }),
  nutrients: {
    ...nutrients,
    epa_dha_percent: 0.3,
    glucosamine_mgkg: 450,
    chondroitin_mgkg: 350,
  },
  pet: jointPet,
  goal: "senior",
});

const ingredientOnlyJointSignals = rankFoodV2ForPet({
  food: makeFood({
    formula_name: "Senior Chicken",
    display_name: "Senior Chicken",
    life_stage: "senior",
    dog_size: "medium",
    commercial_tags: ["senior"],
    medical_tags: [],
    ingredients: ["chicken", "rice", "glucosamine", "chondroitin", "minerals"],
    ingredient_text: "chicken, rice, glucosamine, chondroitin, minerals",
    formula_key: "test-brand|senior-ingredient-only-joint|dog|dry",
  }),
  nutrients,
  pet: jointPet,
  goal: "senior",
});

if (mobilitySenior.total_score <= plainSenior.total_score) {
  console.error("Senior joint/mobility food should outrank plain senior food for joint-support context.");
  console.error(
    JSON.stringify(
      {
        plainSenior: {
          total_score: plainSenior.total_score,
          fit_score: plainSenior.fit_score,
          cautions: plainSenior.cautions,
        },
        mobilitySenior: {
          total_score: mobilitySenior.total_score,
          fit_score: mobilitySenior.fit_score,
          reasons: mobilitySenior.reasons,
        },
      },
      null,
      2
    )
  );
  process.exit(1);
}

if (
  !mobilitySenior.signals.some(
    (signal) => signal.code === "senior_joint_mobility_positioning"
  )
) {
  console.error("Expected senior_joint_mobility_positioning for senior joint context.");
  console.error(mobilitySenior.signals);
  process.exit(1);
}

if (
  ingredientOnlyJointSignals.signals.some(
    (signal) => signal.code === "senior_joint_mobility_positioning"
  )
) {
  console.error("Ingredient-only glucosamine/chondroitin should not count as visible joint/mobility positioning.");
  console.error(ingredientOnlyJointSignals.signals);
  process.exit(1);
}

if (
  !plainSenior.signals.some(
    (signal) => signal.code === "senior_joint_context_without_mobility_signal"
  )
) {
  console.error("Expected senior_joint_context_without_mobility_signal for plain senior joint context.");
  console.error(plainSenior.signals);
  process.exit(1);
}

const greekPlainSenior = rankFoodV2ForPet({
  food: makeFood({
    formula_name: "Senior Chicken",
    display_name: "Senior Chicken",
    life_stage: "senior",
    dog_size: "medium",
    commercial_tags: ["senior"],
    formula_key: "test-brand|senior-greek-plain|dog|dry",
  }),
  nutrients,
  pet: greekJointPet,
  goal: "senior",
});

const greekMobilitySenior = rankFoodV2ForPet({
  food: makeFood({
    formula_name: "Senior Joint Mobility Chicken",
    display_name: "Senior Joint Mobility Chicken",
    life_stage: "senior",
    dog_size: "medium",
    commercial_tags: ["senior", "mobility"],
    medical_tags: ["mobility"],
    formula_key: "test-brand|senior-greek-mobility|dog|dry",
  }),
  nutrients: {
    ...nutrients,
    epa_dha_percent: 0.3,
    glucosamine_mgkg: 450,
  },
  pet: greekJointPet,
  goal: "senior",
});

if (greekMobilitySenior.total_score <= greekPlainSenior.total_score) {
  console.error("Greek arthritis/hip dysplasia context should prefer senior mobility food over plain senior food.");
  console.error({ greekPlainSenior, greekMobilitySenior });
  process.exit(1);
}

if (
  !greekMobilitySenior.signals.some(
    (signal) => signal.code === "senior_joint_mobility_positioning"
  )
) {
  console.error("Expected senior_joint_mobility_positioning for Greek mobility context.");
  console.error(greekMobilitySenior.signals);
  process.exit(1);
}

const lowAppetiteSeniorPet = {
  ...pet,
  healthIssues: ["senior", "low appetite", "not eating much"],
};

const lightSeniorForLowAppetite = rankFoodV2ForPet({
  food: makeFood({
    formula_name: "Senior Light Chicken",
    display_name: "Senior Light Chicken",
    life_stage: "senior",
    dog_size: "small",
    commercial_tags: ["senior", "light", "weight_control"],
    formula_key: "test-brand|senior-light-chicken|dog|dry",
    kcal_per_100g: 318,
  }),
  nutrients: {
    ...nutrients,
    fat_percent: 8,
    fiber_percent: 7,
  },
  pet: lowAppetiteSeniorPet,
  goal: "senior",
});

const regularSeniorForLowAppetite = rankFoodV2ForPet({
  food: makeFood({
    formula_name: "Senior Chicken",
    display_name: "Senior Chicken",
    life_stage: "senior",
    dog_size: "small",
    commercial_tags: ["senior"],
    formula_key: "test-brand|senior-regular-chicken|dog|dry",
    kcal_per_100g: 365,
  }),
  nutrients: {
    ...nutrients,
    fat_percent: 13,
    fiber_percent: 3,
  },
  pet: lowAppetiteSeniorPet,
  goal: "senior",
});

if (
  !lightSeniorForLowAppetite.signals.some(
    (signal) => signal.code === "senior_appetite_weight_loss_avoid_light_default"
  )
) {
  console.error("Senior low-appetite light food should carry an avoid-light-default caution.");
  console.error(lightSeniorForLowAppetite.signals);
  process.exit(1);
}

if (lightSeniorForLowAppetite.bucket !== "hold") {
  console.error("Senior low-appetite light food should be held rather than used as a first pick.");
  console.error(lightSeniorForLowAppetite);
  process.exit(1);
}

if (regularSeniorForLowAppetite.total_score <= lightSeniorForLowAppetite.total_score) {
  console.error("Regular senior food should outrank light senior food for a low-appetite senior pet.");
  console.error({ lightSeniorForLowAppetite, regularSeniorForLowAppetite });
  process.exit(1);
}

const seniorCatPet = {
  species: "cat" as const,
  breed: "European shorthair",
  age: 12,
  weight: 4.8,
  activityLevel: "low" as const,
  neutered: true,
  allergies: [],
  healthIssues: ["senior", "low activity"],
};
const hiddenSterilisedCatSenior = rankFoodV2ForPet({
  food: makeFood({
    brand: "Monge BWild",
    formula_name: "BWild Grain Free Sterilised Tuna With Peas",
    display_name: "BWild Grain Free Sterilised Tuna With Peas",
    species: "cat",
    life_stage: "adult",
    dog_size: "unknown",
    commercial_tags: ["senior", "sterilised"],
    formula_key: "monge-bwild|sterilised-tuna-hidden-senior|cat|dry",
  }),
  nutrients,
  pet: seniorCatPet,
  goal: "senior",
});
const visibleSeniorCat = rankFoodV2ForPet({
  food: makeFood({
    brand: "Monge",
    formula_name: "Senior Rich In Chicken",
    display_name: "Senior Rich In Chicken",
    species: "cat",
    life_stage: "senior",
    dog_size: "unknown",
    commercial_tags: ["senior"],
    formula_key: "monge|senior-rich-in-chicken|cat|dry",
  }),
  nutrients,
  pet: seniorCatPet,
  goal: "senior",
});

if (hiddenSterilisedCatSenior.bucket !== "hold") {
  console.error("Adult sterilised cat food with hidden senior metadata should be held for senior-cat shortlists.");
  console.error(hiddenSterilisedCatSenior);
  process.exit(1);
}

if (
  !hiddenSterilisedCatSenior.signals.some(
    (signal) => signal.code === "senior_positioning_not_customer_visible"
  )
) {
  console.error("Expected senior_positioning_not_customer_visible for hidden senior cat metadata.");
  console.error(hiddenSterilisedCatSenior.signals);
  process.exit(1);
}

if (visibleSeniorCat.bucket === "hold") {
  console.error("Customer-visible senior cat food should remain selectable for senior-cat shortlists.");
  console.error(visibleSeniorCat);
  process.exit(1);
}

if (visibleSeniorCat.total_score <= hiddenSterilisedCatSenior.total_score) {
  console.error("Visible senior cat food should outrank hidden senior adult sterilised food.");
  console.error({ hiddenSterilisedCatSenior, visibleSeniorCat });
  process.exit(1);
}

console.log("Food V2 senior visible ranking QA passed.");
