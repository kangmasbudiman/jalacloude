"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Printer, TriangleAlert } from "lucide-react";
import {
  getTransaction,
  type WalletTransaction,
} from "@/lib/wallet-service";
import { formatTanggal } from "@/lib/common";

type profil = { nama: string; email: string } | null;

/** Format angka ala invoice: 350,000 */
function angka(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Bulan romawi untuk nomor invoice (spt template: 326/IDI-INV/ID/X/026) */
const ROMAWI = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** DD-Mon-YY ala template (16-Oct-26) */
function tanggalPendek(iso: string): string {
  const d = new Date(iso);
  const bln = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(d.getDate()).padStart(2, "0")}-${bln[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
}

/** Nama produk dinamis: mengikuti paket sesuai nominal transaksi */
function produkDari(amount: number, kind: string): string {
  if (kind !== "purchase") return "Top-up Saldo Dompet";
  if (amount === 350_000) return "Jala Mini — Cloud VPS Basic";
  if (amount === 550_000) return "Jala Pro — Cloud VPS Standard";
  if (amount === 645_000) return "Jala Max — Cloud VPS Pro";
  return "Cloud VPS";
}

export default function InvoiceClient({ id }: { id: string }) {
  const [tx, setTx] = useState<WalletTransaction | null>(null);
  const [profil, setProfil] = useState<profil>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const [t, u] = await Promise.all([
          getTransaction(id),
          supabase?.auth.getUser() ?? Promise.resolve({ data: null }),
        ]);
        setTx(t);
        const user = u?.data?.user;
        if (user) {
          setProfil({
            nama:
              (user.user_metadata as Record<string, string | undefined>)?.full_name ??
              user.email ??
              "Pelanggan",
            email: user.email ?? "-",
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-gray-200">
        <Loader2 className="size-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="grid min-h-dvh place-items-center bg-gray-200 px-6 text-center">
        <div>
          <TriangleAlert className="mx-auto size-10 text-amber-500" />
          <h1 className="mt-4 text-xl font-medium text-ink">Invoice tidak ditemukan</h1>
          <p className="mt-1 text-sm text-copy">
            Transaksi ini mungkin bukan milik akun yang sedang login.
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
          >
            <ArrowLeft className="size-4" /> Kembali ke Billing
          </Link>
        </div>
      </div>
    );
  }

  const purchase = tx.kind === "purchase";
  const produk = produkDari(tx.amount, tx.kind);

  // Nomor invoice ala template: {seq}/JLC-INV/ID/{bulan-romawi}/{tahun-2digit}
  const d = new Date(tx.created_at);
  const awalTahun = new Date(d.getFullYear(), 0, 1);
  const hariKe = Math.floor((d.getTime() - awalTahun.getTime()) / 86_400_000) + 1;
  const noInvoice = `${String(hariKe).padStart(3, "0")}/JLC-INV/ID/${ROMAWI[d.getMonth() + 1]}/${String(d.getFullYear()).slice(-2).padStart(3, "0")}`;

  return (
    <div className="min-h-dvh bg-gray-200 py-8 print:bg-white print:py-0">
      {/* Aksi (hilang saat dicetak) */}
      <div className="mx-auto mb-3 flex max-w-[210mm] items-center justify-between px-4 print:hidden">
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="size-4" /> Dompet &amp; Tagihan
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Printer className="size-4" /> Cetak / Simpan PDF
        </button>
      </div>

      {/* Lembar A4 */}
      <div
        className="mx-auto max-w-[210mm] bg-white px-10 py-8 text-[13px] leading-relaxed text-gray-800 shadow-lg print:min-h-dvh print:shadow-none"
        style={{ fontFamily: "ui-monospace, 'Courier New', monospace" }}
      >
        {/* ================= KOP ================= */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-4">
              {/* Monogram "ID" — gradien biru ala logo asli */}
              <svg
                viewBox="0 0 100 100"
                className="size-16 shrink-0"
                aria-label="Logo"
                role="img"
              >
                <defs>
                  <linearGradient id="logoBiru" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#5ec8f8" />
                    <stop offset="100%" stopColor="#1565c0" />
                  </linearGradient>
                </defs>
                <g fill="none" stroke="url(#logoBiru)" strokeLinecap="square">
                  {/* batang vertikal (I) */}
                  <line x1="12" y1="10" x2="12" y2="90" strokeWidth="9" />
                  <line x1="27" y1="10" x2="27" y2="52" strokeWidth="9" />
                  {/* D luar & D dalam */}
                  <path d="M42 10 H55 A40 40 0 0 1 55 90 H42" strokeWidth="9" />
                  <path d="M42 30 H54 A20 20 0 0 1 54 70 H42" strokeWidth="9" />
                </g>
              </svg>
              <div>
                <p className="text-2xl font-bold leading-7 tracking-tight text-gray-700">
                  InData
                  <br />
                  Indonesia
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">CV Jaring Laba Laba</p>
          </div>
          <p className="select-none text-4xl font-bold tracking-wide text-gray-300 print:text-gray-300">
            INVOICE
          </p>
        </div>

        {/* Tanggal & nomor (kanan, garis bawah) */}
        <div className="mt-6 ml-auto w-72 border-b border-gray-400 pb-1 text-right text-gray-700">
          {tanggalPendek(tx.created_at)}
        </div>
        <div className="mt-10 ml-auto w-72 border-b border-gray-400 pb-1 text-right text-gray-700">
          {noInvoice}
        </div>

        {/* ============ CLIENT & PAYMENT TO ============ */}
        <div className="mt-12 grid grid-cols-2 gap-10">
          <div>
            <p className="border-b border-gray-400 pb-1 text-gray-700">
              CLIENT : {profil?.nama ?? "Pelanggan"}
            </p>
            <p className="mt-8 border-b border-gray-400 pb-1 text-gray-800">{produk}</p>
          </div>
          <div>
            <p className="border-b border-gray-400 pb-1 text-center text-gray-700">
              PAYMENT TO CV JALA
            </p>
            <p className="mt-2 border-b border-gray-400 pb-1 text-center text-gray-700">
              Mandiri 1100007267880
            </p>
            <p className="mt-2 border-b border-gray-400 pb-1 text-center text-gray-400">
              &nbsp;
            </p>
          </div>
        </div>

        {/* ============ TABEL ITEM ============ */}
        <div className="mt-14">
          <table className="w-full border border-gray-400">
            <thead>
              <tr className="bg-gray-500 text-white">
                <th className="border border-gray-400 px-2 py-1.5 text-center text-sm font-semibold">
                  Phase
                </th>
                <th className="border border-gray-400 px-2 py-1.5 text-center text-sm font-semibold">
                  DESCRIPTION
                </th>
                <th className="border border-gray-400 px-2 py-1.5 text-center text-sm font-semibold">
                  QTY
                </th>
                <th className="border border-gray-400 px-2 py-1.5 text-center text-sm font-semibold">
                  UNIT PRICE
                </th>
                <th className="border border-gray-400 px-2 py-1.5 text-center text-sm font-semibold">
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 px-2 py-1.5 text-center">1</td>
                <td className="border border-gray-400 px-2 py-1.5">{tx.description}</td>
                <td className="border border-gray-400 px-2 py-1.5 text-center">1</td>
                <td className="border border-gray-400 px-2 py-1.5 text-right">
                  Rp {angka(tx.amount)}
                </td>
                <td className="border border-gray-400 px-2 py-1.5 text-right">
                  Rp {angka(tx.amount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ============ REMARKS + REKAP ============ */}
        <div className="mt-0 grid grid-cols-2 gap-10">
          {/* Kiri: remarks */}
          <div className="pt-2">
            <p className="text-gray-800">Remarks / Instructions:</p>
            <p className="mt-1 text-xs text-gray-500">
              {purchase
                ? "Pembayaran VPS secara credits (saldo dompet), langsung terpotong otomatis."
                : "Pengisian saldo dompet untuk pembayaran tagihan."}
            </p>
            <p className="mt-16 text-center text-xl tracking-widest text-gray-500">
              THANK YOU
            </p>
          </div>

          {/* Kanan: subtotal dst */}
          <div className="pt-2">
            <table className="w-full border border-gray-400">
              <tbody>
                <tr className="bg-gray-100">
                  <td className="border border-gray-400 px-2 py-1.5">SUBTOTAL</td>
                  <td className="border border-gray-400 px-2 py-1.5 text-right">
                    Rp {angka(tx.amount)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1.5">DISKON</td>
                  <td className="border border-gray-400 px-2 py-1.5 text-right">
                    &nbsp;
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1.5">ADMIN Cost</td>
                  <td className="border border-blue-300 bg-blue-200 px-2 py-1.5 text-right font-semibold">
                    Rp&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-
                  </td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="border border-gray-400 px-2 py-1.5">TOTAL</td>
                  <td className="border border-gray-400 px-2 py-1.5 text-right">
                    Rp {angka(tx.amount)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1.5 font-bold">
                    PAYMENT&nbsp; CREDITS
                  </td>
                  <td className="border border-red-300 bg-red-200 px-2 py-1.5 text-right font-semibold text-red-700">
                    Rp {angka(tx.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ============ METODE BAYAR ============ */}
        <div className="mt-8 flex items-center justify-between px-4 text-gray-600">
          {["CASH", "CREDIT CARD", "BLOCKCHAIN", "SALDO / CREDITS"].map((m) => (
            <span key={m} className="flex items-center gap-2">
              {m}
              <span
                className={`inline-block size-4 border border-gray-400 ${
                  m === "SALDO / CREDITS" ? "bg-gray-700" : "bg-gray-100"
                }`}
              />
            </span>
          ))}
        </div>
        <p className="mt-4 text-center text-sm italic text-gray-600">
          Untuk informasi lebih lanjut hubungi kontak, +62 812-2138-6406
        </p>

        {/* ============ SALES RECEIPT ============ */}
        <div className="mt-16 grid grid-cols-2 gap-10">
          <div>
            <p className="border-b border-gray-400 pb-1 text-gray-700">CLIENT</p>
            <p className="mt-2 font-bold text-gray-800">{profil?.nama ?? "Pelanggan"}</p>
            <p className="mt-1 text-xs text-gray-500">
              *Lampiran Details terlampir — {formatTanggal(tx.created_at)}
            </p>
          </div>
          <div>
            <p className="text-right text-3xl font-bold tracking-wide text-gray-300 print:text-gray-300">
              SALES RECEIPT
            </p>
            <p className="mt-6 border-b border-gray-400 pb-1 text-center text-gray-700">
              {profil?.nama ?? "CV JALA"}
            </p>
            <p className="mt-8 border-b border-gray-400 pb-1 text-center text-gray-700">
              {tanggalPendek(tx.created_at)}
            </p>
            <div className="mt-6 border-2 border-gray-500 px-6 py-5">
              <p className="flex items-baseline justify-between text-xl font-bold text-gray-700">
                <span>PAYMENT</span>
                <span>Rp&nbsp;.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{angka(tx.amount)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
