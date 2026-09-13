"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { launchFeatures } from "@/lib/launch/features";

const links = [
  { href: "/how-it-works", label: "Πώς λειτουργεί" },
  ...(launchFeatures.paidPlans
    ? [{ href: "/plans", label: "Πλάνα" }]
    : []),
  { href: "/support", label: "Υποστήριξη" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#dce5df] bg-white/95 backdrop-blur">
      <div className="nt-container flex h-[72px] items-center justify-between gap-4">
        <Link
          href="/"
          className="nt-focus flex min-w-0 items-center gap-2.5 rounded-lg"
          onClick={() => setIsOpen(false)}
        >
          <Image
            src="/nutritail-icon.svg"
            alt=""
            width={38}
            height={38}
            className="h-[38px] w-[38px]"
          />
          <span className="truncate text-lg font-black text-[#14221b]">
            Nutritail <span className="text-[#1f7a4d]">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Κύρια πλοήγηση">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nt-focus rounded-lg px-3 py-2 text-sm font-bold transition ${
                  active
                    ? "bg-[#eaf7ef] text-[#17663f]"
                    : "text-[#42534a] hover:bg-[#f3f7f4] hover:text-[#14221b]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/login" className="nt-button nt-button-secondary nt-focus min-h-10 px-4 py-2">
            Σύνδεση
          </Link>
          <Link href="/register" className="nt-button nt-button-primary nt-focus min-h-10 px-4 py-2">
            Ξεκίνα δωρεάν
          </Link>
        </div>

        <button
          type="button"
          className="nt-focus flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#dce5df] bg-white text-[#14221b] lg:hidden"
          aria-label={isOpen ? "Κλείσιμο μενού" : "Άνοιγμα μενού"}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {isOpen && (
        <div id="mobile-navigation" className="border-t border-[#dce5df] bg-white lg:hidden">
          <nav className="nt-container grid gap-1 py-3" aria-label="Πλοήγηση κινητού">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nt-focus rounded-lg px-3 py-3 text-sm font-bold text-[#283a30] hover:bg-[#f3f7f4]"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#dce5df] pt-3">
              <Link
                href="/login"
                className="nt-button nt-button-secondary nt-focus"
                onClick={() => setIsOpen(false)}
              >
                Σύνδεση
              </Link>
              <Link
                href="/register"
                className="nt-button nt-button-primary nt-focus"
                onClick={() => setIsOpen(false)}
              >
                Ξεκίνα
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
