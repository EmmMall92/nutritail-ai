"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  bonusCardCode?: string | null;
  notes?: string | null;
  createdAt: string;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    bonusCardCode: "",
    notes: "",
  });

  const [isCreating, setIsCreating] = useState(false);

  async function loadCustomers() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/admin/customers", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load customers.");
      }

      setCustomers(result as Customer[]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load customers.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function handleCreate() {
    try {
      setIsCreating(true);
      setError("");

      const response = await fetch("/api/admin/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create customer.");
      }

      setForm({
        fullName: "",
        email: "",
        phone: "",
        bonusCardCode: "",
        notes: "",
      });

      await loadCustomers();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create customer.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black">Customers</h2>
        <p className="mt-2 text-gray-600">
          Manage customer profiles, bonus card data, and linked pets.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-black">Add Customer</h3>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, fullName: e.target.value }))
            }
            className="rounded-lg border border-gray-300 p-3 text-black"
          />

          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            className="rounded-lg border border-gray-300 p-3 text-black"
          />

          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone: e.target.value }))
            }
            className="rounded-lg border border-gray-300 p-3 text-black"
          />

          <input
            placeholder="Bonus Card Code"
            value={form.bonusCardCode}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                bonusCardCode: e.target.value,
              }))
            }
            className="rounded-lg border border-gray-300 p-3 text-black"
          />

          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value }))
            }
            className="rounded-lg border border-gray-300 p-3 text-black md:col-span-2"
            rows={3}
          />

          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating}
            className="rounded-lg bg-black py-3 text-white transition hover:opacity-90 disabled:opacity-50 md:col-span-2"
          >
            {isCreating ? "Creating..." : "Create Customer"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-black">Customer List</h3>

        {isLoading ? (
          <p className="mt-4 text-sm text-gray-600">Loading customers...</p>
        ) : customers.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">No customers found.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-black">
                      {customer.fullName}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      {customer.email || "-"} • {customer.phone || "-"}
                    </p>

                    {customer.bonusCardCode && (
                      <p className="mt-1 text-xs text-gray-500">
                        Bonus: {customer.bonusCardCode}
                      </p>
                    )}

                    {customer.notes && (
                      <p className="mt-2 text-sm text-gray-700">
                        {customer.notes}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-gray-500">
                      Created: {new Date(customer.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <a
                    href={`/admin/customers/${customer.id}`}
                    className="inline-block rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-white"
                  >
                    Open Customer
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}