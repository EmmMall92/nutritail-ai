"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { getCustomerAuthErrorMessage } from "@/lib/auth/customerAuthMessages";
import { createClient } from "@/lib/supabase/client";

function getSafeRedirectPath() {
  if (typeof window === "undefined") {
    return "/account";
  }

  const nextPath = new URLSearchParams(window.location.search).get("next");

  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/account";
  }

  if (nextPath.startsWith("/login") || nextPath.startsWith("/register")) {
    return "/account";
  }

  return nextPath;
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setRedirectPath(getSafeRedirectPath());
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
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {error}
            <p className="mt-1 text-xs text-red-600">
              Έλεγξε email και κωδικό ή κάνε επαναφορά αν δεν είσαι σίγουρος/η.
            </p>
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
