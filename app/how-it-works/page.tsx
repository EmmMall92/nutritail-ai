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

const sourceQualitySteps = [
  {
    title: "1. Επίσημη πηγή",
    text: "Προτιμάμε επίσημη σελίδα εταιρείας, τεχνικό φυλλάδιο ή επίσημο PDF όταν υπάρχουν, γιατί αυτά είναι η πιο καθαρή βάση για θρεπτικά στοιχεία και συστατικά.",
  },
  {
    title: "2. Retailer ή ελληνικό e-shop",
    text: "Χρησιμοποιείται για να συμπληρώσει κενά ή να επιβεβαιώσει προϊόντα που κυκλοφορούν στην ελληνική αγορά. Αν συγκρούεται με επίσημη πηγή, χρειάζεται review.",
  },
  {
    title: "3. Ετικέτα ή φωτογραφία συσκευασίας",
    text: "Είναι πολύ χρήσιμη για πραγματικά προϊόντα ραφιού, ειδικά όταν λείπουν θερμίδες, τέφρα, μέταλλα ή αναλυτικά συστατικά από online πηγές.",
  },
  {
    title: "4. Ελλιπή δεδομένα",
    text: "Όταν λείπουν κρίσιμα στοιχεία, το NutriTail δεν προσποιείται βεβαιότητα. Η πρόταση γίνεται πιο προσεκτική και ζητά περισσότερα στοιχεία όταν χρειάζεται.",
  },
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

      <section
        className="border-y border-black/10 bg-white"
        data-testid="public-trust-decision-model"
      >
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Πώς κρατάμε την πρόταση αξιόπιστη
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Το AI εξηγεί. Το NutriTail αποφασίζει με δεδομένα.
            </h2>
            <p className="mt-4 leading-8 text-gray-700">
              Η πρόταση δεν βασίζεται σε τυχαία μνήμη ή γενικές υποθέσεις. Πρώτα
              χρησιμοποιούμε στοιχεία κατοικιδίου, μετά τη βάση Food V2, έπειτα
              κανόνες διατροφής και ασφάλειας. Το OpenAI βοηθά να γραφτεί η
              απάντηση φυσικά, χωρίς να εφευρίσκει τροφές ή θρεπτικές τιμές.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <article className="rounded-xl border border-black/10 bg-[#f7f7f4] p-5">
              <h3 className="font-black">1. Food V2 βάση</h3>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                Από εδώ έρχονται οι τροφές, θερμίδες, συστατικά και θρεπτικά
                στοιχεία που χρησιμοποιούνται στις προτάσεις.
              </p>
            </article>
            <article className="rounded-xl border border-black/10 bg-[#f7f7f4] p-5">
              <h3 className="font-black">2. Κανόνες NutriTail</h3>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                Κόβουν ακατάλληλες επιλογές για είδος, ηλικία, μέγεθος,
                αλλεργίες, στόχο βάρους και βασικά θέματα υγείας.
              </p>
            </article>
            <article className="rounded-xl border border-black/10 bg-[#f7f7f4] p-5">
              <h3 className="font-black">3. OpenAI απάντηση</h3>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                Μετατρέπει τα αποτελέσματα σε απλή ανθρώπινη εξήγηση, χωρίς να
                αποφασίζει μόνο του ποια τροφή θα προταθεί.
              </p>
            </article>
            <article className="rounded-xl border border-black/10 bg-[#f7f7f4] p-5">
              <h3 className="font-black">4. Όρια ασφάλειας</h3>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                Σε επείγοντα ή ιατρικά περιστατικά η ροή σταματά την “αγορά
                τροφής” και προτείνει επικοινωνία με κτηνίατρο.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section
        className="border-b border-black/10 bg-[#f7f7f4]"
        data-testid="public-source-quality-model"
      >
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Ποιότητα πηγών
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Δεν έχουν όλα τα δεδομένα την ίδια βαρύτητα
            </h2>
            <p className="mt-4 leading-8 text-gray-700">
              Η βάση τροφών μεγαλώνει από επίσημες σελίδες, PDFs, ελληνικά
              e-shops και φωτογραφίες ετικετών. Κρατάμε την προέλευση κάθε
              πληροφορίας, ώστε το NutriTail να ξέρει πότε μπορεί να μιλήσει
              με σιγουριά και πότε πρέπει να είναι πιο προσεκτικό.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            {sourceQualitySteps.map((step) => (
              <article
                key={step.title}
                className="rounded-xl border border-black/10 bg-white p-5"
              >
                <h3 className="font-black">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  {step.text}
                </p>
              </article>
            ))}
          </div>
        </div>
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
