"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, TriangleAlert, ReceiptText, CheckCircle2 } from "lucide-react";
import {
  getInvoiceSettings,
  saveInvoiceSettings,
  DEFAULT_INVOICE_SETTINGS,
  type InvoiceSettings,
} from "@/lib/invoice-settings";

const FIELDS: { key: keyof InvoiceSettings; label: string; hint?: string }[] = [
  { key: "company_name", label: "Nama Perusahaan (kop invoice)" },
  { key: "company_sub", label: "Badan Usaha di bawah kop", hint: "mis. CV Jaring Laba Laba" },
  { key: "client_name", label: "Nama Client", hint: "Ditagihkan kepada — tampil 2x di invoice" },
  { key: "sales_name", label: "Nama Sales", hint: "Tanda tangan pada bagian Sales Receipt" },
  { key: "payee_line", label: "Baris Payment To" },
  { key: "bank_line", label: "Rekening Pembayaran" },
  { key: "contact_phone", label: "Kontak Informasi", hint: "di bawah pilihan metode bayar" },
];

export default function SettingsPage() {
  const [value, setValue] = useState<InvoiceSettings>(DEFAULT_INVOICE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setValue(await getInvoiceSettings());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat pengaturan");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await saveInvoiceSettings(value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-ink">Admin · Invoice</h1>
        <p className="mt-1 text-sm text-copy">
          Atur data yang tercetak pada semua invoice yang diterbitkan — berlaku instan
          untuk invoice lama maupun baru saat dibuka/dicetak ulang.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-500" />
          <p className="text-xs leading-5 text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center rounded-2xl border border-line bg-white py-20">
          <Loader2 className="size-6 animate-spin text-brand" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex items-center gap-2 border-b border-line bg-surface px-5 py-3.5">
            <ReceiptText className="size-4 text-copy" />
            <h2 className="font-medium text-ink">Data Invoice</h2>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className={f.key === "client_name" ? "sm:col-span-2" : ""}>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  {f.label}
                </label>
                <input
                  value={value[f.key]}
                  onChange={(e) => setValue({ ...value, [f.key]: e.target.value })}
                  placeholder={f.hint}
                  className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                {f.hint && <p className="mt-1 text-xs text-copy">{f.hint}</p>}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-line bg-surface px-5 py-3.5">
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="size-4" /> Tersimpan
              </span>
            )}
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Simpan Pengaturan
            </button>
          </div>
        </div>
      )}

      <p className="rounded-xl bg-brand-pale px-3.5 py-2.5 text-xs text-brand">
        Pratinjau hasilnya: buka <strong>Dompet &amp; Tagihan</strong> → klik{" "}
        <strong>Lihat</strong> pada salah satu transaksi → dokumen invoice memakai data
        di atas.
      </p>
    </div>
  );
}
