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

const customerSimpleFlow = [
  {
    title: "\u03a4\u03bf \u03b6\u03ce\u03bf \u03c0\u03c1\u03ce\u03c4\u03b1",
    text: "\u0397 \u03c0\u03c1\u03cc\u03c4\u03b1\u03c3\u03b7 \u03be\u03b5\u03ba\u03b9\u03bd\u03ac \u03b1\u03c0\u03cc \u03b5\u03af\u03b4\u03bf\u03c2, \u03ba\u03b9\u03bb\u03ac, \u03b7\u03bb\u03b9\u03ba\u03af\u03b1, \u03c3\u03c4\u03b5\u03af\u03c1\u03c9\u03c3\u03b7, \u03b4\u03c1\u03b1\u03c3\u03c4\u03b7\u03c1\u03b9\u03cc\u03c4\u03b7\u03c4\u03b1, \u03c3\u03c4\u03cc\u03c7\u03bf \u03ba\u03b1\u03b9 \u03c4\u03b9 \u03c4\u03bf\u03c5 \u03b1\u03c1\u03ad\u03c3\u03b5\u03b9 \u03ae \u03b1\u03c0\u03bf\u03c6\u03b5\u03cd\u03b3\u03b5\u03b9.",
  },
  {
    title: "\u0397 \u03b2\u03ac\u03c3\u03b7 \u03c4\u03c1\u03bf\u03c6\u03ce\u03bd \u03bc\u03b5\u03c4\u03ac",
    text: "\u039f\u03b9 \u03c4\u03c1\u03bf\u03c6\u03ad\u03c2 \u03ad\u03c1\u03c7\u03bf\u03bd\u03c4\u03b1\u03b9 \u03b1\u03c0\u03cc Food V2 \u03ba\u03b1\u03b9 \u03c4\u03b1 \u03c3\u03c4\u03bf\u03b9\u03c7\u03b5\u03af\u03b1 \u03c0\u03bf\u03c5 \u03ad\u03c7\u03bf\u03c5\u03bc\u03b5 \u03bc\u03b1\u03b6\u03ad\u03c8\u03b5\u03b9, \u03cc\u03c7\u03b9 \u03b1\u03c0\u03cc \u03c4\u03c5\u03c7\u03b1\u03af\u03b1 AI \u03bc\u03bd\u03ae\u03bc\u03b7.",
  },
  {
    title: "\u039f\u03b9 \u03ba\u03b1\u03bd\u03cc\u03bd\u03b5\u03c2 \u03ba\u03cc\u03b2\u03bf\u03c5\u03bd \u03bb\u03ac\u03b8\u03b7",
    text: "\u0391\u03bb\u03bb\u03b5\u03c1\u03b3\u03af\u03b5\u03c2, \u03bb\u03ac\u03b8\u03bf\u03c2 \u03b5\u03af\u03b4\u03bf\u03c2, \u03bb\u03ac\u03b8\u03bf\u03c2 \u03b7\u03bb\u03b9\u03ba\u03af\u03b1, \u03bb\u03ac\u03b8\u03bf\u03c2 \u03bc\u03ad\u03b3\u03b5\u03b8\u03bf\u03c2 \u03ae \u03b5\u03c0\u03b5\u03af\u03b3\u03bf\u03bd\u03c4\u03b1 \u03b8\u03ad\u03bc\u03b1\u03c4\u03b1 \u03ba\u03cc\u03b2\u03bf\u03bd\u03c4\u03b1\u03b9 \u03c0\u03c1\u03b9\u03bd \u03c6\u03c4\u03ac\u03c3\u03bf\u03c5\u03bd \u03c3\u03c4\u03bf\u03bd \u03c0\u03b5\u03bb\u03ac\u03c4\u03b7.",
  },
  {
    title: "\u03a4\u03bf AI \u03b3\u03c1\u03ac\u03c6\u03b5\u03b9 \u03ba\u03b1\u03b8\u03b1\u03c1\u03ac",
    text: "\u03a4\u03bf OpenAI \u03b2\u03bf\u03b7\u03b8\u03ac \u03bd\u03b1 \u03b5\u03be\u03b7\u03b3\u03b7\u03b8\u03b5\u03af \u03b7 \u03c0\u03c1\u03cc\u03c4\u03b1\u03c3\u03b7 \u03b1\u03c0\u03bb\u03ac: \u03c4\u03b9 \u03bd\u03b1 \u03b4\u03b9\u03b1\u03bb\u03ad\u03be\u03b5\u03b9\u03c2, \u03b3\u03b9\u03b1\u03c4\u03af, \u03c0\u03cc\u03c3\u03b1 \u03b3\u03c1\u03b1\u03bc\u03bc\u03ac\u03c1\u03b9\u03b1 \u03ba\u03b1\u03b9 \u03c0\u03bf\u03b9\u03bf \u03b5\u03af\u03bd\u03b1\u03b9 \u03c4\u03bf \u03b5\u03c0\u03cc\u03bc\u03b5\u03bd\u03bf \u03b2\u03ae\u03bc\u03b1.",
  },
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
    text: "Χρησιμοποιείται για να συμπληρώσει κενά ή να επιβεβαιώσει προϊόντα που κυκλοφορούν στην ελληνική αγορά. Αν συγκρούεται με επίσημη πηγή, χρειάζεται έλεγχο.",
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

const customerOutputSteps = [
  {
    title: "1. Καθαρή λίστα επιλογών",
    text: "Ο πελάτης βλέπει πρώτα λίγες δυνατές επιλογές, συνήθως premium και value, αντί για μεγάλη τεχνική λίστα.",
  },
  {
    title: "2. Γιατί προτάθηκε",
    text: "Κάθε τροφή συνοδεύεται από απλή εξήγηση: ηλικία, βάρος, δραστηριότητα, στείρωση, ευαισθησίες, γεύση και διαθέσιμα θρεπτικά στοιχεία.",
  },
  {
    title: "3. Επιλογή και γραμμάρια/ημέρα",
    text: "Αφού ο πελάτης διαλέξει τροφή, το NutriTail υπολογίζει μια πρώτη ποσότητα σε γραμμάρια/ημέρα με βάση τον θερμιδικό στόχο.",
  },
  {
    title: "4. Συνέχεια μετά την ανάλυση",
    text: "Η ανάλυση μπορεί να αποθηκευτεί, να γίνει αναφορά, να μπει σε timeline και να χρησιμοποιηθεί αργότερα για έλεγχο προόδου ή νέα πρόταση.",
  },
];

const commercialTrustRules = [
  {
    title: "Οι κανόνες προηγούνται",
    text: "Αν μια τροφή δεν ταιριάζει σε είδος, ηλικία, αλλεργία, μέγεθος ή σοβαρό στόχο υγείας, δεν πρέπει να προτείνεται επειδή είναι διαθέσιμη ή εμπορικά σημαντική.",
  },
  {
    title: "Οι συνεργασίες δεν κρύβουν τα όρια",
    text: "Featured ή προωθημένες επιλογές μπορούν να εμφανιστούν μόνο μέσα στα ασφαλή αποτελέσματα. Δεν αντικαθιστούν τα διατροφικά φίλτρα και δεν σβήνουν τις προειδοποιήσεις.",
  },
  {
    title: "Ο πελάτης χρειάζεται καθαρό λόγο",
    text: "Κάθε πρόταση πρέπει να εξηγεί απλά γιατί ταιριάζει: θερμίδες, λιπαρά, ίνες, life stage, προτίμηση γεύσης ή ευαισθησία.",
  },
];

const launchTrustChecklist = [
  {
    title: "Τι είναι έτοιμο για beta",
    text: "Η ροή login, chatbot, προτάσεις τροφών, επιλογή τροφής, γραμμάρια/ημέρα, αποθήκευση, report και timeline είναι διαθέσιμα για δοκιμή.",
  },
  {
    title: "Τι παραμένει υπό έλεγχο",
    text: "Η βάση τροφών, τα feedback από χρήστες και τα edge cases βελτιώνονται συνεχώς πριν από ευρύτερο λανσάρισμα.",
  },
  {
    title: "Πότε θέλει κτηνίατρο",
    text: "Σε ουρολογικό, νεφρικό, διαβήτη, παγκρεατίτιδα, αίμα, ανορεξία, έντονο εμετό ή διάρροια, η τροφή δεν αντικαθιστά κτηνιατρική οδηγία.",
  },
];

const betaUserProofChecklist = [
  "Ολοκλήρωσε μια πλήρη ανάλυση από login μέχρι προτεινόμενες τροφές.",
  "Διάλεξε μία τροφή και έλεγξε αν τα γραμμάρια/ημέρα βγάζουν νόημα.",
  "Αποθήκευσε την ανάλυση και άνοιξε το report του κατοικιδίου.",
  "Ξαναμπές μετά από 2-4 εβδομάδες για progress check με βάρος, γραμμάρια, λιχουδιές, κόπρανα και όρεξη.",
  "Άφησε feedback αν η πρόταση ήταν μπερδεμένη, αν λείπει τροφή ή αν το κατοικίδιο δεν δέχτηκε τη γεύση.",
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
        data-testid="public-customer-simple-flow"
      >
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
              {"\u039c\u03b5 \u03b1\u03c0\u03bb\u03ac \u03bb\u03cc\u03b3\u03b9\u03b1"}
            </p>
            <h2 className="mt-3 text-3xl font-black">
              {"\u03a0\u03ce\u03c2 \u03b2\u03b3\u03b1\u03af\u03bd\u03b5\u03b9 \u03bc\u03af\u03b1 \u03c0\u03c1\u03cc\u03c4\u03b1\u03c3\u03b7 \u03c4\u03c1\u03bf\u03c6\u03ae\u03c2"}
            </h2>
            <p className="mt-4 leading-8 text-gray-700">
              {"\u039f \u03c0\u03b5\u03bb\u03ac\u03c4\u03b7\u03c2 \u03b4\u03b5\u03bd \u03c7\u03c1\u03b5\u03b9\u03ac\u03b6\u03b5\u03c4\u03b1\u03b9 \u03bd\u03b1 \u03b4\u03b5\u03b9 \u03c4\u03bf \u03c4\u03b5\u03c7\u03bd\u03b9\u03ba\u03cc \u03c0\u03b1\u03c1\u03b1\u03c3\u03ba\u03ae\u03bd\u03b9\u03bf. \u03a7\u03c1\u03b5\u03b9\u03ac\u03b6\u03b5\u03c4\u03b1\u03b9 \u03bd\u03b1 \u03be\u03ad\u03c1\u03b5\u03b9 \u03cc\u03c4\u03b9 \u03b7 \u03c0\u03c1\u03cc\u03c4\u03b1\u03c3\u03b7 \u03b2\u03b1\u03c3\u03af\u03b6\u03b5\u03c4\u03b1\u03b9 \u03c3\u03c4\u03bf \u03b6\u03ce\u03bf, \u03c3\u03c4\u03b7 \u03b2\u03ac\u03c3\u03b7 \u03c4\u03c1\u03bf\u03c6\u03ce\u03bd, \u03c3\u03b5 \u03ba\u03b1\u03bd\u03cc\u03bd\u03b5\u03c2 \u03ba\u03b1\u03b9 \u03cc\u03c7\u03b9 \u03c3\u03b5 \u03c4\u03c5\u03c7\u03b1\u03af\u03b1 \u03b1\u03c0\u03ac\u03bd\u03c4\u03b7\u03c3\u03b7."}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {customerSimpleFlow.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-emerald-100 bg-[#f7f7f4] p-5"
                data-testid="public-customer-simple-flow-item"
              >
                <h3 className="text-lg font-black text-emerald-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-y border-black/10 bg-[#eef7f1]"
        data-testid="public-launch-trust-checklist"
      >
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
              Beta launch trust checklist
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Τι μπορείς να εμπιστευτείς σήμερα και πού κρατάμε όρια
            </h2>
            <p className="mt-4 leading-8 text-gray-700">
              Το NutriTail είναι σχεδιασμένο για καθαρή καθημερινή καθοδήγηση:
              λίγες πρακτικές επιλογές τροφής, ποσότητα για αρχή και επόμενο
              βήμα. Στη beta περίοδο κρατάμε ξεκάθαρα τι είναι έτοιμο, τι
              βελτιώνεται και πότε χρειάζεται κτηνίατρος.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {launchTrustChecklist.map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-emerald-200 bg-white p-5"
                data-testid="public-launch-trust-checklist-item"
              >
                <h3 className="text-lg font-black text-emerald-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  {item.text}
                </p>
              </article>
            ))}
          </div>

          <div
            className="mt-8 rounded-lg border border-emerald-200 bg-white p-5"
            data-testid="public-beta-user-proof-checklist"
          >
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                Beta user proof checklist
              </p>
              <h3 className="mt-2 text-2xl font-black text-emerald-950">
                Πώς βοηθά ένας beta χρήστης να ανεβάσουμε το πραγματικό readiness
              </h3>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                Το ποσοστό προόδου ανεβαίνει όταν αποδεικνύουμε ότι η ροή δουλεύει
                για πραγματικούς πελάτες, όχι μόνο επειδή περνάει ο κώδικας. Αυτά
                είναι τα βήματα που θέλουμε να βλέπουμε σε κάθε beta δοκιμή.
              </p>
            </div>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-gray-700 md:grid-cols-2">
              {betaUserProofChecklist.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-emerald-100 bg-emerald-50/60 p-3"
                  data-testid="public-beta-user-proof-checklist-item"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
            <Link
              href="/register"
              className="rounded-lg bg-black px-4 py-2 text-white transition hover:bg-gray-800"
            >
              Ξεκίνα ανάλυση
            </Link>
            <Link
              href="/privacy"
              className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-emerald-950 transition hover:bg-emerald-50"
            >
              Δες απόρρητο
            </Link>
            <Link
              href="/terms"
              className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-emerald-950 transition hover:bg-emerald-50"
            >
              Δες όρους beta
            </Link>
          </div>
        </div>
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
        data-testid="public-ai-boundaries"
      >
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Όρια τεχνητής νοημοσύνης
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Το OpenAI βοηθά στη συζήτηση, όχι στην αυθαίρετη επιλογή τροφής.
            </h2>
            <p className="mt-4 leading-8 text-gray-700">
              Το NutriTail κρατά τη βάση δεδομένων, τους κανόνες αποκλεισμού και
              την τελική κατάταξη. Το AI βοηθά να καταλάβει καλύτερα το μήνυμα
              του πελάτη και να γράψει την απάντηση πιο φυσικά.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-xl border border-emerald-200 bg-white p-5">
              <h3 className="font-black text-emerald-950">Τι επιτρέπεται</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-gray-700">
                <li>Να εξηγεί απλά γιατί μια τροφή ταιριάζει.</li>
                <li>Να ρωτά μόνο τα στοιχεία που λείπουν.</li>
                <li>Να μετατρέπει κανόνες και δεδομένα σε ανθρώπινη απάντηση.</li>
              </ul>
            </article>
            <article className="rounded-xl border border-amber-200 bg-white p-5">
              <h3 className="font-black text-amber-950">Τι δεν επιτρέπεται</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-gray-700">
                <li>Δεν επιτρέπεται να εφευρίσκει τροφές ή θρεπτικές τιμές.</li>
                <li>Δεν επιτρέπεται να αγνοεί αλλεργίες, είδος ή ηλικία.</li>
                <li>Δεν επιτρέπεται να κάνει διάγνωση ή θεραπευτικές υποσχέσεις.</li>
              </ul>
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

      <section
        className="border-b border-black/10 bg-[#fff8ea]"
        data-testid="public-commercial-trust-guard"
      >
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-amber-700">
              Εμπορική διαφάνεια
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Η πρόταση δεν πρέπει να αγοράζεται από το brand.
            </h2>
            <p className="mt-4 leading-8 text-gray-700">
              Το NutriTail μπορεί στο μέλλον να έχει πλάνα, συνεργασίες ή
              προβεβλημένες επιλογές. Αυτά δεν πρέπει να παρακάμπτουν τους
              κανόνες καταλληλότητας: αλλεργίες, είδος, ηλικία, μέγεθος,
              θερμίδες, στόχο βάρους και ιατρικά όρια μπαίνουν πρώτα.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {commercialTrustRules.map((rule) => (
              <article
                key={rule.title}
                className="rounded-xl border border-amber-200 bg-white p-5"
                data-testid="public-commercial-trust-rule"
              >
                <h3 className="font-black text-amber-950">{rule.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  {rule.text}
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

      <section
        className="border-b border-black/10 bg-white"
        data-testid="public-customer-output-model"
      >
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Τι βλέπει τελικά ο πελάτης
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Η πρόταση πρέπει να είναι χρήσιμη στο σπίτι, όχι μόνο σωστή στον κώδικα.
            </h2>
            <p className="mt-4 leading-8 text-gray-700">
              Το NutriTail μετατρέπει τη διατροφική αξιολόγηση σε μια απλή ροή:
              λίγες καθαρές επιλογές τροφής, λόγος πρότασης, ποσότητα για αρχή,
              αποθήκευση και επόμενος έλεγχος. Έτσι ο πελάτης μπορεί να θυμάται
              τι πρέπει να κάνει και να επιστρέφει όταν αλλάξει βάρος, γεύση ή αποτέλεσμα.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            {customerOutputSteps.map((step) => (
              <article
                key={step.title}
                className="rounded-xl border border-black/10 bg-[#f7f7f4] p-5"
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
              για μελλοντικό έλεγχο προόδου.
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
