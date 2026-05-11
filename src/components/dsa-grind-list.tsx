"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Bookmark, Check, Clock } from "lucide-react";
import { Badge, DifficultyBadge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { type GrindDifficulty, type GrindQuestion, leetcodeSlugKey } from "@/lib/dsa-types";
import { useAuth } from "@/components/providers/auth-provider";
import { useUserStore } from "@/lib/store/user-state";

type DifficultyFilter = GrindDifficulty | "all" | "completed";

const BASE_FILTERS: { value: DifficultyFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

function formatTopic(topic: string): string {
  return topic
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function DsaGrindList({ questions }: { questions: GrindQuestion[] }) {
  const { user } = useAuth();
  const hydrated = useUserStore((s) => s.hydrated);
  const completed = useUserStore((s) => s.completed);

  const [showAll169, setShowAll169] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [topic, setTopic] = useState<string>("all");
  const [query, setQuery] = useState("");

  const activeList = useMemo(
    () => (showAll169 ? questions : questions.filter((q) => q.inGrind75)),
    [showAll169, questions],
  );

  const completedSet = useMemo(() => new Set(completed), [completed]);
  const showCompletedChip = !!user && hydrated;

  const filters = useMemo<typeof BASE_FILTERS>(
    () =>
      showCompletedChip
        ? [...BASE_FILTERS, { value: "completed", label: "Completed" }]
        : BASE_FILTERS,
    [showCompletedChip],
  );

  const topics = useMemo(() => {
    const set = new Set<string>();
    for (const q of activeList) set.add(q.topic);
    return ["all", ...Array.from(set).sort()];
  }, [activeList]);

  const counts = useMemo(() => {
    const c: Record<DifficultyFilter, number> = {
      all: activeList.length,
      easy: 0,
      medium: 0,
      hard: 0,
      completed: 0,
    };
    for (const q of activeList) {
      c[q.difficulty]++;
      if (completedSet.has(leetcodeSlugKey(q.slug))) c.completed++;
    }
    return c;
  }, [activeList, completedSet]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeList.filter((item) => {
      if (difficulty === "completed") {
        if (!completedSet.has(leetcodeSlugKey(item.slug))) return false;
      } else if (difficulty !== "all" && item.difficulty !== difficulty) {
        return false;
      }
      if (topic !== "all" && item.topic !== topic) return false;
      if (q && !item.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeList, difficulty, topic, query, completedSet]);

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        {activeList.length} questions
      </p>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search problems…"
          className="h-9 w-full max-w-xs rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-foreground"
        />
        <Select
          value={difficulty}
          onValueChange={(v) => setDifficulty(v as DifficultyFilter)}
        >
          <SelectTrigger className="min-w-[10rem]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            {filters.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label} ({counts[f.value]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger className="min-w-[10rem]">
            <SelectValue placeholder="All topics" />
          </SelectTrigger>
          <SelectContent>
            {topics.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "all" ? "All topics" : formatTopic(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
            showAll169
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-current"
            checked={showAll169}
            onChange={(e) => {
              setShowAll169(e.target.checked);
              setTopic("all");
            }}
          />
          Grind 169 problems
        </label>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {activeList.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
          <p>No problems match these filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((q) => (
            <GrindCard key={q.id} q={q} />
          ))}
        </div>
      )}
    </>
  );
}

export function GrindCard({ q }: { q: GrindQuestion }) {
  const { user } = useAuth();
  const hydrated = useUserStore((s) => s.hydrated);
  const completed = useUserStore((s) => s.completed);
  const bookmarks = useUserStore((s) => s.bookmarks);
  const toggleCompleted = useUserStore((s) => s.toggleCompleted);
  const toggleBookmark = useUserStore((s) => s.toggleBookmark);

  const slugKey = leetcodeSlugKey(q.slug);
  const isCompleted = hydrated && completed.includes(slugKey);
  const isBookmarked = hydrated && bookmarks.includes(slugKey);
  const showActions = !!user && hydrated;

  return (
    <article
      className={cn(
        "surface surface-hover group flex h-full flex-col p-5 transition-all",
        isCompleted && "opacity-70",
      )}
    >
      <div className="flex items-center gap-2">
        <Badge variant="solid">LeetCode #{q.id}</Badge>
        <DifficultyBadge level={q.difficulty} />
        {showActions && (
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => void toggleBookmark(slugKey)}
              aria-pressed={isBookmarked}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border transition-colors",
                isBookmarked
                  ? "bg-[hsl(var(--brand-soft))] text-[hsl(var(--brand))]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Bookmark
                className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")}
              />
            </button>
            <button
              type="button"
              onClick={() => void toggleCompleted(slugKey)}
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
      <a
        href={q.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-start gap-1 text-[17px] font-semibold leading-snug tracking-tight text-foreground hover:underline"
      >
        <span className={cn(isCompleted && "line-through")}>{q.title}</span>
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </a>
      <p className="mt-2 text-[13px] text-muted-foreground">{formatTopic(q.topic)}</p>
      <div className="mt-auto flex items-center gap-3 pt-4 text-[11.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 font-mono">
          <Clock className="h-3 w-3" /> {q.duration} min
        </span>
      </div>
    </article>
  );
}
