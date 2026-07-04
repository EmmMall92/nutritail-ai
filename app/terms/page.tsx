import type { Metadata } from "next";
import Link from "next/link";
import { betaAccessPlanConfig } from "@/lib/beta/accessPlan";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Όροι χρήσης | ${brand.name}`,
  description:
    "Διάβασε τους όρους χρήσης του Nutritail AI για ενημερωτική διατροφική καθοδήγηση κατοικιδίων.",
  alternates: {
    canonical: "/terms",
  },
};

const sections = [
  {
    title: "Beta πρόσβαση και πλάνα",
    items: [
      "Η beta πρόσβαση δεν ενεργοποιεί πληρωμή, δεν ζητά στοιχεία κάρτας και δεν ξεκινά συνδρομή.",
      `Στην τρέχουσα beta περίοδο το πλάνο είναι ${betaAccessPlanConfig.accessPlan}, με ${betaAccessPlanConfig.accountLimit} λογαριασμό, έως ${betaAccessPlanConfig.petLimit} κατοικίδια και έως ${betaAccessPlanConfig.monthlyAnalysisLimit} αναλύσεις τον μήνα.`,
      "Τα beta όρια είναι προσωρινά και ήπια για δοκιμή προϊόντος, ποιότητα υποστήριξης και σταδιακό άνοιγμα σε περισσότερους χρήστες.",
      "Αν αργότερα ανοίξουν πληρωμένα πλάνα ή συνδρομές, θα παρουσιαστούν ξεκάθαρα πριν ζητηθεί πληρωμή ή ενεργοποιηθεί οποιοδήποτε εμπορικό πλάνο.",
    ],
  },
  {
    title: "Μόνο ενημερωτική καθοδήγηση",
    items: [
      "Το Nutritail AI παρέχει ενημερωτική διατροφική καθοδήγηση, εκτιμήσεις και πληροφορίες τροφών.",
      "Η υπηρεσία δεν παρέχει κτηνιατρική διάγνωση, θεραπεία, οδηγίες έκτακτης ανάγκης ή ιατρική φροντίδα.",
      "Για ιατρικές ανησυχίες, διαχείριση νόσου, κτηνιατρικές δίαιτες, απότομη αλλαγή βάρους, ανορεξία ή επείγοντα συμπτώματα, συμβουλεύσου πάντα κτηνίατρο.",
    ],
  },
  {
    title: "Οι ευθύνες σου",
    items: [
      "Δώσε όσο γίνεται ακριβή στοιχεία για κατοικίδιο, υγεία, δραστηριότητα και τροφή ώστε η καθοδήγηση να είναι πιο χρήσιμη.",
      "Χρησιμοποίησε την υπηρεσία ως εργαλείο ενημέρωσης και οργάνωσης, όχι ως τη μοναδική βάση για αποφάσεις υγείας.",
      "Κράτησε ασφαλή τα στοιχεία σύνδεσής σου και ενημέρωσέ μας αν πιστεύεις ότι ο λογαριασμός σου προσπελάστηκε χωρίς άδεια.",
    ],
  },
  {
    title: "Δεδομένα τροφών και προτάσεις",
    items: [
      "Οι πληροφορίες τροφών μπορεί να προέρχονται από ετικέτες προϊόντων, δημόσιες πηγές, υλικό εταιρειών, διαχειριστικό έλεγχο ή στοιχεία που παρέχει ο χρήστης.",
      "Τα διατροφικά δεδομένα μπορεί να διαφέρουν ανά χώρα, συνταγή, συσκευασία, αλλαγή φόρμουλας ή μορφή σερβιρίσματος.",
      "Οι προτάσεις και οι εκτιμήσεις τροφών μπορεί να αλλάζουν όσο βελτιώνονται η βάση δεδομένων και οι κανόνες αξιολόγησης.",
    ],
  },
  {
    title: "Αποδεκτή χρήση",
    items: [
      "Μην κάνεις κακή χρήση της υπηρεσίας, μην επιχειρείς μη εξουσιοδοτημένη πρόσβαση και μην παρεμβαίνεις στη σωστή λειτουργία της.",
      "Μην ανεβάζεις ή υποβάλλεις περιεχόμενο που είναι παράνομο, επιβλαβές, παραπλανητικό ή παραβιάζει δικαιώματα άλλου προσώπου.",
      "Οι περιοχές διαχείρισης και τα εσωτερικά εργαλεία περιορίζονται μόνο σε εξουσιοδοτημένους χρήστες.",
    ],
  },
  {
    title: "Αλλαγές και διαθεσιμότητα",
    items: [
      "Το Nutritail AI μπορεί να ενημερώνει λειτουργίες, περιεχόμενο, εγγραφές βάσης δεδομένων και τους παρόντες όρους όσο το προϊόν εξελίσσεται.",
      "Μπορεί να περιορίσουμε, να αναστείλουμε ή να διακόψουμε τμήματα της υπηρεσίας όταν χρειάζεται για λόγους ασφάλειας, συντήρησης ή προϊόντος.",
      "Η συνέχιση χρήσης της υπηρεσίας μετά από ενημερώσεις σημαίνει ότι αποδέχεσαι τους ενημερωμένους όρους.",
    ],
  },
];

const paidLaunchNotice = [
  {
    title: "Δεν υπάρχει αυτόματη χρέωση",
    text: "Αν στο μέλλον ανοίξουν πληρωμένα πλάνα, η beta χρήση δεν θα μετατραπεί αυτόματα σε συνδρομή.",
  },
  {
    title: "Θα προηγηθεί καθαρή ενημέρωση",
    text: "Πριν ζητηθεί οποιαδήποτε πληρωμή, θα εμφανιστούν καθαρά τιμή, όρια, ακύρωση, υποστήριξη και τι αλλάζει σε σχέση με τη beta.",
  },
  {
    title: "Ο χρήστης θα επιλέγει συνειδητά",
    text: "Η συνέχιση σε paid plan θα απαιτεί σαφή επιλογή από τον χρήστη, όχι σιωπηρή ενεργοποίηση.",
  },
] as const;

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <section className="mx-auto max-w-4xl space-y-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Τελευταία ενημέρωση 25 Μαΐου 2026
          </p>
          <h1 className="mt-3 text-3xl font-bold text-black">Όροι χρήσης</h1>

          <p className="mt-4 text-gray-600">
            Οι παρόντες όροι εξηγούν τους κανόνες χρήσης του {brand.name}. Με
            τη χρήση της υπηρεσίας συμφωνείς να τη χρησιμοποιείς υπεύθυνα και
            κατανοείς ότι παρέχει ενημερωτική καθοδήγηση, όχι κτηνιατρική
            φροντίδα.
          </p>
        </div>

        <div
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm"
          data-testid="terms-paid-launch-notice"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Πριν από οποιοδήποτε paid launch
          </p>
          <h2 className="mt-3 text-2xl font-bold text-black">
            Η beta δεν γίνεται συνδρομή χωρίς καθαρή επιλογή.
          </h2>
          <p className="mt-4 text-gray-700">
            Αυτή τη στιγμή το NutriTail λειτουργεί ως beta πρόσβαση χωρίς
            πληρωμή. Αν αργότερα ενεργοποιηθούν πληρωμένα πλάνα, ο χρήστης θα
            ενημερωθεί καθαρά πριν ζητηθεί οποιαδήποτε πληρωμή.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {paidLaunchNotice.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-emerald-200 bg-white p-4"
                data-testid="terms-paid-launch-notice-item"
              >
                <h3 className="font-bold text-black">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>

        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
          >
            <h2 className="text-xl font-bold text-black">{section.title}</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-gray-600">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-black">Επικοινωνία</h2>
          <p className="mt-4 text-gray-600">
            Ερωτήσεις για τους όρους μπορούν να σταλούν στο{" "}
            <a
              href={`mailto:${brand.contactEmail}`}
              className="font-semibold text-black underline"
            >
              {brand.contactEmail}
            </a>
            .
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-lg border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-100"
          >
            Πίσω στην αρχική
          </Link>
        </div>
      </section>
    </main>
  );
}
