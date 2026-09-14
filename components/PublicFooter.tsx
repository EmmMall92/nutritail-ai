import Image from "next/image";
import Link from "next/link";
import { launchFeatures } from "@/lib/launch/features";

const footerLinks = [
  { href: "/about", label: "Σχετικά" },
  { href: "/how-it-works", label: "Πώς λειτουργεί" },
  { href: "/guides", label: "Οδηγοί" },
  ...(launchFeatures.paidPlans
    ? [{ href: "/plans", label: "Πλάνα" }]
    : []),
  { href: "/support", label: "Υποστήριξη" },
  { href: "/privacy", label: "Απόρρητο & cookies" },
  { href: "/terms", label: "Όροι" },
  { href: "/ai-transparency", label: "Διαφάνεια AI" },
  ...(launchFeatures.partnerStores
    ? [{ href: "/store-ranking", label: "Κατάταξη καταστημάτων" }]
    : []),
];

export function PublicFooter() {
  return (
    <footer className="border-t border-[#dce5df] bg-[#f4f8f5]">
      <div className="nt-container grid gap-8 py-10 md:grid-cols-[1fr_auto] md:items-end">
        <div className="max-w-xl">
          <Link href="/" className="nt-focus inline-flex items-center gap-2.5 rounded-lg">
            <Image src="/nutritail-icon.svg" alt="" width={36} height={36} />
            <span className="font-black text-[#14221b]">Nutritail AI</span>
          </Link>
          <p className="mt-4 text-sm leading-6 text-[#5f6f66]">
            Ενημερωτική επιλογή τροφής για σκύλους και γάτες, με καθαρά επόμενα
            βήματα και υπεύθυνα όρια υγείας.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold text-[#42534a] md:justify-end">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="nt-focus rounded hover:text-[#1f7a4d]">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-[#dce5df]">
        <div className="nt-container flex flex-col gap-2 py-5 text-xs text-[#52635a] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Nutritail AI. Με την επιφύλαξη κάθε δικαιώματος.</p>
          <p>Η καθοδήγηση δεν αντικαθιστά την κτηνιατρική διάγνωση.</p>
        </div>
      </div>
    </footer>
  );
}
