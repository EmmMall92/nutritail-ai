"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

type AnalysisHistoryItem = {
  id: string;
  createdAt: string;
};

type AccountPet = {
  id: string;
  analysisHistory?: AnalysisHistoryItem[];
};

function formatDate(value?: string) {
  if (!value) return "No analyses yet";

  return new Date(value).toLocaleDateString();
}

export default function AccountPage() {
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pets, setPets] = useState<AccountPet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAccount() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();

        if (!data.session?.user) {
          router.replace("/login");
          return;
        }

        const response = await fetch("/api/account/me", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authUserId: data.session.user.id,
            email: data.session.user.email,
            fullName:
              data.session.user.user_metadata?.full_name ||
              data.session.user.email ||
              "Customer",
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load account.");
        }

        setCustomer(result as Customer);

        const petsResponse = await fetch("/api/account/pets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authUserId: data.session.user.id,
          }),
        });

        const petsResult = await petsResponse.json();

        if (petsResponse.ok) {
          setPets((petsResult.pets ?? []) as AccountPet[]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAccount();
  }, [router]);

  if (isLoading) {
    return <p className="text-gray-600">Loading account...</p>;
  }

  if (!customer) {
    return <p className="text-red-600">Could not load account.</p>;
  }

  const totalAnalyses = pets.reduce(
    (count, pet) => count + (pet.analysisHistory?.length ?? 0),
    0
  );
  const latestAnalysis = pets
    .flatMap((pet) => pet.analysisHistory ?? [])
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-black">
          Welcome, {customer.fullName}
        </h1>
        <p className="mt-2 text-gray-600">
          Your Nutritail AI dashboard for pet nutrition guidance, saved pets,
          and account details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Saved pets</p>
          <p className="mt-2 text-3xl font-bold text-black">{pets.length}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Saved analyses</p>
          <p className="mt-2 text-3xl font-bold text-black">{totalAnalyses}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Latest analysis</p>
          <p className="mt-2 text-lg font-semibold text-black">
            {formatDate(latestAnalysis?.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/account/chatbot"
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-black">
            Nutrition Chatbot
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Start a new guided nutrition analysis for a saved pet or a new pet.
          </p>
        </Link>

        <Link
          href="/account/pets"
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-black">My Pets</h2>
          <p className="mt-2 text-sm text-gray-600">
            Review saved pet profiles, analysis history, reports, and timelines.
          </p>
        </Link>

        <Link
          href="/account/profile"
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-black">Profile</h2>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account details and customer information.
          </p>
        </Link>
      </div>
    </section>
  );
}
