import { supabase } from "@/lib/supabase";
import { isDemoMode, lsGet, lsSet } from "@/lib/common";

export type DomainStatus = "active" | "expired" | "pending" | "transfer";

export type DomainRecord = {
  id: string;
  user_id: string;
  domain_name: string;
  status: DomainStatus;
  registrar: string;
  registered_at: string;
  expires_at: string;
  auto_renew: boolean;
  privacy_protection: boolean;
  transfer_lock: boolean;
  nameservers: string[];
  created_at: string;
};

export type DnsRecord = {
  id: string;
  domain_id: string;
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV" | "CAA";
  name: string;
  value: string;
  priority: number;
  ttl: number;
};

const LS_DOMAINS = "domains";
const LS_DNS = "domain-dns";

function uid(): string {
  return crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Daftar domain milik pengguna */
export async function listDomains(): Promise<DomainRecord[]> {
  if (isDemoMode || !supabase) {
    return lsGet<DomainRecord[]>(LS_DOMAINS, []);
  }
  const { data, error } = await supabase
    .from("domains")
    .select("*")
    .order("domain_name", { ascending: true });

  if (error) {
    console.error("listDomains:", error.message);
    throw new Error("Gagal memuat domain. Pastikan supabase/domains.sql sudah dijalankan.");
  }
  return (data ?? []) as DomainRecord[];
}

/** Satu domain berdasarkan id */
export async function getDomain(id: string): Promise<DomainRecord | null> {
  if (isDemoMode || !supabase) {
    return lsGet<DomainRecord[]>(LS_DOMAINS, []).find((d) => d.id === id) ?? null;
  }
  const { data, error } = await supabase
    .from("domains")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as DomainRecord;
}

/** Catatan DNS sebuah domain */
export async function listDns(domainId: string): Promise<DnsRecord[]> {
  if (isDemoMode || !supabase) {
    return lsGet<DnsRecord[]>(LS_DNS, []).filter((r) => r.domain_id === domainId);
  }
  const { data, error } = await supabase
    .from("domain_dns_records")
    .select("*")
    .eq("domain_id", domainId)
    .order("type", { ascending: true });
  if (error) {
    console.error("listDns:", error.message);
    throw new Error("Gagal memuat catatan DNS.");
  }
  return (data ?? []) as DnsRecord[];
}

/** Toggle auto-renew */
export async function setAutoRenew(id: string, value: boolean): Promise<void> {
  if (isDemoMode || !supabase) {
    lsSet(
      LS_DOMAINS,
      lsGet<DomainRecord[]>(LS_DOMAINS, []).map((d) =>
        d.id === id ? { ...d, auto_renew: value } : d,
      ),
    );
    return;
  }
  const { error } = await supabase.from("domains").update({ auto_renew: value }).eq("id", id);
  if (error) throw new Error(`Gagal mengubah auto-renew: ${error.message}`);
}

/** Toggle perlindungan privasi WHOIS */
export async function setPrivacy(id: string, value: boolean): Promise<void> {
  if (isDemoMode || !supabase) {
    lsSet(
      LS_DOMAINS,
      lsGet<DomainRecord[]>(LS_DOMAINS, []).map((d) =>
        d.id === id ? { ...d, privacy_protection: value } : d,
      ),
    );
    return;
  }
  const { error } = await supabase.from("domains").update({ privacy_protection: value }).eq("id", id);
  if (error) throw new Error(`Gagal mengubah privasi: ${error.message}`);
}

/** Sisa hari menuju kedaluwarsa (anggota tampilan) */
export function sisaHari(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
}
