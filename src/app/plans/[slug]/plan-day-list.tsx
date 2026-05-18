"use client";
import Link from "next/link";
import { CheckCircle2, FlaskConical, Repeat } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserStore, useHydratedUserState } from "@/lib/store/user-state";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

export interface PlanQuestion {
  slug: string;
  title: string;
  category: string;
  difficulty: string;
}

export interface PlanDay {
  dayNum: number;
  focus: string;
  goals: string[];
  questions: PlanQuestion[];
  isMock: boolean;
  isRevision: boolean;
}

export function PlanDayList({ planSlug, days }: { planSlug: string; days: PlanDay[] }) {
  const { user } = useAuth();
  const completed = useHydratedUserState((s) => s.completed, [] as string[]);
  const planProgress = useHydratedUserState(
    (s) => s.planProgress,
    [] as { planSlug: string; dayNum: number }[],
  );
  const togglePlanDay = useUserStore((s) => s.togglePlanDay);
  const completedSet = new Set(completed);
  const planDoneSet = new Set(
    planProgress.filter((p) => p.planSlug === planSlug).map((p) => p.dayNum),
  );

  const totalDays = days.length;
  const doneDays = planDoneSet.size;
  const pct = totalDays ? Math.round((doneDays / totalDays) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider">Overall progress</span>
          <span className="tabular-nums">{doneDays}/{totalDays} days · {pct}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[hsl(var(--brand))] transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {days.map((d) => {
          const doneCount = d.questions.reduce(
            (n, q) => n + (completedSet.has(q.slug) ? 1 : 0),
            0,
          );
          const allDone = doneCount === d.questions.length && d.questions.length > 0;
          const dayDone = planDoneSet.has(d.dayNum);

          return (
            <Card key={d.dayNum} className={cn("p-5", dayDone && "ring-1 ring-[hsl(var(--brand))]/40")}>
              <div className="mb-2 flex items-baseline justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Day {d.dayNum}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {allDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                  {doneCount}/{d.questions.length}
                </span>
              </div>

              <p className="text-sm font-medium">{d.focus}</p>

              <div className="mt-2 flex flex-wrap gap-1">
                {d.isMock && (
                  <Badge variant="warning" className="gap-1">
                    <FlaskConical className="h-3 w-3" /> mock
                  </Badge>
                )}
                {d.isRevision && (
                  <Badge variant="muted" className="gap-1">
                    <Repeat className="h-3 w-3" /> revision
                  </Badge>
                )}
              </div>

              {d.goals.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
                  {d.goals.map((g, i) => (
                    <li key={i}>· {g}</li>
                  ))}
                </ul>
              )}

              <ul className="mt-3 space-y-1.5">
                {d.questions.map((q, idx) => {
                  const isDone = completedSet.has(q.slug);
                  return (
                    <li key={`${d.dayNum}-${idx}-${q.slug}`} className="text-sm">
                      <Link
                        href={`/questions/${q.slug}`}
                        className="block rounded-md -m-2 p-2 hover:bg-accent"
                      >
                        <span className="flex items-start gap-2">
                          <span
                            className={cn(
                              "line-clamp-2 font-medium",
                              isDone && "text-muted-foreground line-through",
                            )}
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
                        <span className="text-[11px] capitalize text-muted-foreground">
                          {q.category} · {q.difficulty}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {user && (
                <button
                  type="button"
                  onClick={() => void togglePlanDay(planSlug, d.dayNum)}
                  className={cn(
                    "mt-3 w-full rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors",
                    dayDone
                      ? "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {dayDone ? "✓ Day complete" : "Mark day complete"}
                </button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
