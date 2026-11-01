import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { getRequestLocale } from "@/lib/i18n/server";
import { translatePublicText, translatePublicTree } from "@/lib/i18n/translatePublicTree";
import { createGuideStructuredData } from "@/lib/seo/guideStructuredData";
import { createPublicMetadata } from "@/lib/seo/metadata";

const guideTitle = "Πώς αλλάζω τροφή στον σκύλο ή στη γάτα;";
const guideDescription =
  "Πρακτικός οδηγός για σταδιακή αλλαγή τροφής σε σκύλο ή γάτα: ενδεικτικό πλάνο 7 ημερών, παρακολούθηση και περιπτώσεις που χρειάζονται κτηνίατρο.";

export async function generateMetadata() {
  const locale = await getRequestLocale();

  return createPublicMetadata({
    title: translatePublicText(guideTitle, locale),
    description: translatePublicText(guideDescription, locale),
    path: "/guides/changing-pet-food",
    locale,
  });
}

const transitionSteps = [
  {
    period: "Ημέρες 1-2",
    currentFood: "75%",
    newFood: "25%",
  },
  {
    period: "Ημέρες 3-4",
    currentFood: "50%",
    newFood: "50%",
  },
  {
    period: "Ημέρες 5-6",
    currentFood: "25%",
    newFood: "75%",
  },
  {
    period: "Από την ημέρα 7",
    currentFood: "0%",
    newFood: "100%",
  },
];

export default async function ChangingPetFoodGuide() {
  const locale = await getRequestLocale();
  const structuredData = createGuideStructuredData({
    title: translatePublicText(guideTitle, locale),
    description: translatePublicText(guideDescription, locale),
    path: "/guides/changing-pet-food",
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
          <p className="nt-eyebrow">Αλλαγή τροφής</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Πώς αλλάζω τροφή στον σκύλο ή στη γάτα;
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#42534a]">
            Η μετάβαση σε νέα τροφή δεν χρειάζεται να γίνει απότομα. Ένα
            σταδιακό πλάνο βοηθά να παρακολουθείς την αποδοχή της τροφής, την
            όρεξη και το πεπτικό του ζώου χωρίς να αλλάζουν όλα μαζί.
          </p>
          <p className="mt-5 max-w-3xl border-l-4 border-[#1f7a4d] bg-[#f1f7f3] px-5 py-4 text-sm font-semibold leading-7 text-[#283a30]">
            Σύντομη απάντηση: για έναν υγιή σκύλο ή μια υγιή γάτα, ξεκίνα με
            μικρό ποσοστό της νέας τροφής και αύξησέ το σταδιακά για περίπου
            μία εβδομάδα. Προχώρα μόνο όσο η όρεξη και οι κενώσεις παραμένουν
            φυσιολογικές. Μια γάτα μπορεί να χρειαστεί περισσότερο χρόνο και
            συχνά δέχεται καλύτερα τη νέα τροφή σε ξεχωριστό μπολ.
          </p>
        </header>

        <div className="max-w-3xl space-y-10 py-10 text-base leading-8 text-[#42534a]">
          <section aria-labelledby="before-transition">
            <h2
              id="before-transition"
              className="text-2xl font-black text-[#14221b]"
            >
              1. Προετοίμασε τη σωστή αφετηρία
            </h2>
            <p className="mt-4">
              Πριν ανοίξεις τη νέα συσκευασία, έλεγξε ότι η τροφή είναι πλήρης
              και κατάλληλη για το είδος και το στάδιο ζωής του ζώου. Σημείωσε
              την ημερήσια ποσότητα της παλιάς και της νέας τροφής από τις
              αντίστοιχες ετικέτες, επειδή μπορεί να έχουν διαφορετικές
              θερμίδες ανά γραμμάριο.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Κράτησε σταθερές τις ώρες και τον αριθμό των γευμάτων.</li>
              <li>
                Μην προσθέσεις ταυτόχρονα νέες λιχουδιές ή συμπληρώματα, ώστε
                να ξέρεις τι άλλαξε αν εμφανιστεί ενόχληση.
              </li>
              <li>
                Ζύγισε τις ποσότητες αντί να βασιστείς στο μέγεθος του μπολ ή
                σε μια χούφτα.
              </li>
            </ul>
          </section>

          <section aria-labelledby="transition-plan">
            <h2
              id="transition-plan"
              className="text-2xl font-black text-[#14221b]"
            >
              2. Ένα ενδεικτικό πλάνο 7 ημερών
            </h2>
            <p className="mt-4">
              Το παρακάτω είναι πρακτική αφετηρία για υγιές ζώο, όχι
              υποχρεωτική προθεσμία. Αν η νέα αναλογία δεν γίνεται καλά
              ανεκτή, μην αυξήσεις άλλο το ποσοστό πριν μιλήσεις με τον
              κτηνίατρο. Ορισμένες γάτες χρειάζονται πολύ πιο αργή γνωριμία.
            </p>

            <div className="mt-6 border-y border-[#dce5df]">
              <div className="hidden grid-cols-[10rem_1fr_1fr] gap-4 border-b border-[#dce5df] py-3 text-xs font-extrabold uppercase text-[#52635a] sm:grid">
                <span>Περίοδος</span>
                <span>Τωρινή τροφή</span>
                <span>Νέα τροφή</span>
              </div>
              {transitionSteps.map((step) => (
                <div
                  key={step.period}
                  className="grid gap-3 border-b border-[#e7ede9] py-5 last:border-b-0 sm:grid-cols-[10rem_1fr_1fr] sm:items-center sm:gap-4"
                >
                  <p className="font-black text-[#14221b]">{step.period}</p>
                  <p>
                    <span className="mr-2 text-sm font-bold text-[#52635a] sm:hidden">
                      Τωρινή:
                    </span>
                    {step.currentFood}
                  </p>
                  <p>
                    <span className="mr-2 text-sm font-bold text-[#52635a] sm:hidden">
                      Νέα:
                    </span>
                    {step.newFood}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-5 text-sm leading-7">
              Τα ποσοστά αφορούν το μερίδιο κάθε τροφής στη σχεδιασμένη
              ημερήσια πρόσληψη, όχι απαραίτητα ίσα γραμμάρια. Αν οι δύο τροφές
              έχουν διαφορετική ενεργειακή πυκνότητα, χρησιμοποίησε τη σωστή
              ποσότητα για καθεμία. Δες τους οδηγούς μερίδας για
              <Link
                href="/guides/dog-food-portion"
                className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline"
              >
                σκύλο
              </Link>
              {" "}και
              <Link
                href="/guides/cat-food-portion"
                className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline"
              >
                γάτα
              </Link>
              .
            </p>
          </section>

          <section aria-labelledby="dog-transition">
            <h2
              id="dog-transition"
              className="text-2xl font-black text-[#14221b]"
            >
              3. Τι αλλάζει στον σκύλο;
            </h2>
            <p className="mt-4">
              Στους περισσότερους υγιείς σκύλους, η παλιά και η νέα τροφή
              μπορούν να μπουν στο ίδιο μπολ στις αντίστοιχες αναλογίες.
              Κράτησε σταθερό το πρόγραμμα γευμάτων και παρατήρησε όρεξη,
              κενώσεις, εμετό και επίπεδο ενέργειας πριν περάσεις στο επόμενο
              στάδιο.
            </p>
          </section>

          <section aria-labelledby="cat-transition">
            <h2
              id="cat-transition"
              className="text-2xl font-black text-[#14221b]"
            >
              4. Τι αλλάζει στη γάτα;
            </h2>
            <p className="mt-4">
              Πολλές γάτες απορρίπτουν ένα γεύμα όταν η νέα τροφή αναμειχθεί
              με τη γνώριμη. Πρόσφερε μικρή ποσότητα της νέας τροφής σε
              ξεχωριστό καθαρό μπολ, δίπλα στη συνηθισμένη, και άφησε τη γάτα
              να εξοικειωθεί με τη μυρωδιά και την υφή χωρίς πίεση.
            </p>
            <p className="mt-4">
              Μην αφήνεις μια γάτα νηστική για να την αναγκάσεις να δεχτεί τη
              νέα τροφή. Αν δεν τρώει επαρκώς, χάνει βάρος ή εμφανίζει
              αδιαθεσία, χρειάζεται έγκαιρη κτηνιατρική εκτίμηση.
            </p>
          </section>

          <section aria-labelledby="transition-monitoring">
            <h2
              id="transition-monitoring"
              className="text-2xl font-black text-[#14221b]"
            >
              5. Τι παρακολουθείς κάθε μέρα;
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Πόση τροφή καταναλώθηκε πραγματικά.</li>
              <li>Συχνότητα και σύσταση των κενώσεων.</li>
              <li>Εμετό, έντονα αέρια ή κοιλιακή ενόχληση.</li>
              <li>Ενέργεια, συμπεριφορά και μεταβολή βάρους.</li>
            </ul>
            <p className="mt-4">
              Επικοινώνησε με κτηνίατρο αν υπάρχει επαναλαμβανόμενος εμετός,
              επίμονη ή έντονη διάρροια, αίμα, λήθαργος, πόνος, άρνηση τροφής
              ή απώλεια βάρους. Μην προσπαθήσεις να καλύψεις τα συμπτώματα με
              διαδοχικές αλλαγές τροφής.
            </p>
          </section>

          <section aria-labelledby="vet-transition">
            <h2
              id="vet-transition"
              className="text-2xl font-black text-[#14221b]"
            >
              Πότε δεν χρησιμοποιείς ένα γενικό πλάνο;
            </h2>
            <p className="mt-4">
              Για θεραπευτική δίαιτα, γνωστή νόσο, υποψία αλλεργίας,
              ανάρρωση, εγκυμοσύνη ή θηλασμό, καθώς και για ζώο που έχει ήδη
              γαστρεντερικά συμπτώματα, η αλλαγή πρέπει να ακολουθεί το πλάνο
              του κτηνιάτρου. Τα κουτάβια και τα γατάκια χρειάζονται επίσης
              τροφή κατάλληλη για ανάπτυξη και στενότερη παρακολούθηση της
              πρόσληψης και του βάρους.
            </p>
          </section>

          <section aria-labelledby="transition-faq">
            <h2
              id="transition-faq"
              className="text-2xl font-black text-[#14221b]"
            >
              Συχνές ερωτήσεις
            </h2>
            <h3 className="mt-5 text-lg font-black text-[#14221b]">
              Μπορώ να αλλάξω από ξηρά σε υγρή τροφή;
            </h3>
            <p className="mt-2">
              Ναι, αρκεί η νέα τροφή να είναι πλήρης και κατάλληλη για το ζώο.
              Κάνε σταδιακή μετάβαση και υπολόγισε τη μερίδα από τις θερμίδες
              της νέας τροφής, όχι με αντικατάσταση γραμμαρίων ένα προς ένα.
            </p>
            <h3 className="mt-5 text-lg font-black text-[#14221b]">
              Πρέπει να αλλάζω συχνά μάρκα ή γεύση;
            </h3>
            <p className="mt-2">
              Όχι απαραίτητα. Αν μια πλήρης τροφή ταιριάζει στο στάδιο ζωής και
              το ζώο διατηρεί υγιές βάρος, καλή όρεξη και φυσιολογικές
              κενώσεις, οι συχνές αλλαγές δεν προσφέρουν από μόνες τους κάποιο
              όφελος.
            </p>
          </section>
        </div>

        <section
          aria-labelledby="transition-sources"
          className="max-w-3xl border-t border-[#dce5df] py-8 text-sm leading-7 text-[#52635a]"
        >
          <h2
            id="transition-sources"
            className="text-lg font-black text-[#14221b]"
          >
            Πηγές και όρια
          </h2>
          <p className="mt-3">
            Ενημερωτικό περιεχόμενο για γενική μετάβαση τροφής σε υγιή ζώα,
            όχι διάγνωση ή εξατομικευμένο θεραπευτικό πλάνο. Η σταδιακή αλλαγή
            και η διαφορετική προσέγγιση για τις γάτες τεκμηριώνονται στις
            <a
              className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline"
              href="https://wsava.org/wp-content/uploads/2020/01/Frequently-Asked-Questions-and-Myths.pdf"
            >
              ερωτήσεις διατροφής της WSAVA
            </a>
            {" "}και στις
            <a
              className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline"
              href="https://www.aaha.org/resources/2021-aaha-nutrition-and-weight-management-guidelines/feeding-plans-for-healthy-appropriate-weight-cats-and-dogs/"
            >
              οδηγίες διατροφής της AAHA
            </a>
            . Η ανάγκη έγκαιρης αξιολόγησης όταν μια γάτα δεν τρώει
            περιγράφεται από το
            <a
              className="nt-focus ml-1 rounded font-semibold text-[#17663f] underline"
              href="https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/feeding-your-cat"
            >
              Cornell Feline Health Center
            </a>
            .
          </p>
        </section>

        <nav
          aria-label="Επόμενα βήματα"
          className="border-t border-[#dce5df] py-8"
        >
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
