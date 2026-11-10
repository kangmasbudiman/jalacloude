import { supabase } from "@/lib/supabase";
import { isDemoMode, lsGet, lsSet } from "@/lib/common";

/** Data yang dicetak ke dokumen invoice — dapat diatur dari admin panel */
export type InvoiceSettings = {
  company_name: string;
  company_sub: string;
  payee_line: string;
  bank_line: string;
  client_name: string;
  sales_name: string;
  contact_phone: string;
};

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  company_name: "InData Indonesia",
  company_sub: "CV Jaring Laba Laba",
  payee_line: "PAYMENT TO CV JALA",
  bank_line: "Mandiri 1100007267880",
  client_name: "Rumah Sakit Royal Prima Jambi",
  sales_name: "Ronel Daniel Ramdhani",
  contact_phone: "+62 812-2138-6406",
};

const LS_KEY = "invoice-settings";

/** Ambil pengaturan invoice (fallback nilai default bila belum pernah diset) */
export async function getInvoiceSettings(): Promise<InvoiceSettings> {
  if (isDemoMode || !supabase) {
    return lsGet<InvoiceSettings>(LS_KEY, DEFAULT_INVOICE_SETTINGS);
  }
  const { data, error } = await supabase
    .from("invoice_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return DEFAULT_INVOICE_SETTINGS;
  }
  const { id: _id, updated_at: _u, ...rest } = data;
  return rest as InvoiceSettings;
}

/** Simpan pengaturan invoice (upsert baris tunggal) */
export async function saveInvoiceSettings(
  value: InvoiceSettings,
): Promise<void> {
  if (isDemoMode || !supabase) {
    lsSet(LS_KEY, value);
    return;
  }
  const { error } = await supabase
    .from("invoice_settings")
    .upsert({ id: 1, ...value, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Gagal menyimpan pengaturan: ${error.message}`);
}
