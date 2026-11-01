import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { createGuideStructuredData } from "@/lib/seo/guideStructuredData";
import { createPublicMetadata } from "@/lib/seo/metadata";

const guideTitle = "Πόση τροφή χρειάζεται ο σκύλος ή το κουτάβι μου;";
const guideDescription =
  "Πρακτικός οδηγός για ποσότητα τροφής σε κουτάβι ανά ηλικία, βάρος και αναμενόμενο ενήλικο μέγεθος: γεύματα, θερμίδες και ανάπτυξη.";

export const metadata = createPublicMetadata({
  title: guideTitle,
  description: guideDescription,
  path: "/guides/dog-food-portion",
});

const structuredData = createGuideStructuredData({
  title: guideTitle,
  description: guideDescription,
  path: "/guides/dog-food-portion",
  datePublished: "2026-09-14",
  dateModified: "2026-11-01",
});

const puppyStages = [
  {
    id: "puppy-before-weaning",
    age: "Πριν από τον απογαλακτισμό",
    title: "Δεν χρησιμοποιείς πίνακα ενήλικου σκύλου",
    text: "Ένα πολύ μικρό ή ορφανό κουτάβι χρειάζεται θηλασμό ή κατάλληλο εμπορικό υποκατάστατο γάλακτος και στενή κτηνιατρική παρακολούθηση. Μην μετατρέπεις μόνος σου τις ανάγκες νεογνού σε γραμμάρια ξηράς τροφής.",
  },
  {
    id: "puppy-weaning-six-months",
    age: "Απογαλακτισμός έως 6 μηνών",
    title: "Πλήρης τροφή ανάπτυξης σε κατανεμημένα γεύματα",
    text: "Χρησιμοποίησε πλήρη τροφή ανάπτυξης που ταιριάζει στο αναμενόμενο ενήλικο μέγεθος. Τρία γεύματα την ημέρα είναι συνήθης αφετηρία, ενώ πολύ μικρόσωμα κουτάβια μπορεί να χρειάζονται συχνότερα γεύματα με οδηγία κτηνιάτρου.",
  },
  {
    id: "puppy-six-twelve-months",
    age: "6-12 μηνών",
    title: "Δύο γεύματα και συνέχιση της ελεγχόμενης ανάπτυξης",
    text: "Δύο γεύματα την ημέρα είναι συνήθως πρακτική αφετηρία. Μικρόσωμες και μεσαίες φυλές μπορεί να πλησιάζουν τη σκελετική ωρίμανση μέσα σε αυτό το διάστημα, ενώ μεγαλόσωμες και γιγαντόσωμες φυλές συχνά αναπτύσσονται για περισσότερο.",
  },
  {
    id: "puppy-after-year",
    age: "Μετά τους 12 μήνες",
    title: "Η αλλαγή σε τροφή ενηλίκου εξαρτάται από την ωρίμανση",
    text: "Μην αλλάξεις τροφή μόνο επειδή συμπληρώθηκε ένας χρόνος. Η κατάλληλη στιγμή εξαρτάται από τη φυλή, το αναμενόμενο ενήλικο βάρος, τη σωματική κατάσταση και τις οδηγίες της τροφής ή του κτηνιάτρου.",
  },
] as const;

const puppySizeNotes = [
  {
    size: "Μικρόσωμο",
    note: "Μικρότερο στομάχι και πιθανή ανάγκη για συχνότερα γεύματα στην πρώιμη ανάπτυξη.",
  },
  {
    size: "Μεσαίο",
    note: "Η ποσότητα ανανεώνεται καθώς αλλάζουν γρήγορα βάρος και ηλικία, όχι με σταθερά γραμμάρια ανά κιλό.",
  },
  {
    size: "Μεγαλόσωμο",
    note: "Χρειάζεται τροφή ανάπτυξης κατάλληλη για μεγαλόσωμη φυλή και έλεγχο ενεργειακής πρόσληψης και μετάλλων.",
  },
  {
    size: "Γιγαντόσωμο",
    note: "Η ανάπτυξη διαρκεί περισσότερο και απαιτεί ιδιαίτερα προσεκτική παρακολούθηση βάρους και σωματικής κατάστασης.",
  },
] as const;

export default function DogFoodPortionGuide() {
  return (
    <main className="min-h-screen bg-[#fbfcfa] text-[#14221b]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PublicHeader />
      <article className="nt-container max-w-4xl py-10 sm:py-16">
        <Link href="/guides" className="nt-focus rounded text-sm font-bold text-[#17663f] hover:underline">
          Οδηγοί διατροφής
        </Link>
        <header className="mt-7 border-b border-[#dce5df] pb-9">
          <p className="nt-eyebrow">Μερίδα σκύλου</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Πόση τροφή χρειάζεται ο σκύλος ή το κουτάβι μου;
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42534a]">
            Δεν υπάρχει μία ποσότητα σε γραμμάρια για όλους τους σκύλους. Η
            σωστή αφετηρία εξαρτάται από την τροφή, την ηλικία, τη δραστηριότητα
            και τη σωματική κατάσταση του συγκεκριμένου ζώου.
          </p>
          <p className="mt-5 max-w-3xl border-l-4 border-[#1f7a4d] bg-[#f1f7f3] px-5 py-4 text-sm font-semibold leading-7 text-[#283a30]">
            Σύντομη απάντηση: ξεκίνα από τον ημερήσιο πίνακα της συγκεκριμένης
            πλήρους τροφής και ζύγισε την ποσότητα. Για κουτάβι, χρησιμοποίησε
            τον πίνακα ανάπτυξης για την ηλικία, το τωρινό βάρος και το
            αναμενόμενο ενήλικο μέγεθος, όχι τον πίνακα ενήλικου σκύλου.
          </p>
        </header>

        <div className="max-w-3xl space-y-10 py-10 text-base leading-8 text-[#42534a]">
          <section aria-labelledby="dog-label">
            <h2 id="dog-label" className="text-2xl font-black text-[#14221b]">
              1. Ξεκίνα από τη συγκεκριμένη συσκευασία
            </h2>
            <p className="mt-4">
              Έλεγξε ότι η τροφή αναγράφεται ως πλήρης για σκύλους και είναι
              κατάλληλη για το στάδιο ζωής του. Βρες τον πίνακα ημερήσιας
              σίτισης και, αν αναγράφεται, τις θερμίδες ανά 100 g ή ανά κιλό.
              Ο πίνακας δίνει μια αρχική εκτίμηση για έναν μέσο σκύλο, όχι
              προσωπική οδηγία. Διαφορετικές τροφές έχουν διαφορετική
              ενεργειακή πυκνότητα, οπότε τα ίδια γραμμάρια δεν σημαίνουν
              απαραίτητα τις ίδιες θερμίδες.
            </p>
          </section>

          <section aria-labelledby="puppy-portion">
            <h2 id="puppy-portion" className="text-2xl font-black text-[#14221b]">
              2. Πόση τροφή χρειάζεται ένα κουτάβι ανά ηλικία;
            </h2>
            <p className="mt-4">
              Δεν υπάρχει μία ασφαλής ποσότητα σε γραμμάρια ανά κιλό για όλα
              τα κουτάβια. Διάλεξε πλήρη τροφή ανάπτυξης κατάλληλη για το
              αναμενόμενο ενήλικο μέγεθος και βρες στη συσκευασία τη γραμμή
              που αντιστοιχεί στην ηλικία και στο τωρινό βάρος. Οι ανάγκες
              αλλάζουν γρήγορα όσο μεγαλώνει, γι&apos; αυτό ζύγιζε το κουτάβι
              τακτικά και ανανέωνε την αφετηρία του πίνακα.
            </p>
            <div className="mt-6 divide-y divide-[#dce5df] border-y border-[#dce5df]">
              {puppyStages.map((stage) => (
                <div key={stage.id} className="py-5" aria-labelledby={stage.id}>
                  <p className="text-sm font-extrabold text-[#17663f]">{stage.age}</p>
                  <h3 id={stage.id} className="mt-1 text-lg font-black text-[#14221b]">
                    {stage.title}
                  </h3>
                  <p className="mt-2">{stage.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="puppy-adult-size">
            <h2
              id="puppy-adult-size"
              className="text-2xl font-black text-[#14221b]"
            >
              3. Γιατί μετράει το αναμενόμενο ενήλικο βάρος;
            </h2>
            <p className="mt-4">
              Η FEDIAF δεν εκτιμά την ενέργεια ανάπτυξης μόνο από τα σημερινά
              κιλά. Για κουτάβια από περίπου 8 εβδομάδων έως 1 έτους λαμβάνει
              υπόψη το πραγματικό βάρος σε σχέση με το αναμενόμενο ώριμο βάρος.
              Γι&apos; αυτό δύο κουτάβια 8 kg μπορεί να χρειάζονται διαφορετική
              αφετηρία όταν το ένα αναμένεται να γίνει 12 kg και το άλλο 35 kg.
            </p>
            <div className="mt-6 border-y border-[#dce5df]">
              {puppySizeNotes.map((item) => (
                <div
                  key={item.size}
                  className="grid gap-1 border-b border-[#e7ede9] py-4 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:gap-5"
                >
                  <p className="font-black text-[#14221b]">{item.size}</p>
                  <p>{item.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-5">
              Για ασφαλή εκτίμηση χρειάζονται τουλάχιστον ηλικία, τωρινό
              βάρος, πιθανό ενήλικο βάρος, πορεία ανάπτυξης και οι kcal της
              συγκεκριμένης τροφής. Αν δεν γνωρίζεις το αναμενόμενο μέγεθος,
              ο κτηνίατρος μπορεί να δώσει πιο αξιόπιστη εκτίμηση από έναν
              γενικό πίνακα φυλής.
            </p>
          </section>

          <section aria-labelledby="puppy-minerals">
            <h2
              id="puppy-minerals"
              className="text-2xl font-black text-[#14221b]"
            >
              4. Ασβέστιο και φώσφορος σε μεγαλόσωμο κουτάβι
            </h2>
            <p className="mt-4">
              Η γρήγορη ανάπτυξη δεν είναι ο στόχος. Η υπερβολική ενεργειακή
              πρόσληψη μπορεί να επιταχύνει την ανάπτυξη και είναι ιδιαίτερα
              ανεπιθύμητη σε μεγαλόσωμες και γιγαντόσωμες φυλές. Προτίμησε
              πλήρη τροφή ανάπτυξης που δηλώνει ότι είναι κατάλληλη για το
              αναμενόμενο μέγεθος και ακολούθησε μετρημένη μερίδα.
            </p>
            <p className="mt-4">
              Μην προσθέτεις ασβέστιο, φώσφορο ή βιταμίνη D πάνω σε μια πλήρη
              τροφή ανάπτυξης χωρίς κτηνιατρική οδηγία. Η υπερβολή δεν
              διορθώνει την ανάπτυξη και μπορεί να διαταράξει την ισορροπία
              της δίαιτας.
            </p>
          </section>

          <section aria-labelledby="dog-math">
            <h2 id="dog-math" className="text-2xl font-black text-[#14221b]">
              5. Μετάτρεψε τις θερμίδες σε γραμμάρια
            </h2>
            <p className="mt-4">
              Αν έχεις ήδη έναν κατάλληλο ημερήσιο στόχο θερμίδων για τον σκύλο
              σου, υπολόγισε πόσες από αυτές θα προέρχονται από την κύρια
              τροφή. Οι λιχουδιές και άλλες τροφές μετράνε επίσης στο σύνολο.
            </p>
            <div className="mt-5 border-l-4 border-[#1f7a4d] bg-[#f1f7f3] px-5 py-4 text-[#14221b]">
              <p className="font-bold">
                Γραμμάρια κύριας τροφής = θερμίδες που της αναλογούν ÷
                (θερμίδες ανά 100 g ÷ 100)
              </p>
              <p className="mt-2 text-sm leading-6 text-[#42534a]">
                Παράδειγμα μόνο για την αριθμητική: τροφή με 400 kcal/100 g και
                κατανομή 200 kcal από αυτήν αντιστοιχεί σε 50 g. Οι 200 kcal
                δεν είναι προτεινόμενος ημερήσιος στόχος για κάποιον σκύλο.
              </p>
            </div>
            <p className="mt-4">
              Χρησιμοποίησε ζυγαριά κουζίνας αντί για «μια χούφτα». Αν δεν
              γνωρίζεις τις θερμίδες της τροφής ή της λιχουδιάς, έλεγξε τη
              συσκευασία ή ρώτησε τον κατασκευαστή.
            </p>
          </section>

          <section aria-labelledby="dog-follow-up">
            <h2 id="dog-follow-up" className="text-2xl font-black text-[#14221b]">
              6. Δες αν η αφετηρία λειτουργεί
            </h2>
            <p className="mt-4">
              Κατέγραψε τι τρώει συνολικά, συμπεριλαμβανομένων των λιχουδιών,
              και έλεγχε τουλάχιστον εβδομαδιαία βάρος και σωματική κατάσταση
              στην περίοδο γρήγορης ανάπτυξης. Η όρεξη, η δραστηριότητα και το
              βάρος μπορεί να αλλάξουν. Ο κτηνίατρος μπορεί να σε βοηθήσει να
              συγκρίνεις την πορεία με μια κατάλληλη καμπύλη ανάπτυξης και να
              αναπροσαρμόσεις με ασφάλεια τη μερίδα.
            </p>
          </section>

          <section aria-labelledby="puppy-transition">
            <h2
              id="puppy-transition"
              className="text-2xl font-black text-[#14221b]"
            >
              7. Άλλαξε τροφή σταδιακά
            </h2>
            <p className="mt-4">
              Αν αλλάζεις μάρκα, μορφή ή στάδιο ζωής, κάνε σταδιακή μετάβαση
              και κράτησε σταθερό το πρόγραμμα γευμάτων. Ο
              <Link
                href="/guides/changing-pet-food"
                className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline"
              >
                οδηγός αλλαγής τροφής
              </Link>
              {" "}δίνει ένα ενδεικτικό πλάνο για υγιή ζώα. Σε επίμονη
              διάρροια, επαναλαμβανόμενο εμετό, λήθαργο ή άρνηση τροφής,
              σταμάτησε τις δοκιμές και επικοινώνησε με κτηνίατρο.
            </p>
          </section>

          <section aria-labelledby="dog-vet">
            <h2 id="dog-vet" className="text-2xl font-black text-[#14221b]">
              Πότε δεν αρκεί ένας γενικός οδηγός;
            </h2>
            <p className="mt-4">
              Σε κουτάβια, κύηση ή θηλασμό, χρόνια νόσο, θεραπευτική δίαιτα,
              ανεξήγητη αλλαγή βάρους ή έντονη αλλαγή όρεξης χρειάζεται
              εξατομικευμένη κτηνιατρική εκτίμηση. Μην αλλάζεις κλινική δίαιτα
              ή μειώνεις απότομα την τροφή μόνο βάσει ενός υπολογισμού online.
            </p>
          </section>
        </div>

        <section aria-labelledby="dog-sources" className="max-w-3xl border-t border-[#dce5df] py-8 text-sm leading-7 text-[#52635a]">
          <h2 id="dog-sources" className="text-lg font-black text-[#14221b]">Πηγές και όρια</h2>
          <p className="mt-3">
            Ενημερωτικό περιεχόμενο για υγιή ζώα, όχι διάγνωση ή εξατομικευμένη
            διατροφική οδηγία. Οι αρχές για ανάπτυξη και ενεργειακές ανάγκες
            προέρχονται από τις
            <a className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline" href="https://europeanpetfood.org/self-regulation/nutritional-guidelines/">διατροφικές οδηγίες FEDIAF 2025</a>.
            {" "}Η μετατροπή θερμίδων σε ποσότητα, η χρήση της ετικέτας ως
            αφετηρίας και ο έλεγχος σωματικής κατάστασης τεκμηριώνονται στις
            <a className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline" href="https://wsava.org/wp-content/uploads/2020/01/Frequently-Asked-Questions-and-Myths.pdf">ερωτήσεις διατροφής της WSAVA</a>.
            {" "}Για τη συχνότητα γευμάτων, την παρακολούθηση ανάπτυξης και
            την αποφυγή άσκοπων συμπληρωμάτων, δες το
            <a className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline" href="https://www.merckvetmanual.com/management-and-nutrition/nutrition-small-animals/feeding-practices-in-small-animals">Merck Veterinary Manual</a>.
            {" "}Για νεογνά και υποκατάστατο γάλακτος, δες επίσης τις
            <a className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline" href="https://www.merckvetmanual.com/management-and-nutrition/management-of-the-neonate/management-of-the-neonate-in-dogs-and-cats">οδηγίες φροντίδας νεογνών</a>.
          </p>
        </section>

        <nav aria-label="Επόμενα βήματα" className="border-t border-[#dce5df] py-8">
          <h2 className="text-lg font-black">Επόμενα βήματα</h2>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href="/guides/choosing-dog-food" className="nt-focus rounded font-bold text-[#17663f] hover:underline">
              Πώς να επιλέξεις τροφή σκύλου
            </Link>
            <Link href="/guides/cat-food-portion" className="nt-focus rounded font-bold text-[#17663f] hover:underline">
              Οδηγός μερίδας γάτας
            </Link>
            <Link href="/guides/changing-pet-food" className="nt-focus rounded font-bold text-[#17663f] hover:underline">
              Αλλαγή τροφής βήμα βήμα
            </Link>
            <Link href="/account/food-compare" className="nt-focus rounded font-bold text-[#17663f] hover:underline">
              Σύγκρινε τροφές
            </Link>
            <Link href="/register?next=/account/chatbot" className="nt-button nt-button-primary nt-focus inline-flex gap-2 sm:ml-auto">
              Ρώτησε το chatbot <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </article>
      <PublicFooter />
    </main>
  );
}
