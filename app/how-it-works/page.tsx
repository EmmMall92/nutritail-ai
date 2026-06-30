import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Πώς δουλεύει | ${brand.name}`,
  description:
    "Δες πώς το Nutritail AI χρησιμοποιεί στοιχεία κατοικιδίου, βάση τροφών, κανόνες διατροφής και ασφαλή όρια για πιο πρακτική καθοδήγηση.",
  alternates: {
    canonical: "/how-it-works",
  },
};

const steps = [
  {
    title: "1. Καταλαβαίνει το κατοικίδιο",
    text: "Ξεκινά από είδος, ηλικία, βάρος, δραστηριότητα, στείρωση, στόχο βάρους, ευαισθησίες και προτιμήσεις γεύσης.",
  },
  {
    title: "2. Υπολογίζει πρακτικό στόχο",
    text: "Εκτιμά θερμίδες ημέρας, όριο για λιχουδιές και βασική ποσότητα φαγητού με τρόπο που μπορείς να εφαρμόσεις.",
  },
  {
    title: "3. Ψάχνει στη βάση NutriTail",
    text: "Οι προτάσεις τροφών έρχονται από τη δική μας Food V2 βάση και όχι από τυχαία μνήμη AI ή γενικές απαντήσεις.",
  },
  {
    title: "4. Κόβει ακατάλληλες επιλογές",
    text: "Αποφεύγει είδος, ηλικιακό στάδιο, μέγεθος, αλλεργίες ή διατροφικά σήματα που δεν ταιριάζουν στο προφίλ.",
  },
  {
    title: "5. Εξηγεί απλά την πρόταση",
    text: "Το AI βοηθά να γραφτεί η απάντηση ανθρώπινα, αλλά οι τροφές και οι κανόνες αποφασίζονται από το NutriTail.",
  },
];

const trustPoints = [
  "Δεν αντικαθιστά κτηνίατρο και δεν κάνει διάγνωση.",
  "Σε ουρολογικά, νεφρικά, διαβήτη, παγκρεατίτιδα, αίμα, έντονο εμετό ή ανορεξία προτείνει κτηνίατρο.",
  "Όταν λείπουν στοιχεία τροφής, η απάντηση γίνεται πιο προσεκτική.",
  "Μπορείς να αποθηκεύσεις κατοικίδιο, να δεις ιστορικό και να ξανακάνεις έλεγχο προόδου.",
];

const dataSignals = [
  "θερμίδες ανά 100g",
  "πρωτεΐνη, λιπαρά, ίνες και τέφρα",
  "ασβέστιο, φώσφορος, μαγνήσιο και νάτριο όταν υπάρχουν",
  "ωμέγα 3/6, EPA και DHA όταν αναγράφονται",
  "συστατικά, health tags και διατροφικά use cases",
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-black">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-xl font-black tracking-tight">
            Nutritail AI
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm font-semibold">
            <Link href="/" className="rounded-full border border-black/15 px-4 py-2">
              Αρχική
            </Link>
            <Link href="/login" className="rounded-full bg-black px-4 py-2 text-white">
              Σύνδεση
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
          Μεθοδολογία NutriTail
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
          Πώς δουλεύει η διατροφική πρόταση
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-700">
          Το Nutritail AI δεν προσπαθεί απλώς να μαντέψει μια τροφή. Συνδυάζει
          στοιχεία κατοικιδίου, δομημένη βάση τροφών, κανόνες διατροφής και
          ανθρώπινη εξήγηση, ώστε η απάντηση να είναι χρήσιμη και κατανοητή.
        </p>
      </section>

      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-10 md:grid-cols-5">
          {steps.map((step) => (
            <article key={step.title} className="border-l border-black/10 pl-4">
              <h2 className="text-base font-black">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-gray-700">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-black">Τι κοιτάμε στη βάση τροφών</h2>
          <ul className="mt-6 space-y-3 text-gray-700">
            {dataSignals.map((item) => (
              <li key={item} className="rounded-lg border border-black/10 bg-white px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-black">Όρια και ασφάλεια</h2>
          <ul className="mt-6 space-y-3 text-gray-700">
            {trustPoints.map((item) => (
              <li key={item} className="rounded-lg border border-black/10 bg-white px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-black px-6 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black">Έτοιμος για ανάλυση;</h2>
            <p className="mt-2 max-w-2xl text-white/75">
              Ξεκίνα με το κατοικίδιό σου και κράτα την ανάλυση στο προφίλ σου
              για μελλοντικό progress check.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold text-black"
          >
            Ξεκίνα δωρεάν
          </Link>
        </div>
      </section>
    </main>
  );
}
