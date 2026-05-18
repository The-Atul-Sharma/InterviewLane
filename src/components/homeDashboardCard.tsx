"use client";
import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/components/providers/authProvider";

/**
 * Signed-in shortcut to the dashboard, rendered inside the homepage Shortcuts
 * column. Returns null while auth is loading or for signed-out visitors so the
 * homepage stays unchanged for them.
 */
export function HomeDashboardCard() {
  const { user, loading, configured } = useAuth();
  if (!configured || loading || !user) return null;

  const displayName =
    (user.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name
    ?? (user.user_metadata as { name?: string } | undefined)?.name
    ?? (user.email ? user.email.split("@")[0] : "there");

  return (
    <Link
      href="/dashboard"
      className="surface surface-hover group flex items-start gap-3.5 p-5 transition-colors"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand))]">
        <LayoutDashboard className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[14px] font-semibold">
          Pick up where you left off
          <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <p className="mt-1 truncate text-[12.5px] text-muted-foreground">
          Streak, bookmarks, and recent activity for <span className="capitalize">{displayName}</span>.
        </p>
      </div>
    </Link>
  );
}
