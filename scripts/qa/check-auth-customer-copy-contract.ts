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
      'data-testid="auth-chatbot-prep-card"',
      'data-testid="auth-login-confirmation-reminder"',
      'data-testid="auth-redirect-destination"',
      "Επόμενος προορισμός:",
      "άνοιξε πρώτα το email επιβεβαίωσης",
      "στο chatbot για νέα ανάλυση ή συνέχεια συζήτησης",
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
      'data-testid="auth-chatbot-prep-card"',
      'data-testid="auth-redirect-destination"',
      "Μετά την εγγραφή θα συνεχίσεις",
      "στο chatbot για την πρώτη ανάλυση",
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
      'data-testid="auth-forgot-submitted-email"',
      "submittedEmail",
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

const authShell = read("components/AuthShell.tsx");

for (const marker of [
  'data-testid="auth-customer-journey-strip"',
  'data-testid="auth-customer-journey-step"',
  "CUSTOMER_JOURNEY_STEPS",
  "report,",
  "progress check",
]) {
  assert(
    authShell.includes(marker),
    `AuthShell must include customer journey marker: ${marker}`
  );
}

const authMessages = read("lib/auth/customerAuthMessages.ts");

for (const marker of [
  "Έλεγξε email και κωδικό",
  "δεν έχει πρόσβαση διαχείρισης",
  "Υπάρχει ήδη λογαριασμός",
  "Έλεγξε ότι το email είναι γραμμένο σωστά",
  "Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες",
  "Έγιναν πολλές προσπάθειες",
  "Ο σύνδεσμος δεν είναι πλέον ενεργός",
]) {
  assert(
    authMessages.includes(marker),
    `customer auth error helper must include marker: ${marker}`
  );
}

const packageJson = read("package.json");
const resendAuthEmailRunbook = read("docs/email/resend-supabase-auth.md");
const registerPage = read("app/register/page.tsx");

assert(
  packageJson.includes('"qa:auth-customer-copy"'),
  "package.json must expose qa:auth-customer-copy."
);

assert(
  packageJson.includes('"qa:auth-customer-errors"'),
  "package.json must expose qa:auth-customer-errors."
);

assert(
  packageJson.includes('"qa:resend-auth-email-templates"'),
  "package.json must expose qa:resend-auth-email-templates."
);

assert(
  packageJson.includes("qa:ci-readiness") &&
    packageJson.includes("npm run qa:customer-ux-copy") &&
    packageJson.includes("npm run qa:auth-customer-copy") &&
    packageJson.includes("npm run qa:auth-customer-errors") &&
    packageJson.includes("npm run qa:resend-auth-email-templates") &&
    packageJson.includes("npm run qa:chatbot-customer-recommendations"),
  "CI readiness must include customer UX, auth customer copy, auth error, Resend auth email, and chatbot customer recommendation QA."
);

assert(
  resendAuthEmailRunbook.includes("smtp.resend.com") &&
    resendAuthEmailRunbook.includes("NutriTail AI <no-reply@nutritail.ai>"),
  "Resend auth email runbook must document customer-facing SMTP sender settings."
);

assert(
  registerPage.includes("isLikelyEmailTypo") &&
    registerPage.includes("www.niostb@hotmail.com") &&
    registerPage.includes("isValidCustomerEmail"),
  "Register page must catch likely www-prefixed email typos before calling Supabase."
);

console.log("Auth customer copy contract passed.");
