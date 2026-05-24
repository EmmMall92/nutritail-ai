"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  async function handlePasswordUpdate() {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setSuccess("Password updated. Redirecting to login...");

      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to update password."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-black">Choose new password</h1>

        <p className="mt-2 text-sm text-gray-600">
          Set a new password for your Nutritail AI account.
        </p>

        {!isReady && (
          <div className="mt-6 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
            Open this page from the password reset email link. If the link has
            expired, request a new one.
          </div>
        )}

        <div className="mt-6 space-y-4">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-gray-300 p-3 text-black"
          />

          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
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
            type="button"
            onClick={handlePasswordUpdate}
            disabled={isLoading || !isReady}
            className="w-full rounded-xl bg-black py-3 text-white disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Update password"}
          </button>

          <Link
            href="/forgot-password"
            className="block text-center text-sm text-gray-600 underline"
          >
            Request a new reset link
          </Link>
        </div>
      </section>
    </main>
  );
}
