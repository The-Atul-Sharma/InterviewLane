"use client";
/**
 * Auth context. Subscribes to Supabase `onAuthStateChange` and exposes the
 * current user + loading state to descendants.
 *
 * Does NOT auto-hydrate the userState store or fetch admin status on mount —
 * pages that need user data render <UserStateBoot/>, and admin status is
 * fetched lazily by <UserButton/> when the menu opens. This keeps the
 * homepage (and other marketing pages) network-quiet.
 */
import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useUserStore } from "@/lib/store/userState";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  /** Lazy admin check — fires `/api/admin/me` on first call, then caches. */
  ensureAdminChecked: () => Promise<boolean>;
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

  const reset = useUserStore((s) => s.reset);
  const adminChecked = React.useRef<Promise<boolean> | null>(null);

  const ensureAdminChecked = React.useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    if (adminChecked.current) return adminChecked.current;
    adminChecked.current = (async () => {
      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" });
        if (!res.ok) return false;
        const data = (await res.json()) as { isAdmin?: boolean };
        const flag = !!data.isAdmin;
        setIsAdmin(flag);
        return flag;
      } catch {
        return false;
      }
    })();
    return adminChecked.current;
  }, [user]);

  React.useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (event === "SIGNED_OUT") {
        reset();
        setIsAdmin(false);
        adminChecked.current = null;
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [configured, reset]);

  const signOut = React.useCallback(async () => {
    if (!configured) return;
    await createClient().auth.signOut();
  }, [configured]);

  const value = React.useMemo<AuthCtx>(
    () => ({ user, session, loading, isAdmin, ensureAdminChecked, signOut, configured }),
    [user, session, loading, isAdmin, ensureAdminChecked, signOut, configured],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
