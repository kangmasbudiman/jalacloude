"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  MoreHorizontal,
  MapPin,
  Cpu,
  MemoryStick,
  HardDrive,
  Play,
  Square,
  Trash2,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import {
  listVps,
  createVps,
  setVpsStatus,
  deleteVps,
  type VpsServer,
} from "@/lib/vps-service";
import { purchase, refundPurchase, getBalance } from "@/lib/wallet-service";
import { rupiah, formatTanggal, isDemoMode } from "@/lib/common";

const VPS_PLANS = [
  { name: "Jala Mini", cpu: "1 vCPU", ram: "1 GB", disk: "20 GB NVMe", price: 350000 },
  { name: "Jala Pro", cpu: "2 vCPU", ram: "4 GB", disk: "60 GB NVMe", price: 550000, popular: true },
  { name: "Jala Max", cpu: "4 vCPU", ram: "8 GB", disk: "120 GB NVMe", price: 645000 },
];

const REGIONS = ["Jakarta", "Surabaya", "Singapura"];
const OS_OPTIONS = ["Ubuntu 24.04", "Debian 12", "AlmaLinux 9"];

export default function VpsPage() {
  const [servers, setServers] = useState<VpsServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  // wizard
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState(1);
  const [region, setRegion] = useState(0);
  const [osIndex, setOsIndex] = useState(0);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      setServers(await listVps());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createServer = async () => {
    setError(null);
    const chosen = VPS_PLANS[plan];
    const serverName = name.trim() || `jala-${Math.random().toString(36).slice(2, 6)}`;
    const description = `Pembelian VPS ${chosen.name} — ${serverName}`;

    try {
      // cek & kurangi saldo dulu
      await purchase(chosen.price, description);
      try {
        const server = await createVps({
          name: serverName,
          plan: chosen.name,
          os: OS_OPTIONS[osIndex],
          region: REGIONS[region],
          ip: "",
          status: "running",
        });
        setServers((prev) => [server, ...prev]);
      } catch (dbError) {
        // gagal simpan → kembalikan saldo
        await refundPurchase(description).catch(() => {});
        throw dbError;
      }
      setCreating(false);
      setStep(0);
      setName("");
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    }
  };

  const toggleStatus = async (s: VpsServer) => {
    setActionBusy(s.id);
    try {
      const next = s.status === "running" ? "stopped" : "running";
      await setVpsStatus(s.id, next);
      setServers((prev) =>
        prev.map((p) => (p.id === s.id ? { ...p, status: next } : p)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengubah status");
    } finally {
      setActionBusy(null);
    }
  };

  const removeServer = async (s: VpsServer) => {
    if (!confirm(`Hapus server "${s.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setActionBusy(s.id);
    try {
      await deleteVps(s.id);
      // saldo tidak otomatis balik; catat mengurangi kembali sebagai top-up prorata sederhana
      setServers((prev) => prev.filter((p) => p.id !== s.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus");
    } finally {
      setActionBusy(null);
    }
  };

  const saldoInfo = async () => {
    const saldo = await getBalance();
    alert(`Saldo saat ini: ${rupiah(saldo)}`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-ink">Cloud VPS</h1>
          <p className="mt-1 text-sm text-copy">
            Kelola semua server virtualmu di satu tempat.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={saldoInfo}
            className="hidden h-10 items-center rounded-full border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-surface sm:inline-flex"
          >
            Cek Saldo
          </button>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
          >
            <Plus className="size-4" /> Buat VPS
          </button>
        </div>
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
      ) : servers.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white px-6 py-20 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-brand-pale text-brand">
            <Plus className="size-6" />
          </div>
          <p className="mt-4 font-medium text-ink">Belum ada server</p>
          <p className="mt-1 max-w-xs text-sm text-copy">
            Buat VPS pertamamu — aktif dalam hitungan detik, tanpa kontrak.
          </p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
          >
            <Plus className="size-4" /> Buat VPS
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs uppercase tracking-wide text-copy">
              <tr>
                <th className="px-5 py-3 font-medium">Nama</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Paket</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Wilayah</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Dibuat</th>
                <th className="w-10 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {servers.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink">{s.name}</p>
                    <p className="text-xs text-copy">
                      {s.os} · {s.ip}
                    </p>
                  </td>
                  <td className="hidden px-5 py-3.5 text-copy sm:table-cell">{s.plan}</td>
                  <td className="hidden px-5 py-3.5 text-copy md:table-cell">{s.region}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        s.status === "running"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-gray-100 text-copy"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          s.status === "running" ? "bg-emerald-500" : "bg-gray-400"
                        }`}
                      />
                      {s.status === "running" ? "Berjalan" : "Berhenti"}
                    </span>
                  </td>
                  <td className="hidden px-5 py-3.5 text-copy lg:table-cell">
                    {formatTanggal(s.created_at)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="group relative">
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-copy hover:bg-surface"
                        aria-label="Menu"
                      >
                        {actionBusy === s.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="size-4" />
                        )}
                      </button>
                      <div className="absolute right-0 top-full z-10 hidden w-44 overflow-hidden rounded-xl border border-line bg-white shadow-lg group-hover:block">
                        <button
                          type="button"
                          onClick={() => toggleStatus(s)}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-ink hover:bg-surface"
                        >
                          {s.status === "running" ? (
                            <>
                              <Square className="size-4 text-amber-500" /> Hentikan
                            </>
                          ) : (
                            <>
                              <Play className="size-4 text-emerald-500" /> Nyalakan
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeServer(s)}
                          className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="size-4" /> Hapus
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog Buat VPS */}
      {creating && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setCreating(false)}
          />
          <div className="relative max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-xl">
            <h2 className="text-xl font-medium text-ink">Buat VPS Baru</h2>

            {step === 0 && (
              <div className="mt-5 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">Nama Server</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="mis. jala-web-01"
                    className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-ink">Pilih Paket</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {VPS_PLANS.map((p, i) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setPlan(i)}
                        className={`relative rounded-xl border p-4 text-left transition-colors ${
                          plan === i
                            ? "border-brand bg-brand-pale"
                            : "border-line bg-white hover:border-brand/40"
                        }`}
                      >
                        {p.popular && (
                          <span className="absolute -top-2.5 left-3 rounded-full bg-brand px-2 py-0.5 text-[10px] font-medium text-white">
                            Terpopuler
                          </span>
                        )}
                        <p className="font-medium text-ink">{p.name}</p>
                        <div className="mt-2 space-y-1 text-xs text-copy">
                          <p className="flex items-center gap-1.5">
                            <Cpu className="size-3.5" /> {p.cpu}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MemoryStick className="size-3.5" /> {p.ram} RAM
                          </p>
                          <p className="flex items-center gap-1.5">
                            <HardDrive className="size-3.5" /> {p.disk}
                          </p>
                        </div>
                        <p className="mt-3 text-sm font-semibold text-brand">
                          {rupiah(p.price)}
                          <span className="text-xs font-normal text-copy">/bln</span>
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-ink">Wilayah</p>
                  <div className="flex flex-wrap gap-2">
                    {REGIONS.map((r, i) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRegion(i)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm ${
                          region === i
                            ? "border-brand bg-brand-pale text-brand"
                            : "border-line text-copy hover:text-ink"
                        }`}
                      >
                        <MapPin className="size-3.5" /> {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-ink">Sistem Operasi</p>
                  <div className="flex flex-wrap gap-2">
                    {OS_OPTIONS.map((o, i) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setOsIndex(i)}
                        className={`rounded-full border px-3.5 py-2 text-sm ${
                          osIndex === i
                            ? "border-brand bg-brand-pale text-brand"
                            : "border-line text-copy hover:text-ink"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-line pt-4">
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-surface"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark"
                  >
                    Lanjut
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="mt-5 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">Password Root</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Pilih password kuat (min. 8 karakter)"
                    className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>

                <div className="rounded-xl bg-surface px-4 py-3 text-sm">
                  <p className="mb-1 font-medium text-ink">Ringkasan &amp; Pembayaran</p>
                  <ul className="list-inside space-y-0.5 text-xs text-copy">
                    <li>Nama: {name.trim() || "otomatis (jala-xxxx)"}</li>
                    <li>
                      Paket: {VPS_PLANS[plan].name} ({VPS_PLANS[plan].cpu},{" "}
                      {VPS_PLANS[plan].ram} RAM, {VPS_PLANS[plan].disk})
                    </li>
                    <li>
                      Wilayah: {REGIONS[region]} · OS: {OS_OPTIONS[osIndex]}
                    </li>
                    <li className="font-semibold text-ink">
                      Dibayar sekarang: {rupiah(VPS_PLANS[plan].price)}
                    </li>
                  </ul>
                </div>

                {!isDemoMode && (
                  <p className="rounded-xl bg-brand-pale px-3.5 py-2.5 text-xs text-brand">
                    Harga akan dipotong dari saldo dompetmu. Butuh saldo? buka menu{" "}
                    <strong>Dompet &amp; Tagihan</strong> untuk top-up.
                  </p>
                )}
                {isDemoMode && (
                  <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
                    Mode demo: saldo awal Rp 0 — isi dulu di menu{" "}
                    <strong>Dompet &amp; Tagihan</strong> sebelum men-deploy server.
                  </p>
                )}

                <div className="flex justify-end gap-3 border-t border-line pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-surface"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={createServer}
                    className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark"
                  >
                    Deploy Sekarang
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
