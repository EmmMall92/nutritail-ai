import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { getRequestLocale } from "@/lib/i18n/server";
import { translatePublicTree } from "@/lib/i18n/translatePublicTree";
import { createPublicMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const locale = await getRequestLocale();

  return createPublicMetadata({
    title: locale === "el" ? "Οδηγοί διατροφής σκύλου και γάτας" : "Dog and cat nutrition guides",
    description:
      locale === "el"
        ? "Πρακτικοί οδηγοί για επιλογή, μερίδα και σταδιακή αλλαγή τροφής σκύλου και γάτας, με πηγές και σαφή όρια κτηνιατρικής συμβουλής."
        : "Practical guides for choosing, portioning and gradually changing dog and cat food, with sources and clear veterinary boundaries.",
    path: "/guides",
    locale,
  });
}

const guides = [
  {
    href: "/guides/choosing-dog-food",
    kind: "Σκύλος",
    title: "Τι τροφή να πάρω στον σκύλο μου;",
    summary:
      "Πώς διαλέγεις μια κατάλληλη τροφή: στάδιο ζωής, ετικέτα, θερμίδες και χρήσιμες ερωτήσεις προς τον κατασκευαστή.",
  },
  {
    href: "/guides/dog-food-portion",
    kind: "Σκύλος",
    title: "Πόση τροφή χρειάζεται ο σκύλος ή το κουτάβι μου;",
    summary:
      "Πώς διαβάζεις τον οδηγό της συσκευασίας, υπολογίζεις τη μερίδα και προσαρμόζεις την ποσότητα στην ανάπτυξη του κουταβιού.",
  },
  {
    href: "/guides/choosing-cat-food",
    kind: "Γάτα",
    title: "Τι τροφή να πάρω στη γάτα μου;",
    summary:
      "Πώς ελέγχεις πλήρη τροφή, στάδιο ζωής, υγρή ή ξηρά μορφή και στοιχεία κατασκευαστή.",
  },
  {
    href: "/guides/cat-food-portion",
    kind: "Γάτα",
    title: "Πόση τροφή χρειάζεται η γάτα ή το γατάκι μου;",
    summary:
      "Πώς βρίσκεις ποσότητα για γατάκι και συνδυάζεις υγρή και ξηρά τροφή χωρίς διπλό μέτρημα.",
  },
  {
    href: "/guides/changing-pet-food",
    kind: "Σκύλος & γάτα",
    title: "Πώς αλλάζω τροφή στον σκύλο ή στη γάτα;",
    summary:
      "Σταδιακή μετάβαση, ενδεικτικό πλάνο 7 ημερών και σημάδια που χρειάζονται κτηνιατρική εκτίμηση.",
  },
  {
    href: "/guides/can-dogs-eat-cat-food",
    kind: "Σκύλος & γάτα",
    title: "Μπορεί ο σκύλος να φάει γατοτροφή και η γάτα σκυλοτροφή;",
    summary:
      "Οι βασικές διατροφικές διαφορές, τι σημαίνει μια τυχαία μπουκιά και γιατί η τροφή του άλλου είδους δεν είναι σωστό καθημερινό γεύμα.",
  },
];

export default async function GuidesPage() {
  const locale = await getRequestLocale();

  return translatePublicTree(locale, (
    <main className="min-h-screen bg-[#fbfcfa] text-[#14221b]">
      <PublicHeader />
      <div className="nt-container py-12 sm:py-16">
        <p className="nt-eyebrow">Διατροφή στην πράξη</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
          Οδηγοί διατροφής σκύλου και γάτας
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[#42534a]">
          Δες πώς να επιλέξεις τροφή, να ξεκινήσεις με τη μερίδα και να κάνεις
          μια σταδιακή αλλαγή για τον σκύλο ή τη γάτα σου.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {guides.map((guide) => (
            <article key={guide.href} className="border-t-2 border-[#1f7a4d] pt-5">
              <p className="text-sm font-bold text-[#17663f]">{guide.kind}</p>
              <h2 className="mt-3 text-2xl font-black leading-tight">{guide.title}</h2>
              <p className="mt-3 max-w-md leading-7 text-[#52635a]">{guide.summary}</p>
              <Link
                href={guide.href}
                className="nt-focus mt-5 inline-flex items-center gap-2 rounded-lg py-2 font-bold text-[#17663f] hover:underline"
              >
                Διάβασε τον οδηγό <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-12 max-w-3xl border-l-2 border-[#dce5df] pl-4 text-sm leading-7 text-[#52635a]">
          Οι οδηγοί αφορούν γενική ενημέρωση για υγιή ζώα. Για ασθένεια,
          θεραπευτική δίαιτα, εγκυμοσύνη, ανάπτυξη ή ανεξήγητη μεταβολή βάρους
          και όρεξης, ζήτησε εξατομικευμένη συμβουλή από κτηνίατρο.
        </p>
      </div>
      <PublicFooter />
    </main>
  ));
}
