import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { betaAccessPlanConfig } from "@/lib/beta/accessPlan";

export const metadata: Metadata = {
  title: `Plans | ${brand.name}`,
  description:
    "NutriTail beta access, current soft limits, and future Personal and Pro plan direction.",
  alternates: {
    canonical: "/plans",
  },
};

const currentLimits = [
  {
    label: "Κατοικίδια",
    value: `${betaAccessPlanConfig.petLimit}`,
    detail: "Αρκετά για να δοκιμάσεις πραγματικά προφίλ σκύλου ή γάτας.",
  },
  {
    label: "Αναλύσεις / μήνα",
    value: `${betaAccessPlanConfig.monthlyAnalysisLimit}`,
    detail: "Για νέα πρόταση, progress check, αλλαγή τροφής ή αλλαγή γεύσης.",
  },
  {
    label: "Πληρωμή στην beta",
    value: "0",
    detail: "Δεν ζητάμε κάρτα και δεν ενεργοποιούμε συνδρομή στην beta.",
  },
];

const planCards = [
  {
    name: "Beta",
    status: "Διαθέσιμο σταδιακά",
    price: "Χωρίς πληρωμή",
    audience: "Για πρώτους χρήστες που θέλουν να δοκιμάσουν το NutriTail και να δώσουν feedback.",
    features: [
      "Προσωπικό account",
      "Αποθηκευμένα κατοικίδια",
      "Chatbot nutrition analysis",
      "Printable report και timeline",
      "Progress checks",
    ],
    cta: "Μπες στη beta",
    href: "/beta",
    highlighted: true,
  },
  {
    name: "Personal",
    status: "Μελλοντικό πλάνο",
    price: "Θα ανακοινωθεί",
    audience: "Για κηδεμόνες που θέλουν σταθερή παρακολούθηση για λίγα κατοικίδια.",
    features: [
      "Περισσότερες μηνιαίες αναλύσεις",
      "Πιο καθαρά saved reports",
      "Ιστορικό αλλαγών τροφής",
      "Υπενθυμίσεις progress",
      "Πιο αναλυτικές εξηγήσεις",
    ],
    cta: "Δες πρώτα την beta",
    href: "/beta",
    highlighted: false,
  },
  {
    name: "Pro",
    status: "Μελλοντικό πλάνο",
    price: "Θα ανακοινωθεί",
    audience: "Για πιο απαιτητική χρήση, πολλά κατοικίδια ή επαγγελματική παρακολούθηση.",
    features: [
      "Περισσότερα profiles",
      "Συχνότερα progress checks",
      "Εξαγωγές και reports",
      "Πιο οργανωμένο feedback loop",
      "Πιο πλούσιο admin-style ιστορικό",
    ],
    cta: "Ξεκίνα με beta",
    href: "/beta",
    highlighted: false,
  },
];

const launchSignals = [
  "Το NutriTail δεν πουλά συνδρομή πριν σταθεροποιηθούν τα beta όρια.",
  "Τα beta όρια είναι soft limits: μας βοηθούν να καταλάβουμε πραγματική χρήση χωρίς να μπλοκάρουμε απότομα τον χρήστη.",
  "Πριν ενεργοποιηθούν πληρωμές, θα υπάρχουν καθαροί όροι, τιμές, limits και τρόπος ακύρωσης.",
];

export default function PlansPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-xl font-black tracking-tight">
            Nutritail AI
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm font-semibold">
            <Link href="/how-it-works" className="rounded-full border border-slate-300 px-4 py-2">
              Πώς δουλεύει
            </Link>
            <Link href="/beta" className="rounded-full border border-emerald-300 px-4 py-2 text-emerald-800">
              Beta
            </Link>
            <Link href="/login" className="rounded-full bg-slate-950 px-4 py-2 text-white">
              Σύνδεση
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20" data-testid="plans-hero">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
          NutriTail plans
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
          Ξεκινάμε με προσεκτική beta, πριν ανοίξουμε πληρωμές.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
          Σε αυτή τη φάση ο στόχος είναι σωστή εμπειρία, αξιόπιστες προτάσεις και πραγματικό
          feedback από χρήστες. Τα Personal και Pro πλάνα είναι κατεύθυνση προϊόντος, όχι
          ενεργή χρέωση.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/beta"
            className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
          >
            Ζήτησε beta πρόσβαση
          </Link>
          <Link
            href="/how-it-works"
            className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold transition hover:bg-slate-100"
          >
            Δες τη μεθοδολογία
          </Link>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white" data-testid="plans-current-beta-limits">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Τρέχον beta access
            </p>
            <h2 className="mt-2 text-3xl font-black">Τα όρια είναι καθαρά και προσωρινά.</h2>
            <p className="mt-4 leading-7 text-slate-700">
              Θέλουμε αρκετή χρήση για πραγματικό testing, αλλά όχι ανεξέλεγκτη χρήση πριν
              κλείσουν όλα τα launch checks.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {currentLimits.map((item) => (
              <article key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold text-slate-500">{item.label}</p>
                <p className="mt-3 text-4xl font-black">{item.value}</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12" data-testid="plans-future-direction">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Business direction
          </p>
          <h2 className="mt-2 text-3xl font-black">Πού πάει το προϊόν μετά την beta.</h2>
          <p className="mt-4 leading-7 text-slate-700">
            Η δημόσια εικόνα των πλάνων κρατά την υπόσχεση απλή: πρώτα ποιότητα και
            εμπιστοσύνη, μετά πληρωμές.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {planCards.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-lg border p-6 ${
                plan.highlighted
                  ? "border-emerald-300 bg-white shadow-lg shadow-emerald-900/10"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black">{plan.name}</h3>
                  <p className="mt-1 text-sm font-bold text-emerald-700">{plan.status}</p>
                </div>
                <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {plan.price}
                </p>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-700">{plan.audience}</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-800">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-6 inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-bold transition ${
                  plan.highlighted
                    ? "bg-emerald-700 text-white hover:bg-emerald-800"
                    : "border border-slate-300 bg-white hover:bg-slate-100"
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-900 text-white" data-testid="plans-payment-readiness">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-300">
              Πριν τις πληρωμές
            </p>
            <h2 className="mt-2 text-3xl font-black">Τι πρέπει να είναι ξεκάθαρο.</h2>
          </div>
          <div className="grid gap-3">
            {launchSignals.map((signal) => (
              <div key={signal} className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6">
                {signal}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
