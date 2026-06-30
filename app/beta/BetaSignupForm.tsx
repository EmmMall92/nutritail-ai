"use client";

import type { FormEvent } from "react";
import { useState } from "react";

export function BetaSignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("pet_parent");
  const [pets, setPets] = useState("");
  const [goal, setGoal] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/beta/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          role,
          pets,
          goal,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Δεν μπορέσαμε να ολοκληρώσουμε την εγγραφή.");
      }

      setStatus("success");
      setMessage(result.message || "Σε βάλαμε στη beta λίστα.");
      setName("");
      setEmail("");
      setPets("");
      setGoal("");
      setRole("pet_parent");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Δεν μπορέσαμε να ολοκληρώσουμε την εγγραφή."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-green-700">
          Beta πρόσβαση
        </p>
        <h2 className="mt-2 text-2xl font-black">Μπες στη λίστα</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Θα χρησιμοποιήσουμε τα στοιχεία μόνο για beta πρόσβαση και feedback προϊόντος.
        </p>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-gray-800">Όνομα</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="π.χ. Μαρία"
          autoComplete="name"
          className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-black outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-gray-800">Email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          required
          className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-black outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-gray-800">Ποιος είσαι;</span>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 text-black outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
        >
          <option value="pet_parent">Ιδιοκτήτης κατοικιδίου</option>
          <option value="petshop">Pet shop / επαγγελματίας</option>
          <option value="vet_or_nutrition">Κτηνίατρος / διατροφή</option>
          <option value="other">Άλλο</option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-gray-800">Τι κατοικίδια έχεις;</span>
        <input
          value={pets}
          onChange={(event) => setPets(event.target.value)}
          placeholder="π.χ. σκύλος 6 ετών, γάτα στειρωμένη"
          className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-black outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-gray-800">Τι θέλεις να λύσει πρώτο;</span>
        <textarea
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="π.χ. καλύτερες προτάσεις τροφής, απώλεια βάρους, αλλεργίες, γάτες με ουρολογικό"
          rows={4}
          className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-black outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
      </label>

      {message && (
        <div
          className={`rounded-xl border p-3 text-sm ${
            status === "success"
              ? "border-green-100 bg-green-50 text-green-800"
              : "border-red-100 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl bg-black py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? "Καταχώρηση..." : "Θέλω beta πρόσβαση"}
      </button>
    </form>
  );
}
