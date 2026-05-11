"use client";
import * as React from "react";
import Link from "next/link";
import { Bookmark, CheckCircle2, Eye, Flame, Loader2, LogOut } from "lucide-react";
import { useUserStore } from "@/lib/store/user-state";
import type { CategoryMeta, QuestionMeta } from "@/lib/schema/question";
import type { RepoStats } from "@/lib/repository";
import {
  DSA_SLUG_PREFIX,
  leetcodeSlugKey,
  type GrindQuestion,
} from "@/lib/dsa-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AuthGate } from "@/components/auth-gate";
import { useAuth } from "@/components/providers/auth-provider";

export function DashboardClient({
  pool,
  stats,
  categories,
  dsaPool,
}: {
  pool: QuestionMeta[];
  stats: RepoStats;
  categories: CategoryMeta[];
  dsaPool: GrindQuestion[];
}) {
  return (
    <AuthGate
      title="Sign in to see your dashboard"
      description="Progress, streak, and recently viewed are tracked against your account."
    >
      <Inner pool={pool} stats={stats} categories={categories} dsaPool={dsaPool} />
    </AuthGate>
  );
}

function Inner({
  pool,
  stats,
  categories,
  dsaPool,
}: {
  pool: QuestionMeta[];
  stats: RepoStats;
  categories: CategoryMeta[];
  dsaPool: GrindQuestion[];
}) {
  const { user, signOut } = useAuth();
  const completed = useUserStore((s) => s.completed);
  const bookmarks = useUserStore((s) => s.bookmarks);
  const recent = useUserStore((s) => s.recentlyViewed);
  const streak = useUserStore((s) => s.streak);
  const hydrated = useUserStore((s) => s.hydrated);
  const loading = useUserStore((s) => s.loading);

  const map = React.useMemo(() => new Map(pool.map((q) => [q.slug, q])), [pool]);

  if (!hydrated || loading) {
    return (
      <Card className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your data…
      </Card>
    );
  }

  const recentItems = recent.map((s) => map.get(s)).filter((q): q is QuestionMeta => !!q);
  const completedSet = new Set(completed);
  const completedByCat = pool.reduce<Record<string, number>>((acc, q) => {
    if (completedSet.has(q.slug)) acc[q.category] = (acc[q.category] ?? 0) + 1;
    return acc;
  }, {});
  const grind75Slugs = new Set(
    dsaPool.filter((q) => q.inGrind75).map((q) => leetcodeSlugKey(q.slug)),
  );
  const dsaCompleted = completed.filter((s) => grind75Slugs.has(s)).length;
  if (dsaCompleted > 0) completedByCat["dsa-algorithms"] = dsaCompleted;

  const totalPool = pool.length + grind75Slugs.size;
  const totalCompleted =
    completed.filter((s) => !s.startsWith(DSA_SLUG_PREFIX)).length + dsaCompleted;
  const overall = totalPool === 0 ? 0 : Math.round((totalCompleted / totalPool) * 100);

  return (
    <div className="space-y-8">
      {/* Identity strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-5 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="font-medium">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
          onClick={() => signOut()}
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </Button>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          icon={CheckCircle2}
          label="Completed"
          value={totalCompleted}
          sub={`${overall}% of ${totalPool}`}
        />
        <Metric icon={Bookmark} label="Bookmarks" value={bookmarks.length} />
        <Metric
          icon={Flame}
          label="Day streak"
          value={streak.days}
          sub={streak.lastDate ?? "—"}
        />
        <Metric icon={Eye} label="Recently viewed" value={recentItems.length} />
      </div>

      {/* Progress by category */}
      <Card className="p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Progress by category</h2>
          <span className="text-xs text-muted-foreground">
            {totalCompleted} / {totalPool}
          </span>
        </div>
        <div className="space-y-3">
          {categories
            .map((c) => ({
              cat: c,
              done: completedByCat[c.slug] ?? 0,
              total: stats.byCategory[c.slug] ?? 0,
            }))
            .filter((x) => x.total > 0)
            .sort((a, b) => b.total - a.total)
            .map(({ cat, done, total }) => {
              const pct = total === 0 ? 0 : Math.round((done / total) * 100);
              return (
                <Link key={cat.slug} href={`/categories/${cat.slug}`} className="block">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-muted-foreground">
                      {done} / {total} · {pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-muted">
                    <div
                      className={cn("h-full bg-gradient-to-r transition-all", cat.accent)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
        </div>
      </Card>

      {/* Recently viewed */}
      {recentItems.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Recently viewed</h2>
          <ul className="divide-y">
            {recentItems.slice(0, 8).map((q) => (
              <li key={q.slug} className="py-2 text-sm">
                <Link
                  href={`/questions/${q.slug}`}
                  className="flex items-center justify-between gap-3 hover:underline"
                >
                  <span className="line-clamp-1">{q.title}</span>
                  <span className="shrink-0 text-xs capitalize text-muted-foreground">
                    {q.category}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}
