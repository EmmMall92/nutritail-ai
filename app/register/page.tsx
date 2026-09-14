"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { buildAuthCallbackPath, normalizeSafeRedirectPath } from "@/lib/auth/safeRedirect";
import { getCustomerAuthErrorMessage } from "@/lib/auth/customerAuthMessages";
import {
  REGISTRATION_LEGAL_SOURCE,
  TERMS_VERSION,
} from "@/lib/legal/config";
import { PRIVACY_POLICY_VERSION } from "@/lib/privacy/config";
import { createClient } from "@/lib/supabase/client";

function getSafeRedirectPath() {
  if (typeof window === "undefined") {
    return "/account";
  }

  const nextPath = new URLSearchParams(window.location.search).get("next");

  return normalizeSafeRedirectPath(nextPath);
}

function getRedirectLabel(path: string) {
  if (path.startsWith("/account/food-compare")) {
    return "στη σύγκριση τροφών";
  }

  if (path.startsWith("/account/chatbot")) {
    return "στο chatbot για την πρώτη ανάλυση";
  }

  if (path.startsWith("/account/pets")) {
    return "στο προφίλ κατοικιδίου";
  }

  if (path.startsWith("/print/")) {
    return "στην εκτυπώσιμη αναφορά";
  }

  return "στον λογαριασμό σου";
}

function isValidCustomerEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function RegisterPage() {
  const router = useRouter();
  const [redirectPath, setRedirectPath] = useState("/account");
  const loginHref =
    redirectPath === "/account"
      ? "/login"
      : `/login?next=${encodeURIComponent(redirectPath)}`;
  const redirectLabel = getRedirectLabel(redirectPath);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setRedirectPath(getSafeRedirectPath());
  }, []);

  async function handleRegister(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      if (!fullName.trim() || !email.trim() || password.length < 6) {
        throw new Error(
          "Γράψε ονοματεπώνυμο, email και κωδικό με τουλάχιστον 6 χαρακτήρες."
        );
      }

      if (!termsAccepted) {
        throw new Error(
          "Για να δημιουργηθεί ο λογαριασμός, χρειάζεται να αποδεχτείς τους Όρους Χρήσης."
        );
      }

      const trimmedEmail = email.trim();

      if (!isValidCustomerEmail(trimmedEmail)) {
        throw new Error(
          "Έλεγξε ότι το email είναι γραμμένο σωστά, π.χ. name@example.com."
        );
      }

      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${buildAuthCallbackPath(redirectPath)}`,
          data: {
            full_name: fullName.trim(),
            terms_accepted: true,
            terms_version: TERMS_VERSION,
            privacy_notice_acknowledged: true,
            privacy_notice_version: PRIVACY_POLICY_VERSION,
            legal_acceptance_source: REGISTRATION_LEGAL_SOURCE,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("Δεν μπόρεσε να δημιουργηθεί ο λογαριασμός.");
      }

      await fetch("/api/account/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authUserId: data.user.id,
          email: trimmedEmail,
          fullName: fullName.trim(),
        }),
      });

      if (data.session) {
        setSuccess("Ο λογαριασμός δημιουργήθηκε. Σε μεταφέρουμε στον πίνακά σου...");
        setTimeout(() => {
          router.push(redirectPath);
        }, 1000);
        return;
      }

      setSuccess(
        "Ο λογαριασμός δημιουργήθηκε. Έλεγξε το email σου για επιβεβαίωση πριν συνδεθείς."
      );
    } catch (err) {
      console.error(err);

      setError(getCustomerAuthErrorMessage(err, "register"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Ξεκίνα δωρεάν"
      title="Δημιουργία λογαριασμού"
      description="Αποθήκευσε κατοικίδια, διατροφικές αναλύσεις και αναφορές για να επιστρέφεις όποτε τα χρειάζεσαι."
    >
      <form onSubmit={handleRegister} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-800">Ονοματεπώνυμο</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ονοματεπώνυμο"
            autoComplete="name"
            className="mt-2 h-12 w-full rounded-lg border border-[#cbd7cf] px-3 text-black outline-none transition focus:border-[#1f7a4d] focus:ring-2 focus:ring-[#d8efe1]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-800">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            className="mt-2 h-12 w-full rounded-lg border border-[#cbd7cf] px-3 text-black outline-none transition focus:border-[#1f7a4d] focus:ring-2 focus:ring-[#d8efe1]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-800">Κωδικός</span>
          <div className="mt-2 flex h-12 rounded-lg border border-[#cbd7cf] bg-white transition focus-within:border-[#1f7a4d] focus-within:ring-2 focus-within:ring-[#d8efe1]">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Τουλάχιστον 6 χαρακτήρες"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="min-w-0 flex-1 rounded-l-lg px-3 text-black outline-none"
            />
            <button
              type="button"
              aria-label={showPassword ? "Απόκρυψη κωδικού" : "Εμφάνιση κωδικού"}
              onClick={() => setShowPassword((value) => !value)}
              className="nt-focus flex w-12 shrink-0 items-center justify-center rounded-r-lg border-l border-[#dce5df] text-[#52635a] transition hover:bg-[#f3f7f4]"
              title={showPassword ? "Απόκρυψη κωδικού" : "Εμφάνιση κωδικού"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <div
          className="flex items-start gap-3 rounded-lg border border-[#dce5df] bg-[#f7faf8] p-3"
          data-testid="registration-legal-acceptance"
        >
          <input
            id="terms-accepted"
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            required
            className="nt-focus mt-0.5 h-5 w-5 shrink-0 accent-[#1f7a4d]"
          />
          <label htmlFor="terms-accepted" className="text-sm leading-6 text-[#42534a]">
            Αποδέχομαι τους{" "}
            <Link
              href="/terms"
              target="_blank"
              className="font-bold text-[#123d2b] underline underline-offset-4"
            >
              Όρους Χρήσης
            </Link>{" "}
            και επιβεβαιώνω ότι ενημερώθηκα για την{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="font-bold text-[#123d2b] underline underline-offset-4"
            >
              Πολιτική Απορρήτου
            </Link>
            .
          </label>
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div
            className="rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-700"
            data-testid="auth-register-confirmation-next-steps"
          >
            {success}
            <p className="mt-1 text-xs text-green-700">
              Αν ζητηθεί επιβεβαίωση, άνοιξε το email στην ίδια συσκευή και μετά γύρνα στο NutriTail.
            </p>
            {!success.includes("μεταφέρουμε") && (
              <Link
                href={loginHref}
                className="mt-3 inline-flex rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-800"
              >
                Συνέχεια στη σύνδεση
              </Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="nt-focus w-full rounded-lg bg-[#1f7a4d] py-3.5 text-sm font-bold text-white transition hover:bg-[#196740] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Δημιουργείται λογαριασμός..." : "Δημιουργία λογαριασμού"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Έχεις ήδη λογαριασμό;{" "}
          <Link
            href={loginHref}
            className="font-semibold text-black underline decoration-gray-300 underline-offset-4"
          >
            Σύνδεση
          </Link>
        </p>
        <p
          className="text-center text-xs text-[#7a8980]"
          data-testid="auth-redirect-destination"
        >
          Μετά την εγγραφή θα συνεχίσεις {redirectLabel}.
        </p>
      </form>
    </AuthShell>
  );
}
