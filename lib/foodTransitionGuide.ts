type FoodTransitionGuideOptions = {
  healthIssues?: string[] | null;
  allergies?: string[] | null;
  language?: "el" | "en";
};

const GI_TERMS = ["vomit", "diarrhea", "diarrhoea", "stool", "gas", "digest"];
const ALLERGY_TERMS = ["allergy", "allergic", "itch", "skin", "ear"];
const URINARY_TERMS = ["urinary", "uti", "crystal", "struvite"];
const KIDNEY_TERMS = ["kidney", "renal", "ckd"];

function includesAnyTerm(values: string[] | null | undefined, terms: string[]) {
  const text = (values ?? []).join(" ").toLowerCase();

  return terms.some((term) => text.includes(term));
}

export function buildFoodTransitionGuide(
  options: FoodTransitionGuideOptions = {}
) {
  const language = options.language ?? "en";
  const isGreek = language === "el";
  const guide = isGreek
    ? [
        "Ημέρες 1-2: 75% παλιά τροφή + 25% νέα τροφή",
        "Ημέρες 3-4: 50% παλιά τροφή + 50% νέα τροφή",
        "Ημέρες 5-6: 25% παλιά τροφή + 75% νέα τροφή",
        "Ημέρα 7+: 100% νέα τροφή",
      ]
    : [
        "Days 1-2: 75% old food + 25% new food",
        "Days 3-4: 50% old food + 50% new food",
        "Days 5-6: 25% old food + 75% new food",
        "Day 7+: 100% new food",
      ];

  if (includesAnyTerm(options.healthIssues, GI_TERMS)) {
    guide.push(
      isGreek
        ? "Για ευαισθησία στην πέψη, κάνε τη μετάβαση πιο αργά, σε 10-14 ημέρες, και παρακολούθησε καλά τα κόπρανα."
        : "For digestive sensitivity, slow this down to 10-14 days and watch stool quality closely."
    );
  }

  if (
    includesAnyTerm(options.healthIssues, ALLERGY_TERMS) ||
    (options.allergies?.length ?? 0) > 0
  ) {
    guide.push(
      isGreek
        ? "Αν υπάρχει υποψία αλλεργίας, μην ανακατεύεις πολλές νέες τροφές στην ίδια δοκιμή, εκτός αν το έχει προτείνει κτηνίατρος."
        : "For suspected allergy, avoid mixing multiple new foods during a trial unless your veterinarian advises it."
    );
  }

  if (includesAnyTerm(options.healthIssues, URINARY_TERMS)) {
    guide.push(
      isGreek
        ? "Για ουρολογικά θέματα, μην αλλάζεις τροφή που έχει συστήσει κτηνίατρος χωρίς πρώτα να το ελέγξεις μαζί του."
        : "For urinary issues, do not switch away from a veterinarian-recommended diet without checking first."
    );
  }

  if (includesAnyTerm(options.healthIssues, KIDNEY_TERMS)) {
    guide.push(
      isGreek
        ? "Για νεφρική νόσο, οι αλλαγές τροφής χρειάζονται κτηνιατρική παρακολούθηση για όρεξη, βάρος και φώσφορο."
        : "For kidney disease, diet changes should be coordinated with veterinary monitoring of appetite, weight, and phosphorus."
    );
  }

  return guide;
}
