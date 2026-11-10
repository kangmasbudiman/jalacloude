"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Printer, TriangleAlert, CheckCircle2 } from "lucide-react";
import {
  getTransaction,
  invoiceNumber,
  type WalletTransaction,
} from "@/lib/wallet-service";
import { rupiah, formatTanggal } from "@/lib/common";

type profil = { nama: string; email: string } | null;

export default function InvoiceClient({ id }: { id: string }) {
  const [tx, setTx] = useState<WalletTransaction | null>(null);
  const [profil, setProfil] = useState<profil>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // transaksi + profil pembayar
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
      <div className="grid min-h-dvh place-items-center bg-surface">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="grid min-h-dvh place-items-center bg-surface px-6 text-center">
        <div>
          <TriangleAlert className="mx-auto size-10 text-amber-500" />
          <h1 className="mt-4 text-xl font-medium text-ink">Invoice tidak ditemukan</h1>
          <p className="mt-1 text-sm text-copy">
            Transaksi ini mungkin bukan milik akun yang sedang login.
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
          >
            <ArrowLeft className="size-4" /> Kembali ke Billing
          </Link>
        </div>
      </div>
    );
  }

  const adalahPembelian = tx.kind === "purchase";
  const jumlahBaris = [
    {
      uraian: tx.description,
      status: tx.status,
    },
  ];

  return (
    <div className="min-h-dvh bg-surface py-10 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl px-4">
        {/* Aksi (hilang saat dicetak) */}
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-1.5 text-sm text-copy hover:text-ink"
          >
            <ArrowLeft className="size-4" /> Dompet &amp; Tagihan
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
          >
            <Printer className="size-4" /> Cetak / Simpan PDF
          </button>
        </div>

        {/* Dokumen invoice */}
        <div className="rounded-2xl border border-line bg-white p-7 shadow-sm print:rounded-none print:border-0 print:shadow-none sm:p-10">
          {/* Kop */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-500/25">
                J
              </span>
              <div>
                <p className="text-lg font-semibold tracking-tight text-ink">Jala Cloud</p>
                <p className="text-xs text-copy">
                  CV JALA · Server aktif dalam 60 detik
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-copy">Invoice</p>
              <p className="font-mono text-sm font-semibold text-ink">
                {invoiceNumber(tx)}
              </p>
              <span
                className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  tx.status === "success"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                <CheckCircle2 className="size-3" />
                {tx.status === "success" ? "Lunas" : tx.status}
              </span>
            </div>
          </div>

          {/* Info pembayar */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-copy">Ditagihkan kepada</p>
              <p className="mt-1 font-medium text-ink">{profil?.nama ?? "Pelanggan"}</p>
              <p className="text-sm text-copy">{profil?.email ?? "-"}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs uppercase tracking-wide text-copy">Detail pembayaran</p>
              <p className="mt-1 text-sm text-ink">
                Tanggal: {formatTanggal(tx.created_at)}
              </p>
              <p className="text-sm text-copy">Metode: Saldo Dompet (terpotong otomatis)</p>
            </div>
          </div>

          {/* Rincian */}
          <div className="mt-8 overflow-hidden rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-copy">
                <tr>
                  <th className="px-4 py-3 font-medium">Uraian</th>
                  <th className="px-4 py-3 text-right font-medium">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {jumlahBaris.map((b) => (
                  <tr key={b.uraian} className="border-t border-line">
                    <td className="px-4 py-3.5 text-ink">{b.uraian}</td>
                    <td className="px-4 py-3.5 text-right font-medium text-ink">
                      {rupiah(tx.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-line bg-surface">
                  <td className="px-4 py-3 font-semibold text-ink">
                    Total{" "}
                    <span className="font-normal text-copy">
                      ({adalahPembelian ? "pembayaran langsung dari saldo" : "pengisian saldo"})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-base font-semibold text-ink">
                    {rupiah(tx.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Catatan */}
          <p className="mt-6 text-xs leading-relaxed text-copy">
            Invoice ini adalah bukti pembayaran otomatis terbit dari sistem Jala Cloud.
            Dana dibayar langsung dari saldo dompet tanpa langkah manual. Anda dapat
            mencetak halaman ini sebagai arsip (Ctrl/Cmd + P → Save as PDF).
          </p>
          <p className="mt-4 border-t border-line pt-4 text-center text-xs text-copy">
            CV JALA · Jala Cloud · jalacloud.id
          </p>
        </div>
      </div>
    </div>
  );
}
