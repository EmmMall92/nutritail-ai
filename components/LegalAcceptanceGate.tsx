"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { TERMS_VERSION } from "@/lib/legal/config";

type GateStatus = "loading" | "accepted" | "required" | "error";

export function LegalAcceptanceGate() {
  const pathname = usePathname();
  const [status, setStatus] = useState<GateStatus>("loading");
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const privacyRoute = pathname.startsWith("/account/privacy");

  useEffect(() => {
    if (privacyRoute) return;

    let cancelled = false;

    async function loadAcceptance() {
      try {
        const response = await fetch("/api/account/legal-acceptance", {
          cache: "no-store",
        });
        const result = (await response.json()) as { accepted?: boolean };
        if (!response.ok) throw new Error("Legal acceptance check failed.");
        if (!cancelled) setStatus(result.accepted ? "accepted" : "required");
      } catch (error) {
        console.error(error);
        if (!cancelled) setStatus("error");
      }
    }

    void loadAcceptance();
    return () => {
      cancelled = true;
    };
  }, [privacyRoute]);

  async function submitAcceptance() {
    if (!accepted || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/account/legal-acceptance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: true }),
      });
      if (!response.ok) throw new Error("Legal acceptance write failed.");
      setStatus("accepted");
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (privacyRoute || status === "accepted") return null;

  if (status === "loading") {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f7faf8] p-4"
        role="status"
        aria-live="polite"
        data-testid="legal-acceptance-loading"
      >
        <div className="flex items-center gap-3 text-sm font-bold text-[#31463a]">
          <LoaderCircle className="animate-spin text-[#17663f]" size={20} aria-hidden="true" />
          Έλεγχος ενημερωμένων όρων...
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b2117]/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-acceptance-title"
      data-testid="legal-acceptance-gate"
    >
      <div className="w-full max-w-xl rounded-lg border border-[#c9d8ce] bg-white p-6 shadow-2xl sm:p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#eaf7ef] text-[#17663f]">
          <ShieldCheck size={22} aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-extrabold uppercase text-[#1f7a4d]">
          Νέα έκδοση όρων {TERMS_VERSION}
        </p>
        <h2 id="legal-acceptance-title" className="mt-2 text-2xl font-black text-[#14221b]">
          Καθαρό όριο μεταξύ επιλογής τροφής και κτηνιατρικής φροντίδας
        </h2>
        <p className="mt-4 text-sm leading-6 text-[#52635a]">
          Οι όροι διευκρινίζουν ότι το Nutritail κάνει ενημερωτική αντιστοίχιση για
          μη ιατρικές περιπτώσεις. Πάθηση, φάρμακα, θεραπευτική δίαιτα ή δηλωμένη
          αλλεργία σταματούν την κατάταξη προϊόντων, τις θερμίδες και τα γραμμάρια
          και οδηγούν σε κτηνίατρο.
        </p>

        {status === "error" && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
            Δεν μπορέσαμε να επιβεβαιώσουμε ή να καταγράψουμε την επιλογή σου. Δοκίμασε ξανά.
          </p>
        )}

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-[#dce5df] bg-[#f7faf8] p-4">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[#17663f]"
          />
          <span className="text-sm leading-6 text-[#31463a]">
            Διάβασα και αποδέχομαι τους ενημερωμένους{" "}
            <Link href="/terms" className="font-bold text-[#17663f] underline underline-offset-4">
              Όρους Χρήσης
            </Link>
            .
          </span>
        </label>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/account/privacy"
            className="nt-focus rounded-lg text-sm font-bold text-[#17663f] underline underline-offset-4"
          >
            Πρόσβαση στα δεδομένα και το απόρρητο
          </Link>
          <button
            type="button"
            onClick={submitAcceptance}
            disabled={!accepted || isSubmitting}
            className="nt-focus inline-flex min-h-11 items-center justify-center rounded-lg bg-[#123d2b] px-5 text-sm font-black text-white transition hover:bg-[#17663f] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isSubmitting ? "Καταγραφή..." : "Αποδοχή και συνέχεια"}
          </button>
        </div>
      </div>
    </div>
  );
}
