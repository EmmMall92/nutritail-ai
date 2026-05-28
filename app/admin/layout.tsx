"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import type { Profile } from "@/types/profile";

function AdminNavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`rounded-lg px-4 py-2 text-sm transition ${
        isActive ? "bg-black text-white" : "text-black hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function checkAuthAndRole() {
      const loginPath = `/login?next=${encodeURIComponent(pathname || "/admin")}`;
      const { data } = await supabaseClient.auth.getSession();

      if (!data.session) {
        router.replace(loginPath);
        return;
      }

      const response = await fetch("/api/admin/me", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      });

      if (!response.ok) {
        await supabaseClient.auth.signOut();
        router.replace(loginPath);
        return;
      }

      const result = (await response.json()) as { profile?: Profile };

      if (!result.profile) {
        await supabaseClient.auth.signOut();
        router.replace(loginPath);
        return;
      }

      setProfile(result.profile);
      setIsLoading(false);
    }

    checkAuthAndRole();
  }, [pathname, router]);

  async function handleLogout() {
    await supabaseClient.auth.signOut();
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Checking admin access...</p>
      </main>
    );
  }

  const isAdmin = profile?.role === "admin";

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-black">Admin Panel</h1>
            <p className="text-xs text-gray-600">
              {profile?.email} - {profile?.role}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </header>

      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-6 py-3">
          <AdminNavLink href="/admin" label="Dashboard" pathname={pathname} />
          <AdminNavLink href="/admin/pets" label="Pets" pathname={pathname} />
          <AdminNavLink href="/admin/foods" label="Foods" pathname={pathname} />
          <AdminNavLink
            href="/admin/duplicates"
            label="Duplicates"
            pathname={pathname}
          />
          <AdminNavLink
            href="/admin/validation"
            label="Validation"
            pathname={pathname}
          />
          <AdminNavLink
            href="/admin/food-backfill"
            label="Food Backfill"
            pathname={pathname}
          />
          <AdminNavLink
            href="/admin/activity"
            label="Activity"
            pathname={pathname}
          />
          <AdminNavLink
            href="/admin/chat-feedback"
            label="Chat Feedback"
            pathname={pathname}
          />
          <AdminNavLink href="/admin/trash" label="Trash" pathname={pathname} />
          <AdminNavLink href="/admin/customers" label="Customers" pathname={pathname} />

          {isAdmin && (
            <>
              <AdminNavLink
                href="/admin/export"
                label="Export"
                pathname={pathname}
              />
              <AdminNavLink
                href="/admin/restore"
                label="Restore"
                pathname={pathname}
              />
              <AdminNavLink
                href="/admin/settings"
                label="Settings"
                pathname={pathname}
              />
            </>
          )}
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-6">{children}</section>
    </main>
  );
}
