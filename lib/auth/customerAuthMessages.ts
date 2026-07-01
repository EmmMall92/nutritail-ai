export type AuthCustomerFlow = "login" | "register" | "forgot" | "reset";

const fallbackMessages: Record<AuthCustomerFlow, string> = {
  login: "Δεν ολοκληρώθηκε η σύνδεση. Έλεγξε τα στοιχεία σου και δοκίμασε ξανά.",
  register: "Δεν ολοκληρώθηκε η εγγραφή. Δοκίμασε ξανά σε λίγο.",
  forgot: "Δεν μπόρεσε να σταλεί email επαναφοράς. Έλεγξε το email και δοκίμασε ξανά.",
  reset: "Δεν μπόρεσε να ενημερωθεί ο κωδικός. Δοκίμασε ξανά σε λίγο.",
};

export function getCustomerAuthErrorMessage(
  error: unknown,
  flow: AuthCustomerFlow
) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login") ||
    normalized.includes("invalid credentials") ||
    normalized.includes("email not confirmed")
  ) {
    return "Έλεγξε email και κωδικό. Αν δεν έχεις επιβεβαιώσει το email, άνοιξε πρώτα το email επιβεβαίωσης.";
  }

  if (
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("user already")
  ) {
    return "Υπάρχει ήδη λογαριασμός με αυτό το email. Δοκίμασε σύνδεση ή επαναφορά κωδικού.";
  }

  if (
    normalized.includes("rate limit") ||
    normalized.includes("too many") ||
    normalized.includes("over email send rate limit")
  ) {
    return "Έγιναν πολλές προσπάθειες. Περίμενε λίγα λεπτά και δοκίμασε ξανά.";
  }

  if (
    normalized.includes("expired") ||
    normalized.includes("invalid token") ||
    normalized.includes("session")
  ) {
    return "Το link δεν είναι πλέον ενεργό. Ζήτησε νέο link επαναφοράς και άνοιξέ το από την ίδια συσκευή.";
  }

  if (
    message.startsWith("Γράψε ") ||
    message.startsWith("Ο κωδικός ") ||
    message.startsWith("Οι δύο κωδικοί ") ||
    message.startsWith("Δεν ολοκληρώθηκε ")
  ) {
    return message;
  }

  return fallbackMessages[flow];
}
