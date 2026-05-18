"use client";
/**
 * Personalized "welcome back" panel rendered below the hero on the homepage.
 *
 * Renders nothing for signed-out visitors, so the homepage stays
 * network-quiet for them. For signed-in users it triggers userState
 * hydration (idempotent), then shows real streak / completed / bookmarks
 * counts with a CTA into the dashboard.
 */
import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Eye,
  Flame,
  LayoutDashboard,
  CloudUpload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/authProvider";
import { useUserStore } from "@/lib/store/userState";

export function HomeWelcomeBack({ totalPool }: { totalPool: number }) {
  const { user, loading, configured } = useAuth();
  const hydrate = useUserStore((s) => s.hydrate);
  const hydrated = useUserStore((s) => s.hydrated);
  const completed = useUserStore((s) => s.completed);
  const bookmarks = useUserStore((s) => s.bookmarks);
  const recent = useUserStore((s) => s.recentlyViewed);
  const streak = useUserStore((s) => s.streak);

  React.useEffect(() => {
    if (!loading && user) void hydrate();
  }, [loading, user, hydrate]);

  if (!configured || loading) return null;
  if (!user) return <SignedOutSyncPromo />;

  const displayName =
    (user.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name
    ?? (user.user_metadata as { name?: string } | undefined)?.name
    ?? (user.email ? user.email.split("@")[0].replace(/[._-]+/g, " ") : "there");

  const hour = new Date().getHours();
  const timeOfDay =
    hour < 5 ? "Welcome back" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const total = completed.length;
  const pct = totalPool === 0 ? 0 : Math.round((total / totalPool) * 100);

  const tiles = [
    { icon: CheckCircle2, label: "Completed", value: total.toString() },
    { icon: Flame, label: "Day streak", value: streak.days.toString() },
    { icon: Bookmark, label: "Bookmarks", value: bookmarks.length.toString() },
    { icon: Eye, label: "Overall", value: `${pct}%` },
  ];

  return (
    <section className="border-b">
      <div className="container-page py-6">
        <div className="relative overflow-hidden rounded-[14px] border bg-card">
          {/* fake browser chrome */}
          <div className="flex items-center gap-1.5 border-b bg-muted/40 px-3.5 py-2.5">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
            <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
            <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
            <div className="flex flex-1 justify-center">
              <span className="font-mono text-[11px] text-muted-foreground">
                Dashboard
              </span>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-[hsl(var(--brand))]" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Your dashboard
                </span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {timeOfDay}, <span className="capitalize">{displayName}</span>.
              </h2>
              <p className="text-sm text-muted-foreground">
                {!hydrated
                  ? "Loading your progress…"
                  : total === 0
                  ? "Pick your first question and get on the board."
                  : recent.length > 0
                  ? `You last opened ${recent.length} ${recent.length === 1 ? "question" : "questions"} recently. Jump back in.`
                  : `${total} questions down. Keep the streak alive.`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {streak.days > 0 && (
                <Badge variant="warning" size="md" className="gap-1.5">
                  <Flame className="h-3.5 w-3.5" />
                  {streak.days} day streak
                </Badge>
              )}
              <Button asChild size="sm">
                <Link href="/dashboard">
                  Open dashboard
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px border-t bg-border sm:grid-cols-4">
            {tiles.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col gap-1 bg-card px-5 py-4">
                <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
                  <Icon className="h-3 w-3" />
                  {label}
                </div>
                <span className="text-2xl font-semibold tabular-nums tracking-tight">
                  {hydrated ? value : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SignedOutSyncPromo() {
  return (
    <section className="border-b">
      <div className="container-page py-6">
        <div className="flex flex-wrap items-center gap-4 rounded-[14px] border bg-card px-5 py-4 sm:flex-nowrap">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand))]">
            <CloudUpload className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium tracking-tight">
              Sync your streak, bookmarks, and progress across devices.
            </p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Free forever. Sign in once — pick up where you left off anywhere.
            </p>
          </div>
          <Button asChild size="sm" className="shrink-0 gap-1.5">
            <Link href="/login">
              Sign in
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
