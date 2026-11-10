"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, Loader2, TriangleAlert, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { listDomains, sisaHari, type DomainRecord } from "@/lib/domain-service";
import { formatTanggal } from "@/lib/common";

export default function DomainListPage() {
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      setDomains(await listDomains());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-ink">Domain</h1>
          <p className="mt-1 text-sm text-copy">
            Daftar domain & orderan yang terdaftar melalui Jala Cloud.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-surface"
          >
            <RefreshCw className="size-4" /> Muat Ulang
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
            title="Fitur registrasi baru — segera"
          >
            <Plus className="size-4" /> Daftar Domain
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
      ) : domains.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white px-6 py-20 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-brand-pale text-brand">
            <Globe className="size-6" />
          </div>
          <p className="mt-4 font-medium text-ink">Belum ada domain</p>
          <p className="mt-1 max-w-xs text-sm text-copy">
            Cari dan registrasikan domain pertamamu di Jala Cloud.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((d) => {
            const sisa = sisaHari(d.expires_at);
            return (
              <Link
                key={d.id}
                href={`/dashboard/domain/${d.id}`}
                className="group relative overflow-hidden rounded-2xl border border-line bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[0_12px_32px_-14px_rgba(0,0,0,0.2)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
                <div className="flex items-start justify-between">
                  <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
                    <Globe className="size-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Aktif
                  </span>
                </div>
                <p className="mt-4 truncate font-medium text-ink group-hover:text-brand">
                  {d.domain_name}
                </p>
                <div className="mt-3 space-y-1 text-xs text-copy">
                  <p>Berakhir: {formatTanggal(d.expires_at).split(",")[0]}</p>
                  <p>
                    {sisa > 0 ? `Sisa ${sisa} hari` : "Jatuh tempo!"} ·{" "}
                    {d.auto_renew ? "Auto-renew aktif" : "Tanpa auto-renew"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
