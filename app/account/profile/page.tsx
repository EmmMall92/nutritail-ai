"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Customer = {
  id: string;
  authUserId?: string | null;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  bonusCardCode?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function AccountProfilePage() {
  const router = useRouter();
  const pathname = usePathname();

  const [authUserId, setAuthUserId] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    bonusCardCode: "",
    notes: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        setError("");

        const supabase = createClient();
        const { data } = await supabase.auth.getSession();

        if (!data.session?.user) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        const user = data.session.user;
        setAuthUserId(user.id);

        const response = await fetch("/api/account/me", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authUserId: user.id,
            email: user.email,
            fullName: user.user_metadata?.full_name || user.email || "Πελάτης",
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error(result.error);
          throw new Error("Δεν μπόρεσα να φορτώσω το προφίλ.");
        }

        const loadedCustomer = result as Customer;
        setCustomer(loadedCustomer);

        setForm({
          fullName: loadedCustomer.fullName || "",
          phone: loadedCustomer.phone || "",
          bonusCardCode: loadedCustomer.bonusCardCode || "",
          notes: loadedCustomer.notes || "",
        });
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Δεν μπόρεσα να φορτώσω το προφίλ.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [pathname, router]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError("");
      setSavedMessage("");

      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authUserId,
          ...form,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(result.error);
        throw new Error("Δεν μπόρεσα να ενημερώσω το προφίλ.");
      }

      const updatedCustomer = result as Customer;
      setCustomer(updatedCustomer);

      setForm({
        fullName: updatedCustomer.fullName || "",
        phone: updatedCustomer.phone || "",
        bonusCardCode: updatedCustomer.bonusCardCode || "",
        notes: updatedCustomer.notes || "",
      });

      setSavedMessage("Το προφίλ ενημερώθηκε.");

      setTimeout(() => {
        setSavedMessage("");
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Δεν μπόρεσα να ενημερώσω το προφίλ.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-black">Φορτώνω το προφίλ...</p>
          <p className="mt-2 text-sm text-gray-600">
            Φέρνω τα στοιχεία λογαριασμού που είναι συνδεδεμένα με το προφίλ σου.
          </p>
        </div>
      </section>
    );
  }

  if (!customer) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          <p className="font-semibold">Δεν μπόρεσα να φορτώσω το προφίλ</p>
          <p className="mt-2 text-sm">
            {error || "Δοκίμασε ξανά από τον πίνακα λογαριασμού."}
          </p>
          <Link
            href="/account"
            className="mt-4 inline-block rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            Πίσω στον λογαριασμό
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">Προφίλ</h1>
            <p className="mt-2 text-gray-600">
              Διαχειρίσου τα στοιχεία που συνδέονται με το προφίλ NutriTail AI.
            </p>
          </div>
          <Link
            href="/account"
            className="rounded-xl border border-gray-300 px-4 py-2 text-center text-sm font-medium text-black transition hover:bg-gray-100"
          >
            Πίσω στον λογαριασμό
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <p className="font-semibold text-blue-950">
          Πώς χρησιμοποιούνται αυτά τα στοιχεία
        </p>
        <p className="mt-2 text-sm text-blue-900">
          Το προφίλ βοηθά να συνδέονται κατοικίδια, reports και στοιχεία πελάτη.
          Οι διατροφικές προτάσεις βασίζονται κυρίως στα στοιχεία κατοικιδίου και
          τροφών, όχι μόνο στις προαιρετικές σημειώσεις προφίλ.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {savedMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
          {savedMessage}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-semibold text-black">Επεξεργασία προφίλ</h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Ονοματεπώνυμο
            </label>
            <input
              value={form.fullName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, fullName: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
              placeholder="Το ονοματεπώνυμό σου"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Email
            </label>
            <input
              value={customer.email || ""}
              disabled
              className="w-full rounded-xl border border-gray-300 bg-gray-100 p-3 text-gray-600"
            />
            <p className="mt-2 text-xs text-gray-500">
              Το email έρχεται από τον λογαριασμό σύνδεσης και δεν αλλάζει εδώ.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Τηλέφωνο
            </label>
            <input
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
              placeholder="+1 555 000 0000"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Κωδικός bonus card
            </label>
            <input
              value={form.bonusCardCode}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  bonusCardCode: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
              placeholder="NT-000123"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-black">
              Σημειώσεις
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={4}
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
              placeholder="Προαιρετικές σημειώσεις..."
            />
            <p className="mt-2 text-xs text-gray-500">
              Κράτα τις ιατρικές λεπτομέρειες στα προφίλ κατοικιδίων όπου γίνεται,
              ώστε το chatbot να τις χρησιμοποιεί με σωστό context.
            </p>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl bg-black px-6 py-3 text-white disabled:opacity-50 sm:w-auto"
            >
              {isSaving ? "Αποθήκευση..." : "Αποθήκευση προφίλ"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
