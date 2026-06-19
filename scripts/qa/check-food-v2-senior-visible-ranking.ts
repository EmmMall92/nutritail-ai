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

console.log("Food V2 senior visible ranking QA passed.");
