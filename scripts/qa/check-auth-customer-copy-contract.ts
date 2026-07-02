import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const pages = [
  {
    path: "app/login/page.tsx",
    markers: [
      "Θα συνεχίσεις από εκεί που έμεινες.",
      "στη σωστή σελίδα μετά τη σύνδεση",
      'data-testid="auth-next-step-card"',
      'data-testid="auth-login-error-next-actions"',
      "Έλεγξε email και κωδικό",
      "Επαναφορά κωδικού",
      "Δημιουργία λογαριασμού",
      "showPassword",
      "Εμφάνιση κωδικού",
      "Απόκρυψη κωδικού",
    ],
  },
  {
    path: "app/register/page.tsx",
    markers: [
      "Μετά την εγγραφή ξεκινάς αμέσως πρακτικά.",
      "να κρατήσεις",
      "αναφορά για μελλοντικό έλεγχο προόδου",
      'data-testid="auth-next-step-card"',
      'data-testid="auth-register-confirmation-next-steps"',
      "Συνέχεια στη σύνδεση",
      "showPassword",
      "Εμφάνιση κωδικού",
      "Απόκρυψη κωδικού",
    ],
  },
  {
    path: "app/forgot-password/page.tsx",
    markers: [
      "Δεν χάνεις τα αποθηκευμένα στοιχεία σου.",
      "κατοικίδια",
      "τις αναφορές",
      "τους ελέγχους προόδου",
      'data-testid="auth-next-step-card"',
      'data-testid="auth-recovery-help-card"',
      'data-testid="auth-forgot-email-sent-next-steps"',
      "Πίσω στη σύνδεση",
    ],
  },
  {
    path: "app/reset-password/page.tsx",
    markers: [
      "Μετά την αλλαγή θα συνδεθείς ξανά με ασφάλεια.",
      "αποθηκευμένα",
      "τις αναφορές",
      "νέα ανάλυση",
      'data-testid="auth-next-step-card"',
      'data-testid="auth-reset-help-card"',
      'data-testid="auth-reset-session-warning"',
      'data-testid="auth-reset-success-next-steps"',
      "Ζήτησε νέο σύνδεσμο",
      "Σύνδεση στον λογαριασμό",
      "showPassword",
      "showConfirmPassword",
      "Εμφάνιση νέου κωδικού",
      "Εμφάνιση επιβεβαίωσης κωδικού",
    ],
  },
];

for (const page of pages) {
  const source = read(page.path);

  for (const marker of page.markers) {
    assert(
      source.includes(marker),
      `${page.path} must include auth customer copy marker: ${marker}`
    );
  }

  assert(
    source.includes("getCustomerAuthErrorMessage"),
    `${page.path} must use customer-safe auth error messages.`
  );
}

const authMessages = read("lib/auth/customerAuthMessages.ts");

for (const marker of [
  "Έλεγξε email και κωδικό",
  "δεν έχει πρόσβαση διαχείρισης",
  "Υπάρχει ήδη λογαριασμός",
  "Έγιναν πολλές προσπάθειες",
  "Ο σύνδεσμος δεν είναι πλέον ενεργός",
]) {
  assert(
    authMessages.includes(marker),
    `customer auth error helper must include marker: ${marker}`
  );
}

const packageJson = read("package.json");

assert(
  packageJson.includes('"qa:auth-customer-copy"'),
  "package.json must expose qa:auth-customer-copy."
);

assert(
  packageJson.includes('"qa:auth-customer-errors"'),
  "package.json must expose qa:auth-customer-errors."
);

assert(
  packageJson.includes("qa:ci-readiness") &&
    packageJson.includes("npm run qa:customer-ux-copy") &&
    packageJson.includes("npm run qa:auth-customer-copy") &&
    packageJson.includes("npm run qa:auth-customer-errors") &&
    packageJson.includes("npm run qa:chatbot-customer-recommendations"),
  "CI readiness must include customer UX, auth customer copy, auth error, and chatbot customer recommendation QA."
);

console.log("Auth customer copy contract passed.");
