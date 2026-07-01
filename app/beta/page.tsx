import type { Metadata } from "next";
import Link from "next/link";
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
    text: "Αποθήκευσε κατοικίδιο, κάνε progress check και ζήτησε νέα πρόταση όταν αλλάξει βάρος, γεύση ή ανάγκη.",
  },
  {
    title: "Πιο ανθρώπινη εμπειρία",
    text: "Το chatbot πρέπει να μιλά απλά, να ρωτά ένα πράγμα τη φορά και να μη σε γεμίζει με τεχνικές λεπτομέρειες.",
  },
];

const limits = [
  "Η beta πρόσβαση μπορεί να ανοίγει σταδιακά.",
  "Η καθοδήγηση είναι ενημερωτική και δεν αντικαθιστά κτηνίατρο.",
  "Το feedback από beta χρήστες θα βοηθήσει να βελτιωθούν οι προτάσεις και οι αναφορές.",
];

const betaAccessPlan = [
  {
    title: "Πρώτη beta πρόσβαση",
    text: "Ξεκίνα με αποθηκευμένο κατοικίδιο, πρώτη ανάλυση, προτεινόμενες τροφές και report.",
  },
  {
    title: "Συνέχεια πλάνου",
    text: "Δοκίμασε progress check, αλλαγή γεύσης ή νέα πρόταση όταν αλλάζει η ανάγκη.",
  },
  {
    title: "Feedback που μετράει",
    text: "Οι απαντήσεις που δεν βοήθησαν και οι τροφές που επιλέγονται θα δείχνουν τι πρέπει να βελτιωθεί.",
  },
];

const betaPlanLimits = [
  {
    metric: "1 λογαριασμός",
    detail: "Προσωπικό account για κατοικίδια, αναλύσεις και reports.",
  },
  {
    metric: "Έως 3 κατοικίδια",
    detail: "Αρκετό για πραγματική δοκιμή χωρίς άσχετα ή διπλά δεδομένα.",
  },
  {
    metric: "20 αναλύσεις / μήνα",
    detail: "Για νέα ανάλυση, progress check, αλλαγή γεύσης ή εναλλακτική πρόταση.",
  },
  {
    metric: "Feedback πρώτης προτεραιότητας",
    detail: "Τα not helpful, failed matches και food choices μπαίνουν στο admin review loop.",
  },
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
            βοηθά να δώσουμε πρόσβαση σταδιακά, να μαζέψουμε feedback και να
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
            Στόχος beta: λίγοι χρήστες, καθαρό feedback, καλύτερη εμπειρία πριν
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
    </main>
  );
}
