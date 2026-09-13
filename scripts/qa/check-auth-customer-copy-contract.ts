import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const authPages = [
  {
    path: "app/login/page.tsx",
    markers: [
      "signInWithPassword",
      "supabase.auth.resend",
      'type: "signup"',
      "getCustomerAuthErrorMessage",
      "buildAuthCallbackPath",
      "normalizeSafeRedirectPath",
      'data-testid="auth-resend-confirmation"',
      'data-testid="auth-resend-confirmation-success"',
      "Νέο email επιβεβαίωσης",
      "Αν έχει ήδη επιβεβαιωθεί",
      'data-testid="auth-redirect-destination"',
      "showPassword",
      "EyeOff",
      'href="/forgot-password"',
    ],
  },
  {
    path: "app/register/page.tsx",
    markers: [
      "supabase.auth.signUp",
      "emailRedirectTo",
      "getCustomerAuthErrorMessage",
      "isValidCustomerEmail",
      'data-testid="auth-redirect-destination"',
      'data-testid="auth-register-confirmation-next-steps"',
      "showPassword",
      "EyeOff",
    ],
  },
  {
    path: "app/forgot-password/page.tsx",
    markers: [
      "resetPasswordForEmail",
      "getCustomerAuthErrorMessage",
      'data-testid="auth-forgot-email-sent-next-steps"',
    ],
  },
  {
    path: "app/reset-password/page.tsx",
    markers: [
      "updateUser",
      "getCustomerAuthErrorMessage",
      'data-testid="auth-reset-session-warning"',
      'data-testid="auth-reset-success-next-steps"',
      "showPassword",
      "showConfirmPassword",
    ],
  },
];

for (const page of authPages) {
  const source = read(page.path);
  for (const marker of page.markers) {
    assert(source.includes(marker), `${page.path} is missing auth marker: ${marker}`);
  }
}

const authShell = read("components/AuthShell.tsx");
for (const marker of [
  "trustPoints",
  "Προσωπικό προφίλ για κάθε κατοικίδιο",
  "Θερμίδες, μερίδα και προτάσεις τροφής",
  "Υπεύθυνα όρια σε θέματα υγείας",
  'src="/nutritail-hero.png"',
]) {
  assert(authShell.includes(marker), `AuthShell is missing customer trust marker: ${marker}`);
}

const authMessages = read("lib/auth/customerAuthMessages.ts");
for (const marker of [
  "login",
  "register",
  "confirmation",
  "forgot",
  "reset",
  "invalid",
  "expired",
]) {
  assert(authMessages.includes(marker), `Auth error helper is missing case: ${marker}`);
}

const packageJson = read("package.json");
const resendRunbook = read("docs/email/resend-supabase-auth.md");
const registerPage = read("app/register/page.tsx");

for (const script of [
  '"qa:auth-customer-copy"',
  '"qa:auth-customer-errors"',
  '"qa:resend-auth-email-templates"',
]) {
  assert(packageJson.includes(script), `package.json is missing ${script}.`);
}

assert(
  resendRunbook.includes("smtp.resend.com") &&
    resendRunbook.includes("NutriTail AI <no-reply@nutritail.ai>"),
  "Resend auth email runbook must document the customer-facing sender."
);
assert(
  registerPage.includes("isValidCustomerEmail") && registerPage.includes("name@example.com"),
  "Register page must validate the customer email format."
);

console.log("Auth customer copy contract passed.");
