"use client";
import { useHydratedUserState } from "@/lib/store/user-state";

export function StageProgressBar({ topicSlugs }: { topicSlugs: string[] }) {
  const completed = useHydratedUserState((s) => s.topicProgress, [] as string[]);
  if (topicSlugs.length === 0) return null;
  const done = topicSlugs.reduce((n, slug) => n + (completed.includes(slug) ? 1 : 0), 0);
  const pct = Math.round((done / topicSlugs.length) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Progress</span>
        <span className="tabular-nums">{done}/{topicSlugs.length} topics · {pct}%</span>
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
