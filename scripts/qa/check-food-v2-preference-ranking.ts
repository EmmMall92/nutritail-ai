import {
  rankFoodV2ForPet,
  splitFoodV2Recommendations,
} from "@/lib/food-v2/recommendationRanking";
import {
  normalizeFoodV2RecommendationPetContext,
  recommendationGoalFrom,
} from "@/lib/food-v2/recommendationRequest";
import { detectFoodV2RecommendationGuardFlags } from "@/lib/food-v2/recommendationGuards";
import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";

const aiPayloadPet = normalizeFoodV2RecommendationPetContext({
  species: "dog",
  pet: {
    species: "dog",
    weightKg: 6,
    ageYears: 4,
    activity_level: "low",
    neutered: true,
    health_issues: "sensitive digestion",
    preferred_proteins: ["chicken"],
    excluded_ingredients: "lamb, beef",
  },
});

if (
  aiPayloadPet.weight !== 6 ||
  aiPayloadPet.age !== 4 ||
  aiPayloadPet.activityLevel !== "low" ||
  aiPayloadPet.healthIssues[0] !== "sensitive digestion" ||
  !aiPayloadPet.preferredProteins.includes("chicken") ||
  !aiPayloadPet.excludedIngredients.includes("lamb") ||
  !aiPayloadPet.excludedIngredients.includes("beef")
) {
  console.error("Food V2 recommendation request normalization should accept OpenAI-shaped pet payload fields.");
  console.error(aiPayloadPet);
  process.exit(1);
}

if (recommendationGoalFrom("not-a-real-goal") !== "general") {
  console.error("Unknown Food V2 recommendation goals should fall back to general.");
  process.exit(1);
}

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

const genericBreedAdultForSmallSterilised = food({
  id: "generic-breed-adult-small-sterilised",
  formula_key: "qa|generic-breed-adult-small-sterilised|dog|dry",
  brand: "Royal Canin",
  display_name: "Schnauzer Adult",
  formula_name: "Schnauzer Adult",
  dog_size: "small",
  breed_target: "Schnauzer",
  ingredients: ["poultry protein", "rice"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: null,
});
const clearSmallSterilisedFood = food({
  id: "clear-small-sterilised",
  formula_key: "qa|clear-small-sterilised|dog|dry",
  display_name: "Small Adult Light Sterilised Chicken",
  formula_name: "Small Adult Light Sterilised Chicken",
  dog_size: "small",
  commercial_tags: ["light", "sterilised"],
  ingredients: ["chicken", "rice", "beet pulp"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 325,
});
const genericBreedAdultRanking = rankFoodV2ForPet({
  food: genericBreedAdultForSmallSterilised,
  nutrients: {
    ...nutrients(genericBreedAdultForSmallSterilised),
    fat_percent: null,
  },
  pet,
  goal: "sterilised",
});
const clearSmallSterilisedRanking = rankFoodV2ForPet({
  food: clearSmallSterilisedFood,
  nutrients: {
    ...nutrients(clearSmallSterilisedFood),
    fat_percent: 9,
    fiber_percent: 6,
  },
  pet,
  goal: "sterilised",
});
const nonPreferredSterilisedFood = food({
  id: "non-preferred-sterilised",
  formula_key: "qa|non-preferred-sterilised|dog|dry",
  display_name: "Small Adult Duck Rice Sterilised",
  formula_name: "Small Adult Duck Rice Sterilised",
  dog_size: "small",
  commercial_tags: ["sterilised"],
  ingredients: ["duck", "rice", "beet pulp"],
  primary_animal_proteins: ["duck"],
  kcal_per_100g: 325,
});
const nonPreferredSterilisedRanking = rankFoodV2ForPet({
  food: nonPreferredSterilisedFood,
  nutrients: {
    ...nutrients(nonPreferredSterilisedFood),
    fat_percent: 9,
    fiber_percent: 6,
  },
  pet,
  goal: "sterilised",
});

if (genericBreedAdultRanking.bucket !== "hold") {
  console.error(
    "Small sterilised pets should not start from generic breed/adult foods without visible sterilised/light positioning or lean kcal/fat evidence."
  );
  console.error(genericBreedAdultRanking);
  process.exit(1);
}

if (
  !genericBreedAdultRanking.signals.some(
    (signal) => signal.code === "small_sterilised_generic_without_lean_evidence"
  )
) {
  console.error("Expected small_sterilised_generic_without_lean_evidence for generic breed adult food.");
  console.error(genericBreedAdultRanking.signals);
  process.exit(1);
}

if (clearSmallSterilisedRanking.bucket === "hold") {
  console.error("A clear small/light/sterilised food with lean nutrition should remain selectable.");
  console.error(clearSmallSterilisedRanking);
  process.exit(1);
}

if (clearSmallSterilisedRanking.total_score <= genericBreedAdultRanking.total_score) {
  console.error("Clear small/light/sterilised food should outrank generic breed adult food.");
  console.error({ clearSmallSterilisedRanking, genericBreedAdultRanking });
  process.exit(1);
}

if (clearSmallSterilisedRanking.total_score <= nonPreferredSterilisedRanking.total_score) {
  console.error(
    "When sterilised candidates are similarly safe, the preferred protein should order the shortlist."
  );
  console.error({ clearSmallSterilisedRanking, nonPreferredSterilisedRanking });
  process.exit(1);
}

const ingredientOnlyPreferredFood = food({
  id: "ingredient-only-preferred",
  formula_key: "qa|ingredient-only-preferred|dog|dry",
  display_name: "Small Adult Light Sterilised",
  formula_name: "Small Adult Light Sterilised",
  dog_size: "small",
  commercial_tags: ["light", "sterilised"],
  ingredients: ["chicken", "rice", "beet pulp"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 325,
});
const visiblePreferredFood = food({
  id: "visible-preferred",
  formula_key: "qa|visible-preferred|dog|dry",
  display_name: "Small Adult Light Sterilised Chicken",
  formula_name: "Small Adult Light Sterilised Chicken",
  dog_size: "small",
  commercial_tags: ["light", "sterilised"],
  ingredients: ["chicken", "rice", "beet pulp"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 325,
});
const ingredientOnlyPreferredRanking = rankFoodV2ForPet({
  food: ingredientOnlyPreferredFood,
  nutrients: {
    ...nutrients(ingredientOnlyPreferredFood),
    fat_percent: 9,
    fiber_percent: 6,
  },
  pet,
  goal: "sterilised",
});
const visiblePreferredRanking = rankFoodV2ForPet({
  food: visiblePreferredFood,
  nutrients: {
    ...nutrients(visiblePreferredFood),
    fat_percent: 9,
    fiber_percent: 6,
  },
  pet,
  goal: "sterilised",
});

if (
  !ingredientOnlyPreferredRanking.signals.some(
    (signal) => signal.code === "preferred_protein_match"
  )
) {
  console.error("Expected ingredient-only preferred match to still be detected.");
  console.error(ingredientOnlyPreferredRanking.signals);
  process.exit(1);
}

if (
  ingredientOnlyPreferredRanking.signals.some(
    (signal) => signal.code === "preferred_protein_visible_match"
  )
) {
  console.error("Ingredient-only preferred match should not get the visible title boost.");
  console.error(ingredientOnlyPreferredRanking.signals);
  process.exit(1);
}

if (
  !visiblePreferredRanking.signals.some(
    (signal) => signal.code === "preferred_protein_visible_match"
  )
) {
  console.error("Expected visible preferred protein/flavour match in formula name.");
  console.error(visiblePreferredRanking.signals);
  process.exit(1);
}

const visiblePreferredSplit = splitFoodV2Recommendations([
  ingredientOnlyPreferredRanking,
  visiblePreferredRanking,
]);
const visiblePreferredTop = [
  ...visiblePreferredSplit.premium,
  ...visiblePreferredSplit.value,
][0];

if (visiblePreferredTop?.formula_key !== "qa|visible-preferred|dog|dry") {
  console.error(
    "Customer-visible preferred protein should win the shortlist tie-break when nutrition fit is otherwise equal."
  );
  console.error({
    visiblePreferredTop,
    visiblePreferredSplit,
    visiblePreferredRanking,
    ingredientOnlyPreferredRanking,
  });
  process.exit(1);
}

if (
  !nonPreferredSterilisedRanking.signals.some(
    (signal) => signal.code === "preferred_protein_missing"
  )
) {
  console.error("Expected preferred_protein_missing for non-preferred sterilised food.");
  console.error(nonPreferredSterilisedRanking.signals);
  process.exit(1);
}

const bestOverallSplit = splitFoodV2Recommendations([
  {
    ...clearSmallSterilisedRanking,
    formula_key: "qa|lower-premium-bucket|dog|dry",
    display_name: "Lower Premium Bucket",
    total_score: 70,
    bucket: "premium",
    value_tier: "premium_candidate",
  },
  {
    ...nonPreferredSterilisedRanking,
    formula_key: "qa|higher-value-bucket|dog|dry",
    display_name: "Higher Value Bucket",
    total_score: 88,
    bucket: "value",
    value_tier: "value_candidate",
  },
]);

if (bestOverallSplit.premium[0]?.formula_key !== "qa|higher-value-bucket|dog|dry") {
  console.error("Best matches should be ordered by overall fit, not by internal premium/value bucket.");
  console.error(bestOverallSplit);
  process.exit(1);
}

const duplicateNameSplit = splitFoodV2Recommendations([
  {
    ...clearSmallSterilisedRanking,
    formula_key: "qa|duplicate-display-name-lower|dog|dry",
    display_name: "Duplicate Customer Name",
    brand: "QA Brand",
    total_score: 70,
  },
  {
    ...clearSmallSterilisedRanking,
    formula_key: "qa|duplicate-display-name-higher|dog|dry",
    display_name: "Duplicate Customer Name",
    brand: "QA Brand",
    total_score: 92,
  },
]);

const visibleDuplicateNames = [...duplicateNameSplit.premium, ...duplicateNameSplit.value].filter(
  (ranking) => ranking.brand === "QA Brand" && ranking.display_name === "Duplicate Customer Name"
);

if (
  visibleDuplicateNames.length !== 1 ||
  visibleDuplicateNames[0]?.formula_key !== "qa|duplicate-display-name-higher|dog|dry"
) {
  console.error("Visible recommendations should dedupe duplicate customer names and keep the strongest row.");
  console.error(duplicateNameSplit);
  process.exit(1);
}

const reorderedDuplicateSplit = splitFoodV2Recommendations([
  {
    ...clearSmallSterilisedRanking,
    formula_key: "qa|reordered-duplicate-lower|dog|dry",
    display_name: "Quinoa Grain Free Duck Neutered Adult Med/maxi",
    brand: "N&D",
    total_score: 82,
  },
  {
    ...clearSmallSterilisedRanking,
    formula_key: "qa|reordered-duplicate-higher|dog|dry",
    display_name: "Quinoa Grain Free Neutered Duck Adult Med/maxi",
    brand: "N&D",
    total_score: 88,
  },
]);

const visibleReorderedDuplicates = [
  ...reorderedDuplicateSplit.premium,
  ...reorderedDuplicateSplit.value,
].filter((ranking) => ranking.brand === "N&D" && ranking.display_name.includes("Quinoa Grain Free"));

if (
  visibleReorderedDuplicates.length !== 1 ||
  visibleReorderedDuplicates[0]?.formula_key !== "qa|reordered-duplicate-higher|dog|dry"
) {
  console.error("Visible recommendations should dedupe reordered duplicate food names.");
  console.error(reorderedDuplicateSplit);
  process.exit(1);
}

const genericAdultDuplicateSplit = splitFoodV2Recommendations([
  {
    ...clearSmallSterilisedRanking,
    formula_key: "qa|generic-adult-duplicate-lower|dog|dry",
    display_name: "Light & Vital",
    brand: "Josera",
    total_score: 80,
  },
  {
    ...clearSmallSterilisedRanking,
    formula_key: "qa|generic-adult-duplicate-higher|dog|dry",
    display_name: "Light & Vital Adult",
    brand: "Josera",
    total_score: 86,
  },
]);

const visibleGenericAdultDuplicates = [
  ...genericAdultDuplicateSplit.premium,
  ...genericAdultDuplicateSplit.value,
].filter((ranking) => ranking.brand === "Josera" && ranking.display_name.includes("Light & Vital"));

if (
  visibleGenericAdultDuplicates.length !== 1 ||
  visibleGenericAdultDuplicates[0]?.formula_key !== "qa|generic-adult-duplicate-higher|dog|dry"
) {
  console.error("Visible recommendations should dedupe generic Adult suffix variants and keep the strongest row.");
  console.error(genericAdultDuplicateSplit);
  process.exit(1);
}

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

const dislikedProteinHighScoreFood = food({
  id: "high-score-lamb-beef",
  formula_key: "qa|high-score-lamb-beef|dog|dry",
  display_name: "Premium Small Adult Lamb & Beef",
  primary_animal_proteins: ["lamb", "beef"],
  ingredients: ["lamb", "beef", "rice", "beet pulp"],
  commercial_tags: ["premium", "sensitive"],
  kcal_per_100g: 332,
});
const dislikedProteinRanking = rankFoodV2ForPet({
  food: dislikedProteinHighScoreFood,
  nutrients: nutrients(dislikedProteinHighScoreFood),
  pet,
  goal: "sterilised",
});

if (dislikedProteinRanking.bucket !== "hold") {
  console.error(
    "A food containing disliked lamb/beef should stay on hold even if it otherwise looks like a strong sterilised fit."
  );
  console.error(dislikedProteinRanking);
  process.exit(1);
}

if (
  !dislikedProteinRanking.signals.some(
    (signal) => signal.code.startsWith("excluded_ingredient_preference")
  )
) {
  console.error("Expected excluded_ingredient_preference for disliked lamb/beef.");
  console.error(dislikedProteinRanking.signals);
  process.exit(1);
}

const greekDislikedProteinFood = food({
  id: "greek-lamb-beef",
  formula_key: "qa|greek-lamb-beef|dog|dry",
  display_name: "Adult Με Αρνί Και Μοσχάρι",
  primary_animal_proteins: ["αρνί", "μοσχάρι"],
  ingredients: ["αρνί", "μοσχάρι", "ρύζι"],
});
const greekDislikedProteinRanking = rankFoodV2ForPet({
  food: greekDislikedProteinFood,
  nutrients: nutrients(greekDislikedProteinFood),
  pet: {
    ...pet,
    excludedIngredients: ["αρνάκι", "mosxari"],
    preferredProteins: ["chicken"],
  },
  goal: "sterilised",
});

if (greekDislikedProteinRanking.bucket !== "hold") {
  console.error("Greek/Greeklish disliked proteins should hold matching foods.");
  console.error(greekDislikedProteinRanking);
  process.exit(1);
}

if (
  !greekDislikedProteinRanking.signals.some((signal) =>
    signal.code.startsWith("excluded_ingredient_preference")
  )
) {
  console.error("Expected excluded_ingredient_preference for Greek lamb/beef terms.");
  console.error(greekDislikedProteinRanking.signals);
  process.exit(1);
}

const turkeyFoodForChickenAvoidance = food({
  id: "turkey-not-chicken",
  formula_key: "qa|turkey-not-chicken|dog|dry",
  display_name: "Adult Turkey",
  primary_animal_proteins: ["turkey"],
  ingredients: ["turkey", "rice"],
});
const turkeyForChickenAvoidanceRanking = rankFoodV2ForPet({
  food: turkeyFoodForChickenAvoidance,
  nutrients: nutrients(turkeyFoodForChickenAvoidance),
  pet: {
    ...pet,
    excludedIngredients: ["κοτόπουλο"],
    preferredProteins: ["γαλοπούλα"],
  },
  goal: "general",
});

if (turkeyForChickenAvoidanceRanking.bucket === "hold") {
  console.error("Chicken dislike should not automatically hold a clearly turkey-only food.");
  console.error(turkeyForChickenAvoidanceRanking);
  process.exit(1);
}

if (
  turkeyForChickenAvoidanceRanking.signals.some((signal) =>
    signal.code.startsWith("excluded_ingredient_preference")
  )
) {
  console.error("Turkey-only food should not receive chicken exclusion signal.");
  console.error(turkeyForChickenAvoidanceRanking.signals);
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

const skinAllergyPet = {
  ...pet,
  weight: 18,
  age: 3,
  activityLevel: "normal" as const,
  neutered: false,
  allergies: ["chicken"],
  excludedIngredients: ["chicken"],
  preferredProteins: ["lamb", "salmon"],
  healthIssues: ["skin allergy", "itchy skin"],
};
const plainRedMeatAllergyFood = food({
  id: "plain-red-meat-allergy",
  formula_key: "qa|plain-red-meat-allergy|dog|dry",
  display_name: "Classic Red Meat",
  ingredients: ["beef", "pork", "oats"],
  primary_animal_proteins: ["beef", "pork"],
});
const hypoSkinAllergyFood = food({
  id: "hypo-skin-allergy",
  formula_key: "qa|hypo-skin-allergy|dog|dry",
  display_name: "Hypo With Salmon And Tuna",
  formula_name: "Hypo With Salmon And Tuna",
  commercial_tags: ["skin_coat"],
  ingredients: ["salmon", "tuna", "rice", "fish oil"],
  primary_animal_proteins: ["salmon", "tuna"],
});
const plainRedMeatAllergyRanking = rankFoodV2ForPet({
  food: plainRedMeatAllergyFood,
  nutrients: nutrients(plainRedMeatAllergyFood),
  pet: skinAllergyPet,
  goal: "allergy",
});
const hypoSkinAllergyRanking = rankFoodV2ForPet({
  food: hypoSkinAllergyFood,
  nutrients: {
    ...nutrients(hypoSkinAllergyFood),
    omega3_percent: 1.1,
    epa_dha_percent: 0.35,
  },
  pet: skinAllergyPet,
  goal: "allergy",
});

if (hypoSkinAllergyRanking.total_score <= plainRedMeatAllergyRanking.total_score) {
  console.error("Hypo/skin-positioned food should outrank plain red-meat food for skin allergy context.");
  console.error({ hypoSkinAllergyRanking, plainRedMeatAllergyRanking });
  process.exit(1);
}

if (
  !hypoSkinAllergyRanking.signals.some(
    (signal) => signal.code === "allergy_positioning"
  )
) {
  console.error("Expected allergy_positioning for hypo skin allergy food.");
  console.error(hypoSkinAllergyRanking.signals);
  process.exit(1);
}

if (
  !plainRedMeatAllergyRanking.signals.some(
    (signal) => signal.code === "skin_coat_context_without_visible_support"
  )
) {
  console.error("Expected skin_coat_context_without_visible_support for plain allergy food.");
  console.error(plainRedMeatAllergyRanking.signals);
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

const smallSterilisedWeightLossPet = {
  ...pet,
  weight: 7,
  age: 4,
  neutered: true,
  activityLevel: "low" as const,
  healthIssues: ["weight loss", "sensitive stomach"],
  excludedIngredients: [],
  preferredProteins: [],
};
const smallWeightLossLeanFood = food({
  id: "small-weight-loss-lean",
  formula_key: "qa|small-weight-loss-lean|dog|dry",
  display_name: "Small Adult Light Sterilised Chicken",
  dog_size: "small",
  commercial_tags: ["light", "sterilised", "weight_control"],
  ingredients: ["chicken", "rice", "beet pulp"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 332,
});
const smallWeightLossHighFatFood = food({
  id: "small-weight-loss-high-fat",
  formula_key: "qa|small-weight-loss-high-fat|dog|dry",
  display_name: "Small Adult Maintenance Chicken",
  dog_size: "small",
  ingredients: ["chicken", "rice", "animal fat"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 360,
});
const smallWeightLossLeanRanking = rankFoodV2ForPet({
  food: smallWeightLossLeanFood,
  nutrients: {
    ...nutrients(smallWeightLossLeanFood),
    protein_percent: 23,
    fat_percent: 9,
    fiber_percent: 5,
  },
  pet: smallSterilisedWeightLossPet,
  goal: "weight_control",
});
const smallWeightLossHighFatRanking = rankFoodV2ForPet({
  food: smallWeightLossHighFatFood,
  nutrients: {
    ...nutrients(smallWeightLossHighFatFood),
    protein_percent: 25,
    fat_percent: 16,
    fiber_percent: 3,
  },
  pet: smallSterilisedWeightLossPet,
  goal: "weight_control",
});

if (smallWeightLossLeanRanking.total_score <= smallWeightLossHighFatRanking.total_score) {
  console.error(
    "Small sterilised weight-loss pets should start from lean/light foods over higher-fat maintenance foods."
  );
  console.error({ smallWeightLossLeanRanking, smallWeightLossHighFatRanking });
  process.exit(1);
}

if (
  !smallWeightLossHighFatRanking.signals.some(
    (signal) => signal.code === "small_sterilised_fat_density_high"
  )
) {
  console.error("Expected small_sterilised_fat_density_high for small weight-loss high-fat food.");
  console.error(smallWeightLossHighFatRanking.signals);
  process.exit(1);
}

const activeGainPet = {
  ...pet,
  weight: 22,
  age: 3,
  neutered: false,
  activityLevel: "high" as const,
  healthIssues: ["training daily", "needs to gain weight"],
  excludedIngredients: [],
  preferredProteins: [],
};
const activeEnergyFood = food({
  id: "active-energy",
  formula_key: "qa|active-energy|dog|dry",
  display_name: "Performance Active High Energy Chicken",
  dog_size: "medium",
  commercial_tags: ["active", "performance"],
  ingredients: ["chicken", "rice", "animal fat"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 402,
});
const greekActiveEnergyFood = food({
  id: "greek-active-energy",
  formula_key: "qa|greek-active-energy|dog|dry",
  display_name: "Υψηλή Ενέργεια Για Δραστήριους Σκύλους",
  formula_name: "Υψηλή Ενέργεια Για Δραστήριους Σκύλους",
  dog_size: "medium",
  commercial_tags: [],
  ingredients: ["chicken", "rice", "animal fat"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 401,
});
const maintenanceAdultFood = food({
  id: "maintenance-adult",
  formula_key: "qa|maintenance-adult|dog|dry",
  display_name: "Adult Maintenance Chicken",
  dog_size: "medium",
  commercial_tags: ["adult"],
  ingredients: ["chicken", "rice"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 342,
});
const activeEnergyRanking = rankFoodV2ForPet({
  food: activeEnergyFood,
  nutrients: {
    ...nutrients(activeEnergyFood),
    protein_percent: 28,
    fat_percent: 18,
    fiber_percent: 2.2,
  },
  pet: activeGainPet,
  goal: "general",
});
const greekActiveEnergyRanking = rankFoodV2ForPet({
  food: greekActiveEnergyFood,
  nutrients: {
    ...nutrients(greekActiveEnergyFood),
    protein_percent: 28,
    fat_percent: 18,
    fiber_percent: 2,
  },
  pet: activeGainPet,
  goal: "general",
});
const maintenanceAdultRanking = rankFoodV2ForPet({
  food: maintenanceAdultFood,
  nutrients: {
    ...nutrients(maintenanceAdultFood),
    protein_percent: 24,
    fat_percent: 10,
    fiber_percent: 3,
  },
  pet: activeGainPet,
  goal: "general",
});

if (activeEnergyRanking.total_score <= maintenanceAdultRanking.total_score) {
  console.error("Active high-energy food should outrank maintenance food for active weight-gain dogs.");
  console.error({ activeEnergyRanking, maintenanceAdultRanking });
  process.exit(1);
}

if (
  !activeEnergyRanking.signals.some(
    (signal) => signal.code === "active_formula_activity_fit"
  )
) {
  console.error("Expected active_formula_activity_fit for active high-energy food.");
  console.error(activeEnergyRanking.signals);
  process.exit(1);
}

if (
  !greekActiveEnergyRanking.signals.some(
    (signal) => signal.code === "active_formula_activity_fit"
  )
) {
  console.error("Greek active/energy title should produce active_formula_activity_fit.");
  console.error(greekActiveEnergyRanking.signals);
  process.exit(1);
}

if (maintenanceAdultRanking.bucket !== "hold") {
  console.error("Plain low-energy maintenance food should be held for active weight-gain dogs.");
  console.error(maintenanceAdultRanking);
  process.exit(1);
}

const greekRenalPet = {
  ...pet,
  healthIssues: [
    "\u03c7\u03c1\u03cc\u03bd\u03b9\u03b1 \u03bd\u03b5\u03c6\u03c1\u03b9\u03ba\u03ae \u03bd\u03cc\u03c3\u03bf\u03c2",
  ],
  excludedIngredients: [],
  preferredProteins: [],
};
const greekContextRenalFood = food({
  id: "renal-vet",
  formula_key: "qa|renal-vet|dog|dry",
  display_name: "Renal Veterinary Diet",
  medical_tags: ["renal"],
  ingredients: ["rice", "egg", "fish oil"],
  primary_animal_proteins: ["egg"],
  kcal_per_100g: 389,
});
const greekTitleRenalFood = food({
  id: "greek-title-renal",
  formula_key: "qa|greek-title-renal|dog|dry",
  display_name: "Νεφρική Κτηνιατρική Τροφή",
  formula_name: "Νεφρική Κτηνιατρική Τροφή",
  medical_tags: [],
  ingredients: ["rice", "egg", "fish oil"],
  primary_animal_proteins: ["egg"],
  kcal_per_100g: 386,
});
const greekContextUrinaryOnlyFood = food({
  id: "urinary-oxalate",
  formula_key: "qa|urinary-oxalate|dog|dry",
  display_name: "Urinary Oxalate Veterinary Diet",
  medical_tags: ["urinary"],
  ingredients: ["rice", "chicken", "fish oil"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 372,
});
const greekTitleUrinaryFood = food({
  id: "greek-title-urinary",
  formula_key: "qa|greek-title-urinary|dog|dry",
  display_name: "Ουρολογική Τροφή Στρουβίτη",
  formula_name: "Ουρολογική Τροφή Στρουβίτη",
  medical_tags: [],
  ingredients: ["chicken", "rice", "fish oil"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 368,
});
const greekContextRenalRanking = rankFoodV2ForPet({
  food: greekContextRenalFood,
  nutrients: {
    ...nutrients(greekContextRenalFood),
    protein_percent: 18,
    phosphorus_percent: 0.35,
    sodium_percent: 0.22,
    epa_dha_percent: 0.4,
  },
  pet: greekRenalPet,
  goal: "general",
});
const greekTitleRenalRanking = rankFoodV2ForPet({
  food: greekTitleRenalFood,
  nutrients: {
    ...nutrients(greekTitleRenalFood),
    protein_percent: 18,
    phosphorus_percent: 0.35,
  },
  pet: greekRenalPet,
  goal: "general",
});
const greekContextUrinaryOnlyRenalRanking = rankFoodV2ForPet({
  food: greekContextUrinaryOnlyFood,
  nutrients: {
    ...nutrients(greekContextUrinaryOnlyFood),
    protein_percent: 24,
    phosphorus_percent: 0.75,
    sodium_percent: 0.4,
  },
  pet: greekRenalPet,
  goal: "general",
});

if (greekContextRenalRanking.total_score <= greekContextUrinaryOnlyRenalRanking.total_score) {
  console.error("Greek renal context should prefer renal-positioned food over urinary-only food.");
  console.error({ greekContextRenalRanking, greekContextUrinaryOnlyRenalRanking });
  process.exit(1);
}

if (greekContextUrinaryOnlyRenalRanking.bucket !== "hold") {
  console.error("Urinary-only food should be held for Greek renal context.");
  console.error(greekContextUrinaryOnlyRenalRanking);
  process.exit(1);
}

if (
  !greekContextUrinaryOnlyRenalRanking.signals.some(
    (signal) => signal.code === "renal_urinary_mismatch"
  )
) {
  console.error("Expected renal_urinary_mismatch for urinary-only food in renal context.");
  console.error(greekContextUrinaryOnlyRenalRanking.signals);
  process.exit(1);
}

if (
  !greekTitleRenalRanking.signals.some(
    (signal) => signal.code === "renal_positioning"
  )
) {
  console.error("Greek renal product title should be recognized as renal positioning.");
  console.error(greekTitleRenalRanking.signals);
  process.exit(1);
}

if (greekTitleRenalRanking.bucket === "hold") {
  console.error("Greek renal-positioned food should remain selectable for renal context.");
  console.error(greekTitleRenalRanking);
  process.exit(1);
}

const greekUrinaryRanking = rankFoodV2ForPet({
  food: greekContextUrinaryOnlyFood,
  nutrients: nutrients(greekContextUrinaryOnlyFood),
  pet: {
    ...pet,
    healthIssues: ["\u03bf\u03c5\u03c1\u03bf\u03bb\u03bf\u03b3\u03b9\u03ba\u03cc"],
    excludedIngredients: [],
    preferredProteins: [],
  },
  goal: "general",
});
const greekTitleUrinaryRanking = rankFoodV2ForPet({
  food: greekTitleUrinaryFood,
  nutrients: nutrients(greekTitleUrinaryFood),
  pet: {
    ...pet,
    healthIssues: ["ουρολογικό", "ιστορικό στρουβίτη"],
    excludedIngredients: [],
    preferredProteins: [],
  },
  goal: "general",
});

if (
  !greekUrinaryRanking.signals.some(
    (signal) => signal.code === "urinary_positioning"
  )
) {
  console.error("Greek urinary context should recognize urinary-positioned foods.");
  console.error(greekUrinaryRanking.signals);
  process.exit(1);
}

if (
  !greekTitleUrinaryRanking.signals.some(
    (signal) => signal.code === "urinary_positioning"
  )
) {
  console.error("Greek urinary product title should be recognized as urinary positioning.");
  console.error(greekTitleUrinaryRanking.signals);
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
const sterilisedTooRichFood = food({
  id: "sterilised-too-rich",
  formula_key: "qa|sterilised-too-rich|dog|dry",
  display_name: "Sterilised Adult Energy Rich Chicken",
  dog_size: "small",
  commercial_tags: ["sterilised"],
  ingredients: ["chicken", "rice", "animal fat"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 372,
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
const sterilisedTooRichRanking = rankFoodV2ForPet({
  food: sterilisedTooRichFood,
  nutrients: {
    ...nutrients(sterilisedTooRichFood),
    protein_percent: 27,
    fat_percent: 14,
    fiber_percent: 2.2,
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
const sterilisedTooRichGuards =
  detectFoodV2RecommendationGuardFlags(sterilisedTooRichRanking);

if (sterilisedLeanRanking.total_score <= sterilisedRicherRanking.total_score) {
  console.error("Lower-kcal/lower-fat food should outrank richer options for sterilised cases.");
  console.error({ sterilisedLeanRanking, sterilisedRicherRanking });
  process.exit(1);
}

if (sterilisedRicherRanking.bucket === "hold") {
  console.error("Mildly richer but visibly sterilised foods should remain selectable candidates.");
  console.error(sterilisedRicherRanking);
  process.exit(1);
}

if (sterilisedTooRichRanking.bucket !== "hold") {
  console.error("Rich sterilised food should be held for a first sterilised shortlist.");
  console.error(sterilisedTooRichRanking);
  process.exit(1);
}

if (
  !sterilisedTooRichRanking.signals.some(
    (signal) => signal.code === "sterilised_rich_formula_mismatch"
  )
) {
  console.error("Expected sterilised_rich_formula_mismatch for rich sterilised food.");
  console.error(sterilisedTooRichRanking.signals);
  process.exit(1);
}

if (
  !sterilisedTooRichGuards.some(
    (flag) => flag.code === "sterilised_rich_formula_mismatch" && flag.severity === "block"
  )
) {
  console.error("Expected sterilised_rich_formula_mismatch to be exposed as a block guard.");
  console.error(sterilisedTooRichGuards);
  process.exit(1);
}

if (
  !sterilisedTooRichGuards.some(
    (flag) => flag.code === "small_sterilised_rich_formula_mismatch" && flag.severity === "block"
  )
) {
  console.error("Expected small_sterilised_rich_formula_mismatch to be exposed as a block guard.");
  console.error(sterilisedTooRichGuards);
  process.exit(1);
}

const activeMaintenancePet = {
  ...pet,
  weight: 25,
  age: 2,
  neutered: false,
  activityLevel: "high" as const,
  healthIssues: ["works in mountain", "runs daily"],
  excludedIngredients: [],
  preferredProteins: [],
};
const activeMaintenanceFood = food({
  id: "active-maintenance-performance",
  formula_key: "qa|active-maintenance-performance|dog|dry",
  display_name: "Performance Active Chicken",
  dog_size: "large",
  commercial_tags: ["active", "performance"],
  ingredients: ["chicken", "rice", "animal fat"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 392,
});
const lightSterilisedForActiveFood = food({
  id: "light-sterilised-active-mismatch",
  formula_key: "qa|light-sterilised-active-mismatch|dog|dry",
  display_name: "Adult Light Sterilised Chicken",
  dog_size: "large",
  commercial_tags: ["light", "sterilised", "weight_control"],
  ingredients: ["chicken", "rice", "beet pulp"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 330,
});
const genericRichAdultForActiveFood = food({
  id: "generic-rich-adult-active",
  formula_key: "qa|generic-rich-adult-active|dog|dry",
  display_name: "Adult Chicken & Rice",
  dog_size: "large",
  commercial_tags: ["adult"],
  ingredients: ["chicken", "rice", "animal fat"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 392,
});
const activeMaintenanceRanking = rankFoodV2ForPet({
  food: activeMaintenanceFood,
  nutrients: {
    ...nutrients(activeMaintenanceFood),
    protein_percent: 28,
    fat_percent: 17,
    fiber_percent: 2.2,
  },
  pet: activeMaintenancePet,
  goal: "general",
});
const genericRichAdultForActiveRanking = rankFoodV2ForPet({
  food: genericRichAdultForActiveFood,
  nutrients: {
    ...nutrients(genericRichAdultForActiveFood),
    protein_percent: 28,
    fat_percent: 17,
    fiber_percent: 2.2,
  },
  pet: activeMaintenancePet,
  goal: "general",
});
const lightSterilisedForActiveRanking = rankFoodV2ForPet({
  food: lightSterilisedForActiveFood,
  nutrients: {
    ...nutrients(lightSterilisedForActiveFood),
    protein_percent: 24,
    fat_percent: 9,
    fiber_percent: 6,
  },
  pet: activeMaintenancePet,
  goal: "general",
});

if (lightSterilisedForActiveRanking.bucket !== "hold") {
  console.error("Light/sterilised food should be held for genuinely high-activity dogs without a weight-loss goal.");
  console.error(lightSterilisedForActiveRanking);
  process.exit(1);
}

if (
  !lightSterilisedForActiveRanking.signals.some(
    (signal) => signal.code === "light_formula_for_high_activity_pet"
  )
) {
  console.error("Expected light_formula_for_high_activity_pet for high-activity maintenance dog.");
  console.error(lightSterilisedForActiveRanking.signals);
  process.exit(1);
}

if (activeMaintenanceRanking.total_score <= lightSterilisedForActiveRanking.total_score) {
  console.error("Active/performance food should outrank light sterilised food for high-activity maintenance dogs.");
  console.error({ activeMaintenanceRanking, lightSterilisedForActiveRanking });
  process.exit(1);
}

if (
  !genericRichAdultForActiveRanking.signals.some(
    (signal) => signal.code === "high_activity_without_active_positioning"
  )
) {
  console.error("Expected high_activity_without_active_positioning for generic rich adult food.");
  console.error(genericRichAdultForActiveRanking.signals);
  process.exit(1);
}

if (activeMaintenanceRanking.total_score <= genericRichAdultForActiveRanking.total_score) {
  console.error("Active/performance food should outrank generic rich adult food for high-activity dogs.");
  console.error({ activeMaintenanceRanking, genericRichAdultForActiveRanking });
  process.exit(1);
}

if (sterilisedLeanRanking.total_score - sterilisedRicherRanking.total_score > 30) {
  console.error("Mildly richer sterilised foods should not be buried far below lean sterilised options.");
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

const moderateActiveForSterilisedFood = food({
  id: "moderate-active-for-sterilised",
  formula_key: "qa|josera-active-nature-style|dog|dry",
  display_name: "Active Nature Adult Chicken",
  dog_size: "small",
  commercial_tags: ["active"],
  ingredients: ["chicken", "rice", "animal fat"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 365,
});
const moderateActiveForSterilisedRanking = rankFoodV2ForPet({
  food: moderateActiveForSterilisedFood,
  nutrients: {
    ...nutrients(moderateActiveForSterilisedFood),
    protein_percent: 25,
    fat_percent: 13,
    fiber_percent: 2.4,
  },
  pet: {
    ...pet,
    weight: 7,
    age: 5,
    activityLevel: "low",
    neutered: true,
    excludedIngredients: [],
    preferredProteins: [],
  },
  goal: "sterilised",
});

if (moderateActiveForSterilisedRanking.bucket !== "hold") {
  console.error(
    "Active-positioned foods should be held for sterilised low-activity pets even when calories are only moderately high."
  );
  console.error(moderateActiveForSterilisedRanking);
  process.exit(1);
}

if (
  !moderateActiveForSterilisedRanking.signals.some(
    (signal) => signal.code === "active_formula_for_weight_sensitive_pet"
  )
) {
  console.error("Expected active_formula_for_weight_sensitive_pet for moderate active sterilised mismatch.");
  console.error(moderateActiveForSterilisedRanking.signals);
  process.exit(1);
}

const visibleMiniButMetadataSmallFood = food({
  id: "visible-mini-metadata-small",
  formula_key: "qa|visible-mini-metadata-small|dog|dry",
  display_name: "N&D Quinoa Grain Free Neutered Duck Adult Mini",
  dog_size: "small",
  commercial_tags: ["sterilised"],
  ingredients: ["duck", "quinoa", "pea fiber"],
  primary_animal_proteins: ["duck"],
  kcal_per_100g: 344.4,
});
const visibleMiniForTenKgRanking = rankFoodV2ForPet({
  food: visibleMiniButMetadataSmallFood,
  nutrients: {
    ...nutrients(visibleMiniButMetadataSmallFood),
    protein_percent: 30,
    fat_percent: 11,
    fiber_percent: 5.7,
  },
  pet: {
    ...pet,
    weight: 10,
    age: 5,
    activityLevel: "low",
    neutered: true,
    excludedIngredients: [],
    preferredProteins: [],
  },
  goal: "sterilised",
});

if (visibleMiniForTenKgRanking.bucket !== "hold") {
  console.error("Visible Mini title should be held for a 10kg sterilised dog even if metadata says small.");
  console.error(visibleMiniForTenKgRanking);
  process.exit(1);
}

if (
  !visibleMiniForTenKgRanking.signals.some(
    (signal) => signal.code === "customer_visible_dog_size_mismatch"
  )
) {
  console.error("Expected customer_visible_dog_size_mismatch for visible Mini title on a 10kg dog.");
  console.error(visibleMiniForTenKgRanking.signals);
  process.exit(1);
}

const generalLargeDogPet = {
  ...pet,
  weight: 30,
  age: 4,
  activityLevel: "normal" as const,
  neutered: false,
  excludedIngredients: [],
  preferredProteins: [],
  healthIssues: [],
};
const generalSterilisedFood = food({
  id: "general-sterilised-mismatch",
  formula_key: "qa|general-sterilised-mismatch|dog|dry",
  display_name: "Naturcroq Duck & Rice Sterilised",
  dog_size: "large",
  commercial_tags: ["sterilised", "weight_control"],
  ingredients: ["duck", "rice", "beet pulp"],
  primary_animal_proteins: ["duck"],
  kcal_per_100g: 332,
});
const generalAdultFood = food({
  id: "general-adult-fit",
  formula_key: "qa|general-adult-fit|dog|dry",
  display_name: "Medi/maxi Adult Chicken & Rice",
  dog_size: "large",
  commercial_tags: ["adult", "maintenance"],
  ingredients: ["chicken", "rice", "beet pulp"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 360,
});
const generalSterilisedRanking = rankFoodV2ForPet({
  food: generalSterilisedFood,
  nutrients: {
    ...nutrients(generalSterilisedFood),
    protein_percent: 22,
    fat_percent: 9,
    fiber_percent: 2.5,
  },
  pet: generalLargeDogPet,
  goal: "general",
});
const generalAdultRanking = rankFoodV2ForPet({
  food: generalAdultFood,
  nutrients: {
    ...nutrients(generalAdultFood),
    protein_percent: 24,
    fat_percent: 13,
    fiber_percent: 2.5,
  },
  pet: generalLargeDogPet,
  goal: "general",
});

if (generalSterilisedRanking.total_score >= generalAdultRanking.total_score) {
  console.error("Sterilised/weight-control food should not outrank normal adult food for a general non-neutered dog.");
  console.error({ generalSterilisedRanking, generalAdultRanking });
  process.exit(1);
}

if (
  !generalSterilisedRanking.signals.some(
    (signal) => signal.code === "weight_control_formula_without_weight_goal"
  )
) {
  console.error("Expected weight_control_formula_without_weight_goal for general non-neutered dog.");
  console.error(generalSterilisedRanking.signals);
  process.exit(1);
}

const visibleSmallSterilisedFood = food({
  id: "visible-small-sterilised",
  formula_key: "qa|visible-small-sterilised|dog|dry",
  display_name: "Adult Small Sterilised Chicken",
  dog_size: "small",
  commercial_tags: ["sterilised", "weight_control"],
  ingredients: ["chicken", "rice", "beet pulp"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 332,
});
const allBreedsSterilisedFood = food({
  id: "all-breeds-sterilised",
  formula_key: "qa|all-breeds-sterilised|dog|dry",
  display_name: "All Breeds Adult Sterilised Chicken",
  dog_size: "all",
  commercial_tags: ["sterilised", "weight_control"],
  ingredients: ["chicken", "rice", "beet pulp"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 332,
});
const visibleMediumSterilisedFood = food({
  id: "visible-medium-sterilised",
  formula_key: "qa|visible-medium-sterilised|dog|dry",
  display_name: "Medium Sterilised Adult Chicken",
  dog_size: "medium",
  commercial_tags: ["sterilised", "weight_control"],
  ingredients: ["chicken", "rice", "beet pulp"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 332,
});
const visibleSmallSterilisedRanking = rankFoodV2ForPet({
  food: visibleSmallSterilisedFood,
  nutrients: {
    ...nutrients(visibleSmallSterilisedFood),
    protein_percent: 22,
    fat_percent: 9,
    fiber_percent: 2.5,
  },
  pet: {
    ...pet,
    weight: 6,
    age: 5,
    activityLevel: "low",
    neutered: true,
    excludedIngredients: [],
    preferredProteins: [],
  },
  goal: "sterilised",
});
const allBreedsSterilisedRanking = rankFoodV2ForPet({
  food: allBreedsSterilisedFood,
  nutrients: {
    ...nutrients(allBreedsSterilisedFood),
    protein_percent: 22,
    fat_percent: 9,
    fiber_percent: 2.5,
  },
  pet: {
    ...pet,
    weight: 6,
    age: 5,
    activityLevel: "low",
    neutered: true,
    excludedIngredients: [],
    preferredProteins: [],
  },
  goal: "sterilised",
});
const visibleMediumSterilisedForSmallDogRanking = rankFoodV2ForPet({
  food: visibleMediumSterilisedFood,
  nutrients: {
    ...nutrients(visibleMediumSterilisedFood),
    protein_percent: 22,
    fat_percent: 9,
    fiber_percent: 2.5,
  },
  pet: {
    ...pet,
    weight: 6,
    age: 5,
    activityLevel: "low",
    neutered: true,
    excludedIngredients: [],
    preferredProteins: ["chicken"],
  },
  goal: "sterilised",
});

if (visibleSmallSterilisedRanking.total_score <= allBreedsSterilisedRanking.total_score) {
  console.error("Exact visible small-size sterilised food should outrank an otherwise equal all-breeds option.");
  console.error({ visibleSmallSterilisedRanking, allBreedsSterilisedRanking });
  process.exit(1);
}

if (visibleMediumSterilisedForSmallDogRanking.total_score >= visibleSmallSterilisedRanking.total_score) {
  console.error("Visible medium-size sterilised food should not outrank small-size food for a small dog.");
  console.error({ visibleMediumSterilisedForSmallDogRanking, visibleSmallSterilisedRanking });
  process.exit(1);
}

if (visibleMediumSterilisedForSmallDogRanking.bucket !== "hold") {
  console.error("Visible medium-size sterilised food should be held for a small sterilised dog.");
  console.error(visibleMediumSterilisedForSmallDogRanking);
  process.exit(1);
}

if (
  !visibleMediumSterilisedForSmallDogRanking.signals.some(
    (signal) => signal.code === "small_dog_medium_visible_mismatch"
  )
) {
  console.error("Expected small_dog_medium_visible_mismatch for visible Medium title on a small dog.");
  console.error(visibleMediumSterilisedForSmallDogRanking.signals);
  process.exit(1);
}

if (
  !visibleSmallSterilisedRanking.signals.some(
    (signal) => signal.code === "customer_visible_dog_size_match"
  )
) {
  console.error("Expected customer_visible_dog_size_match for exact visible small-size sterilised food.");
  console.error(visibleSmallSterilisedRanking.signals);
  process.exit(1);
}

const visibleLargeGeneralFood = food({
  id: "visible-large-general",
  formula_key: "qa|visible-large-general|dog|dry",
  display_name: "Maxi Adult Chicken & Rice",
  dog_size: "all",
  commercial_tags: ["adult", "maintenance"],
  ingredients: ["chicken", "rice", "beet pulp"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 360,
});
const allBreedsGeneralFood = food({
  id: "all-breeds-general",
  formula_key: "qa|all-breeds-general|dog|dry",
  display_name: "All Breeds Adult Chicken & Rice",
  dog_size: "all",
  commercial_tags: ["adult", "maintenance"],
  ingredients: ["chicken", "rice", "beet pulp"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 360,
});
const visibleLargeGeneralRanking = rankFoodV2ForPet({
  food: visibleLargeGeneralFood,
  nutrients: {
    ...nutrients(visibleLargeGeneralFood),
    protein_percent: 24,
    fat_percent: 13,
    fiber_percent: 2.5,
  },
  pet: generalLargeDogPet,
  goal: "general",
});
const allBreedsGeneralRanking = rankFoodV2ForPet({
  food: allBreedsGeneralFood,
  nutrients: {
    ...nutrients(allBreedsGeneralFood),
    protein_percent: 24,
    fat_percent: 13,
    fiber_percent: 2.5,
  },
  pet: generalLargeDogPet,
  goal: "general",
});

if (visibleLargeGeneralRanking.total_score <= allBreedsGeneralRanking.total_score) {
  console.error("Visible large-size general food should outrank an otherwise equal all-breeds option for a large dog.");
  console.error({ visibleLargeGeneralRanking, allBreedsGeneralRanking });
  process.exit(1);
}

if (
  !visibleLargeGeneralRanking.signals.some(
    (signal) => signal.code === "customer_visible_dog_size_match"
  )
) {
  console.error("Expected customer_visible_dog_size_match for visible large-size general food.");
  console.error(visibleLargeGeneralRanking.signals);
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

const greekWorkingDogContextRanking = rankFoodV2ForPet({
  food: activeHighFat,
  nutrients: {
    ...nutrients(activeHighFat),
    fat_percent: 18,
    fiber_percent: 2,
  },
  pet: {
    ...highActivityPet,
    activityLevel: "normal" as const,
    healthIssues: ["κυνηγάει", "τρέχει σε βουνό", "εκπαιδεύεται καθημερινά"],
  },
  goal: "general",
});

if (greekWorkingDogContextRanking.bucket === "hold") {
  console.error("Greek working-dog context should keep active foods usable even when activityLevel is not explicit.");
  console.error(greekWorkingDogContextRanking);
  process.exit(1);
}

if (
  !greekWorkingDogContextRanking.signals.some(
    (signal) => signal.code === "active_formula_activity_fit"
  )
) {
  console.error("Expected active_formula_activity_fit from Greek working-dog context.");
  console.error(greekWorkingDogContextRanking.signals);
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

const activeSalmonPerformanceFood = food({
  id: "active-salmon-performance",
  formula_key: "qa|active-salmon-performance|dog|dry",
  display_name: "Performance Active Salmon",
  dog_size: "large",
  commercial_tags: ["active", "performance"],
  ingredients: ["salmon", "rice", "fish oil"],
  primary_animal_proteins: ["salmon"],
  kcal_per_100g: 392,
});
const activeChickenPerformanceFood = food({
  id: "active-chicken-performance",
  formula_key: "qa|active-chicken-performance|dog|dry",
  display_name: "Performance Active Chicken",
  dog_size: "large",
  commercial_tags: ["active", "performance"],
  ingredients: ["chicken", "rice", "animal fat"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 392,
});
const activePreferencePet = {
  ...highActivityPet,
  healthIssues: ["daily agility", "runs 10km"],
  preferredProteins: ["salmon"],
  excludedIngredients: [],
};
const activeSalmonPreferenceRanking = rankFoodV2ForPet({
  food: activeSalmonPerformanceFood,
  nutrients: {
    ...nutrients(activeSalmonPerformanceFood),
    protein_percent: 29,
    fat_percent: 18,
    fiber_percent: 2,
  },
  pet: activePreferencePet,
  goal: "general",
});
const activeChickenPreferenceRanking = rankFoodV2ForPet({
  food: activeChickenPerformanceFood,
  nutrients: {
    ...nutrients(activeChickenPerformanceFood),
    protein_percent: 29,
    fat_percent: 18,
    fiber_percent: 2,
  },
  pet: activePreferencePet,
  goal: "general",
});

if (activeSalmonPreferenceRanking.total_score <= activeChickenPreferenceRanking.total_score) {
  console.error("Among active/performance fits, the preferred protein should break the tie.");
  console.error({ activeSalmonPreferenceRanking, activeChickenPreferenceRanking });
  process.exit(1);
}

if (
  !activeSalmonPreferenceRanking.signals.some(
    (signal) => signal.code === "preferred_protein_match"
  )
) {
  console.error("Expected preferred_protein_match for active salmon preference.");
  console.error(activeSalmonPreferenceRanking.signals);
  process.exit(1);
}

const activeChickenAvoidanceRanking = rankFoodV2ForPet({
  food: activeChickenPerformanceFood,
  nutrients: {
    ...nutrients(activeChickenPerformanceFood),
    protein_percent: 29,
    fat_percent: 18,
    fiber_percent: 2,
  },
  pet: {
    ...activePreferencePet,
    preferredProteins: ["salmon"],
    excludedIngredients: ["chicken"],
    allergies: ["chicken"],
  },
  goal: "general",
});

if (activeChickenAvoidanceRanking.bucket !== "hold") {
  console.error("Active/performance fit must not override chicken allergy or avoidance.");
  console.error(activeChickenAvoidanceRanking);
  process.exit(1);
}

if (
  !activeChickenAvoidanceRanking.signals.some(
    (signal) =>
      signal.code.startsWith("allergen_conflict") ||
      signal.code.startsWith("excluded_ingredient_preference")
  )
) {
  console.error("Expected allergy or excluded ingredient signal for avoided active chicken food.");
  console.error(activeChickenAvoidanceRanking.signals);
  process.exit(1);
}

const summerLowAppetitePet = {
  ...pet,
  breed: "Husky",
  weight: 25,
  age: 2,
  activityLevel: "normal" as const,
  neutered: false,
  healthIssues: ["eats little in summer", "hot weather"],
  excludedIngredients: [],
  preferredProteins: [],
};
const summerPracticalEnergyFood = food({
  id: "summer-practical-energy",
  formula_key: "qa|summer-practical-energy|dog|dry",
  display_name: "Adult Salmon Summer Appetite",
  dog_size: "large",
  ingredients: ["salmon", "rice"],
  primary_animal_proteins: ["salmon"],
  kcal_per_100g: 368,
});
const summerLightFood = food({
  id: "summer-light",
  formula_key: "qa|summer-light|dog|dry",
  display_name: "Adult Light Chicken",
  dog_size: "large",
  commercial_tags: ["light"],
  ingredients: ["chicken", "rice"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 320,
});
const summerPracticalEnergyRanking = rankFoodV2ForPet({
  food: summerPracticalEnergyFood,
  nutrients: {
    ...nutrients(summerPracticalEnergyFood),
    fat_percent: 14,
  },
  pet: summerLowAppetitePet,
  goal: "general",
});
const summerLightRanking = rankFoodV2ForPet({
  food: summerLightFood,
  nutrients: {
    ...nutrients(summerLightFood),
    fat_percent: 8,
  },
  pet: summerLowAppetitePet,
  goal: "general",
});

if (summerPracticalEnergyRanking.total_score <= summerLightRanking.total_score) {
  console.error("Summer low-appetite context should not rank light/low-energy food first.");
  console.error({ summerPracticalEnergyRanking, summerLightRanking });
  process.exit(1);
}

if (
  !summerPracticalEnergyRanking.signals.some(
    (signal) => signal.code === "summer_low_appetite_energy_density"
  )
) {
  console.error("Expected summer_low_appetite_energy_density for practical energy candidate.");
  console.error(summerPracticalEnergyRanking.signals);
  process.exit(1);
}

if (
  !summerLightRanking.signals.some(
    (signal) => signal.code === "summer_low_appetite_light_formula_mismatch"
  )
) {
  console.error("Expected summer_low_appetite_light_formula_mismatch for light summer option.");
  console.error(summerLightRanking.signals);
  process.exit(1);
}

const coldClimatePet = {
  ...pet,
  weight: 22,
  age: 4,
  activityLevel: "normal" as const,
  neutered: false,
  healthIssues: ["cold climate", "winter outdoor energy needs"],
  excludedIngredients: [],
  preferredProteins: [],
};
const coldClimateEnergyFood = food({
  id: "cold-climate-energy",
  formula_key: "qa|cold-climate-energy|dog|dry",
  display_name: "Adult Active Energy Chicken",
  dog_size: "medium",
  commercial_tags: ["active"],
  ingredients: ["chicken", "rice", "animal fat"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 386,
});
const coldClimateSterilisedFood = food({
  id: "cold-climate-sterilised",
  formula_key: "qa|cold-climate-sterilised|dog|dry",
  display_name: "Adult Sterilised Light Chicken",
  dog_size: "medium",
  commercial_tags: ["sterilised", "light"],
  ingredients: ["chicken", "rice", "beet pulp"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 332,
});
const coldClimateEnergyRanking = rankFoodV2ForPet({
  food: coldClimateEnergyFood,
  nutrients: {
    ...nutrients(coldClimateEnergyFood),
    fat_percent: 16,
    fiber_percent: 2.5,
  },
  pet: coldClimatePet,
  goal: "general",
});
const coldClimateSterilisedRanking = rankFoodV2ForPet({
  food: coldClimateSterilisedFood,
  nutrients: {
    ...nutrients(coldClimateSterilisedFood),
    fat_percent: 9,
    fiber_percent: 6,
  },
  pet: coldClimatePet,
  goal: "general",
});

if (coldClimateSterilisedRanking.bucket !== "hold") {
  console.error("Light/sterilised food should be held for cold-climate energy contexts.");
  console.error(coldClimateSterilisedRanking);
  process.exit(1);
}

if (coldClimateEnergyRanking.total_score <= coldClimateSterilisedRanking.total_score) {
  console.error("Cold-climate context should prefer energy-aware food over light sterilised food.");
  console.error({ coldClimateEnergyRanking, coldClimateSterilisedRanking });
  process.exit(1);
}

if (
  !coldClimateEnergyRanking.signals.some(
    (signal) => signal.code === "cold_climate_energy_context"
  )
) {
  console.error("Expected cold_climate_energy_context for cold-climate energy food.");
  console.error(coldClimateEnergyRanking.signals);
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

if (adultLabelledSeniorMetadataRanking.bucket !== "hold") {
  console.error("Adult-labelled food should be held for senior shortlists even if metadata says senior.");
  console.error({ seniorRanking, adultLabelledSeniorMetadataRanking });
  process.exit(1);
}

if (
  !adultLabelledSeniorMetadataRanking.signals.some(
    (signal) => signal.code === "senior_positioning_not_customer_visible"
  )
) {
  console.error("Expected senior_positioning_not_customer_visible for adult-labelled senior metadata.");
  console.error(adultLabelledSeniorMetadataRanking.signals);
  process.exit(1);
}

if (!seniorRanking.signals.some((signal) => signal.code === "senior_mobility_support_signal")) {
  console.error("Expected senior_mobility_support_signal for senior mobility food.");
  console.error(seniorRanking.signals);
  process.exit(1);
}

const seniorMuscleLossPet = {
  ...seniorPet,
  healthIssues: ["muscle loss", "senior"],
};
const seniorMuscleSupportFood = food({
  id: "senior-muscle-support",
  formula_key: "qa|senior-muscle-support|dog|dry",
  display_name: "Senior 8+ Muscle Support Chicken",
  life_stage: "senior",
  dog_size: "medium",
  commercial_tags: ["senior"],
  ingredients: ["chicken", "rice", "fish oil"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 352,
});
const seniorLowProteinFood = food({
  id: "senior-low-protein",
  formula_key: "qa|senior-low-protein|dog|dry",
  display_name: "Senior 8+ Light Low Protein Chicken",
  life_stage: "senior",
  dog_size: "medium",
  commercial_tags: ["senior", "light"],
  ingredients: ["chicken", "rice"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 330,
});
const seniorMuscleSupportRanking = rankFoodV2ForPet({
  food: seniorMuscleSupportFood,
  nutrients: {
    ...nutrients(seniorMuscleSupportFood),
    protein_percent: 26,
    fat_percent: 12,
    fiber_percent: 3,
  },
  pet: seniorMuscleLossPet,
  goal: "senior",
});
const seniorLowProteinRanking = rankFoodV2ForPet({
  food: seniorLowProteinFood,
  nutrients: {
    ...nutrients(seniorLowProteinFood),
    protein_percent: 20,
    fat_percent: 8,
    fiber_percent: 5,
  },
  pet: seniorMuscleLossPet,
  goal: "senior",
});

if (seniorMuscleSupportRanking.bucket === "hold") {
  console.error("Senior muscle-loss context should keep suitable senior foods usable.");
  console.error(seniorMuscleSupportRanking);
  process.exit(1);
}

if (seniorMuscleSupportRanking.total_score <= seniorLowProteinRanking.total_score) {
  console.error("Senior muscle-loss context should prefer adequate-protein senior foods over low-protein light foods.");
  console.error({ seniorMuscleSupportRanking, seniorLowProteinRanking });
  process.exit(1);
}

if (
  !seniorMuscleSupportRanking.signals.some(
    (signal) => signal.code === "recovery_special_care_positioning"
  )
) {
  console.error("Expected recovery_special_care_positioning for adequate-protein senior muscle-loss food.");
  console.error(seniorMuscleSupportRanking.signals);
  process.exit(1);
}

const seniorPoorAppetitePet = {
  ...seniorPet,
  healthIssues: ["senior", "low appetite", "losing weight"],
};
const seniorMaintenanceFood = food({
  id: "senior-maintenance",
  formula_key: "qa|senior-maintenance|dog|dry",
  display_name: "Senior 8+ Maintenance Chicken",
  life_stage: "senior",
  dog_size: "medium",
  commercial_tags: ["senior"],
  ingredients: ["chicken", "rice"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 365,
});
const seniorLightFood = food({
  id: "senior-light",
  formula_key: "qa|senior-light|dog|dry",
  display_name: "Senior Light Weight Control Chicken",
  life_stage: "senior",
  dog_size: "medium",
  commercial_tags: ["senior", "light", "weight_control"],
  ingredients: ["chicken", "rice"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 330,
});
const seniorMaintenanceRanking = rankFoodV2ForPet({
  food: seniorMaintenanceFood,
  nutrients: {
    ...nutrients(seniorMaintenanceFood),
    protein_percent: 26,
    fat_percent: 13,
    fiber_percent: 3,
  },
  pet: seniorPoorAppetitePet,
  goal: "senior",
});
const seniorLightRanking = rankFoodV2ForPet({
  food: seniorLightFood,
  nutrients: {
    ...nutrients(seniorLightFood),
    protein_percent: 24,
    fat_percent: 8,
    fiber_percent: 6,
  },
  pet: seniorPoorAppetitePet,
  goal: "senior",
});

if (seniorMaintenanceRanking.total_score <= seniorLightRanking.total_score) {
  console.error("Senior pets with low appetite or weight loss should not default to light food.");
  console.error({ seniorMaintenanceRanking, seniorLightRanking });
  process.exit(1);
}

if (
  !seniorLightRanking.signals.some(
    (signal) => signal.code === "senior_appetite_weight_loss_avoid_light_default"
  )
) {
  console.error("Expected senior_appetite_weight_loss_avoid_light_default for senior light food.");
  console.error(seniorLightRanking.signals);
  process.exit(1);
}

const greekSeniorPoorAppetitePet = {
  ...seniorPet,
  healthIssues: ["ηλικιωμένο", "χαμηλή όρεξη", "χάνει βάρος"],
};
const greekSeniorMaintenanceRanking = rankFoodV2ForPet({
  food: seniorMaintenanceFood,
  nutrients: {
    ...nutrients(seniorMaintenanceFood),
    protein_percent: 26,
    fat_percent: 13,
    fiber_percent: 3,
  },
  pet: greekSeniorPoorAppetitePet,
  goal: "senior",
});
const greekSeniorLightRanking = rankFoodV2ForPet({
  food: seniorLightFood,
  nutrients: {
    ...nutrients(seniorLightFood),
    protein_percent: 24,
    fat_percent: 8,
    fiber_percent: 6,
  },
  pet: greekSeniorPoorAppetitePet,
  goal: "senior",
});

if (greekSeniorMaintenanceRanking.total_score <= greekSeniorLightRanking.total_score) {
  console.error("Greek senior appetite/weight-loss context should not default to light food.");
  console.error({ greekSeniorMaintenanceRanking, greekSeniorLightRanking });
  process.exit(1);
}

if (
  !greekSeniorLightRanking.signals.some(
    (signal) => signal.code === "senior_appetite_weight_loss_avoid_light_default"
  )
) {
  console.error("Expected senior_appetite_weight_loss_avoid_light_default for Greek senior light food.");
  console.error(greekSeniorLightRanking.signals);
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

const visiblePuppyStageFood = food({
  id: "visible-puppy-stage",
  formula_key: "qa|visible-puppy-stage|dog|dry",
  display_name: "Club 4 Paws Puppies All Breeds",
  life_stage: "adult",
  kcal_per_100g: 385,
  ingredients: ["chicken", "rice", "corn", "salmon oil"],
  commercial_tags: ["puppy", "all_breeds"],
  primary_animal_proteins: ["chicken"],
});
const visiblePuppyStageRanking = rankFoodV2ForPet({
  food: visiblePuppyStageFood,
  nutrients: {
    ...nutrients(visiblePuppyStageFood),
    calcium_percent: 1.3,
    phosphorus_percent: 1,
  },
  pet: puppyPet,
  goal: "growth",
});

if (visiblePuppyStageRanking.bucket === "hold") {
  console.error("Food visibly titled as puppy should not be held just because stored life_stage says adult.");
  console.error(visiblePuppyStageRanking);
  process.exit(1);
}

if (!visiblePuppyStageRanking.signals.some((signal) => signal.code === "life_stage_match")) {
  console.error("Expected visible puppy title/tags to produce life_stage_match for puppy pet.");
  console.error(visiblePuppyStageRanking.signals);
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
const greekLargeBreedPuppyFood = food({
  id: "greek-large-breed-puppy",
  formula_key: "qa|greek-large-breed-puppy|dog|dry",
  display_name: "Κουτάβι Μεγαλόσωμης Φυλής Κοτόπουλο",
  formula_name: "Κουτάβι Μεγαλόσωμης Φυλής Κοτόπουλο",
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
const greekLargeBreedPuppyRanking = rankFoodV2ForPet({
  food: greekLargeBreedPuppyFood,
  nutrients: nutrients(greekLargeBreedPuppyFood),
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

if (
  !greekLargeBreedPuppyRanking.signals.some(
    (signal) => signal.code === "large_breed_puppy_fit"
  )
) {
  console.error("Greek large-breed puppy title should produce large_breed_puppy_fit.");
  console.error(greekLargeBreedPuppyRanking.signals);
  process.exit(1);
}

const largeBreedContextPuppy = {
  ...pet,
  breed: "",
  age: 0.5,
  weight: 0,
  healthIssues: ["large breed puppy", "bone growth"],
  excludedIngredients: [],
  preferredProteins: [],
};
const smallPuppyFood = food({
  id: "small-puppy",
  formula_key: "qa|small-puppy|dog|dry",
  display_name: "Small Junior Chicken",
  life_stage: "puppy",
  dog_size: "small",
  ingredients: ["chicken", "rice"],
  primary_animal_proteins: ["chicken"],
});
const largeContextSmallPuppyRanking = rankFoodV2ForPet({
  food: smallPuppyFood,
  nutrients: nutrients(smallPuppyFood),
  pet: largeBreedContextPuppy,
  goal: "growth",
});
const largeContextLargePuppyRanking = rankFoodV2ForPet({
  food: largeBreedPuppyFood,
  nutrients: nutrients(largeBreedPuppyFood),
  pet: largeBreedContextPuppy,
  goal: "growth",
});
const largeContextLargePuppyWithoutMineralsRanking = rankFoodV2ForPet({
  food: largeBreedPuppyFood,
  nutrients: {
    ...nutrients(largeBreedPuppyFood),
    calcium_percent: null,
    phosphorus_percent: null,
  },
  pet: largeBreedContextPuppy,
  goal: "growth",
});

if (largeContextSmallPuppyRanking.bucket !== "hold") {
  console.error("Small puppy food should be held when user context says large-breed puppy.");
  console.error(largeContextSmallPuppyRanking);
  process.exit(1);
}

if (largeContextLargePuppyRanking.total_score <= largeContextSmallPuppyRanking.total_score) {
  console.error("Large-breed puppy context should prefer large-breed puppy food over small puppy food.");
  console.error({ largeContextLargePuppyRanking, largeContextSmallPuppyRanking });
  process.exit(1);
}

if (
  largeContextLargePuppyRanking.total_score <=
  largeContextLargePuppyWithoutMineralsRanking.total_score
) {
  console.error("Large-breed puppy food with Ca/P data should outrank the same food without Ca/P data.");
  console.error({
    largeContextLargePuppyRanking,
    largeContextLargePuppyWithoutMineralsRanking,
  });
  process.exit(1);
}

if (
  !largeContextLargePuppyWithoutMineralsRanking.signals.some(
    (signal) => signal.code === "large_breed_growth_mineral_gap"
  )
) {
  console.error("Expected large_breed_growth_mineral_gap when Ca/P data is missing.");
  console.error(largeContextLargePuppyWithoutMineralsRanking.signals);
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

const urinaryOxalateFood = food({
  id: "urinary-oxalate",
  formula_key: "qa|urinary-oxalate|cat|dry",
  brand: "QA Vet",
  display_name: "Urinary Oxalate",
  species: "cat",
  life_stage: "adult",
  ingredients: ["chicken", "rice"],
  medical_tags: ["urinary"],
});
const struviteContextOxalateRanking = rankFoodV2ForPet({
  food: urinaryOxalateFood,
  nutrients: {
    ...nutrients(urinaryOxalateFood),
    magnesium_percent: 0.07,
    phosphorus_percent: 0.75,
  },
  pet: urinaryPet,
  goal: "urinary",
});
const struviteContextOxalateGuards = detectFoodV2RecommendationGuardFlags(struviteContextOxalateRanking);

if (struviteContextOxalateRanking.bucket !== "hold") {
  console.error("Oxalate-positioned urinary food should be held for explicit struvite history.");
  console.error(struviteContextOxalateRanking);
  process.exit(1);
}

if (!struviteContextOxalateRanking.signals.some((signal) => signal.code === "urinary_subtype_mismatch")) {
  console.error("Expected urinary_subtype_mismatch when oxalate food is evaluated for struvite history.");
  console.error(struviteContextOxalateRanking.signals);
  process.exit(1);
}

if (!struviteContextOxalateGuards.some((flag) => flag.code === "urinary_subtype_mismatch" && flag.severity === "block")) {
  console.error("Expected urinary_subtype_mismatch to be exposed as a block guard.");
  console.error(struviteContextOxalateGuards);
  process.exit(1);
}

if (!urinaryRanking.signals.some((signal) => signal.code === "urinary_struvite_match")) {
  console.error("Expected urinary_struvite_match for a struvite food in a struvite history context.");
  console.error(urinaryRanking.signals);
  process.exit(1);
}

const oxalatePet = {
  ...urinaryPet,
  healthIssues: ["urinary", "oxalate history"],
};
const oxalateRanking = rankFoodV2ForPet({
  food: urinaryOxalateFood,
  nutrients: {
    ...nutrients(urinaryOxalateFood),
    magnesium_percent: 0.07,
    phosphorus_percent: 0.75,
  },
  pet: oxalatePet,
  goal: "urinary",
});
const oxalateContextStruviteRanking = rankFoodV2ForPet({
  food: urinaryFood,
  nutrients: {
    ...nutrients(urinaryFood),
    magnesium_percent: 0.07,
    phosphorus_percent: 0.75,
  },
  pet: oxalatePet,
  goal: "urinary",
});

if (oxalateRanking.bucket === "hold") {
  console.error("Oxalate-positioned urinary food should remain usable for explicit oxalate history.");
  console.error(oxalateRanking);
  process.exit(1);
}

if (oxalateContextStruviteRanking.bucket !== "hold") {
  console.error("Struvite-positioned urinary food should be held for explicit oxalate history.");
  console.error(oxalateContextStruviteRanking);
  process.exit(1);
}

if (!oxalateRanking.signals.some((signal) => signal.code === "urinary_oxalate_match")) {
  console.error("Expected urinary_oxalate_match for an oxalate food in an oxalate history context.");
  console.error(oxalateRanking.signals);
  process.exit(1);
}

const hepaticPet = {
  ...pet,
  weight: 18,
  age: 8,
  healthIssues: ["hepatic disease", "elevated liver enzymes"],
  excludedIngredients: [],
  preferredProteins: [],
};
const hepaticFood = food({
  id: "hepatic-food",
  formula_key: "qa|hepatic|dog|dry",
  brand: "QA Vet",
  display_name: "Hepatic Veterinary Diet",
  ingredients: ["rice", "egg", "fish oil"],
  medical_tags: ["hepatic"],
});
const genericAdultForHepaticFood = food({
  id: "generic-adult-hepatic-context",
  formula_key: "qa|generic-adult-hepatic-context|dog|dry",
  brand: "QA Generic",
  display_name: "Adult Chicken Maintenance",
  ingredients: ["chicken", "rice"],
});
const hepaticRanking = rankFoodV2ForPet({
  food: hepaticFood,
  nutrients: nutrients(hepaticFood),
  pet: hepaticPet,
  goal: "general",
});
const genericAdultForHepaticRanking = rankFoodV2ForPet({
  food: genericAdultForHepaticFood,
  nutrients: nutrients(genericAdultForHepaticFood),
  pet: hepaticPet,
  goal: "general",
});

if (hepaticRanking.bucket === "hold") {
  console.error("Hepatic-positioned food should remain usable for hepatic contexts.");
  console.error(hepaticRanking);
  process.exit(1);
}

if (genericAdultForHepaticRanking.bucket !== "hold") {
  console.error("Generic adult food should be held for hepatic contexts.");
  console.error(genericAdultForHepaticRanking);
  process.exit(1);
}

if (!hepaticRanking.signals.some((signal) => signal.code === "hepatic_special_care_positioning")) {
  console.error("Expected hepatic_special_care_positioning for hepatic food.");
  console.error(hepaticRanking.signals);
  process.exit(1);
}

if (!genericAdultForHepaticRanking.signals.some((signal) => signal.code === "hepatic_special_care_mismatch")) {
  console.error("Expected hepatic_special_care_mismatch for generic hepatic-context food.");
  console.error(genericAdultForHepaticRanking.signals);
  process.exit(1);
}

const mobilityPet = {
  ...pet,
  weight: 32,
  age: 9,
  healthIssues: ["arthritis", "hip dysplasia"],
  excludedIngredients: [],
  preferredProteins: [],
};
const mobilityFood = food({
  id: "mobility-food",
  formula_key: "qa|mobility|dog|dry",
  brand: "QA Vet",
  display_name: "Joint Mobility Adult",
  dog_size: "large",
  ingredients: ["chicken", "rice", "fish oil"],
  commercial_tags: ["mobility"],
});
const genericAdultForMobilityFood = food({
  id: "generic-adult-mobility-context",
  formula_key: "qa|generic-adult-mobility-context|dog|dry",
  brand: "QA Generic",
  display_name: "Adult Maintenance Chicken",
  ingredients: ["chicken", "rice"],
});
const mobilityRanking = rankFoodV2ForPet({
  food: mobilityFood,
  nutrients: {
    ...nutrients(mobilityFood),
    epa_dha_percent: 0.35,
  },
  pet: mobilityPet,
  goal: "senior",
});
const genericAdultForMobilityRanking = rankFoodV2ForPet({
  food: genericAdultForMobilityFood,
  nutrients: nutrients(genericAdultForMobilityFood),
  pet: mobilityPet,
  goal: "senior",
});

if (mobilityRanking.bucket === "hold") {
  console.error("Mobility-positioned food should remain usable for arthritis contexts.");
  console.error(mobilityRanking);
  process.exit(1);
}

if (genericAdultForMobilityRanking.bucket !== "hold") {
  console.error("Generic adult food should be held for arthritis/mobility contexts.");
  console.error(genericAdultForMobilityRanking);
  process.exit(1);
}

if (!mobilityRanking.signals.some((signal) => signal.code === "mobility_special_care_positioning")) {
  console.error("Expected mobility_special_care_positioning for mobility food.");
  console.error(mobilityRanking.signals);
  process.exit(1);
}

const pancreatitisPet = {
  ...pet,
  healthIssues: ["pancreatitis history"],
  excludedIngredients: [],
  preferredProteins: [],
};
const lowFatPancreatitisFood = food({
  id: "low-fat-pancreatitis",
  formula_key: "qa|low-fat-pancreatitis|dog|dry",
  display_name: "Digestive Low Fat Adult",
  commercial_tags: ["digestive", "low_fat"],
  ingredients: ["chicken", "rice"],
  kcal_per_100g: 330,
});
const highFatPancreatitisFood = food({
  id: "high-fat-pancreatitis",
  formula_key: "qa|high-fat-pancreatitis|dog|dry",
  display_name: "Adult Energy Rich Chicken",
  commercial_tags: ["active", "energy"],
  ingredients: ["chicken", "rice"],
  kcal_per_100g: 405,
});
const lowFatPancreatitisRanking = rankFoodV2ForPet({
  food: lowFatPancreatitisFood,
  nutrients: {
    ...nutrients(lowFatPancreatitisFood),
    fat_percent: 8,
  },
  pet: pancreatitisPet,
  goal: "sensitive_digestion",
});
const highFatPancreatitisRanking = rankFoodV2ForPet({
  food: highFatPancreatitisFood,
  nutrients: {
    ...nutrients(highFatPancreatitisFood),
    fat_percent: 18,
  },
  pet: pancreatitisPet,
  goal: "sensitive_digestion",
});
const highFatPancreatitisGuards = detectFoodV2RecommendationGuardFlags(
  highFatPancreatitisRanking
);

if (highFatPancreatitisRanking.bucket !== "hold") {
  console.error("High-fat food should be held for pancreatitis history.");
  console.error(highFatPancreatitisRanking);
  process.exit(1);
}

if (lowFatPancreatitisRanking.bucket === "hold") {
  console.error("Low-fat food should remain usable for pancreatitis-sensitive review.");
  console.error(lowFatPancreatitisRanking);
  process.exit(1);
}

if (
  lowFatPancreatitisRanking.total_score <= highFatPancreatitisRanking.total_score
) {
  console.error("Low-fat pancreatitis candidate should outrank high-fat candidate.");
  console.error({ lowFatPancreatitisRanking, highFatPancreatitisRanking });
  process.exit(1);
}

if (
  !lowFatPancreatitisRanking.signals.some(
    (signal) => signal.code === "pancreatitis_low_fat_fit"
  )
) {
  console.error("Expected pancreatitis_low_fat_fit for low-fat pancreatitis candidate.");
  console.error(lowFatPancreatitisRanking.signals);
  process.exit(1);
}

if (
  !highFatPancreatitisGuards.some(
    (flag) => flag.code === "pancreatitis_high_fat_mismatch" && flag.severity === "block"
  )
) {
  console.error("Expected pancreatitis_high_fat_mismatch block guard.");
  console.error(highFatPancreatitisGuards);
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
const skinCoatSalmonFood = food({
  id: "skin-coat-salmon",
  formula_key: "qa|skin-coat-salmon|dog|dry",
  brand: "QA Skin",
  display_name: "Adult Salmon Skin & Coat",
  formula_name: "Adult Salmon Skin & Coat",
  commercial_tags: ["skin_coat"],
  ingredients: ["salmon", "rice", "fish oil"],
  primary_animal_proteins: ["salmon"],
  kcal_per_100g: 368,
});
const genericChickenFoodForSkin = food({
  id: "generic-chicken-skin-context",
  formula_key: "qa|generic-chicken-skin-context|dog|dry",
  brand: "QA Generic",
  display_name: "Adult Chicken",
  formula_name: "Adult Chicken",
  ingredients: ["chicken", "rice"],
  primary_animal_proteins: ["chicken"],
  kcal_per_100g: 360,
});
const activeFoodWithoutSkinPreference = food({
  id: "active-without-skin-preference",
  formula_key: "qa|active-without-skin-preference|dog|dry",
  brand: "QA Active",
  display_name: "Active Nature",
  formula_name: "Active Nature",
  commercial_tags: ["active", "performance"],
  ingredients: ["lamb", "rice", "potato"],
  primary_animal_proteins: ["lamb"],
  kcal_per_100g: 386,
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

const skinCoatSalmonRanking = rankFoodV2ForPet({
  food: skinCoatSalmonFood,
  nutrients: {
    ...nutrients(skinCoatSalmonFood),
    protein_percent: 28,
    fat_percent: 15,
    omega3_percent: 1.1,
    epa_dha_percent: 0.35,
  },
  pet: generalSkinPet,
  goal: "general",
});
const genericChickenSkinRanking = rankFoodV2ForPet({
  food: genericChickenFoodForSkin,
  nutrients: {
    ...nutrients(genericChickenFoodForSkin),
    protein_percent: 25,
    fat_percent: 12,
  },
  pet: generalSkinPet,
  goal: "general",
});
const activeWithoutSkinPreferenceRanking = rankFoodV2ForPet({
  food: activeFoodWithoutSkinPreference,
  nutrients: {
    ...nutrients(activeFoodWithoutSkinPreference),
    protein_percent: 28,
    fat_percent: 16,
  },
  pet: generalSkinPet,
  goal: "general",
});

if (skinCoatSalmonRanking.total_score <= genericChickenSkinRanking.total_score) {
  console.error("Skin/coat salmon food should outrank generic chicken for itchy-skin salmon preference.");
  console.error({ skinCoatSalmonRanking, genericChickenSkinRanking });
  process.exit(1);
}

if (skinCoatSalmonRanking.total_score <= activeWithoutSkinPreferenceRanking.total_score) {
  console.error("Skin/coat salmon food should outrank active food that misses the stated salmon/skin context.");
  console.error({ skinCoatSalmonRanking, activeWithoutSkinPreferenceRanking });
  process.exit(1);
}

if (
  !skinCoatSalmonRanking.signals.some(
    (signal) => signal.code === "skin_coat_omega_fit"
  )
) {
  console.error("Expected skin_coat_omega_fit for skin/coat salmon food.");
  console.error(skinCoatSalmonRanking.signals);
  process.exit(1);
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
  formula_key: "qa|happy-dog-naturcroq-adult-chicken|dog|dry",
  brand: "Happy Dog",
  display_name: "Naturcroq Adult Chicken",
  formula_name: "Naturcroq Adult Chicken",
  dog_size: "medium",
  commercial_tags: ["adult", "complete"],
  data_quality_status: "verified",
  source_priority: "official",
});
const premiumAdultFood = food({
  id: "premium-adult",
  formula_key: "qa|acana-classic-red-meat|dog|dry",
  brand: "ACANA",
  display_name: "Classic Red Meat",
  formula_name: "Classic Red Meat",
  dog_size: "medium",
  commercial_tags: ["classic", "adult"],
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

const struviteCatPet = {
  species: "cat" as const,
  breed: "European shorthair",
  weight: 5.2,
  age: 5,
  activityLevel: "normal" as const,
  neutered: true,
  healthIssues: ["urinary", "struvite history"],
  allergies: [],
  excludedIngredients: [],
  preferredProteins: [],
};
const oxalateOnlyCatFood = food({
  id: "oxalate-only-cat",
  formula_key: "qa|cat-urinary-oxalate|cat|dry",
  species: "cat",
  display_name: "Urinary Oxalate Cat",
  formula_name: "Urinary Oxalate Cat",
  life_stage: "adult",
  medical_tags: ["urinary", "struvite dissolution claim"],
  ingredients: ["chicken", "rice"],
});
const struviteCatFood = food({
  id: "struvite-cat",
  formula_key: "qa|cat-urinary-struvite|cat|dry",
  species: "cat",
  display_name: "Urinary Struvite Cat",
  formula_name: "Urinary Struvite Cat",
  life_stage: "adult",
  medical_tags: ["urinary"],
  ingredients: ["chicken", "rice"],
});
const oxalateOnlyForStruviteRanking = rankFoodV2ForPet({
  food: oxalateOnlyCatFood,
  nutrients: nutrients(oxalateOnlyCatFood),
  pet: struviteCatPet,
  goal: "urinary",
});
const struviteForStruviteRanking = rankFoodV2ForPet({
  food: struviteCatFood,
  nutrients: nutrients(struviteCatFood),
  pet: struviteCatPet,
  goal: "urinary",
});

if (oxalateOnlyForStruviteRanking.bucket !== "hold") {
  console.error("Visible oxalate-only food should be held for struvite history.");
  console.error(oxalateOnlyForStruviteRanking);
  process.exit(1);
}

if (
  !oxalateOnlyForStruviteRanking.signals.some(
    (signal) => signal.code === "urinary_subtype_mismatch"
  )
) {
  console.error("Expected urinary_subtype_mismatch for visible oxalate-only food in struvite case.");
  console.error(oxalateOnlyForStruviteRanking.signals);
  process.exit(1);
}

if (struviteForStruviteRanking.bucket === "hold") {
  console.error("Visible struvite food should remain selectable for struvite history.");
  console.error(struviteForStruviteRanking);
  process.exit(1);
}

if (
  !struviteForStruviteRanking.signals.some(
    (signal) => signal.code === "urinary_struvite_match"
  )
) {
  console.error("Expected urinary_struvite_match for visible struvite food.");
  console.error(struviteForStruviteRanking.signals);
  process.exit(1);
}

const seniorFoodWithKidneyIngredient = food({
  id: "senior-with-kidney-beans",
  formula_key: "qa|senior-with-kidney-beans|dog|dry",
  display_name: "Senior Chicken",
  life_stage: "senior",
  primary_animal_proteins: ["chicken"],
  ingredients: ["chicken", "kidney beans", "rice"],
});
const visibleRenalDogFood = food({
  id: "visible-renal-dog",
  formula_key: "qa|visible-renal-dog|dog|dry",
  display_name: "Renal Care",
  life_stage: "adult",
  medical_tags: ["renal"],
  primary_animal_proteins: ["chicken"],
  ingredients: ["chicken", "rice"],
});
const renalDogPet = {
  ...pet,
  age: 11,
  weight: 9,
  healthIssues: ["renal"],
  excludedIngredients: [],
  preferredProteins: [],
};
const kidneyIngredientRanking = rankFoodV2ForPet({
  food: seniorFoodWithKidneyIngredient,
  nutrients: nutrients(seniorFoodWithKidneyIngredient),
  pet: renalDogPet,
  goal: "renal",
});
const visibleRenalDogRanking = rankFoodV2ForPet({
  food: visibleRenalDogFood,
  nutrients: nutrients(visibleRenalDogFood),
  pet: renalDogPet,
  goal: "renal",
});
const renalDogSplit = splitFoodV2Recommendations([
  kidneyIngredientRanking,
  visibleRenalDogRanking,
]);

if (kidneyIngredientRanking.bucket !== "hold") {
  console.error("Ingredient text such as kidney beans must not make a food renal-positioned.");
  console.error(kidneyIngredientRanking);
  process.exit(1);
}

if (
  !kidneyIngredientRanking.signals.some(
    (signal) => signal.code === "renal_needs_vet_food"
  )
) {
  console.error("Expected renal_needs_vet_food when renal positioning is absent from title/tags.");
  console.error(kidneyIngredientRanking.signals);
  process.exit(1);
}

if (renalDogSplit.premium[0]?.formula_key !== "qa|visible-renal-dog|dog|dry") {
  console.error("Visible renal formula should outrank a senior food that only mentions kidney in ingredients.");
  console.error(renalDogSplit);
  process.exit(1);
}

const implausiblyLowFatPuppyFood = food({
  id: "implausibly-low-fat-puppy",
  formula_key: "qa|implausibly-low-fat-puppy|dog|dry",
  brand: "Brit",
  display_name: "Care Grain Free Puppy Salmon",
  formula_name: "Care Grain Free Puppy Salmon",
  life_stage: "puppy",
  dog_size: "large",
  primary_animal_proteins: ["salmon"],
  ingredients: ["salmon", "potato"],
  kcal_per_100g: 393,
});
const acanaLargeBreedPuppyFood = food({
  id: "acana-large-breed-puppy",
  formula_key: "qa|acana-puppy-large-breed|dog|dry",
  brand: "Acana",
  display_name: "Puppy Large Breed",
  formula_name: "Puppy Large Breed",
  life_stage: "puppy",
  dog_size: "large",
  primary_animal_proteins: ["chicken"],
  ingredients: ["chicken", "oats"],
  kcal_per_100g: 337.5,
});
const largeBreedGrowthPet = {
  ...pet,
  age: 0.58,
  weight: 30,
  neutered: false,
  healthIssues: ["large breed puppy", "growth"],
  excludedIngredients: [],
  preferredProteins: [],
};
const implausiblyLowFatPuppyRanking = rankFoodV2ForPet({
  food: implausiblyLowFatPuppyFood,
  nutrients: {
    ...nutrients(implausiblyLowFatPuppyFood),
    protein_percent: 30,
    fat_percent: 2.3,
    fiber_percent: 2.5,
  },
  pet: largeBreedGrowthPet,
  goal: "growth",
});
const acanaLargeBreedPuppyRanking = rankFoodV2ForPet({
  food: acanaLargeBreedPuppyFood,
  nutrients: {
    ...nutrients(acanaLargeBreedPuppyFood),
    protein_percent: 33,
    fat_percent: 15,
    fiber_percent: 6,
  },
  pet: largeBreedGrowthPet,
  goal: "growth",
});
const growthSplit = splitFoodV2Recommendations([
  implausiblyLowFatPuppyRanking,
  acanaLargeBreedPuppyRanking,
]);

if (implausiblyLowFatPuppyRanking.bucket !== "hold") {
  console.error("Dry growth foods with implausibly low fat should be held for data review.");
  console.error(implausiblyLowFatPuppyRanking);
  process.exit(1);
}

if (
  !implausiblyLowFatPuppyRanking.signals.some(
    (signal) => signal.code === "implausibly_low_fat_growth_food"
  )
) {
  console.error("Expected implausibly_low_fat_growth_food signal for suspicious puppy fat data.");
  console.error(implausiblyLowFatPuppyRanking.signals);
  process.exit(1);
}

if (growthSplit.premium[0]?.formula_key !== "qa|acana-puppy-large-breed|dog|dry") {
  console.error("A large-breed puppy formula with plausible nutrition should outrank suspicious low-fat puppy data.");
  console.error(growthSplit);
  process.exit(1);
}

const adultSterilisedValueSplit = splitFoodV2Recommendations(
  [
    {
      ...clearSmallSterilisedRanking,
      formula_key: "qa|visible-adult-value|dog|dry",
      display_name: "Adult Light Chicken",
      brand: "Happy Dog",
      total_score: 74,
      value_score: 82,
      bucket: "value",
      value_tier: "value_candidate",
    },
    {
      ...clearSmallSterilisedRanking,
      formula_key: "qa|senior-value-leak|dog|dry",
      display_name: "Senior Light Chicken",
      brand: "Josera",
      total_score: 92,
      value_score: 95,
      bucket: "value",
      value_tier: "value_candidate",
    },
    {
      ...clearSmallSterilisedRanking,
      formula_key: "qa|renal-value-leak|dog|dry",
      display_name: "Renal Veterinary Chicken",
      brand: "QA Vet",
      total_score: 90,
      value_score: 94,
      bucket: "value",
      value_tier: "value_candidate",
    },
  ],
  3,
  "sterilised"
);

const visibleAdultSterilisedValueKeys = [
  ...adultSterilisedValueSplit.premium,
  ...adultSterilisedValueSplit.value,
].map((ranking) => ranking.formula_key);

if (visibleAdultSterilisedValueKeys.includes("qa|senior-value-leak|dog|dry")) {
  console.error("Adult/sterilised value alternatives should not surface senior-positioned foods.");
  console.error(adultSterilisedValueSplit);
  process.exit(1);
}

if (visibleAdultSterilisedValueKeys.includes("qa|renal-value-leak|dog|dry")) {
  console.error("Adult/sterilised value alternatives should not surface renal/veterinary foods.");
  console.error(adultSterilisedValueSplit);
  process.exit(1);
}

if (!visibleAdultSterilisedValueKeys.includes("qa|visible-adult-value|dog|dry")) {
  console.error("A normal adult/light value alternative should remain visible.");
  console.error(adultSterilisedValueSplit);
  process.exit(1);
}

const renalValueSplit = splitFoodV2Recommendations(
  [
    {
      ...clearSmallSterilisedRanking,
      formula_key: "qa|renal-value-allowed|dog|dry",
      display_name: "Renal Veterinary Chicken",
      brand: "QA Vet",
      total_score: 90,
      value_score: 94,
      bucket: "value",
      value_tier: "value_candidate",
    },
  ],
  3,
  "renal"
);

if (renalValueSplit.premium[0]?.formula_key !== "qa|renal-value-allowed|dog|dry") {
  console.error("Renal-positioned value foods should remain visible when the goal is renal.");
  console.error(renalValueSplit);
  process.exit(1);
}

console.log("Food V2 preference, weight, and puppy guard QA passed.");
