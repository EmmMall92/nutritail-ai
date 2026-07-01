import type { FoodV2RecommendationGoal } from "@/lib/food-v2/recommendationRanking";
import { customerFoodName } from "@/lib/food-v2/customerFoodName";

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
  food_intelligence?: {
    score?: number;
    confidence_level?: "high" | "medium" | "low";
    strengths?: string[];
    cautions?: string[];
    best_use_cases?: string[];
    not_ideal_cases?: string[];
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
  preferredProteins?: string[];
  excludedIngredients?: string[];
  locale?: "el" | "en";
  maxItemsPerSection?: number;
  compactForCards?: boolean;
};

const GOAL_LABELS_EN: Record<FoodV2RecommendationGoal, string> = {
  general: "general recommendation",
  premium: "premium options",
  value: "budget-friendly options",
  weight_control: "weight control",
  sensitive_digestion: "sensitive digestion",
  allergy: "ingredient avoidance",
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
  allergy: "αποφυγή συστατικών",
  urinary: "ουρολογική υποστήριξη",
  renal: "νεφρική υποστήριξη",
  growth: "ανάπτυξη",
  sterilised: "στειρωμένο κατοικίδιο",
  senior: "ηλικιωμένο κατοικίδιο",
};

const INTERNAL_NOTE_PATTERNS = [
  /needs[_\s-]?review/i,
  /retailer/i,
  /source tier/i,
  /source priority/i,
  /data quality/i,
  /missing nutrition/i,
  /confidence internals/i,
  /candidate kept out/i,
  /value ranking is a proxy/i,
  /medical-condition matches are ranking support/i,
  /data is usable but still needs review/i,
  /retailer source should be worded cautiously/i,
  /detailed mineral data is incomplete/i,
];

function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasAny(values: string[] | undefined, terms: string[]) {
  const text = normalizeText((values ?? []).join(" "));
  return terms.some((term) => text.includes(normalizeText(term)));
}

function hasVisiblePreferredProteinReason(text: string) {
  return (
    text.includes("formula name visibly matches a preferred protein") ||
    text.includes("matches a preferred protein") ||
    text.includes("matches a preferred flavor") ||
    text.includes("matches a preferred flavour")
  );
}

export function goalFromPetContext(
  pet: FoodV2ChatbotPetContext
): FoodV2RecommendationGoal {
  if ((pet.allergies ?? []).length > 0) return "allergy";
  if (
    hasAny(pet.healthIssues, [
      "allergy",
      "allergic",
      "itch",
      "skin",
      "derma",
      "φαγουρ",
      "κνησ",
      "δερμ",
      "ωτιτ",
    ])
  ) {
    return "allergy";
  }
  if (
    hasAny(pet.healthIssues, [
      "urinary",
      "struvite",
      "oxalate",
      "crystal",
      "stone",
      "urolith",
      "pee",
      "ουρολογ",
      "ουρητ",
      "στρουβ",
      "κρυσταλλ",
      "οξαλ",
      "λιθ",
    ])
  ) {
    return "urinary";
  }
  if (
    hasAny(pet.healthIssues, [
      "renal",
      "kidney",
      "ckd",
      "νεφρ",
      "ουρια",
      "ουρία",
      "κρεατιν",
    ])
  ) {
    return "renal";
  }
  if (
    pet.weightGoal === "loss" ||
    hasAny(pet.healthIssues, [
      "weight",
      "obesity",
      "overweight",
      "βαρος",
      "βάρος",
      "παχυ",
      "παχύ",
      "παχαιν",
    ])
  ) {
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
      "pancreatitis",
      "pancreatic",
      "πεψη",
      "πέψη",
      "διαρροια",
      "διάρροια",
      "αερια",
      "αέρια",
      "εμετ",
      "μαλακα κοπρανα",
      "μαλακά κόπρανα",
      "παγκρεατ",
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
  return customerFoodName(food);
}

function formatNumber(value: number | null | undefined, digits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Number(value.toFixed(digits));
}

function scoreLabel() {
  return "";
}

function recommendationFocusLine(locale: "el" | "en", goalLabel: string) {
  return locale === "el"
    ? `Με βάση αυτά που μου είπες, έφτιαξα λίστα για ${goalLabel}.`
    : `Based on what you told me, I built a shortlist for ${goalLabel}.`;
}

function cleanPreferenceTerms(values: string[] | undefined) {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const value of values ?? []) {
    const item = String(value ?? "").trim();
    if (!item) continue;

    const key = normalizeText(item);
    if (seen.has(key)) continue;

    seen.add(key);
    cleaned.push(item);
  }

  return cleaned.slice(0, 4);
}

function preferenceContextLine(
  locale: "el" | "en",
  options: Pick<
    RecommendationSummaryOptions,
    "preferredProteins" | "excludedIngredients"
  >
) {
  const preferred = cleanPreferenceTerms(options.preferredProteins);
  const excluded = cleanPreferenceTerms(options.excludedIngredients);

  if (preferred.length === 0 && excluded.length === 0) return "";

  if (locale === "el") {
    const parts = [
      preferred.length > 0
        ? `προτίμησα γεύσεις/πρωτεΐνες όπως ${preferred.join(", ")}`
        : "",
      excluded.length > 0 ? `απέφυγα ${excluded.join(", ")}` : "",
    ].filter(Boolean);

    return `Έλαβα υπόψη τις προτιμήσεις του κατοικιδίου: ${parts.join(" και ")}.`;
  }

  const parts = [
    preferred.length > 0
      ? `preferred flavours/proteins such as ${preferred.join(", ")}`
      : "",
    excluded.length > 0 ? `avoided ${excluded.join(", ")}` : "",
  ].filter(Boolean);

  return `I also respected the pet's preferences: ${parts.join(" and ")}.`;
}

function nutritionSnapshot(food: FoodV2ChatbotRecommendationItem, locale: "el" | "en") {
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
  return locale === "el" ? `Με μια ματιά: ${values.join("; ")}` : `At a glance: ${values.join("; ")}`;
}

function isInternalLine(value: string) {
  return INTERNAL_NOTE_PATTERNS.some((pattern) => pattern.test(value));
}

function customerReason(
  food: FoodV2ChatbotRecommendationItem,
  goal: FoodV2RecommendationGoal,
  locale: "el" | "en"
) {
  const text = normalizeText([
    ...(food.ranking?.reasons ?? []),
    ...(food.ranking?.cautions ?? []),
    ...(food.food_intelligence?.strengths ?? []),
    ...(food.food_intelligence?.best_use_cases ?? []),
  ].join(" "));

  if (
    (goal === "sterilised" || goal === "weight_control") &&
    hasVisiblePreferredProteinReason(text)
  ) {
    return locale === "el"
      ? "ταιριάζει σε έλεγχο θερμίδων/βάρους και κρατάει τη γευστική προτίμηση"
      : "fits calorie and weight-control needs while matching the pet's flavour preference";
  }
  if (goal === "sterilised" || goal === "weight_control") {
    return locale === "el"
      ? "ταιριάζει καλύτερα σε έλεγχο θερμίδων και βάρους"
      : "fits calorie and weight-control needs";
  }
  if (goal === "allergy" && hasVisiblePreferredProteinReason(text)) {
    return locale === "el"
      ? "σέβεται τις δηλωμένες αποφυγές και κρατάει προτίμηση γεύσης όπου γίνεται"
      : "respects the declared ingredient avoidances while matching a preferred flavour";
  }
  if (goal === "allergy") {
    return locale === "el"
      ? "σέβεται τις δηλωμένες αποφυγές συστατικών"
      : "respects the declared ingredient avoidances";
  }
  if (goal === "sensitive_digestion" || text.includes("digest") || text.includes("gastro")) {
    return locale === "el"
      ? "είναι πιο κοντά σε ανάγκες ευαίσθητης πέψης"
      : "is closer to sensitive-digestion needs";
  }
  if (goal === "urinary") {
    if (text.includes("urinary_complete_mineral_review")) {
      return locale === "el"
        ? "έχει ουρολογική λογική και διαθέσιμα βασικά στοιχεία μετάλλων για πιο σωστή αξιολόγηση"
        : "has urinary-support positioning with the key mineral context available";
    }
    return locale === "el"
      ? "έχει ουρολογική λογική και θέλει χρήση μαζί με κτηνιατρική καθοδήγηση"
      : "has urinary-support logic and should be used with veterinary guidance";
  }
  if (goal === "renal") {
    if (text.includes("renal_mineral_review")) {
      return locale === "el"
        ? "έχει νεφρική λογική και διαθέσιμα στοιχεία φωσφόρου/νατρίου για πιο σωστή αξιολόγηση"
        : "has renal-support positioning with phosphorus and sodium context available";
    }
    return locale === "el"
      ? "έχει νεφρική λογική και η τελική επιλογή πρέπει να γίνεται με κτηνίατρο"
      : "has renal-support logic and final choice should be vet-guided";
  }
  if (goal === "growth") {
    return locale === "el"
      ? "είναι πιο κοντά στις ανάγκες ανάπτυξης"
      : "is closer to growth needs";
  }
  if (goal === "senior") {
    return locale === "el"
      ? "είναι πιο κοντά σε senior ανάγκες"
      : "is closer to senior needs";
  }
  if (hasVisiblePreferredProteinReason(text)) {
    return locale === "el"
      ? "ταιριάζει με προτίμηση γεύσης ή πρωτεΐνης"
      : "matches a preferred flavour or protein";
  }

  return locale === "el"
    ? "ταιριάζει στο βασικό προφίλ του κατοικιδίου"
    : "fits the pet's basic profile";
}

function customerCaution(value: string, locale: "el" | "en") {
  const text = normalizeText(value);
  if (isInternalLine(value)) return "";

  if (text.includes("fat") || text.includes("energy") || text.includes("calorie")) {
    return locale === "el"
      ? "Θέλει μετρημένη μερίδα, ειδικά αν υπάρχει τάση για βάρος."
      : "Portions should be measured carefully, especially if weight is a concern.";
  }
  if (text.includes("pancreatitis") || text.includes("pancreatic")) {
    return locale === "el"
      ? "Σε ιστορικό παγκρεατίτιδας, η τελική επιλογή τροφής πρέπει να γίνεται με κτηνιατρική καθοδήγηση και προσοχή στα λιπαρά."
      : "For pancreatitis history, final diet choice should be veterinarian-guided and fat level needs careful review.";
  }
  if (text.includes("senior")) {
    return locale === "el"
      ? "Σε senior ζώο παρακολουθούμε βάρος, όρεξη και μυϊκή κατάσταση."
      : "For senior pets, monitor weight, appetite and muscle condition.";
  }
  if (text.includes("renal") || text.includes("kidney")) {
    return locale === "el"
      ? "Σε νεφρικό θέμα η επιλογή τροφής πρέπει να γίνεται με κτηνίατρο."
      : "Kidney cases should be diet-guided with a veterinarian.";
  }
  if (text.includes("urinary")) {
    return locale === "el"
      ? "Σε ουρολογικό ιστορικό χρειάζεται επιβεβαίωση από κτηνίατρο."
      : "Urinary history should be confirmed with a veterinarian.";
  }
  if (
    text.includes("large breed") &&
    (text.includes("puppy") || text.includes("growth"))
  ) {
    return locale === "el"
      ? "Σε μεγαλόσωμο κουτάβι θέλουμε έλεγχο ασβεστίου και φωσφόρου."
      : "Large-breed puppies need calcium and phosphorus checked.";
  }

  return "";
}

function uniqueCustomerCautions(
  foods: FoodV2ChatbotRecommendationItem[],
  locale: "el" | "en"
) {
  const seen = new Set<string>();
  const cautions: string[] = [];

  for (const food of foods) {
    for (const raw of food.ranking?.cautions ?? []) {
      const caution = customerCaution(raw, locale);
      const key = normalizeText(caution);
      if (caution && !seen.has(key)) {
        seen.add(key);
        cautions.push(caution);
      }
    }
  }

  return cautions.slice(0, 2);
}

function formatFood(
  food: FoodV2ChatbotRecommendationItem,
  index: number,
  locale: "el" | "en",
  goal: FoodV2RecommendationGoal
) {
  const name = foodName(food) || (locale === "el" ? "Τροφή χωρίς όνομα" : "Unnamed food");
  const reason = customerReason(food, goal, locale);
  const snapshot = nutritionSnapshot(food, locale);

  if (locale === "el") {
    return [
      `${index}. ${name}${scoreLabel()}`,
      `   Γιατί ταιριάζει: ${reason}.`,
      snapshot ? `   ${snapshot}.` : "",
    ].filter(Boolean).join("\n");
  }

  return [
    `${index}. ${name}${scoreLabel()}`,
    `   Good because: ${reason}.`,
    snapshot ? `   ${snapshot}.` : "",
  ].filter(Boolean).join("\n");
}

function sectionTitle(
  role: "premium" | "value",
  locale: "el" | "en",
  goal?: FoodV2RecommendationGoal
) {
  if (goal === "value") {
    if (locale === "el") {
      return role === "premium"
        ? "Πρώτες οικονομικές επιλογές:"
        : "Άλλες πρακτικές εναλλακτικές:";
    }

    return role === "premium"
      ? "Budget-friendly first choices:"
      : "Practical alternatives:";
  }

  if (locale === "el") {
    return role === "premium" ? "Οι 3 καλύτερες πρώτες επιλογές:" : "3 πιο απλές / οικονομικές επιλογές:";
  }

  return role === "premium" ? "Top 3 first choices:" : "3 simpler / budget-friendly options:";
}

function nextStepLine(locale: "el" | "en") {
  return locale === "el"
    ? "Επόμενο βήμα: πάτησε την τροφή που προτιμάς για να δεις περίπου γραμμάρια/ημέρα και πώς να ξεκινήσεις."
    : "Next step: choose the food you prefer to see the first daily portion in grams and how to start.";
}

function vetSafetyLine(locale: "el" | "en", goal: FoodV2RecommendationGoal) {
  const medicalGoal = goal === "urinary" || goal === "renal";
  if (locale === "el") {
    return medicalGoal
      ? "Για ουρολογικό ή νεφρικό ιστορικό, η τελική επιλογή τροφής πρέπει να συμφωνεί με τον/την κτηνίατρο."
      : "Η πρόταση είναι διατροφική καθοδήγηση και δεν αντικαθιστά κτηνιατρική συμβουλή.";
  }

  return medicalGoal
    ? "For urinary or kidney history, use this as a starting shortlist and confirm the final food with your veterinarian."
    : "This is nutrition guidance for choosing food and does not replace veterinary advice.";
}

function customerMedicalContextLine(locale: "el" | "en", goal: FoodV2RecommendationGoal) {
  if (goal === "urinary") {
    return locale === "el"
      ? "Για ουρολογικό ιστορικό κοιτάω πρώτα ουρολογικές τροφές και στοιχεία όπως μαγνήσιο, φώσφορο και νάτριο."
      : "For urinary history, I prioritise urinary-positioned foods and look for magnesium, phosphorus and sodium context before sounding confident.";
  }

  if (goal === "renal") {
    return locale === "el"
      ? "Για νεφρικό ιστορικό κοιτάω πρώτα renal τροφές και στοιχεία όπως φώσφορο και νάτριο."
      : "For kidney history, I prioritise renal-positioned foods and look for phosphorus and sodium context before sounding confident.";
  }

  if (goal === "senior") {
    return locale === "el"
      ? "Για senior ζώα δεν κοιτάω μόνο την ηλικία: βάρος, όρεξη, μυϊκή κατάσταση και κινητικότητα έχουν σημασία."
      : "For senior pets, I look beyond age: appetite, weight trend, muscle condition and mobility all matter.";
  }

  return "";
}

function compactCardsIntro({
  goal,
  goalLabel,
  top,
  locale,
  preferenceLine,
}: {
  goal: FoodV2RecommendationGoal;
  goalLabel: string;
  top: FoodV2ChatbotRecommendationItem;
  locale: "el" | "en";
  preferenceLine?: string;
}) {
  const name = foodName(top);
  const reason = customerReason(top, goal, locale);
  const snapshot = nutritionSnapshot(top, locale);
  const safetyLine = goal === "urinary" || goal === "renal" ? vetSafetyLine(locale, goal) : "";

  if (locale === "el") {
    return cleanOutput(
      [
        "Έτοιμο. Έβαλα τις καλύτερες επιλογές σε κάρτες από κάτω.",
        recommendationFocusLine(locale, goalLabel),
        preferenceLine,
        customerMedicalContextLine(locale, goal),
        `Ξεκίνα από: ${name}, γιατί ${reason}.`,
        snapshot,
        "Πάτησε μία κάρτα για να δεις περίπου ποσότητα/ημέρα.",
        safetyLine,
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  return cleanOutput(
    [
      "Done. I placed the best options below as cards.",
      recommendationFocusLine(locale, goalLabel),
      preferenceLine,
      customerMedicalContextLine(locale, goal),
      `Start with: ${name}, because it ${reason}.`,
      snapshot,
      "Choose one food card below to see the first daily portion in grams.",
      safetyLine,
    ]
      .filter(Boolean)
      .join("\n")
  );
}

function cleanOutput(text: string) {
  return polishEnglishCustomerText(polishGreekCustomerText(text))
    .split(/\r?\n/)
    .filter((line) => !isInternalLine(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function polishEnglishCustomerText(text: string) {
  return text
    .replace(/\bRecommended foods:/g, "Your food shortlist:")
    .replace(/\bFirst picks:/g, "Best first choices:")
    .replace(/\bSimple alternatives:/g, "Practical alternatives:")
    .replace(/\bPractical first picks:/g, "Budget-friendly first choices:")
    .replace(/\bStronger nutrition alternatives:/g, "Practical alternatives:")
    .replace(/\bAt a glance:/g, "Quick nutrition:")
    .replace(/\bWhy it\s+fits:/g, "Good because:")
    .replace(/\bStart with:/g, "Start here:")
    .replace(
      /Next step: tap one food card to estimate portions\/day\./g,
      "Next step: choose one food card below and I will estimate the first daily portion in grams."
    )
    .replace(
      "Done. I placed the best options below as cards.",
      "Done. I found the best first choices and placed them below as cards."
    );
}

function polishGreekCustomerText(text: string) {
  return text
    .replace(/\bWeight Control\b/g, "Έλεγχος βάρους")
    .replace(/\bSenior Nutrition\b/g, "Διατροφή senior")
    .replace(/\bHigh Activity\b/g, "Υψηλή δραστηριότητα")
    .replace(
      /Fat is not low enough to be a first pick for a sterilised or weight-control case\./gi,
      "Θέλει μετρημένη μερίδα, ειδικά αν υπάρχει τάση για βάρος."
    )
    .replace(
      /Active\/performance food does not fit this weight-loss context\./gi,
      "Τροφή active/performance δεν είναι καλή πρώτη επιλογή για στόχο απώλειας βάρους."
    )
    .replace(
      /Low-fat formulas are not a credible first pick for active weight-gain cases\./gi,
      "Τροφές με πολύ χαμηλά λιπαρά δεν είναι ιδανική πρώτη επιλογή για δραστήριο ζώο που χρειάζεται αύξηση βάρους."
    )
    .replace(/\bMatches adult life stage\b/gi, "ταιριάζει σε ενήλικο ζώο")
    .replace(/\bIngredient data is available\b/gi, "υπάρχουν στοιχεία συστατικών");
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
  const maxItemsPerSection = Math.min(Math.max(options.maxItemsPerSection ?? 3, 1), 3);
  const goalLabel = locale === "el" ? GOAL_LABELS_EL[goal] : GOAL_LABELS_EN[goal];
  const preferenceLine = preferenceContextLine(locale, options);
  const intro =
    options.mode === "alternative"
      ? locale === "el"
        ? "Εναλλακτικές τροφές που αξίζει να κοιτάξεις:"
        : "Alternative foods worth considering:"
      : locale === "el"
        ? "Προτεινόμενες τροφές:"
        : "Recommended foods:";
  const topForCards = premium[0] ?? value[0];

  if (options.compactForCards && topForCards) {
    return compactCardsIntro({
      goal,
      goalLabel: goalLabel ?? goal,
      top: topForCards,
      locale,
      preferenceLine,
    });
  }

  if (premium.length === 0 && value.length === 0) {
    return cleanOutput([
      intro,
      "",
      recommendationFocusLine(locale, goalLabel ?? goal),
      preferenceLine,
      excludedBrands.length > 0
        ? locale === "el"
          ? `Αποφεύγω προσωρινά την τωρινή εταιρεία: ${excludedBrands.join(", ")}`
          : `Avoiding current brand: ${excludedBrands.join(", ")}`
        : "",
      locale === "el"
        ? "Δεν βρήκα αρκετά κατάλληλη πρόταση με τα στοιχεία που έχουμε τώρα."
        : "I did not find a suitable enough recommendation with the current context.",
      hold.length > 0
        ? locale === "el"
          ? "Μερικές τροφές απορρίφθηκαν γιατί δεν ταίριαζαν αρκετά σε μέγεθος, ηλικία, στόχο ή δηλωμένες αποφυγές."
          : "Some foods were skipped because they did not fit the pet's size, life stage, goal, or declared avoidances closely enough."
        : "",
      "",
      locale === "el"
        ? "Καλύτερο επόμενο βήμα: δώσε μου άλλη προτίμηση γεύσης ή πιο ακριβή στοιχεία για το κατοικίδιο."
        : "Best next step: share another flavour preference or more precise pet details.",
    ].filter(Boolean).join("\n"));
  }

  const top = premium[0] ?? value[0];
  const blocks = [
    intro,
    "",
    recommendationFocusLine(locale, goalLabel ?? goal),
    preferenceLine,
    customerMedicalContextLine(locale, goal),
    top
      ? locale === "el"
        ? `Αν θέλεις μία άμεση αρχή, ξεκίνα από ${foodName(top)}, γιατί ${customerReason(top, goal, locale)}.`
        : `If you want one clear starting point, start with ${foodName(top)} because it ${customerReason(top, goal, locale)}.`
      : "",
    excludedBrands.length > 0
      ? locale === "el"
        ? `Αποφεύγω προσωρινά την τωρινή εταιρεία: ${excludedBrands.join(", ")}`
        : `Avoiding current brand: ${excludedBrands.join(", ")}`
      : "",
  ];

  if (premium.length > 0) {
    blocks.push(
      "",
      sectionTitle("premium", locale, goal),
      premium
        .slice(0, maxItemsPerSection)
        .map((food, index) => formatFood(food, index + 1, locale, goal))
        .join("\n\n")
    );
  }

  if (value.length > 0) {
    blocks.push(
      "",
      sectionTitle("value", locale, goal),
      value
        .slice(0, maxItemsPerSection)
        .map((food, index) => formatFood(food, index + 1, locale, goal))
        .join("\n\n")
    );
  }

  const cautions = uniqueCustomerCautions([...premium, ...value], locale);
  if (cautions.length > 0) {
    blocks.push(
      "",
      locale === "el" ? "Κράτα στο μυαλό:" : "Keep in mind:",
      cautions.map((caution) => `- ${caution}`).join("\n")
    );
  }

  blocks.push("", nextStepLine(locale), vetSafetyLine(locale, goal));

  return cleanOutput(blocks.filter(Boolean).join("\n"));
}
