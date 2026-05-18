import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, BrainCircuit, CheckCircle2, Clock, Layers, Zap, Trophy, Rocket } from "lucide-react";
import { getStagesWithTopics } from "@/lib/repository/roadmap-repository";
import { ROADMAPS } from "@/lib/roadmaps";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { UserStateBoot } from "@/components/user-state-boot";
import { StageProgressBar } from "./stage-progress";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Roadmaps",
  description:
    "Frontend interview roadmap from Foundations through Staff Level. Structured stages, topic-level progression, and curated questions from the bank.",
};

const STAGE_ICON: Record<string, React.ElementType> = {
  foundations: Layers,
  intermediate: BookOpen,
  advanced: Zap,
  senior: Rocket,
  staff: Trophy,
};

const STAGE_ACCENT: Record<string, string> = {
  foundations: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  intermediate: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  advanced: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  senior: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  staff: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export default async function RoadmapsPage() {
  const stages = await getStagesWithTopics();
  const dsa = ROADMAPS.find((r) => r.slug === "dsa-for-frontend");

  return (
    <div className="container-page py-12 space-y-12">
      <UserStateBoot />
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Roadmap
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Foundations to Staff Level
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Five stages, seventeen topics, every question in the bank mapped to where it fits.
          Pick the stage that matches where you are — earlier stages unlock the later ones.
        </p>
      </header>

      <section className="space-y-3">
        {stages.map((s, i) => {
          const Icon = STAGE_ICON[s.slug] ?? Layers;
          const accent = STAGE_ACCENT[s.slug] ?? "bg-foreground/5";
          return (
            <Card key={s.slug} className="group relative overflow-hidden p-6 transition-shadow hover:shadow-md">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
                <div className="flex items-start gap-4 md:w-72 md:shrink-0">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Stage {i + 1}
                    </p>
                    <h2 className="text-lg font-semibold tracking-tight">{s.name}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.readinessLevel}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.topics.map((t) => (
                      <span
                        key={t.slug}
                        className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {s.estHours}h
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" /> {s.topics.length} topics · {s.questionCount} questions
                    </span>
                    <Badge variant="muted">{s.difficultyBand}</Badge>
                  </div>
                  <StageProgressBar topicSlugs={s.topics.map((t) => t.slug)} />
                </div>

                <div className="md:self-center">
                  <Link
                    href={`/roadmaps/${s.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium hover:underline group-hover:gap-1.5 transition-all"
                  >
                    Open stage <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      {dsa && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Side track</h2>
          <Card className="group flex items-start gap-4 p-6 transition-shadow hover:shadow-md md:items-center">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold tracking-tight">{dsa.name}</h3>
                <Badge variant="success">active</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{dsa.description}</p>
            </div>
            <Link
              href={`/roadmaps/${dsa.slug}`}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium hover:underline"
            >
              Open <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </section>
      )}

      <section className="rounded-lg border bg-muted/30 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          <div className="text-sm text-muted-foreground">
            Mark topics complete as you go. Locked topics show their prerequisites — they remain
            clickable so you can skip ahead, but the unlock hint stays until you check the prereq.
          </div>
        </div>
      </section>
    </div>
  );
}
