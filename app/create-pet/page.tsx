"use client";

import PetForm from "@/components/PetForm";

export default function CreatePetPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Pet Profile</h1>
        <p className="text-gray-600 mt-2">
          Enter your pet’s details to get personalized nutrition guidance.
        </p>
      </div>

      <PetForm />
    </main>
  );
}