export type IngredientInsightResult = {
  positives: string[];
  cautions: string[];
};

export type IngredientInsightLocale = "el" | "en";

const COPY = {
  en: {
    missing: "No ingredient list is available yet for review.",
    animalProtein: "Includes a recognizable animal protein source.",
    hydrolysed:
      "Includes hydrolysed or hypoallergenic positioning that may be relevant for supervised allergy trials.",
    broadTerms:
      "Includes broad terms such as derivatives/by-products, which may need closer quality review.",
    carbohydrates:
      "Includes carbohydrate sources such as grains, rice, or potato; these are not automatically negative unless the pet has a known sensitivity or trial restriction.",
    prebiotics: "Includes prebiotic ingredients that may support digestion.",
    omega:
      "Includes omega-3 or DHA/EPA signals that may support skin, coat, and development goals.",
  },
  el: {
    missing: "Δεν υπάρχει ακόμη διαθέσιμη λίστα συστατικών για έλεγχο.",
    animalProtein: "Περιλαμβάνει αναγνωρίσιμη πηγή ζωικής πρωτεΐνης.",
    hydrolysed:
      "Περιλαμβάνει υδρολυμένη ή υποαλλεργική προσέγγιση που μπορεί να αξιοποιηθεί σε οργανωμένη δοκιμή αλλεργίας με επίβλεψη.",
    broadTerms:
      "Χρησιμοποιεί γενικούς όρους για ζωικά παράγωγα, επομένως χρειάζεται πιο προσεκτική αξιολόγηση.",
    carbohydrates:
      "Περιλαμβάνει πηγές υδατανθράκων, όπως δημητριακά, ρύζι ή πατάτα. Δεν είναι αρνητικές από μόνες τους χωρίς γνωστή ευαισθησία.",
    prebiotics: "Περιλαμβάνει πρεβιοτικά συστατικά που μπορούν να υποστηρίξουν την πέψη.",
    omega:
      "Περιλαμβάνει ενδείξεις ωμέγα-3 ή DHA/EPA που μπορούν να υποστηρίξουν δέρμα, τρίχωμα και ανάπτυξη.",
  },
} as const;

export function generateIngredientInsights(
  ingredients?: string | null,
  locale: IngredientInsightLocale = "en"
): IngredientInsightResult {
  const positives: string[] = [];
  const cautions: string[] = [];
  const copy = COPY[locale];

  const text = String(ingredients ?? "").toLowerCase();

  if (!text.trim()) {
    return {
      positives,
      cautions: [copy.missing],
    };
  }

  if (
    text.includes("chicken") ||
    text.includes("turkey") ||
    text.includes("salmon") ||
    text.includes("lamb") ||
    text.includes("beef") ||
    text.includes("fish") ||
    text.includes("rabbit") ||
    text.includes("duck")
  ) {
    positives.push(copy.animalProtein);
  }

  if (
    text.includes("hydrolysed") ||
    text.includes("hydrolyzed") ||
    text.includes("hypoallergenic")
  ) {
    positives.push(copy.hydrolysed);
  }

  if (
    text.includes("meat derivatives") ||
    text.includes("animal derivatives") ||
    text.includes("by-products")
  ) {
    cautions.push(copy.broadTerms);
  }

  if (
    text.includes("corn") ||
    text.includes("maize") ||
    text.includes("wheat") ||
    text.includes("rice") ||
    text.includes("barley") ||
    text.includes("oats") ||
    text.includes("potato")
  ) {
    positives.push(copy.carbohydrates);
  }

  if (
    text.includes("prebiotic") ||
    text.includes("fos") ||
    text.includes("mos") ||
    text.includes("beet pulp") ||
    text.includes("chicory") ||
    text.includes("psyllium") ||
    text.includes("inulin")
  ) {
    positives.push(copy.prebiotics);
  }

  if (
    text.includes("fish oil") ||
    text.includes("salmon oil") ||
    text.includes("algal oil") ||
    text.includes("dha") ||
    text.includes("epa")
  ) {
    positives.push(copy.omega);
  }

  return {
    positives,
    cautions,
  };
}
