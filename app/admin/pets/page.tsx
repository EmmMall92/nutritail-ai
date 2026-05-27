"use client";

import { useEffect, useMemo, useState } from "react";

type AdminPet = {
  id: string;
  owner_id: string;
  name: string;
  species: "dog" | "cat";
  breed: string;
  age: number;
  weight: number;
  activity_level: "low" | "normal" | "high";
  neutered: boolean;
  allergies: string[];
  health_issues: string[];
  created_at: string;
  updated_at: string;
};

type SortMode = "newest" | "oldest" | "name-asc" | "weight-desc";

function getTimeOrFallback(value: string, fallback: number) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? fallback : time;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Unknown date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleString();
}

export default function AdminPetsPage() {
  const [pets, setPets] = useState<AdminPet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<"all" | "dog" | "cat">(
    "all"
  );
  const [neuteredFilter, setNeuteredFilter] = useState<"all" | "yes" | "no">(
    "all"
  );
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  useEffect(() => {
    async function loadPets() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch("/api/admin/pets", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load pets.");
        }

        setPets(result as AdminPet[]);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load pets.");
      } finally {
        setIsLoading(false);
      }
    }

    loadPets();
  }, []);

  async function handleDeletePet(pet: AdminPet) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${pet.name}'s profile?`
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

      setPets((prev) => prev.filter((item) => item.id !== pet.id));
      setSuccessMessage(`${pet.name} was moved to trash.`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to delete pet.");
    }
  }

  const filteredPets = useMemo(() => {
    let items = [...pets];

    if (speciesFilter !== "all") {
      items = items.filter((pet) => pet.species === speciesFilter);
    }

    if (neuteredFilter === "yes") {
      items = items.filter((pet) => pet.neutered);
    }

    if (neuteredFilter === "no") {
      items = items.filter((pet) => !pet.neutered);
    }

    const term = search.trim().toLowerCase();

    if (term) {
      items = items.filter((pet) => {
        return (
          pet.name.toLowerCase().includes(term) ||
          pet.breed.toLowerCase().includes(term) ||
          pet.species.toLowerCase().includes(term) ||
          pet.owner_id.toLowerCase().includes(term) ||
          pet.health_issues.some((x) => x.toLowerCase().includes(term)) ||
          pet.allergies.some((x) => x.toLowerCase().includes(term))
        );
      });
    }

    items.sort((a, b) => {
      switch (sortMode) {
        case "oldest":
          return (
            getTimeOrFallback(a.created_at, Number.MAX_SAFE_INTEGER) -
            getTimeOrFallback(b.created_at, Number.MAX_SAFE_INTEGER)
          );
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "weight-desc":
          return b.weight - a.weight;
        case "newest":
        default:
          return (
            getTimeOrFallback(b.created_at, 0) -
            getTimeOrFallback(a.created_at, 0)
          );
      }
    });

    return items;
  }, [pets, search, speciesFilter, neuteredFilter, sortMode]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black">Pets Overview</h2>
        <p className="mt-2 text-gray-600">
          Browse, filter, and manage saved pet profiles.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-black">
            Search pets
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, breed, owner, issues, allergies..."
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Species
          </label>
          <select
            value={speciesFilter}
            onChange={(e) =>
              setSpeciesFilter(e.target.value as "all" | "dog" | "cat")
            }
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          >
            <option value="all">All</option>
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Neutered
          </label>
          <select
            value={neuteredFilter}
            onChange={(e) =>
              setNeuteredFilter(e.target.value as "all" | "yes" | "no")
            }
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          >
            <option value="all">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-black">
            Sort by
          </label>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="w-full rounded-lg border border-gray-300 p-3 text-black"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name-asc">Name A-Z</option>
            <option value="weight-desc">Weight high to low</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSpeciesFilter("all");
              setNeuteredFilter("all");
              setSortMode("newest");
            }}
            className="rounded-lg border border-black px-4 py-3 text-sm text-black transition hover:bg-gray-100"
          >
            Reset Filters
          </button>
        </div>

        <div className="flex items-end justify-start md:justify-end">
          <p className="text-sm text-gray-600">
            {isLoading ? "Loading..." : `${filteredPets.length} results`}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {!isLoading && !error && filteredPets.length === 0 && (
          <p className="text-sm text-gray-600">No pets found.</p>
        )}

        <div className="space-y-4">
          {filteredPets.map((pet) => (
            <div
              key={pet.id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-black">
                    {pet.name} - {pet.breed || "Unknown breed"}
                  </p>

                  <p className="text-sm text-black">
                    {pet.species} / age {pet.age} / weight {pet.weight} kg /{" "}
                    {pet.activity_level}
                  </p>
                </div>

                <div className="text-sm text-gray-600">
                  Created: {formatDateTime(pet.created_at)}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                <p className="text-black">
                  <span className="font-semibold">Owner ID:</span>{" "}
                  {pet.owner_id}
                </p>

                <p className="text-black">
                  <span className="font-semibold">Neutered:</span>{" "}
                  {pet.neutered ? "Yes" : "No"}
                </p>

                <p className="text-black md:col-span-2">
                  <span className="font-semibold">Allergies:</span>{" "}
                  {pet.allergies.length > 0
                    ? pet.allergies.join(", ")
                    : "None"}
                </p>

                <p className="text-black md:col-span-2">
                  <span className="font-semibold">Health Issues:</span>{" "}
                  {pet.health_issues.length > 0
                    ? pet.health_issues.join(", ")
                    : "None"}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`/admin/pets/${pet.id}`}
                  className="inline-block rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
                >
                  View Details
                </a>

                <a
                  href={`/print/pet-report/${pet.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded-lg border border-gray-400 px-4 py-2 text-sm text-black transition hover:bg-gray-100"
                >
                  Printable Report
                </a>
                <a
                  href={`/print/pet-timeline/${pet.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
                >
                  Timeline Report
                </a>
                <a
                  href={`/api/admin/pets/${pet.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded-lg border border-gray-400 px-4 py-2 text-sm text-black transition hover:bg-gray-100"
                >
                  API
                </a>
                <a
                  href={`/api/admin/pets/${pet.id}/export`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded-lg border border-gray-400 px-4 py-2 text-sm text-black transition hover:bg-gray-100"
                >
                  Export Bundle
                </a>
                <button
                  type="button"
                  onClick={() => handleDeletePet(pet)}
                  className="rounded-lg border border-red-600 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
