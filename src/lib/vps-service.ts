import { supabase } from "@/lib/supabase";
import { isDemoMode, currentUserId, lsGet, lsSet } from "@/lib/common";

export type VpsStatus = "running" | "stopped";

export type VpsServer = {
  id: string;
  user_id: string;
  name: string;
  plan: string;
  os: string;
  region: string;
  ip: string;
  status: VpsStatus;
  created_at: string;
};

export type CreateVpsInput = Pick<
  VpsServer,
  "name" | "plan" | "os" | "region" | "ip" | "status"
>;

function uid(): string {
  return crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** IP dummy lokal ala NAT */
function randomIp(): string {
  return `10.20.${Math.floor(Math.random() * 40 + 1)}.${Math.floor(Math.random() * 250 + 1)}`;
}

/** Ambil semua server milik pengguna (terbaru dulu) */
export async function listVps(): Promise<VpsServer[]> {
  if (isDemoMode || !supabase) {
    return lsGet<VpsServer[]>("vps", []);
  }
  const { data, error } = await supabase
    .from("vps_servers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listVps:", error.message);
    throw new Error("Gagal memuat daftar server. Pastikan skema SQL sudah dijalankan.");
  }
  return (data ?? []) as VpsServer[];
}

/** Buat server baru (ip & status diisi otomatis bila kosong) */
export async function createVps(input: CreateVpsInput): Promise<VpsServer> {
  const payload = {
    ...input,
    ip: input.ip || randomIp(),
    status: input.status ?? ("running" as VpsStatus),
  };

  if (isDemoMode || !supabase) {
    const userId = await currentUserId();
    const server: VpsServer = {
      id: uid(),
      user_id: userId,
      created_at: new Date().toISOString(),
      ...payload,
    };
    lsSet("vps", [server, ...lsGet<VpsServer[]>("vps", [])]);
    return server;
  }

  const { data, error } = await supabase
    .from("vps_servers")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("createVps:", error.message);
    throw new Error(`Gagal membuat server: ${error.message}`);
  }
  return data as VpsServer;
}

/** Ubah status server (start/stop) */
export async function setVpsStatus(id: string, status: VpsStatus): Promise<void> {
  if (isDemoMode || !supabase) {
    lsSet(
      "vps",
      lsGet<VpsServer[]>("vps", []).map((s) => (s.id === id ? { ...s, status } : s)),
    );
    return;
  }
  const { error } = await supabase
    .from("vps_servers")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(`Gagal mengubah status: ${error.message}`);
}

/** Hapus server */
export async function deleteVps(id: string): Promise<void> {
  if (isDemoMode || !supabase) {
    lsSet("vps", lsGet<VpsServer[]>("vps", []).filter((s) => s.id !== id));
    return;
  }
  const { error } = await supabase.from("vps_servers").delete().eq("id", id);
  if (error) throw new Error(`Gagal menghapus server: ${error.message}`);
}
