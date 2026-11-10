"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  TriangleAlert,
  ShieldCheck,
  Copy,
  Globe,
  RefreshCw,
} from "lucide-react";
import {
  getDomain,
  listDns,
  setAutoRenew,
  setPrivacy,
  sisaHari,
  type DnsRecord,
  type DomainRecord,
} from "@/lib/domain-service";
import { formatTanggal } from "@/lib/common";

export default function DomainDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [domain, setDomain] = useState<DomainRecord | null>(null);
  const [dns, setDns] = useState<DnsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const d = await getDomain(id);
      setDomain(d);
      if (d) setDns(await listDns(d.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleAutoRenew = async () => {
    if (!domain) return;
    setBusy(true);
    try {
      await setAutoRenew(domain.id, !domain.auto_renew);
      setDomain({ ...domain, auto_renew: !domain.auto_renew });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengubah");
    } finally {
      setBusy(false);
    }
  };

  const togglePrivacy = async () => {
    if (!domain) return;
    setBusy(true);
    try {
      await setPrivacy(domain.id, !domain.privacy_protection);
      setDomain({ ...domain, privacy_protection: !domain.privacy_protection });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengubah");
    } finally {
      setBusy(false);
    }
  };

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied(null), 1500);
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

  if (!domain) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <TriangleAlert className="size-10 text-amber-500" />
        <h1 className="mt-4 text-xl font-medium text-ink">Domain tidak ditemukan</h1>
        <Link
          href="/dashboard/domain"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
        >
          <ArrowLeft className="size-4" /> Kembali ke Daftar Domain
        </Link>
      </div>
    );
  }

  const sisa = sisaHari(domain.expires_at);
  const expired = sisa <= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/domain"
          className="inline-flex items-center gap-1.5 text-sm text-copy hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Domain
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              {domain.domain_name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  expired ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${expired ? "bg-red-500" : "bg-emerald-500"}`}
                />
                {expired ? "Kedaluwarsa" : "Aktif"}
              </span>
              <button
                type="button"
                onClick={toggleAutoRenew}
                disabled={busy}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  domain.auto_renew
                    ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    : "bg-gray-100 text-copy hover:bg-surface"
                }`}
              >
                <RefreshCw className="size-3" /> Auto-renew:{" "}
                {domain.auto_renew ? "Aktif" : "Nonaktif"}
              </button>
              <button
                type="button"
                onClick={togglePrivacy}
                disabled={busy}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  domain.privacy_protection
                    ? "bg-violet-50 text-violet-600 hover:bg-violet-100"
                    : "bg-gray-100 text-copy hover:bg-surface"
                }`}
              >
                <ShieldCheck className="size-3" /> Privasi WHOIS:{" "}
                {domain.privacy_protection ? "Terlindungi" : "Terbuka"}
              </button>
            </div>
          </div>
          {busy && <Loader2 className="size-5 animate-spin text-copy" />}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-500" />
          <p className="text-xs leading-5 text-red-700">{error}</p>
        </div>
      )}

      {/* Info pendukung */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Globe, label: "Tanggal daftar", value: formatTanggal(domain.registered_at).split(",")[0] },
          {
            icon: RefreshCw,
            label: "Berakhir",
            value: `${formatTanggal(domain.expires_at).split(",")[0]}`,
          },
          { icon: ShieldCheck, label: "Registrar", value: domain.registrar },
          {
            icon: Globe,
            label: "Nama server",
            value: domain.nameservers.join(" · "),
          },
        ].map((item, i) => (
          <div key={item.label} className="overflow-hidden rounded-2xl border border-line bg-white">
            <div
              className={`h-1 bg-gradient-to-r ${
                ["from-sky-500 to-blue-600", "from-amber-400 to-orange-500", "from-violet-500 to-purple-600", "from-emerald-500 to-teal-500"][i % 4]
              }`}
            />
            <div className="p-5">
              <div className="grid size-9 place-items-center rounded-xl bg-surface text-copy">
                <item.icon className="size-4.5" />
              </div>
              <p className="mt-3 text-xs text-copy">{item.label}</p>
              <p className="break-words text-sm font-medium text-ink">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Peringatan kedaluwarsa */}
      {!expired && sisa <= 60 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-800">
          Domain ini berakhir dalam <strong>{sisa} hari</strong>.{" "}
          {domain.auto_renew
            ? "Auto-renew aktif — akan diperpanjang otomatis."
            : "Auto-renew nonaktif — jangan lupa perpanjangan manual!"}
        </div>
      )}

      {/* Catatan DNS */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="border-b border-line bg-surface px-5 py-3.5">
          <h2 className="font-medium text-ink">Catatan DNS</h2>
          <p className="text-xs text-copy">
            Kelola arahan domain ke server di menambah, mengubah, atau menghapus record.
          </p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-copy">
            <tr>
              <th className="px-5 py-3">Jenis</th>
              <th className="px-5 py-3">Nama</th>
              <th className="px-5 py-3">Nilai</th>
              <th className="px-5 py-3">Prioritas</th>
              <th className="px-5 py-3">TTL</th>
              <th className="w-10 px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {dns.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-5 py-3">
                  <span className="inline-block rounded-md bg-brand-pale px-2 py-0.5 text-xs font-semibold text-brand">
                    {r.type}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-ink">{r.name}</td>
                <td className="flex items-center gap-1.5 px-5 py-3 font-mono text-xs text-copy">
                  <span className="break-all">{r.value}</span>
                  <button
                    type="button"
                    onClick={() => copyValue(r.value)}
                    className="shrink-0 text-copy hover:text-brand"
                    aria-label="Salin value"
                  >
                    <Copy className={copied === r.value ? "size-3 text-brand" : "size-3"} />
                  </button>
                </td>
                <td className="px-5 py-3 text-copy">{r.type === "MX" ? r.priority : "—"}</td>
                <td className="px-5 py-3 text-copy">{r.ttl}</td>
                <td className="px-5 py-3" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Catatan fitur lanjutan */}
      <div className="grid gap-4 sm:grid-cols-2">
        {["Ubah Nameserver", "Child Nameserver", "Transfer Domain", "Integrasi Email DNS"].map(
          (judul) => (
            <div
              key={judul}
              className="rounded-2xl border border-line bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{judul}</p>
                <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-copy">
                  Segera
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-copy">
                Fitur manajemen {judul.toLowerCase()} akan tersedia pada tahap integrasi
                registrar.
              </p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
