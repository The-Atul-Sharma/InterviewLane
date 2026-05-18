"use client";
import { useHydratedUserState } from "@/lib/store/userState";

export function StageProgressBar({ questionSlugs }: { questionSlugs: string[] }) {
  const completed = useHydratedUserState((s) => s.completed, [] as string[]);
  if (questionSlugs.length === 0) return null;
  const completedSet = new Set(completed);
  const done = questionSlugs.reduce((n, slug) => n + (completedSet.has(slug) ? 1 : 0), 0);
  const pct = Math.round((done / questionSlugs.length) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Progress</span>
        <span className="tabular-nums">{done}/{questionSlugs.length} questions · {pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[hsl(var(--brand))] transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
