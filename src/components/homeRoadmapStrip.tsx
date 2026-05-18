import Link from "next/link";

export type HomeRoadmapStage = {
  num: number;
  slug: string;
  name: string;
  meta: string;
  tone: string;
  pct: number;
};

export function HomeRoadmapStrip({ stages }: { stages: HomeRoadmapStage[] }) {
  return (
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
          <h3 className="text-[18px] font-semibold tracking-tight" style={{ color: s.tone }}>
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
  );
}
