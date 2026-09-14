"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  LogOut,
  MessagesSquare,
  PawPrint,
  Scale,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LegalAcceptanceGate } from "@/components/LegalAcceptanceGate";

const accountLinks: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/account", label: "Πίνακας", icon: Home },
  { href: "/account/chatbot", label: "Βοηθός", icon: MessagesSquare },
  { href: "/account/food-compare", label: "Σύγκριση", icon: Scale },
  { href: "/account/pets", label: "Κατοικίδια", icon: PawPrint },
  { href: "/account/profile", label: "Προφίλ", icon: UserRound },
  { href: "/account/privacy", label: "Απόρρητο", icon: ShieldCheck },
];

function AccountNavLink({
  href,
  label,
  pathname,
  icon: Icon,
}: {
  href: string;
  label: string;
  pathname: string;
  icon: LucideIcon;
}) {
  const isActive = pathname === href || (href !== "/account" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      className={`nt-focus flex min-h-[3.5rem] min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[10px] font-bold transition lg:min-h-10 lg:flex-row lg:gap-2 lg:px-3 lg:text-sm ${
        isActive
          ? "bg-[#123d2b] text-white"
          : "text-[#52635a] hover:bg-[#eef5f0] hover:text-[#14221b]"
      }`}
      aria-current={isActive ? "page" : undefined}
      aria-label={label}
      title={label}
    >
      <Icon size={18} className="shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-[#f4f7f5] text-[#14221b]">
      <LegalAcceptanceGate />
      <header className="border-b border-[#dce5df] bg-white">
        <div className="mx-auto flex h-[66px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/account" className="nt-focus flex min-w-0 items-center gap-2.5 rounded-lg">
            <Image src="/nutritail-icon.svg" alt="" width={36} height={36} />
            <span className="truncate text-base font-black sm:text-lg">
              Nutritail <span className="text-[#1f7a4d]">AI</span>
            </span>
            <span className="hidden rounded-md bg-[#eaf7ef] px-2 py-1 text-[10px] font-extrabold text-[#17663f] sm:inline-flex">
              BETA
            </span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="nt-focus inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#dce5df] text-[#52635a] transition hover:bg-[#f3f7f4] hover:text-[#14221b] sm:w-auto sm:gap-2 sm:px-3"
            aria-label="Αποσύνδεση"
            title="Αποσύνδεση"
          >
            <LogOut size={17} />
            <span className="hidden text-sm font-bold sm:inline">Αποσύνδεση</span>
          </button>
        </div>
      </header>

      <nav className="sticky top-0 z-40 border-b border-[#dce5df] bg-white/95 backdrop-blur">
        <div
          className="mx-auto grid max-w-6xl grid-cols-3 gap-1 px-2 py-2 sm:grid-cols-6 sm:px-6 lg:flex"
        >
          {accountLinks.map((link) => (
            <AccountNavLink key={link.href} {...link} pathname={pathname} />
          ))}
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-3 py-3 sm:px-6 sm:py-6">{children}</section>
    </main>
  );
}
