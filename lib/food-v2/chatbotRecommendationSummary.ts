import type { FoodV2RecommendationGoal } from "@/lib/food-v2/recommendationRanking";

export type FoodV2ChatbotRecommendationItem = {
  brand?: string | null;
  display_name?: string | null;
  data_quality_status?: string | null;
  source_priority?: string | null;
  missing_nutrition_fields?: string[];
  ranking?: {
    total_score?: number | null;
    confidence?: "high" | "medium" | "low";
    reasons?: string[];
    cautions?: string[];
  } | null;
  nutrition_confidence?: {
    label?: string;
    score?: number;
    missing_core_fields?: string[];
    missing_mineral_fields?: string[];
    missing_optional_fields?: string[];
    estimated_fields?: string[];
  } | null;
  nutrition?: Record<string, number | null | undefined> | null;
};

export type FoodV2ChatbotRecommendationResponse = {
  goal?: FoodV2RecommendationGoal;
  total_candidates?: number;
  premium?: FoodV2ChatbotRecommendationItem[];
  value?: FoodV2ChatbotRecommendationItem[];
  hold?: FoodV2ChatbotRecommendationItem[];
  notes?: string[];
};

export type FoodV2ChatbotPetContext = {
  species?: "dog" | "cat";
  age?: number;
  neutered?: boolean;
  healthIssues?: string[];
  allergies?: string[];
  weightGoal?: "maintain" | "loss" | "gain";
};

type RecommendationSummaryOptions = {
  mode?: "default" | "alternative";
  excludedBrands?: string[];
  locale?: "el" | "en";
  maxItemsPerSection?: number;
};

const GOAL_LABELS: Record<FoodV2RecommendationGoal, string> = {
  general: "general fit",
  premium: "premium fit",
  value: "value fit",
  weight_control: "weight control",
  sensitive_digestion: "sensitive digestion",
  allergy: "allergy or ingredient avoidance",
  urinary: "urinary support",
  renal: "renal support",
  growth: "growth",
  sterilised: "sterilised pet",
  senior: "senior pet",
};

const GOAL_LABELS_EL: Record<FoodV2RecommendationGoal, string> = {
  general: "γενική επιλογή",
  premium: "ποιοτική επιλογή",
  value: "οικονομική επιλογή",
  weight_control: "έλεγχος βάρους",
  sensitive_digestion: "ευαίσθητη πέψη",
  allergy: "αλλεργία ή αποφυγή συστατικών",
  urinary: "ουρολογική υποστήριξη",
  renal: "νεφρική υποστήριξη",
  growth: "ανάπτυξη",
  sterilised: "στειρωμένο κατοικίδιο",
  senior: "ηλικιωμένο κατοικίδιο",
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasAny(values: string[] | undefined, terms: string[]) {
  const text = normalizeText((values ?? []).join(" "));
  return terms.some((term) => text.includes(normalizeText(term)));
}

export function goalFromPetContext(
  pet: FoodV2ChatbotPetContext
): FoodV2RecommendationGoal {
  if ((pet.allergies ?? []).length > 0) return "allergy";
  if (hasAny(pet.healthIssues, ["urinary", "struvite", "crystal", "pee", "ουρολογ"])) {
    return "urinary";
  }
  if (hasAny(pet.healthIssues, ["renal", "kidney", "ckd", "νεφρ"])) return "renal";
  if (pet.weightGoal === "loss" || hasAny(pet.healthIssues, ["weight", "obesity", "overweight", "βάρος", "παχυ"])) {
    return "weight_control";
  }
  if (
    hasAny(pet.healthIssues, [
      "digest",
      "gastro",
      "intestinal",
      "sensitive stomach",
      "diarrhea",
      "gas",
      "πέψη",
      "διάρροια",
    ])
  ) {
    return "sensitive_digestion";
  }
  if (
    (pet.species === "dog" && typeof pet.age === "number" && pet.age < 1) ||
    (pet.species === "cat" && typeof pet.age === "number" && pet.age < 1)
  ) {
    return "growth";
  }
  if (
    (pet.species === "dog" && typeof pet.age === "number" && pet.age >= 8) ||
    (pet.species === "cat" && typeof pet.age === "number" && pet.age >= 10)
  ) {
    return "senior";
  }
  if (pet.neutered) return "sterilised";

  return "general";
}

function foodName(food: FoodV2ChatbotRecommendationItem) {
  const brand = String(food.brand ?? "").trim();
  const displayName = String(food.display_name ?? "").trim();

  if (brand && displayName.toLowerCase().startsWith(brand.toLowerCase())) {
    return displayName;
  }

  return [brand, displayName].filter(Boolean).join(" - ");
}

function translateRankingText(value: string, locale: "el" | "en") {
  if (locale === "en") return value;

  return value
    .replace(/Matches adult life stage\./gi, "Ταιριάζει σε ενήλικο ζώο.")
    .replace(/Matches puppy life stage\./gi, "Ταιριάζει σε κουτάβι.")
    .replace(/Matches kitten life stage\./gi, "Ταιριάζει σε γατάκι.")
    .replace(/Matches senior life stage\./gi, "Ταιριάζει σε senior ζώο.")
    .replace(/Matches size or breed-size positioning\./gi, "Ταιριάζει στο μέγεθος ή στον τύπο φυλής.")
    .replace(/Useful weight-aware positioning for a sterilised pet\./gi, "Έχει λογική για στειρωμένο ή επιρρεπές σε βάρος ζώο.")
    .replace(/Moderate calories fit a sterilised pet better\./gi, "Οι θερμίδες είναι πιο ήπιες για στειρωμένο ζώο.")
    .replace(/Calories look acceptable for a sterilised pet\./gi, "Οι θερμίδες φαίνονται αποδεκτές για στειρωμένο ζώο.")
    .replace(/Positioned for weight control\./gi, "Έχει προσανατολισμό για έλεγχο βάρους.")
    .replace(/Lower calorie density fits a weight-control goal\./gi, "Η χαμηλότερη θερμιδική πυκνότητα βοηθά στον έλεγχο βάρους.")
    .replace(/Positioned for urinary support\./gi, "Έχει ουρολογικό προσανατολισμό.")
    .replace(/Positioned for renal support\./gi, "Έχει νεφρικό προσανατολισμό.")
    .replace(/Positioned for senior pets\./gi, "Είναι πιο κοντά σε senior ανάγκες.")
    .replace(/Positioned for sensitive digestion\./gi, "Έχει προσανατολισμό για ευαίσθητη πέψη.")
    .replace(/Declared allergens were not detected in the ingredient text\./gi, "Δεν εντοπίστηκε το δηλωμένο αλλεργιογόνο στα συστατικά.")
    .replace(/Avoided the pet's excluded ingredients or flavors\./gi, "Αποφεύγει τα συστατικά ή τις γεύσεις που δήλωσες.")
    .replace(/Matches a preferred protein or flavor\./gi, "Ταιριάζει με προτιμώμενη πρωτεΐνη ή γεύση.")
    .replace(/Ingredient data is available\./gi, "Υπάρχουν διαθέσιμα στοιχεία συστατικών.")
    .replace(/Official source has priority\./gi, "Η πηγή είναι επίσημη ή υψηλής προτεραιότητας.")
    .replace(/Data is usable but still needs review\./gi, "Τα δεδομένα είναι χρήσιμα, αλλά θέλουν τελικό έλεγχο.")
    .replace(/Retailer source should be worded cautiously\./gi, "Η πηγή είναι retailer, άρα μιλάμε πιο προσεκτικά.")
    .replace(/Fat looks high for a sterilised or weight-prone pet\./gi, "Τα λιπαρά φαίνονται υψηλά για στειρωμένο ή επιρρεπές σε βάρος ζώο.")
    .replace(/Energy density may be high for a sterilised pet\./gi, "Οι θερμίδες φαίνονται υψηλές για στειρωμένο ζώο.")
    .replace(/Active\/performance positioning is not ideal for a sterilised low-to-normal activity pet\./gi, "Η active/performance λογική δεν είναι ιδανική για στειρωμένο ζώο με χαμηλή ή κανονική δραστηριότητα.")
    .replace(/Not an exact senior life-stage match\./gi, "Δεν είναι ακριβές senior life-stage match.")
    .replace(/Large-breed puppy ranking needs calcium and phosphorus data\./gi, "Για μεγαλόσωμο κουτάβι χρειαζόμαστε ασβέστιο και φώσφορο για μεγαλύτερη σιγουριά.")
    .replace(/Renal cases need veterinarian-directed renal diet selection\./gi, "Τα νεφρικά περιστατικά χρειάζονται επιλογή τροφής με καθοδήγηση κτηνιάτρου.")
    .replace(/Urinary reasoning is weaker without magnesium and phosphorus\./gi, "Η ουρολογική αξιολόγηση είναι πιο αδύναμη χωρίς μαγνήσιο και φώσφορο.");
}

function localizedSourceLabel(food: FoodV2ChatbotRecommendationItem, locale: "el" | "en") {
  const quality = String(food.data_quality_status ?? "").trim();
  const source = String(food.source_priority ?? "").trim();

  if (locale === "en") {
    return [
      "source: Food V2",
      quality ? `quality: ${quality}` : "",
      source ? `source tier: ${source}` : "",
    ]
      .filter(Boolean)
      .join("; ");
  }

  return [
    "Πηγή: Food V2",
    quality ? `ποιότητα: ${quality}` : "",
    source ? `τύπος πηγής: ${source}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function localizedConfidence(value: string, locale: "el" | "en") {
  if (locale === "en") return `${value} confidence`;
  if (value === "high") return "υψηλή σιγουριά";
  if (value === "low") return "χαμηλή σιγουριά";
  return "μέτρια σιγουριά";
}

function missingNutritionFields(food: FoodV2ChatbotRecommendationItem) {
  const explicit = food.missing_nutrition_fields ?? [];
  const confidenceMissing = [
    ...(food.nutrition_confidence?.missing_core_fields ?? []),
    ...(food.nutrition_confidence?.missing_mineral_fields ?? []),
  ];

  if (explicit.length > 0 || confidenceMissing.length > 0) {
    return [...new Set([...explicit, ...confidenceMissing])].slice(0, 6);
  }

  const nutrition = food.nutrition;
  if (!nutrition) return [];

  return [
    "kcal_per_100g",
    "protein_percent",
    "fat_percent",
    "fiber_percent",
    "calcium_percent",
    "phosphorus_percent",
    "sodium_percent",
    "magnesium_percent",
  ].filter((field) => nutrition[field] === null || nutrition[field] === undefined);
}

function formatNumber(value: number | null | undefined, digits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Number(value.toFixed(digits));
}

function nutritionSnapshot(food: FoodV2ChatbotRecommendationItem, locale: "el" | "en") {
  const nutrition = food.nutrition;
  if (!nutrition) return "";

  const kcal = formatNumber(nutrition.kcal_per_100g, 1);
  const protein = formatNumber(nutrition.protein_percent, 1);
  const fat = formatNumber(nutrition.fat_percent, 1);
  const fiber = formatNumber(nutrition.fiber_percent, 1);
  const calcium = formatNumber(nutrition.calcium_percent, 2);
  const phosphorus = formatNumber(nutrition.phosphorus_percent, 2);

  const core = [
    kcal !== null ? `kcal ${kcal}/100g` : "",
    protein !== null ? `protein ${protein}%` : "",
    fat !== null ? `fat ${fat}%` : "",
    fiber !== null ? `fiber ${fiber}%` : "",
  ].filter(Boolean);

  const minerals = [
    calcium !== null ? `Ca ${calcium}%` : "",
    phosphorus !== null ? `P ${phosphorus}%` : "",
  ].filter(Boolean);

  const values = [...core, ...(minerals.length === 2 ? [minerals.join(" / ")] : [])];
  if (values.length === 0) return "";

  const label = locale === "el" ? "Nutrition snapshot" : "Nutrition snapshot";
  return `- ${label}: ${values.join("; ")}`;
}

function fitSummary(food: FoodV2ChatbotRecommendationItem, locale: "el" | "en") {
  const ranking = food.ranking;
  if (!ranking) return "";

  const score = typeof ranking.total_score === "number" ? ranking.total_score : null;
  const confidence = ranking.confidence ?? "medium";
  const label = locale === "el" ? "Fit summary" : "Fit summary";
  const source =
    food.data_quality_status === "verified"
      ? "verified data"
      : food.data_quality_status === "partial"
        ? "partial data"
        : food.data_quality_status === "needs_review"
          ? "needs review"
          : "limited data";

  return `- ${label}: ${score !== null ? `${score}/100, ` : ""}${localizedConfidence(
    confidence,
    locale
  )}, ${source}`;
}

function nutritionFitExplanation(
  food: FoodV2ChatbotRecommendationItem,
  goal: FoodV2RecommendationGoal
) {
  const nutrition = food.nutrition;
  const reasons = (food.ranking?.reasons ?? []).join(" ").toLowerCase();
  const cautions = (food.ranking?.cautions ?? []).join(" ").toLowerCase();
  const kcal = formatNumber(nutrition?.kcal_per_100g, 1);
  const fat = formatNumber(nutrition?.fat_percent, 1);
  const protein = formatNumber(nutrition?.protein_percent, 1);
  const calcium = formatNumber(nutrition?.calcium_percent, 2);
  const phosphorus = formatNumber(nutrition?.phosphorus_percent, 2);

  if (goal === "weight_control" || goal === "sterilised") {
    const numbers = [
      kcal !== null ? `${kcal} kcal/100g` : "",
      fat !== null ? `${fat}% fat` : "",
    ].filter(Boolean);

    return numbers.length > 0
      ? `- Use case: calorie-aware shortlist for sterilised or weight-prone pets (${numbers.join(", ")}).`
      : "- Use case: positioned for weight or sterilised-pet control; confirm calories before portion advice.";
  }

  if (goal === "growth") {
    const mineralText =
      calcium !== null && phosphorus !== null
        ? `Ca ${calcium}% / P ${phosphorus}%`
        : "calcium and phosphorus still need confirmation";

    return `- Use case: growth-focused option; ${mineralText}.`;
  }

  if (goal === "allergy") {
    return "- Use case: ingredient-avoidance shortlist based on the available ingredient text; use a vet-guided elimination trial for true allergy work.";
  }

  if (goal === "sensitive_digestion") {
    return reasons.includes("sensitive") || reasons.includes("digest")
      ? "- Use case: digestion-focused shortlist with sensitive/GI positioning."
      : "- Use case: general adult fit while digestion-specific data is limited.";
  }

  if (goal === "urinary" || goal === "renal") {
    return cautions.includes("missing") || cautions.includes("weaker")
      ? "- Use case: condition-positioned option, but mineral gaps mean cautious wording is needed."
      : "- Use case: condition-positioned option; use alongside veterinary guidance.";
  }

  if (goal === "senior") {
    return protein !== null
      ? `- Use case: senior-fit shortlist with ${protein}% protein; watch weight, appetite, and muscle condition.`
      : "- Use case: senior-fit shortlist; watch weight, appetite, and muscle condition.";
  }

  return "- Use case: general formula fit based on species, life stage, ingredients, and available nutrition data.";
}

function cautiousDataQualityNote(food: FoodV2ChatbotRecommendationItem, locale: "el" | "en") {
  if (food.data_quality_status !== "needs_review") return "";

  if (locale === "el") {
    return "   Σημείωση: αυτή η τροφή θέλει ακόμη review, άρα τη βλέπουμε ως υποψήφια και όχι ως τελική απάντηση.";
  }

  return "   Note: this row still needs review, so treat it as a candidate rather than a final answer.";
}

function recommendationRoleLine(role: "premium" | "value") {
  if (role === "premium") {
    return "- Role: strongest nutrition fit based on the pet profile, goal, and available data.";
  }

  return "- Role: value alternative; price data is not available yet, so this is based on formula positioning and data quality.";
}

function formatFood(
  food: FoodV2ChatbotRecommendationItem,
  index: number,
  locale: "el" | "en",
  goal: FoodV2RecommendationGoal,
  role: "premium" | "value"
) {
  const score = food.ranking?.total_score;
  const confidence = food.ranking?.confidence ?? "medium";
  const nutritionConfidence = food.nutrition_confidence?.label;
  const missing = missingNutritionFields(food);
  const reasons = (food.ranking?.reasons ?? [])
    .filter((reason) => !reason.toLowerCase().includes("matches the pet species"))
    .map((reason) => translateRankingText(reason, locale))
    .slice(0, 2);
  const optionLabel = locale === "el" ? "Επιλογή" : "Option";
  const missingLabel = locale === "el" ? "Λείπουν θρεπτικά" : "Missing nutrition";
  const estimatedLabel = locale === "el" ? "Estimated nutrition" : "Estimated nutrition";
  const whyLabel = locale === "el" ? "Γιατί ταιριάζει" : "Why it fits";
  const estimated = food.nutrition_confidence?.estimated_fields ?? [];

  return [
    `${optionLabel} ${index}: ${foodName(food) || "Unnamed food"}${
      typeof score === "number" ? ` (${score}/100, ${localizedConfidence(confidence, locale)})` : ""
    }${nutritionConfidence ? ` - ${nutritionConfidence}` : ""}`,
    recommendationRoleLine(role),
    `- ${localizedSourceLabel(food, locale)}`,
    fitSummary(food, locale),
    nutritionFitExplanation(food, goal),
    nutritionSnapshot(food, locale),
    missing.length > 0 ? `- ${missingLabel}: ${missing.join(", ")}` : "",
    estimated.length > 0 ? `- ${estimatedLabel}: ${estimated.join(", ")}` : "",
    reasons.length > 0 ? `- ${whyLabel}: ${reasons.join("; ")}` : "",
    cautiousDataQualityNote(food, locale),
  ]
    .filter(Boolean)
    .join("\n");
}

function formatTopPick(
  food: FoodV2ChatbotRecommendationItem | undefined,
  locale: "el" | "en",
  goal: FoodV2RecommendationGoal
) {
  if (!food) return "";

  const score = food.ranking?.total_score;
  const firstReason = food.ranking?.reasons?.find(
    (reason) => !reason.toLowerCase().includes("matches the pet species")
  );
  const topLabel = locale === "el" ? "Πρώτη επιλογή" : "Top pick";
  const whyLabel = locale === "el" ? "Γιατί" : "Why";

  return [
    `${topLabel}: ${foodName(food) || "Unnamed food"}${
      typeof score === "number" ? ` (${score}/100)` : ""
    }.`,
    localizedSourceLabel(food, locale),
    nutritionFitExplanation(food, goal),
    cautiousDataQualityNote(food, locale).trim(),
    firstReason ? `${whyLabel}: ${translateRankingText(firstReason, locale)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function uniqueShortCautions(values: string[]) {
  const seen = new Set<string>();
  const ignored = new Set([
    "Value ranking is a proxy until price data is available.",
    "Medical-condition matches are ranking support, not diagnosis or treatment.",
  ]);

  return values
    .map((value) => value.trim())
    .filter((value) => value && !ignored.has(value))
    .filter((value) => {
      const key = normalizeText(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

export function formatFoodV2ChatbotRecommendationSummary(
  response: FoodV2ChatbotRecommendationResponse,
  options: RecommendationSummaryOptions = {}
) {
  const premium = response.premium ?? [];
  const value = response.value ?? [];
  const hold = response.hold ?? [];
  const goal = response.goal ?? "general";
  const excludedBrands = options.excludedBrands ?? [];
  const locale = options.locale ?? "el";
  const maxItemsPerSection = Math.min(
    Math.max(options.maxItemsPerSection ?? 3, 1),
    3
  );
  const goalLabel = locale === "el" ? GOAL_LABELS_EL[goal] : GOAL_LABELS[goal];
  const intro =
    options.mode === "alternative"
      ? locale === "el"
        ? "Εναλλακτικές τροφές από τη βάση NutriTail:"
        : "Alternative food shortlist from the NutriTail nutrition database:"
      : locale === "el"
        ? "Προτεινόμενες τροφές από τη βάση NutriTail:"
        : "Food shortlist from the NutriTail nutrition database:";

  if (premium.length === 0 && value.length === 0) {
    const holdCautions = uniqueShortCautions(
      hold.flatMap((food) => food.ranking?.cautions ?? [])
    );

    return [
      intro,
      "",
      `${locale === "el" ? "Στόχος" : "Goal"}: ${goalLabel ?? goal}`,
      excludedBrands.length > 0
        ? locale === "el"
          ? `Αποφεύγω προσωρινά την τωρινή εταιρεία: ${excludedBrands.join(", ")}`
          : `Avoiding current brand: ${excludedBrands.join(", ")}`
        : "",
      locale === "el"
        ? "Δεν βρήκα αρκετά ασφαλή ή κατάλληλη Food V2 πρόταση για αυτό το κατοικίδιο με τα τωρινά δεδομένα."
        : "I did not find a safe enough Food V2 recommendation for this pet with the current data.",
      locale === "el"
        ? "Δεν θα προτείνω τροφές που δεν ταιριάζουν στο μέγεθος, στο life stage ή στον δηλωμένο στόχο."
        : "I will not recommend foods that do not fit the pet size, life stage, or stated goal.",
      hold.length > 0
        ? locale === "el"
          ? `Έλεγξα ${hold.length} candidate${hold.length === 1 ? "" : "s"} και τα κράτησα εκτός shortlist.`
          : `Checked ${hold.length} candidate${hold.length === 1 ? "" : "s"} and kept them out of the shortlist.`
        : "",
      holdCautions.length > 0
        ? [
            locale === "el" ? "Βασικοί λόγοι απόρριψης:" : "Main hold reasons:",
            ...holdCautions.map((caution) => `- ${translateRankingText(caution, locale)}`),
          ].join("\n")
        : "",
      "",
      locale === "el"
        ? "Καλύτερο επόμενο βήμα: πρόσθεσε ή έλεγξε περισσότερες τροφές με αξιόπιστα θρεπτικά δεδομένα πριν βασιστούμε σε συγκεκριμένη πρόταση."
        : "Best next step: add or verify more foods with reliable nutrition data before relying on a specific recommendation.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  const blocks = [
    intro,
    "",
    `${locale === "el" ? "Στόχος" : "Goal"}: ${goalLabel ?? goal}`,
    "Shortlist split: strongest nutrition fits first, then value-style alternatives when enough safe candidates exist.",
    excludedBrands.length > 0
      ? locale === "el"
        ? `Αποφεύγω προσωρινά την τωρινή εταιρεία: ${excludedBrands.join(", ")}`
        : `Avoiding current brand: ${excludedBrands.join(", ")}`
      : "",
    formatTopPick(premium[0] ?? value[0], locale, goal),
  ];

  if (premium.length > 0) {
    blocks.push(
      "",
      locale === "el" ? "Καλύτερες ποιοτικά επιλογές:" : "Premium / strongest nutrition fits:",
      premium
        .slice(0, maxItemsPerSection)
        .map((food, index) => formatFood(food, index + 1, locale, goal, "premium"))
        .join("\n")
    );
  }

  if (value.length > 0) {
    blocks.push(
      "",
      locale === "el" ? "Πιο οικονομικές / value εναλλακτικές:" : "Value-style alternatives:",
      value
        .slice(0, maxItemsPerSection)
        .map((food, index) => formatFood(food, index + 1, locale, goal, "value"))
        .join("\n")
    );
  }

  const cautions = [
    ...premium.flatMap((food) => food.ranking?.cautions ?? []),
    ...value.flatMap((food) => food.ranking?.cautions ?? []),
    ...(response.notes ?? []),
  ];
  const uniqueCautions = uniqueShortCautions(cautions);

  if (uniqueCautions.length > 0) {
    blocks.push(
      "",
      locale === "el" ? "Προσοχή:" : "Cautions:",
      uniqueCautions.map((caution) => `- ${translateRankingText(caution, locale)}`).join("\n")
    );
  }

  blocks.push(
    "",
    locale === "el"
      ? "Χρησιμοποίησέ το σαν λίστα αγορών, όχι σαν διάγνωση ή θεραπεία. Για ουρολογικό, νεφρικό, διαβήτη, παγκρεατίτιδα, σοβαρή αλλεργία, εμετό, διάρροια, αίμα ή ανορεξία, μίλα πρώτα με κτηνίατρο."
      : "Use this as a shopping shortlist, not a diagnosis or treatment plan. For urinary, kidney, diabetes, pancreatitis, severe allergy, vomiting, diarrhea, blood, or not eating, speak with a veterinarian first."
  );

  return blocks.join("\n");
}
