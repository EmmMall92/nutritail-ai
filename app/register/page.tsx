"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-black">Create account</h1>

        <p className="mt-2 text-sm text-gray-600">
          Create your Nutritail AI account to save pet nutrition history.
        </p>

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            autoComplete="name"
            className="w-full rounded-xl border border-gray-300 p-3 text-black"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-gray-300 p-3 text-black"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-gray-300 p-3 text-black"
          />

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-black py-3 text-white disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create account"}
          </button>

          <Link
            href={loginHref}
            className="block text-center text-sm text-gray-600 underline"
          >
            Already have an account? Login.
          </Link>
        </form>
      </section>
    </main>
  );
}
