export function formatCustomerSpecies(value?: string | null) {
  if (value === "dog") return "Σκύλος";
  if (value === "cat") return "Γάτα";

  return value?.trim() || "Δεν δηλώθηκε";
}

export function formatCustomerBreed(value?: string | null) {
  const normalized = value?.trim().toLowerCase();

  if (!normalized || normalized === "unknown") return "Δεν δηλώθηκε";

  return value!.trim();
}

export function formatCustomerActivity(value?: string | null) {
  if (value === "low") return "Χαμηλή";
  if (value === "normal") return "Κανονική";
  if (value === "high") return "Υψηλή";

  return value?.trim() || "Δεν δηλώθηκε";
}

export function formatCustomerWeightGoal(value?: string | null) {
  if (value === "loss") return "Απώλεια βάρους";
  if (value === "gain") return "Αύξηση βάρους";
  if (value === "maintain" || value === "maintenance") {
    return "Διατήρηση βάρους";
  }

  return value?.trim() || "Γενική καθοδήγηση";
}
