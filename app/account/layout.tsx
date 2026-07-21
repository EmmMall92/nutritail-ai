"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AccountNavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const isActive =
    pathname === href || (href !== "/account" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      className={`min-w-0 rounded-lg px-2 py-2 text-center text-xs transition sm:shrink-0 sm:px-4 sm:text-sm ${
        isActive ? "bg-black text-white" : "text-black hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/account" className="text-lg font-bold text-black">
            Nutritail AI
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Αποσύνδεση
          </button>
        </div>
      </header>

      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-4 gap-1 px-2 py-2 sm:flex sm:flex-wrap sm:gap-2 sm:px-6 sm:py-3">
          <AccountNavLink href="/account" label="Πίνακας" pathname={pathname} />
          <AccountNavLink
            href="/account/chatbot"
            label="Σύμβουλος"
            pathname={pathname}
          />
          <AccountNavLink
            href="/account/pets"
            label="Κατοικίδια"
            pathname={pathname}
          />
          <AccountNavLink
            href="/account/profile"
            label="Προφίλ"
            pathname={pathname}
          />
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-3 py-2 sm:px-6 sm:py-6">
        {children}
      </section>
    </main>
  );
}
