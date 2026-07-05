import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const docsPath = "docs/email/resend-supabase-auth.md";
const templatesDir = "docs/email/supabase-auth-templates";

assert(existsSync(docsPath), "Missing Resend/Supabase auth email runbook.");
assert(existsSync(templatesDir), "Missing Supabase auth email templates directory.");

const docs = readFileSync(docsPath, "utf8");

for (const marker of [
  "smtp.resend.com",
  "Port | `465`",
  "Username | `resend`",
  "NutriTail AI <no-reply@nutritail.ai>",
  "Supabase remains the auth source of truth",
]) {
  assert(docs.includes(marker), `Runbook missing marker: ${marker}`);
}

const requiredTemplates = [
  "confirm-signup.html",
  "reset-password.html",
  "magic-link.html",
  "invite-user.html",
  "email-change.html",
  "reauthentication.html",
  "password-changed.html",
];

const files = new Set(readdirSync(templatesDir));

for (const file of requiredTemplates) {
  assert(files.has(file), `Missing Supabase auth template: ${file}`);
}

for (const file of requiredTemplates) {
  const source = readFileSync(join(templatesDir, file), "utf8");

  assert(source.includes("NutriTail AI"), `${file} must be branded.`);
  assert(!source.toLowerCase().includes("supabase"), `${file} must not mention Supabase to customers.`);
  assert(source.includes("<!doctype html>"), `${file} must be standalone HTML.`);

  if (file !== "reauthentication.html" && file !== "password-changed.html") {
    assert(source.includes("{{ .ConfirmationURL }}"), `${file} must keep the Supabase confirmation URL variable.`);
  }

  if (file === "magic-link.html" || file === "reauthentication.html") {
    assert(source.includes("{{ .Token }}"), `${file} must include the OTP token variable.`);
  }

  if (file === "email-change.html") {
    assert(source.includes("{{ .NewEmail }}"), `${file} must include the new email variable.`);
  }
}

console.log(`Resend auth email template QA passed (${requiredTemplates.length} templates).`);
