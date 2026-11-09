"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Plus,
  Server,
  Wallet,
  Globe,
  Database,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { MENU_ITEMS } from "@/lib/menu";
import { listVps } from "@/lib/vps-service";
import { getBalance } from "@/lib/wallet-service";
import { rupiah } from "@/lib/common";

const STATS = [
  { icon: Server, label: "VPS Aktif", href: "/dashboard/vps", soon: "Belum ada server", key: "vps" },
  { icon: Wallet, label: "Saldo Dompet", href: "/dashboard/billing", soon: "Top-up nanti", key: "wallet" },
  { icon: Globe, label: "Domain", href: "/dashboard/domain", soon: "Cari domain", key: "0" },
  { icon: Database, label: "Database", href: "/dashboard/database", soon: "Buat database", key: "0" },
];

export default function DashboardPage() {
  const { user, unconfigured } = useAuth();
  const [vpsCount, setVpsCount] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    listVps()
      .then((s) => setVpsCount(s.filter((x) => x.status === "running").length))
      .catch(() => setVpsCount(0));
    getBalance()
      .then(setBalance)
      .catch(() => setBalance(0));
  }, []);

  const statValue = (key: string) => {
    if (key === "vps") return vpsCount === null ? "…" : String(vpsCount);
    if (key === "wallet") return balance === null ? "…" : rupiah(balance);
    return "0";
  };

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Pengguna Demo";
  const firstName = displayName.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Sambutan */}
      <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-medium tracking-tight text-ink sm:text-3xl">
          Selamat datang, {firstName} 👋
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-copy">
          Ini ringkasan semua layanan cloudu. Mulai dari membuat VPS pertamamu
          atau jelajahi menu di sidebar — belanja dua-duanya lewat satu akun.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard/vps"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
          >
            <Plus className="size-4" /> Buat VPS
          </Link>
          <Link
            href="/dashboard/billing"
            className="inline-flex h-10 items-center rounded-full border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-surface"
          >
            Isi Saldo
          </Link>
        </div>
        {unconfigured && (
          <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Data di halaman ini masih dummy saat mode demo.
          </p>
        )}
      </div>

      {/* Statistik */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]"
          >
            <div className="flex items-center justify-between">
              <div className="grid size-9 place-items-center rounded-xl bg-brand-pale text-brand">
                <stat.icon className="size-4.5" />
              </div>
              <ArrowUpRight className="size-4 text-line transition-colors group-hover:text-brand" />
            </div>
            <p className="mt-4 text-2xl font-semibold text-ink">{statValue(stat.key)}</p>
            <p className="text-sm text-copy">{stat.label}</p>
            <p className="mt-1 text-xs text-copy/70">{stat.soon}</p>
          </Link>
        ))}
      </div>

      {/* Menu semua layanan */}
      <div>
        <h2 className="text-lg font-medium text-ink">Semua Layanan</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MENU_ITEMS.filter((m) => m.slug && m.slug !== "settings").map((item) => (
            <Link
              key={item.slug}
              href={`/dashboard/${item.slug}`}
              className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 transition-colors hover:border-brand/40"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface text-copy">
                <item.icon className="size-4.5" />
              </div>
              <div>
                <p className="font-medium text-ink">{item.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-copy">
                  {item.description || "Kelola layanan ini dari dashboard."}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
