"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  const isActive =
    href === "/admin"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        isActive ? "bg-black text-white" : "text-black hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );
}

const ADMIN_NAV_GROUPS = [
  {
    label: "Core",
    links: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/customers", label: "Customers" },
      { href: "/admin/pets", label: "Pets" },
      { href: "/admin/activity", label: "Activity" },
    ],
  },
  {
    label: "Food V2",
    links: [
      { href: "/admin/foods", label: "Foods" },
      { href: "/admin/foods/v2-preview", label: "Preview" },
      { href: "/admin/foods/v2-review", label: "Review" },
      { href: "/admin/foods/v2-guide", label: "Guide" },
      { href: "/admin/foods/v2-nutrient-gaps", label: "Gaps" },
      { href: "/admin/foods/v2-recommendation-lab", label: "Lab" },
    ],
  },
  {
    label: "Quality",
    links: [
      { href: "/admin/duplicates", label: "Duplicates" },
      { href: "/admin/validation", label: "Validation" },
      { href: "/admin/food-backfill", label: "Backfill" },
      { href: "/admin/chat-feedback", label: "Feedback" },
      { href: "/admin/foods/v2-live-qa", label: "Live QA" },
      { href: "/admin/trash", label: "Trash" },
    ],
  },
] as const;

const ADMIN_ONLY_NAV_GROUP = {
  label: "Operations",
  links: [
    { href: "/admin/export", label: "Export" },
    { href: "/admin/restore", label: "Restore" },
    { href: "/admin/settings", label: "Settings" },
  ],
} as const;

function isAdminOnlyPath(pathname: string) {
  return ["/admin/export", "/admin/restore", "/admin/settings"].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
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
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();

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
        await supabase.auth.signOut();
        router.replace(loginPath);
        return;
      }

      const result = (await response.json()) as { profile?: Profile };

      if (!result.profile) {
        await supabase.auth.signOut();
        router.replace(loginPath);
        return;
      }

      if (result.profile.role !== "admin" && isAdminOnlyPath(pathname)) {
        router.replace("/admin");
        return;
      }

      setProfile(result.profile);
      setIsLoading(false);
    }

    checkAuthAndRole();
  }, [pathname, router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
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
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-3">
          {[...ADMIN_NAV_GROUPS, ...(isAdmin ? [ADMIN_ONLY_NAV_GROUP] : [])].map(
            (group) => (
              <div key={group.label} className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <p className="w-24 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.links.map((link) => (
                    <AdminNavLink
                      key={link.href}
                      href={link.href}
                      label={link.label}
                      pathname={pathname}
                    />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-6">{children}</section>
    </main>
  );
}
