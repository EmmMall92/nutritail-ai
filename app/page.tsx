import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${brand.name} | Διατροφική καθοδήγηση για κατοικίδια`,
  description:
    "Προσωπική διατροφική καθοδήγηση για σκύλους και γάτες, με εκτίμηση μερίδας, στόχο θερμίδων και πρακτικές πληροφορίες τροφής.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${brand.name} | Διατροφική καθοδήγηση για κατοικίδια`,
    description:
      "Κατανόησε θερμίδες, ποσότητα τροφής, στόχο βάρους, λιχουδιές και καταλληλότητα τροφής με το Nutritail AI.",
    url: "/",
    type: "website",
  },
};

const features = [
  {
    title: "Προσωπική καθοδήγηση σίτισης",
    text: "Πάρε εκτίμηση θερμίδων και ποσότητας με βάση είδος, ηλικία, βάρος, δραστηριότητα και στόχο.",
  },
  {
    title: "Προτάσεις με βάση την τροφή",
    text: "Σύνδεσε τις ανάγκες του κατοικιδίου με την τροφή που χρησιμοποιείς και δες αν ταιριάζει.",
  },
  {
    title: "Ιστορικό διατροφής",
    text: "Αποθήκευσε αναλύσεις, παρακολούθησε αλλαγές και κράτησε κάθε προφίλ οργανωμένο.",
  },
];

const steps = [
  "Δημιούργησε δωρεάν λογαριασμό",
  "Απάντησε σε απλές ερωτήσεις για το κατοικίδιο",
  "Πάρε πρακτική διατροφική καθοδήγηση",
];

const trustPillars = [
  {
    title: "Πρώτα η βάση τροφών",
    text: "Οι προτάσεις βασίζονται στον κατάλογο τροφών και όχι σε γενικές μαντεψιές.",
  },
  {
    title: "Πιο προσεκτική απάντηση όταν λείπουν στοιχεία",
    text: "Αν λείπουν θερμίδες, μέταλλα ή λεπτομέρειες ετικέτας, η απάντηση γίνεται πιο προσεκτική.",
  },
  {
    title: "Ασφαλή όρια υγείας",
    text: "Όταν υπάρχουν ανησυχητικά συμπτώματα, η ροή σταματά την αγορά τροφής και προτείνει κτηνίατρο.",
  },
];

const customerOutcomes = [
  {
    title: "Καθοδηγούμενη συζήτηση",
    text: "Ξεκίνα με ηλικία, βάρος, δραστηριότητα, στείρωση, ευαισθησίες και τωρινή τροφή.",
  },
  {
    title: "Σύντομη λίστα τροφών",
    text: "Δες δυνατές διατροφικές επιλογές και πιο απλές εναλλακτικές όταν υπάρχουν αρκετά κατάλληλα δεδομένα.",
  },
  {
    title: "Αποθηκευμένο προφίλ κατοικιδίου",
    text: "Κράτησε αναλύσεις, τροφή, στόχο θερμίδων και σημειώσεις προόδου σε ένα σημείο.",
  },
  {
    title: "Εκτυπώσιμη αναφορά",
    text: "Άνοιξε καθαρή αναφορά ή ιστορικό που μπορείς να αποθηκεύσεις, να εκτυπώσεις ή να ξαναδείς.",
  },
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: brand.domain,
    email: brand.contactEmail,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: brand.domain,
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: brand.name,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    url: brand.domain,
    description: brand.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <header className="border-b border-black/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-xl font-black tracking-tight">
            Nutritail AI
          </Link>

          <nav className="flex w-full gap-2 sm:w-auto">
            <Link
              href="/about"
              className="flex-1 rounded-full border border-black/20 px-5 py-2 text-center text-sm font-medium transition hover:bg-gray-100 sm:flex-none"
            >
              Σχετικά
            </Link>

            <Link
              href="/how-it-works"
              className="flex-1 rounded-full border border-black/20 px-5 py-2 text-center text-sm font-medium transition hover:bg-gray-100 sm:flex-none"
            >
              Πώς δουλεύει
            </Link>

            <Link
              href="/login"
              className="flex-1 rounded-full border border-black/20 px-5 py-2 text-center text-sm font-medium transition hover:bg-gray-100 sm:flex-none"
            >
              Σύνδεση
            </Link>

            <Link
              href="/register"
              className="flex-1 rounded-full bg-black px-5 py-2 text-center text-sm font-medium text-white transition hover:opacity-90 sm:flex-none"
            >
              Ξεκίνα δωρεάν
            </Link>
            <Link
              href="/beta"
              className="flex-1 rounded-full border border-green-700 px-5 py-2 text-center text-sm font-medium text-green-800 transition hover:bg-green-50 sm:flex-none"
            >
              Beta
            </Link>
            <Link
              href="/plans"
              className="flex-1 rounded-full border border-black/20 px-5 py-2 text-center text-sm font-medium transition hover:bg-gray-100 sm:flex-none"
            >
              Plans
            </Link>
            <Link
              href="/support"
              className="flex-1 rounded-full border border-black/20 px-5 py-2 text-center text-sm font-medium transition hover:bg-gray-100 sm:flex-none"
            >
              Support
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <p className="inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
            Διατροφική καθοδήγηση για σκύλους και γάτες
          </p>

          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
            Τάισε το κατοικίδιό σου με περισσότερη σιγουριά.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-700">
            Το Nutritail AI σε βοηθά να καταλάβεις θερμίδες, ποσότητα τροφής,
            στόχο βάρους, λιχουδιές και καταλληλότητα τροφής μέσα από απλή,
            προσωπική καθοδήγηση.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-full bg-black px-7 py-4 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Ξεκίνα δωρεάν ανάλυση
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-black/20 bg-white px-7 py-4 text-sm font-semibold transition hover:bg-gray-50"
            >
              Έχω ήδη λογαριασμό
            </Link>
          </div>

          <p className="mt-5 text-xs text-gray-500">
            Η καθοδήγηση είναι ενημερωτική. Το Nutritail AI δεν αντικαθιστά
            κτηνιατρική διάγνωση ή ιατρική συμβουλή.
          </p>
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5">
          <div className="rounded-[1.5rem] bg-gray-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-black">Παράδειγμα ανάλυσης</p>
                <p className="text-sm text-gray-500">Λούνα - ενήλικη γάτα</p>
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Καλή επιλογή
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">Ημερήσιες θερμίδες</p>
                <p className="mt-2 text-2xl font-black">235</p>
                <p className="text-xs text-gray-500">kcal/ημέρα</p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">Ποσότητα τροφής</p>
                <p className="mt-2 text-2xl font-black">58g</p>
                <p className="text-xs text-gray-500">την ημέρα</p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">Όριο λιχουδιών</p>
                <p className="mt-2 text-2xl font-black">23</p>
                <p className="text-xs text-gray-500">kcal/ημέρα</p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">Καταλληλότητα τροφής</p>
                <p className="mt-2 text-2xl font-black">Καλή</p>
                <p className="text-xs text-gray-500">χωρίς τεχνικό score</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-black p-5 text-white">
              <p className="text-sm font-semibold">
                Η τροφή φαίνεται κατάλληλη, αλλά η μερίδα θέλει προσοχή γιατί
                η Λούνα είναι στειρωμένη.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-6 py-14 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-black/10 bg-[#f7f7f4] p-6"
            >
              <h2 className="text-xl font-bold">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Online εμπειρία πελάτη
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              Από τη σύνδεση μέχρι ένα χρήσιμο διατροφικό αποτέλεσμα.
            </h2>
            <p className="mt-4 max-w-2xl text-gray-600">
              Το Nutritail AI είναι φτιαγμένο για πελάτες που χρησιμοποιούν την
              ιστοσελίδα μόνοι τους: συνδέονται, επιλέγουν κατοικίδιο, κάνουν
              ανάλυση, αποθηκεύουν το αποτέλεσμα και επιστρέφουν για έλεγχο
              προόδου ή νέα πρόταση τροφής.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {customerOutcomes.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[2rem] bg-black p-8 text-white md:p-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-black md:text-5xl">
                Απλό για κάθε κηδεμόνα κατοικιδίου.
              </h2>
              <p className="mt-4 text-gray-300">
                Χωρίς δύσκολη διατροφική ορολογία. Μόνο καθαρή καθοδήγηση που
                μπορείς να χρησιμοποιήσεις στην πράξη.
              </p>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/10 bg-white/10 p-4"
                >
                  <p className="text-sm text-gray-300">Βήμα {index + 1}</p>
                  <p className="mt-1 font-semibold">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Φτιαγμένο για προσεκτικές απαντήσεις
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              Καθαρές προτάσεις που μπορείς να καταλάβεις.
            </h2>
            <p className="mt-4 max-w-2xl text-gray-600">
              Το Nutritail AI ξεχωρίζει τα στοιχεία τροφής, το προφίλ του
              κατοικιδίου, τους διατροφικούς κανόνες και την ανθρώπινη
              εξήγηση. Έτσι η τελική απάντηση είναι πιο εύκολη να αξιολογηθεί.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {trustPillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {pillar.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-sm">
          <h2 className="text-3xl font-black">
            Ξεκίνα την πρώτη διατροφική ανάλυση σήμερα.
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Δημιούργησε λογαριασμό, πρόσθεσε το κατοικίδιο και πάρε πρακτική
            σύνοψη σίτισης σε λίγα λεπτά.
          </p>

          <Link
            href="/register"
            className="mt-6 inline-flex rounded-full bg-black px-7 py-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Δημιουργία δωρεάν λογαριασμού
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <p>(c) {new Date().getFullYear()} Nutritail AI. Με την επιφύλαξη κάθε δικαιώματος.</p>

          <div className="flex gap-4">
            <Link href="/about" className="hover:text-black">
              Σχετικά
            </Link>
            <Link href="/how-it-works" className="hover:text-black">
              Πώς δουλεύει
            </Link>
            <Link href="/beta" className="hover:text-black">
              Beta
            </Link>
            <Link href="/privacy" className="hover:text-black">
              Πολιτική απορρήτου
            </Link>
            <Link href="/terms" className="hover:text-black">
              Όροι χρήσης
            </Link>
            <Link href="/login" className="hover:text-black">
              Σύνδεση
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
