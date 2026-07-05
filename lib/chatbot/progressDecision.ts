import type { ProgressUpdateDetails } from "./progressParsing";

export type ProgressDecisionStatus =
  | "continue_plan"
  | "adjust_portions"
  | "reduce_treats"
  | "review_food_fit"
  | "needs_more_data";

export type ProgressDecision = {
  status: ProgressDecisionStatus;
  confidence: "low" | "medium" | "high";
  headline: {
    el: string;
    en: string;
  };
  reasons: {
    el: string[];
    en: string[];
  };
  nextSteps: {
    el: string[];
    en: string[];
  };
};

type BuildProgressDecisionInput = {
  details: ProgressUpdateDetails;
  previousWeightKg?: number | null;
  mode?: "progress" | "no_result" | null;
};

export function buildProgressDecision({
  details,
  previousWeightKg,
  mode = "progress",
}: BuildProgressDecisionInput): ProgressDecision {
  const deltaKg =
    details.currentWeightKg !== null &&
    typeof previousWeightKg === "number" &&
    Number.isFinite(previousWeightKg)
      ? Number((details.currentWeightKg - previousWeightKg).toFixed(1))
      : null;

  const reasonsEl: string[] = [];
  const reasonsEn: string[] = [];
  const nextEl: string[] = [];
  const nextEn: string[] = [];

  if (!details.hasEnoughProgressContext && mode === "progress") {
    return {
      status: "needs_more_data",
      confidence: "low",
      headline: {
        el: "Χρειάζομαι λίγα ακόμη στοιχεία για ασφαλή συμπέρασμα.",
        en: "I need a little more context before judging progress.",
      },
      reasons: {
        el: ["Λείπουν στοιχεία όπως λιχουδιές, όρεξη, κόπρανα ή ενέργεια."],
        en: ["Treats, appetite, stool, or energy context is still incomplete."],
      },
      nextSteps: {
        el: ["Στείλε μόνο τα στοιχεία που λείπουν και κρατάω όσα ήδη μου έδωσες."],
        en: ["Send only the missing details; I will keep what you already provided."],
      },
    };
  }

  if (deltaKg !== null) {
    if (deltaKg < 0) {
      reasonsEl.push(`Το βάρος είναι ${Math.abs(deltaKg)} kg χαμηλότερο από το αποθηκευμένο.`);
      reasonsEn.push(`Weight is ${Math.abs(deltaKg)} kg lower than the saved profile.`);
    } else if (deltaKg > 0) {
      reasonsEl.push(`Το βάρος είναι ${deltaKg} kg υψηλότερο από το αποθηκευμένο.`);
      reasonsEn.push(`Weight is ${deltaKg} kg higher than the saved profile.`);
    } else {
      reasonsEl.push("Το βάρος είναι ίδιο με το αποθηκευμένο.");
      reasonsEn.push("Weight is unchanged from the saved profile.");
    }
  }

  if (details.treatsNote === "many") {
    reasonsEl.push("Οι πολλές λιχουδιές μπορούν εύκολα να κρύψουν την πρόοδο.");
    reasonsEn.push("Many treats can easily hide progress.");
    nextEl.push("Κράτησε τις λιχουδιές μέσα στο ημερήσιο όριο και μέτρα τις για 2 εβδομάδες.");
    nextEn.push("Keep treats inside the daily allowance and track them for 2 weeks.");
  }

  if (details.appetiteNote === "hungry") {
    reasonsEl.push("Η έντονη πείνα δείχνει ότι πρέπει να δούμε κορεσμό, ίνες και λιχουδιές.");
    reasonsEn.push("Strong hunger means satiety, fiber, and treats need review.");
    nextEl.push("Αν πεινάει συνέχεια, προτίμησε πιο χορταστική επιλογή πριν κόψεις απότομα ποσότητα.");
    nextEn.push("If hunger is constant, prefer a more filling option before cutting portions sharply.");
  }

  if (
    details.appetiteNote === "low" ||
    details.stoolNote === "diarrhea" ||
    details.energyNote === "low" ||
    details.foodAcceptanceNote === "bored" ||
    details.foodAcceptanceNote === "refused"
  ) {
    reasonsEl.push("Υπάρχει ένδειξη ότι η τροφή ή το πλάνο μπορεί να μην ταιριάζει τέλεια.");
    reasonsEn.push("There is a sign that the food or plan may not fit perfectly.");
    nextEl.push("Αν συνεχιστεί χαμηλή όρεξη, διάρροια ή χαμηλή ενέργεια, μίλα με κτηνίατρο.");
    nextEn.push("If low appetite, diarrhea, or low energy continues, speak with a veterinarian.");
  }

  if (details.foodAcceptanceNote === "bored") {
    reasonsEl.push("Φαίνεται ότι βαρέθηκε τη γεύση ή τη φόρμουλα.");
    reasonsEn.push("It sounds like the pet may be bored of the flavour or formula.");
    nextEl.push("Κράτα τον ίδιο στόχο, αλλά ζήτησε εναλλακτική πρόταση με διαφορετική γεύση ή brand.");
    nextEn.push("Keep the same goal, but ask for an alternative with a different flavour or brand.");
  }

  if (details.foodAcceptanceNote === "refused") {
    reasonsEl.push("Η αποδοχή της τροφής φαίνεται χαμηλή.");
    reasonsEn.push("Food acceptance seems low.");
    nextEl.push("Μπορούμε να ψάξουμε νέα επιλογή με βάση τις γεύσεις που δέχεται και όσα αποφεύγει.");
    nextEn.push("We can look for a new option based on accepted and avoided flavours.");
  }

  if (mode === "no_result" || (deltaKg !== null && deltaKg >= 0 && details.treatsNote !== "many")) {
    nextEl.push("Ξανατσέκαρε ακριβή γραμμάρια/ημέρα και ζύγισμα στην ίδια ζυγαριά.");
    nextEn.push("Recheck exact grams/day and weigh on the same scale.");
  }

  if (details.stoolNote === "better" || details.energyNote === "better") {
    reasonsEl.push("Τα κόπρανα ή/και η ενέργεια φαίνονται καλύτερα.");
    reasonsEn.push("Stool and/or energy look better.");
  }

  const hasFitConcern =
    details.appetiteNote === "low" ||
    details.stoolNote === "diarrhea" ||
    details.energyNote === "low" ||
    details.foodAcceptanceNote === "bored" ||
    details.foodAcceptanceNote === "refused";

  if (hasFitConcern) {
    return withFallbacks({
      status: "review_food_fit",
      confidence: details.hasEnoughProgressContext ? "medium" : "low",
      headline: {
        el: "Θέλει έλεγχο αν η τροφή ταιριάζει πραγματικά.",
        en: "The food fit should be reviewed.",
      },
      reasons: { el: reasonsEl, en: reasonsEn },
      nextSteps: { el: nextEl, en: nextEn },
    });
  }

  if (details.treatsNote === "many") {
    return withFallbacks({
      status: "reduce_treats",
      confidence: "medium",
      headline: {
        el: "Πρώτα θα διόρθωνα τις λιχουδιές, όχι απαραίτητα την τροφή.",
        en: "I would adjust treats first, not necessarily the food.",
      },
      reasons: { el: reasonsEl, en: reasonsEn },
      nextSteps: { el: nextEl, en: nextEn },
    });
  }

  if (mode === "no_result" || (deltaKg !== null && deltaKg > 0)) {
    return withFallbacks({
      status: "adjust_portions",
      confidence: details.hasEnoughProgressContext ? "medium" : "low",
      headline: {
        el: "Το πλάνο θέλει μικρή προσαρμογή ή επανέλεγχο ποσότητας.",
        en: "The plan needs a small adjustment or portion recheck.",
      },
      reasons: { el: reasonsEl, en: reasonsEn },
      nextSteps: { el: nextEl, en: nextEn },
    });
  }

  return withFallbacks({
    status: "continue_plan",
    confidence: details.hasEnoughProgressContext ? "high" : "medium",
    headline: {
      el: "Το πλάνο φαίνεται να μπορεί να συνεχιστεί προς το παρόν.",
      en: "The current plan looks reasonable to continue for now.",
    },
    reasons: { el: reasonsEl, en: reasonsEn },
    nextSteps: {
      el: [
        ...nextEl,
        "Συνέχισε με τα ίδια γραμμάρια και ξανακάνε progress check σε 2-4 εβδομάδες.",
      ],
      en: [
        ...nextEn,
        "Keep the same grams and run another progress check in 2-4 weeks.",
      ],
    },
  });
}

function withFallbacks(decision: ProgressDecision): ProgressDecision {
  return {
    ...decision,
    reasons: {
      el:
        decision.reasons.el.length > 0
          ? decision.reasons.el
          : ["Τα στοιχεία είναι χρήσιμα, αλλά δεν αρκούν για απόλυτο συμπέρασμα."],
      en:
        decision.reasons.en.length > 0
          ? decision.reasons.en
          : ["The details are useful, but not enough for a definitive conclusion."],
    },
    nextSteps: {
      el:
        decision.nextSteps.el.length > 0
          ? decision.nextSteps.el
          : ["Κράτα σταθερή τη ρουτίνα και ξανατσέκαρε με νέα μέτρηση."],
      en:
        decision.nextSteps.en.length > 0
          ? decision.nextSteps.en
          : ["Keep the routine consistent and check again with a new measurement."],
    },
  };
}
