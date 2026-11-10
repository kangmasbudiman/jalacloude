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
  { icon: Server, label: "VPS Aktif", href: "/dashboard/vps", soon: "Belum ada server", key: "vps", color: "blue" },
  { icon: Wallet, label: "Saldo Dompet", href: "/dashboard/billing", soon: "Top-up nanti", key: "wallet", color: "emerald" },
  { icon: Globe, label: "Domain", href: "/dashboard/domain", soon: "Cari domain", key: "0", color: "violet" },
  { icon: Database, label: "Database", href: "/dashboard/database", soon: "Buat database", key: "0", color: "amber" },
];

/** Palet warna kartu (class harus literal agar Tailwind mendeteksinya) */
const CARD_COLORS = {
  blue: {
    tile: "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25",
    bar: "bg-gradient-to-r from-blue-500 to-indigo-600",
    arrow: "group-hover:text-blue-600",
    bg: "group-hover:bg-blue-50/40",
  },
  emerald: {
    tile: "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25",
    bar: "bg-gradient-to-r from-emerald-500 to-teal-600",
    arrow: "group-hover:text-emerald-600",
    bg: "group-hover:bg-emerald-50/40",
  },
  violet: {
    tile: "bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25",
    bar: "bg-gradient-to-r from-violet-500 to-purple-600",
    arrow: "group-hover:text-violet-600",
    bg: "group-hover:bg-violet-50/40",
  },
  amber: {
    tile: "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25",
    bar: "bg-gradient-to-r from-amber-400 to-orange-500",
    arrow: "group-hover:text-amber-600",
    bg: "group-hover:bg-amber-50/40",
  },
} as const;

/** Palet ikon untuk grid "Semua Layanan" */
const SERVICE_COLORS = [
  "bg-gradient-to-br from-blue-500 to-cyan-500",
  "bg-gradient-to-br from-violet-500 to-fuchsia-500",
  "bg-gradient-to-br from-emerald-500 to-teal-500",
  "bg-gradient-to-br from-amber-400 to-orange-500",
  "bg-gradient-to-br from-rose-500 to-pink-500",
  "bg-gradient-to-br from-cyan-500 to-sky-600",
  "bg-gradient-to-br from-indigo-500 to-blue-600",
  "bg-gradient-to-br from-lime-500 to-green-600",
  "bg-gradient-to-br from-fuchsia-500 to-purple-600",
  "bg-gradient-to-br from-orange-500 to-red-500",
  "bg-gradient-to-br from-teal-500 to-cyan-600",
  "bg-gradient-to-br from-purple-500 to-indigo-600",
  "bg-gradient-to-br from-pink-500 to-rose-600",
  "bg-gradient-to-br from-sky-500 to-blue-600",
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
    <div className="space-y-8">
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
        {STATS.map((stat) => {
          const c = CARD_COLORS[stat.color as keyof typeof CARD_COLORS];
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className={`group relative overflow-hidden rounded-2xl border border-line bg-white p-5 transition-all hover:shadow-[0_12px_36px_-12px_rgba(0,0,0,0.18)] ${c.bg}`}
            >
              <div className={`absolute inset-x-0 top-0 h-1 ${c.bar}`} />
              <div className="flex items-center justify-between">
                <div className={`grid size-10 place-items-center rounded-xl text-white ${c.tile}`}>
                  <stat.icon className="size-5" />
                </div>
                <ArrowUpRight className={`size-4 text-line transition-colors ${c.arrow}`} />
              </div>
              <p className="mt-4 text-2xl font-semibold text-ink">{statValue(stat.key)}</p>
              <p className="text-sm text-copy">{stat.label}</p>
              <p className="mt-1 text-xs text-copy/70">{stat.soon}</p>
            </Link>
          );
        })}
      </div>

      {/* Menu semua layanan */}
      <div>
        <h2 className="text-lg font-medium text-ink">Semua Layanan</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MENU_ITEMS.filter((m) => m.slug && m.slug !== "settings").map((item, i) => (
            <Link
              key={item.slug}
              href={`/dashboard/${item.slug}`}
              className="group flex items-start gap-3 rounded-2xl border border-line bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.2)]"
            >
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-md transition-transform group-hover:scale-110 ${
                  SERVICE_COLORS[i % SERVICE_COLORS.length]
                }`}
              >
                <item.icon className="size-5" />
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
