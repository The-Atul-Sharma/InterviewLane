"use client";
import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Eye,
  Flame,
  Loader2,
  LogOut,
  Target,
  Zap,
} from "lucide-react";
import { useUserStore } from "@/lib/store/userState";
import type { CategoryMeta, QuestionMeta } from "@/lib/schema/question";
import type { RepoStats } from "@/lib/repository";
import type { PrepPlan } from "@/lib/schema/roadmap";
import { DSA_SLUG_PREFIX, leetcodeSlugKey, type GrindQuestion } from "@/lib/dsaTypes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AuthGate } from "@/components/authGate";
import { useAuth } from "@/components/providers/authProvider";
import { useDashboardActivity, type ActivityEvent } from "./useActivity";

const WEEKLY_GOAL = 10;

export function DashboardClient(props: {
  pool: QuestionMeta[];
  stats: RepoStats;
  categories: CategoryMeta[];
  dsaPool: GrindQuestion[];
  plans: PrepPlan[];
}) {
  return (
    <AuthGate
      title="Sign in to see your dashboard"
      description="Progress, streak, and recently viewed are tracked against your account."
    >
      <Inner {...props} />
    </AuthGate>
  );
}

function Inner({
  pool,
  stats,
  categories,
  dsaPool,
  plans,
}: {
  pool: QuestionMeta[];
  stats: RepoStats;
  categories: CategoryMeta[];
  dsaPool: GrindQuestion[];
  plans: PrepPlan[];
}) {
  const { user, signOut } = useAuth();
  const completed = useUserStore((s) => s.completed);
  const bookmarks = useUserStore((s) => s.bookmarks);
  const recent = useUserStore((s) => s.recentlyViewed);
  const streak = useUserStore((s) => s.streak);
  const planProgress = useUserStore((s) => s.planProgress);
  const hydrated = useUserStore((s) => s.hydrated);
  const loading = useUserStore((s) => s.loading);
  // Defer the activity query until the store has hydrated - otherwise we'd
  // race the AuthProvider's hydrate() with our own select on the same tables.
  const activity = useDashboardActivity(hydrated && !loading);

  const questionMap = React.useMemo(() => new Map(pool.map((q) => [q.slug, q])), [pool]);
  const dsaMap = React.useMemo(
    () => new Map(dsaPool.map((q) => [leetcodeSlugKey(q.slug), q])),
    [dsaPool],
  );

  if (!hydrated || loading) {
    return (
      <Card className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your data…
      </Card>
    );
  }

  // ─── derived counts ────────────────────────────────────────────────
  const completedSet = new Set(completed);
  const completedByCat = pool.reduce<Record<string, number>>((acc, q) => {
    if (completedSet.has(q.slug)) acc[q.category] = (acc[q.category] ?? 0) + 1;
    return acc;
  }, {});
  const grind75Slugs = new Set(
    dsaPool.filter((q) => q.inGrind75).map((q) => leetcodeSlugKey(q.slug)),
  );
  const dsaCompleted = completed.filter((s) => grind75Slugs.has(s)).length;
  if (dsaCompleted > 0) completedByCat["dsa-algorithms-75"] = dsaCompleted;

  const totalPool = pool.length + grind75Slugs.size;
  const totalCompleted =
    completed.filter((s) => !s.startsWith(DSA_SLUG_PREFIX)).length + dsaCompleted;
  const overall = totalPool === 0 ? 0 : Math.round((totalCompleted / totalPool) * 100);

  // Greeting
  const hour = new Date().getHours();
  const timeOfDay = hour < 5 ? "Hello" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const displayName = (user?.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name
    ?? (user?.user_metadata as { name?: string } | undefined)?.name
    ?? (user?.email ? user.email.split("@")[0].replace(/[._-]+/g, " ") : "there");

  // Weekly delta + goal
  const thisWk = activity.completionsThisWeek;
  const prevWk = activity.completionsPrevWeek;
  const goalLeft = Math.max(0, WEEKLY_GOAL - thisWk);

  // Roadmap completion
  const planDoneCount = (slug: string) =>
    new Set(planProgress.filter((p) => p.planSlug === slug).map((p) => p.dayNum)).size;

  // Bookmark items to surface
  const bookmarkItems = bookmarks
    .map((s) => questionMap.get(s) ?? dsaMap.get(s))
    .filter((q): q is QuestionMeta | GrindQuestion => !!q)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ─── Greeting + actions ─────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Dashboard
          </p>
          <h1 className="mt-1 truncate text-3xl font-semibold tracking-tight sm:text-4xl">
            {timeOfDay}, <span className="capitalize">{displayName}</span>.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {thisWk === 0 ? (
              <>No sessions this week yet. Start one to get on the board.</>
            ) : goalLeft > 0 ? (
              <>
                You&apos;ve practiced{" "}
                <span className="font-medium text-foreground">{thisWk}</span>{" "}
                {thisWk === 1 ? "question" : "questions"} this week.{" "}
                <span className="font-medium text-foreground">{goalLeft}</span> more to hit your goal of {WEEKLY_GOAL}.
              </>
            ) : (
              <>
                Goal hit:{" "}
                <span className="font-medium text-foreground">{thisWk}</span>{" "}
                {thisWk === 1 ? "question" : "questions"} this week.
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {streak.days > 0 && (
            <Badge variant="warning" size="md" className="gap-1.5">
              <Flame className="h-3.5 w-3.5" />
              {streak.days} day streak
            </Badge>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/daily">
              <Zap className="mr-1.5 h-3.5 w-3.5" /> Daily challenge
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/plans">
              Continue plan
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* ─── KPI row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi
          icon={CheckCircle2}
          tone="success"
          label="Completed"
          value={totalCompleted}
          sub={
            activity.loading ? "-" : deltaLabel(thisWk - prevWk, "this wk vs last")
          }
        />
        <Kpi
          icon={Bookmark}
          label="Bookmarks"
          value={bookmarks.length}
          sub={
            activity.loading
              ? "-"
              : activity.bookmarksThisWeek > 0
              ? `+${activity.bookmarksThisWeek} this wk`
              : "Saved for later"
          }
        />
        <Kpi
          icon={Flame}
          tone="warning"
          label="Day streak"
          value={streak.days}
          sub={streak.lastDate ? `Last: ${formatShortDate(streak.lastDate)}` : "Practice today"}
        />
        <Kpi
          icon={Target}
          tone="brand"
          label="Overall"
          value={`${overall}%`}
          sub={`${totalCompleted} / ${totalPool}`}
        />
      </div>

      {/* ─── Activity heatmap + Daily challenge ────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Practice activity</h2>
              <p className="text-xs text-muted-foreground">
                Last 26 weeks · {activity.loading ? "…" : `${activity.totalSessions} sessions`}
              </p>
            </div>
          </div>
          <Heatmap
            matrix={activity.heatmap}
            startWeek={activity.heatmapStart}
            loading={activity.loading}
          />
        </Card>

        <DailyChallengeCard streakDays={streak.days} />
      </div>

      {/* ─── Roadmap + Bookmarks + Recent activity ─────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Roadmap completion */}
        <Card className="p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Plan progress</h2>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              All plans
            </span>
          </div>
          {plans.length === 0 ? (
            <EmptyHint>No plans yet.</EmptyHint>
          ) : (
            <ul className="space-y-3">
              {plans.map((p) => {
                const done = planDoneCount(p.slug);
                const pct = p.days === 0 ? 0 : Math.round((done / p.days) * 100);
                return (
                  <li key={p.slug}>
                    <Link
                      href={`/plans/${p.slug}`}
                      className="block rounded-md transition-colors hover:bg-muted/60"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate font-medium">{p.name}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {done}/{p.days} · {pct}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-[hsl(var(--brand))] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Bookmarks revisit */}
        <Card className="p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Bookmarks · revisit</h2>
            {bookmarks.length > 0 && (
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {Math.min(5, bookmarks.length)} of {bookmarks.length}
              </span>
            )}
          </div>
          {bookmarkItems.length === 0 ? (
            <EmptyHint>
              Bookmark questions you want to come back to. They&apos;ll surface here.
            </EmptyHint>
          ) : (
            <ul className="space-y-1">
              {bookmarkItems.map((q) => {
                const slug = "slug" in q ? q.slug : "";
                const title = "title" in q ? q.title : "";
                const href =
                  "category" in q
                    ? `/questions/${slug}`
                    : `/questions/dsa-${slug}`;
                const difficulty = "difficulty" in q ? q.difficulty : null;
                return (
                  <li key={slug}>
                    <Link
                      href={href}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-muted/60"
                    >
                      <BookmarkCheck className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--brand))]" />
                      <span className="line-clamp-1 flex-1">{title}</span>
                      {difficulty && (
                        <DifficultyDot
                          level={String(difficulty).toLowerCase() as "easy" | "medium" | "hard"}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Recent activity */}
        <Card className="p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Recent activity</h2>
            <Link
              href="/bookmarks"
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {activity.loading ? (
            <EmptyHint>Loading…</EmptyHint>
          ) : activity.recent.length === 0 ? (
            <EmptyHint>Your most recent sessions will show up here.</EmptyHint>
          ) : (
            <ul className="divide-y divide-border/60">
              {activity.recent.map((e, i) => (
                <RecentRow
                  key={`${e.kind}-${e.slug}-${i}`}
                  event={e}
                  questionMap={questionMap}
                  dsaMap={dsaMap}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ─── Progress by category (kept) ───────────────────── */}
      <Card className="p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Progress by category</h2>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground tabular-nums">
            {totalCompleted} / {totalPool}
          </span>
        </div>
        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
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
                <Link key={cat.slug} href={`/categories/${cat.slug}`} className="block group">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium group-hover:text-[hsl(var(--brand))]">
                      {cat.name}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {done} / {total} · {pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
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

      {/* ─── Account footer ────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-5 py-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Signed in as</span>
          <span className="font-medium text-foreground">{user?.email}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-2 text-muted-foreground"
          onClick={() => signOut()}
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </Button>
      </div>
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "success" | "warning" | "brand";
}) {
  const iconTone =
    tone === "success"
      ? "text-[hsl(var(--success))]"
      : tone === "warning"
      ? "text-[hsl(var(--warning))]"
      : tone === "brand"
      ? "text-[hsl(var(--brand))]"
      : "text-muted-foreground";
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <Icon className={cn("h-3.5 w-3.5", iconTone)} />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {sub && (
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</p>
      )}
    </Card>
  );
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function Heatmap({
  matrix,
  startWeek,
  loading,
}: {
  matrix: number[][];
  startWeek: Date;
  loading: boolean;
}) {
  const weeks = matrix[0]?.length ?? 0;
  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  // Normalise to 4 buckets by max count in the window.
  const max = matrix.reduce((a, row) => Math.max(a, ...row), 0);
  const level = (n: number) => {
    if (n === 0) return 0;
    if (max <= 1) return 4;
    const r = n / max;
    if (r > 0.75) return 4;
    if (r > 0.5) return 3;
    if (r > 0.25) return 2;
    return 1;
  };
  const fillFor = (l: number) =>
    l === 0 ? undefined : `hsl(var(--brand) / ${[0.22, 0.42, 0.7, 1][l - 1]})`;

  // Build month labels: one label at the first column where a new month appears.
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  for (let c = 0; c < weeks; c += 1) {
    const dayInCol = new Date(startWeek);
    dayInCol.setDate(dayInCol.getDate() + c * 7);
    const m = dayInCol.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ col: c, label: MONTH_ABBR[m] });
      lastMonth = m;
    }
  }

  // Date for a given cell.
  const cellDate = (row: number, col: number) => {
    const d = new Date(startWeek);
    d.setDate(d.getDate() + col * 7 + row);
    return d;
  };

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className={cn(loading && "opacity-60")}>
      <div
        className="grid gap-[3px]"
        style={{
          gridTemplateColumns: `28px repeat(${weeks}, minmax(0, 1fr))`,
          gridTemplateRows: "14px repeat(7, minmax(0, 1fr))",
        }}
      >
        {/* top-left empty corner */}
        <div />
        {/* month header row */}
        {Array.from({ length: weeks }).map((_, c) => {
          const m = monthLabels.find((x) => x.col === c);
          return (
            <div
              key={`m-${c}`}
              className="h-[14px] text-[10px] leading-none text-muted-foreground"
            >
              {m?.label ?? ""}
            </div>
          );
        })}

        {/* day rows: label cell + 7×N grid cells */}
        {DAY_LABELS.map((day, row) => (
          <React.Fragment key={day}>
            <div className="pr-1.5 text-right text-[10px] leading-none text-muted-foreground">
              {row % 2 === 1 ? day : ""}
            </div>
            {Array.from({ length: weeks }).map((_, col) => {
              const count = matrix[row][col];
              const d = cellDate(row, col);
              const future = d > today;
              const l = level(count);
              return (
                <div
                  key={`${row}-${col}`}
                  title={
                    future
                      ? ""
                      : `${count} ${count === 1 ? "session" : "sessions"} on ${fmt(d)}`
                  }
                  className={cn(
                    "aspect-square rounded-[3px]",
                    future
                      ? "bg-transparent"
                      : l === 0
                      ? "bg-muted/70"
                      : "",
                  )}
                  style={future ? undefined : { backgroundColor: fillFor(l) }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-[10.5px] text-muted-foreground">
        <span>{fmt(startWeek)}</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <div className="h-2.5 w-2.5 rounded-[2px] bg-muted/70" />
          {[1, 2, 3, 4].map((l) => (
            <div
              key={l}
              className="h-2.5 w-2.5 rounded-[2px]"
              style={{ backgroundColor: fillFor(l) }}
            />
          ))}
          <span>More</span>
        </div>
        <span>Today</span>
      </div>
    </div>
  );
}

function DailyChallengeCard({ streakDays }: { streakDays: number }) {
  const today = new Date();
  const dateLabel = today
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
  const week = Array.from({ length: 7 }, (_, i) => i < Math.min(7, streakDays));
  return (
    <Card className="relative flex flex-col gap-3 overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[hsl(var(--warning)/0.12)] blur-2xl" />
      <div className="relative flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5 text-[hsl(var(--warning))]" />
        <span className="text-[10.5px] font-medium uppercase tracking-wider text-[hsl(var(--warning))]">
          Daily · {dateLabel}
        </span>
      </div>
      <div className="relative text-base font-semibold leading-tight tracking-tight">
        Today&apos;s challenge
      </div>
      <p className="relative text-xs text-muted-foreground">
        One curated question, fresh each day. Keep your streak alive.
      </p>
      <div className="relative mt-1 flex items-center gap-1">
        {week.map((on, i) => (
          <div
            key={i}
            className={cn(
              "flex h-6 flex-1 items-center justify-center rounded-md text-[10px] font-semibold tabular-nums",
              on
                ? "bg-[hsl(var(--warning))] text-background"
                : "bg-muted text-muted-foreground/60",
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <Button asChild size="sm" className="relative mt-1">
        <Link href="/daily">
          Take today&apos;s challenge
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </Button>
    </Card>
  );
}

function RecentRow({
  event,
  questionMap,
  dsaMap,
}: {
  event: ActivityEvent;
  questionMap: Map<string, QuestionMeta>;
  dsaMap: Map<string, GrindQuestion>;
}) {
  const q = questionMap.get(event.slug);
  const dsa = !q ? dsaMap.get(event.slug) : undefined;
  const title = q?.title ?? dsa?.title ?? event.slug;
  const href = q
    ? `/questions/${event.slug}`
    : dsa
    ? `/questions/dsa-${event.slug}`
    : "#";
  const meta = labelForEvent(event.kind);
  return (
    <li className="py-2">
      <Link
        href={href}
        className="grid grid-cols-[16px_1fr_auto] items-center gap-2 text-xs hover:text-[hsl(var(--brand))]"
      >
        <span className={cn("flex h-4 w-4 items-center justify-center", meta.tone)}>
          <meta.Icon className="h-3.5 w-3.5" />
        </span>
        <span className="line-clamp-1">
          <span className="text-muted-foreground">{meta.label} </span>
          <span className="font-medium text-foreground">{title}</span>
        </span>
        <span className="shrink-0 text-[10.5px] tabular-nums text-muted-foreground">
          {relativeTime(event.at)}
        </span>
      </Link>
    </li>
  );
}

function DifficultyDot({ level }: { level: "easy" | "medium" | "hard" }) {
  const cls =
    level === "easy"
      ? "bg-[hsl(var(--success))]"
      : level === "medium"
      ? "bg-[hsl(var(--warning))]"
      : "bg-[hsl(var(--danger))]";
  return <span className={cn("h-1.5 w-1.5 rounded-full", cls)} title={level} />;
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

// ─── helpers ──────────────────────────────────────────────────────

function labelForEvent(kind: ActivityEvent["kind"]) {
  if (kind === "completed")
    return {
      Icon: CheckCircle2,
      label: "Solved",
      tone: "text-[hsl(var(--success))]",
    };
  if (kind === "bookmarked")
    return { Icon: Bookmark, label: "Bookmarked", tone: "text-[hsl(var(--brand))]" };
  return { Icon: Eye, label: "Viewed", tone: "text-muted-foreground" };
}

function deltaLabel(delta: number, suffix: string): string {
  if (delta === 0) return `Flat ${suffix}`;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta} ${suffix}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const diff = Date.now() - then;
  const min = Math.round(diff / 60_000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  const w = Math.round(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.round(d / 30);
  return `${mo}mo ago`;
}
