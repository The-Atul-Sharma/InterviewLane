import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Clock,
  Layers,
  Rocket,
  Trophy,
  Zap,
} from "lucide-react";
import { getStagesWithTopics } from "@/lib/repository/roadmapRepository";
import { ROADMAPS } from "@/lib/roadmaps";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/pageHero";
import { UserStateBoot } from "@/components/userStateBoot";
import { HomeRoadmapStrip, type HomeRoadmapStage } from "@/components/homeRoadmapStrip";
import { StageProgressBar } from "./stageProgress";

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

const STAGE_TONE: Record<string, string> = {
  foundations: "hsl(200 70% 65%)",
  intermediate: "hsl(var(--success))",
  advanced: "hsl(var(--warning))",
  senior: "hsl(var(--danger))",
  staff: "hsl(var(--brand))",
};

export default async function RoadmapsPage() {
  const stages = await getStagesWithTopics();
  const dsa = ROADMAPS.find((r) => r.slug === "dsa-for-frontend");

  const STAGE_PCT: Record<string, number> = {
    foundations: 100,
    intermediate: 80,
    advanced: 55,
    senior: 20,
    staff: 0,
  };
  const stripStages: HomeRoadmapStage[] = stages.map((s, i) => ({
    num: i + 1,
    slug: s.slug,
    name: s.name,
    meta: s.readinessLevel,
    tone: STAGE_TONE[s.slug] ?? "hsl(var(--brand))",
    pct: STAGE_PCT[s.slug] ?? (i + 1) * 18,
  }));

  return (
    <div className="pb-20">
      <UserStateBoot />
      <PageHero
        eyebrow="Roadmap"
        title="From foundations"
        titleDim="to staff-level."
        sub="Five stages, every question in the bank mapped to where it fits. Pick the stage that matches where you are. Earlier stages unlock the later ones."
      />

      {/* Stage strip - quick visual overview matching the home design */}
      <section className="container-page pt-10">
        <HomeRoadmapStrip stages={stripStages} />
      </section>

      {/* Detailed stage list */}
      <section className="container-page py-12">
        <div className="flex flex-col gap-3">
          {stages.map((s, i) => {
            const Icon = STAGE_ICON[s.slug] ?? Layers;
            const tone = STAGE_TONE[s.slug] ?? "hsl(var(--brand))";
            return (
              <Link
                key={s.slug}
                href={`/roadmaps/${s.slug}`}
                className="surface surface-hover group relative overflow-hidden p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
                  <div className="flex items-start gap-4 md:w-72 md:shrink-0">
                    <div
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-lg"
                      style={{ background: `${tone.replace(")", " / 0.14)")}`, color: tone }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                        Stage {i + 1}
                      </p>
                      <h2 className="text-lg font-semibold tracking-tight">{s.name}</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">{s.readinessLevel}</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {s.topics.map((t) => (
                        <span
                          key={t.slug}
                          className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[10.5px] text-muted-foreground"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {s.estHours}h
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {s.topics.length} topics · {s.questionCount} questions
                      </span>
                      <Badge variant="muted">{s.difficultyBand}</Badge>
                    </div>
                    <StageProgressBar
                      questionSlugs={s.topics.flatMap((t) => t.questions.map((q) => q.slug))}
                    />
                  </div>

                  <div className="md:self-center">
                    <span className="inline-flex items-center gap-1 text-sm font-medium transition-all group-hover:gap-1.5">
                      Start stage <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {dsa && (
        <section className="container-page">
          <span className="eyebrow-brand">Side track</span>
          <Link
            href={`/roadmaps/${dsa.slug}`}
            className="surface surface-hover mt-3 flex items-start gap-4 p-6 md:items-center"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-orange-500/15 text-orange-500">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold tracking-tight">{dsa.name}</h3>
                <Badge variant="success">active</Badge>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {dsa.description}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </section>
      )}
    </div>
  );
}
