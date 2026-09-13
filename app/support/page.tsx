import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { brand } from "@/lib/brand";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicMetadata({
  title: `Υποστήριξη | ${brand.name}`,
  description:
    "Βρες βοήθεια για τον λογαριασμό, τις αναφορές κατοικιδίων, τα στοιχεία τροφών και τα αιτήματα προσωπικών δεδομένων στο Nutritail AI.",
  path: "/support",
});

const supportTopics = [
  {
    title: "Πρόσβαση στον λογαριασμό",
    detail:
      "Για προβλήματα σύνδεσης, ανάκτηση κωδικού ή όταν κάποιο όριο εμποδίζει μια πραγματική δοκιμή.",
    action: "Ανάφερε το email του λογαριασμού και τη σελίδα στην οποία βρισκόσουν.",
  },
  {
    title: "Διατροφική ανάλυση ή αναφορά",
    detail:
      "Όταν η πρόταση δεν είναι ξεκάθαρη, τα γραμμάρια ανά ημέρα δεν φαίνονται σωστά ή λείπει πληροφορία από αποθηκευμένη αναφορά.",
    action:
      "Στείλε το όνομα του κατοικιδίου, τον στόχο, την επιλεγμένη τροφή και το σημείο που χρειάζεται διευκρίνιση.",
  },
  {
    title: "Στοιχεία τροφής ή προϊόν που λείπει",
    detail:
      "Όταν μια τροφή λείπει, ο τίτλος της φόρμουλας φαίνεται λάθος ή τα διατροφικά στοιχεία είναι ελλιπή.",
    action:
      "Στείλε τη μάρκα, το ακριβές προϊόν, έναν σύνδεσμο ή φωτογραφία ετικέτας και το πεδίο που χρειάζεται έλεγχο.",
  },
  {
    title: "Απόρρητο ή αίτημα δεδομένων",
    detail:
      "Για διόρθωση στοιχείων, εξαγωγή ή διαγραφή δεδομένων λογαριασμού και προφίλ κατοικιδίου.",
    action:
      "Ανάφερε αν ζητάς διόρθωση, εξαγωγή, διαγραφή ή διευκρίνιση για την επεξεργασία δεδομένων.",
  },
] as const;

const responseFlow = [
  "Αρχικά ξεχωρίζουμε αν το θέμα αφορά πρόσβαση, διατροφικό αποτέλεσμα, στοιχεία τροφής, απόρρητο ή επείγον κτηνιατρικό κίνδυνο.",
  "Για θέμα πρότασης ελέγχουμε το αποθηκευμένο προφίλ, την επιλεγμένη τροφή, την αναφορά και το σχετικό σχόλιο.",
  "Για στοιχεία τροφών προτιμάμε επίσημες πηγές, φωτογραφίες ετικέτας ή αξιόπιστες σελίδες λιανικής πριν ενημερώσουμε τη βάση.",
  "Σε ιατρική ένδειξη το Nutritail σταματά την καθοδήγηση προϊόντος και παραπέμπει σε κτηνίατρο.",
] as const;

const emergencySignals = [
  "γάτα που δυσκολεύεται ή αδυνατεί να ουρήσει",
  "αίμα στα ούρα ή στα κόπρανα",
  "επαναλαμβανόμενος εμετός ή διάρροια",
  "άρνηση τροφής, κατάρρευση ή έντονος πόνος",
  "γνωστή νεφρική νόσος, παγκρεατίτιδα, διαβήτης ή σοβαρή αλλεργική αντίδραση",
] as const;

export default function SupportPage() {
  const mailto = `mailto:${brand.contactEmail}?subject=${encodeURIComponent(
    "Αίτημα υποστήριξης Nutritail"
  )}`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <PublicHeader />

      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20" data-testid="support-hero">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
          Υποστήριξη Nutritail
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
          Βοήθεια για λογαριασμό, αναφορές και στοιχεία τροφών.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
          Περιέγραψέ μας τι συνέβη και πρόσθεσε τα σχετικά στοιχεία του
          κατοικιδίου ή της τροφής. Έτσι μπορούμε να απαντήσουμε πιο γρήγορα και
          να διορθώσουμε το σωστό σημείο.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={mailto}
            className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
            data-testid="support-primary-email"
          >
            Στείλε email
          </a>
          <Link
            href="/login?next=/account/chatbot"
            className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold transition hover:bg-slate-100"
          >
            Άνοιξε τον βοηθό
          </Link>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white" data-testid="support-request-types">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Τι να συμπεριλάβεις
            </p>
            <h2 className="mt-2 text-3xl font-black">
              Το σωστό πλαίσιο οδηγεί σε πιο γρήγορη απάντηση.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {supportTopics.map((topic) => (
              <article
                key={topic.title}
                className="rounded-lg border border-slate-200 bg-slate-50 p-5"
                data-testid="support-request-type"
              >
                <h3 className="text-lg font-black">{topic.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">{topic.detail}</p>
                <p className="mt-4 rounded-lg bg-white p-3 text-sm font-semibold leading-6 text-slate-950">
                  {topic.action}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          data-testid="support-operating-flow"
        >
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
            Πώς χειριζόμαστε το αίτημα
          </p>
          <h2 className="mt-2 text-3xl font-black">
            Από την αναφορά μέχρι την απάντηση.
          </h2>
          <div className="mt-6 grid gap-3">
            {responseFlow.map((step, index) => (
              <div key={step} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-700">
                  <span className="font-black text-slate-950">{index + 1}. </span>
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside
          className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm"
          data-testid="support-vet-boundary"
        >
          <p className="text-sm font-bold uppercase tracking-wide text-red-700">
            Όριο κτηνιατρικής ασφάλειας
          </p>
          <h2 className="mt-2 text-2xl font-black text-red-950">
            Ορισμένες περιπτώσεις δεν πρέπει να περιμένουν απάντηση υποστήριξης.
          </h2>
          <p className="mt-4 text-sm leading-6 text-red-950">
            Το Nutritail οργανώνει διατροφικές πληροφορίες, αλλά δεν κάνει
            διάγνωση, δεν παρέχει θεραπεία και δεν αντικαθιστά την κτηνιατρική
            φροντίδα. Επικοινώνησε άμεσα με κτηνίατρο σε περίπτωση:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-red-950">
            {emergencySignals.map((signal) => (
              <li key={signal} className="rounded-lg bg-white px-3 py-2">
                {signal}
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="border-t border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-300">
              Εμπιστοσύνη και βελτίωση
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Κάθε χρήσιμο σχόλιο βελτιώνει την υπηρεσία.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Ελέγχουμε σχόλια για προτάσεις, τροφές που λείπουν, δυσνόητα
              σημεία αναφορών και προβλήματα πρόσβασης ώστε οι επόμενες εκδόσεις
              να γίνονται πιο καθαρές και αξιόπιστες.
            </p>
          </div>
          <Link
            href="/about"
            className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
          >
            Δες τη δέσμευσή μας
          </Link>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
