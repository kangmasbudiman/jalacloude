"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "#produk", label: "Produk" },
  { href: "/login", label: "Masuk" },
];

export function Header() {
  const { user, unconfigured, signInWithGoogle } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // di landing, jika user sudah login langsung tampilkan tombol Dashboard
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
            J
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink">
            Jala Cloud
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-copy md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {user ? (
          <Link
            href="/dashboard"
            className="h-10 rounded-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark inline-flex items-center"
          >
            Dashboard
          </Link>
        ) : (
          <button
            type="button"
            onClick={async () => {
              if (unconfigured) {
                router.push("/login");
                return;
              }
              await signInWithGoogle("/dashboard");
              // paksa pindah ke tab Google yang baru dibuka
              if (typeof window !== "undefined") window.top?.focus?.();
            }}
            className="h-10 rounded-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Masuk
          </button>
        )}
      </div>
    </header>
  );
}

/** Peringatan bila env Supabase belum diisi */
export function ConfigNotice() {
  const { unconfigured } = useAuth();
  const pathname = usePathname();
  useEffect(() => {});
  if (!unconfigured || pathname.includes("/auth/callback")) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-center text-xs text-amber-800">
      Mode demo: Supabase belum dikonfigurasi. Isi{" "}
      <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">.env.local</code>{" "}
      (NEXT_PUBLIC_SUPABASE_URL &amp; NEXT_PUBLIC_SUPABASE_ANON_KEY) lalu restart{" "}
      <code className="font-mono">npm run dev</code> untuk mengaktifkan login Google.
    </div>
  );
}
