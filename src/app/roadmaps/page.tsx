import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Layers, Zap, Construction, BrainCircuit, Clock, BookOpen } from "lucide-react";
import { ROADMAPS } from "@/lib/roadmaps";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Roadmaps",
  description:
    "Structured paths to interview-ready: frontend foundations, senior engineering, and DSA & algorithms for frontend engineers.",
};

const ROADMAP_META: Record<string, { icon: React.ElementType; accent: string }> = {
  "frontend-foundations": { icon: Layers, accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  "senior-frontend": { icon: Zap, accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  "dsa-for-frontend": { icon: BrainCircuit, accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
};

export default function RoadmapsPage() {
  return (
    <div className="container-page py-12 space-y-10">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Roadmaps
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Pick a path. Track progress.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Three structured roadmaps covering every surface of a frontend interview — from core
          JavaScript to system design to DSA. Mark topics complete as you go.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {ROADMAPS.map((r) => {
          const meta = ROADMAP_META[r.slug] ?? { icon: Layers, accent: "bg-foreground/5" };
          const Icon = meta.icon;
          return (
            <Card key={r.slug} className="group flex flex-col p-6 transition-shadow hover:shadow-md">
              <div className="mb-5 flex items-start justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-lg ${meta.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {r.status === "coming-soon" ? (
                  <Badge variant="warning" className="gap-1">
                    <Construction className="h-3 w-3" /> coming soon
                  </Badge>
                ) : (
                  <Badge variant="success">active</Badge>
                )}
              </div>

              <h2 className="text-lg font-semibold tracking-tight">{r.name}</h2>
              <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground leading-relaxed">
                {r.description}
              </p>

              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {r.estimatedHours}h estimated
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {r.topics.length} topics
                </span>
              </div>

              <ul className="mt-3 flex flex-wrap gap-1.5">
                {r.topics.slice(0, 6).map((t) => (
                  <span
                    key={t.slug}
                    className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    {t.name}
                  </span>
                ))}
                {r.topics.length > 6 && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    +{r.topics.length - 6} more
                  </span>
                )}
              </ul>

              <div className="mt-auto pt-6">
                {r.status === "coming-soon" ? (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground cursor-not-allowed">
                    Coming soon <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <Link
                    href={`/roadmaps/${r.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium hover:underline group-hover:gap-1.5 transition-all"
                  >
                    View roadmap <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
