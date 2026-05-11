"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Bookmark, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { DifficultyBadge } from "@/components/ui/badge";
import { DsaGrindList } from "@/components/dsa-grind-list";
import { useAuth } from "@/components/providers/auth-provider";
import { useUserStore } from "@/lib/store/user-state";
import type { QuestionMeta } from "@/lib/schema/question";
import type { GrindQuestion } from "@/lib/dsa-types";
import type { RoadmapTopic } from "@/lib/roadmaps";

interface TopicSection {
  topic: RoadmapTopic;
  questions: QuestionMeta[];
}

interface Props {
  isDsa: boolean;
  topicSections?: TopicSection[];
  dsaQuestions?: GrindQuestion[];
}

export function RoadmapClient({ isDsa, topicSections, dsaQuestions }: Props) {
  const [activeSlug, setActiveSlug] = useState<string | null>(
    topicSections?.[0]?.topic.slug ?? null,
  );
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (isDsa || !topicSections?.length) return;
    const observers: IntersectionObserver[] = [];
    for (const { topic } of topicSections) {
      const el = sectionRefs.current[topic.slug];
      if (!el) continue;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSlug(topic.slug);
        },
        { rootMargin: "-30% 0px -60% 0px" },
      );
      obs.observe(el);
      observers.push(obs);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, [isDsa, topicSections]);

  const scrollTo = (slug: string) => {
    const el = sectionRefs.current[slug];
    if (!el) return;
    const headerHeight = window.innerWidth >= 768 ? 56 : 90;
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveSlug(slug);
  };

  if (isDsa && dsaQuestions) {
    return <DsaGrindList questions={dsaQuestions} showAll={false} />;
  }

  const sections = topicSections ?? [];

  return (
    <div className="space-y-10">
      {sections.length > 1 && (
        <div className="sticky top-[90px] z-10 -mx-4 overflow-x-auto bg-background/95 px-4 py-2.5 backdrop-blur-sm border-b border-border/50 sm:-mx-6 sm:px-6 md:top-14">
          <div className="flex gap-1.5">
            {sections.map(({ topic, questions }) => (
              <button
                key={topic.slug}
                type="button"
                onClick={() => scrollTo(topic.slug)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  activeSlug === topic.slug
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {topic.name}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    activeSlug === topic.slug
                      ? "bg-background/20 text-background"
                      : "bg-background text-muted-foreground",
                  )}
                >
                  {questions.length}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {sections.map(({ topic, questions }) => (
        <section
          key={topic.slug}
          ref={(el) => {
            sectionRefs.current[topic.slug] = el;
          }}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{topic.name}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{topic.description}</p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {questions.length} {questions.length === 1 ? "question" : "questions"}
            </span>
          </div>
          {questions.length > 0 ? (
            <div className="divide-y divide-border rounded-lg border bg-card">
              {questions.map((q) => (
                <QuestionRow key={q.slug} q={q} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
              Questions coming soon.
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function QuestionRow({ q }: { q: QuestionMeta }) {
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
