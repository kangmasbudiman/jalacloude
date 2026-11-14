import { supabase } from "@/lib/supabase";
import { isDemoMode, currentUserId, lsGet, lsSet } from "@/lib/common";
import type { WalletTransaction } from "@/lib/wallet-service";

/** Transaksi dompet milik client — untuk daftar penerimaan di Admin Panel */
export type ClientPayment = WalletTransaction & {
  client?: { email: string | null; full_name: string | null } | null;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "client";
  created_at: string;
};

export type Invoice = {
  id: string;
  client_id: string;
  invoice_no: string;
  description: string;
  amount: number;
  issued_at: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  status: "sent" | "paid" | "void";
  uploaded_by: string | null;
  created_at: string;
  /** hasil join (khusus admin) */
  client?: { email: string | null; full_name: string | null } | null;
};

export type KirimInvoiceInput = {
  client_id: string;
  invoice_no: string;
  description: string;
  amount: number;
  issued_at: string;
  file: File;
};

const LS_INVOICES = "invoices";
const BUCKET = "invoices";

function uid(): string {
  return crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Role akun yang sedang login ('client' bila belum punya profil) */
export async function getMyRole(): Promise<"admin" | "client"> {
  if (isDemoMode || !supabase) {
    return (lsGet<string>("role", "client") as "admin" | "client") ?? "client";
  }
  const userId = await currentUserId();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return (data?.role as "admin" | "client") ?? "client";
}

/** Daftar klien (khusus admin) */
export async function listClients(): Promise<Profile[]> {
  if (isDemoMode || !supabase) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "client")
    .order("full_name", { ascending: true });
  if (error) throw new Error(`Gagal memuat daftar klien: ${error.message}`);
  return (data ?? []) as Profile[];
}

/** Semua invoice + data klien (khusus admin) */
export async function listAllInvoices(): Promise<Invoice[]> {
  if (isDemoMode || !supabase) {
    return lsGet<Invoice[]>(LS_INVOICES, []);
  }
  const { data, error } = await supabase
    .from("invoices")
    .select("*, client:client_id (email, full_name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Gagal memuat invoice: ${error.message}`);
  return (data ?? []) as Invoice[];
}

/** Invoice milik klien yang sedang login */
export async function listMyInvoices(): Promise<Invoice[]> {
  if (isDemoMode || !supabase) {
    const me = await currentUserId();
    return lsGet<Invoice[]>(LS_INVOICES, []).filter((i) => i.client_id === me);
  }
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("issued_at", { ascending: false });
  if (error) throw new Error(`Gagal memuat invoice: ${error.message}`);
  return (data ?? []) as Invoice[];
}

/** Admin mengirim invoice: upload file + simpan metadata */
export async function kirimInvoice(input: KirimInvoiceInput): Promise<void> {
  const ext = input.file.name.split(".").pop()?.toLowerCase() || "pdf";

  if (isDemoMode || !supabase) {
    const fileUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(input.file);
    });
    const inv: Invoice = {
      id: uid(),
      client_id: input.client_id,
      invoice_no: input.invoice_no,
      description: input.description,
      amount: input.amount,
      issued_at: input.issued_at,
      file_path: fileUrl,
      file_name: input.file.name,
      mime_type: input.file.type,
      status: "sent",
      uploaded_by: "demo",
      created_at: new Date().toISOString(),
    };
    lsSet(LS_INVOICES, [inv, ...lsGet<Invoice[]>(LS_INVOICES, [])]);
    return;
  }

  const safeNo = input.invoice_no.replace(/[^a-zA-Z0-9-_]/g, "-");
  const path = `${input.client_id}/${safeNo}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, input.file, { contentType: input.file.type, upsert: false });
  if (uploadError) throw new Error(`Gagal mengunggah file: ${uploadError.message}`);

  const userId = await currentUserId();
  const { error } = await supabase.from("invoices").insert({
    client_id: input.client_id,
    invoice_no: input.invoice_no,
    description: input.description,
    amount: input.amount,
    issued_at: input.issued_at,
    file_path: path,
    file_name: input.file.name,
    mime_type: input.file.type,
    status: "sent",
    uploaded_by: userId,
  });

  if (error) {
    // bersihkan file yatim bila metadata gagal disimpan
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    throw new Error(`Gagal menyimpan invoice: ${error.message}`);
  }
}

/** Hapus invoice (admin) */
export async function hapusInvoice(inv: Invoice): Promise<void> {
  if (isDemoMode || !supabase) {
    lsSet(
      LS_INVOICES,
      lsGet<Invoice[]>(LS_INVOICES, []).filter((i) => i.id !== inv.id),
    );
    return;
  }
  if (!inv.file_path.startsWith("data:")) {
    await supabase.storage.from(BUCKET).remove([inv.file_path]).catch(() => {});
  }
  const { error } = await supabase.from("invoices").delete().eq("id", inv.id);
  if (error) throw new Error(`Gagal menghapus invoice: ${error.message}`);
}

/** URL sementara untuk membuka/mengunduh file invoice */
export async function invoiceFileUrl(inv: Invoice): Promise<string> {
  if (inv.file_path.startsWith("data:")) return inv.file_path;
  if (isDemoMode || !supabase) return inv.file_path;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(inv.file_path, 60 * 10);
  if (error || !data?.signedUrl) {
    throw new Error(`Gagal membuka file: ${error?.message ?? "tidak tersedia"}`);
  }
  return data.signedUrl;
}

/** Semua transaksi dompet client (khusus admin) — daftar tagihan/pembayaran masuk */
export async function listClientPayments(): Promise<ClientPayment[]> {
  if (isDemoMode || !supabase) return [];
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`Gagal memuat pembayaran masuk: ${error.message}`);
  }
  return (data ?? []) as ClientPayment[];
}
