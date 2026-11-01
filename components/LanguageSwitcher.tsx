"use client";

import Link from "next/link";
import { Languages } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  localeFromPathname,
  localizePath,
  type Locale,
} from "@/lib/i18n/config";

type LanguageSwitcherProps = {
  className?: string;
};

const options: Array<{ locale: Locale; shortLabel: string; label: string }> = [
  { locale: "el", shortLabel: "EL", label: "Ελληνικά" },
  { locale: "en", shortLabel: "EN", label: "English" },
];

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const activeLocale = localeFromPathname(pathname);
  const ariaLabel = activeLocale === "el" ? "Επιλογή γλώσσας" : "Language selection";

  return (
    <div
      className={`inline-flex h-10 items-center gap-1 rounded-md border border-[#dce5df] bg-white p-1 ${className}`}
      role="group"
      aria-label={ariaLabel}
    >
      <Languages size={16} className="ml-1 text-[#5f6f66]" aria-hidden="true" />
      {options.map((option) => {
        const active = option.locale === activeLocale;

        return (
          <Link
            key={option.locale}
            href={localizePath(pathname, option.locale)}
            hrefLang={option.locale}
            lang={option.locale}
            aria-label={option.label}
            aria-current={active ? "page" : undefined}
            className={`nt-focus flex h-8 min-w-9 items-center justify-center rounded px-2 text-xs font-black transition ${
              active
                ? "bg-[#eaf7ef] text-[#17663f]"
                : "text-[#5f6f66] hover:bg-[#f3f7f4] hover:text-[#14221b]"
            }`}
          >
            {option.shortLabel}
          </Link>
        );
      })}
    </div>
  );
}
