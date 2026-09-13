import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeEuro, CheckCircle2, MapPin, PackageCheck, ShieldCheck } from "lucide-react";

import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { brand } from "@/lib/brand";
import { STORE_RANKING_POLICY_VERSION } from "@/lib/legal/config";
import { launchFeatures } from "@/lib/launch/features";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicMetadata({
  title: `Κατάταξη καταστημάτων | ${brand.name}`,
  description:
    "Τα βασικά κριτήρια κατάταξης συνεργαζόμενων καταστημάτων και η επίδραση της πληρωμένης προβολής.",
  path: "/store-ranking",
  index: launchFeatures.partnerStores,
});

const rankingSteps = [
  {
    icon: CheckCircle2,
    title: "Ακριβής αντιστοίχιση τροφής",
    text: "Εμφανίζονται μόνο καταχωρίσεις για το ακριβές προϊόν που έχει ήδη επιλεγεί στην ενημερωτική πρόταση τροφής.",
  },
  {
    icon: ShieldCheck,
    title: "Ενεργή και επιλέξιμη καταχώριση",
    text: "Το κατάστημα πρέπει να έχει ενεργή ή δοκιμαστική συνεργασία και ενεργή καταχώριση για το συγκεκριμένο προϊόν.",
  },
  {
    icon: MapPin,
    title: "Συνάφεια περιοχής",
    text: "Όταν δίνεται πόλη ή ταχυδρομικός κώδικας, οι σχετικές τοπικές επιλογές προηγούνται, ενώ τα online e-shops παραμένουν διαθέσιμα.",
  },
  {
    icon: PackageCheck,
    title: "Δηλωμένη διαθεσιμότητα",
    text: "Καταχωρίσεις που δηλώνονται ως διαθέσιμες προηγούνται από όσες είναι κατόπιν παραγγελίας ή χρειάζονται επιβεβαίωση.",
  },
  {
    icon: BadgeEuro,
    title: "Χορηγούμενη θέση",
    text: "Η χορηγούμενη κατάσταση μπορεί να βελτιώσει τη θέση μόνο ανάμεσα σε ήδη επιλέξιμα καταστήματα για την ίδια τροφή. Επισημαίνεται πάντοτε καθαρά. Οι υπόλοιπες ισοβαθμίες λύνονται με τη δηλωμένη διαχειριστική προτεραιότητα και σταθερή αλφαβητική σειρά.",
  },
] as const;

export default function StoreRankingPage() {
  if (!launchFeatures.partnerStores) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f4f7f5] text-[#14221b]">
      <PublicHeader />

      <section className="border-b border-[#dce5df] bg-white">
        <div className="nt-container py-12 sm:py-16" data-testid="store-ranking-policy-page">
          <p className="text-xs font-extrabold uppercase text-[#1f7a4d]">
            Έκδοση {STORE_RANKING_POLICY_VERSION}
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-black sm:text-4xl">
            Πώς κατατάσσονται τα συνεργαζόμενα καταστήματα
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#52635a]">
            Η επιλογή τροφής και η επιλογή καταστήματος είναι δύο διαφορετικά
            βήματα. Η καταλληλότητα της τροφής αποφασίζεται πρώτη και δεν
            πωλείται. Η εμπορική συνεργασία επηρεάζει μόνο την προβολή
            καταστημάτων που διαθέτουν την ήδη επιλεγμένη τροφή.
          </p>
        </div>
      </section>

      <section className="border-b border-[#dce5df] bg-[#eaf7ef]">
        <div className="nt-container py-10" data-testid="store-ranking-paid-effect">
          <div className="max-w-3xl border-l-4 border-[#1f7a4d] pl-5">
            <h2 className="text-2xl font-black">Τι ακριβώς μπορεί να αγοράσει ένα κατάστημα</h2>
            <p className="mt-3 leading-7 text-[#42534a]">
              Μπορεί να αγοράσει συμμετοχή στο δίκτυο και, όπου συμφωνείται,
              αυξημένη προβολή μέσα στη λίστα αγοράς. Δεν μπορεί να αγοράσει
              υψηλότερη βαθμολογία τροφής, να παρακάμψει αλλεργίες ή να
              εμφανιστεί για διαφορετικό προϊόν.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="nt-container py-12">
          <h2 className="text-2xl font-black">Κύρια κριτήρια προεπιλεγμένης κατάταξης</h2>
          <ol className="mt-6 grid gap-px overflow-hidden rounded-lg border border-[#dce5df] bg-[#dce5df] md:grid-cols-2">
            {rankingSteps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="bg-white p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#123d2b] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <Icon size={20} className="text-[#1f7a4d]" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#52635a]">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-[#dce5df] bg-[#f4f7f5]">
        <div className="nt-container grid gap-8 py-10 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-black">Σήμανση και έλεγχος</h2>
            <p className="mt-3 text-sm leading-6 text-[#52635a]">
              Όλες οι επιλογές αναγνωρίζονται ως συνεργαζόμενα καταστήματα.
              Όταν η θέση επηρεάζεται από πρόσθετη αμοιβή, εμφανίζεται και η
              ένδειξη «Χορηγούμενη εμφάνιση». Τιμή και διαθεσιμότητα πρέπει να
              επιβεβαιώνονται στο κατάστημα πριν την αγορά.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-black">Δεδομένα πελάτη</h2>
            <p className="mt-3 text-sm leading-6 text-[#52635a]">
              Δεν παραδίδουμε στα καταστήματα το προφίλ, τη συνομιλία, τις
              αλλεργίες ή τα στοιχεία υγείας του κατοικιδίου. Η πόλη ή ο ΤΚ
              χρησιμοποιούνται για το συγκεκριμένο αίτημα αναζήτησης. Μετράμε
              μόνο ανώνυμα ανοίγματα συνδέσμου ή τηλεφώνου ανά κατάστημα και
              καταχώριση, χωρίς αναγνωριστικό πελάτη ή κατοικιδίου.
            </p>
            <Link href="/privacy" className="nt-focus mt-4 inline-flex rounded-lg font-bold text-[#17663f] underline underline-offset-4">
              Πολιτική απορρήτου
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
