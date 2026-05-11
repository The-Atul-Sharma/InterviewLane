"use client";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useHydratedUserState } from "@/lib/store/user-state";

export interface PlanQuestion {
  slug: string;
  title: string;
  category: string;
  difficulty: string;
}

export interface PlanDay {
  day: number;
  questions: PlanQuestion[];
}

export function PlanDayList({ days }: { days: PlanDay[] }) {
  const completed = useHydratedUserState((s) => s.completed, [] as string[]);
  const completedSet = new Set(completed);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {days.map((d) => {
        const doneCount = d.questions.reduce(
          (n, q) => n + (completedSet.has(q.slug) ? 1 : 0),
          0,
        );
        const allDone = doneCount === d.questions.length && d.questions.length > 0;
        return (
          <Card key={d.day} className="p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Day {d.day}
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                {allDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                {doneCount}/{d.questions.length} done
              </span>
            </div>
            <ul className="space-y-2">
              {d.questions.map((q) => {
                const isDone = completedSet.has(q.slug);
                return (
                  <li key={`${d.day}-${q.slug}`} className="text-sm">
                    <Link
                      href={`/questions/${q.slug}`}
                      className="block rounded-md p-2 -m-2 hover:bg-accent"
                    >
                      <span className="flex items-start gap-2">
                        <span
                          className={`line-clamp-1 font-medium ${
                            isDone ? "text-muted-foreground line-through" : ""
                          }`}
                        >
                          {q.title}
                        </span>
                        {isDone && (
                          <CheckCircle2
                            aria-label="Completed"
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                          />
                        )}
                      </span>
                      <span className="text-xs capitalize text-muted-foreground">
                        {q.category} · {q.difficulty}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
