"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
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
      setError(
        err instanceof Error ? err.message : "Δεν μπόρεσε να σταλεί email επαναφοράς."
      );
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
          <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-700">
            {success}
            <p className="mt-1 text-xs text-green-700">
              Άνοιξε το link από την ίδια συσκευή ή γύρνα εδώ αν χρειαστεί να
              ζητήσεις νέο.
            </p>
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
