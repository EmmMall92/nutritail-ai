"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
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

export default function RegisterPage() {
  const router = useRouter();
  const [redirectPath, setRedirectPath] = useState("/account");
  const loginHref =
    redirectPath === "/account"
      ? "/login"
      : `/login?next=${encodeURIComponent(redirectPath)}`;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectPath}`,
          data: {
            full_name: fullName.trim(),
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
          email: email.trim(),
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

      setError(err instanceof Error ? err.message : "Δεν ολοκληρώθηκε η εγγραφή.");
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
      <div className="mb-5 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-900">
        <p className="font-semibold text-green-950">
          Ο λογαριασμός κρατά το NutriTail χρήσιμο όσο περνάει ο καιρός.
        </p>
        <ul className="mt-2 space-y-1">
          <li>- Αποθηκεύεις προφίλ κατοικιδίων και σημειώσεις υγείας.</li>
          <li>- Κρατάς εκτυπώσιμες αναφορές σε ένα σημείο.</li>
          <li>- Ξανατρέχεις προτάσεις όταν αλλάζει τροφή ή βάρος.</li>
        </ul>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-800">Ονοματεπώνυμο</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ονοματεπώνυμο"
            autoComplete="name"
            className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-black outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
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
            className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-black outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-800">Κωδικός</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Τουλάχιστον 6 χαρακτήρες"
            type="password"
            autoComplete="new-password"
            className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-black outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </label>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-700">
            {success}
            <p className="mt-1 text-xs text-green-700">
              Αν ζητηθεί επιβεβαίωση, άνοιξε το email στην ίδια συσκευή και μετά γύρνα στο NutriTail.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
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
      </form>
    </AuthShell>
  );
}
