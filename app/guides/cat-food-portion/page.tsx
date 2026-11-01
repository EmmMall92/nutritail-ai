import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { createGuideStructuredData } from "@/lib/seo/guideStructuredData";
import { createPublicMetadata } from "@/lib/seo/metadata";

const guideTitle = "Πόση τροφή χρειάζεται η γάτα ή το γατάκι μου;";
const guideDescription =
  "Πρακτικός οδηγός για ποσότητα τροφής σε γατάκι 1-12 μηνών και ενήλικη ή στειρωμένη γάτα: γεύματα, θερμίδες, υγρή και ξηρά τροφή.";

export const metadata = createPublicMetadata({
  title: guideTitle,
  description: guideDescription,
  path: "/guides/cat-food-portion",
});

const structuredData = createGuideStructuredData({
  title: guideTitle,
  description: guideDescription,
  path: "/guides/cat-food-portion",
  datePublished: "2026-09-14",
  dateModified: "2026-11-01",
});

const kittenStages = [
  {
    id: "kitten-one-month",
    age: "Γατάκι 1 μήνα",
    title: "Θηλασμός και αρχή απογαλακτισμού",
    text: "Στις περίπου 4 εβδομάδες πολλά γατάκια θηλάζουν ακόμη και μόλις αρχίζουν να γνωρίζουν στερεή τροφή. Δεν τα υπολογίζουμε σαν μικρή ενήλικη γάτα με ξηρά τροφή. Αν το γατάκι είναι ορφανό, δεν θηλάζει ή δεν παίρνει βάρος, χρειάζεται άμεσα κτηνιατρικό πλάνο και κατάλληλο εμπορικό υποκατάστατο γάλακτος σύμφωνα με τις οδηγίες του προϊόντος.",
  },
  {
    id: "kitten-two-months",
    age: "Γατάκι 2 μηνών",
    title: "Πλήρης τροφή ανάπτυξης και μικρά γεύματα",
    text: "Γύρω στις 8 εβδομάδες το γατάκι συνήθως βρίσκεται στο τέλος του απογαλακτισμού. Ξεκίνα από τον πίνακα μιας πλήρους τροφής για γατάκια, χρησιμοποιώντας την ηλικία και το τωρινό βάρος. Η υγρή, η ξηρά ή ο συνδυασμός τους μπορούν να χρησιμοποιηθούν όταν είναι πλήρεις τροφές και μετριούνται μαζί.",
  },
  {
    id: "kitten-three-months",
    age: "Γατάκι 3 μηνών",
    title: "Τρία γεύματα μέσα στην ημερήσια ποσότητα",
    text: "Η ανάπτυξη παραμένει γρήγορη και τρία γεύματα την ημέρα είναι μια συνήθης πρακτική έως τους 6 μήνες. Μοίρασε τη συνολική ημερήσια ποσότητα του πίνακα στα γεύματα· μην δίνεις την αναγραφόμενη ημερήσια ποσότητα σε κάθε γεύμα.",
  },
  {
    id: "kitten-four-six-months",
    age: "Γατάκι 4-6 μηνών",
    title: "Συνεχής ανάπτυξη με τακτικό έλεγχο βάρους",
    text: "Συνέχισε με πλήρη τροφή ανάπτυξης και ανανέωνε την αφετηρία της ετικέτας όσο αλλάζει το βάρος. Έλεγχε ότι το γατάκι αναπτύσσεται σταθερά χωρίς να χάνει βάρος ή να αποκτά υπερβολικό λίπος.",
  },
  {
    id: "kitten-six-twelve-months",
    age: "Γατάκι 6-12 μηνών",
    title: "Συνήθως δύο γεύματα και σταδιακή ωρίμανση",
    text: "Από τους 6 έως τους 12 μήνες δύο γεύματα την ημέρα είναι συνήθως πρακτική αφετηρία. Η τροφή ανάπτυξης διατηρείται συνήθως μέχρι την ενηλικίωση, περίπου στους 9-12 μήνες, εκτός αν ο κτηνίατρος ή η ετικέτα της κατάλληλης τροφής ορίζει διαφορετικά.",
  },
] as const;

const kittenEnergyStages = [
  { age: "Έως 4 μηνών", relativeNeed: "2,0-2,5 × ενέργεια συντήρησης" },
  { age: "4-9 μηνών", relativeNeed: "1,75-2,0 × ενέργεια συντήρησης" },
  { age: "9-12 μηνών", relativeNeed: "1,5 × ενέργεια συντήρησης" },
] as const;

export default function CatFoodPortionGuide() {
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
          <p className="nt-eyebrow">Μερίδα γάτας</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Πόση τροφή χρειάζεται η γάτα ή το γατάκι μου;
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42534a]">
            Η μερίδα δεν καθορίζεται μόνο από τα κιλά. Η τροφή που επιλέγεις,
            η ηλικία, η στείρωση, η δραστηριότητα και η σωματική κατάσταση
            επηρεάζουν την αφετηρία. Αν δίνεις και υγρή και ξηρά τροφή, τις
            υπολογίζεις μαζί.
          </p>
          <p className="mt-5 max-w-3xl border-l-4 border-[#1f7a4d] bg-[#f1f7f3] px-5 py-4 text-sm font-semibold leading-7 text-[#283a30]">
            Σύντομη απάντηση: βρες την ημερήσια ποσότητα στη συσκευασία της
            συγκεκριμένης πλήρους τροφής με βάση την ηλικία και το τωρινό
            βάρος. Για γατάκι χρησιμοποίησε τροφή και πίνακα ανάπτυξης, ενώ
            για συνδυασμό υγρής και ξηράς μέτρησε τις θερμίδες μαζί.
          </p>
        </header>

        <div className="max-w-3xl space-y-10 py-10 text-base leading-8 text-[#42534a]">
          <section aria-labelledby="cat-label">
            <h2 id="cat-label" className="text-2xl font-black text-[#14221b]">
              1. Έλεγξε τι γράφει η τροφή
            </h2>
            <p className="mt-4">
              Αναζήτησε την ένδειξη «πλήρης τροφή για γάτες» και το κατάλληλο
              στάδιο ζωής. Μια «συμπληρωματική» υγρή τροφή ή λιχουδιά δεν
              προορίζεται μόνη της για πλήρη ημερήσια σίτιση. Διάβασε τις
              οδηγίες της συγκεκριμένης συσκευασίας και τις θερμίδες ανά
              φακελάκι, κονσέρβα ή 100 g, όπου διατίθενται. Να υπάρχει πάντα
              διαθέσιμο καθαρό νερό.
            </p>
          </section>

          <section aria-labelledby="kitten-portion">
            <h2 id="kitten-portion" className="text-2xl font-black text-[#14221b]">
              2. Πόση τροφή χρειάζεται ένα γατάκι ανά ηλικία;
            </h2>
            <p className="mt-4">
              Τα γατάκια χρειάζονται πλήρη τροφή ανάπτυξης και περισσότερη
              ενέργεια ανά κιλό από μια ενήλικη γάτα. Δεν υπάρχει όμως μία
              σωστή ποσότητα για κάθε γατάκι: ξεκίνα από τη γραμμή ηλικίας και
              βάρους της συγκεκριμένης συσκευασίας, ζύγισε τη συνολική
              ημερήσια ποσότητα και μοίρασέ τη στα γεύματα.
            </p>
            <div className="mt-6 divide-y divide-[#dce5df] border-y border-[#dce5df]">
              {kittenStages.map((stage) => (
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

          <section aria-labelledby="kitten-energy">
            <h2 id="kitten-energy" className="text-2xl font-black text-[#14221b]">
              3. Από τις ανάγκες ενέργειας στα γραμμάρια
            </h2>
            <p className="mt-4">
              Η ηλικία αλλάζει σημαντικά τις ανάγκες ανάπτυξης. Η FEDIAF
              εκφράζει τις μέσες ανάγκες των γατιών ως πολλαπλάσιο της
              ενέργειας συντήρησης μιας ενήλικης γάτας. Αυτό δείχνει γιατί δεν
              αρκεί ένας ενιαίος κανόνας «γραμμάρια ανά κιλό».
            </p>
            <div className="mt-6 border-y border-[#dce5df]">
              {kittenEnergyStages.map((stage) => (
                <div
                  key={stage.age}
                  className="grid gap-1 border-b border-[#e7ede9] py-4 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:gap-5"
                >
                  <p className="font-black text-[#14221b]">{stage.age}</p>
                  <p>{stage.relativeNeed}</p>
                </div>
              ))}
            </div>
            <p className="mt-5">
              Τα παραπάνω δεν είναι γραμμάρια και δεν πρέπει να εφαρμόζονται
              απευθείας πάνω σε ποσότητα ενήλικης τροφής. Ο κατάλληλος
              ημερήσιος στόχος εξαρτάται από το πραγματικό βάρος, την ηλικία,
              τη σωματική κατάσταση και την πορεία ανάπτυξης. Αφού οριστεί ο
              στόχος θερμίδων, η ποσότητα της συγκεκριμένης τροφής προκύπτει
              από την ενεργειακή της πυκνότητα.
            </p>
            <div className="mt-5 border-l-4 border-[#1f7a4d] bg-[#f1f7f3] px-5 py-4 text-[#14221b]">
              <p className="font-bold">
                Γραμμάρια τροφής/ημέρα = ημερήσιες kcal ÷
                (kcal ανά 100 g ÷ 100)
              </p>
              <p className="mt-2 text-sm leading-6 text-[#42534a]">
                Χρειάζονται και τα δύο δεδομένα: κατάλληλος στόχος θερμίδων
                ανάπτυξης και επιβεβαιωμένες kcal της επιλεγμένης τροφής. Αν
                λείπει ένα από τα δύο, δεν υπάρχει αξιόπιστη απάντηση σε
                γραμμάρια.
              </p>
            </div>
          </section>

          <section aria-labelledby="cat-mix">
            <h2 id="cat-mix" className="text-2xl font-black text-[#14221b]">
              4. Αν δίνεις υγρή και ξηρά, μέτρησε το σύνολο
            </h2>
            <p className="mt-4">
              Οι ποσότητες στους δύο πίνακες σίτισης συνήθως αφορούν την
              αντίστοιχη τροφή ως κύρια διατροφή. Μην προσθέτεις ολόκληρη την
              ημερήσια ποσότητα και από τις δύο. Για έναν κατάλληλο ημερήσιο
              στόχο θερμίδων, αφαίρεσε πρώτα όσα δίνει η υγρή τροφή και οι
              λιχουδιές· το υπόλοιπο μπορεί να προέλθει από την ξηρά.
            </p>
            <div className="mt-5 border-l-4 border-[#1f7a4d] bg-[#f1f7f3] px-5 py-4 text-[#14221b]">
              <p className="font-bold">
                Γραμμάρια ξηράς = θερμίδες που απομένουν για ξηρά ÷
                (θερμίδες ξηράς ανά 100 g ÷ 100)
              </p>
              <p className="mt-2 text-sm leading-6 text-[#42534a]">
                Παράδειγμα μόνο για την αριθμητική: αν ένα γεύμα υγρής δίνει
                80 kcal και απομένουν 120 kcal από ξηρά με 400 kcal/100 g,
                η ξηρά αντιστοιχεί σε 30 g. Το άθροισμα 200 kcal δεν είναι
                προτεινόμενος στόχος για κάποια συγκεκριμένη γάτα.
              </p>
            </div>
          </section>

          <section aria-labelledby="sterilised-cat-portion">
            <h2
              id="sterilised-cat-portion"
              className="text-2xl font-black text-[#14221b]"
            >
              5. Πόσο πρέπει να τρώει μια στειρωμένη γάτα;
            </h2>
            <p className="mt-4">
              Δεν υπάρχει σταθερή ποσότητα μόνο και μόνο επειδή η γάτα είναι
              στειρωμένη. Οι μέσες ανάγκες μιας στειρωμένης ή γάτας εσωτερικού
              χώρου είναι συχνά χαμηλότερες από μιας πολύ δραστήριας γάτας,
              αλλά η σωστή αφετηρία εξαρτάται από το ιδανικό βάρος, τη
              δραστηριότητα, τη σωματική κατάσταση και τις kcal της τροφής.
            </p>
            <p className="mt-4">
              Χρησιμοποίησε τον πίνακα της συγκεκριμένης πλήρους τροφής,
              μέτρησε και τις λιχουδιές και έλεγχε την τάση του βάρους. Μην
              κόβεις αυτόματα ένα σταθερό ποσοστό από τη μερίδα και μην
              θεωρείς ότι κάθε προϊόν με την ένδειξη «sterilised» έχει την
              ίδια ενεργειακή πυκνότητα.
            </p>
          </section>

          <section aria-labelledby="cat-follow-up">
            <h2 id="cat-follow-up" className="text-2xl font-black text-[#14221b]">
              6. Παρακολούθησε την πορεία
            </h2>
            <p className="mt-4">
              Ζύγιζε την τροφή και σημείωνε όλα τα γεύματα και τις λιχουδιές.
              Οι οδηγίες της ετικέτας είναι σημείο εκκίνησης. Η τακτική
              παρακολούθηση βάρους και σωματικής κατάστασης βοηθά να δεις αν
              χρειάζεται αλλαγή. Για αξιολόγηση της σωματικής κατάστασης και
              εξατομικευμένη προσαρμογή μίλησε με κτηνίατρο.
            </p>
          </section>

          <section aria-labelledby="cat-vet">
            <h2 id="cat-vet" className="text-2xl font-black text-[#14221b]">
              Πότε χρειάζεται κτηνίατρος;
            </h2>
            <p className="mt-4">
              Για γατάκια, κύηση ή θηλασμό, χρόνια νόσο, θεραπευτική δίαιτα,
              απότομη αλλαγή βάρους ή μειωμένη όρεξη ζήτησε κτηνιατρική
              καθοδήγηση. Ιδίως αν η γάτα σταματήσει να τρώει, επικοινώνησε
              έγκαιρα με κτηνίατρο αντί να προσπαθήσεις να λύσεις το θέμα με
              αλλαγή μερίδας.
            </p>
          </section>
        </div>

        <section aria-labelledby="cat-sources" className="max-w-3xl border-t border-[#dce5df] py-8 text-sm leading-7 text-[#52635a]">
          <h2 id="cat-sources" className="text-lg font-black text-[#14221b]">Πηγές και όρια</h2>
          <p className="mt-3">
            Ενημερωτικό περιεχόμενο για υγιή ζώα, όχι διάγνωση ή εξατομικευμένη
            διατροφική οδηγία. Τα στάδια ενεργειακών αναγκών και οι αρχές
            ανάπτυξης προέρχονται από τις
            <a className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline" href="https://europeanpetfood.org/self-regulation/nutritional-guidelines/">διατροφικές οδηγίες FEDIAF 2025</a>.
            {" "}Η μετατροπή θερμίδων σε ποσότητα και η χρήση της ετικέτας ως
            αφετηρίας τεκμηριώνονται στις
            <a className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline" href="https://wsava.org/wp-content/uploads/2020/01/Frequently-Asked-Questions-and-Myths.pdf">ερωτήσεις διατροφής της WSAVA</a>.
            {" "}Για νεογνά, υποκατάστατο γάλακτος και παρακολούθηση βάρους,
            δες το
            <a className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline" href="https://www.merckvetmanual.com/management-and-nutrition/management-of-the-neonate/management-of-the-neonate-in-dogs-and-cats">Merck Veterinary Manual</a>.
            {" "}Για τη συχνότητα γευμάτων στα γατάκια, δες το
            <a className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline" href="https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/how-often-should-you-feed-your-cat">Κέντρο Υγείας Γάτας του Cornell</a>.
          </p>
        </section>

        <nav aria-label="Επόμενα βήματα" className="border-t border-[#dce5df] py-8">
          <h2 className="text-lg font-black">Επόμενα βήματα</h2>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href="/guides/choosing-cat-food" className="nt-focus rounded font-bold text-[#17663f] hover:underline">
              Πώς να επιλέξεις τροφή γάτας
            </Link>
            <Link href="/guides/dog-food-portion" className="nt-focus rounded font-bold text-[#17663f] hover:underline">
              Οδηγός μερίδας σκύλου
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
