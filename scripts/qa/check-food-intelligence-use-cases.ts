import { evaluateFoodIntelligence } from "@/lib/food-intelligence/evaluateFood";

function assert(condition: boolean, message: string, details?: unknown) {
  if (condition) return;

  console.error(message);
  if (details) console.error(details);
  process.exit(1);
}

const sterilisedLight = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  dog_size: "small",
  health_tags: ["sterilised", "weight_control"],
  ingredient_tags: ["chicken", "rice"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 332,
    protein_percent: 26,
    fat_percent: 9,
    fiber_percent: 5.5,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
    magnesium_percent: 0.08,
  },
});

assert(
  sterilisedLight.best_use_cases.includes("calorie_aware_feeding"),
  "Expected calorie_aware_feeding for lower-kcal, lower-fat sterilised food.",
  sterilisedLight
);
assert(
  sterilisedLight.best_use_cases.includes("sterilised_weight_management"),
  "Expected sterilised_weight_management for visibly sterilised food with weight-aware nutrition.",
  sterilisedLight
);
assert(
  sterilisedLight.food_strengths.some((item) => item.includes("Fiber level")),
  "Expected fiber strength for satiety/stool support.",
  sterilisedLight
);
assert(
  sterilisedLight.food_strengths.some((item) =>
    item.includes("Calorie and fat profile fits weight-aware feeding")
  ),
  "Expected weight-aware strength for sterilised food with lower kcal and fat.",
  sterilisedLight
);

const activeFood = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  dog_size: "large",
  health_tags: ["active"],
  ingredient_tags: ["chicken"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 402,
    protein_percent: 30,
    fat_percent: 18,
    fiber_percent: 2.5,
    calcium_percent: 1.2,
    phosphorus_percent: 0.9,
  },
});

assert(
  activeFood.best_use_cases.includes("active_working"),
  "Expected active_working for active/high-energy food.",
  activeFood
);
assert(
  activeFood.best_use_cases.includes("high_activity_energy_support"),
  "Expected high_activity_energy_support for active food with higher kcal and fat.",
  activeFood
);
assert(
  activeFood.not_ideal_cases.includes("low_activity_sterilised_without_portion_control"),
  "Expected high-calorie food to be marked as not ideal for low-activity/sterilised pets without portion control.",
  activeFood
);

const seniorMobility = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "senior",
  dog_size: "medium",
  health_tags: ["senior"],
  ingredient_tags: ["fish"],
  medical_tags: ["mobility"],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 350,
    protein_percent: 25,
    fat_percent: 12,
    fiber_percent: 3,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
    epa_dha_percent: 0.3,
  },
});

assert(
  seniorMobility.best_use_cases.includes("senior_mobility"),
  "Expected senior_mobility when senior/mobility positioning has EPA-DHA data.",
  seniorMobility
);
assert(
  seniorMobility.best_use_cases.includes("epa_omega_review"),
  "Expected epa_omega_review when senior/mobility positioning has combined EPA-DHA data.",
  seniorMobility
);
assert(
  seniorMobility.not_ideal_cases.includes("omega_detail_combined_not_split"),
  "Expected combined EPA-DHA data to be flagged as useful but less precise than split EPA/DHA.",
  seniorMobility
);
assert(
  seniorMobility.best_use_cases.includes("senior_muscle_monitoring"),
  "Expected senior_muscle_monitoring when senior food has useful protein data.",
  seniorMobility
);

const puppyGrowth = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "puppy",
  dog_size: "large",
  health_tags: ["puppy"],
  ingredient_tags: ["chicken"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 380,
    protein_percent: 30,
    fat_percent: 15,
    fiber_percent: 2.8,
    calcium_percent: 1.2,
    phosphorus_percent: 0.9,
    dha_percent: 0.08,
  },
});

assert(
  puppyGrowth.best_use_cases.includes("growth_development"),
  "Expected growth_development for puppy food with DHA.",
  puppyGrowth
);

assert(
  puppyGrowth.best_use_cases.includes("dha_growth_review"),
  "Expected dha_growth_review for puppy food with declared DHA.",
  puppyGrowth
);

assert(
  puppyGrowth.food_strengths.some((item) =>
    item.includes("Declared DHA supports growth")
  ),
  "Expected declared DHA strength for puppy growth interpretation.",
  puppyGrowth
);

assert(
  puppyGrowth.best_use_cases.includes("large_breed_growth_mineral_review"),
  "Expected large_breed_growth_mineral_review for large-breed puppy food with Ca/P data.",
  puppyGrowth
);

const largeBreedPuppyMissingMinerals = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "puppy",
  dog_size: "large",
  health_tags: ["puppy", "large_breed"],
  ingredient_tags: ["chicken"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 390,
    protein_percent: 31,
    fat_percent: 16,
    fiber_percent: 2.5,
  },
});

assert(
  largeBreedPuppyMissingMinerals.not_ideal_cases.includes(
    "large_breed_growth_without_mineral_review"
  ),
  "Expected large_breed_growth_without_mineral_review when large-breed puppy mineral data is missing.",
  largeBreedPuppyMissingMinerals
);

const renalFood = evaluateFoodIntelligence({
  species: "cat",
  life_stage: "senior",
  health_tags: ["senior"],
  ingredient_tags: ["fish"],
  medical_tags: ["renal"],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 390,
    protein_percent: 24,
    fat_percent: 16,
    fiber_percent: 2,
    phosphorus_percent: 0.45,
  },
});

assert(
  renalFood.best_use_cases.includes("renal_phosphorus_review"),
  "Expected renal_phosphorus_review for renal-positioned food with phosphorus data.",
  renalFood
);

assert(
  renalFood.not_ideal_cases.includes("renal_decision_without_sodium_context"),
  "Expected renal_decision_without_sodium_context when renal-positioned food has phosphorus but no sodium data.",
  renalFood
);

const renalCompleteMineralFood = evaluateFoodIntelligence({
  species: "cat",
  life_stage: "senior",
  health_tags: ["senior"],
  ingredient_tags: ["fish"],
  medical_tags: ["renal"],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 374,
    protein_percent: 26,
    fat_percent: 15,
    fiber_percent: 2.4,
    phosphorus_percent: 0.42,
    sodium_percent: 0.28,
  },
});

assert(
  renalCompleteMineralFood.best_use_cases.includes("renal_mineral_review"),
  "Expected renal_mineral_review when renal-positioned food has phosphorus and sodium data.",
  renalCompleteMineralFood
);

assert(
  renalCompleteMineralFood.food_strengths.some((item) =>
    item.includes("Phosphorus and sodium")
  ),
  "Expected renal strength explaining phosphorus and sodium availability.",
  renalCompleteMineralFood
);

const urinaryCompleteMineralFood = evaluateFoodIntelligence({
  species: "cat",
  life_stage: "adult",
  health_tags: ["urinary"],
  ingredient_tags: ["chicken", "rice"],
  medical_tags: ["urinary", "struvite"],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 355,
    protein_percent: 32,
    fat_percent: 12,
    fiber_percent: 3,
    phosphorus_percent: 0.72,
    magnesium_percent: 0.07,
    sodium_percent: 0.55,
  },
});

assert(
  urinaryCompleteMineralFood.best_use_cases.includes("urinary_mineral_review"),
  "Expected urinary_mineral_review when urinary food has magnesium and phosphorus data.",
  urinaryCompleteMineralFood
);

assert(
  urinaryCompleteMineralFood.best_use_cases.includes("urinary_complete_mineral_review"),
  "Expected urinary_complete_mineral_review when urinary food has magnesium, phosphorus and sodium data.",
  urinaryCompleteMineralFood
);

assert(
  urinaryCompleteMineralFood.food_strengths.some((item) =>
    item.includes("Magnesium, phosphorus and sodium")
  ),
  "Expected urinary strength explaining magnesium, phosphorus and sodium availability.",
  urinaryCompleteMineralFood
);

const urinaryMissingSodiumFood = evaluateFoodIntelligence({
  species: "cat",
  life_stage: "adult",
  health_tags: ["urinary"],
  ingredient_tags: ["chicken", "rice"],
  medical_tags: ["urinary", "oxalate"],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 360,
    protein_percent: 31,
    fat_percent: 13,
    fiber_percent: 3,
    phosphorus_percent: 0.7,
    magnesium_percent: 0.08,
  },
});

assert(
  urinaryMissingSodiumFood.not_ideal_cases.includes(
    "urinary_decision_without_full_mineral_review"
  ),
  "Expected urinary_decision_without_full_mineral_review when urinary food lacks sodium data.",
  urinaryMissingSodiumFood
);

assert(
  urinaryMissingSodiumFood.food_cautions.some((item) => item.includes("sodium")),
  "Expected urinary caution mentioning sodium when sodium data is missing.",
  urinaryMissingSodiumFood
);

const lowFatPancreatitisReview = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  health_tags: ["sensitive_digestion"],
  ingredient_tags: ["turkey", "rice"],
  medical_tags: ["pancreatitis"],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 330,
    protein_percent: 24,
    fat_percent: 8,
    fiber_percent: 3,
    calcium_percent: 1,
    phosphorus_percent: 0.8,
  },
});

assert(
  lowFatPancreatitisReview.best_use_cases.includes("low_fat_pancreatitis_review"),
  "Expected low_fat_pancreatitis_review for pancreatitis-positioned food with low fat data.",
  lowFatPancreatitisReview
);

const highFatPancreatitisMismatch = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  health_tags: ["sensitive_digestion"],
  ingredient_tags: ["chicken", "salmon"],
  medical_tags: ["pancreatitis"],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 410,
    protein_percent: 29,
    fat_percent: 18,
    fiber_percent: 2.5,
    calcium_percent: 1.2,
    phosphorus_percent: 0.9,
  },
});

assert(
  highFatPancreatitisMismatch.not_ideal_cases.includes("pancreatitis_without_low_fat_review"),
  "Expected high-fat pancreatitis-sensitive food to be flagged as not ideal without low-fat review.",
  highFatPancreatitisMismatch
);

const limitedProteinAllergyReview = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  health_tags: ["allergy"],
  ingredient_tags: ["duck", "rice"],
  medical_tags: ["dermatosis"],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 360,
    protein_percent: 25,
    fat_percent: 13,
    fiber_percent: 2.8,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
  },
});

assert(
  limitedProteinAllergyReview.best_use_cases.includes("limited_protein_allergy_review"),
  "Expected limited_protein_allergy_review for allergy-positioned food with one clear animal protein tag.",
  limitedProteinAllergyReview
);
assert(
  limitedProteinAllergyReview.food_strengths.some((item) =>
    item.includes("Single clear animal protein")
  ),
  "Expected a customer-useful strength for allergy-positioned food with one animal protein.",
  limitedProteinAllergyReview
);

const energyDenseSterilisedMismatch = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  dog_size: "small",
  health_tags: ["sterilised"],
  ingredient_tags: ["chicken", "rice"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 398,
    protein_percent: 28,
    fat_percent: 18,
    fiber_percent: 2,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
  },
});

assert(
  energyDenseSterilisedMismatch.not_ideal_cases.includes(
    "sterilised_weight_control_energy_mismatch"
  ),
  "Expected energy-dense, higher-fat sterilised-positioned food to be flagged as a mismatch.",
  energyDenseSterilisedMismatch
);

const lowEnergyActiveMismatch = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  dog_size: "large",
  health_tags: ["active"],
  ingredient_tags: ["chicken", "rice"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 330,
    protein_percent: 25,
    fat_percent: 9,
    fiber_percent: 5,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
  },
});

assert(
  lowEnergyActiveMismatch.not_ideal_cases.includes("active_working_without_energy_support"),
  "Expected active-positioned food with weight-aware nutrition to be marked as weak for working dogs.",
  lowEnergyActiveMismatch
);

const genericSeniorWithoutSupport = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "senior",
  dog_size: "medium",
  health_tags: [],
  ingredient_tags: ["chicken", "rice"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 360,
    protein_percent: 22,
    fat_percent: 12,
    fiber_percent: 3,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
  },
});

assert(
  genericSeniorWithoutSupport.not_ideal_cases.includes(
    "senior_without_clear_senior_or_mobility_support"
  ),
  "Expected senior food without visible senior/mobility/omega signals to be marked as less ideal.",
  genericSeniorWithoutSupport
);

const skinCoatOmegaReview = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  health_tags: ["skin"],
  ingredient_tags: ["salmon", "rice"],
  medical_tags: ["dermatosis"],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 365,
    protein_percent: 26,
    fat_percent: 14,
    fiber_percent: 2.5,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
    epa_dha_percent: 0.35,
  },
});

assert(
  skinCoatOmegaReview.best_use_cases.includes("skin_coat_omega_review"),
  "Expected skin_coat_omega_review when skin/coat positioning has declared EPA-DHA data.",
  skinCoatOmegaReview
);

const splitEpaDhaSkinFood = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  health_tags: ["skin"],
  ingredient_tags: ["salmon", "rice"],
  medical_tags: ["dermatosis"],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 365,
    protein_percent: 26,
    fat_percent: 14,
    fiber_percent: 2.5,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
    epa_percent: 0.18,
    dha_percent: 0.12,
  },
});

assert(
  splitEpaDhaSkinFood.food_strengths.some((item) =>
    item.includes("EPA and DHA are declared separately")
  ),
  "Expected split EPA/DHA strength when both values are declared separately.",
  splitEpaDhaSkinFood
);

assert(
  splitEpaDhaSkinFood.best_use_cases.includes("epa_omega_review"),
  "Expected epa_omega_review for skin/coat food with declared EPA.",
  splitEpaDhaSkinFood
);

assert(
  !splitEpaDhaSkinFood.not_ideal_cases.includes("omega_detail_combined_not_split"),
  "Did not expect combined-only caution when EPA and DHA are declared separately.",
  splitEpaDhaSkinFood
);

const skinCoatWithoutOmegaDetail = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  health_tags: ["skin"],
  ingredient_tags: ["fish", "rice"],
  medical_tags: ["dermatosis"],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 360,
    protein_percent: 25,
    fat_percent: 13,
    fiber_percent: 3,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
  },
});

assert(
  skinCoatWithoutOmegaDetail.not_ideal_cases.includes("skin_coat_without_omega_detail"),
  "Expected skin_coat_without_omega_detail when skin/coat positioning lacks EPA-DHA detail.",
  skinCoatWithoutOmegaDetail
);

const indoorSterilisedHairballCat = evaluateFoodIntelligence({
  species: "cat",
  life_stage: "adult",
  health_tags: ["indoor", "sterilised", "hairball"],
  ingredient_tags: ["chicken", "rice"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 338,
    protein_percent: 34,
    fat_percent: 11,
    fiber_percent: 6.5,
    calcium_percent: 1.1,
    phosphorus_percent: 0.9,
    magnesium_percent: 0.08,
  },
});

assert(
  indoorSterilisedHairballCat.best_use_cases.includes("hairball_fiber_support"),
  "Expected hairball_fiber_support for hairball-positioned cat food with useful fiber data.",
  indoorSterilisedHairballCat
);

assert(
  indoorSterilisedHairballCat.best_use_cases.includes("indoor_sterilised_weight_management"),
  "Expected indoor_sterilised_weight_management for indoor/sterilised cat food with weight-aware nutrition.",
  indoorSterilisedHairballCat
);

assert(
  indoorSterilisedHairballCat.food_strengths.some((item) =>
    item.includes("hairball-control positioning")
  ),
  "Expected a customer-useful hairball fiber strength.",
  indoorSterilisedHairballCat
);

const weakHairballCat = evaluateFoodIntelligence({
  species: "cat",
  life_stage: "adult",
  health_tags: ["hairball"],
  ingredient_tags: ["chicken", "rice"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 370,
    protein_percent: 33,
    fat_percent: 14,
    fiber_percent: 2.5,
    calcium_percent: 1.1,
    phosphorus_percent: 0.9,
  },
});

assert(
  weakHairballCat.not_ideal_cases.includes("hairball_without_fiber_support"),
  "Expected hairball_without_fiber_support when hairball positioning lacks useful fiber support.",
  weakHairballCat
);

assert(
  weakHairballCat.food_cautions.some((item) =>
    item.includes("Hairball positioning is weaker")
  ),
  "Expected hairball caution when fiber support is weak.",
  weakHairballCat
);

const fussyPalatabilityFood = evaluateFoodIntelligence({
  species: "cat",
  life_stage: "adult",
  health_tags: ["fussy_eater"],
  ingredient_tags: ["chicken", "fresh"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 385,
    protein_percent: 34,
    fat_percent: 15,
    fiber_percent: 2.5,
    calcium_percent: 1.1,
    phosphorus_percent: 0.9,
  },
});

assert(
  fussyPalatabilityFood.best_use_cases.includes("fussy_eater_palatability_trial"),
  "Expected fussy_eater_palatability_trial for fussy-positioned food with palatability support.",
  fussyPalatabilityFood
);

assert(
  fussyPalatabilityFood.food_strengths.some((item) =>
    item.includes("Palatability signals")
  ),
  "Expected a customer-useful palatability strength for fussy-eater food.",
  fussyPalatabilityFood
);

const weakFussyFood = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  health_tags: ["picky"],
  ingredient_tags: ["rice"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 330,
    protein_percent: 20,
    fat_percent: 7,
    fiber_percent: 3,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
  },
});

assert(
  weakFussyFood.not_ideal_cases.includes("fussy_eater_without_palatability_support"),
  "Expected fussy_eater_without_palatability_support when fussy positioning has weak palatability signals.",
  weakFussyFood
);

assert(
  weakFussyFood.food_cautions.some((item) =>
    item.includes("Fussy-eater positioning is weaker")
  ),
  "Expected fussy-eater caution when palatability support is weak.",
  weakFussyFood
);

const seniorSmallKibbleFood = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "senior",
  dog_size: "small",
  health_tags: ["senior", "easy_chewing", "small_kibble"],
  ingredient_tags: ["chicken", "rice"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 345,
    protein_percent: 25,
    fat_percent: 11,
    fiber_percent: 3,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
  },
});

assert(
  seniorSmallKibbleFood.best_use_cases.includes("easy_chewing_kibble_review"),
  "Expected easy_chewing_kibble_review for senior/small-kibble positioning.",
  seniorSmallKibbleFood
);

assert(
  seniorSmallKibbleFood.food_strengths.some((item) =>
    item.includes("easy-chew positioning")
  ),
  "Expected a customer-useful chewing-ease strength.",
  seniorSmallKibbleFood
);

const dentalLargeKibbleMismatch = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "senior",
  dog_size: "large",
  health_tags: ["dental"],
  ingredient_tags: ["chicken", "rice"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 365,
    protein_percent: 24,
    fat_percent: 13,
    fiber_percent: 3,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
  },
});

assert(
  dentalLargeKibbleMismatch.not_ideal_cases.includes(
    "chewing_difficulty_without_small_kibble_support"
  ),
  "Expected chewing_difficulty_without_small_kibble_support when dental positioning lacks small-kibble/easy-chew support.",
  dentalLargeKibbleMismatch
);

assert(
  dentalLargeKibbleMismatch.food_cautions.some((item) =>
    item.includes("Chewing-ease use is weaker")
  ),
  "Expected chewing-ease caution when support is weak.",
  dentalLargeKibbleMismatch
);

const summerLowAppetiteFood = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  dog_size: "large",
  health_tags: ["summer", "hot_weather", "low_appetite"],
  ingredient_tags: ["salmon", "rice"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 368,
    protein_percent: 27,
    fat_percent: 13,
    fiber_percent: 2.5,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
  },
});

assert(
  summerLowAppetiteFood.best_use_cases.includes("summer_low_appetite_feeding_review"),
  "Expected summer_low_appetite_feeding_review for hot-weather low-appetite context with usable energy density.",
  summerLowAppetiteFood
);

assert(
  summerLowAppetiteFood.food_strengths.some((item) =>
    item.includes("seasonal heat reduces")
  ),
  "Expected customer-useful summer low-appetite strength.",
  summerLowAppetiteFood
);

assert(
  summerLowAppetiteFood.food_cautions.some((item) =>
    item.includes("hydration and body-weight monitoring")
  ),
  "Expected hydration/body-weight monitoring caution for seasonal low appetite.",
  summerLowAppetiteFood
);

const summerLowEnergyFood = evaluateFoodIntelligence({
  species: "dog",
  life_stage: "adult",
  dog_size: "large",
  health_tags: ["summer", "hot_weather", "low_appetite"],
  ingredient_tags: ["chicken", "rice"],
  medical_tags: [],
  data_quality_status: "verified",
  source_priority: "official",
  nutrients: {
    kcal_per_100g: 320,
    protein_percent: 23,
    fat_percent: 8,
    fiber_percent: 3,
    calcium_percent: 1.1,
    phosphorus_percent: 0.8,
  },
});

assert(
  summerLowEnergyFood.not_ideal_cases.includes(
    "summer_low_appetite_without_energy_support"
  ),
  "Expected low-energy food to be not ideal for summer low-appetite context.",
  summerLowEnergyFood
);

console.log("Food intelligence use-case QA passed.");
