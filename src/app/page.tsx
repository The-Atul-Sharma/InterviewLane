import Link from "next/link";
import { ArrowRight, Bolt, Calendar, Check, Flame, Play, Shuffle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, DifficultyBadge } from "@/components/ui/badge";
import { CategoryCard } from "@/components/category-card";
import { repository } from "@/lib/repository";
import { CATEGORY_LIST } from "@/lib/categories";
import { listDsaQuestions } from "@/lib/dsa-repository";
import { formatNumber } from "@/lib/utils";

export const revalidate = 3600;

const DIFFICULTY_RANK = { easy: 0, medium: 1, hard: 2 } as const;

export default async function HomePage() {
  const [stats, all, dsaQuestions] = await Promise.all([
    repository.getStats(),
    repository.listAll(),
    listDsaQuestions(),
  ]);
  stats.byCategory["dsa-algorithms-75"] = dsaQuestions.filter((q) => q.inGrind75).length;
  stats.byCategory["dsa-algorithms-169"] = dsaQuestions.length;

  const trending = all.filter((q) => q.frequency === "very-high").slice(0, 5);
  const today = new Date();
  const utcKey = `${today.getUTCFullYear()}-${today.getUTCMonth()}-${today.getUTCDate()}`;
  const seed = [...utcKey].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
  const dailyPick = all[seed % all.length];
  const featuredCategories = CATEGORY_LIST.filter((c) =>
    [
      "react",
      "javascript",
      "nextjs",
      "dsa-algorithms-75",
      "performance",
      "system-design",
      "browser-internals",
      "css",
    ].includes(c.slug),
  ).sort(
    (a, b) =>
      (stats.byCategory[b.slug] ?? 0) - (stats.byCategory[a.slug] ?? 0) ||
      a.name.localeCompare(b.name),
  );

  // Roadmap phases — derived from the question pool's difficulty mix.
  const easyDone = stats.byDifficulty.easy ?? 0;
  const mediumTotal = stats.byDifficulty.medium ?? 0;
  const hardTotal = stats.byDifficulty.hard ?? 0;
  const phases = [
    {
      phase: "easy" as const,
      subtitle: "Warm-up",
      pct: Math.min(100, easyDone * 20),
      items: ["Closures & scope", "Array methods", "Promise basics", "CSS specificity", "DOM APIs"],
    },
    {
      phase: "medium" as const,
      subtitle: "Core",
      pct: 62,
      items: [
        "Debounce / throttle",
        "useReducer patterns",
        "Event delegation",
        "Reflow vs repaint",
        "Type narrowing",
      ],
    },
    {
      phase: "hard" as const,
      subtitle: "Senior",
      pct: 14,
      items: [
        "Virtualization",
        "Custom renderer",
        "Memoization tradeoffs",
        "Concurrent UI",
        "Frontend system design",
      ],
    },
  ];

  return (
    <div className="pb-12">
      {/* ─── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="grid-bg-lines absolute inset-0 opacity-100" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full blur-[120px]"
          style={{
            background: "radial-gradient(circle, hsl(var(--brand-glow)) 0%, transparent 70%)",
          }}
        />
        <div className="container-page relative flex flex-col items-center gap-6 pb-16 pt-24 text-center sm:pt-28">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-[12px] text-muted-foreground shadow-sm">
            <Badge variant="brand" className="h-[18px] px-1.5 text-[10px]">
              ★
            </Badge>
            <span>Stop grinding. Start interviewing.</span>
            <ArrowRight className="h-3 w-3" />
          </div>

          <h1 className="max-w-[920px] text-balance text-5xl font-semibold leading-[0.98] tracking-tightest sm:text-6xl lg:text-7xl">
            Ace your frontend interview.
            <br />
            <span className="text-muted-foreground">Without the grind.</span>
          </h1>

          <p className="max-w-[600px] text-balance text-base text-muted-foreground sm:text-[17px]">
            Curated questions, structured roadmaps, and a clear path from refresher to ready.
            Practice. Reason. Ship.
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/categories">
                Start practicing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="/roadmaps">
                <Play className="h-4 w-4" />
                View roadmaps
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Stats strip ───────────────────────────────────── */}
      <section className="border-b border-t">
        <div className="container-page flex flex-nowrap justify-center gap-0 py-7">
          {[
            { v: formatNumber(stats.total), l: "curated questions" },
            { v: formatNumber(Object.keys(stats.byCategory).length), l: "categories" },
            { v: "75", l: "Blind 75 roadmap" },
          ].map((s, i) => (
            <div
              key={s.l}
              className={`flex flex-col items-center gap-1 px-4 text-center sm:px-7 ${
                i > 0 ? "border-l border-border" : ""
              }`}
            >
              <div className="text-2xl font-semibold leading-none tracking-extra-tight sm:text-[32px]">
                {s.v}
              </div>
              <span className="whitespace-nowrap font-mono text-[10px] text-muted-foreground sm:text-[11px]">
                {s.l}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Featured categories ──────────────────────────── */}
      <section className="container-page py-20">
        <SectionHeader
          eyebrow="Categories"
          title="Practice what they ask, not what's trendy."
          sub="Every interview surface, drilled into focused questions with depth and trade-offs."
        />
        <div className="mt-9 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {featuredCategories.map((c) => (
            <CategoryCard key={c.slug} cat={c} count={stats.byCategory[c.slug] ?? 0} />
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/categories">
              Browse all categories <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ─── Roadmap preview ──────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-t bg-card">
        <div className="grid-bg-dots absolute inset-0 opacity-60" aria-hidden />
        <div className="container-page relative py-20">
          <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-[540px]">
              <span className="eyebrow">BLIND 75 · FRONTEND</span>
              <h2 className="mt-2 text-[40px] font-semibold leading-[1.05] tracking-extra-tight">
                A roadmap that feels like progress, not homework.
              </h2>
              <p className="mt-2 text-[15px] leading-6 text-muted-foreground">
                Three phases, ten skills, a clear finish line. Each node unlocks when you've
                internalized the last.
              </p>
            </div>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/roadmaps">
                Open roadmap <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
            {phases.map((p) => (
              <PhaseCard key={p.phase} {...p} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trending ──────────────────────────────────────── */}
      {trending.length > 0 && (
        <section className="container-page py-20">
          <SectionHeader
            eyebrow={
              <span className="inline-flex items-center gap-1.5">
                <Flame className="h-3 w-3 text-[hsl(var(--warning))]" /> Trending this week
              </span>
            }
            title="Questions other engineers are practicing."
            sub="The highest-frequency questions across senior frontend interviews."
          />
          <div className="mx-auto mt-9 max-w-[980px] overflow-hidden rounded-[14px] border bg-card">
            {trending.map((q, i) => (
              <Link
                key={q.slug}
                href={`/questions/${q.slug}`}
                className={`grid items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/40 ${
                  i ? "border-t" : ""
                } sm:grid-cols-[40px_1fr_auto_auto_auto] sm:gap-4`}
              >
                <span className="font-mono text-[11.5px] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="text-[14px] font-medium tracking-snug">{q.title}</div>
                <DifficultyBadge level={q.difficulty} />
                <Badge variant="solid" className="hidden capitalize sm:inline-flex">
                  {q.category.replace(/-/g, " ")}
                </Badge>
                <div className="hidden items-center gap-1 text-[11.5px] text-muted-foreground sm:inline-flex">
                  <TrendingUp className="h-3 w-3 text-[hsl(var(--success))]" />
                  <span className="tabular-nums">~{q.estimatedReadingMinutes}m</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Daily challenge + shortcuts ───────────────────── */}
      {dailyPick && (
        <section className="border-t bg-card">
          <div className="container-page grid grid-cols-1 gap-8 py-20 lg:grid-cols-[1.1fr_1fr]">
            {/* Daily */}
            <div className="relative overflow-hidden rounded-[16px] border bg-background p-7">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <Bolt className="h-4 w-4 text-[hsl(var(--warning))]" />
                  <span className="eyebrow">Daily challenge</span>
                </div>
                <Badge variant="warning" className="gap-1">
                  <Flame className="h-3 w-3" /> Build a streak
                </Badge>
              </div>
              <h3 className="text-[26px] font-semibold leading-[1.15] tracking-extra-tight">
                {dailyPick.title}
              </h3>
              <p className="mt-2 max-w-[480px] text-[14px] leading-6 text-muted-foreground">
                {dailyPick.shortDescription}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <DifficultyBadge level={dailyPick.difficulty} />
                <span className="font-mono text-[11.5px] text-muted-foreground">
                  ~{dailyPick.estimatedSolvingMinutes} min
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="font-mono text-[11.5px] text-muted-foreground">
                  Reset daily at 00:00 UTC
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild className="gap-2">
                  <Link href="/daily">
                    Take the challenge <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/random">Random round</Link>
                </Button>
              </div>
            </div>

            {/* Shortcuts column */}
            <div className="flex flex-col gap-3.5">
              <span className="eyebrow">Shortcuts</span>
              <ShortcutCard
                href="/random"
                icon={Shuffle}
                title="Random Interview Mode"
                desc="Five questions sampled across categories — simulate a 60-minute round."
              />
              <ShortcutCard
                href="/plans"
                icon={Calendar}
                title="7 / 30 / 90-day plans"
                desc="Structured paths from refresher to deep prep, day-by-day."
              />
            </div>
          </div>
        </section>
      )}

      {/* ─── Final CTA ─────────────────────────────────────── */}
      <section className="container-page relative overflow-hidden py-24">
        <div className="grid-bg-lines absolute inset-0" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[120px]"
          style={{
            background: "radial-gradient(circle, hsl(var(--brand-glow)), transparent)",
          }}
        />
        <div className="relative mx-auto flex max-w-[700px] flex-col items-center gap-5 text-center">
          <h2 className="text-balance text-5xl font-semibold leading-none tracking-tightest sm:text-[56px]">
            Your next interview is closer than you think.
          </h2>
          <p className="text-[16px] text-muted-foreground">
            Start today. Skip the grind. Walk in confident.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/categories">
                Start practicing <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/roadmaps">View roadmaps</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: React.ReactNode;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mx-auto flex max-w-[720px] flex-col items-center gap-2 text-center">
      <span className="eyebrow-brand">{eyebrow}</span>
      <h2 className="text-[36px] font-semibold leading-[1.1] tracking-extra-tight">{title}</h2>
      {sub && <p className="max-w-[540px] text-[15px] leading-6 text-muted-foreground">{sub}</p>}
    </div>
  );
}

function PhaseCard({
  phase,
  subtitle,
  pct,
  items,
}: {
  phase: "easy" | "medium" | "hard";
  subtitle: string;
  pct: number;
  items: string[];
}) {
  const tone =
    phase === "easy"
      ? "hsl(var(--success))"
      : phase === "medium"
        ? "hsl(var(--warning))"
        : "hsl(var(--danger))";
  const doneCount = Math.round((items.length * pct) / 100);
  return (
    <div className="flex flex-col gap-3 rounded-[14px] border bg-background p-[18px]">
      <div className="flex items-center justify-between">
        <DifficultyBadge level={phase} />
        <span className="font-mono text-[10.5px] text-muted-foreground">{subtitle}</span>
      </div>
      <div className="text-[26px] font-semibold tabular-nums leading-none tracking-extra-tight">
        {pct}%
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: tone, boxShadow: `0 0 12px ${tone}66` }}
        />
      </div>
      <ul className="mt-1 space-y-1.5">
        {items.map((it, i) => {
          const done = i < doneCount;
          return (
            <li
              key={it}
              className={`flex items-center gap-2 text-[12.5px] ${
                done ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {done ? (
                <span
                  className="grid h-3.5 w-3.5 place-items-center rounded-full"
                  style={{ background: tone }}
                >
                  <Check className="h-2.5 w-2.5 text-background" />
                </span>
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border border-border" />
              )}
              <span>{it}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ShortcutCard({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="surface surface-hover group flex items-start gap-3.5 p-5 transition-colors"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[14px] font-semibold">
          {title}
          <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <p className="mt-1 text-[12.5px] text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}
