"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    try {
      setIsLoading(true);
      setError("");

      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.session || !data.user) {
        throw new Error("Login failed. No session returned.");
      }

      await fetch("/api/account/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authUserId: data.user.id,
          email: data.user.email,
          fullName:
            data.user.user_metadata?.full_name ||
            data.user.email ||
            "Customer",
        }),
      });

      router.replace("/account");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-black">Login</h1>

        <p className="mt-2 text-sm text-gray-600">
          Συνδέσου στο Nutritail AI account σου.
        </p>

        <div className="mt-6 space-y-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full rounded-xl border border-gray-300 p-3 text-black"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="w-full rounded-xl border border-gray-300 p-3 text-black"
          />

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full rounded-xl bg-black py-3 text-white disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>

          <a
            href="/register"
            className="block text-center text-sm text-gray-600 underline"
          >
            Δεν έχεις λογαριασμό; Δημιούργησε έναν.
          </a>
        </div>
      </section>
    </main>
  );
}