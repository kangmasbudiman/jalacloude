"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase as supabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { getMyRole } from "@/lib/invoice-service";

type AuthState = {
  /** sesi aktif (null jika belum login) */
  session: Session | null;
  user: User | null;
  /** true saat sesi sedang dipulihkan dari storage */
  loading: boolean;
  /** true jika env Supabase belum diisi */
  unconfigured: boolean;
  /** role akun: 'admin' | 'client' */
  role: "admin" | "client";
  isAdmin: boolean;
  /** mulai alur OAuth Google dan mengembalikan URL redirect yang dibuka */
  signInWithGoogle: (redirectTo?: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [role, setRole] = useState<"admin" | "client">("client");

  useEffect(() => {
    if (!supabaseClient) {
      setLoading(false);
      return;
    }

    supabaseClient.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // muat role setiap kali sesi berubah
  useEffect(() => {
    if (!session?.user) {
      setRole("client");
      return;
    }
    let aktif = true;
    getMyRole()
      .then((r) => {
        if (aktif) setRole(r);
      })
      .catch(() => {});
    return () => {
      aktif = false;
    };
  }, [session]);

  const signInWithGoogle = useCallback(async (redirectTo?: string) => {
    if (!supabaseClient) return null;

    // simpan tujuan setelah login agar halaman callback tahu ke mana harus kembali
    try {
      if (redirectTo) sessionStorage.setItem("auth-redirect", redirectTo);
      else sessionStorage.removeItem("auth-redirect");
    } catch {
      /* abaikan bila storage diblokir */
    }

    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Gagal memulai login Google:", error.message);
      return null;
    }
    return data.url ?? null;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    try {
      sessionStorage.removeItem("auth-redirect");
    } catch {
      /* abaikan */
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      unconfigured: !isSupabaseConfigured,
      role,
      isAdmin: role === "admin",
      signInWithGoogle,
      signOut,
    }),
    [session, loading, role, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}
