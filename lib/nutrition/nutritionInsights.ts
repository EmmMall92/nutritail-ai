export type NutritionInsightInput = {
  species?: string | null;
  neutered?: boolean | null;
  activityLevel?: string | null;
  weightGoal?: string | null;
  healthIssues?: string[] | null;

  protein?: number | null;
  fat?: number | null;
  fiber?: number | null;

  calcium?: number | null;
  phosphorus?: number | null;
  magnesium?: number | null;
  sodium?: number | null;

  kcalPer100g?: number | null;

  dataQualityStatus?: string | null;
  ingredients?: string | null;
};

export type NutritionInsightResult = {
  positives: string[];
  cautions: string[];
  summary: string;
  confidence: "low" | "moderate" | "high";
};

export type NutritionInsightLocale = "el" | "en";

const COPY = {
  en: {
    highProtein: "High protein may help support muscle maintenance.",
    lowProtein: "Protein level may be relatively low for some pets.",
    highFat: "Higher fat foods may require portion control.",
    balancedFat: "Balanced fat level may help support daily energy.",
    fiber: "Fiber may help improve satiety and digestion.",
    neutered: "Sterilized pets may benefit from calorie monitoring.",
    weightLoss: "Weight loss plans require controlled calorie intake.",
    obesity: "Obesity management may require lower calorie density foods.",
    highCalories: "High calorie density may increase overfeeding risk.",
    moderateCalories: "Moderate calorie density may help portion control.",
    calciumPhosphorus:
      "Calcium to phosphorus balance appears within a generally acceptable range.",
    calciumPhosphorusCaution:
      "Calcium to phosphorus ratio may need closer review.",
    controlledMagnesium:
      "Controlled magnesium may be helpful for urinary-sensitive cats.",
    highMagnesium:
      "Magnesium appears relatively high for urinary-sensitive cats.",
    highSodium:
      "Sodium appears relatively high and may require attention in sensitive pets.",
    broadAnimalTerms:
      "Ingredient list includes broad animal derivative terms, so quality confidence is lower.",
    positiveSummary: "This food appears nutritionally balanced for many pets.",
    cautionSummary:
      "This food may require closer monitoring depending on your pet.",
    neutralSummary: "This food may be suitable depending on your pet's needs.",
  },
  el: {
    highProtein: "Η αυξημένη πρωτεΐνη μπορεί να βοηθήσει στη διατήρηση της μυϊκής μάζας.",
    lowProtein: "Η πρωτεΐνη είναι σχετικά χαμηλή για ορισμένα κατοικίδια.",
    highFat: "Τα υψηλότερα λιπαρά χρειάζονται προσεκτικά μετρημένη μερίδα.",
    balancedFat: "Τα λιπαρά βρίσκονται σε ισορροπημένο επίπεδο για την καθημερινή ενέργεια.",
    fiber: "Οι αυξημένες ίνες μπορούν να βοηθήσουν στον κορεσμό και την πέψη.",
    neutered: "Σε στειρωμένο ζώο χρειάζεται παρακολούθηση θερμίδων και βάρους.",
    weightLoss: "Η απώλεια βάρους χρειάζεται ελεγχόμενες ημερήσιες θερμίδες.",
    obesity: "Η διαχείριση παχυσαρκίας συνήθως χρειάζεται χαμηλότερη θερμιδική πυκνότητα.",
    highCalories: "Η υψηλή θερμιδική πυκνότητα αυξάνει τον κίνδυνο υπερσίτισης.",
    moderateCalories: "Η μέτρια θερμιδική πυκνότητα βοηθά στον έλεγχο της μερίδας.",
    calciumPhosphorus:
      "Η αναλογία ασβεστίου προς φώσφορο βρίσκεται σε γενικά αποδεκτό εύρος.",
    calciumPhosphorusCaution:
      "Η αναλογία ασβεστίου προς φώσφορο χρειάζεται πιο προσεκτικό έλεγχο.",
    controlledMagnesium:
      "Το ελεγχόμενο μαγνήσιο μπορεί να βοηθήσει γάτες με ουρολογική ευαισθησία.",
    highMagnesium:
      "Το μαγνήσιο φαίνεται σχετικά υψηλό για γάτα με ουρολογική ευαισθησία.",
    highSodium:
      "Το νάτριο φαίνεται σχετικά υψηλό και χρειάζεται προσοχή σε ευαίσθητα ζώα.",
    broadAnimalTerms:
      "Η λίστα συστατικών χρησιμοποιεί γενικούς ζωικούς όρους, επομένως η εικόνα είναι λιγότερο συγκεκριμένη.",
    positiveSummary: "Η τροφή έχει συνολικά καλή διατροφική εικόνα.",
    cautionSummary: "Η τροφή χρειάζεται προσεκτικότερη παρακολούθηση για αυτό το προφίλ.",
    neutralSummary: "Η καταλληλότητα της τροφής εξαρτάται από τις ανάγκες του κατοικιδίου.",
  },
} as const;

function toFiniteNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return null;

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function hasHealthIssue(
  healthIssues: string[] | null | undefined,
  keywords: string[]
) {
  return (healthIssues ?? [])
    .map((issue) => issue.trim().toLowerCase())
    .filter(Boolean)
    .some((issue) => keywords.some((keyword) => issue.includes(keyword)));
}

export function generateNutritionInsights(
  input: NutritionInsightInput,
  locale: NutritionInsightLocale = "en"
): NutritionInsightResult {
  const positives: string[] = [];
  const cautions: string[] = [];
  const copy = COPY[locale];

  const protein = toFiniteNumber(input.protein);
  const fat = toFiniteNumber(input.fat);
  const fiber = toFiniteNumber(input.fiber);
  const kcal = toFiniteNumber(input.kcalPer100g);

  const calcium = toFiniteNumber(input.calcium);
  const phosphorus = toFiniteNumber(input.phosphorus);
  const magnesium = toFiniteNumber(input.magnesium);
  const sodium = toFiniteNumber(input.sodium);

  if (protein !== null) {
    if (protein >= 32) {
      positives.push(copy.highProtein);
    } else if (protein < 24) {
      cautions.push(copy.lowProtein);
    }
  }

  if (fat !== null) {
    if (fat >= 20) {
      cautions.push(copy.highFat);
    }

    if (fat >= 10 && fat <= 18) {
      positives.push(copy.balancedFat);
    }
  }

  if (fiber !== null && fiber >= 5) {
    positives.push(copy.fiber);
  }

  if (input.neutered) {
    cautions.push(copy.neutered);
  }

  if (input.weightGoal === "loss") {
    cautions.push(copy.weightLoss);
  }

  if (hasHealthIssue(input.healthIssues, ["obesity", "overweight"])) {
    cautions.push(copy.obesity);
  }

  if (kcal !== null) {
    if (kcal > 420) {
      cautions.push(copy.highCalories);
    }

    if (kcal >= 300 && kcal <= 390) {
      positives.push(copy.moderateCalories);
    }
  }

  if (calcium !== null && phosphorus !== null && phosphorus > 0) {
    const ratio = calcium / phosphorus;

    if (ratio >= 1 && ratio <= 2) {
      positives.push(copy.calciumPhosphorus);
    } else {
      cautions.push(copy.calciumPhosphorusCaution);
    }
  }

  if (input.species === "cat" && magnesium !== null) {
    if (magnesium <= 0.09) {
      positives.push(copy.controlledMagnesium);
    } else if (magnesium > 0.12) {
      cautions.push(copy.highMagnesium);
    }
  }

  if (sodium !== null && sodium > 0.5) {
    cautions.push(copy.highSodium);
  }

  let confidence: "low" | "moderate" | "high" = "moderate";
  let availableData = 0;

  const fields = [
    protein,
    fat,
    fiber,
    kcal,
    calcium,
    phosphorus,
    magnesium,
    sodium,
  ];

  fields.forEach((value) => {
    if (value !== null && value !== undefined) {
      availableData += 1;
    }
  });

  if (availableData >= 6) {
    confidence = "high";
  } else if (availableData <= 2) {
    confidence = "low";
  }

  const ingredientText = String(input.ingredients ?? "").toLowerCase();

  const hasBroadAnimalTerms =
    ingredientText.includes("by-products") ||
    ingredientText.includes("animal derivatives") ||
    ingredientText.includes("meat derivatives");

  if (hasBroadAnimalTerms) {
    cautions.push(copy.broadAnimalTerms);
    confidence = "low";
  }

  if (
    input.dataQualityStatus === "verified" &&
    availableData >= 6 &&
    !hasBroadAnimalTerms
  ) {
    confidence = "high";
  }

  if (input.dataQualityStatus === "partial" && confidence === "high") {
    confidence = "moderate";
  }

  if (
    input.dataQualityStatus === "needs_review" ||
    input.dataQualityStatus === "unknown"
  ) {
    confidence = "low";
  }

  const summary =
    positives.length > cautions.length
      ? copy.positiveSummary
      : cautions.length > positives.length
        ? copy.cautionSummary
        : copy.neutralSummary;

  return {
    positives,
    cautions,
    summary,
    confidence,
  };
}
