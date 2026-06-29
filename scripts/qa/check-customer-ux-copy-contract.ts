import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH || "reports/customer_ux_copy_contract_qa.md";

const customerCopyFiles = [
  "app/page.tsx",
  "app/privacy/page.tsx",
  "app/terms/page.tsx",
  "app/login/page.tsx",
  "app/register/page.tsx",
  "app/forgot-password/page.tsx",
  "app/reset-password/page.tsx",
  "app/account/page.tsx",
  "app/account/layout.tsx",
  "app/account/profile/page.tsx",
  "lib/nutrition/chatGuardrails.ts",
];

const bannedCustomerCopy = [
  {
    pattern: /\bneeds_review\b/i,
    reason: "Do not expose Food V2 review status to customers.",
  },
  {
    pattern: /\bsource tier\b/i,
    reason: "Do not expose source-tier wording to customers.",
  },
  {
    pattern: /\bdata quality\b/i,
    reason: "Use customer trust wording instead of backend data-quality labels.",
  },
  {
    pattern: /\bmissing nutrition fields?\b/i,
    reason: "Use simple label-detail wording instead of backend field wording.",
  },
  {
    pattern: /\brecommendation confidence\b/i,
    reason: "Use nutrition-plan/customer wording instead of model or ranking confidence.",
  },
  {
    pattern: /\bScore \d+\/100\b/i,
    reason: "Use customer food-fit wording instead of raw score badges.",
  },
  {
    pattern: /\blegacy food matcher\b/i,
    reason: "Do not expose legacy-system wording to customers.",
  },
];

const requiredCustomerCopy = [
  {
    file: "app/account/page.tsx",
    text: "Κατάσταση διατροφικού πλάνου",
  },
  {
    file: "app/account/page.tsx",
    text: "Καταλληλότητα τροφής:",
  },
  {
    file: "app/account/page.tsx",
    text: "Περισσότερα στοιχεία ετικέτας βελτιώνουν την απάντηση",
  },
  {
    file: "app/account/chatbot/page.tsx",
    text: "Get daily grams",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "Διαχειρίσου τα στοιχεία που συνδέονται με το προφίλ NutriTail AI.",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "Πώς χρησιμοποιούνται αυτά τα στοιχεία",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "Αποθήκευση προφίλ",
  },
  {
    file: "app/account/layout.tsx",
    text: "Σύμβουλος",
  },
];

const bannedExactCustomerStrings = [
  {
    file: "app/page.tsx",
    text: "Feed your pet with more confidence.",
    reason: "Homepage hero copy should be localized for customers.",
  },
  {
    file: "app/page.tsx",
    text: "Start free analysis",
    reason: "Homepage primary CTA should be localized for customers.",
  },
  {
    file: "app/page.tsx",
    text: "I already have an account",
    reason: "Homepage secondary CTA should be localized for customers.",
  },
  {
    file: "app/page.tsx",
    text: "Food shortlist",
    reason: "Homepage feature labels should be localized for customers.",
  },
  {
    file: "app/page.tsx",
    text: "Clear recommendations, with confidence you can understand.",
    reason: "Homepage trust copy should be localized for customers.",
  },
  {
    file: "app/privacy/page.tsx",
    text: "Privacy Policy",
    reason: "Privacy page heading and metadata should be localized for customers.",
  },
  {
    file: "app/privacy/page.tsx",
    text: "Information we collect",
    reason: "Privacy page section headings should be localized for customers.",
  },
  {
    file: "app/privacy/page.tsx",
    text: "Back to home",
    reason: "Privacy page navigation should be localized for customers.",
  },
  {
    file: "app/terms/page.tsx",
    text: "Terms of Use",
    reason: "Terms page heading and metadata should be localized for customers.",
  },
  {
    file: "app/terms/page.tsx",
    text: "Educational guidance only",
    reason: "Terms page section headings should be localized for customers.",
  },
  {
    file: "app/terms/page.tsx",
    text: "Back to home",
    reason: "Terms page navigation should be localized for customers.",
  },
  {
    file: "app/login/page.tsx",
    text: "Signing in...",
    reason: "Login loading copy should be localized for customers.",
  },
  {
    file: "app/login/page.tsx",
    text: "Forgot password?",
    reason: "Login recovery link should be localized for customers.",
  },
  {
    file: "app/login/page.tsx",
    text: "Enter your email and password to continue.",
    reason: "Login validation copy should be localized for customers.",
  },
  {
    file: "app/login/page.tsx",
    text: "Login failed.",
    reason: "Login fallback error copy should be localized for customers.",
  },
  {
    file: "app/register/page.tsx",
    text: "Creating account...",
    reason: "Register loading copy should be localized for customers.",
  },
  {
    file: "app/register/page.tsx",
    text: "Create account",
    reason: "Register action copy should be localized for customers.",
  },
  {
    file: "app/register/page.tsx",
    text: "Enter your name, email, and a password with at least 6 characters.",
    reason: "Register validation copy should be localized for customers.",
  },
  {
    file: "app/register/page.tsx",
    text: "Failed to register.",
    reason: "Register fallback error copy should be localized for customers.",
  },
  {
    file: "app/forgot-password/page.tsx",
    text: "Reset password",
    reason: "Forgot-password heading should be localized for customers.",
  },
  {
    file: "app/forgot-password/page.tsx",
    text: "Sending...",
    reason: "Forgot-password loading copy should be localized for customers.",
  },
  {
    file: "app/forgot-password/page.tsx",
    text: "Send reset link",
    reason: "Forgot-password action copy should be localized for customers.",
  },
  {
    file: "app/forgot-password/page.tsx",
    text: "Enter your email address.",
    reason: "Forgot-password validation copy should be localized for customers.",
  },
  {
    file: "app/forgot-password/page.tsx",
    text: "Failed to send reset email.",
    reason: "Forgot-password fallback error copy should be localized for customers.",
  },
  {
    file: "app/reset-password/page.tsx",
    text: "Set a new password for your Nutritail AI account.",
    reason: "Reset-password helper copy should be localized for customers.",
  },
  {
    file: "app/reset-password/page.tsx",
    text: "Updating...",
    reason: "Reset-password loading copy should be localized for customers.",
  },
  {
    file: "app/reset-password/page.tsx",
    text: "Update password",
    reason: "Reset-password action copy should be localized for customers.",
  },
  {
    file: "app/reset-password/page.tsx",
    text: "Password must be at least 6 characters.",
    reason: "Reset-password validation copy should be localized for customers.",
  },
  {
    file: "app/reset-password/page.tsx",
    text: "Passwords do not match.",
    reason: "Reset-password validation copy should be localized for customers.",
  },
  {
    file: "app/reset-password/page.tsx",
    text: "Failed to update password.",
    reason: "Reset-password fallback error copy should be localized for customers.",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "Loading profile...",
    reason: "Profile loading copy should be localized for customers.",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "Could not load profile",
    reason: "Profile error copy should be localized for customers.",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "Profile updated successfully.",
    reason: "Profile success copy should be localized for customers.",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "Back to dashboard",
    reason: "Profile navigation copy should be localized for customers.",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "How this information is used",
    reason: "Profile guidance copy should be localized for customers.",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "Save profile",
    reason: "Profile save copy should be localized for customers.",
  },
  {
    file: "app/account/layout.tsx",
    text: 'label="Chatbot"',
    reason: "Account navigation should use customer wording instead of the product-internal chatbot label.",
  },
  {
    file: "app/account/page.tsx",
    text: "Nutritail AI dashboard",
    reason: "Account dashboard intro should use localized customer wording.",
  },
  {
    file: "app/account/page.tsx",
    text: "Διατροφικό chatbot",
    reason: "Account dashboard should use customer advisor wording instead of chatbot product wording.",
  },
  {
    file: "app/account/page.tsx",
    text: "τελευταίο match",
    reason: "Account dashboard should avoid matcher/internal wording.",
  },
  {
    file: "app/account/page.tsx",
    text: "Δυνατό fit",
    reason: "Account dashboard should use fully Greek food-suitability wording.",
  },
  {
    file: "app/account/page.tsx",
    text: "Χρήσιμο fit",
    reason: "Account dashboard should use fully Greek food-suitability wording.",
  },
  {
    file: "app/account/profile/page.tsx",
    text: "σωστό context",
    reason: "Profile guidance should use Greek wording instead of mixed-language context wording.",
  },
  {
    file: "app/print/pet-timeline/[id]/page.tsx",
    text: "διατροφικό context",
    reason: "Printable timeline should use Greek wording instead of mixed-language context wording.",
  },
  {
    file: "app/print/pet-timeline/[id]/page.tsx",
    text: "ιστορικό του chatbot",
    reason: "Printable timeline should use advisor wording instead of chatbot product wording.",
  },
  {
    file: "app/account/page.tsx",
    text: "Fit τροφής",
    reason: "Account dashboard should use fully Greek customer wording for food suitability.",
  },
  {
    file: "app/account/pets/page.tsx",
    text: "Fit τροφής",
    reason: "Pet list should use fully Greek customer wording for food suitability.",
  },
  {
    file: "app/account/pets/[id]/page.tsx",
    text: "Fit τροφής",
    reason: "Pet detail should use fully Greek customer wording for food suitability.",
  },
  {
    file: "app/print/pet-report/[id]/page.tsx",
    text: "Fit τροφής",
    reason: "Printable report should use fully Greek customer wording for food suitability.",
  },
  {
    file: "app/account/chatbot/page.tsx",
    text: "Food match",
    reason: "Chatbot summary should use customer wording such as selected food, not matching internals.",
  },
  {
    file: "app/account/chatbot/page.tsx",
    text: "No matched food",
    reason: "Chatbot summary should say no food is selected yet, not expose matching internals.",
  },
  {
    file: "lib/nutrition/chatGuardrails.ts",
    text: "Safety notes:",
    reason: "Guardrail copy should use customer wording instead of internal safety-section labels.",
  },
  {
    file: "lib/nutrition/chatGuardrails.ts",
    text: "Confidence notes:",
    reason: "Guardrail copy should not expose confidence-section labels to customers.",
  },
  {
    file: "lib/nutrition/chatGuardrails.ts",
    text: "Useful follow-up questions:",
    reason: "Guardrail copy should ask the next helpful question in customer language.",
  },
];

const failures: string[] = [];

for (const file of customerCopyFiles) {
  const source = readFileSync(file, "utf8");

  for (const banned of bannedCustomerCopy) {
    if (banned.pattern.test(source)) {
      failures.push(`${file}: ${banned.reason}`);
    }
  }
}

for (const required of requiredCustomerCopy) {
  const source = readFileSync(required.file, "utf8");
  if (!source.includes(required.text)) {
    failures.push(`${required.file}: missing required customer copy "${required.text}".`);
  }
}

for (const banned of bannedExactCustomerStrings) {
  const source = readFileSync(banned.file, "utf8");
  if (source.includes(banned.text)) {
    failures.push(`${banned.file}: ${banned.reason}`);
  }
}

function writeReport() {
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(
    reportPath,
    [
      "# Customer UX Copy Contract QA",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "This QA checks customer-facing account/chatbot copy for backend leakage and required customer guidance.",
      "",
      "## Summary",
      "",
      `- Files checked: ${new Set([...customerCopyFiles, ...requiredCustomerCopy.map((item) => item.file)]).size}`,
      `- Banned copy checks: ${bannedCustomerCopy.length}`,
      `- Banned exact string checks: ${bannedExactCustomerStrings.length}`,
      `- Required copy checks: ${requiredCustomerCopy.length}`,
      `- Failed: ${failures.length}`,
      "",
      "## Result",
      "",
      failures.length === 0 ? "PASS" : "FAIL",
      "",
      "## Failures",
      "",
      ...(failures.length > 0 ? failures.map((failure) => `- ${failure}`) : ["- none"]),
    ].join("\n") + "\n",
    "utf8",
  );
}

writeReport();

if (failures.length > 0) {
  console.error("Customer UX copy contract failed:");
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Customer UX copy contract QA passed.");
