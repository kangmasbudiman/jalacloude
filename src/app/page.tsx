import Link from "next/link";
import {
  Server,
  Database,
  HardDrive,
  Globe,
  Mail,
  Sparkles,
  Wallet,
  Rocket,
  ShieldCheck,
  Zap,
  Headphones,
} from "lucide-react";
import { Header, ConfigNotice } from "@/components/site-header";

const PRODUCTS = [
  { icon: Server, name: "Cloud VPS", desc: "VPS KVM performa tinggi, deploy < 60 detik.", soon: false },
  { icon: Database, name: "Database", desc: "MySQL & PostgreSQL terkelola dengan backup harian.", soon: true },
  { icon: HardDrive, name: "Object Storage", desc: "Penyimpanan S3-kompatibel untuk file & media.", soon: true },
  { icon: Globe, name: "Domain", desc: "Daftarkan domain .id dan internasional.", soon: true },
  { icon: Mail, name: "Email Bisnis", desc: "Email profesional dengan domain sendiri.", soon: true },
  { icon: Sparkles, name: "AI API", desc: "Satu API key untuk berbagai model AI.", soon: true },
  { icon: Wallet, name: "Dompet Digital", desc: "Top-up, saldo, & pembayaran instan.", soon: true },
  { icon: Rocket, name: "Deploy Apps", desc: "Deploy aplikasi Docker dalam sekejap.", soon: true },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Provisioning Kilat",
    desc: "Server aktif dalam hitungan detik, bukan jam.",
  },
  {
    icon: ShieldCheck,
    title: "Keamanan Berlapis",
    desc: "Firewall, snapshot, dan proteksi DDoS bawaan.",
  },
  {
    icon: Headphones,
    title: "Dukungan 24/7",
    desc: "Tim support siap membantu kapan pun via tiket.",
  },
];

const PLANS = [
  { name: "Jala Mini", spec: "1 vCPU • 1 GB RAM • 20 GB NVMe", price: "Rp 350rb", full: "Rp 350.000", per: "/bln" },
  { name: "Jala Pro", spec: "2 vCPU • 4 GB RAM • 60 GB NVMe", price: "Rp 550rb", full: "Rp 550.000", per: "/bln", popular: true },
  { name: "Jala Max", spec: "4 vCPU • 8 GB RAM • 120 GB NVMe", price: "Rp 645rb", full: "Rp 645.000", per: "/bln" },
];

export default function LandingPage() {
  return (
    <>
      <Header />
      <ConfigNotice />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-5 pb-16 pt-20 text-center sm:px-8 md:pt-28">
          <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-copy">
            ⚡ Server aktif dalam 60 detik
          </span>
          <h1 className="max-w-[820px] text-balance text-4xl font-light leading-[1.2] tracking-tight text-ink sm:text-5xl md:text-6xl">
            Sewa Cloud VPS,{" "}
            <span className="font-medium text-brand">semudah klik tombol.</span>
          </h1>
          <p className="max-w-[620px] text-lg leading-relaxed text-copy">
            Bayar fleksibel, kelola semua layanan lewat dashboard yang bersih —
            cukup satu akun Google.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-base font-medium text-white hover:bg-brand-dark"
            >
              Masuk dengan Google
            </Link>
            <Link
              href="#produk"
              className="inline-flex h-11 items-center rounded-full border border-line bg-white px-5 text-base font-medium text-ink hover:bg-surface"
            >
              Lihat Produk
            </Link>
          </div>

          {/* Mock dashboard */}
          <div className="relative mt-8 w-full max-w-[900px]">
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_20px_60px_-15px_rgba(37,99,235,0.15)]">
              <div className="flex h-9 items-center gap-1.5 border-b border-line bg-surface px-4">
                <span className="size-2.5 rounded-full bg-red-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="grid gap-4 p-6 text-left sm:grid-cols-3">
                {[
                  { label: "VPS Aktif", value: "3 server", tone: "bg-brand-pale text-brand" },
                  { label: "Saldo Dompet", value: "Rp 750.000", tone: "bg-emerald-50 text-emerald-600" },
                  { label: "Uptime 30 hari", value: "99,98%", tone: "bg-amber-50 text-amber-600" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-line bg-white p-4">
                    <p className="text-xs text-copy">{item.label}</p>
                    <p className={`mt-2 inline-block rounded-md px-2 py-1 text-sm font-semibold ${item.tone}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
                <div className="rounded-xl border border-line bg-white p-4 sm:col-span-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">Server terbaru</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
                      ● Running
                    </span>
                  </div>
                  <div className="space-y-2 font-mono text-xs text-copy">
                    <div className="flex justify-between rounded-lg bg-surface px-3 py-2">
                      <span>jala-web-01 · Ubuntu 24.04</span>
                      <span>103.150.xx.xx · Jakarta</span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-surface px-3 py-2">
                      <span>jala-db-01 · PostgreSQL 16</span>
                      <span>103.150.xx.xx · Surabaya</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Produk */}
        <section id="produk" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <h2 className="text-center text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            Satu dashboard untuk semua kebutuhan cloud
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-copy">
            Mulai dari VPS hingga domain — semua bisa dikelola dari satu tempat.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((p) => (
              <div
                key={p.name}
                className="group rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)]"
              >
                <div className="grid size-10 place-items-center rounded-xl bg-brand-pale text-brand">
                  <p.icon className="size-5" />
                </div>
                <h3 className="mt-4 flex items-center gap-2 font-medium text-ink">
                  {p.name}
                  {p.soon && (
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-copy">
                      Segera
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-copy">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Keunggulan */}
        <section className="border-y border-line bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col gap-3">
                <f.icon className="size-6 text-brand" />
                <h3 className="font-medium text-ink">{f.title}</h3>
                <p className="text-sm leading-relaxed text-copy">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Harga */}
        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <h2 className="text-center text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            Harga transparan, tanpa biaya tersembunyi
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border bg-white p-6 ${
                  plan.popular
                    ? "border-brand shadow-[0_12px_40px_-12px_rgba(37,99,235,0.25)]"
                    : "border-line"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-0.5 text-xs font-medium text-white">
                    Terpopuler
                  </span>
                )}
                <h3 className="font-medium text-ink">{plan.name}</h3>
                <p className="mt-1 text-sm text-copy">{plan.spec}</p>
                <p className="mt-4 text-3xl font-semibold text-ink" title={plan.full}>
                  {plan.price}
                  <span className="text-base font-normal text-copy">{plan.per}</span>
                </p>
                <Link
                  href="/login"
                  className={`mt-6 inline-flex h-10 w-full items-center justify-center rounded-full text-sm font-medium ${
                    plan.popular
                      ? "bg-brand text-white hover:bg-brand-dark"
                      : "border border-line text-ink hover:bg-surface"
                  }`}
                >
                  Pesan Sekarang
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-copy sm:flex-row sm:px-8">
          <p>© 2026 CV JALA — Jala Cloud. Seluruh hak cipta dilindungi.</p>
          <div className="flex gap-5">
            <span>Syarat & Ketentuan</span>
            <span>Kebijakan Privasi</span>
          </div>
        </div>
      </footer>
    </>
  );
}
