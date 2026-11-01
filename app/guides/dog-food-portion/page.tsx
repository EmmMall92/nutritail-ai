import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { createGuideStructuredData } from "@/lib/seo/guideStructuredData";
import { createPublicMetadata } from "@/lib/seo/metadata";

const guideTitle = "Πόση τροφή χρειάζεται ο σκύλος ή το κουτάβι μου;";
const guideDescription =
  "Πρακτικός οδηγός για την ημερήσια ποσότητα τροφής για σκύλο ή κουτάβι: ετικέτα, θερμίδες, γραμμάρια, λιχουδιές και έλεγχος βάρους.";

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
              2. Πόση τροφή χρειάζεται ένα κουτάβι;
            </h2>
            <p className="mt-4">
              Δεν υπάρχει μία ασφαλής ποσότητα σε γραμμάρια ανά κιλό για όλα
              τα κουτάβια. Διάλεξε πλήρη τροφή ανάπτυξης κατάλληλη για το
              αναμενόμενο ενήλικο μέγεθος και βρες στη συσκευασία τη γραμμή
              που αντιστοιχεί στην ηλικία και στο τωρινό βάρος. Οι ανάγκες
              αλλάζουν γρήγορα όσο μεγαλώνει, γι&apos; αυτό ζύγιζε το κουτάβι
              τακτικά και ανανέωνε την αφετηρία του πίνακα.
            </p>
            <p className="mt-4">
              Η FEDIAF χρησιμοποιεί την ηλικία, το πραγματικό βάρος και το
              αναμενόμενο βάρος ενηλικίωσης στις εκτιμήσεις ανάπτυξης. Ειδικά
              στα μεγαλόσωμα κουτάβια, απόφυγε την ελεύθερη πρόσβαση σε τροφή:
              η ελεγχόμενη μερίδα και η παρακολούθηση της σωματικής κατάστασης
              βοηθούν να αποφεύγεται υπερβολικά γρήγορη ανάπτυξη.
            </p>
          </section>

          <section aria-labelledby="dog-math">
            <h2 id="dog-math" className="text-2xl font-black text-[#14221b]">
              3. Μετάτρεψε τις θερμίδες σε γραμμάρια
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
              4. Δες αν η αφετηρία λειτουργεί
            </h2>
            <p className="mt-4">
              Κατέγραψε τι τρώει συνολικά, συμπεριλαμβανομένων των λιχουδιών,
              και έλεγχε τακτικά βάρος και σωματική κατάσταση. Η όρεξη, η
              δραστηριότητα και το βάρος μπορεί να αλλάξουν. Ο κτηνίατρος
              μπορεί να σε βοηθήσει να εκτιμήσεις τη σωματική κατάσταση και
              να αναπροσαρμόσεις με ασφάλεια τη μερίδα.
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
