import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicMetadata({
  title: "Τι τροφή να πάρω στη γάτα μου;",
  description:
    "Πρακτικός οδηγός επιλογής τροφής γάτας: πλήρης ή συμπληρωματική, στάδιο ζωής, υγρή και ξηρά τροφή, θερμίδες και πότε χρειάζεται κτηνίατρος.",
  path: "/guides/choosing-cat-food",
});

export default function ChoosingCatFoodGuide() {
  return (
    <main className="min-h-screen bg-[#fbfcfa] text-[#14221b]">
      <PublicHeader />
      <article className="nt-container max-w-4xl py-10 sm:py-16">
        <Link href="/guides" className="nt-focus rounded text-sm font-bold text-[#17663f] hover:underline">
          Οδηγοί διατροφής
        </Link>
        <header className="mt-7 border-b border-[#dce5df] pb-9">
          <p className="nt-eyebrow">Επιλογή τροφής γάτας</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Τι τροφή να πάρω στη γάτα μου;
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42534a]">
            Η κατάλληλη αφετηρία δεν είναι μια μάρκα που «κερδίζει» για όλες
            τις γάτες. Είναι μια πλήρης τροφή που ταιριάζει στο στάδιο ζωής
            της δικής σου γάτας, την τρώει και μπορείς να τη δίνεις σε
            κατάλληλη ποσότητα.
          </p>
        </header>

        <div className="max-w-3xl space-y-10 py-10 text-base leading-8 text-[#42534a]">
          <section aria-labelledby="cat-needs">
            <h2 id="cat-needs" className="text-2xl font-black text-[#14221b]">
              1. Σημείωσε πρώτα τις ανάγκες της γάτας
            </h2>
            <p className="mt-4">
              Είναι γατάκι ή ενήλικη; Πόσο ζυγίζει, ποια είναι η σωματική της
              κατάσταση και τι τρώει σήμερα; Σημείωσε επίσης αν είναι
              στειρωμένη, τη δραστηριότητά της και αν προτιμά συγκεκριμένη
              υφή τροφής. Η στείρωση είναι στοιχείο για την εκτίμηση της
              μερίδας, όχι λόγος να θεωρήσεις αυτόματα σωστή κάθε συσκευασία
              με την ένδειξη «sterilised». Για διαγνωσμένο πρόβλημα υγείας ή
              θεραπευτική δίαιτα, η αλλαγή γίνεται σε συνεννόηση με
              κτηνίατρο.
            </p>
          </section>

          <section aria-labelledby="cat-complete">
            <h2 id="cat-complete" className="text-2xl font-black text-[#14221b]">
              2. Βρες τη διατροφική δήλωση στην ετικέτα
            </h2>
            <p className="mt-4">
              Για κύρια καθημερινή σίτιση, έλεγξε ότι γράφει
              <strong className="font-bold text-[#14221b]"> «πλήρης τροφή για γάτες»</strong>
              {" "}και ότι είναι κατάλληλη για το στάδιο ζωής της. Μια υγρή
              τροφή μπορεί να είναι πλήρης, αλλά μπορεί και να αναγράφεται ως
              «συμπληρωματική». Η δεύτερη δεν προορίζεται μόνη της να καλύψει
              όλη τη διατροφή. Κοίτα επίσης τις οδηγίες σίτισης και τις
              θερμίδες ανά 100 g, κονσέρβα ή φακελάκι, όπου διατίθενται.
            </p>
          </section>

          <section aria-labelledby="cat-format">
            <h2 id="cat-format" className="text-2xl font-black text-[#14221b]">
              3. Υγρή, ξηρά ή συνδυασμός;
            </h2>
            <p className="mt-4">
              Δεν χρειάζεται να διαλέξεις μία μορφή μόνο και μόνο επειδή
              ακούγεται «καλύτερη». Υγρή και ξηρά τροφή μπορούν να αποτελούν
              μέρος μιας κατάλληλης δίαιτας, εφόσον οι κύριες τροφές είναι
              πλήρεις και η γάτα τρώει την ποσότητα που χρειάζεται. Διάλεξε
              με βάση την αποδοχή της γάτας, την πρακτικότητα και το κόστος.
              Να έχει πάντα διαθέσιμο καθαρό νερό.
            </p>
            <p className="mt-4">
              Αν συνδυάζεις μορφές, μην προσθέτεις ολόκληρη την ημερήσια
              μερίδα και από τις δύο συσκευασίες. Οι θερμίδες από υγρή,
              ξηρά και λιχουδιές μετράνε μαζί. Δες τον
              <Link href="/guides/cat-food-portion" className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline">οδηγό για τη μερίδα της γάτας</Link>
              {" "}για το επόμενο βήμα.
            </p>
          </section>

          <section aria-labelledby="cat-compare">
            <h2 id="cat-compare" className="text-2xl font-black text-[#14221b]">
              4. Σύγκρινε λίγες κατάλληλες επιλογές
            </h2>
            <p className="mt-4">
              Κράτησε δύο ή τρεις υποψήφιες τροφές και έλεγξε τις ίδιες
              ερωτήσεις για καθεμία:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 marker:text-[#1f7a4d]">
              <li>Είναι πλήρης και κατάλληλη για το στάδιο ζωής της γάτας μου;</li>
              <li>Ξέρω τις θερμίδες της συγκεκριμένης συσκευασίας;</li>
              <li>Την τρώει πρόθυμα και μπορώ να την προμηθεύομαι σταθερά;</li>
              <li>Μπορώ να βρω ποιος την παρασκευάζει και να ζητήσω στοιχεία σύνθεσης και ποιοτικού ελέγχου;</li>
              <li>Το κόστος της ημερήσιας μερίδας είναι βιώσιμο για μένα;</li>
            </ul>
            <p className="mt-4">
              Όροι όπως «premium» ή «holistic» δεν αρκούν για να κρίνεις τη
              θρεπτική καταλληλότητα. Αν λείπουν θερμίδες ή άλλες πληροφορίες
              από την ετικέτα, ρώτησε τον κατασκευαστή. Η αποδοχή, το βάρος
              και η σωματική κατάσταση της γάτας δείχνουν αν η αρχική επιλογή
              λειτουργεί στην πράξη.
            </p>
          </section>

          <section aria-labelledby="cat-vet">
            <h2 id="cat-vet" className="text-2xl font-black text-[#14221b]">
              Πότε δεν αρκεί ένας γενικός οδηγός;
            </h2>
            <p className="mt-4">
              Για χρόνια νόσο, θεραπευτική δίαιτα, κύηση ή θηλασμό, απώλεια
              βάρους ή έντονη αλλαγή όρεξης ζήτησε εξατομικευμένη κτηνιατρική
              εκτίμηση. Αν η γάτα σταματήσει να τρώει, επικοινώνησε έγκαιρα
              με κτηνίατρο αντί να δοκιμάζεις απλώς άλλες τροφές.
            </p>
          </section>
        </div>

        <section aria-labelledby="cat-choice-sources" className="max-w-3xl border-t border-[#dce5df] py-8 text-sm leading-7 text-[#52635a]">
          <h2 id="cat-choice-sources" className="text-lg font-black text-[#14221b]">Πηγές και όρια</h2>
          <p className="mt-3">
            Ενημερωτικό περιεχόμενο για γενική επιλογή τροφής, όχι διάγνωση
            ή εξατομικευμένη κτηνιατρική οδηγία. Δες τη
            <a className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline" href="https://europeanpetfood.org/pet-food-facts/fact-sheets/nutrition/choosing-the-right-food-for-your-dog-and-cat/">FEDIAF για την επιλογή τροφής</a>,
            {" "}τη
            <a className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline" href="https://wsava.org/wp-content/uploads/2021/04/Selecting-a-pet-food-for-your-pet-updated-2021_WSAVA-Global-Nutrition-Toolkit.pdf">WSAVA για την αξιολόγηση της ετικέτας και του κατασκευαστή</a>
            {" "}και το
            <a className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline" href="https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/feeding-your-cat">Κέντρο Υγείας Γάτας του Cornell για τη διατροφή και την όρεξη</a>.
          </p>
        </section>

        <nav aria-label="Σχετικοί σύνδεσμοι" className="flex flex-col gap-4 border-t border-[#dce5df] py-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/guides/cat-food-portion" className="nt-focus rounded font-bold text-[#17663f] hover:underline">
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
