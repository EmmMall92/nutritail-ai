import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicMetadata({
  title: "Πόση τροφή χρειάζεται η γάτα μου;",
  description:
    "Πρακτικός οδηγός για τη μερίδα της γάτας: πλήρης τροφή, συνδυασμός υγρής και ξηράς, θερμίδες και έλεγχος βάρους χωρίς γενικές συνταγές.",
  path: "/guides/cat-food-portion",
});

export default function CatFoodPortionGuide() {
  return (
    <main className="min-h-screen bg-[#fbfcfa] text-[#14221b]">
      <PublicHeader />
      <article className="nt-container max-w-4xl py-10 sm:py-16">
        <Link href="/guides" className="nt-focus rounded text-sm font-bold text-[#17663f] hover:underline">
          Οδηγοί διατροφής
        </Link>
        <header className="mt-7 border-b border-[#dce5df] pb-9">
          <p className="nt-eyebrow">Μερίδα γάτας</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Πόση τροφή χρειάζεται η γάτα μου;
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42534a]">
            Η μερίδα δεν καθορίζεται μόνο από τα κιλά. Η τροφή που επιλέγεις,
            η ηλικία, η στείρωση, η δραστηριότητα και η σωματική κατάσταση
            επηρεάζουν την αφετηρία. Αν δίνεις και υγρή και ξηρά τροφή, τις
            υπολογίζεις μαζί.
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

          <section aria-labelledby="cat-mix">
            <h2 id="cat-mix" className="text-2xl font-black text-[#14221b]">
              2. Αν δίνεις υγρή και ξηρά, μέτρησε το σύνολο
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

          <section aria-labelledby="cat-follow-up">
            <h2 id="cat-follow-up" className="text-2xl font-black text-[#14221b]">
              3. Παρακολούθησε την πορεία
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
            διατροφική οδηγία. Δες τη FEDIAF για τη διάκριση
            <a className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline" href="https://europeanpetfood.org/pet-food-facts/fact-sheets/nutrition/nutritional-needs-of-cats-and-dogs/">πλήρους και συμπληρωματικής τροφής</a>
            {" "}και τη WSAVA για την
            <a className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline" href="https://wsava.org/Global-Guidelines/Global-Nutrition-Guidelines/">αξιολόγηση διατροφής και σωματικής κατάστασης</a>.
            {" "}Για την απώλεια όρεξης, δες το
            <a className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline" href="https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/anorexia">Κέντρο Υγείας Γάτας του Cornell</a>.
          </p>
        </section>

        <nav aria-label="Σχετικοί σύνδεσμοι" className="flex flex-col gap-4 border-t border-[#dce5df] py-8 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/guides/dog-food-portion" className="nt-focus rounded font-bold text-[#17663f] hover:underline">
            Δες και τον οδηγό για σκύλους
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
