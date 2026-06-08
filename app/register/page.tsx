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
          "Enter your name, email, and a password with at least 6 characters."
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
        throw new Error("Failed to create user.");
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
        setSuccess("Account created. Redirecting to your dashboard...");
        setTimeout(() => {
          router.push(redirectPath);
        }, 1000);
        return;
      }

      setSuccess(
        "Account created. Check your email to confirm your address before signing in."
      );
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Failed to register.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Start free"
      title="Create account"
      description="Save your pets, keep nutrition analyses, and return to reports whenever you need them."
    >
      <div className="mb-5 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-900">
        <p className="font-semibold text-green-950">
          Your account keeps Nutritail useful over time.
        </p>
        <ul className="mt-2 space-y-1">
          <li>- Save pet profiles and health notes.</li>
          <li>- Keep printable reports in one place.</li>
          <li>- Re-run recommendations when food or weight changes.</li>
        </ul>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-800">Full name</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
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
          <span className="text-sm font-medium text-gray-800">Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
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
              If confirmation is required, open the email on the same device
              and then return to Nutritail.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href={loginHref}
            className="font-semibold text-black underline decoration-gray-300 underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
