import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { ROADMAPS } from "@/lib/roadmaps";
import { listDsaQuestions } from "@/lib/dsaRepository";
import { getStageBySlug } from "@/lib/repository/roadmapRepository";
import { Badge } from "@/components/ui/badge";
import { DsaGrindList } from "@/components/dsaGrindList";
import { UserStateBoot } from "@/components/userStateBoot";
import { StageClient } from "./client";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "dsa-for-frontend") {
    const r = ROADMAPS.find((x) => x.slug === slug);
    return r ? { title: r.name, description: r.description } : {};
  }
  const stage = await getStageBySlug(slug);
  return stage ? { title: stage.name, description: stage.description } : {};
}

export default async function StagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Legacy DSA roadmap stays on this route.
  if (slug === "dsa-for-frontend") {
    const dsa = ROADMAPS.find((x) => x.slug === slug)!;
    const questions = await listDsaQuestions();
    const total = questions.filter((q) => q.inGrind75).length;
    return (
      <div className="container-page space-y-8 py-10">
        <UserStateBoot />
        <Link
          href="/roadmaps"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All roadmaps
        </Link>
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">active</Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {dsa.estimatedHours}h estimated
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              {total} problems
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{dsa.name}</h1>
          <p className="max-w-2xl text-muted-foreground">{dsa.description}</p>
        </header>
        <DsaGrindList questions={questions} showAll={false} />
      </div>
    );
  }

  const stage = await getStageBySlug(slug);
  if (!stage) notFound();

  return (
    <div className="container-page space-y-8 py-10">
      <UserStateBoot />
      <Link
        href="/roadmaps"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All roadmaps
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="muted">Stage {stage.position}</Badge>
          <Badge variant="muted">{stage.readinessLevel}</Badge>
          <Badge variant="muted">{stage.difficultyBand}</Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> {stage.estHours}h estimated
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" /> {stage.questionCount} questions
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{stage.name}</h1>
        <p className="max-w-2xl text-muted-foreground">{stage.description}</p>
        {stage.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {stage.skills.map((s) => (
              <span
                key={s}
                className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </header>

      <StageClient topics={stage.topics} />
    </div>
  );
}
