import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { betaAccessPlanConfig } from "@/lib/beta/accessPlan";
import { brand } from "@/lib/brand";
import { TERMS_LAST_UPDATED_EL, TERMS_VERSION } from "@/lib/legal/config";
import { launchFeatures } from "@/lib/launch/features";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicMetadata({
  title: `Όροι χρήσης | ${brand.name}`,
  description:
    "Διάβασε τους όρους χρήσης του Nutritail AI για ενημερωτική επιλογή τροφής κατοικιδίων.",
  path: "/terms",
});

const sections = [
  {
    title: "AI και αυτοματοποιημένη καθοδήγηση",
    items: [
      "Ο βοηθός επιλογής τροφής είναι σύστημα τεχνητής νοημοσύνης. Ο χρήστης ενημερώνεται σχετικά πριν αρχίσει τη συνομιλία.",
      "Το AI βοηθά στην κατανόηση των στοιχείων και στη διατύπωση της απάντησης, αλλά λειτουργεί μέσα στα όρια της βάσης τροφών, των υπολογισμών και των κανόνων ασφάλειας του Nutritail.",
      "Μπορείς να αμφισβητήσεις ή να αγνοήσεις μια πρόταση, να διορθώσεις τα στοιχεία και να ζητήσεις ανθρώπινη ή κτηνιατρική υποστήριξη.",
    ],
  },
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
      "Το Nutritail AI παρέχει ενημερωτική αντιστοίχιση εμπορικών τροφών για μη ιατρικές περιπτώσεις, εκτιμήσεις και πληροφορίες προϊόντων.",
      "Η υπηρεσία δεν αποτελεί κτηνιατρείο και δεν παρέχει κτηνιατρική διάγνωση, γνωμάτευση, θεραπεία, συνταγογράφηση, οδηγίες έκτακτης ανάγκης ή ιατρική φροντίδα.",
      "Πάθηση, φαρμακευτική αγωγή, θεραπευτική ή κτηνιατρική δίαιτα και δηλωμένη ή ύποπτη τροφική αλλεργία ενεργοποιούν medical handoff χωρίς κατάταξη προϊόντων, θερμίδες ή γραμμάρια.",
      "Για απότομη αλλαγή βάρους, ανορεξία, επίμονα συμπτώματα ή επείγον περιστατικό, επικοινώνησε με κτηνίατρο πριν από οποιαδήποτε αλλαγή τροφής.",
    ],
  },
  {
    title: "Επαγγελματική ιδιότητα και επιστημονικός έλεγχος",
    items: [
      "Οι αυτοματοποιημένες απαντήσεις δεν εκδίδονται από κτηνίατρο και δεν παρουσιάζονται ως κτηνιατρικές γνωματεύσεις.",
      "Τυχόν σεμινάρια, βοηθητικές σπουδές ή άλλη εκπαιδευτική κατάρτιση μελών της ομάδας δεν παρουσιάζονται ως πτυχίο ή άδεια άσκησης του κτηνιατρικού επαγγέλματος.",
      "Πρόσωπο θα αναφέρεται ως κτηνίατρος ή επιστημονικός υπεύθυνος μόνο μετά από επαλήθευση της αντίστοιχης ιδιότητας και άδειας.",
      "Μέχρι να εγκριθεί ρητά μια ιατρική διαδρομή από αδειοδοτημένο κτηνίατρο, η διαδρομή παραμένει τεχνικά μπλοκαρισμένη.",
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
      "Ισχυρισμοί για χαρακτηριστικά τροφής πρέπει να στηρίζονται σε ελέγξιμη πηγή. Δεν αποδίδουμε σε τροφή πρόληψη, αντιμετώπιση ή θεραπεία ασθένειας.",
      "Η ενδεικτική ποσότητα ξεκινά από δηλωμένα στοιχεία και γενικούς υπολογισμούς, δεν αποτελεί συνταγή και χρειάζεται προσαρμογή με βάση την ετικέτα, την πορεία βάρους και, όπου χρειάζεται, κτηνιατρικό έλεγχο.",
    ],
  },
  ...(launchFeatures.partnerStores
    ? [{
    title: "Συνεργαζόμενα καταστήματα και κατάταξη",
    items: [
      "Η διατροφική επιλογή ολοκληρώνεται πριν εμφανιστούν επιλογές αγοράς. Πληρωμή ή συνεργασία καταστήματος δεν αλλάζει την καταλληλότητα ή τη βαθμολογία μιας τροφής.",
      "Ενεργή συνεργασία μπορεί να αποτελεί προϋπόθεση εμφάνισης και πρόσθετη αμοιβή μπορεί να επηρεάζει τη σειρά μόνο μεταξύ επιλέξιμων καταστημάτων για το ίδιο προϊόν.",
      "Οι πληρωμένες εμφανίσεις επισημαίνονται καθαρά. Τιμή, απόθεμα, αποστολή και τελικοί όροι αγοράς επιβεβαιώνονται απευθείας με το κατάστημα.",
      "Μπορεί να καταγράφουμε ανώνυμα ότι ανοίχτηκε σύνδεσμος ή τηλέφωνο καταστήματος για συγκεντρωτικές μετρήσεις. Η μέτρηση δεν περιλαμβάνει λογαριασμό, κατοικίδιο ή περιεχόμενο συνομιλίας και δεν αποδεικνύει ότι ολοκληρώθηκε αγορά.",
    ],
  }]
    : []),
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
      "Για ουσιώδη αλλαγή των όρων θα παρέχουμε σαφή ενημέρωση και, όπου απαιτείται, θα ζητάμε νέα ρητή αποδοχή συγκεκριμένης έκδοσης.",
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

const recommendationBoundaries = [
  {
    title: "Food database first",
    text: "Οι τροφές που εμφανίζονται πρέπει να υπάρχουν στη βάση NutriTail ή σε ελεγμένη ροή εισαγωγής. Το AI δεν επιτρέπεται να εφευρίσκει προϊόντα, θρεπτικές τιμές ή claims.",
  },
  {
    title: "Safety before promotion",
    text: "Αλλεργίες, είδος ζώου, ηλικία, μέγεθος, ιατρικά red flags και βασικοί διατροφικοί κανόνες προηγούνται από οποιαδήποτε εμπορική προτεραιότητα ή featured επιλογή.",
  },
  {
    title: "Owner decision with vet boundary",
    text: "Για πάθηση, φάρμακα, δηλωμένη αλλεργία, επείγοντα συμπτώματα ή θεραπευτική δίαιτα, η αυτοματοποιημένη επιλογή σταματά πριν από προϊόν, θερμίδες και ποσότητα. Η επόμενη απόφαση ανήκει στον κτηνίατρο.",
  },
] as const;

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <PublicHeader />
      <section className="mx-auto max-w-4xl space-y-8 px-6 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Τελευταία ενημέρωση {TERMS_LAST_UPDATED_EL} · Έκδοση {TERMS_VERSION}
          </p>
          <h1 className="mt-3 text-3xl font-bold text-black">Όροι χρήσης</h1>

          <p className="mt-4 text-gray-600">
            Οι παρόντες όροι εξηγούν τους κανόνες χρήσης του {brand.name}. Με
            τη χρήση της υπηρεσίας συμφωνείς να τη χρησιμοποιείς υπεύθυνα και
            κατανοείς ότι παρέχει ενημερωτική καθοδήγηση, όχι κτηνιατρική
            φροντίδα.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold">
            <Link href="/ai-transparency" className="text-[#17663f] underline underline-offset-4">
              Διαφάνεια AI
            </Link>
            <Link href="/store-ranking" className="text-[#17663f] underline underline-offset-4">
              Πολιτική κατάταξης καταστημάτων
            </Link>
          </div>
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

        <div
          className="rounded-2xl border border-blue-200 bg-blue-50 p-8 shadow-sm"
          data-testid="terms-recommendation-boundaries"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Recommendation boundaries
          </p>
          <h2 className="mt-3 text-2xl font-bold text-black">
            Πώς πρέπει να διαβάζεις τις προτάσεις τροφής
          </h2>
          <p className="mt-4 text-gray-700">
            Για μη ιατρικές περιπτώσεις, το NutriTail μετατρέπει τα δηλωμένα στοιχεία του
            κατοικιδίου σε ενημερωτικές επιλογές τροφής, ενδεικτική ποσότητα και επόμενα
            βήματα. Δεν αντικαθιστά κτηνίατρο και δεν χρησιμοποιείται ως γνωμάτευση ή
            θεραπευτική οδηγία.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {recommendationBoundaries.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-blue-200 bg-white p-4"
                data-testid="terms-recommendation-boundary"
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
      <PublicFooter />
    </main>
  );
}
