"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/authProvider";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading, user, ensureAdminChecked } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    void ensureAdminChecked().then((flag) => {
      if (cancelled) return;
      setChecked(true);
      if (!flag) router.replace("/");
    });
    return () => {
      cancelled = true;
    };
  }, [user, loading, router, ensureAdminChecked]);

  if (loading || !user || !checked || !isAdmin) {
    return (
      <div className="container-page py-16 text-sm text-muted-foreground">Loading…</div>
    );
  }
  return <>{children}</>;
}
