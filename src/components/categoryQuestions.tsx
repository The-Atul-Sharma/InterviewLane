"use client";

import { useMemo, useState } from "react";
import { QuestionCard } from "@/components/questionCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIFFICULTIES, type Difficulty, type QuestionMeta } from "@/lib/schema/question";
import { useAuth } from "@/components/providers/authProvider";
import { useUserStore } from "@/lib/store/userState";

type Filter = Difficulty | "all" | "completed";

const BASE_FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  ...DIFFICULTIES.map((d) => ({
    value: d as Filter,
    label: d[0].toUpperCase() + d.slice(1),
  })),
];

export function CategoryQuestions({ questions }: { questions: QuestionMeta[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const { user } = useAuth();
  const completed = useUserStore((s) => s.completed);
  const hydrated = useUserStore((s) => s.hydrated);
  const showCompletedChip = !!user && hydrated;

  const completedSet = useMemo(() => new Set(completed), [completed]);

  const filters = useMemo<{ value: Filter; label: string }[]>(
    () =>
      showCompletedChip
        ? [...BASE_FILTERS, { value: "completed", label: "Completed" }]
        : BASE_FILTERS,
    [showCompletedChip],
  );

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: questions.length,
      easy: 0,
      medium: 0,
      hard: 0,
      completed: 0,
    };
    for (const q of questions) {
      c[q.difficulty]++;
      if (completedSet.has(q.slug)) c.completed++;
    }
    return c;
  }, [questions, completedSet]);

  const filtered = useMemo(() => {
    if (filter === "all") return questions;
    if (filter === "completed") return questions.filter((q) => completedSet.has(q.slug));
    return questions.filter((q) => q.difficulty === filter);
  }, [questions, filter, completedSet]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="min-w-[12rem]">
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
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {questions.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
          <p>
            No {filter === "all" || filter === "completed" ? "" : filter} questions
            {filter === "completed" ? " completed yet" : " in this category yet"}.
          </p>
          <p className="mt-1 text-sm">Try a different filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((q) => (
            <QuestionCard key={q.slug} q={q} />
          ))}
        </div>
      )}
    </>
  );
}
