import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** true jika env Supabase sudah diisi pengguna */
export const isSupabaseConfigured =
  supabaseUrl.startsWith("http") && supabaseAnonKey.length > 20;

/** Instance Supabase (null jika belum dikonfigurasi) */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: "pkce",
        autoRefreshToken: true,
        persistSession: true,
        // pertukaran kode PKCE ditangani manual di /auth/callback
        // (halaman callback memanggil exchangeCodeForSession secara eksplisit)
        detectSessionInUrl: false,
      },
    })
  : null;

export type SupabaseClient = NonNullable<typeof supabase>;
