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

function getRedirectLabel(path: string) {
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

      <div
        className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900"
        data-testid="auth-next-step-card"
      >
        <p className="font-semibold text-blue-950">Μετά την εγγραφή ξεκινάς αμέσως πρακτικά.</p>
        <p className="mt-1">
          Μπορείς να δημιουργήσεις προφίλ κατοικιδίου, να τρέξεις ανάλυση και να κρατήσεις
          αναφορά για μελλοντικό έλεγχο προόδου.
        </p>
        <p
          className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-blue-950"
          data-testid="auth-redirect-destination"
        >
          Μετά την εγγραφή θα συνεχίσεις {redirectLabel}.
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
          <div className="mt-2 flex rounded-xl border border-gray-300 bg-white transition focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-100">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Τουλάχιστον 6 χαρακτήρες"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
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
