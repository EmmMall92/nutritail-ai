"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
          router.replace("/login");
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
            fullName: user.user_metadata?.full_name || user.email || "Customer",
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load profile.");
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
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  async function handleSave() {
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
        throw new Error(result.error || "Failed to update profile.");
      }

      const updatedCustomer = result as Customer;
      setCustomer(updatedCustomer);

      setForm({
        fullName: updatedCustomer.fullName || "",
        phone: updatedCustomer.phone || "",
        bonusCardCode: updatedCustomer.bonusCardCode || "",
        notes: updatedCustomer.notes || "",
      });

      setSavedMessage("Profile updated successfully.");

      setTimeout(() => {
        setSavedMessage("");
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-gray-600">Loading profile...</p>;
  }

  if (!customer) {
    return <p className="text-red-600">Could not load profile.</p>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-black">Profile</h1>
        <p className="mt-2 text-gray-600">
          Manage the account details connected to your Nutritail AI profile.
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

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-black">Edit profile</h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Full name
            </label>
            <input
              value={form.fullName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, fullName: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
              placeholder="Your full name"
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
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Phone
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
              Bonus card code
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
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={4}
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
              placeholder="Optional notes..."
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded-xl bg-black px-6 py-3 text-white disabled:opacity-50 sm:w-auto"
            >
              {isSaving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
