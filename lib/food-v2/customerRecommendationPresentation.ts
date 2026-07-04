export type CustomerRecommendationPresentationLanguage = "el" | "en";
export type CustomerRecommendationPresentationMode = "default" | "alternative";

export type CustomerRecommendationPresentationChoice = {
  name: string;
  role?: "best" | "value" | string | null;
};

function hasValueChoice(choices: CustomerRecommendationPresentationChoice[]) {
  return choices.some((choice) => choice.role === "value");
}

function countByRole(
  choices: CustomerRecommendationPresentationChoice[],
  role: "best" | "value"
) {
  return choices.filter((choice) =>
    role === "best" ? choice.role !== "value" : choice.role === "value"
  ).length;
}

function countLabel(
  count: number,
  language: CustomerRecommendationPresentationLanguage
) {
  if (language === "el") return count === 3 ? "3" : `έως ${count}`;
  return count === 3 ? "3" : `up to ${count}`;
}

export function buildCustomerRecommendationIntro({
  choices,
  language,
  mode,
}: {
  choices: CustomerRecommendationPresentationChoice[];
  language: CustomerRecommendationPresentationLanguage;
  mode: CustomerRecommendationPresentationMode;
}) {
  const topChoice = choices[0];
  if (!topChoice) return "";

  const bestCount = Math.min(countByRole(choices, "best"), 3);
  const valueCount = Math.min(countByRole(choices, "value"), 3);
  const hasValue = hasValueChoice(choices);

  if (language === "el") {
    const firstLine =
      mode === "alternative"
        ? "Βρήκα νέες επιλογές που μπορούν να αντικαταστήσουν την τωρινή τροφή."
        : "Βρήκα τις πιο κατάλληλες επιλογές και τις έβαλα σε κάρτες για να διαλέξεις εύκολα.";
    const splitLine = hasValue
      ? `Θα δεις ${countLabel(bestCount, "el")} δυνατές επιλογές και ${countLabel(valueCount, "el")} πιο πρακτικές/οικονομικές εναλλακτικές.`
      : `Θα δεις ${countLabel(bestCount, "el")} δυνατές επιλογές που ταιριάζουν περισσότερο στο προφίλ.`;

    return [
      firstLine,
      splitLine,
      `Πρώτη πρόταση: ${topChoice.name}.`,
      "Πάτησε μία κάρτα για να υπολογίσω περίπου γραμμάρια/ημέρα και να συνεχίσουμε με ξεκάθαρο πλάνο.",
    ].join("\n");
  }

  const firstLine =
    mode === "alternative"
      ? "I found new options that can replace the current food."
      : "I found the best-fitting options and placed them in simple cards below.";
  const splitLine = hasValue
    ? `You will see ${countLabel(bestCount, "en")} strong picks and ${countLabel(valueCount, "en")} practical/value alternatives.`
    : `You will see ${countLabel(bestCount, "en")} strong picks that fit this profile best.`;

  return [
    firstLine,
    splitLine,
    `First pick: ${topChoice.name}.`,
    "Choose one card and I will estimate grams/day and continue the plan.",
  ].join("\n");
}

export function customerRecommendationPresentationForbiddenTerms() {
  return [
    "needs_review",
    "needs review",
    "retailer",
    "source tier",
    "source priority",
    "data quality",
    "missing nutrition",
    "missing fields",
    "confidence internals",
    "Food V2",
    "OpenAI",
    "prompt",
    "model",
  ];
}
