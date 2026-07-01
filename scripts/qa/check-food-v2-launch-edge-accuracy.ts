import {
  rankFoodV2ForPet,
  splitFoodV2Recommendations,
  type FoodV2RecommendationGoal,
} from "@/lib/food-v2/recommendationRanking";
import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";

type TestPet = Parameters<typeof rankFoodV2ForPet>[0]["pet"];

function assert(condition: unknown, message: string, details?: unknown) {
  if (!condition) {
    console.error(message);
    if (details !== undefined) console.error(JSON.stringify(details, null, 2));
    process.exit(1);
  }
}

function food(overrides: Partial<FoodProductV2>): FoodProductV2 {
  return {
    id: overrides.id ?? "qa-food",
    brand: overrides.brand ?? "QA Brand",
    formula_name: overrides.formula_name ?? overrides.display_name ?? "QA Food",
    display_name: overrides.display_name ?? overrides.formula_name ?? "QA Food",
    species: overrides.species ?? "dog",
    format: overrides.format ?? "dry",
    life_stage: overrides.life_stage ?? "adult",
    dog_size: overrides.dog_size ?? null,
    breed_target: overrides.breed_target ?? null,
    medical_tags: overrides.medical_tags ?? [],
    commercial_tags: overrides.commercial_tags ?? [],
    ingredient_text: null,
    ingredients: overrides.ingredients ?? ["chicken", "rice", "beet pulp", "minerals"],
    primary_animal_proteins: overrides.primary_animal_proteins ?? ["chicken"],
    carbohydrate_sources: overrides.carbohydrate_sources ?? ["rice"],
    fat_sources: overrides.fat_sources ?? ["fish oil"],
    fiber_sources: overrides.fiber_sources ?? ["beet pulp"],
    kcal_per_100g: overrides.kcal_per_100g ?? 360,
    data_quality_status: overrides.data_quality_status ?? "verified",
    source_priority: overrides.source_priority ?? "official",
    formula_key: overrides.formula_key ?? overrides.id ?? "qa|food",
    ...overrides,
  };
}

function nutrients(overrides: Partial<FoodNutrientsV2> = {}): FoodNutrientsV2 {
  return {
    protein_percent: 28,
    fat_percent: 14,
    fiber_percent: 3,
    calcium_percent: 1.1,
    phosphorus_percent: 0.85,
    sodium_percent: 0.35,
    magnesium_percent: 0.08,
    epa_dha_percent: 0.25,
    ...overrides,
  };
}

function rankFoods({
  foods,
  pet,
  goal,
  nutrientOverrides = {},
}: {
  foods: FoodProductV2[];
  pet: TestPet;
  goal: FoodV2RecommendationGoal;
  nutrientOverrides?: Record<string, Partial<FoodNutrientsV2>>;
}) {
  return foods.map((item) =>
    rankFoodV2ForPet({
      food: item,
      nutrients: nutrients(nutrientOverrides[item.formula_key] ?? {}),
      pet,
      goal,
    })
  );
}

function visibleTop(rankings: ReturnType<typeof rankFoodV2ForPet>[], goal: FoodV2RecommendationGoal) {
  const split = splitFoodV2Recommendations(rankings, 3, goal);
  return {
    split,
    visible: [...split.premium, ...split.value],
  };
}

const giantAdultDog: TestPet = {
  species: "dog",
  breed: "Great Dane",
  weight: 50,
  age: 3,
  activityLevel: "normal",
  neutered: false,
  allergies: [],
  healthIssues: [],
  excludedIngredients: [],
  preferredProteins: [],
};

{
  const smallAdult = food({
    id: "small-adult",
    formula_key: "qa|small-adult|dog|dry",
    display_name: "Small Adult Chicken",
    formula_name: "Small Adult Chicken",
    dog_size: "small",
  });
  const giantAdult = food({
    id: "giant-adult",
    formula_key: "qa|giant-adult|dog|dry",
    display_name: "Giant Adult Chicken",
    formula_name: "Giant Adult Chicken",
    dog_size: "giant",
  });
  const rankings = rankFoods({
    foods: [smallAdult, giantAdult],
    pet: giantAdultDog,
    goal: "general",
  });
  const { visible } = visibleTop(rankings, "general");
  const smallRanking = rankings.find((item) => item.formula_key === smallAdult.formula_key);

  assert(
    visible[0]?.formula_key === giantAdult.formula_key,
    "A giant adult dog must not start from a small-breed food.",
    { rankings, visible }
  );
  assert(
    smallRanking?.bucket === "hold" &&
      smallRanking.signals.some((signal) =>
        ["dog_size_mismatch", "customer_visible_dog_size_mismatch"].includes(signal.code)
      ),
    "Small-breed food should be held for a giant dog with a size-mismatch signal.",
    smallRanking
  );
}

{
  const largePuppyPet: TestPet = {
    species: "dog",
    breed: "Rottweiler",
    weight: 45,
    age: 0.67,
    activityLevel: "normal",
    neutered: false,
    allergies: [],
    healthIssues: ["large breed puppy"],
    excludedIngredients: [],
    preferredProteins: [],
  };
  const largePuppy = food({
    id: "large-puppy",
    formula_key: "qa|large-puppy|dog|dry",
    display_name: "Large Breed Puppy Chicken",
    formula_name: "Large Breed Puppy Chicken",
    life_stage: "puppy",
    dog_size: "large",
    commercial_tags: ["puppy", "large breed"],
  });
  const genericPuppy = food({
    id: "generic-puppy",
    formula_key: "qa|generic-puppy|dog|dry",
    display_name: "Puppy & Junior Chicken",
    formula_name: "Puppy & Junior Chicken",
    life_stage: "puppy",
    dog_size: "all",
    commercial_tags: ["puppy"],
  });
  const smallPuppy = food({
    id: "small-puppy",
    formula_key: "qa|small-puppy|dog|dry",
    display_name: "Small Puppy Chicken",
    formula_name: "Small Puppy Chicken",
    life_stage: "puppy",
    dog_size: "small",
    commercial_tags: ["puppy", "small breed"],
  });
  const rankings = rankFoods({
    foods: [genericPuppy, smallPuppy, largePuppy],
    pet: largePuppyPet,
    goal: "growth",
  });
  const { visible } = visibleTop(rankings, "growth");
  const smallRanking = rankings.find((item) => item.formula_key === smallPuppy.formula_key);

  assert(
    visible[0]?.formula_key === largePuppy.formula_key,
    "Large-breed puppy cases should prefer visibly large-breed puppy food over generic puppy food.",
    { rankings, visible }
  );
  assert(
    smallRanking?.bucket === "hold",
    "Small puppy food should stay on hold for a large-breed puppy.",
    smallRanking
  );
}

{
  const allergyPet: TestPet = {
    species: "dog",
    breed: "Akita",
    weight: 38,
    age: 4,
    activityLevel: "normal",
    neutered: true,
    allergies: ["chicken", "turkey"],
    healthIssues: ["skin allergy"],
    excludedIngredients: ["chicken", "turkey"],
    preferredProteins: ["salmon", "duck"],
  };
  const chickenTurkey = food({
    id: "chicken-turkey",
    formula_key: "qa|chicken-turkey|dog|dry",
    display_name: "Adult Chicken & Turkey",
    primary_animal_proteins: ["chicken", "turkey"],
    ingredients: ["chicken", "turkey", "rice", "poultry fat"],
  });
  const duckMono = food({
    id: "duck-mono",
    formula_key: "qa|duck-mono|dog|dry",
    display_name: "Monoprotein Duck Adult",
    commercial_tags: ["monoprotein", "sensitive"],
    primary_animal_proteins: ["duck"],
    ingredients: ["duck", "potato", "beet pulp", "fish oil"],
  });
  const rankings = rankFoods({
    foods: [chickenTurkey, duckMono],
    pet: allergyPet,
    goal: "allergy",
  });
  const { visible } = visibleTop(rankings, "allergy");
  const chickenRanking = rankings.find((item) => item.formula_key === chickenTurkey.formula_key);

  assert(
    visible[0]?.formula_key === duckMono.formula_key,
    "Chicken/turkey allergy should surface a safe preferred-protein alternative first.",
    { rankings, visible }
  );
  assert(
    chickenRanking?.bucket === "hold" &&
      chickenRanking.signals.some((signal) =>
        signal.code.startsWith("allergy_conflict") ||
        signal.code.startsWith("excluded_ingredient")
      ),
    "Chicken/turkey foods must be held when those proteins are declared allergy/exclusions.",
    chickenRanking
  );
}

{
  const renalCatPet: TestPet = {
    species: "cat",
    breed: "",
    weight: 4.2,
    age: 13,
    activityLevel: "low",
    neutered: true,
    allergies: [],
    healthIssues: ["senior", "renal disease", "high creatinine"],
    excludedIngredients: [],
    preferredProteins: [],
  };
  const renalCat = food({
    id: "renal-cat",
    formula_key: "qa|renal-cat|cat|dry",
    species: "cat",
    display_name: "Renal Cat",
    formula_name: "Renal Cat",
    dog_size: null,
    medical_tags: ["renal"],
    commercial_tags: ["veterinary"],
  });
  const urinaryOxalate = food({
    id: "urinary-oxalate-cat",
    formula_key: "qa|urinary-oxalate|cat|dry",
    species: "cat",
    display_name: "Urinary Oxalate Cat",
    formula_name: "Urinary Oxalate Cat",
    dog_size: null,
    medical_tags: ["urinary"],
    commercial_tags: ["veterinary", "urinary", "oxalate"],
  });
  const seniorCat = food({
    id: "senior-cat",
    formula_key: "qa|senior-cat|cat|dry",
    species: "cat",
    display_name: "Senior 11+ Chicken",
    formula_name: "Senior 11+ Chicken",
    dog_size: null,
    life_stage: "senior",
    commercial_tags: ["senior"],
  });
  const rankings = rankFoods({
    foods: [seniorCat, urinaryOxalate, renalCat],
    pet: renalCatPet,
    goal: "renal",
    nutrientOverrides: {
      [renalCat.formula_key]: { phosphorus_percent: 0.45, sodium_percent: 0.25 },
      [urinaryOxalate.formula_key]: { phosphorus_percent: 0.9, sodium_percent: 0.4 },
    },
  });
  const { visible } = visibleTop(rankings, "renal");
  const urinaryRanking = rankings.find((item) => item.formula_key === urinaryOxalate.formula_key);

  assert(
    visible[0]?.formula_key === renalCat.formula_key,
    "Renal cat cases should start from renal-positioned food, not senior or urinary-only food.",
    { rankings, visible }
  );
  assert(
    urinaryRanking?.bucket === "hold" &&
      urinaryRanking.signals.some((signal) => signal.code === "renal_urinary_mismatch"),
    "Urinary-only food should stay on hold for renal cases.",
    urinaryRanking
  );
}

{
  const struviteCatPet: TestPet = {
    species: "cat",
    breed: "",
    weight: 4.8,
    age: 6,
    activityLevel: "low",
    neutered: true,
    allergies: [],
    healthIssues: ["urinary struvite history"],
    excludedIngredients: [],
    preferredProteins: [],
  };
  const struviteFood = food({
    id: "struvite-cat",
    formula_key: "qa|struvite-cat|cat|dry",
    species: "cat",
    display_name: "Urinary Struvite Cat",
    formula_name: "Urinary Struvite Cat",
    dog_size: null,
    medical_tags: ["urinary"],
    commercial_tags: ["veterinary", "urinary", "struvite"],
  });
  const oxalateFood = food({
    id: "oxalate-cat",
    formula_key: "qa|oxalate-cat|cat|dry",
    species: "cat",
    display_name: "Urinary Oxalate Cat",
    formula_name: "Urinary Oxalate Cat",
    dog_size: null,
    medical_tags: ["urinary"],
    commercial_tags: ["veterinary", "urinary", "oxalate"],
  });
  const rankings = rankFoods({
    foods: [oxalateFood, struviteFood],
    pet: struviteCatPet,
    goal: "urinary",
  });
  const { visible } = visibleTop(rankings, "urinary");
  const oxalateRanking = rankings.find((item) => item.formula_key === oxalateFood.formula_key);

  assert(
    visible[0]?.formula_key === struviteFood.formula_key,
    "Struvite urinary history should start from a struvite-positioned food.",
    { rankings, visible }
  );
  assert(
    oxalateRanking?.bucket === "hold" &&
      oxalateRanking.signals.some((signal) => signal.code === "urinary_subtype_mismatch"),
    "Oxalate-only food should stay on hold for a struvite-specific shortlist.",
    oxalateRanking
  );
}

console.log("Food V2 launch edge accuracy checks passed.");
