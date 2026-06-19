import type { FoodNutrientsV2, FoodProductV2 } from "@/types/food-v2";
import type { Pet } from "@/types/pet";
import {
  scoringWeightsForScenario,
  type RecommendationScenario,
} from "@/lib/nutrition-rules/rulesRegistry";
import { evaluateFeedingFitRules } from "@/lib/nutrition-v2/feedingRules";
import { evaluateGiRules } from "@/lib/nutrition-v2/giRules";
import { evaluateGrowthFitRules } from "@/lib/nutrition-v2/growthRules";
import { evaluateIngredientFitRules } from "@/lib/nutrition-v2/ingredientRules";
import { evaluateObesityFitRules } from "@/lib/nutrition-v2/obesityRules";
import { evaluateRenalRules } from "@/lib/nutrition-v2/renalRules";
import { evaluateSeniorFitRules } from "@/lib/nutrition-v2/seniorRules";
import { evaluateUrinaryRules } from "@/lib/nutrition-v2/urinaryRules";

export type FoodV2RecommendationGoal =
  | "general"
  | "premium"
  | "value"
  | "weight_control"
  | "sensitive_digestion"
  | "allergy"
  | "urinary"
  | "renal"
  | "growth"
  | "sterilised"
  | "senior";

export type FoodV2RankingInput = {
  food: FoodProductV2;
  nutrients: FoodNutrientsV2;
  pet: Pick<
    Pet,
    "species" | "breed" | "age" | "weight" | "activityLevel" | "neutered"
  > & {
    allergies?: string[];
    healthIssues?: string[];
    excludedIngredients?: string[];
    preferredProteins?: string[];
  };
  goal?: FoodV2RecommendationGoal;
};

export type FoodV2RankingSignal = {
  type: "boost" | "caution" | "exclude";
  code: string;
  points: number;
  message: string;
};

export type FoodV2ValueTier = "premium_candidate" | "value_candidate" | "standard";

export type FoodV2RecommendationBucket = "premium" | "value" | "hold";

export type FoodV2RankingResult = {
  formula_key: string;
  display_name: string;
  brand: string;
  total_score: number;
  fit_score: number;
  quality_score: number;
  value_score: number;
  confidence: "high" | "medium" | "low";
  bucket: FoodV2RecommendationBucket;
  value_tier: FoodV2ValueTier;
  reasons: string[];
  cautions: string[];
  signals: FoodV2RankingSignal[];
};

const DOG_SIZE_TERMS = {
  mini: ["mini", "x-small", "extra small", "toy", "very small", "yorkshire", "chihuahua"],
  small: ["small", "mini", "μικροσωμ", "mikrosom", "small breed"],
  medium: ["medium", "μεσαίο", "μεσαίων", "mesaio", "medium breed"],
  large: ["large", "maxi", "large breed", "μεγαλοσωμ", "megalosom"],
  giant: ["giant", "extra large", "x-large", "giant breed", "γιγαντοσωμ"],
} as const;

const BREED_SIZE_TERMS = {
  mini: [
    "chihuahua",
    "pomeranian",
    "yorkshire",
    "yorkie",
    "toy poodle",
    "maltese",
    "μαλτεζ",
  ],
  small: [
    "bichon",
    "cavalier",
    "dachshund",
    "jack russell",
    "shih tzu",
    "westie",
    "beagle",
  ],
  medium: [
    "border collie",
    "cocker",
    "english cocker",
    "french bulldog",
    "bulldog",
    "pointer",
    "setter",
    "shar pei",
  ],
  large: [
    "akita",
    "boxer",
    "dalmatian",
    "doberman",
    "german shepherd",
    "golden retriever",
    "husky",
    "labrador",
    "retriever",
    "rottweiler",
    "weimaraner",
  ],
  giant: [
    "bernese",
    "cane corso",
    "great dane",
    "mastiff",
    "newfoundland",
    "saint bernard",
  ],
} as const;

const ALL_BREED_TERMS = [
  "all breeds",
  "all breed",
  "all sizes",
  "all size",
  "ολων των φυλων",
  "ολες τις φυλες",
  "ολων των μεγεθων",
];

const THERAPEUTIC_TERMS = [
  "vet",
  "veterinary",
  "vetsolution",
  "renal",
  "urinary",
  "struvite",
  "oxalate",
  "diabetic",
  "diabetes",
  "gastro",
  "hepatic",
  "liver",
  "pancreatic",
  "pancreatitis",
  "cardiac",
  "obesity",
  "gastrointestinal",
  "hypoallergenic",
  "anallergenic",
  "dermatosis",
];

const GOAL_THERAPEUTIC_TERMS: Record<FoodV2RecommendationGoal, string[]> = {
  general: [],
  premium: [],
  value: [],
  sterilised: [],
  senior: [],
  growth: [],
  weight_control: ["obesity", "satiety", "weight"],
  sensitive_digestion: ["gastrointestinal", "gastro", "digestive", "sensitivity"],
  allergy: ["hypoallergenic", "anallergenic", "sensitivity", "dermatosis", "skin"],
  urinary: ["urinary", "struvite", "oxalate"],
  renal: ["renal", "kidney"],
};

const VALUE_MARKERS = [
  "classic",
  "regular",
  "basic",
  "daily",
  "everyday",
  "essential",
  "maintenance",
  "adult",
  "standard",
  "complete",
  "balance",
];

const PREMIUM_MARKERS = [
  "veterinary",
  "vet",
  "grain free",
  "monoprotein",
  "hypoallergenic",
  "sensitive",
  "digestive",
  "urinary",
  "renal",
  "puppy",
  "kitten",
  "sterilised",
  "breed",
];

const VALUE_PENALTY_MARKERS = [
  "veterinary",
  "vet ",
  "vet-",
  "prescription",
  "renal",
  "urinary",
  "hepatic",
  "diabetic",
  "gastrointestinal",
  "hypoallergenic",
  "hydrolysed",
  "hydrolyzed",
  "dermatosis",
  "cardiac",
  "mobility",
  "monoprotein",
  "grain free",
  "breed specific",
  "puppy",
  "kitten",
  "junior",
];

const VALUE_FRIENDLY_MARKERS = [
  "briantos",
  "brit premium",
  "dog chow",
  "happy dog naturcroq",
  "josera",
  "maintenance",
  "naturcroq",
  "premium by nature",
  "sensi plus",
];

const PREMIUM_BRAND_MARKERS = [
  "acana",
  "orijen",
  "farmina",
  "n&d",
  "nd quinoa",
  "royal canin",
  "hill's",
  "hills",
];

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9α-ω]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function textFor(food: FoodProductV2) {
  return normalizeText(
    [
      food.brand,
      food.formula_name,
      food.display_name,
      food.life_stage,
      food.dog_size,
      food.breed_target,
      ...(food.medical_tags ?? []),
      ...(food.commercial_tags ?? []),
      ...(food.primary_animal_proteins ?? []),
      ...(food.carbohydrate_sources ?? []),
      ...(food.ingredients ?? []),
    ].join(" ")
  );
}

function petLifeStage(pet: FoodV2RankingInput["pet"]) {
  if (pet.species === "cat") {
    if (pet.age < 1) return "kitten";
    if (pet.age >= 10) return "senior";
    return "adult";
  }

  if (
    pet.age < 1 ||
    (pet.age <= 1 &&
      (pet.weight >= 25 ||
        ["large", "giant"].includes(breedSizeFromText(petSizeContextText(pet)) ?? "")))
  ) {
    return "puppy";
  }
  if (pet.age >= 8) return "senior";
  return "adult";
}

function isLargeBreedDog(pet: FoodV2RankingInput["pet"]) {
  return (
    pet.species === "dog" &&
    (pet.weight >= 25 ||
      (pet.age < 1 && pet.weight >= 18) ||
      ["large", "giant"].includes(breedSizeFromText(petSizeContextText(pet)) ?? ""))
  );
}

function breedSizeFromText(value: unknown) {
  const text = normalizeText(value);
  for (const [size, terms] of Object.entries(BREED_SIZE_TERMS)) {
    if (hasAny(text, terms)) return size;
  }
  for (const [size, terms] of Object.entries(DOG_SIZE_TERMS)) {
    if (hasAny(text, terms)) return size;
  }
  return null;
}

function petSizeContextText(pet: FoodV2RankingInput["pet"]) {
  return [pet.breed, ...(pet.healthIssues ?? [])].join(" ");
}

function expectedDogSize(pet: FoodV2RankingInput["pet"]) {
  if (pet.species !== "dog") return null;
  const breedSize = breedSizeFromText(petSizeContextText(pet));

  if (!hasNumber(pet.weight) || pet.weight <= 0) return breedSize;
  if (pet.weight <= 5) return "mini";
  if (pet.weight <= 10) return "small";
  if (pet.weight <= 25) return "medium";
  if (pet.weight <= 45) return "large";
  return "giant";
}

function dogSizeDistance(expected: string, foodSize: string) {
  const order = ["mini", "small", "medium", "large", "giant"];
  const expectedIndex = order.indexOf(expected);
  const foodIndex = order.indexOf(foodSize);

  if (expectedIndex === -1 || foodIndex === -1) return 0;
  return Math.abs(expectedIndex - foodIndex);
}

function isHardDogSizeMismatch(
  pet: FoodV2RankingInput["pet"],
  expectedSize: string | null,
  declaredSize: string | null
) {
  if (!expectedSize || !declaredSize || declaredSize === "all") return false;

  const distance = dogSizeDistance(expectedSize, declaredSize);
  if (distance >= 2) return true;

  if (
    pet.species === "dog" &&
    hasNumber(pet.weight) &&
    pet.weight >= 35 &&
    expectedSize === "large" &&
    declaredSize === "medium"
  ) {
    return true;
  }

  if (
    pet.species === "dog" &&
    hasNumber(pet.weight) &&
    pet.weight >= 8 &&
    expectedSize === "small" &&
    declaredSize === "mini"
  ) {
    return true;
  }

  if (
    pet.species === "dog" &&
    expectedSize === "giant" &&
    ["small", "medium"].includes(declaredSize)
  ) {
    return true;
  }

  return false;
}

function inferDogSizeFromFoodText(food: FoodProductV2) {
  const text = textFor(food);

  if (hasAny(text, ["giant breed", "giant dog", "giant adult"])) return "giant";
  if (hasAny(text, ["large breed", "large dog", "maxi", "large adult"]) || hasWord(text, "large")) {
    return "large";
  }
  if (hasAny(text, ["medium breed", "medium dog", "medium adult"]) || hasWord(text, "medium")) {
    return "medium";
  }
  if (hasAny(text, ["xsmall", "x-small", "extra small", "x small", "mini breed", "mini dog", "mini adult"]) || hasWord(text, "mini")) {
    return "mini";
  }
  if (hasAny(text, ["small breed", "small dog", "small adult"]) || hasWord(text, "small")) return "small";
  const breedSize = breedSizeFromText(text);
  if (breedSize) return breedSize;
  if (hasAny(text, ALL_BREED_TERMS)) return "all";

  return null;
}

function addSignal(
  signals: FoodV2RankingSignal[],
  type: FoodV2RankingSignal["type"],
  code: string,
  points: number,
  message: string
) {
  signals.push({ type, code, points, message });
}

function hasAny(text: string, terms: readonly string[]) {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function hasContradictingSpeciesLabel(food: FoodProductV2, petSpecies: "dog" | "cat") {
  const text = normalizeText([food.brand, food.display_name, food.formula_name].join(" "));

  if (petSpecies === "dog") {
    return hasAny(text, ["feline", "cat", "γάτα", "γατα", "gato"]);
  }

  return hasAny(text, ["canine", "dog", "σκύλος", "σκυλος", "skylos"]);
}

function hasWord(text: string, word: string) {
  return text.split(" ").includes(normalizeText(word));
}

function hasTherapeuticPositioning(foodText: string) {
  return hasAny(foodText, THERAPEUTIC_TERMS);
}

function hasActivePositioning(foodText: string) {
  return hasAny(foodText, ["active", "performance", "energy", "sport", "working"]);
}

function hasWeightControlPositioning(foodText: string) {
  return hasAny(foodText, ["light", "weight", "satiety", "obesity", "sterilised", "sterilized", "neutered"]);
}

function isMildlyRicherSterilisedFit(
  foodText: string,
  kcal: number | null | undefined,
  nutrients: FoodNutrientsV2
) {
  const fat = nutrients.fat_percent;

  return (
    hasWeightControlPositioning(foodText) &&
    (!hasNumber(kcal) || kcal <= 355) &&
    (!hasNumber(fat) || fat <= 12)
  );
}

function hasSensitiveDigestivePositioning(foodText: string) {
  return hasAny(foodText, [
    "gastro",
    "gastrointestinal",
    "digestive",
    "digestion",
    "sensitive digestion",
    "sensitive stomach",
    "intestinal",
    "hypoallergenic",
    "hydrolysed",
    "hydrolyzed",
  ]);
}

function hasRenalPositioning(foodText: string) {
  return hasAny(foodText, ["renal", "kidney"]);
}

function hasUrinaryPositioning(foodText: string) {
  return hasAny(foodText, ["urinary", "struvite", "oxalate"]);
}

type UrinarySubtype = "struvite" | "oxalate";

function urinarySubtypeFromText(value: unknown): UrinarySubtype | null {
  const text = normalizeText(value);

  if (hasAny(text, ["struvite", "struvit", "στρουβι"])) return "struvite";
  if (hasAny(text, ["oxalate", "oxalat", "οξαλ"])) return "oxalate";

  return null;
}

function urinarySubtypeFromPet(pet: FoodV2RankingInput["pet"]) {
  return urinarySubtypeFromText((pet.healthIssues ?? []).join(" "));
}

function hasRenalContext(pet: FoodV2RankingInput["pet"]) {
  return hasAny(normalizeText((pet.healthIssues ?? []).join(" ")), [
    "renal",
    "kidney",
    "ckd",
    "creatinine",
    "urea",
    "\u03bd\u03b5\u03c6\u03c1",
    "\u03bd\u03b5\u03c6\u03c1\u03b9\u03ba",
    "\u03bf\u03c5\u03c1\u03b9\u03b1",
    "\u03ba\u03c1\u03b5\u03b1\u03c4\u03b9\u03bd",
  ]);
}

function hasUrinaryContext(pet: FoodV2RankingInput["pet"]) {
  return hasAny(normalizeText((pet.healthIssues ?? []).join(" ")), [
    "urinary",
    "struvite",
    "oxalate",
    "crystal",
    "stone",
    "urolith",
    "\u03bf\u03c5\u03c1\u03bf\u03bb\u03bf\u03b3",
    "\u03bf\u03c5\u03c1\u03b9\u03ba",
    "\u03bf\u03c5\u03c1\u03b1",
    "\u03ba\u03c1\u03c5\u03c3\u03c4\u03b1\u03bb",
    "\u03bf\u03be\u03b1\u03bb",
    "ΞΏΟ…ΟΞΏΞ»ΞΏΞ³",
    "ΞΊΟΟ…ΟƒΟ„Ξ±Ξ»Ξ»",
    "ΞΏΞΎΞ±Ξ»",
  ]);
}

function hasPancreatitisContext(values: string[] | undefined) {
  return hasAny(normalizeText((values ?? []).join(" ")), [
    "pancreatitis",
    "pancreatic",
    "pancreas",
    "pagkreat",
    "pagkreatit",
    "παγκρεατ",
  ]);
}

function hasSeniorPositioning(food: FoodProductV2, foodText: string) {
  return (
    food.life_stage === "senior" ||
    hasAny(foodText, ["senior", "mature", "ageing", "aging", "7+", "8+", "10+", "12+"])
  );
}

function mobilityPositioningTextFor(food: FoodProductV2) {
  return normalizeText(
    [
      food.brand,
      food.formula_name,
      food.display_name,
      food.life_stage,
      food.breed_target,
      ...(food.medical_tags ?? []),
      ...(food.commercial_tags ?? []),
    ].join(" ")
  );
}

function hasMobilityPositioning(food: FoodProductV2) {
  return hasAny(mobilityPositioningTextFor(food), [
    "joint",
    "mobility",
    "arthritis",
    "arthro",
    "c2p",
  ]);
}

type SpecialCareContext =
  | "hepatic"
  | "diabetic"
  | "cardiac"
  | "mobility"
  | "recovery";

const SPECIAL_CARE_CONTEXT_TERMS: Record<SpecialCareContext, readonly string[]> = {
  hepatic: [
    "hepatic",
    "liver",
    "cholangitis",
    "\u03b7\u03c0\u03b1\u03c4",
    "\u03c7\u03bf\u03bb\u03bf",
    "\u03b7\u03c0\u03b1\u03c1",
  ],
  diabetic: ["diabetic", "diabetes", "\u03b4\u03b9\u03b1\u03b2\u03b7\u03c4"],
  cardiac: ["cardiac", "heart", "cardio", "\u03ba\u03b1\u03c1\u03b4\u03b9"],
  mobility: [
    "arthritis",
    "arthrosis",
    "joint",
    "mobility",
    "hip dysplasia",
    "elbow dysplasia",
    "cruciate",
    "\u03b1\u03c1\u03b8\u03c1",
    "\u03b4\u03c5\u03c3\u03c0\u03bb\u03b1\u03c3",
    "\u03c7\u03b9\u03b1\u03c3\u03c4",
  ],
  recovery: [
    "recovery",
    "convalescence",
    "surgery",
    "hospital",
    "hospitalization",
    "muscle loss",
    "\u03b1\u03bd\u03b1\u03c1\u03c1\u03c9\u03c3",
    "\u03b5\u03c0\u03b5\u03bc\u03b2\u03b1\u03c3",
    "\u03bd\u03bf\u03c3\u03b7\u03bb",
    "\u03bc\u03c5\u03b9\u03ba",
  ],
};

const SPECIAL_CARE_FOOD_TERMS: Record<SpecialCareContext, readonly string[]> = {
  hepatic: ["hepatic", "liver"],
  diabetic: ["diabetic", "diabetes", "glucose", "glycemic", "obesity"],
  cardiac: ["cardiac", "heart", "cardio"],
  mobility: ["joint", "mobility", "arthritis", "arthro", "c2p"],
  recovery: [
    "recovery",
    "convalescence",
    "gastrointestinal",
    "puppy",
    "junior",
    "active",
    "performance",
    "high energy",
  ],
};

function specialCareContextsFromPet(pet: FoodV2RankingInput["pet"]) {
  const text = normalizeText((pet.healthIssues ?? []).join(" "));
  return (Object.keys(SPECIAL_CARE_CONTEXT_TERMS) as SpecialCareContext[]).filter(
    (context) => hasAny(text, SPECIAL_CARE_CONTEXT_TERMS[context])
  );
}

function hasSpecialCareFoodPositioning(
  food: FoodProductV2,
  nutrients: FoodNutrientsV2,
  foodText: string,
  context: SpecialCareContext
) {
  if (hasAny(foodText, SPECIAL_CARE_FOOD_TERMS[context])) return true;

  if (
    context === "mobility" &&
    hasCustomerVisibleSeniorPositioning(food) &&
    (hasNumber(nutrients.epa_percent) ||
      hasNumber(nutrients.dha_percent) ||
      hasNumber(nutrients.epa_dha_percent) ||
      hasNumber(nutrients.glucosamine_mgkg) ||
      hasNumber(nutrients.chondroitin_mgkg))
  ) {
    return true;
  }

  if (
    context === "recovery" &&
    hasCustomerVisibleSeniorPositioning(food) &&
    (!hasNumber(nutrients.protein_percent) || nutrients.protein_percent >= 24)
  ) {
    return true;
  }

  return false;
}

function specialCareLabel(context: SpecialCareContext) {
  return context.replace("_", " ");
}

function titleTextFor(food: FoodProductV2) {
  return normalizeText([food.brand, food.formula_name, food.display_name].join(" "));
}

function visibleDogSizeFromTitle(food: FoodProductV2) {
  const text = titleTextFor(food);

  if (hasAny(text, ["giant breed", "giant dog", "giant adult"])) return "giant";
  if (hasAny(text, ["large breed", "large dog", "maxi", "large adult"]) || hasWord(text, "large")) {
    return "large";
  }
  if (hasAny(text, ["medium breed", "medium dog", "medium adult"]) || hasWord(text, "medium")) {
    return "medium";
  }
  if (hasAny(text, ["xsmall", "x-small", "extra small", "x small", "mini breed", "mini dog", "mini adult"]) || hasWord(text, "mini")) {
    return "mini";
  }
  if (hasAny(text, ["small breed", "small dog", "small adult"]) || hasWord(text, "small")) return "small";

  return null;
}

function isCustomerVisibleHardDogSizeMismatch(
  pet: FoodV2RankingInput["pet"],
  expectedSize: string | null,
  visibleTitleSize: string | null
) {
  if (!visibleTitleSize) return false;

  if (
    pet.species === "dog" &&
    hasNumber(pet.weight) &&
    expectedSize === "small" &&
    visibleTitleSize === "mini"
  ) {
    return pet.weight >= 9.5;
  }

  return isHardDogSizeMismatch(pet, expectedSize, visibleTitleSize);
}

function hasExplicitSeniorTitle(food: FoodProductV2) {
  return hasAny(titleTextFor(food), [
    "senior",
    "mature",
    "ageing",
    "aging",
    "7+",
    "8+",
    "10+",
    "12+",
    "joint",
    "mobility",
  ]);
}

function hasAdultOnlySeniorTitleConflict(food: FoodProductV2) {
  const titleText = titleTextFor(food);
  return hasWord(titleText, "adult") && !hasExplicitSeniorTitle(food);
}

function hasCustomerVisibleSeniorPositioning(food: FoodProductV2) {
  return hasExplicitSeniorTitle(food);
}

function therapeuticPositioningFitsGoal(
  foodText: string,
  goal: FoodV2RecommendationGoal,
  healthIssues: string[]
) {
  const allowedTerms = [
    ...(GOAL_THERAPEUTIC_TERMS[goal] ?? []),
    ...healthIssues,
  ];

  return allowedTerms.length > 0 && hasAny(foodText, allowedTerms);
}

function lifeStageMatches(food: FoodProductV2, stage: string) {
  if (food.life_stage === "all_life_stages") return true;
  if (stage === "puppy") return food.life_stage === "puppy";
  if (stage === "kitten") return food.life_stage === "kitten";
  return food.life_stage === stage;
}

function scoreQuality(food: FoodProductV2, nutrients: FoodNutrientsV2) {
  let score = 0;
  const signals: FoodV2RankingSignal[] = [];
  const coreFields = [
    food.kcal_per_100g,
    nutrients.protein_percent,
    nutrients.fat_percent,
    nutrients.fiber_percent,
  ];
  const mineralFields = [
    nutrients.calcium_percent,
    nutrients.phosphorus_percent,
    nutrients.sodium_percent,
    nutrients.magnesium_percent,
  ];

  score += coreFields.filter(hasNumber).length * 7;
  score += mineralFields.filter(hasNumber).length * 4;

  if (food.ingredients.length >= 5) {
    score += 14;
    addSignal(signals, "boost", "ingredients_available", 14, "Ingredient data is available.");
  } else {
    addSignal(signals, "caution", "ingredients_limited", -8, "Ingredient data is limited.");
  }

  if (food.data_quality_status === "verified") {
    score += 18;
    addSignal(signals, "boost", "verified_row", 18, "Uses verified Food V2 data.");
  } else if (food.data_quality_status === "needs_review") {
    score += 8;
    addSignal(signals, "caution", "needs_review", -6, "Data is usable but still needs review.");
  }

  if (food.source_priority === "official") {
    score += 14;
    addSignal(signals, "boost", "official_source", 14, "Official source has priority.");
  } else if (food.source_priority === "retailer") {
    score += 8;
    addSignal(signals, "caution", "retailer_source", -3, "Retailer source should be worded cautiously.");
  } else if (food.source_priority === "manual_photo") {
    score += 10;
    addSignal(signals, "boost", "label_photo_source", 10, "Label/photo source supports the row.");
  }

  if (hasNumber(nutrients.epa_percent) || hasNumber(nutrients.dha_percent)) {
    score += 5;
    addSignal(signals, "boost", "epa_dha_available", 5, "EPA/DHA data improves nutrition reasoning.");
  } else if (hasNumber(nutrients.epa_dha_percent)) {
    score += 4;
    addSignal(signals, "boost", "combined_epa_dha_available", 4, "Combined EPA/DHA data is available.");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    signals,
  };
}

function scoreFit(input: FoodV2RankingInput) {
  const { food, nutrients, pet, goal = "general" } = input;
  const signals: FoodV2RankingSignal[] = [];
  const haystack = textFor(food);
  const stage = petLifeStage(pet);
  let score = 0;
  const applyRuleSignals = (ruleSignals: FoodV2RankingSignal[]) => {
    ruleSignals.forEach((signal) => {
      if (signal.type !== "exclude") score += signal.points;
      addSignal(signals, signal.type, signal.code, signal.points, signal.message);
    });
  };
  const applyLegacyRuleLabels = (
    labels: { boosts: string[]; cautions: string[] },
    mapping: Record<string, FoodV2RankingSignal>
  ) => {
    labels.boosts.forEach((code) => {
      const signal = mapping[code];
      if (!signal) return;
      score += signal.points;
      addSignal(signals, signal.type, signal.code, signal.points, signal.message);
    });
    labels.cautions.forEach((code) => {
      const signal = mapping[code];
      if (!signal) return;
      if (signal.type !== "exclude") score += signal.points;
      addSignal(signals, signal.type, signal.code, signal.points, signal.message);
    });
  };

  if (food.species === pet.species) {
    score += 35;
    addSignal(signals, "boost", "species_match", 35, "Matches the pet species.");
  } else {
    addSignal(signals, "exclude", "species_mismatch", -100, "Different species.");
  }

  if (hasContradictingSpeciesLabel(food, pet.species)) {
    addSignal(
      signals,
      "exclude",
      "contradicting_species_label",
      -100,
      "Excluded because the product title appears to target a different species."
    );
  }

  if (lifeStageMatches(food, stage)) {
    score += 18;
    addSignal(signals, "boost", "life_stage_match", 18, `Matches ${stage} life stage.`);
  } else {
    addSignal(signals, "caution", "life_stage_mismatch", -15, `Not an exact ${stage} life-stage match.`);
    if (["adult", "senior"].includes(stage) && ["puppy", "kitten"].includes(food.life_stage)) {
      addSignal(
        signals,
        "exclude",
        "growth_food_for_adult_pet",
        -100,
        `Excluded because ${food.life_stage} food does not fit a ${stage} pet.`
      );
    }
  }

  const specialCareContexts = specialCareContextsFromPet(pet);
  for (const context of specialCareContexts) {
    const hasPositioning = hasSpecialCareFoodPositioning(
      food,
      nutrients,
      haystack,
      context
    );

    if (hasPositioning) {
      score += 24;
      addSignal(
        signals,
        "boost",
        `${context}_special_care_positioning`,
        24,
        `Positioned for ${specialCareLabel(context)} support.`
      );
    } else {
      addSignal(
        signals,
        "exclude",
        `${context}_special_care_mismatch`,
        -100,
        `Excluded because ${specialCareLabel(context)} cases should start from a visibly matching veterinary or special-care formula.`
      );
    }
  }

  if (pet.species === "dog") {
    const expectedSize = expectedDogSize(pet);
    const declaredSize =
      food.dog_size && food.dog_size !== "unknown" && food.dog_size !== "all"
        ? food.dog_size
        : inferDogSizeFromFoodText(food);
    const visibleTitleSize = visibleDogSizeFromTitle(food);
    const sizeTerms =
      DOG_SIZE_TERMS[declaredSize as keyof typeof DOG_SIZE_TERMS] ?? [];
    const sizeDistance =
      expectedSize && declaredSize ? dogSizeDistance(expectedSize, declaredSize) : 0;
    const sizeMatches =
      declaredSize === "all" ||
      !declaredSize ||
      (isLargeBreedDog(pet) && ["large", "giant"].includes(declaredSize)) ||
      hasAny(normalizeText(pet.breed), [...sizeTerms, declaredSize]) ||
      declaredSize === expectedSize;

    if (sizeMatches) {
      if (declaredSize || food.dog_size === "all") {
        score += 7;
        addSignal(signals, "boost", "size_match", 7, "Matches size or breed-size positioning.");
      }
    } else if (isHardDogSizeMismatch(pet, expectedSize, declaredSize)) {
      score -= 35;
      addSignal(
        signals,
        "exclude",
        "dog_size_mismatch",
        -100,
        `Excluded because ${declaredSize} food does not fit a ${expectedSize} dog.`
      );
    } else if (expectedSize && sizeDistance === 1) {
      score -= 12;
      addSignal(
        signals,
        "caution",
        "adjacent_dog_size_mismatch",
        -12,
        `Breed-size positioning is ${declaredSize}, while this dog looks ${expectedSize}.`
      );
    }

    if (
      visibleTitleSize &&
      visibleTitleSize !== declaredSize &&
      isCustomerVisibleHardDogSizeMismatch(pet, expectedSize, visibleTitleSize)
    ) {
      score -= 35;
      addSignal(
        signals,
        "exclude",
        "customer_visible_dog_size_mismatch",
        -100,
        `Excluded because the visible product title targets ${visibleTitleSize} dogs, while this dog looks ${expectedSize}.`
      );
    } else if (
      goal === "sterilised" &&
      expectedSize &&
      visibleTitleSize &&
      visibleTitleSize !== expectedSize &&
      dogSizeDistance(expectedSize, visibleTitleSize) === 1
    ) {
      score -= 10;
      addSignal(
        signals,
        "caution",
        "customer_visible_adjacent_size_mismatch",
        -10,
        `Visible product title targets ${visibleTitleSize} dogs, while this dog looks ${expectedSize}.`
      );
    }
  }

  if (
    hasTherapeuticPositioning(haystack) &&
    !therapeuticPositioningFitsGoal(haystack, goal, pet.healthIssues ?? []) &&
    !(hasRenalContext(pet) && hasRenalPositioning(haystack)) &&
    !(hasUrinaryContext(pet) && hasUrinaryPositioning(haystack)) &&
    !specialCareContexts.some((context) =>
      hasSpecialCareFoodPositioning(food, nutrients, haystack, context)
    )
  ) {
    addSignal(
      signals,
      "exclude",
      "therapeutic_food_without_matching_condition",
      -100,
      "Excluded because veterinary/therapeutic positioning does not match the pet's stated goal or health context."
    );
  }

  applyRuleSignals(
    evaluateFeedingFitRules({
      food,
      nutrients,
      pet,
      goal,
      positioning: {
        active: hasActivePositioning(haystack),
        weightControl: hasWeightControlPositioning(haystack),
      },
    })
  );

  applyRuleSignals(
    evaluateObesityFitRules({
      food,
      nutrients,
      pet,
      goal:
        goal === "weight_control" || goal === "sterilised" || goal === "senior"
          ? goal
          : "general",
      positioning: {
        active: hasActivePositioning(haystack),
        weightControl: hasWeightControlPositioning(haystack),
      },
    })
  );

  applyRuleSignals(
    evaluateIngredientFitRules({
      food,
      goal:
        goal === "allergy" || goal === "sensitive_digestion"
          ? goal
          : "general",
      allergies: pet.allergies,
      excludedIngredients: pet.excludedIngredients,
      preferredProteins: pet.preferredProteins,
    })
  );

  if (goal === "sensitive_digestion") {
    const hasDigestiveFit = hasSensitiveDigestivePositioning(haystack);

    if (hasDigestiveFit) {
      score += 24;
      addSignal(
        signals,
        "boost",
        "sensitive_digestive_positioning",
        24,
        "Positioned for sensitive digestion."
      );
    } else {
      addSignal(
        signals,
        "caution",
        "sensitive_goal_without_digestive_positioning",
        -22,
        "Sensitive digestion cases should prefer digestive-positioned foods."
      );
    }

    if (hasWeightControlPositioning(haystack) && !hasDigestiveFit) {
      addSignal(
        signals,
        "caution",
        "weight_positioning_not_digestive_fit",
        -18,
        "Weight-control positioning does not replace digestive support."
      );
    }

    applyLegacyRuleLabels(
      evaluateGiRules(
        {
          medical_tags: food.medical_tags,
          commercial_tags: food.commercial_tags,
          fiber_sources: food.fiber_sources,
          primary_animal_proteins: food.primary_animal_proteins,
        },
        nutrients
      ),
      {
        digestive_support_positioning: {
          type: "boost",
          code: "digestive_support_positioning",
          points: 10,
          message: "Medical or commercial tags support digestive positioning.",
        },
        fiber_context_available: {
          type: "boost",
          code: "fiber_context_available",
          points: 4,
          message: "Fiber context is available for digestive review.",
        },
        allergy_or_hydrolysed_context: {
          type: "boost",
          code: "allergy_or_hydrolysed_context",
          points: 4,
          message: "Hydrolysed or allergy-context protein can support GI-sensitive cases.",
        },
        missing_fiber_context: {
          type: "caution",
          code: "missing_fiber_context",
          points: -6,
          message: "Digestive reasoning is weaker without fiber context.",
        },
      }
    );
  }

  if (goal === "urinary" || hasUrinaryContext(pet)) {
    const hasUrinary = hasUrinaryPositioning(haystack);
    const hasRenalOnly = hasRenalPositioning(haystack) && !hasUrinary;
    const petUrinarySubtype = urinarySubtypeFromPet(pet);
    const visibleFoodUrinarySubtype = urinarySubtypeFromText(titleTextFor(food));
    const foodUrinarySubtype =
      visibleFoodUrinarySubtype ?? urinarySubtypeFromText(haystack);

    if (hasUrinary) {
      score += 20;
      addSignal(signals, "boost", "urinary_positioning", 20, "Positioned for urinary support.");
      if (petUrinarySubtype && foodUrinarySubtype === petUrinarySubtype) {
        score += 10;
        addSignal(
          signals,
          "boost",
          `urinary_${petUrinarySubtype}_match`,
          10,
          `Matches the stated ${petUrinarySubtype} urinary context.`
        );
      }
    } else if (goal === "urinary") {
      addSignal(
        signals,
        "exclude",
        "urinary_goal_without_urinary_positioning",
        -100,
        "Excluded because urinary cases need urinary-positioned foods before a confident shortlist."
      );
    }
    if (goal === "urinary" && hasRenalOnly) {
      addSignal(
        signals,
        "exclude",
        "urinary_renal_mismatch",
        -100,
        "Excluded because renal positioning does not replace urinary/stone-specific diet support."
      );
    }
    if (
      goal === "urinary" &&
      petUrinarySubtype &&
      foodUrinarySubtype &&
      foodUrinarySubtype !== petUrinarySubtype
    ) {
      addSignal(
        signals,
        "exclude",
        "urinary_subtype_mismatch",
        -100,
        `Excluded because a ${foodUrinarySubtype} urinary formula does not replace a ${petUrinarySubtype}-specific shortlist.`
      );
    }
    if (!hasNumber(nutrients.magnesium_percent) || !hasNumber(nutrients.phosphorus_percent)) {
      addSignal(signals, "caution", "missing_urinary_minerals", -8, "Urinary reasoning is weaker without magnesium and phosphorus.");
    }
    applyLegacyRuleLabels(
      evaluateUrinaryRules(
        {
          species: food.species,
          medical_tags: food.medical_tags,
          source_priority: food.source_priority,
        },
        nutrients
      ),
      {
        urinary_formula_positioning: {
          type: "boost",
          code: "urinary_formula_positioning",
          points: 8,
          message: "Medical tags confirm urinary formula positioning.",
        },
        missing_magnesium_for_urinary_review: {
          type: "caution",
          code: "missing_magnesium_for_urinary_review",
          points: -4,
          message: "Magnesium data is missing for urinary review.",
        },
        missing_phosphorus_for_urinary_review: {
          type: "caution",
          code: "missing_phosphorus_for_urinary_review",
          points: -4,
          message: "Phosphorus data is missing for urinary review.",
        },
        urinary_claim_needs_strong_source: {
          type: "caution",
          code: "urinary_claim_needs_strong_source",
          points: -4,
          message: "Urinary claims are stronger with official source data.",
        },
      }
    );
  }

  if (goal === "renal" || hasRenalContext(pet)) {
    const hasRenal = hasRenalPositioning(haystack);
    const hasUrinaryOnlyPositioning =
      hasUrinaryPositioning(haystack) && !hasRenal;

    if (hasRenal) {
      score += 24;
      addSignal(signals, "boost", "renal_positioning", 24, "Positioned for renal support.");
    } else {
      addSignal(
        signals,
        goal === "renal" ? "exclude" : "caution",
        "renal_needs_vet_food",
        goal === "renal" ? -100 : -20,
        "Renal cases need veterinarian-directed renal diet selection."
      );
    }
    if (hasUrinaryOnlyPositioning) {
      addSignal(
        signals,
        "exclude",
        "renal_urinary_mismatch",
        -100,
        "Excluded because urinary/oxalate positioning does not replace renal diet support."
      );
    }
    if (!hasNumber(nutrients.phosphorus_percent)) {
      addSignal(signals, "caution", "missing_phosphorus_renal", -12, "Renal recommendations need phosphorus data.");
    }
    applyLegacyRuleLabels(
      evaluateRenalRules(
        {
          medical_tags: food.medical_tags,
          source_priority: food.source_priority,
        },
        nutrients
      ),
      {
        renal_formula_positioning: {
          type: "boost",
          code: "renal_formula_positioning",
          points: 10,
          message: "Medical tags confirm renal formula positioning.",
        },
        epa_dha_renal_support_signal: {
          type: "boost",
          code: "epa_dha_renal_support_signal",
          points: 4,
          message: "EPA/DHA data supports renal fatty-acid context.",
        },
        missing_phosphorus_for_renal_review: {
          type: "caution",
          code: "missing_phosphorus_for_renal_review",
          points: -8,
          message: "Phosphorus data is missing for renal review.",
        },
        high_protein_not_renal_default: {
          type: "caution",
          code: "high_protein_not_renal_default",
          points: -10,
          message: "High protein is not a default renal-diet advantage without vet context.",
        },
        renal_claim_needs_strong_source: {
          type: "caution",
          code: "renal_claim_needs_strong_source",
          points: -6,
          message: "Renal claims are stronger with official source data.",
        },
      }
    );
  }

  if (hasPancreatitisContext(pet.healthIssues)) {
    const fat = nutrients.fat_percent;
    const lowFatPositioning = hasAny(haystack, [
      "low fat",
      "gastro low fat",
      "pancreatic",
      "pancreatitis",
      "digestive low fat",
    ]);

    addSignal(
      signals,
      "caution",
      "pancreatitis_requires_vet",
      -10,
      "Pancreatitis history needs veterinarian-directed diet selection."
    );

    if (!hasNumber(fat)) {
      addSignal(
        signals,
        "caution",
        "pancreatitis_missing_fat",
        -18,
        "Pancreatitis context needs fat data before confident shortlisting."
      );
    } else if (fat > 12 && !lowFatPositioning) {
      addSignal(
        signals,
        "exclude",
        "pancreatitis_high_fat_mismatch",
        -100,
        "Excluded because pancreatitis history should not start from higher-fat foods."
      );
    } else if (fat <= 10 || lowFatPositioning) {
      score += 14;
      addSignal(
        signals,
        "boost",
        "pancreatitis_low_fat_fit",
        14,
        "Lower fat profile is more appropriate for pancreatitis-sensitive review."
      );
    }
  }

  if (goal === "growth" || stage === "puppy" || stage === "kitten") {
    applyRuleSignals(
      evaluateGrowthFitRules({
        food,
        nutrients,
        petStage: stage,
        lifeStageMatches: lifeStageMatches(food, stage),
        isLargeBreedDog: isLargeBreedDog(pet),
        positioning: {
          largeBreedGrowth: hasAny(haystack, [
            "large breed",
            "maxi",
            "giant",
            "large puppy",
            "puppy large",
          ]),
          genericGrowth: hasAny(haystack, ["puppy", "junior", "kitten"]),
        },
      })
    );
  }

  if (goal === "senior" || stage === "senior") {
    if (goal === "senior" && hasCustomerVisibleSeniorPositioning(food)) {
      score += 18;
      addSignal(
        signals,
        "boost",
        "customer_visible_senior_positioning",
        18,
        "Clear senior positioning is visible to the customer."
      );
    } else if (goal === "senior") {
      score -= 100;
      addSignal(
        signals,
        "exclude",
        "senior_positioning_not_customer_visible",
        -100,
        "Senior shortlists should prefer foods whose senior positioning is visible to the customer."
      );
    } else if (hasCustomerVisibleSeniorPositioning(food)) {
      score += 8;
      addSignal(
        signals,
        "boost",
        "customer_visible_senior_positioning",
        8,
        "Clear senior positioning is visible to the customer."
      );
    }

    applyRuleSignals(
      evaluateSeniorFitRules({
        food,
        nutrients,
        pet,
        stage,
        goal:
          goal === "weight_control" || goal === "sterilised" || goal === "senior"
            ? goal
            : "general",
        positioning: {
          active: hasActivePositioning(haystack),
          mobility: hasMobilityPositioning(food),
          senior: hasSeniorPositioning(food, haystack),
          weightControl: hasWeightControlPositioning(haystack),
        },
      })
    );

    if (stage === "senior" && hasAdultOnlySeniorTitleConflict(food)) {
      score -= 42;
      addSignal(
        signals,
        "caution",
        "adult_title_for_senior_shortlist",
        -42,
        "Adult-labelled food should not outrank clear senior options for a senior pet."
      );
    }
  }

  let adjustedScore = score;
  if (goal === "sterilised") {
    const hasWeightPositioning = hasWeightControlPositioning(haystack);
    const mildlyRicherSterilisedFit = isMildlyRicherSterilisedFit(
      haystack,
      food.kcal_per_100g,
      nutrients
    );

    if (!hasWeightPositioning) {
      adjustedScore -= 18;
      addSignal(
        signals,
        "caution",
        "sterilised_goal_without_visible_positioning",
        -18,
        "Sterilised pets should start from visibly sterilised, light or weight-aware foods when good options exist."
      );
    }
    if (!lifeStageMatches(food, stage)) {
      adjustedScore -= 12;
      addSignal(
        signals,
        "caution",
        "sterilised_goal_without_exact_life_stage",
        -12,
        "Sterilised shortlists should prefer exact life-stage matches over generic lean foods."
      );
    }
    if (hasNumber(food.kcal_per_100g) && food.kcal_per_100g > 340) {
      adjustedScore -= mildlyRicherSterilisedFit ? 15 : 30;
    }
    if (hasNumber(nutrients.fat_percent) && nutrients.fat_percent > 10) {
      adjustedScore -= mildlyRicherSterilisedFit ? 10 : 20;
    }
    if (
      hasNumber(food.kcal_per_100g) &&
      food.kcal_per_100g >= 365 &&
      hasNumber(nutrients.fat_percent) &&
      nutrients.fat_percent >= 13.5
    ) {
      addSignal(
        signals,
        "exclude",
        "sterilised_rich_formula_mismatch",
        -100,
        "Excluded because calories and fat are too rich for a first sterilised-pet shortlist."
      );
    }
  }
  if (goal === "sensitive_digestion" && !hasSensitiveDigestivePositioning(haystack)) {
    adjustedScore -= hasWeightControlPositioning(haystack) ? 50 : 30;
  }

  return {
    score: Math.max(0, Math.min(100, adjustedScore)),
    signals,
  };
}

function scoreValue(food: FoodProductV2, fitScore: number, qualityScore: number) {
  const haystack = textFor(food);
  let score = Math.round(fitScore * 0.55 + qualityScore * 0.35);

  if (hasAny(haystack, VALUE_MARKERS)) score += 10;
  if (hasAny(haystack, VALUE_FRIENDLY_MARKERS)) score += 16;
  if (hasAny(haystack, PREMIUM_MARKERS)) score -= 6;
  if (hasAny(haystack, PREMIUM_BRAND_MARKERS)) score -= 16;
  if (hasAny(haystack, VALUE_PENALTY_MARKERS)) score -= 14;
  if (food.source_priority === "retailer") score += 2;
  if (food.source_priority === "official") score += 2;
  if (food.data_quality_status === "verified") score += 5;
  if (food.data_quality_status === "needs_review") score -= 4;
  if (food.life_stage === "adult" && !hasAny(haystack, ["senior", "puppy", "junior", "kitten"])) {
    score += 4;
  }

  return Math.max(0, Math.min(100, score));
}

function confidenceFor(result: {
  fitScore: number;
  qualityScore: number;
  signals: FoodV2RankingSignal[];
}) {
  const excludes = result.signals.filter((signal) => signal.type === "exclude").length;
  const cautions = result.signals.filter((signal) => signal.type === "caution").length;

  if (excludes > 0 || result.qualityScore < 35) return "low";
  if (cautions >= 3 || result.qualityScore < 60) return "medium";
  return "high";
}

function valueTier(
  food: FoodProductV2,
  valueScore: number,
  fitScore: number,
  qualityScore: number
): FoodV2ValueTier {
  const haystack = textFor(food);

  if (fitScore < 58 || qualityScore < 42) {
    return "standard";
  }
  if (hasAny(haystack, VALUE_PENALTY_MARKERS)) {
    return "premium_candidate";
  }
  if (hasAny(haystack, PREMIUM_BRAND_MARKERS) && !hasAny(haystack, VALUE_FRIENDLY_MARKERS)) {
    return "premium_candidate";
  }
  if (hasAny(haystack, PREMIUM_MARKERS) && valueScore < 82) {
    return "premium_candidate";
  }
  if (valueScore >= 68 && hasAny(haystack, [...VALUE_MARKERS, ...VALUE_FRIENDLY_MARKERS])) {
    return "value_candidate";
  }
  return "standard";
}

function scenarioForGoal(goal: FoodV2RecommendationGoal | undefined): RecommendationScenario {
  if (goal === "growth") return "growth";
  if (goal === "sterilised") return "sterilised";
  if (goal === "weight_control") return "weight_control";
  if (goal === "sensitive_digestion") return "sensitive_digestion";
  if (goal === "allergy") return "allergy";
  if (goal === "urinary") return "urinary";
  if (goal === "renal") return "renal";
  if (goal === "senior") return "senior";
  return "general";
}

function weightedTotalScore(input: {
  goal?: FoodV2RecommendationGoal;
  fitScore: number;
  qualityScore: number;
  valueScore: number;
}) {
  if (input.goal === "value") {
    return Math.round(
      input.fitScore * 0.35 + input.qualityScore * 0.2 + input.valueScore * 0.45
    );
  }

  const weights = scoringWeightsForScenario(scenarioForGoal(input.goal));
  const fitWeight = weights.clinical_fit + weights.life_stage_size_fit;
  const qualityWeight = weights.nutrient_fit + weights.data_quality;
  const valueWeight = weights.feeding_method_flavor_fit + weights.owner_constraint_fit;
  const totalWeight = fitWeight + qualityWeight + valueWeight;

  if (totalWeight <= 0) return 0;

  return Math.round(
    (input.fitScore * fitWeight +
      input.qualityScore * qualityWeight +
      input.valueScore * valueWeight) /
      totalWeight
  );
}

export function rankFoodV2ForPet(input: FoodV2RankingInput): FoodV2RankingResult {
  const quality = scoreQuality(input.food, input.nutrients);
  const fit = scoreFit(input);
  const signals = [...quality.signals, ...fit.signals];
  const fitScore = fit.score;
  const qualityScore = quality.score;
  const valueScore = scoreValue(input.food, fitScore, qualityScore);
  const excludes = signals.some((signal) => signal.type === "exclude");
  const totalScore = excludes
    ? 0
    : weightedTotalScore({
        goal: input.goal,
        fitScore,
        qualityScore,
        valueScore,
      });
  const tier = valueTier(input.food, valueScore, fitScore, qualityScore);
  const confidence = confidenceFor({ fitScore, qualityScore, signals });

  return {
    formula_key: input.food.formula_key,
    display_name: input.food.display_name,
    brand: input.food.brand,
    total_score: Math.max(0, Math.min(100, totalScore)),
    fit_score: fitScore,
    quality_score: qualityScore,
    value_score: valueScore,
    confidence,
    bucket: excludes ? "hold" : tier === "value_candidate" ? "value" : "premium",
    value_tier: tier,
    reasons: signals
      .filter((signal) => signal.type === "boost")
      .sort((a, b) => b.points - a.points)
      .map((signal) => signal.message)
      .slice(0, 6),
    cautions: signals
      .filter((signal) => signal.type !== "boost")
      .sort((a, b) => a.points - b.points)
      .map((signal) => signal.message)
      .slice(0, 6),
    signals,
  };
}

export function splitFoodV2Recommendations(
  rankings: FoodV2RankingResult[],
  limitPerBucket = 3,
  goal?: FoodV2RecommendationGoal
) {
  const usable = rankings
    .filter((ranking) => ranking.bucket !== "hold")
    .sort((a, b) => b.total_score - a.total_score);
  const premium = usable.filter((ranking) => ranking.bucket === "premium");
  const value = usable
    .filter((ranking) => ranking.bucket === "value")
    .sort((a, b) => b.value_score - a.value_score || b.total_score - a.total_score);

  if (goal === "value") {
    return {
      premium: value.slice(0, limitPerBucket),
      value: premium.slice(0, limitPerBucket),
      hold: rankings
        .filter((ranking) => ranking.bucket === "hold")
        .sort((a, b) => b.quality_score - a.quality_score),
    };
  }

  return {
    premium: premium.slice(0, limitPerBucket),
    value: value.slice(0, limitPerBucket),
    hold: rankings
      .filter((ranking) => ranking.bucket === "hold")
      .sort((a, b) => b.quality_score - a.quality_score),
  };
}
