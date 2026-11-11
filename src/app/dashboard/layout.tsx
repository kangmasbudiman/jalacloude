"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { MENU_ITEMS } from "@/lib/menu";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, session, loading, unconfigured, signOut, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // pelindung halaman: belum login → lempar ke /login dengan tujuan kembali
  useEffect(() => {
    if (unconfigured) return; // mode demo: biarkan masuk tanpa login
    if (!loading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, unconfigured, pathname, router]);

  // admin hanya memakai Admin Panel — arahkan semua halaman dashboard ke sana
  useEffect(() => {
    if (!isAdmin) return;
    if (!pathname.startsWith("/dashboard/admin")) {
      router.replace("/dashboard/admin");
    }
  }, [isAdmin, pathname, router]);

  // simpan preferensi sidebar
  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", prev ? "0" : "1");
      return !prev;
    });
  };

  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ?? null;
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Pengguna Demo";

  const activeSlug = pathname.replace(/^\/dashboard\/?/, "").split("/")[0];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
            J
          </span>
          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight text-ink">
              Jala Cloud
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-copy hover:bg-surface lg:hidden"
          aria-label="Tutup menu"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {(isAdmin
          ? MENU_ITEMS.filter((item) => item.slug === "admin")
          : MENU_ITEMS.filter((item) => !item.adminOnly)
        ).map((item) => {
          const isActive = activeSlug === item.slug;
          return (
            <Link
              key={item.slug || "ringkasan"}
              href={`/dashboard${item.slug ? `/${item.slug}` : ""}`}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-brand-pale font-medium text-brand"
                  : "text-copy hover:bg-surface hover:text-ink"
              }`}
              title={item.label}
            >
              <item.icon className="size-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="hidden lg:block border-t border-line px-2 py-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-copy hover:bg-surface hover:text-ink"
        >
          {collapsed ? (
            <ChevronRight className="size-[18px]" />
          ) : (
            <>
              <ChevronLeft className="size-[18px]" />
              <span>Tutup Menu</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-surface">
      {/* Sidebar desktop */}
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 border-r border-line bg-white transition-[width] lg:block ${
          collapsed ? "w-[68px]" : "w-64"
        }`}
      >
        {sidebar}
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-line bg-white">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-white/85 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-copy hover:bg-surface lg:hidden"
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              {user?.email ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl ?? ""}
                  alt=""
                  className="size-8 rounded-full border border-line object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="grid size-8 place-items-center rounded-full border border-line bg-surface text-sm font-medium text-copy">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="hidden text-sm font-medium text-ink sm:block">
                {displayName}
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
              className="rounded-lg p-2 text-copy hover:bg-surface hover:text-red-500"
              title="Keluar"
            >
              <LogOut className="size-[18px]" />
            </button>
          </div>
        </header>

        {unconfigured && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-center text-xs text-amber-800">
            Mode demo — login Supabase belum dikonfigurasi. Isi{" "}
            <code className="font-mono">.env.local</code> untuk mengaktifkan
            login Google sungguhan.
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
