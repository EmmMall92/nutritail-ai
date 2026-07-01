"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setIsReady(Boolean(data.session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setIsReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handlePasswordUpdate(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      if (password.length < 6) {
        throw new Error("Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.");
      }

      if (password !== confirmPassword) {
        throw new Error("Οι δύο κωδικοί δεν ταιριάζουν.");
      }

      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setSuccess("Ο κωδικός ενημερώθηκε. Σε μεταφέρουμε στη σύνδεση...");

      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Δεν μπόρεσε να ενημερωθεί ο κωδικός."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Ασφαλής αλλαγή"
      title="Νέος κωδικός"
      description="Όρισε νέο κωδικό για τον λογαριασμό NutriTail AI και μετά συνδέσου ξανά."
    >
      {!isReady && (
        <div className="mb-5 rounded-xl border border-yellow-100 bg-yellow-50 p-4 text-sm leading-6 text-yellow-900">
          <p className="font-semibold text-yellow-950">
            Άνοιξε αυτή τη σελίδα από το email επαναφοράς.
          </p>
          <p className="mt-1">
            Αν το link έχει λήξει ή άνοιξε χωρίς session, ζήτησε νέο link
            επαναφοράς και άνοιξέ το από την ίδια συσκευή.
          </p>
        </div>
      )}

      <div
        className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900"
        data-testid="auth-next-step-card"
      >
        <p className="font-semibold text-blue-950">Μετά την αλλαγή θα συνδεθείς ξανά με ασφάλεια.</p>
        <p className="mt-1">
          Θα σε μεταφέρουμε στη σύνδεση, ώστε να συνεχίσεις με τα αποθηκευμένα
          κατοικίδια, reports και νέα ανάλυση αν χρειάζεται.
        </p>
      </div>

      <div
        className="mb-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
        data-testid="auth-reset-help-card"
      >
        <p className="font-semibold text-amber-950">
          Αν το link δεν λειτουργεί
        </p>
        <ul className="mt-2 space-y-1">
          <li>- Μπορεί να έχει λήξει ή να άνοιξε χωρίς ενεργό recovery session.</li>
          <li>- Ζήτησε νέο link επαναφοράς και άνοιξέ το από την ίδια συσκευή.</li>
          <li>- Μετά την αλλαγή θα επιστρέψεις στη σύνδεση για να μπεις καθαρά.</li>
        </ul>
      </div>

      <form onSubmit={handlePasswordUpdate} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-800">Νέος κωδικός</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Νέος κωδικός"
            type="password"
            autoComplete="new-password"
            className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-black outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-800">
            Επιβεβαίωση νέου κωδικού
          </span>
          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Επιβεβαίωση νέου κωδικού"
            type="password"
            autoComplete="new-password"
            className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-black outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </label>

        <p className="text-xs leading-5 text-gray-500">
          Χρησιμοποίησε τουλάχιστον 6 χαρακτήρες. Μετά την αλλαγή θα σε
          μεταφέρουμε στη σύνδεση.
        </p>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-700">
            <p>{success}</p>
            <Link
              href="/login"
              className="mt-3 inline-flex rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-800"
            >
              Σύνδεση στον λογαριασμό
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !isReady}
          className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Ενημερώνεται..." : "Ενημέρωση κωδικού"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Δεν λειτουργεί το link;{" "}
          <Link
            href="/forgot-password"
            className="font-semibold text-black underline decoration-gray-300 underline-offset-4"
          >
            Ζήτησε νέο link επαναφοράς
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
