import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  CalendarRange,
  LayoutDashboard,
  Map as MapIcon,
  Play,
  Shuffle,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, DifficultyBadge } from "@/components/ui/badge";
import { CategoryCard } from "@/components/categoryCard";
import { HomeWelcomeBack } from "@/components/homeWelcomeBack";
import { HomeDashboardPreview } from "@/components/homeDashboardPreview";
import { repository } from "@/lib/repository";
import { CATEGORY_LIST } from "@/lib/categories";
import { listDsaQuestions } from "@/lib/dsaRepository";
import { getPlans } from "@/lib/repository/roadmapRepository";

export const revalidate = 3600;

export default async function HomePage() {
  const [stats, all, dsaQuestions, plans] = await Promise.all([
    repository.getStats(),
    repository.listAll(),
    listDsaQuestions(),
    getPlans(),
  ]);
  stats.byCategory["dsa-algorithms-75"] = dsaQuestions.filter((q) => q.inGrind75).length;
  stats.byCategory["dsa-algorithms-169"] = dsaQuestions.length;

  // Daily pick rotates each day; trending rotates each ISO week.
  const today = new Date();
  const dayKey = `${today.getUTCFullYear()}-${today.getUTCMonth()}-${today.getUTCDate()}`;
  const daySeed = [...dayKey].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
  const dailyPick = all[daySeed % all.length];

  const weekKey = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const trendingPool = all.filter(
    (q) => q.frequency === "very-high" || q.frequency === "high",
  );
  const trending = pickShuffled(trendingPool, 6, weekKey);

  const HOME_CATEGORY_SLUGS = [
    "react",
    "javascript",
    "system-design",
    "performance",
    "dsa-algorithms-75",
    "browser-internals",
    "css",
    "nextjs",
    "machine-coding",
  ];
  const homeCategories = HOME_CATEGORY_SLUGS
    .map((slug) => CATEGORY_LIST.find((c) => c.slug === slug))
    .filter((c): c is (typeof CATEGORY_LIST)[number] => !!c);

  const sortedPlans = [...plans].sort((a, b) => a.days - b.days);

  const stages = [
    { num: 1, slug: "foundations", name: "Foundations", meta: "Junior screen ready", pct: 100, tone: "hsl(200 70% 65%)" },
    { num: 2, slug: "intermediate", name: "Intermediate", meta: "Mid-level ready", pct: 80, tone: "hsl(var(--success))" },
    { num: 3, slug: "advanced", name: "Advanced", meta: "Senior IC ready", pct: 55, tone: "hsl(var(--warning))" },
    { num: 4, slug: "senior", name: "Senior", meta: "Senior+ ready", pct: 20, tone: "hsl(var(--danger))" },
    { num: 5, slug: "staff", name: "Staff", meta: "Staff-loop ready", pct: 0, tone: "hsl(var(--brand))" },
  ];

  const features = [
    {
      icon: Boxes,
      tone: "brand",
      href: "/categories",
      title: "Categories",
      desc: "Interview surfaces drilled into focused questions with depth and trade-offs.",
      meta: `${Object.keys(stats.byCategory).length} categories`,
    },
    {
      icon: MapIcon,
      tone: "success",
      href: "/roadmaps",
      title: "Roadmaps",
      desc: "Stages from Foundations to Staff. Every question mapped to where it fits.",
      meta: "5 stages",
    },
    {
      icon: CalendarRange,
      tone: "warning",
      href: "/plans",
      title: "Day-by-day plans",
      desc: "7, 30, 60, 90 days. Daily rotation across surfaces with mock rounds built in.",
      meta: `${plans.length} plans`,
    },
    {
      icon: Zap,
      tone: "warning",
      href: "/daily",
      title: "Daily challenge",
      desc: "One curated question each day. Build a streak. Resets at 00:00 UTC.",
      meta: "+ streak XP",
    },
    {
      icon: LayoutDashboard,
      tone: "brand",
      href: "/dashboard",
      title: "Personal dashboard",
      desc: "GitHub-style activity heatmap, streak tracking, bookmarks, recent activity.",
      meta: "free with sign-in",
    },
    {
      icon: BookOpen,
      tone: "danger",
      href: "/resources",
      title: "Curated resources",
      desc: "Every link worth bookmarking. Tracks, references, and study plans.",
      meta: "12 tracks",
    },
  ] as const;

  return (
    <div className="pb-12">
      {/* ─── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="grid-bg-lines absolute inset-0" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[1100px] -translate-x-1/2 rounded-full blur-[140px]"
          style={{
            background: "radial-gradient(ellipse, hsl(var(--brand-glow)) 0%, transparent 70%)",
          }}
        />
        <div className="container-page relative flex flex-col items-center gap-7 pb-20 pt-24 text-center sm:pt-28">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-[12.5px] text-muted-foreground shadow-sm">
            <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-[hsl(var(--brand-soft))] text-[10px] text-[hsl(var(--brand))]">
              ★
            </span>
            <span>Stop grinding. Start interviewing.</span>
          </div>

          <h1 className="max-w-[16ch] text-balance text-5xl font-semibold leading-[0.96] tracking-tightest sm:text-6xl lg:text-7xl">
            Ace your frontend interview.{" "}
            <span className="text-muted-foreground">Without the grind.</span>
          </h1>

          <p className="max-w-[54ch] text-balance text-base text-muted-foreground sm:text-[17px]">
            Curated questions, roadmaps, and a clear path from refresher to ready.
          </p>

          <div className="flex flex-wrap justify-center gap-2.5">
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

          {/* Trust strip */}
          <div className="mt-8 flex flex-wrap justify-center gap-x-9 gap-y-2 font-mono text-[12px] text-muted-foreground">
            <span><b className="font-medium text-foreground">800+</b> questions</span>
            <span><b className="font-medium text-foreground">{Object.keys(stats.byCategory).length}</b> surfaces</span>
            <span><b className="font-medium text-foreground">{plans.length}</b> day-by-day plans</span>
            <span><b className="font-medium text-foreground">5</b> roadmap stages</span>
            <span><b className="font-medium text-foreground">100%</b> free</span>
          </div>
        </div>
      </section>

      {/* ─── Welcome back (signed-in only, small card) ──────── */}
      <HomeWelcomeBack totalPool={stats.total} />

      {/* ─── Features grid ─────────────────────────────────── */}
      <section className="container-page py-20">
        <SectionHead
          left={
            <>
              <h2 className="text-[36px] font-semibold leading-[1.05] tracking-extra-tight sm:text-[40px]">
                Everything you need, <span className="text-muted-foreground">in one place.</span>
              </h2>
              <p className="mt-3 max-w-[46ch] text-[15px] text-muted-foreground">
                From the first refresher to your final mock round. Six surfaces, all free.
              </p>
            </>
          }
        />
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* ─── Trending ──────────────────────────────────────── */}
      {trending.length > 0 && (
        <section className="border-t bg-card/40">
          <div className="container-page py-20">
            <SectionHead
              left={
                <>
                  <span className="eyebrow-brand">Trending this week</span>
                  <h2 className="mt-2 text-[36px] font-semibold leading-[1.05] tracking-extra-tight sm:text-[40px]">
                    Questions other engineers{" "}
                    <span className="text-muted-foreground">are practicing.</span>
                  </h2>
                </>
              }
              right={
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/categories">
                    Browse all <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              }
            />
            <div className="mt-8 grid grid-cols-1 gap-2.5 lg:grid-cols-2">
              {trending.map((q, i) => (
                <Link
                  key={q.slug}
                  href={`/questions/${q.slug}`}
                  className="surface surface-hover group grid grid-cols-[32px_1fr_auto] items-center gap-4 px-5 py-4"
                >
                  <span className="font-serif text-2xl italic text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium tracking-snug">{q.title}</div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[10.5px] text-muted-foreground">
                      <Badge variant="solid" className="capitalize">
                        {q.category.replace(/-/g, " ")}
                      </Badge>
                      <DifficultyBadge level={q.difficulty} />
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-[hsl(var(--success))]" />~
                        {q.estimatedReadingMinutes}m
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 transition-colors group-hover:text-foreground" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── All categories ─────────────────────────────────── */}
      <section className="container-page py-20">
        <SectionHead
          left={
            <>
              <span className="eyebrow-brand">All surfaces</span>
              <h2 className="mt-2 text-[36px] font-semibold leading-[1.05] tracking-extra-tight sm:text-[40px]">
                Practice what they ask,{" "}
                <span className="text-muted-foreground">not what&apos;s trendy.</span>
              </h2>
              <p className="mt-3 max-w-[52ch] text-[15px] leading-6 text-muted-foreground">
                Every interview surface, drilled into focused questions with depth and trade-offs.
              </p>
            </>
          }
          right={
            <Button asChild variant="outline" className="gap-2">
              <Link href="/categories">
                Browse all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {homeCategories.map((c) => (
            <CategoryCard key={c.slug} cat={c} count={stats.byCategory[c.slug] ?? 0} />
          ))}
        </div>
      </section>

      {/* ─── Roadmap stage strip ─────────────────────────── */}
      <section className="relative overflow-hidden border-y bg-card/40">
        <div className="grid-bg-dots absolute inset-0 opacity-60" aria-hidden />
        <div className="container-page relative py-20">
          <SectionHead
            left={
              <>
                <span className="eyebrow-brand">Roadmap</span>
                <h2 className="mt-2 text-[36px] font-semibold leading-[1.05] tracking-extra-tight sm:text-[40px]">
                  From foundations{" "}
                  <span className="text-muted-foreground">to staff-level.</span>
                </h2>
              </>
            }
            right={
              <Button asChild variant="outline" className="gap-2">
                <Link href="/roadmaps">
                  Open roadmap <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            }
          />
          <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {stages.map((s) => (
              <Link
                key={s.num}
                href={`/roadmaps/${s.slug}`}
                className="surface-hover flex min-h-[150px] flex-col gap-2 rounded-[14px] border bg-background p-[18px]"
              >
                <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                  Stage {s.num}
                </span>
                <h3
                  className="text-[18px] font-semibold tracking-tight"
                  style={{ color: s.tone }}
                >
                  {s.name}
                </h3>
                <span className="font-mono text-[10.5px] text-muted-foreground">{s.meta}</span>
                <div className="mt-auto h-1 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${s.pct}%`, background: s.tone }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Plans row ─────────────────────────────────────── */}
      {sortedPlans.length > 0 && (
        <section className="container-page py-20">
          <SectionHead
            left={
              <>
                <span className="eyebrow-brand">Plans</span>
                <h2 className="mt-2 text-[36px] font-semibold leading-[1.05] tracking-extra-tight sm:text-[40px]">
                  Pick your timeline.
                </h2>
              </>
            }
            right={
              <Button asChild variant="outline" className="gap-2">
                <Link href="/plans">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            }
          />
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sortedPlans.slice(0, 4).map((p, i) => {
              const popular = i === 1;
              return (
                <Link
                  key={p.slug}
                  href={`/plans/${p.slug}`}
                  className={`surface surface-hover relative flex flex-col gap-3 p-6 ${
                    popular ? "border-[hsl(var(--brand))]/60" : ""
                  }`}
                >
                  {popular && (
                    <span className="absolute -top-2 right-5 rounded-full bg-[hsl(var(--brand))] px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-white">
                      most picked
                    </span>
                  )}
                  <div className="font-serif text-[54px] italic leading-none">
                    {p.days}
                    <sup className="ml-1 font-mono text-[11px] font-medium not-italic text-muted-foreground">
                      days
                    </sup>
                  </div>
                  <h3 className="text-[16px] font-semibold tracking-tight">{p.name}</h3>
                  <p className="line-clamp-2 text-[13px] leading-snug text-muted-foreground">
                    {p.tagline}
                  </p>
                  <div className="mt-2 flex gap-4 border-t pt-3 font-mono text-[11px] text-muted-foreground">
                    <span>
                      <b className="font-medium text-foreground">{p.questionsPerDay}</b>/day
                    </span>
                    <span>
                      <b className="font-medium text-foreground">{p.questionsPerDay * p.days}</b>{" "}
                      total
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Daily + dashboard preview ──────────────────────── */}
      {dailyPick && (
        <section className="border-t bg-card/40">
          <div className="container-page grid grid-cols-1 gap-4 py-20 lg:grid-cols-[1.2fr_1fr]">
            <div
              className="relative overflow-hidden rounded-[20px] border bg-background p-7"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, hsl(var(--warning) / 0.10), transparent 60%)",
              }}
            >
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-[44px] italic leading-none">
                  {today.toLocaleString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Today · daily challenge
                </span>
              </div>
              <h3 className="mt-5 max-w-[34ch] text-[22px] font-semibold leading-tight tracking-tight">
                {dailyPick.title}
              </h3>
              <p className="mt-3 max-w-[58ch] text-[13.5px] leading-6 text-muted-foreground">
                {dailyPick.shortDescription}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <DifficultyBadge level={dailyPick.difficulty} />
                <span className="font-mono text-[11.5px] text-muted-foreground">
                  ~{dailyPick.estimatedSolvingMinutes} min
                </span>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild className="gap-2">
                  <Link href="/daily">
                    Take it <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="gap-2">
                  <Link href="/random">
                    <Shuffle className="h-4 w-4" />
                    Random round
                  </Link>
                </Button>
              </div>
            </div>

            <HomeDashboardPreview totalPool={stats.total} />
          </div>
        </section>
      )}

      {/* ─── How it works ──────────────────────────────────── */}
      <section className="container-page py-20">
        <SectionHead
          left={
            <>
              <span className="eyebrow-brand">How it works</span>
              <h2 className="mt-2 text-[36px] font-semibold leading-[1.05] tracking-extra-tight sm:text-[40px]">
                Three steps. <span className="text-muted-foreground">No grind.</span>
              </h2>
            </>
          }
        />
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[
            ["i.", "Pick a surface or plan", "Categories from React to Behavioral, or commit to a 7/30/60/90-day plan."],
            ["ii.", "Practice with depth", "Every answer reads like documentation. Concept, code, trade-offs."],
            ["iii.", "Track your streak", "GitHub-style heatmap, bookmarks, completion sync once you sign in."],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-[20px] border bg-card p-7">
              <div className="font-serif text-[56px] italic leading-none text-muted-foreground">
                {n}
              </div>
              <h3 className="mt-4 text-[19px] font-semibold tracking-tight">{t}</h3>
              <p className="mt-2 text-[13.5px] leading-6 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Testimonial ────────────────────────────────────── */}
      <section className="border-t">
        <div className="container-page py-20 text-center">
          <blockquote className="mx-auto max-w-[24ch] font-serif text-3xl italic leading-snug sm:text-[34px]">
            &ldquo;The answers read like senior code review notes. Exactly the framing I wanted.&rdquo;
          </blockquote>
          <div className="mt-6 font-mono text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">
            Sr. FE Engineer · onsite-ready in 30 days
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────── */}
      <section className="container-page py-20">
        <SectionHead
          left={
            <>
              <span className="eyebrow-brand">FAQ</span>
              <h2 className="mt-2 text-[36px] font-semibold leading-[1.05] tracking-extra-tight sm:text-[40px]">
                Common questions.
              </h2>
            </>
          }
        />
        <div className="mt-8 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {[
            ["Is it free?", "Yes. Every question, every roadmap, every plan. Sign in only to sync your streak and bookmarks across devices."],
            ["Who is this for?", "Senior frontend engineers preparing for interviews at product companies. Depth assumes you've shipped frontend before."],
            ["How do I know what to study next?", "Every question is mapped to a roadmap stage and a day in a plan. The daily challenge picks one for you. You always have a next step."],
            ["Do you cover system design?", "Yes. Frontend system design covering architecture, micro-frontends, caching, real-time, and modular apps."],
          ].map(([q, a]) => (
            <details
              key={q}
              className="group rounded-[14px] border bg-card p-5 transition-colors hover:border-foreground/30"
            >
              <summary className="flex cursor-default list-none items-center justify-between text-[15px] font-medium tracking-tight">
                {q}
                <span className="font-mono text-lg text-muted-foreground group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-3 text-[13.5px] leading-6 text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────── */}
      <section className="container-page relative overflow-hidden py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-[130px]"
          style={{
            background: "radial-gradient(circle, hsl(var(--brand-glow)), transparent)",
          }}
        />
        <div className="relative mx-auto flex max-w-[700px] flex-col items-center gap-5 text-center">
          <h2 className="text-balance text-5xl font-semibold leading-none tracking-tightest sm:text-[56px]">
            Your next interview is{" "}
            <span className="text-muted-foreground">closer than you think.</span>
          </h2>
          <p className="text-[16px] text-muted-foreground">
            Free, always. Sign in to sync across devices.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
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

function pickShuffled<T>(arr: T[], n: number, seed: number): T[] {
  const a = [...arr];
  let s = (seed * 2654435761) >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function SectionHead({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div className="max-w-[42ch]">{left}</div>
      {right}
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  tone,
  href,
  title,
  desc,
  meta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "brand" | "success" | "warning" | "danger";
  href: string;
  title: string;
  desc: string;
  meta: string;
}) {
  const tones: Record<typeof tone, string> = {
    brand: "bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand))]",
    success: "bg-[hsl(var(--success)/0.14)] text-[hsl(var(--success))]",
    warning: "bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]",
    danger: "bg-[hsl(var(--danger)/0.14)] text-[hsl(var(--danger))]",
  };
  return (
    <Link
      href={href}
      className="surface surface-hover group relative flex min-h-[180px] flex-col gap-2.5 p-6"
    >
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-[16px] font-semibold tracking-tight">{title}</h3>
      <p className="text-[13px] leading-snug text-muted-foreground">{desc}</p>
      <span className="mt-auto font-mono text-[11px] text-muted-foreground">{meta}</span>
      <ArrowRight className="absolute right-5 top-5 h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-hover:text-foreground" />
    </Link>
  );
}

