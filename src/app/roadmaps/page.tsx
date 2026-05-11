import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Binary, Layers, Zap, Construction } from "lucide-react";
import { ROADMAPS } from "@/lib/roadmaps";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "Roadmaps",
  description:
    "Structured paths to interview-ready: foundations, senior frontend, and DSA for frontend engineers.",
};

const ICONS = {
  "frontend-foundations": Layers,
  "senior-frontend": Zap,
  "dsa-frontend": Binary,
} as const;

export default function RoadmapsPage() {
  return (
    <div className="container-page py-12 space-y-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Roadmaps
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          Pick a path. Track progress.
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Three structured roadmaps. Mark questions complete as you go — your progress is saved
          locally to your browser.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ROADMAPS.map((r) => {
          const Icon = ICONS[r.slug as keyof typeof ICONS] ?? Layers;
          return (
            <Card key={r.slug} className="flex flex-col p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-foreground/5">
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
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{r.description}</p>
              <div className="mt-4 text-xs text-muted-foreground">
                {r.estimatedHours}h estimated · {r.topics.length} topics
              </div>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {r.topics.slice(0, 6).map((t) => (
                  <span
                    key={t.slug}
                    className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {t.name}
                  </span>
                ))}
                {r.topics.length > 6 && (
                  <span className="text-[11px] text-muted-foreground">
                    +{r.topics.length - 6} more
                  </span>
                )}
              </ul>
              <div className="mt-auto pt-5">
                <Link
                  href={`/roadmaps/${r.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  View roadmap <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
