"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  ArrowDownToLine,
  Loader2,
  TriangleAlert,
  X,
  History,
} from "lucide-react";
import {
  getBalance,
  listTransactions,
  topUp,
  type WalletTransaction,
} from "@/lib/wallet-service";
import { rupiah, formatTanggal, isDemoMode } from "@/lib/common";

const QUICK_AMOUNTS = [100_000, 250_000, 500_000, 1_000_000];

export default function BillingPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topUPModal, setTopUpModal] = useState(false);
  const [amount, setAmount] = useState<number>(250_000);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [saldo, txs] = await Promise.all([getBalance(), listTransactions()]);
      setBalance(saldo);
      setTransactions(txs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data dompet");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const doTopUp = async () => {
    setError(null);
    setBusy(true);
    try {
      await topUp(amount);
      setTopUpModal(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal top-up");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-ink">Dompet &amp; Tagihan</h1>
        <p className="mt-1 text-sm text-copy">
          Isi saldo di sini, lalu pembelian VPS otomatis dipotong dari saldo.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-500" />
          <p className="text-xs leading-5 text-red-700">{error}</p>
        </div>
      )}

      {/* Saldo */}
      <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
        <p className="text-sm text-copy">Saldo Dompet</p>
        {loading ? (
          <Loader2 className="mt-2 size-6 animate-spin text-brand" />
        ) : (
          <p className="mt-1 text-4xl font-semibold tracking-tight text-ink">
            {rupiah(balance)}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setTopUpModal(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
          >
            <Plus className="size-4" /> Isi Saldo
          </button>
          <button
            type="button"
            onClick={load}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-surface"
          >
            <ArrowDownToLine className="size-4" /> Muat Ulang
          </button>
        </div>
        {isDemoMode && (
          <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Mode demo: transaksi tersimpan di browser ini saja (localStorage).
            Konfigurasi `.env.local` + jalankan <code className="font-mono">supabase/schema.sql</code>{" "}
            untuk menyimpan di database.
          </p>
        )}
      </div>

      {/* Riwayat transaksi */}
      <div>
        <h2 className="flex items-center gap-2 text-lg font-medium text-ink">
          <History className="size-5 text-copy" /> Riwayat Transaksi
        </h2>
        {loading ? (
          <div className="grid place-items-center rounded-2xl border border-line bg-white py-16">
            <Loader2 className="size-6 animate-spin text-brand" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
            <p className="font-medium text-ink">Belum ada transaksi</p>
            <p className="mt-1 text-sm text-copy">
              Isi saldo terlebih dahulu untuk mulai berlangganan.
            </p>
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-surface text-xs uppercase tracking-wide text-copy">
                <tr>
                  <th className="px-5 py-3 font-medium">Deskripsi</th>
                  <th className="px-5 py-3 font-medium">Nominal</th>
                  <th className="hidden px-5 py-3 font-medium sm:table-cell">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`grid size-8 place-items-center rounded-full text-xs ${
                            t.kind === "topup"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                          aria-hidden
                        >
                          {t.kind === "topup" ? "+" : "−"}
                        </span>
                        <div>
                          <p className="text-ink">{t.description}</p>
                          <p className="text-xs text-copy sm:hidden">{formatTanggal(t.created_at)}</p>
                        </div>
                      </div>
                    </td>
                    <td
                      className={`px-5 py-3.5 font-medium ${
                        t.kind === "topup" ? "text-emerald-600" : "text-ink"
                      }`}
                    >
                      {t.kind === "topup" ? "+" : "−"}
                      {rupiah(t.amount)}
                    </td>
                    <td className="hidden px-5 py-3.5 text-copy sm:table-cell">
                      {formatTanggal(t.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Top-up */}
      {topUPModal && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setTopUpModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-medium text-ink">Isi Saldo</h2>
                <p className="mt-1 text-sm text-copy">
                  Pilih nominal atau masukkan sendiri.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTopUpModal(false)}
                className="rounded-lg p-1.5 text-copy hover:bg-surface"
                aria-label="Tutup"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <input
                type="number"
                min={10000}
                step={10000}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                placeholder="mis. 250000"
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-lg font-semibold outline-none placeholder:font-normal placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {QUICK_AMOUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAmount(n)}
                    className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition-colors ${
                      amount === n
                        ? "border-brand bg-brand-pale text-brand"
                        : "border-line text-copy hover:text-ink"
                    }`}
                  >
                    {n >= 1_000_000 ? `${n / 1_000_000}jt` : `${n / 1000}rb`}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-3 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setTopUpModal(false)}
                  className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-surface"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={doTopUp}
                  disabled={busy || amount < 10_000}
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                  Top-up {amount > 0 ? rupiah(amount) : ""}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
