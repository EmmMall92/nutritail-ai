import type { Metadata } from "next";
import Link from "next/link";
import {
  betaPlanLimits,
  futurePaidPlanDirection,
} from "@/lib/beta/accessPlan";
import { brand } from "@/lib/brand";
import { BetaSignupForm } from "./BetaSignupForm";

export const metadata: Metadata = {
  title: `Beta πρόσβαση | ${brand.name}`,
  description:
    "Ζήτησε beta πρόσβαση στο Nutritail AI και βοήθησε να βελτιωθεί η διατροφική εμπειρία για σκύλους και γάτες.",
  alternates: {
    canonical: "/beta",
  },
};

const benefits = [
  {
    title: "Πιο καθαρές προτάσεις τροφής",
    text: "Στόχος είναι να βλέπεις λίγες, κατανοητές επιλογές και γιατί ταιριάζουν στο δικό σου κατοικίδιο.",
  },
  {
    title: "Πλάνο που συνεχίζεται",
    text: "Αποθήκευσε κατοικίδιο, κάνε έλεγχο προόδου και ζήτησε νέα πρόταση όταν αλλάξει βάρος, γεύση ή ανάγκη.",
  },
  {
    title: "Πιο ανθρώπινη εμπειρία",
    text: "Το chatbot πρέπει να μιλά απλά, να ρωτά ένα πράγμα τη φορά και να μη σε γεμίζει με τεχνικές λεπτομέρειες.",
  },
];

const limits = [
  "Η beta πρόσβαση μπορεί να ανοίγει σταδιακά.",
  "Η καθοδήγηση είναι ενημερωτική και δεν αντικαθιστά κτηνίατρο.",
  "Τα σχόλια από beta χρήστες θα βοηθήσουν να βελτιωθούν οι προτάσεις και οι αναφορές.",
];

const betaAccessPlan = [
  {
    title: "Πρώτη beta πρόσβαση",
    text: "Ξεκίνα με αποθηκευμένο κατοικίδιο, πρώτη ανάλυση, προτεινόμενες τροφές και αναφορά.",
  },
  {
    title: "Συνέχεια πλάνου",
    text: "Δοκίμασε έλεγχο προόδου, αλλαγή γεύσης ή νέα πρόταση όταν αλλάζει η ανάγκη.",
  },
  {
    title: "Feedback που μετράει",
    text: "Οι απαντήσεις που δεν βοήθησαν και οι τροφές που επιλέγονται θα δείχνουν τι πρέπει να βελτιωθεί.",
  },
];

const betaPlainTerms = [
  {
    title: "Χωρίς πληρωμή στην beta",
    text: "Η beta λίστα δεν ενεργοποιεί συνδρομή και δεν ζητά στοιχεία κάρτας. Αν αργότερα ανοίξουν πληρωμένα πλάνα, θα εμφανιστούν καθαρά πριν αποφασίσεις.",
  },
  {
    title: "Τι παίρνεις τώρα",
    text: "Πρόσβαση στον σύμβουλο, αποθήκευση κατοικιδίων, προτάσεις τροφών, αναφορά, ιστορικό και έλεγχο προόδου μέσα στα beta όρια.",
  },
  {
    title: "Τι δεν είναι ακόμη τελικό",
    text: "Η βάση τροφών, οι προτάσεις και οι αναφορές βελτιώνονται συνεχώς με νέα δεδομένα, σχόλια χρηστών και ελέγχους ποιότητας.",
  },
];

const betaLaunchSignals = [
  "Οι χρήστες ολοκληρώνουν ανάλυση χωρίς να μπερδεύονται.",
  "Οι προτάσεις τροφών ταιριάζουν καλύτερα σε ηλικία, βάρος, προτιμήσεις και ευαισθησίες.",
  "Οι αναφορές και οι έλεγχοι προόδου βοηθούν στην πράξη, όχι μόνο σαν τεχνική δοκιμή.",
];

export default function BetaPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-black">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-xl font-black tracking-tight">
            Nutritail AI
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm font-semibold">
            <Link href="/about" className="rounded-full border border-black/15 px-4 py-2">
              Σχετικά
            </Link>
            <Link href="/how-it-works" className="rounded-full border border-black/15 px-4 py-2">
              Πώς δουλεύει
            </Link>
            <Link href="/plans" className="rounded-full border border-black/15 px-4 py-2">
              Plans
            </Link>
            <Link href="/support" className="rounded-full border border-black/15 px-4 py-2">
              Support
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.05fr_0.95fr] md:items-start md:py-20">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-green-700">
            Nutritail beta
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
            Βοήθησε να φτιάξουμε την πιο χρήσιμη εμπειρία pet nutrition.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-700">
            Το Nutritail AI ετοιμάζεται για πιο ανοιχτή χρήση. Η beta λίστα μας
            βοηθά να δώσουμε πρόσβαση σταδιακά, να μαζέψουμε σχόλια και να
            βελτιώσουμε τις προτάσεις τροφών με πραγματικά σενάρια σκύλων και
            γατών.
          </p>

          <div className="mt-8 grid gap-4">
            {benefits.map((item) => (
              <article key={item.title} className="rounded-xl border border-black/10 bg-white p-5">
                <h2 className="text-lg font-black">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-700">{item.text}</p>
              </article>
            ))}
          </div>
        </div>

        <BetaSignupForm />
      </section>

      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h2 className="text-2xl font-black">Τι σημαίνει beta</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {limits.map((item) => (
              <p key={item} className="rounded-xl border border-black/10 p-4 text-sm leading-6 text-gray-700">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-green-700">
            Beta access plan
          </p>
          <h2 className="mt-3 text-3xl font-black">
            Ξεκινάμε ελεγχόμενα για να κρατήσουμε καλή ποιότητα.
          </h2>
          <p className="mt-4 max-w-3xl leading-7 text-gray-700">
            Πριν περάσουμε σε συνδρομές ή πληρωμές, το Nutritail θα λειτουργεί σαν
            περιορισμένη beta. Έτσι μπορούμε να μετράμε ποιες αναλύσεις βοηθούν,
            ποιες προτάσεις τροφών επιλέγονται και πού χρειάζεται βελτίωση.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {betaAccessPlan.map((item) => (
              <article key={item.title} className="rounded-2xl border border-black/10 bg-[#f7f7f4] p-5">
                <h3 className="font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">{item.text}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 rounded-2xl bg-black px-5 py-4 text-sm leading-6 text-white">
            Στόχος beta: λίγοι χρήστες, καθαρά σχόλια, καλύτερη εμπειρία πριν
            ανοίξουμε πιο επίσημο πλάνο πρόσβασης.
          </p>
        </div>
      </section>

      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-green-700">
              Beta plan limits
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Πρώτα περιορισμένη πρόσβαση. Μετά κανονικά πλάνα.
            </h2>
            <p className="mt-4 leading-7 text-gray-700">
              Δεν ανοίγουμε αμέσως απεριόριστη χρήση. Θέλουμε οι πρώτοι χρήστες
              να έχουν καθαρή εμπειρία, να μπορούμε να βλέπουμε πού κολλάει το
              chatbot και να διορθώνουμε τις προτάσεις πριν μπουν πληρωμές ή
              συνδρομές.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {betaPlanLimits.map((item) => (
              <article
                key={item.metric}
                className="rounded-2xl border border-black/10 bg-[#f7f7f4] p-5"
              >
                <h3 className="font-black">{item.metric}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {item.detail}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
            <h3 className="font-black text-green-950">
              Τι θα γίνει μετά τη beta
            </h3>
            <p className="mt-2 text-sm leading-6 text-green-900">
              Όταν η εμπειρία φτάσει στο επίπεδο που θέλουμε, τα όρια αυτά θα
              γίνουν κανονικά πλάνα πρόσβασης. Μέχρι τότε, η beta λειτουργεί σαν
              ελεγχόμενη δοκιμή ποιότητας και όχι σαν τελικό εμπορικό προϊόν.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-black/10 bg-[#f7f7f4]">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-12 lg:grid-cols-[1fr_0.9fr]">
          <div
            className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:p-8"
            data-testid="beta-commercial-clarity"
          >
            <p className="text-sm font-bold uppercase tracking-wide text-green-700">
              Καθαροί όροι beta
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Πρώτα δοκιμή ποιότητας, μετά κανονική εμπορική διάθεση.
            </h2>
            <p className="mt-4 leading-7 text-gray-700">
              Θέλουμε ο χρήστης να ξέρει ακριβώς τι δοκιμάζει. Η beta είναι
              ελεγχόμενη πρόσβαση στο προϊόν, όχι κρυφή συνδρομή και όχι
              υπόσχεση ότι όλα τα δεδομένα τροφών είναι ήδη τέλεια.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {betaPlainTerms.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-black/10 bg-[#f7f7f4] p-5"
                >
                  <h3 className="font-black">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside
            className="rounded-3xl border border-amber-200 bg-amber-50 p-6 md:p-8"
            data-testid="beta-launch-signals"
          >
            <p className="text-sm font-bold uppercase tracking-wide text-amber-800">
              Πότε ανοίγει περισσότερο
            </p>
            <h2 className="mt-3 text-2xl font-black text-amber-950">
              Το beta θα μεγαλώνει όταν τα σχόλια δείχνουν σταθερή ποιότητα.
            </h2>
            <div className="mt-5 space-y-3">
              {betaLaunchSignals.map((item, index) => (
                <div
                  key={item}
                  className="rounded-2xl border border-amber-200 bg-white p-4 text-sm leading-6 text-amber-950"
                >
                  <span className="font-black">{index + 1}.</span> {item}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div
            className="rounded-3xl border border-black/10 bg-[#f7f7f4] p-6 md:p-8"
            data-testid="beta-future-paid-plan-direction"
          >
            <p className="text-sm font-bold uppercase tracking-wide text-green-700">
              Μελλοντική εμπορική κατεύθυνση
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Πρώτα beta ποιότητα. Μετά καθαρά πλάνα, πριν ζητηθεί οποιαδήποτε πληρωμή.
            </h2>
            <p className="mt-4 max-w-3xl leading-7 text-gray-700">
              Δεν ενεργοποιούμε συνδρομή στην beta και δεν ζητάμε κάρτα. Η
              κατεύθυνση για αργότερα είναι απλή: ένα δωρεάν/beta στάδιο για
              δοκιμή, ένα προσωπικό πλάνο για κανονική χρήση και ένα πιο δυνατό
              πλάνο για περισσότερα κατοικίδια ή επαγγελματική χρήση.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {futurePaidPlanDirection.map((plan) => (
                <article
                  key={plan.name}
                  className="rounded-2xl border border-black/10 bg-white p-5"
                >
                  <h3 className="text-lg font-black">{plan.name}</h3>
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    {plan.audience}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    {plan.includes}
                  </p>
                  <p className="mt-4 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white">
                    {plan.status}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
