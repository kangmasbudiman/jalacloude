"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";

/** Ambil tujuan redirect yang disimpan halaman login sebelum OAuth dimulai */
function popRedirectTarget(): string {
  try {
    const target = sessionStorage.getItem("auth-redirect") ?? "/dashboard";
    sessionStorage.removeItem("auth-redirect");
    return target;
  } catch {
    return "/dashboard";
  }
}

/** Deskripsi ramah untuk error dari Supabase/Google */
function friendlyError(raw: string): string {
  if (/verif|code/i.test(raw)) {
    return "Kode verifikasi login tidak cocok. Ini biasanya karena halaman login dibuka ulang — silakan login lagi dari awal.";
  }
  if (/redirect/i.test(raw)) {
    return "Redirect URL belum terdaftar. Pastikan http://localhost:3000/auth/callback ada di Supabase → Authentication → URL Configuration.";
  }
  return raw;
}

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Proses login Google gagal atau dibatalkan.");
  const targetRef = useRef("/dashboard");
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      // 0. Tanpa kredensial Supabase → tidak ada yang bisa ditukar
      if (!supabase) {
        setStatus("error");
        setMessage("Supabase belum dikonfigurasi — isi .env.local terlebih dahulu.");
        return;
      }

      // 1. Deteksi error OAuth dari URL (query maupun hash)
      const url = new URL(window.location.href);
      const oauthError =
        url.searchParams.get("error_description") ??
        url.searchParams.get("error") ??
        url.hash.match(/error_description=([^&]+)/)?.[1];

      targetRef.current = popRedirectTarget();

      if (oauthError) {
        setMessage(friendlyError(decodeURIComponent(oauthError).replace(/\+/g, " ")));
        setStatus("error");
        return;
      }

      // 2. Sudah ada sesi (mis. user menekan back ke callback) → langsung sukses
      try {
        const { data: existing } = await supabase.auth.getSession();
        if (existing.session) {
          setStatus("success");
          setTimeout(() => window.location.replace(targetRef.current), 600);
          return;
        }
      } catch {
        /* lanjut ke pertukaran kode */
      }

      // 3. Kode PKCE wajib ada — tanpa ini pasti gagal acessu
      const code = url.searchParams.get("code");
      if (!code) {
        setMessage(
          "Parameter kode login tidak ditemukan di URL. Pastikan Redirect URL http://localhost:3000/auth/callback terdaftar di Supabase → Authentication → URL Configuration.",
        );
        setStatus("error");
        return;
      }

      // 4. Pertukaran kode EKSPLISIT (bukan mengandalkan deteksi otomatis)
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(friendlyError(error.message));
          setStatus("error");
          return;
        }
        const { data: afterExchange } = await supabase.auth.getSession();
        if (!afterExchange.session) {
          setMessage("Sesi tidak dapat dibuat setelah pertukaran kode. Silakan coba lagi.");
          setStatus("error");
          return;
        }
        // 5. Navigasi penuh ke tujuan — memastikan semua layout membaca sesi dari storage
        setStatus("success");
        setTimeout(() => window.location.replace(targetRef.current), 600);
      } catch (e) {
        setMessage(friendlyError(e instanceof Error ? e.message : "Kesalahan tidak diketahui"));
        setStatus("error");
      }
    };

    run();
  }, []);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4">
      <div className="max-w-md w-full space-y-6 rounded-2xl border border-line bg-white p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {status === "processing" && (
          <>
            <Loader2 className="mx-auto size-10 animate-spin text-brand" />
            <h1 className="text-xl font-medium text-ink">Memproses login…</h1>
            <p className="text-sm text-copy">
              Mohon tunggu sebentar, jangan tutup halaman ini.
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
            <h1 className="text-xl font-medium text-ink">Login berhasil!</h1>
            <p className="text-sm text-copy">Mengalihkan ke dashboard…</p>
          </>
        )}
        {status === "error" && (
          <>
            <TriangleAlert className="mx-auto size-10 text-red-500" />
            <h1 className="text-xl font-medium text-ink">Login gagal</h1>
            <p className="text-sm leading-relaxed text-copy">{message}</p>
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Coba Lagi
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
