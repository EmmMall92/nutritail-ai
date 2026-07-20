"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { normalizeSafeRedirectPath } from "@/lib/auth/safeRedirect";
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setRedirectPath(getSafeRedirectPath());

    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "confirmation") {
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

  return (
    <AuthShell
      eyebrow="Καλωσήρθες ξανά"
      title="Σύνδεση"
      description="Συνέχισε στα κατοικίδια, τις αναλύσεις και τις προτάσεις τροφών που έχεις αποθηκεύσει."
    >
      <div className="mb-5 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-900">
        <p className="font-semibold text-green-950">Μετά τη σύνδεση μπορείς να:</p>
        <ul className="mt-2 space-y-1">
          <li>- Συνεχίσεις μια διατροφική ανάλυση κατοικιδίου.</li>
          <li>- Δεις αποθηκευμένες αναφορές και σημειώσεις σίτισης.</li>
          <li>- Ανανεώσεις προτάσεις όταν αλλάξει βάρος, τροφή ή συμπτώματα.</li>
        </ul>
      </div>

      <div
        className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900"
        data-testid="auth-next-step-card"
      >
        <p className="font-semibold text-blue-950">Θα συνεχίσεις από εκεί που έμεινες.</p>
        <p className="mt-1">
          Αν ήρθες από αναφορά, σύνδεσμο ή έλεγχο προόδου, θα σε γυρίσουμε αυτόματα
          στη σωστή σελίδα μετά τη σύνδεση.
        </p>
        <p
          className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-medium text-blue-950"
          data-testid="auth-login-confirmation-reminder"
        >
          Αν μόλις δημιούργησες λογαριασμό, άνοιξε πρώτα το email επιβεβαίωσης
          και μετά γύρνα εδώ για σύνδεση.
        </p>
        <p
          className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-blue-950"
          data-testid="auth-redirect-destination"
        >
          Επόμενος προορισμός: {redirectLabel}.
        </p>
      </div>

      <div
        className="mb-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-950"
        data-testid="auth-chatbot-prep-card"
      >
        <p className="font-semibold">{"\u0393\u03b9\u03b1 \u03c0\u03b9\u03bf \u03b3\u03c1\u03ae\u03b3\u03bf\u03c1\u03b7 \u03b1\u03bd\u03ac\u03bb\u03c5\u03c3\u03b7, \u03ad\u03c7\u03b5 \u03ad\u03c4\u03bf\u03b9\u03bc\u03b1:"}</p>
        <ul className="mt-2 space-y-1">
          <li>{"- \u0392\u03ac\u03c1\u03bf\u03c2 \u03ba\u03b1\u03b9 \u03b7\u03bb\u03b9\u03ba\u03af\u03b1 \u03ba\u03b1\u03c4\u03bf\u03b9\u03ba\u03b9\u03b4\u03af\u03bf\u03c5"}</li>
          <li>{"- \u03a3\u03c4\u03b5\u03af\u03c1\u03c9\u03c3\u03b7 \u03ba\u03b1\u03b9 \u03b4\u03c1\u03b1\u03c3\u03c4\u03b7\u03c1\u03b9\u03cc\u03c4\u03b7\u03c4\u03b1"}</li>
          <li>{"- \u03a4\u03c9\u03c1\u03b9\u03bd\u03ae \u03c4\u03c1\u03bf\u03c6\u03ae \u03ae \u03c6\u03c9\u03c4\u03bf\u03b3\u03c1\u03b1\u03c6\u03af\u03b1 \u03b5\u03c4\u03b9\u03ba\u03ad\u03c4\u03b1\u03c2"}</li>
          <li>{"- \u03a3\u03c4\u03cc\u03c7\u03bf\u03c2, \u03c0\u03c1\u03bf\u03c4\u03b9\u03bc\u03ae\u03c3\u03b5\u03b9\u03c2 \u03ba\u03b1\u03b9 \u03c4\u03b9 \u03b1\u03c0\u03bf\u03c6\u03b5\u03cd\u03b3\u03b5\u03b9"}</li>
        </ul>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-800">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-black outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-800">Κωδικός</span>
          <div className="mt-2 flex rounded-xl border border-gray-300 bg-white transition focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-100">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Κωδικός"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="min-w-0 flex-1 rounded-l-xl p-3 text-black outline-none"
            />
            <button
              type="button"
              aria-label={showPassword ? "Απόκρυψη κωδικού" : "Εμφάνιση κωδικού"}
              onClick={() => setShowPassword((value) => !value)}
              className="shrink-0 rounded-r-xl border-l border-gray-200 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              {showPassword ? "Απόκρυψη" : "Εμφάνιση"}
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
              Έλεγξε email και κωδικό ή κάνε επαναφορά αν δεν είσαι σίγουρος/η.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
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
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
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
      </form>
    </AuthShell>
  );
}
