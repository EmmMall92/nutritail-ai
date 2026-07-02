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
      ? "Αυτό μοιάζει περισσότερο με κενό στη βάση μας για αυτή τη μορφή τροφής, όχι με πρόβλημα του κατοικιδίου."
      : "This looks like a coverage gap in our database for this food format, not a problem with the pet profile.";
  }

  if (typeof held === "number" && held > 0) {
    return language === "el"
      ? "Βρήκα κάποιες τροφές στη βάση, αλλά δεν τις δείχνω γιατί δεν ταιριάζουν αρκετά σε ηλικία, στόχο ή ασφάλεια."
      : "I found a few foods in the database, but I am not showing them because they do not fit the age, goal, or safety context closely enough.";
  }

  return language === "el"
    ? "Δεν βρήκα αρκετά ασφαλή και κατάλληλη επιλογή για να την προτείνω υπεύθυνα."
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
        "Δεν θα σου προτείνω ξηρά τροφή ενώ μου είπες ότι χρειάζεται υγρή/κονσέρβα.",
        "",
        "Καλύτερο επόμενο βήμα:",
        "1. Στείλε μου 1-2 υγρές τροφές που βρίσκεις εύκολα, ή",
        "2. ανέβασε/γράψε τα στοιχεία από την ετικέτα της κονσέρβας ή του φακέλου.",
        "",
        "Μετά θα τις αξιολογήσω με το ίδιο προφίλ κατοικιδίου και θα σου δώσω πιο σωστή ποσότητα ανά ημέρα.",
      ].join("\n");
    }

    if (format === "mixed") {
      return [
        intro,
        "",
        coverageLine(coverage, language),
        "",
        "Για ανάμειξη ξηράς με υγρή, χρειάζεται να ξέρουμε ποια τροφή είναι η βάση και ποια μπαίνει σαν topper.",
        "",
        "Καλύτερο επόμενο βήμα: διάλεξε μία βασική ξηρά τροφή ή στείλε την υγρή που θέλεις να προσθέτεις, ώστε να κρατήσουμε σωστές θερμίδες και μερίδα.",
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
      "I will not recommend dry food when you told me this pet needs wet or canned food.",
      "",
      "Best next step:",
      "1. Send me 1-2 wet foods you can buy easily, or",
      "2. send the label details from the can or pouch.",
      "",
      "Then I can evaluate those options against the same pet profile and estimate a better daily portion.",
    ].join("\n");
  }

  if (format === "mixed") {
    return [
      intro,
      "",
      coverageLine(coverage, language),
      "",
      "For dry plus wet feeding, we need to know which food is the base and which one is the topper.",
      "",
      "Best next step: choose one base dry food or share the wet topper you want to add, so we can keep calories and portions sensible.",
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
