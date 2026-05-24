"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleResetRequest() {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      if (!email.trim()) {
        throw new Error("Enter your email address.");
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
        "If an account exists for that email, a password reset link has been sent."
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to send reset email."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-black">Reset password</h1>

        <p className="mt-2 text-sm text-gray-600">
          Enter your email and we will send a secure password reset link.
        </p>

        <div className="mt-6 space-y-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            autoComplete="email"
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
            type="button"
            onClick={handleResetRequest}
            disabled={isLoading}
            className="w-full rounded-xl bg-black py-3 text-white disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send reset link"}
          </button>

          <Link
            href="/login"
            className="block text-center text-sm text-gray-600 underline"
          >
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}
