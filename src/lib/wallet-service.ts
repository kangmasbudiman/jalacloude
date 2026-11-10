import { supabase } from "@/lib/supabase";
import { isDemoMode, lsGet, lsSet } from "@/lib/common";

export type WalletTransaction = {
  id: string;
  user_id: string;
  /** topup = isi saldo, purchase = pembelian/pemakaian */
  kind: "topup" | "purchase";
  /** selalu positif; arah ditentukan oleh kind */
  amount: number;
  description: string;
  status: string;
  created_at: string;
};

function uid(): string {
  return crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function lsAll(): WalletTransaction[] {
  return lsGet<WalletTransaction[]>("wallet", []);
}

function lsSave(all: WalletTransaction[]) {
  lsSet("wallet", all);
}

/** Saldo saat ini = total top-up − total pembelian */
export async function getBalance(): Promise<number> {
  const txs = await listTransactions();
  return txs.reduce(
    (acc, t) => acc + (t.status === "success" ? (t.kind === "topup" ? t.amount : -t.amount) : 0),
    0,
  );
}

/** Daftar transaksi (terbaru dulu) */
export async function listTransactions(): Promise<WalletTransaction[]> {
  if (isDemoMode || !supabase) {
    return lsAll();
  }
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listTransactions:", error.message);
    throw new Error("Gagal memuat transaksi. Pastikan skema SQL sudah dijalankan.");
  }
  return (data ?? []) as WalletTransaction[];
}

/** Satu transaksi berdasarkan id (untuk halaman invoice) */
export async function getTransaction(id: string): Promise<WalletTransaction | null> {
  if (isDemoMode || !supabase) {
    return lsAll().find((t) => t.id === id) ?? null;
  }
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as WalletTransaction;
}

/** Nomor invoice yang stabil dari transaksi (INV-YYYYMMDD-XXXX) */
export function invoiceNumber(t: WalletTransaction): string {
  const d = new Date(t.created_at);
  const ymd = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("");
  return `INV-${ymd}-${t.id.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

/** Catat pengisian saldo */
export async function topUp(amount: number, description = "Pengisian saldo"): Promise<void> {
  if (amount <= 0) throw new Error("Nominal top-up harus lebih dari 0");
  await insertTx({ kind: "topup", amount, description });
}

/** Catat pembelian. return pakai throw bila saldo kurang */
export async function purchase(amount: number, description: string): Promise<void> {
  const saldo = await getBalance();
  if (saldo < amount) {
    throw new Error(`Saldo tidak cukup. Sisa saldo: Rp ${new Intl.NumberFormat("id-ID").format(saldo)} — silakan isi saldo terlebih dahulu.`);
  }
  await insertTx({ kind: "purchase", amount, description });
}

/** Refund/pembatalan pembelian: hapus supaya saldo balik (mode sederhana) */
export async function refundPurchase(descriptionPrefix: string): Promise<void> {
  if (isDemoMode || !supabase) {
    lsSave(
      lsAll().filter(
        (t) => !(t.kind === "purchase" && t.description.startsWith(descriptionPrefix)),
      ),
    );
    return;
  }
  const { error } = await supabase
    .from("wallet_transactions")
    .delete()
    .like("description", `${descriptionPrefix}%`)
    .eq("kind", "purchase");
  if (error) throw new Error(`Gagal me-refund: ${error.message}`);
}

async function insertTx(input: {
  kind: WalletTransaction["kind"];
  amount: number;
  description: string;
}): Promise<void> {
  if (isDemoMode || !supabase) {
    const tx: WalletTransaction = {
      id: uid(),
      user_id: "demo",
      status: "success",
      created_at: new Date().toISOString(),
      ...input,
    };
    lsSave([tx, ...lsAll()]);
    return;
  }
  const { error } = await supabase.from("wallet_transactions").insert(input);
  if (error) {
    console.error("insertTx:", error.message);
    throw new Error(`Gagal menyimpan transaksi: ${error.message}`);
  }
}
