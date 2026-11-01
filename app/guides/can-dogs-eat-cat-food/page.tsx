import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { getRequestLocale } from "@/lib/i18n/server";
import {
  translatePublicText,
  translatePublicTree,
} from "@/lib/i18n/translatePublicTree";
import { createGuideStructuredData } from "@/lib/seo/guideStructuredData";
import { createPublicMetadata } from "@/lib/seo/metadata";

const guideTitle =
  "Μπορεί ο σκύλος να φάει γατοτροφή και η γάτα σκυλοτροφή;";
const guideDescription =
  "Γιατί η γατοτροφή δεν είναι σωστή καθημερινή τροφή για σκύλο και η σκυλοτροφή δεν καλύπτει τις ανάγκες της γάτας, τι γίνεται σε μια τυχαία μπουκιά και πότε χρειάζεται κτηνίατρος.";

export async function generateMetadata() {
  const locale = await getRequestLocale();

  return createPublicMetadata({
    title: translatePublicText(guideTitle, locale),
    description: translatePublicText(guideDescription, locale),
    path: "/guides/can-dogs-eat-cat-food",
    locale,
  });
}

export default async function CanDogsEatCatFoodGuide() {
  const locale = await getRequestLocale();
  const structuredData = createGuideStructuredData({
    title: translatePublicText(guideTitle, locale),
    description: translatePublicText(guideDescription, locale),
    path: "/guides/can-dogs-eat-cat-food",
    datePublished: "2026-11-01",
    dateModified: "2026-11-01",
    locale,
  });

  return translatePublicTree(locale, (
    <main className="min-h-screen bg-[#fbfcfa] text-[#14221b]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PublicHeader />

      <article className="nt-container max-w-4xl py-10 sm:py-16">
        <Link
          href="/guides"
          className="nt-focus rounded text-sm font-bold text-[#17663f] hover:underline"
        >
          Οδηγοί διατροφής
        </Link>

        <header className="mt-7 border-b border-[#dce5df] pb-9">
          <p className="nt-eyebrow">Διαφορές σκυλοτροφής και γατοτροφής</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Μπορεί ο σκύλος να φάει γατοτροφή και η γάτα σκυλοτροφή;
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42534a]">
            Μια μικρή τυχαία μπουκιά συνήθως δεν είναι λόγος πανικού. Το
            πρόβλημα αρχίζει όταν η τροφή του άλλου είδους γίνεται τακτικό
            γεύμα ή αντικαθιστά την πλήρη τροφή που έχει σχεδιαστεί για το
            συγκεκριμένο ζώο.
          </p>
        </header>

        <section
          aria-labelledby="short-answer"
          className="max-w-3xl border-b border-[#dce5df] py-8"
        >
          <p className="text-sm font-black uppercase text-[#17663f]">
            Σύντομη απάντηση
          </p>
          <h2 id="short-answer" className="mt-2 text-2xl font-black">
            Μια τυχαία μπουκιά συνήθως δεν είναι επείγον περιστατικό, αλλά η
            λάθος τροφή δεν είναι σωστό κύριο γεύμα.
          </h2>
          <ul className="mt-5 list-disc space-y-3 pl-6 leading-7 text-[#42534a] marker:text-[#1f7a4d]">
            <li>
              Η σκυλοτροφή δεν είναι σχεδιασμένη να καλύπτει όλες τις ειδικές
              διατροφικές απαιτήσεις της γάτας.
            </li>
            <li>
              Η γατοτροφή συχνά είναι πιο ενεργειακά πυκνή από όσο χρειάζεται
              ένας σκύλος για καθημερινή σίτιση.
            </li>
            <li>
              Για κύριο γεύμα, διάλεξε πλήρη τροφή για το σωστό είδος και το
              σωστό στάδιο ζωής.
            </li>
          </ul>
        </section>

        <div className="max-w-3xl space-y-10 py-10 text-base leading-8 text-[#42534a]">
          <section aria-labelledby="different-needs">
            <h2 id="different-needs" className="text-2xl font-black text-[#14221b]">
              1. Σκύλοι και γάτες δεν έχουν τις ίδιες ανάγκες
            </h2>
            <p className="mt-4">
              Η γάτα είναι υποχρεωτικό σαρκοφάγο και χρειάζεται ορισμένα
              θρεπτικά συστατικά έτοιμα μέσα στη διατροφή της. Μεταξύ αυτών
              είναι η ταυρίνη, η προσχηματισμένη βιταμίνη Α και το αραχιδονικό
              οξύ. Χρειάζεται επίσης διαφορετικά επίπεδα πρωτεΐνης και
              συγκεκριμένων αμινοξέων από τον σκύλο. Γι&apos; αυτό υπάρχουν
              ξεχωριστές διατροφικές προδιαγραφές για τα δύο είδη.
            </p>
          </section>

          <section aria-labelledby="dog-food-for-cats">
            <h2 id="dog-food-for-cats" className="text-2xl font-black text-[#14221b]">
              2. Γιατί η σκυλοτροφή δεν κάνει για κύρια τροφή της γάτας
            </h2>
            <p className="mt-4">
              Μια σκυλοτροφή μπορεί να είναι πλήρης και ισορροπημένη για
              σκύλους, χωρίς να φτάνει τα επίπεδα θρεπτικών συστατικών που
              απαιτούνται για γάτες. Αν αντικαταστήσει συστηματικά τη
              γατοτροφή, μπορεί με τον χρόνο να δημιουργηθούν ελλείψεις, ακόμη
              κι αν η γάτα φαίνεται αρχικά καλά. Το ρίσκο είναι μεγαλύτερο σε
              γατάκια, κύηση, θηλασμό ή όταν υπάρχει ήδη πρόβλημα υγείας.
            </p>
          </section>

          <section aria-labelledby="cat-food-for-dogs">
            <h2 id="cat-food-for-dogs" className="text-2xl font-black text-[#14221b]">
              3. Γιατί η γατοτροφή δεν κάνει για κύρια τροφή του σκύλου
            </h2>
            <p className="mt-4">
              Η γατοτροφή είναι σχεδιασμένη για τις διαφορετικές ανάγκες της
              γάτας και συχνά έχει περισσότερες θερμίδες, πρωτεΐνη ή λίπος ανά
              μερίδα. Σε έναν σκύλο που την τρώει τακτικά αυτό μπορεί να
              ευνοήσει αύξηση βάρους ή πεπτικές ενοχλήσεις. Σκύλος με ιστορικό
              παγκρεατίτιδας, υπερλιπιδαιμίας, ευαίσθητο πεπτικό ή θεραπευτική
              δίαιτα δεν πρέπει να έχει πρόσβαση στο μπολ της γάτας χωρίς
              οδηγία κτηνιάτρου.
            </p>
          </section>

          <section aria-labelledby="accidental-bite">
            <h2 id="accidental-bite" className="text-2xl font-black text-[#14221b]">
              4. Τι κάνω αν έφαγε από το λάθος μπολ;
            </h2>
            <p className="mt-4">
              Αν ένα κατά τα άλλα υγιές ζώο έφαγε λίγες κροκέτες και
              συμπεριφέρεται φυσιολογικά, παρακολούθησέ το και συνέχισε με την
              κανονική του τροφή στο επόμενο γεύμα. Μια μικρή τυχαία ποσότητα
              δεν προκαλεί τη διατροφική ανισορροπία που δημιουργεί η
              συστηματική χρήση.
            </p>
            <p className="mt-4">
              Επικοινώνησε με κτηνίατρο αν έφαγε πολύ μεγάλη ποσότητα, αν έχει
              γνωστή πάθηση ή θεραπευτική δίαιτα, ή αν εμφανίσει
              επαναλαμβανόμενο εμετό, επίμονη διάρροια, πόνο στην κοιλιά,
              έντονη αδυναμία ή άρνηση τροφής και νερού.
            </p>
          </section>

          <section aria-labelledby="separate-meals">
            <h2 id="separate-meals" className="text-2xl font-black text-[#14221b]">
              5. Πώς κρατάω χωριστά τα γεύματα;
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 marker:text-[#1f7a4d]">
              <li>Τάισε τα ζώα σε διαφορετικά δωμάτια ή σε ξεχωριστές ζώνες.</li>
              <li>Απομάκρυνε τα μπολ όταν τελειώσει το γεύμα.</li>
              <li>Φύλαξε τις συσκευασίες χωριστά και μέτρα τη μερίδα κάθε ζώου.</li>
              <li>
                Αν χρειάζεται ελεύθερη πρόσβαση, σκέψου ταΐστρα που ανοίγει
                μόνο για το σωστό κατοικίδιο.
              </li>
            </ul>
          </section>

          <section aria-labelledby="label-check">
            <h2 id="label-check" className="text-2xl font-black text-[#14221b]">
              6. Τι ελέγχω στη συσκευασία;
            </h2>
            <p className="mt-4">
              Η ετικέτα πρέπει να δηλώνει καθαρά αν η τροφή προορίζεται για
              σκύλο ή γάτα, αν είναι πλήρης ή συμπληρωματική και για ποιο
              στάδιο ζωής έχει σχεδιαστεί. Η φράση «πλήρης τροφή» αφορά το
              είδος και το στάδιο ζωής που αναγράφονται· δεν σημαίνει ότι το
              ίδιο προϊόν είναι πλήρες για κάθε κατοικίδιο.
            </p>
          </section>
        </div>

        <section
          aria-labelledby="species-food-sources"
          className="max-w-3xl border-t border-[#dce5df] py-8 text-sm leading-7 text-[#52635a]"
        >
          <h2 id="species-food-sources" className="text-lg font-black text-[#14221b]">
            Πηγές και όρια
          </h2>
          <p className="mt-3">
            Ενημερωτικό περιεχόμενο για υγιή ζώα, όχι διάγνωση ή
            εξατομικευμένο διατροφικό πλάνο. Οι διαφορές ανά είδος και η
            σημασία της πλήρους τροφής τεκμηριώνονται στις παρακάτω πηγές.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 marker:text-[#1f7a4d]">
            <li>
              <a
                className="nt-focus rounded font-semibold text-[#17663f] underline"
                href="https://europeanpetfood.org/self-regulation/nutritional-guidelines/"
              >
                Διατροφικές οδηγίες FEDIAF 2025
              </a>
            </li>
            <li>
              <a
                className="nt-focus rounded font-semibold text-[#17663f] underline"
                href="https://www.aafco.org/consumers/understanding-pet-food/selecting-the-right-pet-food"
              >
                AAFCO: επιλογή τροφής για το σωστό είδος και στάδιο ζωής
              </a>
            </li>
            <li>
              <a
                className="nt-focus rounded font-semibold text-[#17663f] underline"
                href="https://www.msdvetmanual.com/management-and-nutrition/nutrition-small-animals/nutritional-requirements-of-small-animals"
              >
                MSD Veterinary Manual: διατροφικές απαιτήσεις σκύλων και γατών
              </a>
            </li>
            <li>
              <a
                className="nt-focus rounded font-semibold text-[#17663f] underline"
                href="https://vcahospitals.com/know-your-pet/feeding-multiple-pets"
              >
                VCA και Canadian Academy of Veterinary Nutrition: σίτιση πολλών κατοικιδίων
              </a>
            </li>
          </ul>
        </section>

        <nav aria-label="Επόμενα βήματα" className="border-t border-[#dce5df] py-8">
          <h2 className="text-lg font-black">Επόμενα βήματα</h2>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/guides/choosing-dog-food"
              className="nt-focus rounded font-bold text-[#17663f] hover:underline"
            >
              Επιλογή τροφής σκύλου
            </Link>
            <Link
              href="/guides/choosing-cat-food"
              className="nt-focus rounded font-bold text-[#17663f] hover:underline"
            >
              Επιλογή τροφής γάτας
            </Link>
            <Link
              href="/account/food-compare"
              className="nt-focus rounded font-bold text-[#17663f] hover:underline"
            >
              Σύγκρινε τροφές
            </Link>
            <Link
              href="/register?next=/account/chatbot"
              className="nt-button nt-button-primary nt-focus inline-flex gap-2 sm:ml-auto"
            >
              Ρώτησε το chatbot <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </article>

      <PublicFooter />
    </main>
  ));
}
