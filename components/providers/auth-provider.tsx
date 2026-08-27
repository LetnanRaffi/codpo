"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient, hasSupabaseBrowserConfig } from "@/lib/supabase/client";

export interface AuthProfile {
  id: string;
  name: string;
  avatar_key: string | null;
  mode: "buyer" | "seller";
  verified: boolean;
}

interface AuthState {
  user: User | null;
  profile: AuthProfile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  setMode: (mode: "buyer" | "seller") => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(
    () => (hasSupabaseBrowserConfig() ? createClient() : null),
    [],
  );
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(() => Boolean(supabase));
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(
    async (nextUser: User | null) => {
      setUser(nextUser);
      setError(null);
      if (!supabase) {
        setProfile(null);
        setLoading(false);
        return;
      }
      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      let { data, error: profileError } = await supabase
        .from("profiles")
        .select("id,name,avatar_key,mode,verified")
        .eq("id", nextUser.id)
        .maybeSingle();
      if (!data && !profileError) {
        const fallbackName = String(nextUser.user_metadata?.name ?? nextUser.email?.split("@")[0] ?? "Pengguna Baru").trim().slice(0, 80) || "Pengguna Baru";
        const created = await supabase.from("profiles").upsert({ id: nextUser.id, name: fallbackName }, { onConflict: "id" }).select("id,name,avatar_key,mode,verified").maybeSingle();
        data = created.data;
        profileError = created.error;
      }
      if (profileError || !data) {
        setProfile(null);
        setError(profileError?.message ?? "Profil akun tidak ditemukan");
        setLoading(false);
        return;
      }
      setProfile((data as AuthProfile | null) ?? null);
      setLoading(false);
    },
    [supabase],
  );

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth
      .getUser()
      .then(({ data, error: userError }) => {
        if (userError) throw userError;
        return loadProfile(data.user);
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : "Gagal memuat sesi");
        setLoading(false);
      });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void loadProfile(session?.user ?? null);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, [loadProfile, supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
    setUser(null);
    setProfile(null);
  }, [supabase]);

  const setMode = useCallback(
    async (mode: "buyer" | "seller") => {
      if (!user || !supabase) return;
      const { error } = await supabase
        .from("profiles")
        .update({ mode })
        .eq("id", user.id);
      if (error) throw error;
      setProfile((current) => (current ? { ...current, mode } : current));
    },
    [supabase, user],
  );

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, error, signOut, setMode }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return value;
}
