"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading, user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) router.replace("/");
  }, [isAdmin, loading, user, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="container-page py-16 text-sm text-muted-foreground">Loading…</div>
    );
  }
  return <>{children}</>;
}
