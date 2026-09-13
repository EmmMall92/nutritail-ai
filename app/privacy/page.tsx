import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { brand } from "@/lib/brand";
import { launchFeatures } from "@/lib/launch/features";
import { createPublicMetadata } from "@/lib/seo/metadata";
import {
  PRIVACY_POLICY_LAST_UPDATED_EL,
  PRIVACY_POLICY_VERSION,
  PRIVACY_RETENTION,
} from "@/lib/privacy/config";

export const metadata = createPublicMetadata({
  title: `Πολιτική απορρήτου | ${brand.name}`,
  description:
    "Δες πώς το Nutritail AI χειρίζεται στοιχεία λογαριασμού, προφίλ κατοικιδίου και διατροφικών αναλύσεων.",
  path: "/privacy",
});

const sections = [
  {
    title: "Υπεύθυνος επεξεργασίας",
    items: [
      `${brand.businessName} είναι ο υπεύθυνος επεξεργασίας για την υπηρεσία Nutritail AI. Για θέματα προσωπικών δεδομένων μπορείς να επικοινωνήσεις στο ${brand.contactEmail}.`,
      "Η υπηρεσία απευθύνεται σε ενήλικους χρήστες και δεν συλλέγει σκόπιμα στοιχεία παιδιών.",
    ],
  },
  {
    title: "Πληροφορίες που συλλέγουμε",
    items: [
      "Στοιχεία λογαριασμού, όπως email και πληροφορίες σύνδεσης.",
      "Στοιχεία προφίλ κατοικιδίου που επιλέγεις να καταχωρίσεις, όπως είδος, ηλικία, βάρος, δραστηριότητα, σημειώσεις υγείας, αλλεργίες και διατροφικοί στόχοι.",
      "Στοιχεία τροφής και ανάλυσης που χρησιμοποιούνται για διατροφική καθοδήγηση, αποθηκευμένες αναφορές και ιστορικό λογαριασμού.",
      "Βασικές τεχνικές πληροφορίες που χρειάζονται για τη λειτουργία και την ασφάλεια της υπηρεσίας, όπως τεχνικά στοιχεία αιτήματος και logs σφαλμάτων.",
    ],
  },
  {
    title: "Σκοποί και νομικές βάσεις",
    items: [
      "Εκτέλεση σύμβασης: λειτουργία λογαριασμού, αποθήκευση κατοικιδίων, διατροφική καθοδήγηση, αναφορές και υποστήριξη που ζητάς.",
      "Έννομο συμφέρον: ασφάλεια, πρόληψη κατάχρησης, βασική αποσφαλμάτωση και αξιόπιστη λειτουργία, με περιορισμένα δεδομένα και χρόνο διατήρησης.",
      "Συγκατάθεση: προαιρετική ανάλυση χρήσης και προαιρετικές προσφορές συνεργατών. Μπορείς να την ανακαλέσεις οποτεδήποτε χωρίς να επηρεάζεται η βασική υπηρεσία.",
      "Νομική υποχρέωση: διατήρηση ή γνωστοποίηση πληροφοριών όταν αυτό απαιτείται από εφαρμοστέο δίκαιο.",
    ],
  },
  {
    title: "Πώς χειριζόμαστε τα δεδομένα",
    items: [
      "Δεν πουλάμε προσωπικές πληροφορίες.",
      "Η διατροφική καθοδήγηση είναι ενημερωτική και δεν πρέπει να θεωρείται κτηνιατρική διάγνωση ή θεραπεία.",
      "Χρησιμοποιούμε παρόχους υπηρεσιών όπως Supabase για authentication και βάση δεδομένων, Vercel για hosting και OpenAI για τις λειτουργίες AI.",
      "Η πρόσβαση σε διαχειριστικά δεδομένα περιορίζεται σε εξουσιοδοτημένους ρόλους.",
      "Όταν πάροχος επεξεργάζεται δεδομένα εκτός ΕΟΧ, χρησιμοποιούνται οι διαθέσιμες συμβατικές και οργανωτικές εγγυήσεις για τη διαβίβαση.",
    ],
  },
  {
    title: "AI και πάροχοι υπηρεσιών",
    items: [
      "Το AI χρησιμοποιείται για να καταλαβαίνει φυσικά μηνύματα και να γράφει πιο ανθρώπινη απάντηση, όχι για να εφευρίσκει τροφές, θερμίδες ή ιατρικές οδηγίες.",
      "Όταν χρησιμοποιούνται εξωτερικοί πάροχοι τεχνολογίας, στέλνουμε μόνο τα στοιχεία που χρειάζονται για τη λειτουργία της υπηρεσίας και αποφεύγουμε περιττό ιστορικό.",
      "Οι προτάσεις τροφών, οι αποκλεισμοί αλλεργιών και τα όρια ασφάλειας παραμένουν στον κώδικα και στη βάση NutriTail.",
    ],
  },
  {
    title: "Διατήρηση, διόρθωση και διαγραφή",
    items: [
      `Στοιχεία λογαριασμού: ${PRIVACY_RETENTION.accountData.toLowerCase()}.`,
      `Κατοικίδια και αναλύσεις: ${PRIVACY_RETENTION.petData.toLowerCase()}.`,
      `Τεχνικά logs με στοιχεία όπως IP ή user agent διατηρούνται έως ${PRIVACY_RETENTION.runtimeMonitoringDays} ημέρες. Feedback συνομιλίας διατηρείται έως ${PRIVACY_RETENTION.chatbotFeedbackDays} ημέρες.`,
      "Η διαγραφή από το Privacy Center αφαιρεί τον ενεργό λογαριασμό και τα συνδεδεμένα δεδομένα από την κύρια βάση. Περιορισμένη διατήρηση μπορεί να απαιτηθεί μόνο όταν υπάρχει συγκεκριμένη νομική υποχρέωση.",
    ],
  },
  {
    title: "Τα δικαιώματά σου",
    items: [
      "Έχεις δικαίωμα ενημέρωσης, πρόσβασης, διόρθωσης, διαγραφής, περιορισμού, φορητότητας και εναντίωσης όπου εφαρμόζεται.",
      "Μπορείς να κατεβάσεις άμεσα αντίγραφο σε μορφή JSON, να ενημερώσεις το προφίλ σου και να διαγράψεις τον λογαριασμό από το Privacy Center.",
      "Μπορείς να ανακαλέσεις οποιαδήποτε προαιρετική συγκατάθεση από το Privacy Center. Η ανάκληση ισχύει για τη μελλοντική χρήση.",
      "Στόχος μας είναι να απαντάμε σε έγκυρα αιτήματα εντός ενός μήνα. Μπορεί να ζητηθεί επιβεβαίωση ταυτότητας πριν από ένα αίτημα εκτός συνδεδεμένου λογαριασμού.",
      "Μπορείς επίσης να υποβάλεις καταγγελία στην Ελληνική Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα.",
    ],
  },
  ...(launchFeatures.partnerStores
    ? [{
    title: "Cookies, περιοχή και συνεργαζόμενα καταστήματα",
    items: [
      "Χρησιμοποιούμε απαραίτητα cookies σύνδεσης και τοπικές προτιμήσεις που χρειάζονται για την υπηρεσία. Αυτή τη στιγμή δεν φορτώνεται διαφημιστικό ή μη απαραίτητο analytics cookie.",
      "Η πόλη ή ο ταχυδρομικός κώδικας που γράφεις για εύρεση καταστήματος χρησιμοποιείται μόνο στο συγκεκριμένο αίτημα και δεν αποθηκεύεται στο προφίλ σου.",
      "Δεν κοινοποιούμε το προφίλ, τα κατοικίδια ή τη συνομιλία σου στα καταστήματα. Οι πληρωμένες εμφανίσεις επισημαίνονται ως συνεργαζόμενες.",
      `Όταν ανοίγεις τον σύνδεσμο ή το τηλέφωνο συνεργάτη, κρατάμε για έως ${PRIVACY_RETENTION.partnerReferralDays} ημέρες ένα ανώνυμο event με το κατάστημα, την καταχώριση και τον τύπο ενέργειας. Δεν αποθηκεύουμε μαζί του λογαριασμό, κατοικίδιο, περιοχή, IP, συσκευή ή περιεχόμενο συνομιλίας.`,
    ],
  }]
    : []),
  {
    title: "Αυτοματοποιημένη καθοδήγηση",
    items: [
      "Οι διατροφικές προτάσεις υποστηρίζονται από αυτοματοποιημένους κανόνες και AI, αλλά δεν παράγουν νομικό αποτέλεσμα ούτε αντικαθιστούν απόφαση κτηνιάτρου.",
      "Μπορείς να αγνοήσεις μια πρόταση, να αλλάξεις τα στοιχεία και να ζητήσεις υποστήριξη ή κτηνιατρική αξιολόγηση.",
    ],
  },
];

const customerTrustSummary = [
  {
    title: "AI dialogue only",
    text: "Το AI μπορεί να βοηθά να καταλάβουμε φυσική γλώσσα και να γράφουμε πιο καθαρά, αλλά οι τροφές, οι αποκλεισμοί και οι θερμίδες πρέπει να βασίζονται στη βάση NutriTail και στους κανόνες αξιολόγησης.",
  },
  {
    title: "Pet data stays practical",
    text: "Κρατάμε στοιχεία που χρειάζονται για την ανάλυση, όπως είδος, ηλικία, βάρος, στείρωση, στόχο, προτιμήσεις, ευαισθησίες, επιλεγμένη τροφή, report και progress check.",
  },
  {
    title: "User control",
    text: "Ο χρήστης μπορεί να ζητήσει διόρθωση, εξαγωγή ή διαγραφή στοιχείων λογαριασμού και κατοικιδίων. Δεν πουλάμε προσωπικά δεδομένα.",
  },
] as const;

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <PublicHeader />
      <section className="mx-auto max-w-4xl space-y-8 px-6 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Τελευταία ενημέρωση {PRIVACY_POLICY_LAST_UPDATED_EL} · Έκδοση {PRIVACY_POLICY_VERSION}
          </p>
          <h1 className="mt-3 text-3xl font-bold text-black">
            Πολιτική απορρήτου
          </h1>

          <p className="mt-4 text-gray-600">
            Η παρούσα πολιτική εξηγεί πώς το {brand.name} χειρίζεται πληροφορίες
            όταν χρησιμοποιείς την υπηρεσία διατροφικής καθοδήγησης κατοικιδίων.
            Αφορά την τρέχουσα έκδοση του προϊόντος και μπορεί να ενημερωθεί όσο
            η υπηρεσία εξελίσσεται.
          </p>
        </div>

        <div
          className="rounded-2xl border border-blue-200 bg-blue-50 p-8 shadow-sm"
          data-testid="privacy-customer-ai-data-summary"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Customer trust summary
          </p>
          <h2 className="mt-3 text-2xl font-bold text-black">
            Τι κρατάμε, τι κάνει το AI και τι ελέγχει ο χρήστης
          </h2>
          <p className="mt-4 text-gray-700">
            Η εμπειρία πρέπει να είναι απλή για τον πελάτη, αλλά τα όρια από πίσω να είναι καθαρά:
            το NutriTail χρησιμοποιεί τα δεδομένα κατοικιδίου για πρακτική διατροφική καθοδήγηση,
            όχι για διάγνωση ή θεραπεία.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {customerTrustSummary.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-blue-200 bg-white p-4"
                data-testid="privacy-customer-ai-data-summary-item"
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
            Για ερωτήσεις απορρήτου ή αιτήματα σχετικά με δεδομένα λογαριασμού,
            επικοινώνησε στο{" "}
            <a
              href={`mailto:${brand.contactEmail}`}
              className="font-semibold text-black underline"
            >
              {brand.contactEmail}
            </a>
            .
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/account/privacy"
              className="inline-flex rounded-lg bg-[#123d2b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d3021]"
            >
              Άνοιγμα Privacy Center
            </Link>
            <a
              href="https://www.dpa.gr/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-100"
            >
              Ελληνική Αρχή Προστασίας Δεδομένων
            </a>
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-lg border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-100"
          >
            Πίσω στην αρχική
          </Link>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
