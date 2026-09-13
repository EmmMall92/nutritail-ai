"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import {
  buildAuthCallbackPath,
  normalizeSafeRedirectPath,
} from "@/lib/auth/safeRedirect";
import { getCustomerAuthErrorMessage } from "@/lib/auth/customerAuthMessages";
import { createClient } from "@/lib/supabase/client";

function getSafeRedirectPath() {
  if (typeof window === "undefined") {
    return "/account";
  }

  const nextPath = new URLSearchParams(window.location.search).get("next");

  return normalizeSafeRedirectPath(nextPath);
}

function getRedirectLabel(path: string) {
  if (path.startsWith("/account/chatbot")) {
    return "στο chatbot για νέα ανάλυση ή συνέχεια συζήτησης";
  }

  if (path.startsWith("/account/pets")) {
    return "στο προφίλ κατοικιδίου";
  }

  if (path.startsWith("/print/")) {
    return "στην εκτυπώσιμη αναφορά";
  }

  if (path.startsWith("/admin")) {
    return "στη σελίδα διαχείρισης";
  }

  return "στον λογαριασμό σου";
}

async function verifyAdminRedirect(accessToken: string, redirectPath: string) {
  if (!redirectPath.startsWith("/admin")) {
    return;
  }

  const response = await fetch("/api/admin/me", {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.ok) {
    return;
  }

  const result = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  throw new Error(
    result?.error || "Login succeeded, but this account is not an admin."
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [redirectPath, setRedirectPath] = useState("/account");
  const registerHref =
    redirectPath === "/account"
      ? "/register"
      : `/register?next=${encodeURIComponent(redirectPath)}`;
  const redirectLabel = getRedirectLabel(redirectPath);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [confirmationRecovery, setConfirmationRecovery] = useState(false);
  const [confirmationSuccess, setConfirmationSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);

  useEffect(() => {
    setRedirectPath(getSafeRedirectPath());

    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "confirmation") {
      setConfirmationRecovery(true);
      setError(
        "Ο σύνδεσμος επιβεβαίωσης δεν ολοκληρώθηκε ή έχει λήξει. Ζήτησε νέο email και δοκίμασε ξανά."
      );
    }
  }, []);

  async function handleLogin(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    try {
      setIsLoading(true);
      setError("");
      setConfirmationSuccess("");

      if (!email.trim() || !password) {
        throw new Error("Γράψε email και κωδικό για να συνεχίσεις.");
      }

      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.session || !data.user) {
        throw new Error("Δεν ολοκληρώθηκε η σύνδεση. Δοκίμασε ξανά.");
      }

      await fetch("/api/account/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authUserId: data.user.id,
          email: data.user.email,
          fullName:
            data.user.user_metadata?.full_name ||
            data.user.email ||
            "Customer",
        }),
      });

      await verifyAdminRedirect(data.session.access_token, redirectPath);

      router.replace(redirectPath);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(getCustomerAuthErrorMessage(err, "login"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendConfirmation() {
    try {
      setIsResendingConfirmation(true);
      setError("");
      setConfirmationSuccess("");

      if (!email.trim()) {
        throw new Error(
          "Γράψε πρώτα το email που χρησιμοποίησες στην εγγραφή."
        );
      }

      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}${buildAuthCallbackPath(
            redirectPath
          )}`,
        },
      });

      if (error) {
        throw error;
      }

      setConfirmationSuccess(
        "Αν υπάρχει λογαριασμός που περιμένει επιβεβαίωση, στείλαμε νέο email. Άνοιξε μόνο τον πιο πρόσφατο σύνδεσμο."
      );
    } catch (err) {
      console.error(err);
      setError(getCustomerAuthErrorMessage(err, "confirmation"));
    } finally {
      setIsResendingConfirmation(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Καλωσήρθες ξανά"
      title="Σύνδεση"
      description="Συνέχισε στα κατοικίδια, τις αναλύσεις και τις προτάσεις τροφών που έχεις αποθηκεύσει."
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-800">Email</span>
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setConfirmationSuccess("");
            }}
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
              placeholder="Κωδικός"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-gray-700 underline decoration-gray-300 underline-offset-4 transition hover:text-black"
          >
            Ξέχασες τον κωδικό;
          </Link>
        </div>

        {error && (
          <div
            className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
            data-testid="auth-login-error-next-actions"
          >
            {error}
            <p className="mt-1 text-xs text-red-600">
              {confirmationRecovery
                ? "Γράψε το ίδιο email που χρησιμοποίησες στην εγγραφή και ζήτησε νέο σύνδεσμο."
                : "Έλεγξε email και κωδικό ή κάνε επαναφορά αν δεν είσαι σίγουρος/η."}
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              {confirmationRecovery ? (
                <button
                  type="button"
                  data-testid="auth-resend-confirmation"
                  onClick={handleResendConfirmation}
                  disabled={isResendingConfirmation}
                  className="rounded-lg bg-red-700 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isResendingConfirmation
                    ? "Στέλνεται..."
                    : "Νέο email επιβεβαίωσης"}
                </button>
              ) : (
                <>
                  <Link
                    href="/forgot-password"
                    className="rounded-lg bg-red-700 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-red-800"
                  >
                    Επαναφορά κωδικού
                  </Link>
                  <Link
                    href={registerHref}
                    className="rounded-lg border border-red-200 bg-white px-3 py-2 text-center text-xs font-semibold text-red-800 transition hover:bg-red-100"
                  >
                    Δημιουργία λογαριασμού
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {confirmationSuccess && (
          <div
            className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800"
            data-testid="auth-resend-confirmation-success"
          >
            {confirmationSuccess}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="nt-focus w-full rounded-lg bg-[#1f7a4d] py-3.5 text-sm font-bold text-white transition hover:bg-[#196740] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Γίνεται σύνδεση..." : "Σύνδεση"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Νέος/α στο NutriTail;{" "}
          <Link
            href={registerHref}
            className="font-semibold text-black underline decoration-gray-300 underline-offset-4"
          >
            Δημιουργία λογαριασμού
          </Link>
        </p>
        <p
          className="text-center text-xs text-[#7a8980]"
          data-testid="auth-redirect-destination"
        >
          Μετά τη σύνδεση θα συνεχίσεις {redirectLabel}.
        </p>
      </form>
    </AuthShell>
  );
}
