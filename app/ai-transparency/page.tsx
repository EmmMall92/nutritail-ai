import Link from "next/link";
import { Bot, Database, Scale, ShieldCheck, Stethoscope } from "lucide-react";

import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { brand } from "@/lib/brand";
import { AI_TRANSPARENCY_VERSION } from "@/lib/legal/config";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicMetadata({
  title: `Διαφάνεια AI | ${brand.name}`,
  description:
    "Πώς χρησιμοποιεί AI το Nutritail, ποια είναι τα όριά του και πότε χρειάζεται κτηνίατρος.",
  path: "/ai-transparency",
});

const boundaries = [
  {
    icon: Database,
    title: "Ελεγμένη βάση τροφών",
    text: "Το AI δεν επιτρέπεται να εφευρίσκει προϊόντα, συστατικά ή θρεπτικές τιμές. Οι επιλογές τροφής συνδέονται με τη βάση Nutritail και τους κανόνες επιλεξιμότητας.",
  },
  {
    icon: ShieldCheck,
    title: "Κανόνες ασφάλειας",
    text: "Είδος ζώου, ηλικία, αλλεργίες, ιατρικό ιστορικό και συμπτώματα ελέγχονται πριν ξεκινήσει υπολογισμός ή αναζήτηση προϊόντων.",
  },
  {
    icon: Scale,
    title: "Εμπορικός διαχωρισμός",
    text: "Η επιλογή τροφής ολοκληρώνεται πριν εμφανιστούν καταστήματα. Μια εμπορική συνεργασία δεν μπορεί να αγοράσει καλύτερη διατροφική αξιολόγηση.",
  },
  {
    icon: Stethoscope,
    title: "Medical handoff",
    text: "Νόσος, φάρμακα, θεραπευτική δίαιτα ή δηλωμένη αλλεργία μπλοκάρουν κατάταξη προϊόντων, θερμίδες και γραμμάρια. Επείγον σύμπτωμα σταματά αμέσως τη ροή και παραπέμπει σε κτηνίατρο.",
  },
] as const;

export default function AiTransparencyPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f5] text-[#14221b]">
      <PublicHeader />

      <section className="border-b border-[#dce5df] bg-white">
        <div className="nt-container py-12 sm:py-16" data-testid="ai-transparency-page">
          <div className="flex max-w-3xl items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#123d2b] text-white">
              <Bot size={24} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase text-[#1f7a4d]">
                Έκδοση {AI_TRANSPARENCY_VERSION}
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                Πώς χρησιμοποιούμε την τεχνητή νοημοσύνη
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#52635a]">
                Όταν χρησιμοποιείς τον βοηθό επιλογής τροφής, συνομιλείς με
                σύστημα AI. Το AI οργανώνει τα στοιχεία που δίνεις και
                διατυπώνει την απάντηση, μέσα στα όρια της βάσης και των
                κανόνων του Nutritail.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#52635a]">
                Η λειτουργία προορίζεται για ενημερωτική αντιστοίχιση τροφών σε
                μη ιατρικές περιπτώσεις. Δεν είναι κλινικό σύστημα αποφάσεων και
                δεν εκδίδει κτηνιατρική γνωμάτευση και δεν αντικαθιστά κτηνίατρο.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dce5df] bg-white">
        <div className="nt-container grid gap-8 py-10 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-black">Τι συμβαίνει σε ιατρικό πλαίσιο</h2>
            <p className="mt-3 text-sm leading-7 text-[#52635a]">
              Η ροή δεν περιορίζεται σε ένα disclaimer. Το medical handoff
              αφαιρεί τεχνικά όλες τις προτάσεις προϊόντων και δεν υπολογίζει
              θερμίδες ή γραμμάρια για τη συγκεκριμένη περίπτωση.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-black">Πότε μπορεί να αλλάξει αυτό</h2>
            <p className="mt-3 text-sm leading-7 text-[#52635a]">
              Ιατρική διαδρομή θα μπορεί να ενεργοποιηθεί μόνο μετά από
              τεκμηριωμένο σχεδιασμό και ρητή έγκριση αδειοδοτημένου κτηνιάτρου.
              Μέχρι τότε παραμένει μπλοκαρισμένη σε UI και server APIs.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dce5df] bg-[#eaf7ef]">
        <div className="nt-container py-10">
          <h2 className="text-2xl font-black">Τι μπορεί και τι δεν μπορεί να κάνει</h2>
          <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-[#c8ded0] bg-[#c8ded0] md:grid-cols-2">
            {boundaries.map(({ icon: Icon, title, text }) => (
              <article key={title} className="bg-white p-5 sm:p-6">
                <Icon size={21} className="text-[#1f7a4d]" aria-hidden="true" />
                <h3 className="mt-3 font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#52635a]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="nt-container grid gap-10 py-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-black">Τα δεδομένα της συνομιλίας</h2>
            <p className="mt-4 text-sm leading-7 text-[#52635a]">
              Χρησιμοποιούμε τα στοιχεία που υποβάλλεις για να δημιουργηθεί η
              απάντηση και, όταν επιλέξεις αποθήκευση, για το προφίλ και την
              ανάλυση του κατοικιδίου. Δεν στέλνουμε τη συνομιλία, τις
              αλλεργίες ή το προφίλ σου στα συνεργαζόμενα καταστήματα.
            </p>
            <Link
              href="/privacy"
              className="nt-focus mt-4 inline-flex rounded-lg font-bold text-[#17663f] underline underline-offset-4"
            >
              Πολιτική απορρήτου
            </Link>
          </div>
          <div>
            <h2 className="text-2xl font-black">Αμφισβήτηση και υποστήριξη</h2>
            <p className="mt-4 text-sm leading-7 text-[#52635a]">
              Μπορείς να αγνοήσεις μια πρόταση, να διορθώσεις τα στοιχεία και
              να ζητήσεις ανθρώπινη υποστήριξη. Για απόφαση υγείας, θεραπεία ή
              επείγον περιστατικό επικοινώνησε με κτηνίατρο.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold">
              <Link href="/support" className="nt-focus rounded-lg text-[#17663f] underline underline-offset-4">
                Υποστήριξη
              </Link>
              <Link href="/terms" className="nt-focus rounded-lg text-[#17663f] underline underline-offset-4">
                Όροι Χρήσης
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
