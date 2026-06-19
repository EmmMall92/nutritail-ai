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
  locale?: "el" | "en";
  maxItemsPerSection?: number;
  compactForCards?: boolean;
};

const GOAL_LABELS_EN: Record<FoodV2RecommendationGoal, string> = {
  general: "general fit",
  premium: "premium fit",
  value: "value fit",
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

const legacyGreekMojibakePattern =
  /(?:\?{3,}|\u0392\u00ae|\ufffd|[\u039e\u039f][\u0080-\u00ff\u0370-\u03ff])/gu;
const isoGreekDecoder = new TextDecoder("iso-8859-7");
const isoGreekReverseMap = new Map<string, number>();

for (let byte = 0; byte <= 255; byte += 1) {
  isoGreekReverseMap.set(isoGreekDecoder.decode(Uint8Array.of(byte)), byte);
}

function repairLegacyGreekMojibake(value: string) {
  const markers = value.match(legacyGreekMojibakePattern) ?? [];
  if (markers.length < 2) return value;

  const bytes: number[] = [];
  for (const char of value) {
    const byte = isoGreekReverseMap.get(char);
    if (byte !== undefined) {
      bytes.push(byte);
    } else if (char.charCodeAt(0) <= 255) {
      bytes.push(char.charCodeAt(0));
    } else {
      return value;
    }
  }

  return new TextDecoder("utf-8").decode(Uint8Array.from(bytes));
}

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
      "\u03c6\u03b1\u03b3\u03bf\u03c5\u03c1",
      "\u03ba\u03bd\u03b7\u03c3",
      "\u03b4\u03b5\u03c1\u03bc",
      "\u03c9\u03c4\u03b9\u03c4",
      "φαγουρ",
      "δερμ",
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
      "\u03bf\u03c5\u03c1\u03bf\u03bb\u03bf\u03b3",
      "\u03bf\u03c5\u03c1\u03b7\u03c4",
      "\u03c3\u03c4\u03c1\u03bf\u03c5\u03b2",
      "\u03ba\u03c1\u03c5\u03c3\u03c4\u03b1\u03bb\u03bb",
      "\u03bf\u03be\u03b1\u03bb",
      "\u03bb\u03b9\u03b8",
      "ουρολογ",
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
      "\u03bd\u03b5\u03c6\u03c1",
      "\u03bf\u03c5\u03c1\u03b9\u03b1",
      "\u03bf\u03c5\u03c1\u03af\u03b1",
      "\u03ba\u03c1\u03b5\u03b1\u03c4\u03b9\u03bd",
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
      "\u03b2\u03b1\u03c1\u03bf\u03c2",
      "\u03b2\u03ac\u03c1\u03bf\u03c2",
      "\u03c0\u03b1\u03c7\u03c5",
      "\u03c0\u03b1\u03c7\u03cd",
      "\u03c0\u03b1\u03c7\u03b1\u03b9\u03bd",
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
      "\u03c0\u03b5\u03c8\u03b7",
      "\u03c0\u03ad\u03c8\u03b7",
      "\u03b4\u03b9\u03b1\u03c1\u03c1\u03bf\u03b9\u03b1",
      "\u03b4\u03b9\u03ac\u03c1\u03c1\u03bf\u03b9\u03b1",
      "\u03b1\u03b5\u03c1\u03b9\u03b1",
      "\u03b1\u03ad\u03c1\u03b9\u03b1",
      "\u03b5\u03bc\u03b5\u03c4",
      "\u03bc\u03b1\u03bb\u03b1\u03ba\u03b1 \u03ba\u03bf\u03c0\u03c1\u03b1\u03bd\u03b1",
      "\u03bc\u03b1\u03bb\u03b1\u03ba\u03ac \u03ba\u03cc\u03c0\u03c1\u03b1\u03bd\u03b1",
      "\u03c0\u03b1\u03b3\u03ba\u03c1\u03b5\u03b1\u03c4",
      "πέψη",
      "διάρροια",
      "αέρια",
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
  const brand = String(food.brand ?? "").replace(/\s+/g, " ").trim();
  let displayName = String(food.display_name ?? "").replace(/\s+/g, " ").trim();

  if (brand && displayName.toLowerCase().startsWith(brand.toLowerCase())) {
    return displayName;
  }

  const firstBrandWord = brand.split(/\s+/)[0];
  if (firstBrandWord) {
    displayName = displayName.replace(
      new RegExp(`^${escapeRegExp(firstBrandWord)}\\s+${escapeRegExp(firstBrandWord)}\\s+`, "i"),
      firstBrandWord + " "
    );
  }

  return [brand, displayName].filter(Boolean).join(" - ");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    ? `\u0393\u03b9\u03b1 \u03b1\u03c5\u03c4\u03cc \u03c4\u03bf \u03ba\u03b1\u03c4\u03bf\u03b9\u03ba\u03af\u03b4\u03b9 \u03ba\u03bf\u03b9\u03c4\u03ac\u03bc\u03b5 \u03ba\u03c5\u03c1\u03af\u03c9\u03c2: ${goalLabel}.`
    : `For this pet, I am prioritising: ${goalLabel}.`;
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

  if (goal === "sterilised" || goal === "weight_control") {
    return locale === "el"
      ? "ταιριάζει καλύτερα σε έλεγχο θερμίδων και βάρους"
      : "fits calorie and weight-control needs";
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
    return locale === "el"
      ? "έχει ουρολογική λογική και θέλει χρήση μαζί με κτηνιατρική καθοδήγηση"
      : "has urinary-support logic and should be used with veterinary guidance";
  }
  if (goal === "renal") {
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
  if (text.includes("preferred protein") || text.includes("preferred flavor")) {
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
  if (text.includes("large breed") || text.includes("calcium") || text.includes("phosphorus")) {
    return locale === "el"
      ? "Σε μεγαλόσωμο κουτάβι θέλουμε έλεγχο ασβεστίου και φωσφόρου."
      : "Large-breed puppies need calcium and phosphorus checked.";
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
    `   Why it fits: ${reason}.`,
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
        ? "Πρώτες value επιλογές:"
        : "Πιο δυνατές διατροφικά εναλλακτικές:";
    }

    return role === "premium"
      ? "First value picks:"
      : "Stronger nutrition alternatives:";
  }

  if (locale === "el") {
    return role === "premium" ? "Καλύτερες διατροφικά επιλογές:" : "Πιο απλές / value επιλογές:";
  }

  return role === "premium" ? "Best options for this pet:" : "Value-friendly alternatives:";
}

function nextStepLine(locale: "el" | "en") {
  return locale === "el"
    ? "Επόμενο βήμα: διάλεξε μία τροφή από τις κάρτες για να υπολογίσουμε περίπου γραμμάρια/ημέρα."
    : "Next step: choose a food card to calculate daily grams.";
}

function vetSafetyLine(locale: "el" | "en", goal: FoodV2RecommendationGoal) {
  const medicalGoal = goal === "urinary" || goal === "renal";
  if (locale === "el") {
    return medicalGoal
      ? "Για ουρολογικό ή νεφρικό ιστορικό, η τελική επιλογή τροφής πρέπει να συμφωνεί με τον/την κτηνίατρο."
      : "Η πρόταση είναι διατροφική καθοδήγηση και δεν αντικαθιστά κτηνιατρική συμβουλή.";
  }

  return medicalGoal
    ? "For urinary or kidney history, final diet choice should match veterinary guidance."
    : "This is nutrition guidance and does not replace veterinary advice.";
}

function compactCardsIntro({
  goal,
  goalLabel,
  top,
  locale,
}: {
  goal: FoodV2RecommendationGoal;
  goalLabel: string;
  top: FoodV2ChatbotRecommendationItem;
  locale: "el" | "en";
}) {
  const name = foodName(top);
  const reason = customerReason(top, goal, locale);
  const snapshot = nutritionSnapshot(top, locale);

  if (locale === "el") {
    return cleanOutput(
      [
        "Έτοιμο. Έβαλα τις καλύτερες επιλογές σε κάρτες από κάτω.",
        recommendationFocusLine(locale, goalLabel),
        `Πρώτη κατεύθυνση: ${name}, γιατί ${reason}.`,
        snapshot,
        "Πάτησε μία κάρτα για να υπολογίσουμε περίπου γραμμάρια/ημέρα.",
        vetSafetyLine(locale, goal),
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  return cleanOutput(
    [
      "Done. I placed the best options below as cards.",
      recommendationFocusLine(locale, goalLabel),
      `First direction: ${name}, because it ${reason}.`,
      snapshot,
      "Tap one card to estimate grams/day.",
      vetSafetyLine(locale, goal),
    ]
      .filter(Boolean)
      .join("\n")
  );
}

function cleanOutput(text: string) {
  return polishGreekCustomerText(repairLegacyGreekMojibake(text))
    .split(/\r?\n/)
    .filter((line) => !isInternalLine(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function polishGreekCustomerText(text: string) {
  return text
    .replace(/\bWeight Control\b/g, "\u0388\u03bb\u03b5\u03b3\u03c7\u03bf\u03c2 \u03b2\u03ac\u03c1\u03bf\u03c5\u03c2")
    .replace(/\bSenior Nutrition\b/g, "\u0394\u03b9\u03b1\u03c4\u03c1\u03bf\u03c6\u03ae senior")
    .replace(/\bHigh Activity\b/g, "\u03a5\u03c8\u03b7\u03bb\u03ae \u03b4\u03c1\u03b1\u03c3\u03c4\u03b7\u03c1\u03b9\u03cc\u03c4\u03b7\u03c4\u03b1")
    .replace(
      /Fat is not low enough to be a first pick for a sterilised or weight-control case\./gi,
      "\u0398\u03ad\u03bb\u03b5\u03b9 \u03bc\u03b5\u03c4\u03c1\u03b7\u03bc\u03ad\u03bd\u03b7 \u03bc\u03b5\u03c1\u03af\u03b4\u03b1, \u03b5\u03b9\u03b4\u03b9\u03ba\u03ac \u03b1\u03bd \u03c5\u03c0\u03ac\u03c1\u03c7\u03b5\u03b9 \u03c4\u03ac\u03c3\u03b7 \u03b3\u03b9\u03b1 \u03b2\u03ac\u03c1\u03bf\u03c2."
    )
    .replace(
      /Active\/performance food does not fit this weight-loss context\./gi,
      "\u03a4\u03c1\u03bf\u03c6\u03ae active/performance \u03b4\u03b5\u03bd \u03b5\u03af\u03bd\u03b1\u03b9 \u03ba\u03b1\u03bb\u03ae \u03c0\u03c1\u03ce\u03c4\u03b7 \u03b5\u03c0\u03b9\u03bb\u03bf\u03b3\u03ae \u03b3\u03b9\u03b1 \u03c3\u03c4\u03cc\u03c7\u03bf \u03b1\u03c0\u03ce\u03bb\u03b5\u03b9\u03b1\u03c2 \u03b2\u03ac\u03c1\u03bf\u03c5\u03c2."
    )
    .replace(
      /Low-fat formulas are not a credible first pick for active weight-gain cases\./gi,
      "\u03a4\u03c1\u03bf\u03c6\u03ad\u03c2 \u03bc\u03b5 \u03c0\u03bf\u03bb\u03cd \u03c7\u03b1\u03bc\u03b7\u03bb\u03ac \u03bb\u03b9\u03c0\u03b1\u03c1\u03ac \u03b4\u03b5\u03bd \u03b5\u03af\u03bd\u03b1\u03b9 \u03b9\u03b4\u03b1\u03bd\u03b9\u03ba\u03ae \u03c0\u03c1\u03ce\u03c4\u03b7 \u03b5\u03c0\u03b9\u03bb\u03bf\u03b3\u03ae \u03b3\u03b9\u03b1 \u03b4\u03c1\u03b1\u03c3\u03c4\u03ae\u03c1\u03b9\u03bf \u03b6\u03ce\u03bf \u03c0\u03bf\u03c5 \u03c7\u03c1\u03b5\u03b9\u03ac\u03b6\u03b5\u03c4\u03b1\u03b9 \u03b1\u03cd\u03be\u03b7\u03c3\u03b7 \u03b2\u03ac\u03c1\u03bf\u03c5\u03c2."
    )
    .replace(/\bMatches adult life stage\b/gi, "\u03c4\u03b1\u03b9\u03c1\u03b9\u03ac\u03b6\u03b5\u03b9 \u03c3\u03b5 \u03b5\u03bd\u03ae\u03bb\u03b9\u03ba\u03bf \u03b6\u03ce\u03bf")
    .replace(/\bIngredient data is available\b/gi, "\u03c5\u03c0\u03ac\u03c1\u03c7\u03bf\u03c5\u03bd \u03c3\u03c4\u03bf\u03b9\u03c7\u03b5\u03af\u03b1 \u03c3\u03c5\u03c3\u03c4\u03b1\u03c4\u03b9\u03ba\u03ce\u03bd");
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
  const intro =
    options.mode === "alternative"
      ? locale === "el"
        ? "Εναλλακτικές τροφές που αξίζει να κοιτάξεις:"
        : "Alternative foods worth considering:"
      : locale === "el"
        ? "Προτεινόμενες τροφές:"
        : "Food picks for this pet:";
  const topForCards = premium[0] ?? value[0];

  if (options.compactForCards && topForCards) {
    return compactCardsIntro({
      goal,
      goalLabel: goalLabel ?? goal,
      top: topForCards,
      locale,
    });
  }

  if (premium.length === 0 && value.length === 0) {
    return cleanOutput([
      intro,
      "",
      recommendationFocusLine(locale, goalLabel ?? goal),
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
          ? "Κράτησα εκτός shortlist τροφές που δεν ταίριαζαν αρκετά σε μέγεθος, ηλικία, στόχο ή δηλωμένες αποφυγές."
          : "I kept foods out of the shortlist when they did not fit size, life stage, goal, or declared avoidances closely enough."
        : "",
      "",
      locale === "el"
        ? "Καλύτερο επόμενο βήμα: δώσε μου άλλη προτίμηση γεύσης ή πρόσθεσε πιο ακριβή στοιχεία για το κατοικίδιο."
        : "Best next step: share another flavour preference or more precise pet details.",
    ].filter(Boolean).join("\n"));
  }

  const top = premium[0] ?? value[0];
  const blocks = [
    intro,
    "",
    recommendationFocusLine(locale, goalLabel ?? goal),
    top
      ? locale === "el"
        ? `Πρώτη κατεύθυνση: ${foodName(top)}, γιατί ${customerReason(top, goal, locale)}.`
        : `First direction: ${foodName(top)}, because it ${customerReason(top, goal, locale)}.`
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
