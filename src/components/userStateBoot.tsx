"use client";
/**
 * Triggers userState hydration on mount. Render once per page that consumes
 * the user store (dashboard, bookmarks, question detail, etc.) — pages that
 * don't read user data (home, marketing) should NOT include this so they stay
 * network-quiet for signed-in visitors.
 *
 * The store's `hydrate()` is idempotent (no-op if already hydrated/in-flight),
 * so it's safe to mount this on every applicable page.
 */
import * as React from "react";
import { useUserStore } from "@/lib/store/userState";
import { useAuth } from "@/components/providers/authProvider";

export function UserStateBoot() {
  const { user, loading } = useAuth();
  const hydrate = useUserStore((s) => s.hydrate);

  React.useEffect(() => {
    if (loading) return;
    if (!user) return;
    void hydrate();
  }, [user, loading, hydrate]);

  return null;
}
