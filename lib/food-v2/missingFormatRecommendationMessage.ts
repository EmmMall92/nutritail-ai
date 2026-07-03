import type { FoodFormatPreference } from "@/lib/chatbot/foodFormatPreference";

export type MissingFormatRecommendationLanguage = "el" | "en";
export type MissingFormatRecommendationMode = "default" | "alternative";

type MissingFormatRecommendationPet = {
  preferredFoodFormat?: FoodFormatPreference | null;
  species?: "dog" | "cat" | null;
};

type MissingFormatCoverage = {
  totalCandidates?: number | null;
  heldCandidates?: number | null;
};

type MissingFormatRecommendationMessageInput = {
  pet: MissingFormatRecommendationPet;
  language: MissingFormatRecommendationLanguage;
  mode?: MissingFormatRecommendationMode;
  coverage?: MissingFormatCoverage;
};

function foodFormatLabel(format: FoodFormatPreference | null | undefined, language: MissingFormatRecommendationLanguage) {
  if (language === "el") {
    if (format === "wet") return "υγρή τροφή / κονσέρβα / φακελάκι";
    if (format === "mixed") return "συνδυασμό ξηράς και υγρής τροφής";
    return "αυτή τη μορφή τροφής";
  }

  if (format === "wet") return "wet food, cans, or pouches";
  if (format === "mixed") return "a dry plus wet feeding plan";
  return "that food format";
}

function coverageLine(
  coverage: MissingFormatCoverage | undefined,
  language: MissingFormatRecommendationLanguage
) {
  const total = coverage?.totalCandidates ?? null;
  const held = coverage?.heldCandidates ?? null;

  if (typeof total !== "number" || total <= 0) {
    return language === "el"
      ? "Αυτό μοιάζει περισσότερο με κενό στη βάση μας για αυτή τη μορφή τροφής, όχι με πρόβλημα στο προφίλ του κατοικιδίου."
      : "This looks like a database gap for this food format, not a problem with the pet profile.";
  }

  if (typeof held === "number" && held > 0) {
    return language === "el"
      ? "Βρήκα κάποιες τροφές στη βάση, αλλά δεν τις εμφανίζω γιατί δεν ταιριάζουν αρκετά σε ηλικία, στόχο ή ασφάλεια."
      : "I found a few foods in the database, but I am not showing them because they do not fit the age, goal, or safety context closely enough.";
  }

  return language === "el"
    ? "Δεν βρήκα αρκετά ασφαλή και κατάλληλη επιλογή για να την προτείνω υπεύθυνα ακόμη."
    : "I did not find a safe enough option to recommend responsibly yet.";
}

export function formatMissingFormatRecommendationMessage({
  pet,
  language,
  mode = "default",
  coverage,
}: MissingFormatRecommendationMessageInput) {
  const format = pet.preferredFoodFormat ?? null;
  const formatLabel = foodFormatLabel(format, language);
  const alternativeMode = mode === "alternative";

  if (language === "el") {
    const intro = alternativeMode
      ? `Δεν βρήκα ακόμη αρκετές ασφαλείς εναλλακτικές για ${formatLabel}.`
      : `Δεν βρήκα ακόμη αρκετές κατάλληλες επιλογές για ${formatLabel}.`;

    if (format === "wet") {
      return [
        intro,
        "",
        coverageLine(coverage, language),
        "",
        "Θέλω να το κρατήσω σωστό: αυτή τη στιγμή δεν έχω αρκετές υγρές τροφές/κονσέρβες στη βάση NutriTail για αξιόπιστη κατάταξη.",
        "",
        "Καλύτερο επόμενο βήμα:",
        "1. στείλε 1-2 κονσέρβες ή φακελάκια που μπορείς να αγοράσεις εύκολα, ή",
        "2. στείλε φωτογραφία/στοιχεία ετικέτας με συστατικά, θερμίδες και ανάλυση.",
        "",
        "Μόλις έχω αυτά τα στοιχεία, μπορώ να συγκρίνω θερμίδες και να υπολογίσω πιο σωστή ποσότητα/ημέρα.",
      ].join("\n");
    }

    if (format === "mixed") {
      return [
        intro,
        "",
        coverageLine(coverage, language),
        "",
        "Για ξηρά μαζί με υγρή, θέλω πρώτα να ξέρουμε ποια τροφή θα είναι η βάση και ποια θα μπαίνει σαν topper.",
        "",
        "Καλύτερο επόμενο βήμα: διάλεξε μία βασική ξηρά τροφή από τη λίστα ή στείλε την υγρή τροφή που θέλεις να προσθέτεις. Έτσι θα κρατήσουμε σωστές θερμίδες και μερίδα.",
      ].join("\n");
    }

    return [
      intro,
      "",
      coverageLine(coverage, language),
      "",
      "Δώσε μου άλλη γεύση, μάρκα ή πιο συγκεκριμένη προτίμηση και θα ψάξω ξανά πιο στοχευμένα.",
    ].join("\n");
  }

  const intro = alternativeMode
    ? `I did not find enough safe alternatives for ${formatLabel} yet.`
    : `I did not find enough suitable options for ${formatLabel} yet.`;

  if (format === "wet") {
    return [
      intro,
      "",
      coverageLine(coverage, language),
      "",
      "I want to keep this accurate: I do not yet have enough wet/canned foods in NutriTail to rank them reliably.",
      "",
      "Best next step:",
      "1. send 1-2 cans or pouches you can buy easily, or",
      "2. send a label photo with ingredients, calories, and analysis.",
      "",
      "Once I have those details, I can compare calories and estimate a better daily amount.",
    ].join("\n");
  }

  if (format === "mixed") {
    return [
      intro,
      "",
      coverageLine(coverage, language),
      "",
      "For dry plus wet feeding, I first need to know which food is the base and which one is the topper.",
      "",
      "Best next step: choose one base dry food from the list or share the wet topper you want to add, so we can keep calories and portions sensible.",
    ].join("\n");
  }

  return [
    intro,
    "",
    coverageLine(coverage, language),
    "",
    "Share another flavour, brand, or clearer preference and I will search again.",
  ].join("\n");
}
