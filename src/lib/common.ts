import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Layer data dengan dua mode:
 * - "db"  : Supabase asli (butuh sesi login)
 * - "demo": localStorage — dipakai bila .env.local belum diisi
 */
export const isDemoMode = !isSupabaseConfigured;

const LS_PREFIX = "jala-";

export function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function lsSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
}

/** ID pengguna saat ini ('demo' di mode demo) */
export async function currentUserId(): Promise<string> {
  if (isDemoMode || !supabase) return "demo";
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? "anon";
}

/** Format rupiah standar aplikasi */
export function rupiah(value: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

/** Tanggal-waktu format Indonesia pendek */
export function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
