export type NutritionAdviceLocale = "el" | "en";

export type NutritionAdviceItem = {
  title: string;
  description: string;
};

const GREEK_ADVICE_COPY: Record<string, NutritionAdviceItem> = {
  "Senior Nutrition": {
    title: "Διατροφή για senior ζώο",
    description:
      "Παρακολουθούμε όρεξη, βάρος, μυϊκή κατάσταση και πέψη. Αν χάνει βάρος, μια light τροφή δεν είναι αυτόματα η σωστή επιλογή.",
  },
  "Weight Control": {
    title: "Έλεγχος βάρους",
    description:
      "Τα στειρωμένα ή επιρρεπή σε βάρος ζώα χρειάζονται έλεγχο θερμίδων, μετρημένες μερίδες και σταθερό όριο στις λιχουδιές.",
  },
  "Kidney Support": {
    title: "Νεφρική υποστήριξη",
    description:
      "Χρειάζεται κτηνιατρική παρακολούθηση και επιβεβαιωμένα στοιχεία για φώσφορο, νάτριο, όρεξη, ενυδάτωση και πορεία βάρους πριν επιλεγεί τροφή.",
  },
  "Urinary Caution": {
    title: "Ουρολογική προσοχή",
    description:
      "Η επιλογή τροφής πρέπει να ακολουθεί τη διάγνωση και τα ευρήματα ούρων. Δυσκολία, πόνος, αίμα ή ελάχιστα ούρα χρειάζονται άμεση κτηνιατρική επικοινωνία.",
  },
  "Digestive Support": {
    title: "Υποστήριξη πέψης",
    description:
      "Βοηθούν η αργή μετάβαση, τα σταθερά γεύματα και η παρακολούθηση κοπράνων. Έντονα ή επίμονα συμπτώματα και απώλεια βάρους χρειάζονται κτηνίατρο.",
  },
  "Food Allergies": {
    title: "Τροφικές αλλεργίες",
    description:
      "Η υποψία αλλεργίας αξιολογείται καλύτερα με ιστορικό έκθεσης και οργανωμένη δίαιτα αποκλεισμού ή υδρολυμένη τροφή με κτηνιατρική καθοδήγηση.",
  },
  "High Activity": {
    title: "Υψηλή δραστηριότητα",
    description:
      "Ένα πολύ δραστήριο ζώο μπορεί να χρειάζεται περισσότερη ενέργεια και επαρκή πρωτεΐνη, με προσαρμογή ανάλογα με βάρος και απόδοση.",
  },
};

export function localizeNutritionAdviceItem(
  advice: NutritionAdviceItem,
  locale: NutritionAdviceLocale
): NutritionAdviceItem {
  if (locale !== "el") return advice;

  return (
    GREEK_ADVICE_COPY[advice.title] ?? {
      title: "Διατροφική σημείωση",
      description:
        "Αυτό το σημείο χρειάζεται εξατομικευμένη παρακολούθηση με βάση την πορεία του κατοικιδίου.",
    }
  );
}
