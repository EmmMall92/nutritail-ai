import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Clock3, PawPrint, ShieldCheck, Sparkles } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { launchFeatures } from "@/lib/launch/features";

export const metadata: Metadata = {
  title: "Πλάνα | Nutritail AI",
  description: "Δες τι περιλαμβάνει η δωρεάν πρόσβαση του Nutritail AI.",
  alternates: { canonical: "/plans" },
};

const betaFeatures = [
  "Έως 3 αποθηκευμένα κατοικίδια",
  "Έως 20 νέες αναλύσεις τον μήνα",
  "Υπολογισμός θερμίδων και ημερήσιας μερίδας",
  "Προτάσεις τροφών από τη βάση NutriTail",
  "Ιστορικό αναλύσεων και αναφορές",
];

const futurePlans = [
  {
    name: "Personal",
    description: "Για κηδεμόνες που θέλουν συνεχή παρακολούθηση και περισσότερες αναλύσεις.",
    features: ["Περισσότερα κατοικίδια", "Εκτενέστερο ιστορικό", "Συχνότεροι έλεγχοι προόδου"],
  },
  {
    name: "Professional",
    description: "Για επαγγελματίες που διαχειρίζονται περισσότερα προφίλ και αναφορές.",
    features: ["Πολλαπλά προφίλ", "Οργανωμένες αναφορές", "Εργαλεία επαγγελματικής ροής"],
  },
];

export default function PlansPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfcfa] text-[#14221b]">
      <PublicHeader />

      <section className="border-b border-[#dce5df] bg-[#eef7f1]" data-testid="plans-hero">
        <div className="nt-container grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-extrabold text-[#17663f] shadow-sm">
              <Sparkles size={15} />
              Δωρεάν beta πρόσβαση
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
              Γνώρισε το NutriTail χωρίς χρέωση.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#52635a] sm:text-lg">
              Αυτή την περίοδο δίνουμε προτεραιότητα στην ποιότητα των προτάσεων
              και στα σχόλια των πρώτων χρηστών. Δεν ζητάμε κάρτα και δεν
              ενεργοποιούμε συνδρομή.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="nt-button nt-button-primary nt-focus">
                Δημιούργησε δωρεάν λογαριασμό
                <ArrowRight size={17} />
              </Link>
              <Link href="/how-it-works" className="nt-button nt-button-secondary nt-focus">
                Δες τη μεθοδολογία
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-[#cbdacf] bg-white p-6 shadow-[0_18px_50px_rgba(22,64,43,0.10)] sm:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-[#dce5df] pb-5">
              <div>
                <p className="text-sm font-black text-[#1f7a4d]">Beta</p>
                <p className="mt-1 text-3xl font-black">€0</p>
              </div>
              <span className="rounded-md bg-[#eaf7ef] px-3 py-2 text-xs font-extrabold text-[#17663f]">
                Διαθέσιμο τώρα
              </span>
            </div>
            <ul className="mt-6 grid gap-4">
              {betaFeatures.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm leading-6 text-[#42534a]">
                  <Check size={18} className="mt-1 shrink-0 text-[#1f7a4d]" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20" data-testid="plans-current-beta-limits">
        <div className="nt-container">
          <div className="max-w-2xl">
            <p className="nt-eyebrow">Τι παίρνεις σήμερα</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Αρκετός χώρος για να το δοκιμάσεις πραγματικά.
            </h2>
          </div>

          <div className="mt-10 grid gap-8 border-y border-[#dce5df] py-8 md:grid-cols-3">
            <div>
              <PawPrint size={24} className="text-[#1f7a4d]" />
              <p className="mt-5 text-4xl font-black">3</p>
              <p className="mt-2 text-sm font-bold">κατοικίδια ανά λογαριασμό</p>
            </div>
            <div>
              <Clock3 size={24} className="text-[#e56f51]" />
              <p className="mt-5 text-4xl font-black">20</p>
              <p className="mt-2 text-sm font-bold">νέες αναλύσεις κάθε μήνα</p>
            </div>
            <div>
              <ShieldCheck size={24} className="text-[#1f7a4d]" />
              <p className="mt-5 text-4xl font-black">0</p>
              <p className="mt-2 text-sm font-bold">χρεώσεις κατά τη beta</p>
            </div>
          </div>
        </div>
      </section>

      {launchFeatures.paidPlans && (
      <section className="border-y border-[#dce5df] bg-white py-16 sm:py-20" data-testid="plans-future-direction">
        <div className="nt-container">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="nt-eyebrow">Μετά τη beta</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                Η μελλοντική κατεύθυνση.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-[#5f6f66] lg:justify-self-end">
              Τα παρακάτω πλάνα δείχνουν πού κατευθύνεται το προϊόν. Οι τελικές
              δυνατότητες και τιμές θα ανακοινωθούν μόνο όταν ολοκληρωθεί η beta.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {futurePlans.map((plan) => (
              <article key={plan.name} className="rounded-lg border border-[#dce5df] bg-[#f7faf8] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black">{plan.name}</h3>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-[#5f6f66]">{plan.description}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-white px-3 py-2 text-xs font-extrabold text-[#6b7b72]">
                    Σύντομα
                  </span>
                </div>
                <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm font-bold text-[#42534a]">
                      <Check size={17} className="shrink-0 text-[#1f7a4d]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      <section className="bg-[#123d2b] py-14 text-white" data-testid="plans-payment-readiness">
        <div className="nt-container flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black">Δοκίμασέ το με το δικό σου κατοικίδιο.</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">
              Η beta είναι δωρεάν και τα σχόλιά σου βοηθούν να γίνει κάθε πρόταση καλύτερη.
            </p>
          </div>
          <Link
            href="/register"
            className="nt-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-[#123d2b] hover:bg-[#eaf7ef]"
          >
            Ξεκίνα δωρεάν
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
