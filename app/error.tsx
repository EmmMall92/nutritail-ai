"use client";

import { useEffect } from "react";
import Link from "next/link";

function reportClientError(error: Error & { digest?: string }) {
  fetch("/api/monitoring/client-error", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    keepalive: true,
    body: JSON.stringify({
      message: error.message,
      digest: error.digest,
      source: "app_error_boundary",
      path: typeof window !== "undefined" ? window.location.pathname : "",
    }),
  }).catch(() => {
    // The fallback must never fail because monitoring failed.
  });
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f4] px-6 text-black">
      <section className="w-full max-w-xl rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-red-700">
          Κάτι πήγε στραβά
        </p>
        <h1 className="mt-3 text-3xl font-black">
          Δεν μπορέσαμε να φορτώσουμε αυτή τη σελίδα.
        </h1>
        <p className="mt-4 leading-7 text-gray-700">
          Καταγράψαμε το πρόβλημα για έλεγχο. Δοκίμασε ξανά σε λίγο ή γύρνα
          στην αρχική σελίδα.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
          >
            Δοκίμασε ξανά
          </button>
          <Link
            href="/"
            className="rounded-xl border border-black/15 px-5 py-3 text-sm font-bold text-black transition hover:bg-gray-100"
          >
            Αρχική
          </Link>
        </div>
      </section>
    </main>
  );
}
