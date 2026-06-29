export type ProgressDecisionConfidence = "high" | "medium" | "low";

export function formatProgressDecisionConfidence(
  value?: string | null,
  locale: "el" | "en" = "el"
) {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (!normalized) return null;

  const greek = locale === "el";

  if (normalized === "high") {
    return greek
      ? "αρκετά στοιχεία για καθαρή εικόνα"
      : "enough context for a clear read";
  }

  if (normalized === "medium") {
    return greek
      ? "χρήσιμη εικόνα, με λίγη ακόμη παρακολούθηση"
      : "useful context, with a little more monitoring";
  }

  if (normalized === "low") {
    return greek
      ? "λίγα στοιχεία, το βλέπουμε προσεκτικά"
      : "limited context, treat cautiously";
  }

  return greek ? "θέλει επανέλεγχο" : "needs another check";
}
