"use client";

import Link from "next/link";
import { ArrowUpRight, Bookmark, Check, Clock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, DifficultyBadge } from "@/components/ui/badge";
import type { QuestionMeta } from "@/lib/schema/question";
import { CATEGORY_META } from "@/lib/categories";
import { useAuth } from "@/components/providers/authProvider";
import { useUserStore } from "@/lib/store/userState";

export function QuestionCard({ q, compact }: { q: QuestionMeta; compact?: boolean }) {
  const cat = CATEGORY_META[q.category];
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
    <article
      className={cn(
        "surface surface-hover group flex h-full flex-col p-5 transition-all",
        isCompleted && "opacity-70",
      )}
    >
      <div className="flex items-center gap-2">
        <Badge variant="solid" className="capitalize">
          {cat?.name ?? q.category}
        </Badge>
        <DifficultyBadge level={q.difficulty} />
        {q.frequency === "very-high" && (
          <Badge variant="warning" className="gap-1">
            <Flame className="h-3 w-3" /> hot
          </Badge>
        )}
        {showActions && (
          <div className="ml-auto flex items-center gap-1">
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
      </div>
      <Link
        href={`/questions/${q.slug}`}
        className={cn(
          "mt-3 inline-flex items-start gap-1 font-semibold tracking-tight text-foreground hover:underline",
          compact ? "text-[15px]" : "text-[17px] leading-snug",
        )}
      >
        <span className={cn(isCompleted && "line-through")}>{q.title}</span>
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
      {!compact && (
        <p className="mt-2 line-clamp-2 text-[13.5px] text-muted-foreground">
          {q.shortDescription}
        </p>
      )}
      <div className="mt-auto flex items-center gap-3 pt-4 text-[11.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 font-mono">
          <Clock className="h-3 w-3" /> {q.estimatedReadingMinutes} min
        </span>
      </div>
    </article>
  );
}
