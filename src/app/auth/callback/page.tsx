"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

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

export default function AuthCallbackPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Proses login Google gagal atau dibatalkan.");
  const targetRef = useRef("/dashboard");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Baca parameter error OAuth (jika ada)
  useEffect(() => {
    const url = new URL(window.location.href);
    const oauthError =
      url.searchParams.get("error_description") ??
      url.searchParams.get("error") ??
      url.hash.match(/error_description=([^&]+)/)?.[1];

    targetRef.current = popRedirectTarget();

    if (oauthError) {
      setStatus("error");
      setMessage(
        decodeURIComponent(oauthError).replace(/\+/g, " ") ||
          "Proses login Google gagal atau dibatalkan.",
      );
      return;
    }

    // 2. Jatuhkan ke error bila pertukaran kode PKCE tidak selesai dalam 15 detik
    timeoutRef.current = setTimeout(() => {
      setStatus("error");
      setMessage(
        "Login melebihi batas waktu. Pastikan Redirect URL http://localhost:3000/auth/callback sudah terdaftar di Supabase.",
      );
    }, 15000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // 3. Sesi berhasil didapat → sukses lalu pindah ke tujuan
  useEffect(() => {
    if (loading || status === "error") return;
    if (user && status !== "success") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setStatus("success");
      const t = setTimeout(() => router.replace(targetRef.current), 800);
      return () => clearTimeout(t);
    }
  }, [user, loading, status, router]);

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
