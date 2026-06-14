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
  let displayName = String(food.display_name ?? "").replace(/\s+/g, " ").trim();

  const firstBrandWord = brand.split(/\s+/)[0];
  if (firstBrandWord) {
    const repeatedBrandWord = new RegExp(
      `^${escapeRegExp(firstBrandWord)}\\s+${escapeRegExp(firstBrandWord)}\\s+`,
      "i"
    );
    displayName = displayName.replace(repeatedBrandWord, "");
  }

  if (brand && displayName.toLowerCase().startsWith(brand.toLowerCase())) {
    return displayName;
  }

  return [brand, displayName].filter(Boolean).join(" - ");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    .replace(/Fat is not low enough to be a first pick for a sterilised or weight-control case\./gi, "Τα λιπαρά δεν είναι αρκετά χαμηλά για να είναι πρώτη επιλογή σε στειρωμένο ή weight-control περίπτωση.")
    .replace(/Energy density may be high for a sterilised pet\./gi, "Οι θερμίδες φαίνονται υψηλές για στειρωμένο ζώο.")
    .replace(/Active\/performance positioning is not ideal for a sterilised low-to-normal activity pet\./gi, "Η active/performance λογική δεν είναι ιδανική για στειρωμένο ζώο με χαμηλή ή κανονική δραστηριότητα.")
    .replace(/Not an exact senior life-stage match\./gi, "Δεν είναι ακριβές senior life-stage match.")
    .replace(/Large-breed puppy ranking needs calcium and phosphorus data\./gi, "Για μεγαλόσωμο κουτάβι χρειαζόμαστε ασβέστιο και φώσφορο για μεγαλύτερη σιγουριά.")
    .replace(/Renal cases need veterinarian-directed renal diet selection\./gi, "Τα νεφρικά περιστατικά χρειάζονται επιλογή τροφής με καθοδήγηση κτηνιάτρου.")
    .replace(/Urinary reasoning is weaker without magnesium and phosphorus\./gi, "Η ουρολογική αξιολόγηση είναι πιο αδύναμη χωρίς μαγνήσιο και φώσφορο.");
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

function customerNutritionSnapshot(food: FoodV2ChatbotRecommendationItem, locale: "el" | "en") {
  const nutrition = food.nutrition;
  const kcal = formatNumber(nutrition?.kcal_per_100g, 1);
  const protein = formatNumber(nutrition?.protein_percent, 1);
  const fat = formatNumber(nutrition?.fat_percent, 1);
  const fiber = formatNumber(nutrition?.fiber_percent, 1);

  const values = [
    kcal !== null ? `${kcal} kcal/100g` : "",
    protein !== null ? `${protein}% ${locale === "el" ? "πρωτεΐνη" : "protein"}` : "",
    fat !== null ? `${fat}% ${locale === "el" ? "λιπαρά" : "fat"}` : "",
    fiber !== null ? `${fiber}% ${locale === "el" ? "ίνες" : "fiber"}` : "",
  ].filter(Boolean);

  if (values.length === 0) return "";

  return `- ${locale === "el" ? "Με μια ματιά" : "At a glance"}: ${values.join("; ")}`;
}

function nutritionFitExplanation(
  food: FoodV2ChatbotRecommendationItem,
  goal: FoodV2RecommendationGoal,
  locale: "el" | "en"
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
    const numbers =
      locale === "el"
        ? [
            kcal !== null ? `${kcal} kcal/100g` : "",
            fat !== null ? `${fat}% λιπαρά` : "",
          ].filter(Boolean)
        : [
            kcal !== null ? `${kcal} kcal/100g` : "",
            fat !== null ? `${fat}% fat` : "",
          ].filter(Boolean);

    if (locale === "el") {
      return numbers.length > 0
        ? `- Χρήση: υποψήφια για στειρωμένα ή επιρρεπή σε βάρος ζώα (${numbers.join(", ")}).`
        : "- Χρήση: έχει λογική για έλεγχο βάρους ή στειρωμένο ζώο, αλλά θέλει επιβεβαίωση θερμίδων πριν από ακριβή δοσολογία.";
    }

    return numbers.length > 0
      ? `- Use case: calorie-aware shortlist for sterilised or weight-prone pets (${numbers.join(", ")}).`
      : "- Use case: positioned for weight or sterilised-pet control; confirm calories before portion advice.";
  }

  if (goal === "growth") {
    const mineralText =
      calcium !== null && phosphorus !== null
        ? `Ca ${calcium}% / P ${phosphorus}%`
        : "calcium and phosphorus still need confirmation";

    if (locale === "el") {
      const greekMineralText =
        calcium !== null && phosphorus !== null
          ? `Ca ${calcium}% / P ${phosphorus}%`
          : "θέλει ακόμη επιβεβαίωση ασβεστίου και φωσφόρου";
      return `- Χρήση: επιλογή με λογική ανάπτυξης. ${greekMineralText}.`;
    }

    return `- Use case: growth-focused option; ${mineralText}.`;
  }

  if (goal === "allergy") {
    if (locale === "el") {
      return "- Χρήση: shortlist αποφυγής συστατικών με βάση τα διαθέσιμα συστατικά. Για πραγματική αλλεργία, χρειάζεται elimination trial με κτηνίατρο.";
    }

    return "- Use case: ingredient-avoidance shortlist based on the available ingredient text; use a vet-guided elimination trial for true allergy work.";
  }

  if (goal === "sensitive_digestion") {
    if (locale === "el") {
      return reasons.includes("sensitive") || reasons.includes("digest")
        ? "- Χρήση: shortlist για ευαίσθητη πέψη ή GI προσανατολισμό."
        : "- Χρήση: γενικό adult fit, αλλά τα digestion-specific δεδομένα είναι περιορισμένα.";
    }

    return reasons.includes("sensitive") || reasons.includes("digest")
      ? "- Use case: digestion-focused shortlist with sensitive/GI positioning."
      : "- Use case: general adult fit while digestion-specific data is limited.";
  }

  if (goal === "urinary" || goal === "renal") {
    if (locale === "el") {
      return cautions.includes("missing") || cautions.includes("weaker")
        ? "- Χρήση: τροφή με σχετικό προσανατολισμό, αλλά τα κενά στα μέταλλα θέλουν προσεκτική διατύπωση."
        : "- Χρήση: τροφή με σχετικό προσανατολισμό. Να χρησιμοποιείται μαζί με κτηνιατρική καθοδήγηση.";
    }

    return cautions.includes("missing") || cautions.includes("weaker")
      ? "- Use case: condition-positioned option, but mineral gaps mean cautious wording is needed."
      : "- Use case: condition-positioned option; use alongside veterinary guidance.";
  }

  if (goal === "senior") {
    if (locale === "el") {
      return protein !== null
        ? `- Χρήση: senior shortlist με ${protein}% πρωτεΐνη. Θέλει παρακολούθηση βάρους, όρεξης και μυϊκής κατάστασης.`
        : "- Χρήση: senior shortlist. Θέλει παρακολούθηση βάρους, όρεξης και μυϊκής κατάστασης.";
    }

    return protein !== null
      ? `- Use case: senior-fit shortlist with ${protein}% protein; watch weight, appetite, and muscle condition.`
      : "- Use case: senior-fit shortlist; watch weight, appetite, and muscle condition.";
  }

  if (locale === "el") {
    return "- Χρήση: γενικό fit με βάση είδος, ηλικία, συστατικά και διαθέσιμα θρεπτικά δεδομένα.";
  }

  return "- Use case: general formula fit based on species, life stage, ingredients, and available nutrition data.";
}

function recommendationRoleLine(role: "premium" | "value", locale: "el" | "en") {
  if (locale === "el") {
    if (role === "premium") {
      return "- Ρόλος: πιο δυνατή διατροφικά επιλογή για αυτό το προφίλ.";
    }

    return "- Ρόλος: πιο value εναλλακτική, αν θέλεις κάτι πιο απλό ή οικονομικό.";
  }

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
  const missing = missingNutritionFields(food);
  const reasons = (food.ranking?.reasons ?? [])
    .filter((reason) => !reason.toLowerCase().includes("matches the pet species"))
    .map((reason) => translateRankingText(reason, locale))
    .slice(0, 2);
  const optionLabel = locale === "el" ? "Επιλογή" : "Option";
  const whyLabel = locale === "el" ? "Γιατί ταιριάζει" : "Why it fits";

  return [
    `${optionLabel} ${index}: ${foodName(food) || "Unnamed food"}${
      typeof score === "number" ? ` (${score}/100)` : ""
    }`,
    recommendationRoleLine(role, locale),
    nutritionFitExplanation(food, goal, locale),
    customerNutritionSnapshot(food, locale),
    reasons.length > 0 ? `- ${whyLabel}: ${reasons.join("; ")}` : "",
    missing.length > 0 && locale === "en"
      ? "- Some detailed minerals are not available yet, so portion and health-specific advice should stay cautious."
      : "",
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
    locale === "el"
      ? "Αν θέλεις να ξεκινήσεις από μία επιλογή, αυτή είναι η πιο δυνατή πρώτη πρόταση με βάση τα στοιχεία του κατοικιδίου."
      : "If you want to start with one option, this is the strongest first pick for the pet profile.",
    nutritionFitExplanation(food, goal, locale),
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
    "Data is usable but still needs review.",
    "Retailer source should be worded cautiously.",
    "Detailed mineral data is incomplete.",
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
        ? "Εναλλακτικές τροφές που αξίζει να κοιτάξεις:"
        : "Alternative foods worth considering:"
      : locale === "el"
        ? "Προτεινόμενες τροφές:"
        : "Recommended foods:";

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
        ? "Δεν βρήκα αρκετά κατάλληλη πρόταση για αυτό το κατοικίδιο με τα στοιχεία που έχουμε τώρα."
        : "I did not find a suitable enough recommendation for this pet with the current context.",
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
    locale === "el"
      ? "Παρακάτω θα δεις πρώτα τις πιο δυνατές διατροφικά επιλογές και μετά πιο απλές/value εναλλακτικές."
      : "Below are the strongest nutrition fits first, followed by simpler value-style alternatives.",
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
      locale === "el" ? "Οι καλύτερες επιλογές:" : "Best options:",
      premium
        .slice(0, maxItemsPerSection)
        .map((food, index) => formatFood(food, index + 1, locale, goal, "premium"))
        .join("\n")
    );
  }

  if (value.length > 0) {
    blocks.push(
      "",
      locale === "el" ? "Πιο απλές / value εναλλακτικές:" : "Value-style alternatives:",
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
      ? "Για ουρολογικό, νεφρικό, διαβήτη, παγκρεατίτιδα, έντονο εμετό, διάρροια, αίμα ή ανορεξία, μίλα πρώτα με κτηνίατρο."
      : "Use this as a shopping shortlist, not a diagnosis or treatment plan. For urinary, kidney, diabetes, pancreatitis, severe allergy, vomiting, diarrhea, blood, or not eating, speak with a veterinarian first."
  );

  return blocks.join("\n");
}
