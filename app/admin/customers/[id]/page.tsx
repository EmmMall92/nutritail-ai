"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Customer = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  bonusCardCode?: string | null;
  notes?: string | null;
  createdAt: string;
};

type AnalysisHistoryItem = {
  id: string;
  rer: number;
  mer: number;
  createdAt: string;
  recommendedFoodIds: string[];
};

type CustomerPet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  activity_level: string;
  created_at: string;
  analysisHistory: AnalysisHistoryItem[];
};

type CustomerDetailResponse = {
  customer: Customer;
  pets: CustomerPet[];
};

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();

  const [data, setData] = useState<CustomerDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomer() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(`/api/admin/customers/${params.id}`, {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load customer.");
        }

        setData(result as CustomerDetailResponse);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Failed to load customer."
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (params?.id) {
      loadCustomer();
    }
  }, [params]);

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-black">Loading customer...</p>
          <p className="mt-2 text-sm text-gray-600">
            We are fetching customer details, linked pets, and analysis history.
          </p>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="space-y-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "Customer not found."}
        </div>
      </section>
    );
  }

  const { customer, pets } = data;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">{customer.fullName}</h2>
          <p className="mt-2 text-gray-600">
            Customer profile, bonus card information, linked pets, and nutrition
            history.
          </p>
        </div>

        <Link
          href="/admin/customers"
          className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
        >
          Back to Customers
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600">Linked Pets</p>
          <p className="mt-2 text-2xl font-semibold text-black">
            {pets.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600">Total Analyses</p>
          <p className="mt-2 text-2xl font-semibold text-black">
            {pets.reduce(
              (total, pet) => total + (pet.analysisHistory?.length ?? 0),
              0
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:col-span-2">
          <p className="text-sm text-gray-600">Bonus Card</p>
          <p className="mt-2 text-xl font-semibold text-black">
            {customer.bonusCardCode || "-"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-black">Customer Details</h3>

        <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <p className="text-black">
            <span className="font-semibold">Email:</span>{" "}
            {customer.email || "-"}
          </p>

          <p className="text-black">
            <span className="font-semibold">Phone:</span>{" "}
            {customer.phone || "-"}
          </p>

          <p className="text-black">
            <span className="font-semibold">Bonus Card:</span>{" "}
            {customer.bonusCardCode || "-"}
          </p>

          <p className="text-black">
            <span className="font-semibold">Created:</span>{" "}
            {new Date(customer.createdAt).toLocaleString()}
          </p>

          <p className="text-black md:col-span-2">
            <span className="font-semibold">Notes:</span>{" "}
            {customer.notes || "No notes"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-black">Linked Pets</h3>

        {pets.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">
            No pets linked to this customer yet.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {pets.map((pet) => {
              const history = pet.analysisHistory ?? [];
              const latest = history[0];

              return (
                <div
                  key={pet.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-black">
                        {pet.name} - {pet.breed || "Unknown breed"}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {pet.species} / age {pet.age} / weight {pet.weight} kg /{" "}
                        {pet.activity_level}
                      </p>

                      <p className="mt-2 text-sm text-gray-700">
                        Analyses: {history.length}
                      </p>

                      {latest ? (
                        <p className="mt-1 text-sm text-gray-700">
                          Latest: RER {latest.rer} kcal / MER {latest.mer} kcal
                          / {new Date(latest.createdAt).toLocaleString()}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500">
                          No nutrition analysis history yet.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`/admin/pets/${pet.id}`}
                        className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-white"
                      >
                        Open Pet
                      </a>

                      <a
                        href={`/print/pet-report/${pet.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-gray-400 px-4 py-2 text-sm text-black transition hover:bg-white"
                      >
                        Report
                      </a>

                      <a
                        href={`/print/pet-timeline/${pet.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-gray-400 px-4 py-2 text-sm text-black transition hover:bg-white"
                      >
                        Timeline
                      </a>
                    </div>
                  </div>

                  {history.length > 0 && (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                      <p className="text-sm font-semibold text-black">
                        Recent Analysis History
                      </p>

                      <div className="mt-3 space-y-2">
                        {history.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm"
                          >
                            <p className="text-black">
                              <span className="font-semibold">Date:</span>{" "}
                              {new Date(item.createdAt).toLocaleString()}
                            </p>
                            <p className="text-gray-700">
                              RER {item.rer} kcal / MER {item.mer} kcal
                            </p>
                            <p className="text-xs text-gray-500">
                              Foods:{" "}
                              {item.recommendedFoodIds.length > 0
                                ? item.recommendedFoodIds.join(", ")
                                : "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
