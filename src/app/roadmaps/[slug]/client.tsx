"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Bookmark, Check, CheckCircle2, ChevronDown, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { DifficultyBadge, Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/authProvider";
import { useUserStore, useHydratedUserState } from "@/lib/store/userState";
import type { RoadmapTopicWithQuestions } from "@/lib/repository/roadmapRepository";

export function StageClient({ topics }: { topics: RoadmapTopicWithQuestions[] }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(topics[0]?.slug ?? null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const elToSlug = new Map<Element, string>();
    for (const t of topics) {
      const el = sectionRefs.current[t.slug];
      if (el) elToSlug.set(el, t.slug);
    }
    if (elToSlug.size === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const slug = elToSlug.get(entry.target);
            if (slug) setActiveSlug(slug);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const el of elToSlug.keys()) obs.observe(el);
    return () => obs.disconnect();
  }, [topics]);

  const scrollTo = (slug: string) => {
    const el = sectionRefs.current[slug];
    if (!el) return;
    const headerHeight = 56;
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveSlug(slug);
  };

  return (
    <div className="space-y-10">
      {topics.length > 1 && (
        <div className="sticky top-14 z-10 -mx-4 overflow-x-auto bg-background/95 px-4 py-2.5 backdrop-blur-sm border-b border-border/50 sm:-mx-6 sm:px-6">
          <div className="flex gap-1.5">
            {topics.map((t) => (
              <button
                key={t.slug}
                type="button"
                onClick={() => scrollTo(t.slug)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  activeSlug === t.slug
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {t.name}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    activeSlug === t.slug
                      ? "bg-background/20 text-background"
                      : "bg-background text-muted-foreground",
                  )}
                >
                  {t.questions.length}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {topics.map((t) => (
        <section
          key={t.slug}
          ref={(el) => {
            sectionRefs.current[t.slug] = el;
          }}
        >
          <TopicCard topic={t} />
        </section>
      ))}
    </div>
  );
}

const FREQ_LABEL: Record<string, string> = {
  low: "low",
  medium: "medium",
  high: "high",
  "very-high": "very high",
};

function TopicCard({ topic }: { topic: RoadmapTopicWithQuestions }) {
  const topicProgress = useHydratedUserState((s) => s.topicProgress, [] as string[]);
  const completed = useHydratedUserState((s) => s.completed, [] as string[]);
  const toggleTopic = useUserStore((s) => s.toggleTopicProgress);
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(true);

  const isTopicDone = topicProgress.includes(topic.slug);
  const missingPrereqs = topic.prereqTopicSlugs.filter((p) => !topicProgress.includes(p));
  const locked = missingPrereqs.length > 0;
  const doneQuestions = topic.questions.reduce(
    (n, q) => n + (completed.includes(q.slug) ? 1 : 0),
    0,
  );

  return (
    <div className={cn("rounded-lg border bg-card", locked && "opacity-90")}>
      <div className="border-b border-border/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">{topic.name}</h2>
              {locked && (
                <Badge variant="warning" className="gap-1">
                  <Lock className="h-3 w-3" /> prereq
                </Badge>
              )}
              {isTopicDone && (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> mastered
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{topic.description}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-muted-foreground">
              <DifficultyBadge level={topic.difficulty} />
              <span>frequency: {FREQ_LABEL[topic.frequency] ?? topic.frequency}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> ~{Math.round(topic.masteryMinutes / 60)}h to mastery
              </span>
              <span>
                {doneQuestions}/{topic.questions.length} questions done
              </span>
            </div>
            {locked && (
              <p className="pt-1 text-xs text-muted-foreground">
                Recommended prerequisites:{" "}
                {missingPrereqs.map((p, i) => (
                  <span key={p}>
                    <span className="font-medium text-foreground">{p}</span>
                    {i < missingPrereqs.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            )}
          </div>

          {user && (
            <button
              type="button"
              onClick={() => void toggleTopic(topic.slug)}
              className={cn(
                "shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors",
                isTopicDone
                  ? "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isTopicDone ? "✓ Mastered" : "Mark mastered"}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 border-b border-border/60 p-5 sm:grid-cols-2">
        <Info title="Why interviewers ask">{topic.whyAsked}</Info>
        <Info title="Real-world relevance">{topic.realWorld}</Info>
        <BulletList title="Common interview patterns" items={topic.commonPatterns} />
        <BulletList title="Common mistakes" items={topic.commonMistakes} />
        <BulletList title="Follow-up questions" items={topic.followUps} className="sm:col-span-2" />
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/40"
      >
        <span>
          {topic.questions.length} {topic.questions.length === 1 ? "question" : "questions"}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
        />
      </button>

      {expanded &&
        (topic.questions.length > 0 ? (
          <div className="divide-y divide-border">
            {topic.questions.map((q) => (
              <QuestionRow key={q.slug} q={q} />
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            Questions coming soon.
          </div>
        ))}
    </div>
  );
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <p className="text-sm text-foreground/90 leading-relaxed">{children}</p>
    </div>
  );
}

function BulletList({
  title,
  items,
  className,
}: {
  title: string;
  items: string[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-1 text-sm text-foreground/90">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 leading-relaxed">
            <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuestionRow({
  q,
}: {
  q: { slug: string; title: string; difficulty: "easy" | "medium" | "hard"; estimatedReadingMinutes: number };
}) {
  const { user } = useAuth();
  const hydrated = useUserStore((s) => s.hydrated);
  const completed = useUserStore((s) => s.completed);
  const bookmarks = useUserStore((s) => s.bookmarks);
  const toggleCompleted = useUserStore((s) => s.toggleCompleted);
  const toggleBookmark = useUserStore((s) => s.toggleBookmark);

  const isCompleted = hydrated && completed.includes(q.slug);
  const isBookmarked = hydrated && bookmarks.includes(q.slug);
  const showActions = !!user && hydrated;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
        isCompleted && "opacity-60",
      )}
    >
      <DifficultyBadge level={q.difficulty} />
      <Link
        href={`/questions/${q.slug}`}
        className={cn(
          "flex-1 text-sm font-medium hover:underline",
          isCompleted && "line-through text-muted-foreground",
        )}
      >
        {q.title}
      </Link>
      <span className="hidden shrink-0 items-center gap-1 font-mono text-[11px] text-muted-foreground sm:flex">
        <Clock className="h-3 w-3" />
        {q.estimatedReadingMinutes}m
      </span>
      {showActions && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => void toggleBookmark(q.slug)}
            aria-pressed={isBookmarked}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border transition-colors",
              isBookmarked
                ? "bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand))]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Bookmark className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")} />
          </button>
          <button
            type="button"
            onClick={() => void toggleCompleted(q.slug)}
            aria-pressed={isCompleted}
            aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border transition-colors",
              isCompleted
                ? "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}
