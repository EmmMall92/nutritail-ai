import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicMetadata({
  title: "Οδηγοί διατροφής σκύλου και γάτας",
  description:
    "Πρακτικοί οδηγοί για τη μερίδα τροφής σκύλου και γάτας: ετικέτα, θερμίδες, λιχουδιές και παρακολούθηση βάρους, με σαφή όρια κτηνιατρικής συμβουλής.",
  path: "/guides",
});

const guides = [
  {
    href: "/guides/dog-food-portion",
    kind: "Σκύλος",
    title: "Πόση τροφή χρειάζεται ο σκύλος μου;",
    summary:
      "Πώς διαβάζεις τον οδηγό της συσκευασίας, μετράς τη μερίδα και συνυπολογίζεις τις λιχουδιές.",
  },
  {
    href: "/guides/cat-food-portion",
    kind: "Γάτα",
    title: "Πόση τροφή χρειάζεται η γάτα μου;",
    summary:
      "Πώς συνδυάζεις υγρή και ξηρά τροφή χωρίς να μετράς δύο φορές την ημερήσια ποσότητα.",
  },
];

export default function GuidesPage() {
  return (
    <main className="min-h-screen bg-[#fbfcfa] text-[#14221b]">
      <PublicHeader />
      <div className="nt-container py-12 sm:py-16">
        <p className="nt-eyebrow">Διατροφή στην πράξη</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
          Οδηγοί διατροφής σκύλου και γάτας
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-[#42534a]">
          Η ποσότητα στη συσκευασία είναι αφετηρία, όχι ίδια απάντηση για κάθε
          ζώο. Δες πώς να την καταλάβεις και τι να παρακολουθείς στην πορεία.
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
  );
}
