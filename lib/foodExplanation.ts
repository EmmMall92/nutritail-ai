type FoodExplanationParams = {
  species: string;
  age: number;
  neutered: boolean;
  activityLevel: string;
  protein?: number | null;
  fat?: number | null;
  fiber?: number | null;
  sodium?: number | null;
  magnesium?: number | null;
  calcium?: number | null;
  phosphorus?: number | null;
};

export function buildFoodExplanation(
  params: FoodExplanationParams
): string[] {
  const advice: string[] = [];

  const protein = toOptionalNumber(params.protein);
  const fat = toOptionalNumber(params.fat);
  const fiber = toOptionalNumber(params.fiber);
  const sodium = toOptionalNumber(params.sodium);
  const magnesium = toOptionalNumber(params.magnesium);
  const calcium = toOptionalNumber(params.calcium);
  const phosphorus = toOptionalNumber(params.phosphorus);

  if (params.species === "cat") {
    if (protein !== null && protein >= 35) {
      advice.push(
        "Η πρωτεΐνη φαίνεται αρκετά υψηλή, κάτι που συνήθως είναι θετικό για γάτες."
      );
    } else if (protein !== null && protein < 30) {
      advice.push(
        "Η πρωτεΐνη φαίνεται σχετικά χαμηλή για γάτα, ειδικά αν είναι δραστήρια."
      );
    }

    if (magnesium !== null && magnesium > 0 && magnesium <= 0.09) {
      advice.push(
        "Το μαγνήσιο φαίνεται σε ελεγχόμενο επίπεδο, κάτι που συχνά είναι σημαντικό για γάτες με ευαισθησία στο ουροποιητικό."
      );
    } else if (magnesium !== null && magnesium > 0.12) {
      advice.push(
        "Το μαγνήσιο φαίνεται σχετικά αυξημένο. Σε γάτες με ιστορικό ουροποιητικών θεμάτων χρειάζεται προσοχή."
      );
    }
  }

  if (params.species === "dog") {
    if (protein !== null && protein >= 28) {
      advice.push("Η πρωτεΐνη φαίνεται αρκετά καλή για δραστήριο σκύλο.");
    } else if (protein !== null && protein < 22) {
      advice.push(
        "Η πρωτεΐνη ίσως είναι χαμηλή για ορισμένους σκύλους με αυξημένες ανάγκες."
      );
    }
  }

  if (params.neutered) {
    if (fat !== null && fat >= 18) {
      advice.push(
        "Η τροφή φαίνεται αρκετά πλούσια σε λιπαρά για στειρωμένο κατοικίδιο. Ίσως χρειάζεται έλεγχος ποσότητας."
      );
    } else if (fat !== null && fat <= 14) {
      advice.push(
        "Τα λιπαρά φαίνονται πιο ισορροπημένα για στειρωμένο κατοικίδιο."
      );
    }
  }

  if (params.activityLevel === "high") {
    advice.push(
      "Η αυξημένη δραστηριότητα σημαίνει ότι οι θερμιδικές ανάγκες πιθανόν να είναι υψηλότερες."
    );
  }

  if (fiber !== null && fiber >= 6) {
    advice.push(
      "Οι φυτικές ίνες φαίνονται αρκετά αυξημένες, κάτι που μπορεί να βοηθήσει στον κορεσμό."
    );
  }

  if (sodium !== null && sodium > 0.5) {
    advice.push(
      "Το νάτριο φαίνεται σχετικά αυξημένο. Σε ζώα με καρδιολογικά ή νεφρικά θέματα χρειάζεται προσοχή και κτηνιατρική καθοδήγηση."
    );
  }

  if (calcium !== null && phosphorus !== null && phosphorus > 0) {
    const ratio = calcium / phosphorus;

    if (ratio >= 1 && ratio <= 2) {
      advice.push(
        "Η σχέση ασβεστίου/φωσφόρου φαίνεται μέσα σε γενικά αποδεκτό εύρος."
      );
    } else {
      advice.push(
        "Η σχέση ασβεστίου/φωσφόρου φαίνεται εκτός συνηθισμένου εύρους. Αυτό χρειάζεται προσοχή, ειδικά σε κουτάβια, γατάκια ή ζώα με ειδικές ανάγκες."
      );
    }
  }

  if (params.age >= 7) {
    advice.push(
      "Σε μεγαλύτερες ηλικίες καλό είναι να προσέχουμε ιδιαίτερα το βάρος και τη συνολική ισορροπία της τροφής."
    );
  }

  return advice;
}

function toOptionalNumber(value?: number | null) {
  if (value === null || value === undefined) return null;

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}
