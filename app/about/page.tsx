import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Σχετικά με το ${brand.name}`,
  description:
    "Μάθε τι είναι το Nutritail AI, γιατί δημιουργήθηκε και πώς βοηθά ιδιοκτήτες σκύλων και γατών να παίρνουν πιο καθαρές διατροφικές αποφάσεις.",
  alternates: {
    canonical: "/about",
  },
};

const values = [
  {
    title: "Πρακτικό για τον πελάτη",
    text: "Η απάντηση πρέπει να βγάζει νόημα σε άνθρωπο που θέλει να ταΐσει σωστά το κατοικίδιό του σήμερα, όχι να διαβάσει τεχνική αναφορά.",
  },
  {
    title: "Βάση τροφών πρώτα",
    text: "Οι προτάσεις δεν βασίζονται σε γενικές μαντεψιές. Ξεκινούν από δομημένα στοιχεία τροφών, συστατικά, θερμίδες και διατροφικά σήματα.",
  },
  {
    title: "Ασφαλή όρια",
    text: "Όταν το θέμα μοιάζει ιατρικό ή επείγον, η ροή δεν προσποιείται ότι κάνει διάγνωση. Κατευθύνει τον χρήστη σε κτηνίατρο.",
  },
  {
    title: "Συνεχής βελτίωση",
    text: "Κάθε νέα τροφή, κάθε έλεγχος και κάθε σχόλιο βοηθά το Nutritail να γίνεται πιο ακριβές και πιο χρήσιμο.",
  },
];

const roadmap = [
  "Πιο πλήρης βάση τροφών για Ελλάδα και Ευρώπη.",
  "Καλύτερες προτάσεις ανά στόχο, γεύση, ευαισθησία και budget.",
  "Ιστορικό προόδου για αποθηκευμένα κατοικίδια.",
  "Πιο καθαρές αναφορές που μπορείς να ξαναδείς ή να εκτυπώσεις.",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-black">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-xl font-black tracking-tight">
            Nutritail AI
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm font-semibold">
            <Link href="/how-it-works" className="rounded-full border border-black/15 px-4 py-2">
              Πώς δουλεύει
            </Link>
            <Link href="/register" className="rounded-full bg-black px-4 py-2 text-white">
              Ξεκίνα δωρεάν
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
          Σχετικά με το Nutritail
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
          Διατροφική καθοδήγηση που μιλά απλά, αλλά σκέφτεται δομημένα.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-700">
          Το Nutritail AI δημιουργείται για ιδιοκτήτες σκύλων και γατών που
          θέλουν πιο καθαρές απαντήσεις: πόσες θερμίδες χρειάζεται το ζώο, ποιες
          τροφές ταιριάζουν καλύτερα, τι να προσέξουν και πώς να παρακολουθούν
          την πρόοδο.
        </p>
      </section>

      <section
        className="border-y border-black/10 bg-white"
        data-testid="public-trust-promise"
      >
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-[0.85fr_1.15fr] md:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Η δέσμευσή μας
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Λιγότερες υποθέσεις. Περισσότερα δεδομένα.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-black/10 bg-[#f7f7f4] p-5">
              <h3 className="font-black">Δεν εφευρίσκουμε τροφές</h3>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                Οι επιλογές πρέπει να έρχονται από τη βάση NutriTail και όχι από
                γενική μνήμη AI.
              </p>
            </article>
            <article className="rounded-xl border border-black/10 bg-[#f7f7f4] p-5">
              <h3 className="font-black">Εξηγούμε τα όρια</h3>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                Όταν λείπουν στοιχεία ή υπάρχει θέμα υγείας, η απάντηση γίνεται
                πιο προσεκτική.
              </p>
            </article>
            <article className="rounded-xl border border-black/10 bg-[#f7f7f4] p-5">
              <h3 className="font-black">Δεν κάνουμε διάγνωση</h3>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                Για επείγοντα ή ιατρικά περιστατικά, η σωστή επόμενη κίνηση
                είναι ο κτηνίατρος.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white">
        <div
          className="mx-auto grid max-w-6xl gap-6 border-b border-black/10 px-6 py-12 md:grid-cols-[0.9fr_1.1fr] md:items-start"
          data-testid="public-feedback-loop"
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Κύκλος βελτίωσης
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Πώς χρησιμοποιούμε τα σχόλια
            </h2>
            <p className="mt-4 leading-7 text-gray-700">
              Τα σχόλια χρησιμότητας, οι επιλογές τροφών και οι περιπτώσεις όπου δεν βρέθηκε σωστή τροφή γίνονται
              σήματα για έλεγχο. Δεν αλλάζουν μόνα τους τις προτάσεις. Μας δείχνουν τι
              πρέπει να ελέγξουμε στη βάση τροφών, στους κανόνες και στον τρόπο που
              εξηγούμε την απάντηση.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-black/10 bg-[#f7f7f4] p-5">
              <h3 className="font-black">Τροφές που λείπουν</h3>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                Μας δείχνουν ποια προϊόντα, ετικέτες ή θρεπτικά στοιχεία θέλουν
                συμπλήρωση πριν μιλήσουμε με μεγαλύτερη σιγουριά.
              </p>
            </article>
            <article className="rounded-xl border border-black/10 bg-[#f7f7f4] p-5">
              <h3 className="font-black">Απαντήσεις που δεν βοήθησαν</h3>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                Μπαίνουν σε έλεγχο για πιο καθαρή, λιγότερο τεχνική και πιο χρήσιμη
                εξήγηση στον επόμενο χρήστη.
              </p>
            </article>
            <article className="rounded-xl border border-black/10 bg-[#f7f7f4] p-5">
              <h3 className="font-black">Επιλογές που πατά ο χρήστης</h3>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                Βοηθούν να δούμε τι προτιμούν πραγματικά οι πελάτες και πού χρειάζεται
                καλύτερη σύγκριση ή πιο πρακτική πρόταση.
              </p>
            </article>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-5 px-6 py-12 md:grid-cols-4">
          {values.map((item) => (
            <article key={item.title} className="rounded-xl border border-black/10 p-5">
              <h2 className="text-lg font-black">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-gray-700">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1fr_0.9fr] md:items-start">
        <div>
          <h2 className="text-3xl font-black">Τι κάνει διαφορετικά</h2>
          <p className="mt-5 leading-8 text-gray-700">
            Συνδυάζει chatbot εμπειρία με κανόνες διατροφής και βάση προϊόντων.
            Το AI βοηθά να γίνει η απάντηση φυσική και κατανοητή, αλλά δεν
            επιτρέπεται να εφεύρει τροφές, θερμίδες ή θρεπτικά στοιχεία. Αυτά
            πρέπει να έρχονται από το Nutritail.
          </p>
          <p className="mt-5 leading-8 text-gray-700">
            Στόχος δεν είναι να αντικαταστήσει τον κτηνίατρο. Στόχος είναι να
            οργανώνει τις καθημερινές αποφάσεις διατροφής και να βοηθά τον
            χρήστη να ξέρει πότε χρειάζεται πιο ειδική βοήθεια.
          </p>
        </div>

        <aside className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Πού πηγαίνει το προϊόν</h2>
          <ul className="mt-5 space-y-3 text-gray-700">
            {roadmap.map((item) => (
              <li key={item} className="border-l-4 border-black pl-4 text-sm leading-6">
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="bg-black px-6 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black">Δες πώς δουλεύει στην πράξη</h2>
            <p className="mt-2 max-w-2xl text-white/75">
              Ξεκίνα με ένα κατοικίδιο και πάρε μια καθαρή πρώτη ανάλυση.
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
