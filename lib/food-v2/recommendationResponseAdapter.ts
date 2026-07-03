import type {
  FoodV2RecommendationGoal,
  FoodV2RankingResult,
} from "@/lib/food-v2/recommendationRanking";
import { customerFoodName } from "@/lib/food-v2/customerFoodName";

type RecommendationFood = {
  brand?: string | null;
  display_name?: string | null;
  data_quality_status?: string | null;
  data_source_url?: string | null;
  ranking?: Partial<
    Pick<
      FoodV2RankingResult,
      "confidence" | "reasons" | "cautions" | "bucket" | "value_score"
    >
  > | null;
  nutrition?: {
    kcal_per_100g?: number | null;
    protein_percent?: number | null;
    fat_percent?: number | null;
    fiber_percent?: number | null;
    calcium_percent?: number | null;
    phosphorus_percent?: number | null;
    sodium_percent?: number | null;
    magnesium_percent?: number | null;
  } | null;
};

export type FoodV2RecommendationResponseInput = {
  goal?: FoodV2RecommendationGoal | string;
  premium?: RecommendationFood[];
  value?: RecommendationFood[];
  hold?: RecommendationFood[];
  notes?: string[];
  locale?: "el" | "en";
};

export type FoodV2RecommendationResponsePlan = {
  locale: "el" | "en";
  title: string;
  summary: string;
  sections: Array<{
    title: string;
    items: string[];
  }>;
  cautions: string[];
  followUpQuestion: string;
};

const GOAL_LABELS_EL: Record<string, string> = {
  general: "γενική επιλογή",
  premium: "premium επιλογή",
  value: "οικονομική επιλογή",
  weight_control: "έλεγχο βάρους",
  sensitive_digestion: "ευαίσθητη πέψη",
  allergy: "αλλεργίες ή αποφυγή συστατικών",
  urinary: "ουρολογική υποστήριξη",
  renal: "νεφρική υποστήριξη",
  growth: "ανάπτυξη",
  sterilised: "στειρωμένο κατοικίδιο",
  senior: "ηλικιωμένο κατοικίδιο",
};

const GOAL_LABELS_EN: Record<string, string> = {
  general: "general recommendation",
  premium: "premium choice",
  value: "value choice",
  weight_control: "weight control",
  sensitive_digestion: "sensitive digestion",
  allergy: "allergy or ingredient avoidance",
  urinary: "urinary support",
  renal: "renal support",
  growth: "growth",
  sterilised: "sterilised pet",
  senior: "senior pet",
};

const INTERNAL_COPY_PATTERNS = [
  /needs[_\s-]?review/i,
  /retailer/i,
  /food\s*v2/i,
  /data quality/i,
  /source tier/i,
  /source priority/i,
  /missing nutrition/i,
  /pass_non_destructive/i,
  /pass_full/i,
  /proof status/i,
  /manual-required/i,
  /internal tooling/i,
  /data is usable/i,
  /candidate kept out/i,
  /value ranking is a proxy/i,
];

function foodName(food: RecommendationFood) {
  return customerFoodName(food, " ");
}

function translateCustomerReason(reason: string, locale: "el" | "en") {
  const text = reason.toLowerCase();

  if (text.includes("matches adult life stage")) {
    return locale === "el"
      ? "ταιριάζει σε ενήλικο κατοικίδιο"
      : "matches the adult life stage";
  }
  if (text.includes("weight-aware") || text.includes("weight-control")) {
    return locale === "el"
      ? "ταιριάζει σε έλεγχο θερμίδων και βάρους"
      : "fits calorie and weight-control needs";
  }
  if (text.includes("ingredient data is available")) {
    return locale === "el"
      ? "έχει αρκετά στοιχεία συστατικών για αρχική αξιολόγηση"
      : "has enough ingredient data for an initial review";
  }

  return reason;
}

function isCustomerSafeLine(value: string) {
  return !INTERNAL_COPY_PATTERNS.some((pattern) => pattern.test(value));
}

function customerReasons(food: RecommendationFood, locale: "el" | "en") {
  return (food.ranking?.reasons ?? [])
    .map((reason) => translateCustomerReason(reason, locale))
    .filter(isCustomerSafeLine)
    .slice(0, 2);
}

function compactReasons(food: RecommendationFood, locale: "el" | "en") {
  const reasons = customerReasons(food, locale);
  if (reasons.length > 0) return reasons.join("; ");

  return locale === "el"
    ? "ταιριάζει στο βασικό προφίλ του κατοικιδίου"
    : "fits the pet's basic profile";
}

function confidencePhrase(food: RecommendationFood, locale: "el" | "en") {
  const confidence = food.ranking?.confidence;
  const quality = food.data_quality_status;

  if (locale === "el") {
    if (confidence === "high" || quality === "verified") return "δυνατή επιλογή";
    if (confidence === "low") return "πιο προσεκτική επιλογή";
    return "καλή επιλογή";
  }

  if (confidence === "high" || quality === "verified") return "strong choice";
  if (confidence === "low") return "choice to review";
  return "good choice";
}

function renderFoodItem(
  food: RecommendationFood,
  index: number,
  locale: "el" | "en"
) {
  return `${index}. ${foodName(food)}: ${compactReasons(
    food,
    locale
  )}. (${confidencePhrase(food, locale)})`;
}

function translateCustomerCaution(caution: string, locale: "el" | "en") {
  const text = caution.toLowerCase();

  if (!isCustomerSafeLine(caution)) return null;
  if (text.includes("fat looks high") || text.includes("fat is not low enough")) {
    return locale === "el"
      ? "Τα λιπαρά θέλουν προσοχή αν υπάρχει τάση για βάρος ή ευαισθησία."
      : "Fat level needs attention if weight gain or sensitivity is a concern.";
  }
  if (text.includes("pancreatitis")) {
    return locale === "el"
      ? "Σε ιστορικό παγκρεατίτιδας, η τελική τροφή πρέπει να επιλεγεί με κτηνίατρο."
      : "With pancreatitis history, final diet choice should be veterinarian-guided.";
  }

  return caution;
}

function collectCautions(
  input: FoodV2RecommendationResponseInput,
  locale: "el" | "en"
) {
  const foods = [...(input.premium ?? []), ...(input.value ?? [])];
  const cautions = new Set<string>();

  for (const food of foods) {
    for (const caution of food.ranking?.cautions?.slice(0, 2) ?? []) {
      const customerCaution = translateCustomerCaution(caution, locale);
      if (customerCaution) cautions.add(customerCaution);
    }
  }

  for (const note of input.notes ?? []) {
    const customerNote = translateCustomerCaution(note, locale);
    if (customerNote) cautions.add(customerNote);
  }

  if (cautions.size === 0) {
    cautions.add(
      locale === "el"
        ? "Οι προτάσεις είναι διατροφική καθοδήγηση, όχι διάγνωση ή θεραπεία."
        : "Recommendations are nutrition guidance, not diagnosis or treatment."
    );
  }

  return [...cautions].slice(0, 4);
}

function followUpFor(goal: string, locale: "el" | "en") {
  if (locale === "el") {
    if (goal === "allergy") {
      return "Θέλεις να αποκλείσουμε και κάποια γεύση εκτός από αλλεργιογόνα;";
    }
    if (goal === "weight_control") {
      return "Ξέρουμε το ιδανικό βάρος ή το body condition score;";
    }
    if (goal === "urinary" || goal === "renal") {
      return "Υπάρχει σύσταση κτηνιάτρου ή συγκεκριμένη διάγνωση;";
    }
    if (goal === "growth") {
      return "Πόσων μηνών είναι και τι βάρος έχει τώρα;";
    }
    return "Θέλεις να δούμε και πιο οικονομικές επιλογές ή μόνο τις καλύτερες διατροφικά;";
  }

  if (goal === "allergy") return "Should we exclude any disliked flavors as well as allergens?";
  if (goal === "weight_control") return "Do we know the ideal weight or body condition score?";
  if (goal === "urinary" || goal === "renal") return "Is there a vet recommendation or confirmed diagnosis?";
  if (goal === "growth") return "How old is the pet in months and what is the current weight?";
  return "Should we also compare value options, or only the strongest nutrition fits?";
}

export function planFoodV2RecommendationResponse(
  input: FoodV2RecommendationResponseInput
): FoodV2RecommendationResponsePlan {
  const locale = input.locale ?? "el";
  const goal = String(input.goal ?? "general");
  const goalLabel = locale === "el" ? GOAL_LABELS_EL[goal] : GOAL_LABELS_EN[goal];
  const premium = input.premium ?? [];
  const value = input.value ?? [];
  const title =
    locale === "el"
      ? `Προτάσεις τροφής για ${goalLabel ?? "το κατοικίδιο"}`
      : `Food recommendations for ${goalLabel ?? "the pet"}`;

  const summary =
    locale === "el"
      ? premium.length || value.length
        ? "Βρήκα επιλογές χωρισμένες σε δυνατές διατροφικά και πιο οικονομικές/πρακτικές προτάσεις."
        : "Δεν βρήκα αρκετά ασφαλή πρόταση με τα τωρινά δεδομένα."
      : premium.length || value.length
        ? "I found options split into stronger nutrition fits and value picks."
        : "I did not find a safe enough recommendation with the current data.";

  const sections = [];
  if (premium.length > 0) {
    sections.push({
      title: locale === "el" ? "Καλύτερες διατροφικά επιλογές" : "Best nutrition fits",
      items: premium
        .slice(0, 3)
        .map((food, index) => renderFoodItem(food, index + 1, locale)),
    });
  }

  if (value.length > 0) {
    sections.push({
      title:
        locale === "el"
          ? "Πιο οικονομικές / πρακτικές επιλογές"
          : "Value options",
      items: value
        .slice(0, 3)
        .map((food, index) => renderFoodItem(food, index + 1, locale)),
    });
  }

  return {
    locale,
    title,
    summary,
    sections,
    cautions: collectCautions(input, locale),
    followUpQuestion: followUpFor(goal, locale),
  };
}
