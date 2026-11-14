"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  ShieldCheck,
  TriangleAlert,
  Upload,
  FileText,
  Trash2,
  Users,
  ReceiptText,
  ExternalLink,
  Server,
  CheckCircle2,
  ArrowDownLeft,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import {
  listClients,
  listAllInvoices,
  kirimInvoice,
  hapusInvoice,
  invoiceFileUrl,
  listClientPayments,
  type ClientPayment,
  type Invoice,
  type Profile,
} from "@/lib/invoice-service";
import { listVpsOfClient, type VpsServer } from "@/lib/vps-service";
import { findPlan } from "@/lib/plans";
import { rupiah, formatTanggal } from "@/lib/common";

const ROMAWI = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** Tanggal jatuh tempo berikutnya dari due_day (1–31) */
function jatuhTempoBerikut(dueDay: number | null): string {
  if (!dueDay) return "—";
  const now = new Date();
  const awalHariIni = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const bulanIni = new Date(now.getFullYear(), now.getMonth(), dueDay);
  const target = bulanIni >= awalHariIni ? bulanIni : new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
  return target.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

/** Nomor invoice saran: {seq}/IDI-INV/ID/{bulan-romawi}/{tahun} */
function nomorBaru(urutan: number): string {
  const d = new Date();
  return `${String(urutan).padStart(3, "0")}/IDI-INV/ID/${ROMAWI[d.getMonth() + 1]}/${String(d.getFullYear()).slice(-2).padStart(3, "0")}`;
}

function tanggalHariIni(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();

  const [clients, setClients] = useState<Profile[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [orders, setOrders] = useState<VpsServer[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // form kirim invoice
  const [clientId, setClientId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(350_000);
  const [issuedAt, setIssuedAt] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // isi tanggal hari ini setelah mount (nilai waktu tidak boleh saat prerender)
  useEffect(() => {
    setIssuedAt(tanggalHariIni());
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [c, i, p] = await Promise.all([
        listClients(),
        listAllInvoices(),
        listClientPayments().catch(() => [] as ClientPayment[]),
      ]);
      setClients(c);
      setInvoices(i);
      setPayments(p);
      setInvoiceNo((prev) => prev || nomorBaru(i.length + 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) load();
    else setLoading(false);
  }, [authLoading, isAdmin, load]);

  // muat orderan (VPS) milik client terpilih
  useEffect(() => {
    if (!clientId) {
      setOrders([]);
      return;
    }
    let aktif = true;
    setOrdersLoading(true);
    listVpsOfClient(clientId)
      .then((o) => {
        if (aktif) setOrders(o);
      })
      .catch((e) => {
        if (aktif) setError(e instanceof Error ? e.message : "Gagal memuat order");
      })
      .finally(() => {
        if (aktif) setOrdersLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, [clientId]);

  /** Prefill form invoice dari order yang dipilih */
  const pilihOrder = (o: VpsServer) => {
    const plan = findPlan(o.plan);
    setDescription(`Cloud VPS ${plan.name} — ${o.os}`);
    setAmount(plan.price);
    setError(null);
    setDone(`Order "${o.name}" dipilih — tinggal lampirkan file PDF dan kirim.`);
    setTimeout(() => setDone(null), 3000);
  };

  const kirim = async () => {
    setError(null);
    setDone(null);
    if (!clientId) return setError("Pilih client terlebih dahulu.");
    if (!invoiceNo.trim()) return setError("Nomor invoice wajib diisi.");
    if (!amount || amount <= 0) return setError("Nominal harus lebih dari 0.");
    if (!file) return setError("Lampirkan file invoice (PDF/gambar).");

    setBusy(true);
    try {
      await kirimInvoice({
        client_id: clientId,
        invoice_no: invoiceNo.trim(),
        description: description.trim() || "Cloud VPS",
        amount,
        issued_at: issuedAt,
        file,
      });
      setDone("Invoice berhasil dikirim ke client.");
      setDescription("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengirim invoice");
    } finally {
      setBusy(false);
    }
  };

  const hapus = async (inv: Invoice) => {
    if (!confirm(`Hapus invoice ${inv.invoice_no}? File PDF juga akan dihapus.`)) return;
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      await hapusInvoice(inv);
      setInvoices((prev) => prev.filter((i) => i.id !== inv.id));
      setDone(`Invoice ${inv.invoice_no} berhasil dihapus.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus");
    } finally {
      setBusy(false);
    }
  };

  const buka = async (inv: Invoice) => {
    setError(null);
    try {
      const url = await invoiceFileUrl(inv);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuka file");
    }
  };

  if (authLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="grid place-items-center rounded-2xl border border-line bg-white py-24 text-center">
        <ShieldCheck className="size-10 text-copy" />
        <h1 className="mt-4 text-xl font-medium text-ink">Khusus Admin</h1>
        <p className="mt-1 max-w-sm text-sm text-copy">
          Halaman ini hanya bisa diakses akun dengan role admin.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid place-items-center rounded-2xl border border-line bg-white py-20">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-medium tracking-tight text-ink">
          <ShieldCheck className="size-6 text-brand" /> Admin Panel
        </h1>
        <p className="mt-1 text-sm text-copy">
          Kelola client dan kirim invoice ke masing-masing order/pelanggan.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-500" />
          <p className="text-xs leading-5 text-red-700">{error}</p>
        </div>
      )}
      {done && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <p className="text-xs text-emerald-700">{done}</p>
        </div>
      )}

      {/* Statistik ringkas */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Users, label: "Client", value: String(clients.length), grad: "from-sky-500 to-blue-600" },
          { icon: ReceiptText, label: "Invoice terkirim", value: String(invoices.length), grad: "from-violet-500 to-purple-600" },
          {
            icon: FileText,
            label: "Total nilai",
            value: rupiah(invoices.reduce((a, i) => a + Number(i.amount), 0)),
            grad: "from-emerald-500 to-teal-600",
          },
        ].map((s) => (
          <div key={s.label} className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className={`h-1 bg-gradient-to-r ${s.grad}`} />
            <div className="p-5">
              <div className={`grid size-9 place-items-center rounded-xl bg-gradient-to-br ${s.grad} text-white shadow-lg`}>
                <s.icon className="size-4.5" />
              </div>
              <p className="mt-3 text-xs text-copy">{s.label}</p>
              <p className="text-lg font-semibold text-ink">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Form kirim invoice */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex items-center gap-2 border-b border-line bg-surface px-5 py-3.5">
          <Upload className="size-4 text-copy" />
          <h2 className="font-medium text-ink">Kirim Invoice</h2>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="">— pilih client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name ?? c.email} ({c.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Nomor Invoice</label>
            <input
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="w-full rounded-xl border border-line px-3.5 py-2.5 font-mono text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Deskripsi Order</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="mis. Cloud VPS Jala Pro — Ubuntu Server 24.04"
              className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Nominal</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Tanggal</label>
              <input
                type="date"
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              File Invoice (PDF / gambar)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-surface"
              >
                <Upload className="size-4" /> Pilih File
              </button>
              <span className="text-xs text-copy">
                {file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : "Belum ada file dipilih"}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-line bg-surface px-5 py-3.5">
          <button
            type="button"
            onClick={kirim}
            disabled={busy}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Kirim Invoice
          </button>
        </div>
      </div>

      {/* Orderan client terpilih */}
      {clientId && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line bg-surface px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Server className="size-4 text-copy" />
              <h2 className="font-medium text-ink">Orderan Client</h2>
            </div>
            <span className="text-xs text-copy">
              {orders.length} langganan · jatuh tempo bulanan
            </span>
          </div>
          {ordersLoading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="size-5 animate-spin text-brand" />
            </div>
          ) : orders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-copy">
              Client ini belum punya orderan VPS.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-copy">
                  <tr>
                    <th className="px-5 py-3 font-medium">Server</th>
                    <th className="px-5 py-3 font-medium">Paket / OS</th>
                    <th className="px-5 py-3 font-medium">Biaya Bulanan</th>
                    <th className="px-5 py-3 font-medium">Jatuh Tempo</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const plan = findPlan(o.plan);
                    return (
                      <tr key={o.id} className="border-b border-line last:border-0">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-ink">{o.name}</p>
                          <p className="text-xs text-copy">
                            {o.ip}
                            {o.port ? `:${o.port}` : ""} · {o.status === "running" ? "Berjalan" : "Berhenti"}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-copy">
                          {o.plan} · {o.os}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-ink">{rupiah(plan.price)}</td>
                        <td className="px-5 py-3.5">
                          <p className="text-ink">Tiap tanggal {o.due_day ?? "—"}</p>
                          <p className="text-xs text-copy">Berikutnya: {jatuhTempoBerikut(o.due_day)}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() => pilihOrder(o)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-brand-pale px-3 py-1 text-xs font-medium text-brand hover:bg-brand hover:text-white"
                          >
                            <ReceiptText className="size-3.5" /> Buat Invoice
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Daftar uang masuk */}
      {(() => {
        const uangMasuk = payments.filter((p) => p.kind === "topup");
        return (
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="flex items-center justify-between border-b border-line bg-surface px-5 py-3.5">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="size-4 text-copy" />
                <h2 className="font-medium text-ink">Pembayaran Masuk</h2>
              </div>
              <span className="text-xs text-copy">{uangMasuk.length} transaksi</span>
            </div>
            {uangMasuk.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-copy">
                Belum ada pembayaran masuk dari client.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="border-b border-line text-xs uppercase tracking-wide text-copy">
                    <tr>
                      <th className="px-5 py-3 font-medium">Waktu</th>
                      <th className="px-5 py-3 font-medium">Client</th>
                      <th className="px-5 py-3 font-medium">Deskripsi</th>
                      <th className="px-5 py-3 font-medium">Nominal</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uangMasuk.map((p) => {
                      const c = clients.find((x) => x.id === p.user_id);
                      return (
                        <tr key={p.id} className="border-b border-line last:border-0">
                          <td className="whitespace-nowrap px-5 py-3.5 text-copy">
                            {formatTanggal(p.created_at)}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-ink">{c?.full_name ?? c?.email ?? "—"}</p>
                            <p className="text-xs text-copy">{c?.email}</p>
                          </td>
                          <td className="max-w-[260px] truncate px-5 py-3.5 text-copy">
                            {p.description}
                          </td>
                          <td className="px-5 py-3.5 font-medium text-emerald-600">
                            +{rupiah(p.amount)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                              {p.status === "success" ? "Berhasil" : p.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* Tabel invoice */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex items-center gap-2 border-b border-line bg-surface px-5 py-3.5">
          <ReceiptText className="size-4 text-copy" />
          <h2 className="font-medium text-ink">Invoice Terkirim</h2>
        </div>
        {invoices.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-copy">
            Belum ada invoice. Kirim invoice pertama lewat form di atas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-copy">
                <tr>
                  <th className="px-5 py-3 font-medium">No. Invoice</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Deskripsi</th>
                  <th className="px-5 py-3 font-medium">Nominal</th>
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                  <th className="px-5 py-3 font-medium">File</th>
                  <th className="w-10 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3.5 font-mono text-xs text-ink">{inv.invoice_no}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-ink">{inv.client?.full_name ?? "—"}</p>
                      <p className="text-xs text-copy">{inv.client?.email}</p>
                    </td>
                    <td className="max-w-[220px] truncate px-5 py-3.5 text-copy">
                      {inv.description}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-ink">{rupiah(Number(inv.amount))}</td>
                    <td className="px-5 py-3.5 text-copy">
                      {formatTanggal(inv.issued_at).split(",")[0]}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => buka(inv)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand-pale px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand hover:text-white"
                      >
                        <ExternalLink className="size-3.5" /> Buka
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => hapus(inv)}
                        className="rounded-lg p-1.5 text-copy hover:bg-red-50 hover:text-red-600"
                        aria-label="Hapus invoice"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daftar client */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex items-center gap-2 border-b border-line bg-surface px-5 py-3.5">
          <Users className="size-4 text-copy" />
          <h2 className="font-medium text-ink">Daftar Client</h2>
        </div>
        {clients.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-copy">
            Belum ada client. Client otomatis terdaftar saat login pertama kali.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-copy">
              <tr>
                <th className="px-5 py-3 font-medium">Nama</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Terdaftar</th>
                <th className="px-5 py-3 font-medium">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3.5 text-ink">{c.full_name ?? "—"}</td>
                  <td className="px-5 py-3.5 text-copy">{c.email}</td>
                  <td className="hidden px-5 py-3.5 text-copy sm:table-cell">
                    {formatTanggal(c.created_at).split(",")[0]}
                  </td>
                  <td className="px-5 py-3.5 text-copy">
                    {invoices.filter((i) => i.client_id === c.id).length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
