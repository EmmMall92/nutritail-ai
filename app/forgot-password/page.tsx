"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { getCustomerAuthErrorMessage } from "@/lib/auth/customerAuthMessages";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleResetRequest(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      if (!email.trim()) {
        throw new Error("Γράψε το email σου.");
      }

      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        throw error;
      }

      setSuccess(
        "Αν υπάρχει λογαριασμός με αυτό το email, έχει σταλεί link επαναφοράς κωδικού."
      );
    } catch (err) {
      console.error(err);
      setError(getCustomerAuthErrorMessage(err, "forgot"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Βοήθεια σύνδεσης"
      title="Επαναφορά κωδικού"
      description="Γράψε το email του λογαριασμού σου και θα στείλουμε ασφαλές link για να ορίσεις νέο κωδικό."
    >
      <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        <p className="font-semibold text-blue-950">Τι να περιμένεις</p>
        <ul className="mt-2 space-y-1">
          <li>- Αν υπάρχει λογαριασμός, θα λάβεις link επαναφοράς στο email.</li>
          <li>- Το link ανοίγει τη σελίδα νέου κωδικού στο NutriTail.</li>
          <li>- Αν δεν το δεις, έλεγξε και spam/promotions.</li>
        </ul>
      </div>

      <div
        className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700"
        data-testid="auth-next-step-card"
      >
        <p className="font-semibold text-gray-950">Δεν χάνεις τα αποθηκευμένα στοιχεία σου.</p>
        <p className="mt-1">
          Μετά την αλλαγή κωδικού θα συνδεθείς ξανά και θα βρεις τα pets,
          reports και progress checks στον λογαριασμό σου.
        </p>
      </div>

      <div
        className="mb-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
        data-testid="auth-recovery-help-card"
      >
        <p className="font-semibold text-amber-950">
          Αν δεν δεις το email σε λίγα λεπτά
        </p>
        <ul className="mt-2 space-y-1">
          <li>- Έλεγξε spam, promotions και αν έγραψες σωστά το email.</li>
          <li>- Ζήτησε νέο link μόνο αφού περάσουν λίγα λεπτά.</li>
          <li>- Άνοιξε το link από την ίδια συσκευή και browser όπου θα συνεχίσεις.</li>
        </ul>
      </div>

      <form onSubmit={handleResetRequest} className="space-y-4">
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

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {error}
            <p className="mt-1 text-xs text-red-600">
              Έλεγξε ότι το email είναι σωστό και δοκίμασε ξανά σε λίγο.
            </p>
          </div>
        )}

        {success && (
          <div
            className="rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-700"
            data-testid="auth-forgot-email-sent-next-steps"
          >
            <p>{success}</p>
            <p className="mt-1 text-xs text-green-700">
              Άνοιξε το link από την ίδια συσκευή ή γύρνα εδώ αν χρειαστεί να
              ζητήσεις νέο.
            </p>
            <Link
              href="/login"
              className="mt-3 inline-flex rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-800"
            >
              Πίσω στη σύνδεση
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Στέλνουμε το link..." : "Στείλε link επαναφοράς"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Θυμήθηκες τον κωδικό;{" "}
          <Link
            href="/login"
            className="font-semibold text-black underline decoration-gray-300 underline-offset-4"
          >
            Πίσω στη σύνδεση
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
