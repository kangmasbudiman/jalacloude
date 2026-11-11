"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Square,
  Trash2,
  Loader2,
  TriangleAlert,
  Copy,
  Cpu,
  MemoryStick,
  HardDrive,
  MapPin,
  Activity,
  ShieldCheck,
  Camera,
} from "lucide-react";
import {
  listVps,
  setVpsStatus,
  deleteVps,
  type VpsServer,
} from "@/lib/vps-service";
import { rupiah, formatTanggal, isDemoMode } from "@/lib/common";
import { findPlan, planMetrics } from "@/lib/plans";

export default function VpsDetailClient({ id }: { id: string }) {
  const router = useRouter();


  const [server, setServer] = useState<VpsServer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  /** angka pemakaian dummy yang berdetak */
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    setError(null);
    try {
      const all = await listVps();
      const found = all.find((s) => s.id === id) ?? null;
      setServer(found);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    // metric dummy: perbarui setiap 3 detik
    const t = setInterval(() => setTick((n) => n + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const toggleStatus = async () => {
    if (!server) return;
    setBusy(true);
    try {
      const next = server.status === "running" ? "stopped" : "running";
      await setVpsStatus(server.id, next);
      setServer({ ...server, status: next });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengubah status");
    } finally {
      setBusy(false);
    }
  };

  const removeServer = async () => {
    if (!server || !confirm(`Hapus server "${server.name}"?`)) return;
    setBusy(true);
    try {
      await deleteVps(server.id);
      router.push("/dashboard/vps");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus");
      setBusy(false);
    }
  };

  const copyIp = async () => {
    if (!server) return;
    const addr = server.port ? `${server.ip}:${server.port}` : server.ip;
    try {
      await navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard diblokir */
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!server) {
    return (
      <div className="mx-auto max-w-2xl grid place-items-center py-24 text-center">
        <TriangleAlert className="size-10 text-amber-500" />
        <h1 className="mt-4 text-xl font-medium text-ink">Server tidak ditemukan</h1>
        <p className="mt-1 text-sm text-copy">
          Server ini mungkin sudah dihapus dari daftar.
        </p>
        <Link
          href="/dashboard/vps"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
        >
          <ArrowLeft className="size-4" /> Kembali ke Daftar VPS
        </Link>
      </div>
    );
  }

  const plan = findPlan(server.plan);
  const metrics = planMetrics(plan);
  const running = server.status === "running";

  // pemakaian dummy yang berubah tiap tick
  const cpuPct = running ? 8 + ((tick * 13) % 45) : 0;
  const ramPct = running ? 22 + ((tick * 7) % 30) : 0;
  const diskPct = 12 + metrics.diskGb * 0.4 % 40;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/vps"
          className="inline-flex items-center gap-1.5 text-sm text-copy hover:text-ink"
        >
          <ArrowLeft className="size-4" /> VPS
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-medium tracking-tight text-ink sm:text-3xl">
                {server.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  running ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-copy"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    running ? "bg-emerald-500" : "bg-gray-400"
                  }`}
                />
                {running ? "Berjalan" : "Berhenti"}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-copy">
              {server.os} · {server.region}
              <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-0.5 font-mono text-xs text-ink">
                {server.ip}
                {server.port ? `:${server.port}` : ""}
                <button
                  type="button"
                  onClick={copyIp}
                  className="text-copy hover:text-brand"
                  aria-label="Salin alamat"
                >
                  {copied ? (
                    <Copy className="size-3 text-brand" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </span>
              {server.port && (
                <span
                  className="inline-flex items-center rounded-md bg-brand-pale px-1.5 py-0.5 text-[10px] font-medium text-brand"
                  title="VPS NAT — berbagi IP publik dengan server lain, dibedakan lewat port"
                >
                  Port NAT
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggleStatus}
              disabled={busy}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-white disabled:opacity-60 ${
                running ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : running ? (
                <Square className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
              {running ? "Hentikan" : "Nyalakan"}
            </button>
            <button
              type="button"
              onClick={removeServer}
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-red-200 bg-white px-4 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 className="size-4" /> Hapus
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-500" />
          <p className="text-xs leading-5 text-red-700">{error}</p>
        </div>
      )}

      {/* Spesifikasi */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Cpu, label: "Paket", value: plan.name },
          { icon: Activity, label: "Spesifikasi", value: `${plan.cpu} · ${plan.ram} RAM` },
          { icon: MapPin, label: "Wilayah", value: server.region },
          {
            icon: HardDrive,
            label: "Dibuat",
            value: formatTanggal(server.created_at).split(",")[0],
          },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-line bg-white p-5">
            <div className="grid size-9 place-items-center rounded-xl bg-brand-pale text-brand">
              <item.icon className="size-4.5" />
            </div>
            <p className="mt-3 text-xs text-copy">{item.label}</p>
            <p className="font-medium text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Pemakaian */}
      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-ink">Pemakaian Sumber Daya</h2>
          {!running && (
            <span className="text-xs text-copy">Server berhenti — meter di-nol-kan</span>
          )}
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {[
            { label: "CPU", value: cpuPct, sub: `${metrics.cpuCount} vCore` },
            { label: "RAM", value: ramPct, sub: `${metrics.ramGb} GB terpasang` },
            { label: "Disk", value: diskPct, sub: `${metrics.diskGb} GB NVMe` },
          ].map((m) => (
            <div key={m.label}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-ink">{m.label}</span>
                <span className="text-copy">{m.value.toFixed(0)}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    m.value > 80 ? "bg-red-400" : "bg-brand"
                  }`}
                  style={{ width: `${running || m.label === "Disk" ? m.value : 0}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-copy">{m.sub}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {isDemoMode
            ? "Mode demo: data pemakaian di atas simulasi."
            : "Angka pemakaian masih simulasi — akan tersambung ke agent metrics pada integrasi nyata."}
        </p>
      </div>

      {/* Tagihan & fitur lanjutan */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-sm text-copy">Biaya bulanan</p>
          <p className="mt-1 text-xl font-semibold text-ink">
            {rupiah(plan.price)}
            <span className="text-sm font-normal text-copy">/bln</span>
          </p>
          {server.due_day && (
            <p className="mt-2 text-xs text-copy">
              Jatuh tempo tiap tanggal{" "}
              <span className="font-medium text-ink">{server.due_day}</span>
            </p>
          )}
        </div>
        {[
          { icon: Camera, title: "Snapshot", desc: "Cadangkan kondisi server dalam satu klik." },
          { icon: ShieldCheck, title: "Firewall", desc: "Atur izin port & IP yang boleh mengakses." },
        ].map((f) => (
          <div key={f.title} className="relative rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center gap-2">
              <f.icon className="size-4.5 text-copy" />
              <p className="font-medium text-ink">{f.title}</p>
              <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-copy">
                Segera
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-copy">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-medium text-ink">Konsol &amp; Log</h2>
        <p className="mt-1 text-sm text-copy">
          Akses SSH/web console dan streaming log akan dibuka pada integrasi
          provisioning nyata (Tahap berikutnya).
        </p>
      </div>
    </div>
  );
}
