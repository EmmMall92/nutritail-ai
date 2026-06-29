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
      className={`shrink-0 rounded-lg px-4 py-2 text-sm transition ${
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
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
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
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3 sm:flex-wrap sm:px-6">
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

      <section className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-6">
        {children}
      </section>
    </main>
  );
}
