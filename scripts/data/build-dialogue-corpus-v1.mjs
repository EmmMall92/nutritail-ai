import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = "data/dialogue-corpus";

const files = [
  "dogs/puppies.json",
  "dogs/adults.json",
  "dogs/seniors.json",
  "dogs/sterilised.json",
  "dogs/intact.json",
  "dogs/medical.json",
  "dogs/emergency.json",
  "dogs/comparisons.json",
  "dogs/feeding.json",
  "cats/kittens.json",
  "cats/adults.json",
  "cats/seniors.json",
  "cats/sterilised.json",
  "cats/intact.json",
  "cats/urinary.json",
  "cats/renal.json",
  "cats/obesity.json",
  "cats/emergency.json",
  "cats/feeding.json",
  "mixed/multi_pet.json",
  "mixed/budget.json",
  "mixed/premium.json",
  "mixed/picky_eaters.json",
  "mixed/food_transition.json",
];

const buckets = Object.fromEntries(files.map((file) => [file, []]));

function baseExpectedFacts(overrides) {
  return {
    species: overrides.species ?? null,
    breed: overrides.breed ?? null,
    age_months: overrides.age_months ?? null,
    age_years: overrides.age_years ?? null,
    weight_kg: overrides.weight_kg ?? null,
    expected_adult_weight_kg: overrides.expected_adult_weight_kg ?? null,
    neutered: overrides.neutered ?? null,
    life_stage: overrides.life_stage ?? null,
    activity_level: overrides.activity_level ?? null,
    body_condition: overrides.body_condition ?? null,
    health_conditions: overrides.health_conditions ?? [],
    allergies: overrides.allergies ?? [],
    sensitivities: overrides.sensitivities ?? [],
    food_preferences: overrides.food_preferences ?? [],
    feeding_format_preference: overrides.feeding_format_preference ?? null,
    budget_preference: overrides.budget_preference ?? null,
    owner_goal: overrides.owner_goal ?? null,
    urgency_flags: overrides.urgency_flags ?? [],
  };
}

function makeDialogue(input) {
  const facts = baseExpectedFacts(input.facts);
  const category = input.category;
  const isEmergency = category === "emergency";
  const isComparison = input.customer_profile.intent === "comparison";
  const isFeeding = ["feeding_amount", "transition"].includes(input.customer_profile.intent);
  const mustNotDo = [
    "invent_foods",
    "invent_nutrients",
    "override_rules",
    "ask_unnecessary_questions",
  ];

  return {
    id: input.id,
    species: input.species,
    category,
    difficulty: input.difficulty,
    language: input.language,
    customer_profile: input.customer_profile,
    pet_facts_expected: facts,
    expected_behavior: {
      should_interrupt: isEmergency,
      should_ask_followup: input.should_ask_followup ?? !isEmergency,
      max_followup_questions_before_recommendation:
        input.max_followup_questions_before_recommendation ?? (isEmergency ? 0 : 5),
      must_not_do: mustNotDo,
      required_rules: input.required_rules ?? [],
      required_tags: input.required_tags ?? [],
    },
    conversation: input.conversation,
    evaluation: {
      fact_extraction_must_include: input.fact_extraction_must_include ?? [],
      safety_must_trigger: input.safety_must_trigger ?? [],
      retrieval_must_filter_by:
        input.retrieval_must_filter_by ??
        [
          facts.species ? "species" : null,
          facts.life_stage ? "life_stage" : null,
          facts.allergies.length ? "allergy_conflict" : null,
          facts.food_preferences.length ? "food_preferences" : null,
          isComparison ? "requested_brands_or_foods" : null,
          isFeeding ? "selected_food_or_kcal" : null,
        ].filter(Boolean),
      ranking_should_prefer: input.ranking_should_prefer ?? [],
      answer_quality_checks: [
        "Greek natural tone",
        "clear recommendation",
        "no back-office wording",
        "mentions uncertainty when data is missing",
      ],
    },
  };
}

function push(file, input) {
  buckets[file].push(makeDialogue(input));
}

function conv(lines, expected = "Ask only the next missing question. Use NutriTail rules and Food V2 facts before recommending.") {
  return [
    ...lines.map((content) => ({ role: "user", content })),
    { role: "assistant_expected_behavior", content: expected },
  ];
}

function profile(intent, tone = "polite", knowledge = "normal") {
  return { intent, knowledge_level: knowledge, tone };
}

const dogRecommendations = [
  ["DOG-REC-001", "dogs/adults.json", "Labrador", 5, 34, true, "normal", "chicken", "Μέχρι 80 ευρώ", "maintenance"],
  ["DOG-REC-002", "dogs/adults.json", "Beagle", 4, 14, true, "low", "salmon", "οικονομική επιλογή", "weight_loss"],
  ["DOG-REC-003", "dogs/adults.json", "Border Collie", 3, 19, false, "high", "lamb", "χωρίς όριο", "maintenance"],
  ["DOG-REC-004", "dogs/adults.json", "French Bulldog", 2, 11, true, "low", "duck", "μέχρι 60 ευρώ", "maintenance"],
  ["DOG-REC-005", "dogs/adults.json", "Maltese", 6, 4, true, "normal", "chicken", "κάτι value", "maintenance"],
  ["DOG-REC-006", "dogs/sterilised.json", "Cocker Spaniel", 7, 16, true, "low", "fish", "μέχρι 70 ευρώ", "weight_loss"],
  ["DOG-REC-007", "dogs/sterilised.json", "Pug", 5, 9, true, "low", "chicken", "οικονομικό", "weight_loss"],
  ["DOG-REC-008", "dogs/sterilised.json", "Shih Tzu", 8, 7, true, "normal", "turkey", "premium αν αξίζει", "maintenance"],
  ["DOG-REC-009", "dogs/sterilised.json", "Mixed breed", 4, 23, true, "normal", "beef", "μέχρι 75 ευρώ", "maintenance"],
  ["DOG-REC-010", "dogs/sterilised.json", "Dachshund", 6, 8, true, "low", "chicken", "μέχρι 50 ευρώ", "weight_loss"],
  ["DOG-REC-011", "dogs/intact.json", "Husky", 2, 25, false, "high", "fish", "χωρίς budget", "maintenance"],
  ["DOG-REC-012", "dogs/intact.json", "Doberman", 3, 35, false, "high", "chicken", "premium", "muscle_gain"],
  ["DOG-REC-013", "dogs/intact.json", "German Shepherd", 5, 36, false, "normal", "lamb", "μέχρι 85 ευρώ", "maintenance"],
  ["DOG-REC-014", "dogs/intact.json", "Jack Russell", 3, 7, false, "high", "salmon", "οικονομική", "maintenance"],
  ["DOG-REC-015", "dogs/intact.json", "Setter", 4, 24, false, "high", "duck", "μέχρι 90 ευρώ", "maintenance"],
  ["DOG-REC-016", "dogs/seniors.json", "Yorkshire Terrier", 11, 3.5, true, "low", "chicken", "μέχρι 55 ευρώ", "maintenance"],
  ["DOG-REC-017", "dogs/seniors.json", "Golden Retriever", 10, 31, true, "low", "salmon", "premium", "maintenance"],
  ["DOG-REC-018", "dogs/seniors.json", "Mini Poodle", 12, 6, true, "normal", "duck", "χωρίς όριο", "maintenance"],
  ["DOG-REC-019", "dogs/seniors.json", "Boxer", 9, 28, true, "normal", "fish", "μέχρι 80 ευρώ", "maintenance"],
  ["DOG-REC-020", "dogs/seniors.json", "Mixed breed", 13, 18, true, "low", "chicken", "οικονομικό", "maintenance"],
];

for (const [id, file, breed, age, weight, neutered, activity, flavor, budget, goal] of dogRecommendations) {
  push(file, {
    id,
    species: "dog",
    category: "recommendation",
    difficulty: "medium",
    language: id.endsWith("014") ? "greeklish" : "el",
    customer_profile: profile("recommendation", budget.includes("οικονομ") ? "price_sensitive" : "polite"),
    facts: {
      species: "dog",
      breed,
      age_years: age,
      weight_kg: weight,
      neutered,
      life_stage: age >= 8 ? "senior" : "adult",
      activity_level: activity,
      food_preferences: [flavor],
      budget_preference: budget,
      owner_goal: goal,
    },
    required_rules: ["species_filter", "life_stage_filter", neutered ? "sterilised_calorie_awareness" : "activity_energy_context"],
    required_tags: [activity, flavor],
    ranking_should_prefer: [flavor, goal],
    fact_extraction_must_include: ["species", "breed", "age_years", "weight_kg", "neutered", "activity_level", "food_preferences", "budget_preference"],
    conversation: conv([
      `Γεια σας, έχω ${breed} ${age} ετών, περίπου ${weight} κιλά.`,
      neutered ? "Είναι στειρωμένος." : "Δεν είναι στειρωμένος.",
      `Δραστηριότητα ${activity === "high" ? "υψηλή" : activity === "low" ? "χαμηλή" : "κανονική"}, προτιμά ${flavor}.`,
      `Budget: ${budget}. Θέλω πρόταση τροφής.`,
    ]),
  });
}

const catRecommendations = [
  ["CAT-REC-001", "cats/adults.json", "European Shorthair", 3, 4.4, true, "low", "chicken", "μέχρι 45 ευρώ", "maintenance"],
  ["CAT-REC-002", "cats/adults.json", "British Shorthair", 4, 6.2, true, "low", "salmon", "premium", "weight_loss"],
  ["CAT-REC-003", "cats/adults.json", "Siamese", 2, 3.8, false, "normal", "duck", "χωρίς όριο", "maintenance"],
  ["CAT-REC-004", "cats/adults.json", "Maine Coon", 3, 7.5, false, "normal", "chicken", "μέχρι 65 ευρώ", "maintenance"],
  ["CAT-REC-005", "cats/adults.json", "Ragdoll", 5, 5.4, true, "low", "turkey", "οικονομικό", "maintenance"],
  ["CAT-REC-006", "cats/sterilised.json", "Domestic cat", 2, 4.8, true, "low", "chicken", "μέχρι 40 ευρώ", "maintenance"],
  ["CAT-REC-007", "cats/urinary.json", "Persian", 6, 5.9, true, "low", "fish", "premium", "urinary_support"],
  ["CAT-REC-008", "cats/sterilised.json", "Bengal", 3, 5.2, true, "high", "salmon", "μέχρι 55 ευρώ", "maintenance"],
  ["CAT-REC-009", "cats/sterilised.json", "Scottish Fold", 4, 5.6, true, "low", "chicken", "value", "weight_loss"],
  ["CAT-REC-010", "cats/sterilised.json", "Domestic cat", 7, 4.1, true, "normal", "beef", "μέχρι 50 ευρώ", "maintenance"],
  ["CAT-REC-011", "cats/intact.json", "Aegean cat", 2, 3.7, false, "normal", "fish", "οικονομικό", "maintenance"],
  ["CAT-REC-012", "cats/intact.json", "Maine Coon", 1.5, 6.8, false, "high", "chicken", "χωρίς budget", "growth_support"],
  ["CAT-REC-013", "cats/intact.json", "Sphynx", 3, 4.2, false, "high", "duck", "premium", "maintenance"],
  ["CAT-REC-014", "cats/intact.json", "Domestic cat", 5, 4.6, false, "normal", "salmon", "μέχρι 45 ευρώ", "maintenance"],
  ["CAT-REC-015", "cats/intact.json", "Norwegian Forest", 4, 6.5, false, "normal", "chicken", "μέχρι 60 ευρώ", "maintenance"],
  ["CAT-REC-016", "cats/seniors.json", "Domestic cat", 12, 3.9, true, "low", "chicken", "μέχρι 45 ευρώ", "maintenance"],
  ["CAT-REC-017", "cats/renal.json", "Persian", 13, 4.2, true, "low", "salmon", "premium", "renal_caution"],
  ["CAT-REC-018", "cats/seniors.json", "Siamese", 14, 3.3, false, "low", "fish", "χωρίς όριο", "senior_support"],
  ["CAT-REC-019", "cats/obesity.json", "British Shorthair", 10, 6.1, true, "low", "turkey", "οικονομικό", "weight_loss"],
  ["CAT-REC-020", "cats/seniors.json", "Maine Coon", 11, 7.2, true, "normal", "duck", "premium", "maintenance"],
];

for (const [id, file, breed, age, weight, neutered, activity, flavor, budget, goal] of catRecommendations) {
  push(file, {
    id,
    species: "cat",
    category: "recommendation",
    difficulty: "medium",
    language: id.endsWith("011") ? "greeklish" : "el",
    customer_profile: profile("recommendation", budget.includes("οικονομ") || budget === "value" ? "price_sensitive" : "polite"),
    facts: {
      species: "cat",
      breed,
      age_years: age,
      weight_kg: weight,
      neutered,
      life_stage: age >= 10 ? "senior" : "adult",
      activity_level: activity,
      food_preferences: [flavor],
      budget_preference: budget,
      owner_goal: goal,
    },
    required_rules: ["species_filter", "cat_life_stage_filter", neutered ? "sterilised_cat_calorie_awareness" : "activity_energy_context"],
    required_tags: [activity, flavor],
    ranking_should_prefer: [flavor, goal],
    fact_extraction_must_include: ["species", "breed", "age_years", "weight_kg", "neutered", "activity_level", "food_preferences", "budget_preference"],
    conversation: conv([
      `Θέλω τροφή για γάτα ${breed}, ${age} ετών και ${weight} κιλά.`,
      neutered ? "Είναι στειρωμένη και ζει κυρίως μέσα." : "Δεν είναι στειρωμένη.",
      `Της αρέσει ${flavor}. Budget: ${budget}.`,
    ]),
  });
}

const puppies = [
  ["DOG-PUPPY-001", "Labrador", 5, 18, 32, "large", "chicken"],
  ["DOG-PUPPY-002", "Cane Corso", 8, 45, 55, "giant", "lamb"],
  ["DOG-PUPPY-003", "Yorkshire Terrier", 4, 1.8, 3.5, "mini", "chicken"],
  ["DOG-PUPPY-004", "German Shepherd", 6, 24, 38, "large", "salmon"],
  ["DOG-PUPPY-005", "Great Dane", 7, 60, 75, "giant", "duck"],
  ["DOG-PUPPY-006", "French Bulldog", 5, 7, 12, "small", "fish"],
  ["DOG-PUPPY-007", "Maltese", 3, 1.4, 4, "small", "chicken"],
  ["DOG-PUPPY-008", "Border Collie", 9, 14, 20, "medium", "turkey"],
  ["DOG-PUPPY-009", "Rottweiler", 8, 42, 50, "large", "beef"],
  ["DOG-PUPPY-010", "Mixed breed", 4, 6, 15, "medium", "chicken"],
];

for (const [id, breed, months, weight, adultWeight, size, flavor] of puppies) {
  push("dogs/puppies.json", {
    id,
    species: "dog",
    category: "puppy",
    difficulty: size === "giant" ? "hard" : "medium",
    language: id.endsWith("010") ? "mixed" : "el",
    customer_profile: profile("recommendation", "confused", "beginner"),
    facts: {
      species: "dog",
      breed,
      age_months: months,
      weight_kg: weight,
      expected_adult_weight_kg: adultWeight,
      neutered: false,
      life_stage: "puppy",
      activity_level: "normal",
      food_preferences: [flavor],
      owner_goal: "healthy_growth",
    },
    required_rules: ["growth_rules", size === "large" || size === "giant" ? "large_breed_puppy_calcium_phosphorus" : "puppy_life_stage_filter"],
    required_tags: ["puppy", size, flavor],
    ranking_should_prefer: ["puppy", size, "calcium_phosphorus_available", flavor],
    fact_extraction_must_include: ["species", "breed", "age_months", "weight_kg", "expected_adult_weight_kg"],
    conversation: conv([
      `Έχω κουτάβι ${breed}, ${months} μηνών, ${weight} κιλά.`,
      `Θα γίνει περίπου ${adultWeight} κιλά. Του αρέσει ${flavor}.`,
      "Θέλω σωστή τροφή για ανάπτυξη, όχι απλά ό,τι να είναι.",
    ]),
  });
}

const kittens = [
  ["CAT-KITTEN-001", "Domestic kitten", 3, 1.2, "chicken"],
  ["CAT-KITTEN-002", "Maine Coon", 5, 3.5, "salmon"],
  ["CAT-KITTEN-003", "Siamese", 4, 1.8, "duck"],
  ["CAT-KITTEN-004", "British Shorthair", 6, 2.7, "chicken"],
  ["CAT-KITTEN-005", "Rescue kitten", 2, 0.8, "wet"],
  ["CAT-KITTEN-006", "Ragdoll", 7, 3.2, "turkey"],
  ["CAT-KITTEN-007", "Bengal", 5, 2.4, "fish"],
  ["CAT-KITTEN-008", "Persian", 4, 1.6, "chicken"],
  ["CAT-KITTEN-009", "Aegean cat", 8, 3.1, "salmon"],
  ["CAT-KITTEN-010", "Found kitten", 1.5, 0.5, "milk_replacement"],
];

for (const [id, breed, months, weight, flavor] of kittens) {
  push("cats/kittens.json", {
    id,
    species: "cat",
    category: "kitten",
    difficulty: months < 2 ? "hard" : "medium",
    language: id.endsWith("007") ? "greeklish" : "el",
    customer_profile: profile("recommendation", months < 2 ? "anxious" : "polite", "beginner"),
    facts: {
      species: "cat",
      breed,
      age_months: months,
      weight_kg: weight,
      neutered: false,
      life_stage: "kitten",
      activity_level: "normal",
      food_preferences: [flavor],
      owner_goal: "healthy_growth",
    },
    required_rules: ["kitten_growth_rules", months < 2 ? "orphan_kitten_vet_or_milk_replacer_context" : "kitten_life_stage_filter"],
    required_tags: ["kitten", flavor],
    ranking_should_prefer: ["kitten", flavor, "energy_dense_growth_food"],
    fact_extraction_must_include: ["species", "age_months", "weight_kg", "life_stage"],
    conversation: conv([
      `Έχω γατάκι ${breed}, ${months} μηνών, περίπου ${weight} κιλά.`,
      `Θέλω τροφή για σωστή ανάπτυξη. Προτίμηση: ${flavor}.`,
    ]),
  });
}

const emergencies = [
  ["DOG-EMER-001", "dogs/emergency.json", "dog", "σκύλος", "Έχει αίμα στα κόπρανα και κάνει εμετό.", ["blood", "vomiting"]],
  ["DOG-EMER-002", "dogs/emergency.json", "dog", "σκύλος", "Δεν τρώει δύο μέρες και είναι καταβεβλημένος.", ["not_eating", "collapse"]],
  ["DOG-EMER-003", "dogs/emergency.json", "dog", "σκύλος", "Έχει έντονο πόνο στην κοιλιά και κλαίει.", ["severe_abdominal_pain"]],
  ["DOG-EMER-004", "dogs/emergency.json", "dog", "σκύλος", "Κάνει διάρροια με αίμα από το πρωί.", ["blood", "diarrhea"]],
  ["DOG-EMER-005", "dogs/emergency.json", "dog", "σκύλος", "Υποψιάζομαι παγκρεατίτιδα, κάνει εμετούς.", ["pancreatitis", "vomiting"]],
  ["CAT-EMER-001", "cats/emergency.json", "cat", "γάτος", "Ο γάτος μου μπαίνει στην άμμο συνέχεια αλλά δεν κατουράει.", ["male_cat_no_urine", "urinary_blockage"]],
  ["CAT-EMER-002", "cats/emergency.json", "cat", "γάτα", "Η γάτα μου έχει αίμα στα ούρα.", ["blood", "urinary"]],
  ["CAT-EMER-003", "cats/emergency.json", "cat", "γάτα", "Δεν τρώει καθόλου και κρύβεται.", ["not_eating"]],
  ["CAT-EMER-004", "cats/emergency.json", "cat", "γάτα", "Κάνει συνεχόμενους εμετούς.", ["vomiting"]],
  ["CAT-EMER-005", "cats/emergency.json", "cat", "γάτα", "Έχει νεφρικό και ξαφνικά δεν τρώει.", ["renal", "not_eating"]],
];

for (const [id, file, species, label, symptom, flags] of emergencies) {
  push(file, {
    id,
    species,
    category: "emergency",
    difficulty: "expert",
    language: id.endsWith("001") ? "greeklish" : "el",
    customer_profile: profile("emergency", "anxious", "beginner"),
    facts: {
      species,
      age_years: null,
      weight_kg: null,
      life_stage: null,
      health_conditions: flags,
      urgency_flags: flags,
    },
    required_rules: ["medical_red_flag_interrupt", "no_food_recommendation_before_vet"],
    required_tags: flags,
    safety_must_trigger: flags,
    fact_extraction_must_include: ["species", "urgency_flags"],
    conversation: conv([
      `Έχω ${label}. ${symptom}`,
      "Να αλλάξω τροφή τώρα;",
    ], "Interrupt normal recommendation flow. Advise urgent veterinary contact when red flags are present. Do not rank foods."),
  });
}

const allergies = [
  ["DOG-ALG-001", "dogs/medical.json", "dog", "κοτόπουλο", "salmon", "allergy"],
  ["DOG-ALG-002", "dogs/medical.json", "dog", "αρνί", "chicken", "intolerance"],
  ["DOG-ALG-003", "dogs/medical.json", "dog", "μοσχάρι και γαλοπούλα", "fish", "allergy"],
  ["DOG-ALG-004", "dogs/medical.json", "dog", "σιτάρι", "duck", "sensitive_digestion"],
  ["DOG-ALG-005", "dogs/medical.json", "dog", "καλαμπόκι", "lamb", "itchy_skin"],
  ["CAT-ALG-001", "mixed/picky_eaters.json", "cat", "κοτόπουλο", "salmon", "allergy"],
  ["CAT-ALG-002", "mixed/picky_eaters.json", "cat", "ψάρι", "chicken", "allergy"],
  ["CAT-ALG-003", "mixed/picky_eaters.json", "cat", "μοσχάρι", "duck", "intolerance"],
  ["CAT-ALG-004", "mixed/picky_eaters.json", "cat", "δημητριακά", "turkey", "sensitive_digestion"],
  ["CAT-ALG-005", "mixed/picky_eaters.json", "cat", "πολλά συστατικά", "hydrolysed", "allergy"],
];

for (const [id, file, species, avoid, prefer, condition] of allergies) {
  push(file, {
    id,
    species,
    category: "allergy",
    difficulty: condition === "allergy" ? "hard" : "medium",
    language: id.endsWith("004") ? "greeklish" : "el",
    customer_profile: profile("recommendation", "anxious", "normal"),
    facts: {
      species,
      age_years: species === "dog" ? 4 : 3,
      weight_kg: species === "dog" ? 18 : 4.5,
      neutered: true,
      life_stage: "adult",
      activity_level: "normal",
      health_conditions: [condition],
      allergies: condition === "allergy" ? [avoid] : [],
      sensitivities: condition !== "allergy" ? [avoid] : [],
      food_preferences: [prefer],
      owner_goal: "avoid_reaction",
    },
    required_rules: ["allergy_conflict_hard_reject", "do_not_diagnose_allergy"],
    required_tags: [condition, prefer],
    ranking_should_prefer: [prefer, "no_" + avoid.replace(/\s+/g, "_")],
    fact_extraction_must_include: ["species", "allergies", "sensitivities", "food_preferences"],
    conversation: conv([
      species === "dog" ? "Ο σκύλος μου ξύνεται μετά το φαγητό." : "Η γάτα μου πειράζεται από κάποιες τροφές.",
      `Θέλω να αποφύγω ${avoid}. Προτιμά ${prefer}.`,
      "Μπορείς να μου προτείνεις κάτι ασφαλές;",
    ]),
  });
}

const comparisons = [
  ["DOG-COMP-001", "dogs/comparisons.json", "dog", ["Royal Canin", "Acana"], "Labrador", 5, 34],
  ["DOG-COMP-002", "dogs/comparisons.json", "dog", ["Josera", "Happy Dog"], "Beagle", 4, 14],
  ["DOG-COMP-003", "dogs/comparisons.json", "dog", ["Monge", "Schesir"], "Maltese", 7, 4],
  ["DOG-COMP-004", "dogs/comparisons.json", "dog", ["Farmina", "Brit"], "Boxer", 3, 28],
  ["DOG-COMP-005", "dogs/comparisons.json", "dog", ["Purina Pro Plan", "Royal Canin"], "German Shepherd", 2, 35],
  ["CAT-COMP-001", "mixed/premium.json", "cat", ["Royal Canin", "Monge"], "Persian", 6, 5],
  ["CAT-COMP-002", "mixed/premium.json", "cat", ["Schesir", "Farmina"], "Domestic cat", 4, 4.2],
  ["CAT-COMP-003", "mixed/premium.json", "cat", ["Purina Pro Plan", "Josera"], "British Shorthair", 5, 6],
  ["MIX-COMP-001", "mixed/budget.json", "dog", ["Acana", "Ambrosia"], "Husky", 2, 25],
  ["MIX-COMP-002", "mixed/budget.json", "cat", ["Happy Cat", "Royal Canin"], "Aegean cat", 3, 4],
];

for (const [id, file, species, brands, breed, age, weight] of comparisons) {
  push(file, {
    id,
    species,
    category: "comparison",
    difficulty: "medium",
    language: id.startsWith("MIX") ? "mixed" : "el",
    customer_profile: profile("comparison", id.includes("BUD") ? "price_sensitive" : "confused"),
    facts: {
      species,
      breed,
      age_years: age,
      weight_kg: weight,
      neutered: true,
      life_stage: "adult",
      activity_level: "normal",
      food_preferences: brands,
      owner_goal: "compare_foods",
    },
    required_rules: ["compare_only_retrieved_foods", "no_invented_nutrients"],
    required_tags: brands,
    ranking_should_prefer: ["clear_tradeoffs", "species_match"],
    fact_extraction_must_include: ["species", "breed", "weight_kg", "food_preferences"],
    conversation: conv([
      `Έχω ${species === "dog" ? "σκύλο" : "γάτα"} ${breed}, ${age} ετών, ${weight} κιλά.`,
      `Θέλω σύγκριση ${brands[0]} ή ${brands[1]}.`,
      "Πες μου πρακτικά ποια θα διάλεγες και γιατί.",
    ]),
  });
}

const feeding = [
  ["DOG-FEED-001", "dogs/feeding.json", "dog", "feeding_amount", "Royal Canin Mini Adult", 6, 6, "maintenance"],
  ["DOG-FEED-002", "dogs/feeding.json", "dog", "transition", "Acana Pacifica", 3, 18, "transition"],
  ["DOG-FEED-003", "dogs/feeding.json", "dog", "feeding_amount", "Happy Dog Sterilised", 5, 12, "weight_loss"],
  ["CAT-FEED-001", "cats/feeding.json", "cat", "feeding_amount", "Royal Canin Sterilised", 4, 4.8, "maintenance"],
  ["CAT-FEED-002", "cats/feeding.json", "cat", "transition", "Monge Urinary", 6, 5.1, "transition"],
  ["CAT-FEED-003", "cats/feeding.json", "cat", "feeding_amount", "Schesir Sterilised", 3, 4.2, "weight_loss"],
  ["MIX-FEED-001", "mixed/food_transition.json", "dog", "transition", "Josera Sensi Plus", 8, 20, "sensitive_digestion"],
  ["MIX-FEED-002", "mixed/food_transition.json", "cat", "transition", "Farmina N&D", 2, 4.1, "picky_eater"],
  ["MIX-FEED-003", "mixed/multi_pet.json", "dog", "feeding_amount", "Brit Care", 7, 30, "maintenance"],
  ["MIX-FEED-004", "mixed/multi_pet.json", "cat", "feeding_amount", "Purina Pro Plan", 9, 6.5, "weight_loss"],
];

for (const [id, file, species, intent, food, age, weight, goal] of feeding) {
  push(file, {
    id,
    species,
    category: intent === "transition" ? "transition" : "feeding",
    difficulty: "medium",
    language: id.endsWith("002") ? "greeklish" : "el",
    customer_profile: profile(intent, "polite", "normal"),
    facts: {
      species,
      age_years: age,
      weight_kg: weight,
      neutered: true,
      life_stage: age >= 8 ? "senior" : "adult",
      activity_level: "normal",
      food_preferences: [food],
      owner_goal: goal,
    },
    required_rules: [intent === "transition" ? "gradual_food_transition" : "portion_estimate_requires_kcal"],
    required_tags: [food, goal],
    ranking_should_prefer: [intent === "transition" ? "transition_plan" : "grams_per_day_after_kcal"],
    fact_extraction_must_include: ["species", "weight_kg", "food_preferences"],
    conversation: conv([
      `Έχω ${species === "dog" ? "σκύλο" : "γάτα"} ${age} ετών, ${weight} κιλά.`,
      intent === "transition"
        ? `Θέλω να αλλάξω σε ${food}. Πώς το κάνω χωρίς να τον/την πειράξει;`
        : `Τρώει ${food}. Πόσα γραμμάρια να δίνω τη μέρα;`,
    ]),
  });
}

for (const file of files) {
  await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await writeFile(path.join(root, file), JSON.stringify(buckets[file], null, 2) + "\n", "utf8");
}

const total = Object.values(buckets).reduce((sum, items) => sum + items.length, 0);
console.log(JSON.stringify({ total, files: Object.fromEntries(Object.entries(buckets).map(([file, items]) => [file, items.length])) }, null, 2));
