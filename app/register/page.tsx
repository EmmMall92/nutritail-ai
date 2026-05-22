"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister() {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
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
          email,
          fullName,
        }),
      });

      setSuccess(
        "Ο λογαριασμός δημιουργήθηκε! Μπορείς τώρα να συνδεθείς."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Failed to register."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-black">
          Create account
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Δημιούργησε λογαριασμό στο Nutritail AI.
        </p>

        <div className="mt-6 space-y-4">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-xl border border-gray-300 p-3"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full rounded-xl border border-gray-300 p-3"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="w-full rounded-xl border border-gray-300 p-3"
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
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full rounded-xl bg-black py-3 text-white disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create account"}
          </button>
        </div>
      </section>
    </main>
  );
}