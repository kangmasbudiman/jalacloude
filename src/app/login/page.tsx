"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon, Loader2, TriangleAlert } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { GoogleButton } from "@/components/google-button";

/** Sanitasi redirect — hanya izinkan path internal */
function safeRedirect(value: string | null): string {
  if (!value) return "/dashboard";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

function LoginCard() {
  const { user, loading, unconfigured, signInWithGoogle } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // sudah login → langsung ke dashboard
  useEffect(() => {
    if (!loading && user) router.replace(redirect);
  }, [loading, user, redirect, router]);

  const handleGoogle = async () => {
    setError(null);
    setStarting(true);
    try {
      const url = await signInWithGoogle(redirect);
      if (!url && !unconfigured) setError("Gagal memulai login Google. Coba lagi.");
    } catch {
      setError("Terjadi kesalahan saat login Google. Silakan coba lagi.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-surface px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 rounded-2xl border border-line bg-white p-8 pt-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
              J
            </span>
            <span className="text-lg font-semibold text-ink">Jala Cloud</span>
          </Link>
          <h2 className="mt-4 text-3xl font-medium text-ink">Selamat datang</h2>
          <p className="mt-2 text-sm text-copy">
            Masuk ke akunmu untuk melanjutkan
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-500" />
            <p className="text-xs leading-5 text-red-700">{error}</p>
          </div>
        )}

        {unconfigured && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3"
          >
            <EyeIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <p className="text-xs leading-5 text-amber-800">
              Login Google belum aktif — isi{" "}
              <code className="font-mono">.env.local</code> dengan kredensial
              Supabase milikmu terlebih dahulu (lihat panduan di README).
            </p>
          </div>
        )}

        <div className="mt-2 space-y-3">
          <GoogleButton
            onClick={handleGoogle}
            disabled={unconfigured || loading}
            loading={starting}
          />
          {starting && (
            <p className="flex items-center justify-center gap-2 text-xs text-copy">
              <Loader2 className="size-3.5 animate-spin" />
              Mengalihkan ke Google…
            </p>
          )}
        </div>

        <p className="text-center text-xs leading-relaxed text-copy">
          Dengan masuk, kamu menyetujui{" "}
          <span className="text-ink underline underline-offset-2">Syarat &amp; Ketentuan</span>{" "}
          serta{" "}
          <span className="text-ink underline underline-offset-2">Kebijakan Privasi</span> kami.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-surface">
          <Loader2 className="size-6 animate-spin text-copy" />
        </div>
      }
    >
      <LoginCard />
    </Suspense>
  );
}
