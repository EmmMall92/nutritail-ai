"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
type Customer = {
  id: string;
  fullName: string;
  bonusCardCode?: string | null;
};

type AdminPet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  activity_level: string;
  neutered: boolean;
  allergies: string[];
  health_issues: string[];
  customer_id?: string | null;
};

export default function AdminPetPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [pet, setPet] = useState<AdminPet | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        // Load pet
        const petRes = await fetch(`/api/admin/pets/${params.id}`);
        const petData = await petRes.json();

        if (!petRes.ok) {
          throw new Error(petData.error || "Failed to load pet.");
        }

        setPet(petData);

        // Load customers
        const customersRes = await fetch("/api/admin/customers");
        const customersData = await customersRes.json();

        if (customersRes.ok) {
          setCustomers(customersData);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Error loading data.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [params.id]);

  async function handleSave() {
    try {
      if (!pet) return;

      setIsSaving(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(`/api/admin/pets/${pet.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...pet,
          customerId: pet.customer_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save.");
      }

      setSuccessMessage("Pet saved successfully.");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!pet) return;

    const confirmed = window.confirm(
      "This will move the pet to Trash. You can restore it later.\n\nContinue?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccessMessage("");

      const response = await fetch(`/api/admin/pets/${pet.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete pet.");
      }

      router.push("/admin/pets");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to delete pet.");
    }
  }

  if (isLoading || !pet) {
    return <p className="text-gray-600">Loading...</p>;
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-black">Edit Pet</h2>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <input
          value={pet.name}
          onChange={(e) =>
            setPet((prev) => prev && { ...prev, name: e.target.value })
          }
          placeholder="Name"
          className="rounded-lg border p-3"
        />

        <input
          value={pet.breed}
          onChange={(e) =>
            setPet((prev) => prev && { ...prev, breed: e.target.value })
          }
          placeholder="Breed"
          className="rounded-lg border p-3"
        />

        <input
          type="number"
          value={pet.age}
          onChange={(e) =>
            setPet((prev) => prev && { ...prev, age: Number(e.target.value) })
          }
          placeholder="Age"
          className="rounded-lg border p-3"
        />

        <input
          type="number"
          value={pet.weight}
          onChange={(e) =>
            setPet((prev) => prev && { ...prev, weight: Number(e.target.value) })
          }
          placeholder="Weight"
          className="rounded-lg border p-3"
        />

        {/* CUSTOMER DROPDOWN */}
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-black">
            Customer / Owner
          </label>

          <select
            value={pet.customer_id ?? ""}
            onChange={(e) =>
              setPet((prev) =>
                prev
                  ? {
                      ...prev,
                      customer_id: e.target.value || null,
                    }
                  : prev
              )
            }
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          >
            <option value="">No customer linked</option>

            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.fullName}
                {customer.bonusCardCode
                  ? ` / ${customer.bonusCardCode}`
                  : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg bg-black px-6 py-3 text-white"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>

        <button
          onClick={handleDelete}
          className="rounded-lg border border-red-500 px-6 py-3 text-red-600"
        >
          Delete
        </button>
      </div>
    </section>
  );
}
