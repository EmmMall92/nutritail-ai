import type {
  FoodV2RecommendationGoal,
  FoodV2RankingResult,
} from "@/lib/food-v2/recommendationRanking";

type RecommendationFood = {
  brand?: string | null;
  display_name?: string | null;
  data_quality_status?: string | null;
  data_source_url?: string | null;
  ranking?: Pick<
    FoodV2RankingResult,
    "confidence" | "reasons" | "cautions" | "bucket" | "value_score"
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

function customerText(value: string) {
  return repairLegacyGreekMojibake(value);
}

function foodName(food: RecommendationFood) {
  return [food.brand, food.display_name].filter(Boolean).join(" ").trim() || "Unknown food";
}

function compactReasons(food: RecommendationFood, locale: "el" | "en") {
  const reasons = food.ranking?.reasons?.slice(0, 2) ?? [];
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

  if (confidence === "high" || quality === "verified") return "strong fit";
  if (confidence === "low") return "cautious fit";
  return "good fit";
}

function renderFoodItem(food: RecommendationFood, index: number, locale: "el" | "en") {
  const name = foodName(food);
  const reasons = compactReasons(food, locale);
  const confidence = confidencePhrase(food, locale);

  if (locale === "el") {
    return `${index}. ${name}: ${reasons}. (${confidence})`;
  }

  return `${index}. ${name}: ${reasons}. (${confidence})`;
}

function collectCautions(input: FoodV2RecommendationResponseInput, locale: "el" | "en") {
  const foods = [...(input.premium ?? []), ...(input.value ?? [])];
  const cautions = new Set<string>();

  for (const food of foods) {
    for (const caution of food.ranking?.cautions?.slice(0, 2) ?? []) {
      cautions.add(caution);
    }
  }

  for (const note of input.notes ?? []) cautions.add(note);

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
    if (goal === "allergy") return "Θέλεις να αποκλείσουμε και κάποια γεύση εκτός από αλλεργιογόνα;";
    if (goal === "weight_control") return "Ξέρουμε το ιδανικό βάρος ή το body condition score;";
    if (goal === "urinary" || goal === "renal") return "Υπάρχει σύσταση κτηνιάτρου ή συγκεκριμένη διάγνωση;";
    if (goal === "growth") return "Πόσων μηνών είναι και τι βάρος έχει τώρα;";
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
        ? "Βρήκα επιλογές χωρισμένες σε δυνατές διατροφικά και πιο value προτάσεις."
        : "Δεν βρήκα αρκετά ασφαλή πρόταση με τα τωρινά δεδομένα."
      : premium.length || value.length
        ? "I found options split into stronger nutrition fits and value picks."
        : "I did not find a safe enough recommendation with the current data.";

  const sections = [];
  if (premium.length > 0) {
    sections.push({
      title: locale === "el" ? "Καλύτερες διατροφικά επιλογές" : "Best nutrition fits",
      items: premium.slice(0, 3).map((food, index) => renderFoodItem(food, index + 1, locale)),
    });
  }

  if (value.length > 0) {
    sections.push({
      title: locale === "el" ? "Πιο οικονομικές/value επιλογές" : "Value options",
      items: value.slice(0, 3).map((food, index) => renderFoodItem(food, index + 1, locale)),
    });
  }

  return {
    locale,
    title: customerText(title),
    summary: customerText(summary),
    sections: sections.map((section) => ({
      title: customerText(section.title),
      items: section.items.map(customerText),
    })),
    cautions: collectCautions(input, locale).map(customerText),
    followUpQuestion: customerText(followUpFor(goal, locale)),
  };
}
