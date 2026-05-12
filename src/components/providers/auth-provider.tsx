"use client";
/**
 * Auth context. Subscribes to Supabase `onAuthStateChange` and exposes the
 * current user + loading state to descendants. Triggers user-state hydration
 * on sign-in and reset on sign-out.
 */
import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useUserStore } from "@/lib/store/user-state";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  configured: boolean;
}

const AuthContext = React.createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);

  const hydrate = useUserStore((s) => s.hydrate);
  const reset = useUserStore((s) => s.reset);

  React.useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const supabase = createClient();

    let cancelled = false;

    const fetchIsAdmin = async () => {
      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" });
        if (!res.ok) return false;
        const data = (await res.json()) as { isAdmin?: boolean };
        return !!data.isAdmin;
      } catch {
        return false;
      }
    };

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user) {
        hydrate();
        const admin = await fetchIsAdmin();
        if (!cancelled) setIsAdmin(admin);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (sess?.user) {
          hydrate();
          const admin = await fetchIsAdmin();
          if (!cancelled) setIsAdmin(admin);
        }
      } else if (event === "SIGNED_OUT") {
        reset();
        setIsAdmin(false);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [configured, hydrate, reset]);

  const signOut = React.useCallback(async () => {
    if (!configured) return;
    await createClient().auth.signOut();
  }, [configured]);

  const value = React.useMemo<AuthCtx>(
    () => ({ user, session, loading, isAdmin, signOut, configured }),
    [user, session, loading, isAdmin, signOut, configured],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
