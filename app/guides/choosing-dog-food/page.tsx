import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicMetadata({
  title: "Τι τροφή να πάρω στον σκύλο μου;",
  description:
    "Πρακτικός οδηγός για να επιλέξεις τροφή σκύλου: στάδιο ζωής, πλήρης τροφή, ετικέτα, θερμίδες και ερωτήσεις προς τον κατασκευαστή. Πότε χρειάζεται κτηνίατρος.",
  path: "/guides/choosing-dog-food",
});

export default function ChoosingDogFoodGuide() {
  return (
    <main className="min-h-screen bg-[#fbfcfa] text-[#14221b]">
      <PublicHeader />
      <article className="nt-container max-w-4xl py-10 sm:py-16">
        <Link href="/guides" className="nt-focus rounded text-sm font-bold text-[#17663f] hover:underline">
          Οδηγοί διατροφής
        </Link>
        <header className="mt-7 border-b border-[#dce5df] pb-9">
          <p className="nt-eyebrow">Επιλογή τροφής σκύλου</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Τι τροφή να πάρω στον σκύλο μου;
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42534a]">
            Δεν υπάρχει μία «καλύτερη» τροφή για όλους τους σκύλους. Ξεκίνα από
            τις ανάγκες του δικού σου ζώου και έλεγξε τι λέει πραγματικά η
            ετικέτα, πριν συγκρίνεις μάρκες ή τιμές.
          </p>
        </header>

        <div className="max-w-3xl space-y-10 py-10 text-base leading-8 text-[#42534a]">
          <section aria-labelledby="dog-needs">
            <h2 id="dog-needs" className="text-2xl font-black text-[#14221b]">
              1. Ξεκίνα από τον σκύλο σου
            </h2>
            <p className="mt-4">
              Σημείωσε το στάδιο ζωής του (κουτάβι ή ενήλικος), το τωρινό βάρος
              και τη σωματική του κατάσταση, τη δραστηριότητα και τι τρώει
              σήμερα. Αυτά είναι πιο χρήσιμα για μια πρώτη επιλογή από μια
              γενική λίστα με «κορυφαίες» τροφές. Αν έχει διαγνωσμένο πρόβλημα
              υγείας ή ακολουθεί θεραπευτική δίαιτα, συζήτησε την αλλαγή με
              τον κτηνίατρο που τον παρακολουθεί.
            </p>
          </section>

          <section aria-labelledby="dog-complete">
            <h2 id="dog-complete" className="text-2xl font-black text-[#14221b]">
              2. Διάβασε πρώτα τη διατροφική δήλωση
            </h2>
            <p className="mt-4">
              Για κύρια καθημερινή τροφή, αναζήτησε στη συσκευασία ότι είναι
              <strong className="font-bold text-[#14221b]"> πλήρης τροφή για σκύλους</strong>
              {" "}και ότι καλύπτει το κατάλληλο στάδιο ζωής. Μια
              «συμπληρωματική» τροφή ή λιχουδιά δεν προορίζεται από μόνη της
              να αποτελεί ολόκληρη τη δίαιτα. Έλεγξε επίσης τις οδηγίες
              σίτισης και τις θερμίδες, αν αναγράφονται: η ημερήσια μερίδα
              είναι αφετηρία που θα παρακολουθήσεις στην πράξη, όχι ίδια
              ποσότητα για κάθε σκύλο.
            </p>
          </section>

          <section aria-labelledby="dog-labels">
            <h2 id="dog-labels" className="text-2xl font-black text-[#14221b]">
              3. Μην αποφασίζεις από το μπροστινό μέρος της συσκευασίας
            </h2>
            <p className="mt-4">
              Όροι όπως «premium» ή «holistic» δεν αρκούν για να κρίνεις τη
              θρεπτική καταλληλότητα. Κοίτα ποιος παρασκευάζει την τροφή,
              πώς μπορείς να επικοινωνήσεις μαζί του και αν μπορεί να σου
              δώσει στοιχεία για τη σύνθεση, τις θερμίδες και τον ποιοτικό
              έλεγχο. Αν μια πληροφορία λείπει από την ετικέτα, ρώτησε τον
              κατασκευαστή. Η λίστα συστατικών από μόνη της επίσης δεν
              απαντά αν η τροφή ταιριάζει στον συγκεκριμένο σκύλο.
            </p>
          </section>

          <section aria-labelledby="dog-compare">
            <h2 id="dog-compare" className="text-2xl font-black text-[#14221b]">
              4. Σύγκρινε δύο ή τρεις κατάλληλες επιλογές
            </h2>
            <p className="mt-4">
              Αφού αποκλείσεις όσα δεν ταιριάζουν στο στάδιο ζωής του,
              σύγκρινε τις υποψήφιες τροφές με τις ίδιες ερωτήσεις:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 marker:text-[#1f7a4d]">
              <li>Είναι πλήρης και κατάλληλη για τον σκύλο μου;</li>
              <li>Ξέρω τις θερμίδες και από πού θα ξεκινήσω τη μερίδα;</li>
              <li>Υπάρχουν σαφή στοιχεία κατασκευαστή και απαντήσεις στις απορίες μου;</li>
              <li>Την τρώει ο σκύλος μου και μπορώ να την προμηθεύομαι σταθερά;</li>
              <li>Το κόστος της ημερήσιας μερίδας είναι βιώσιμο για μένα;</li>
            </ul>
            <p className="mt-4">
              Έτσι επιλέγεις μια λογική αφετηρία, όχι έναν «νικητή» που
              ισχύει για κάθε ζώο. Μετά παρακολούθησε την όρεξη, το βάρος και
              τη σωματική κατάσταση του σκύλου σου.
            </p>
          </section>

          <section aria-labelledby="dog-portion-next">
            <h2 id="dog-portion-next" className="text-2xl font-black text-[#14221b]">
              Και πόση ποσότητα να του δίνω;
            </h2>
            <p className="mt-4">
              Η επιλογή προϊόντος και η ποσότητα είναι δύο διαφορετικά βήματα.
              Δες τον <Link href="/guides/dog-food-portion" className="nt-focus rounded font-semibold text-[#17663f] underline">οδηγό για τη μερίδα τροφής του σκύλου</Link>
              {" "}για να ξεκινήσεις από την ετικέτα και να συνυπολογίσεις
              τις λιχουδιές.
            </p>
          </section>

          <section aria-labelledby="dog-vet">
            <h2 id="dog-vet" className="text-2xl font-black text-[#14221b]">
              Πότε χρειάζεται κτηνίατρος;
            </h2>
            <p className="mt-4">
              Σε χρόνια νόσο, θεραπευτική δίαιτα, κύηση ή θηλασμό, ανεξήγητη
              αλλαγή βάρους ή έντονη αλλαγή όρεξης, ένας γενικός οδηγός δεν
              αρκεί. Ζήτησε εξατομικευμένη εκτίμηση πριν αλλάξεις τροφή ή
              μερίδα.
            </p>
          </section>
        </div>

        <section aria-labelledby="dog-choice-sources" className="max-w-3xl border-t border-[#dce5df] py-8 text-sm leading-7 text-[#52635a]">
          <h2 id="dog-choice-sources" className="text-lg font-black text-[#14221b]">Πηγές και όρια</h2>
          <p className="mt-3">
            Ενημερωτικό περιεχόμενο για γενική επιλογή τροφής, όχι διάγνωση
            ή εξατομικευμένη κτηνιατρική οδηγία. Βασίζεται στις οδηγίες της
            <a className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline" href="https://europeanpetfood.org/pet-food-facts/fact-sheets/nutrition/choosing-the-right-food-for-your-dog-and-cat/">FEDIAF για την επιλογή τροφής</a>
            {" "}και της
            <a className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline" href="https://wsava.org/wp-content/uploads/2021/04/Selecting-a-pet-food-for-your-pet-updated-2021_WSAVA-Global-Nutrition-Toolkit.pdf">WSAVA για την αξιολόγηση τροφών</a>.
          </p>
        </section>

        <nav aria-label="Σχετικοί σύνδεσμοι" className="flex flex-col gap-4 border-t border-[#dce5df] py-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/guides/dog-food-portion" className="nt-focus rounded font-bold text-[#17663f] hover:underline">
            Δες τον οδηγό για τη μερίδα
          </Link>
          <Link href="/register" className="nt-button nt-button-primary nt-focus inline-flex gap-2">
            Ξεκίνα δωρεάν ανάλυση <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </nav>
      </article>
      <PublicFooter />
    </main>
  );
}
