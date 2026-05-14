import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { ROADMAPS } from "@/lib/roadmaps";
import { repository } from "@/lib/repository";
import { listDsaQuestions } from "@/lib/dsa-repository";
import { Badge } from "@/components/ui/badge";
import { RoadmapClient } from "./client";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = ROADMAPS.find((x) => x.slug === slug);
  if (!r) return {};
  return { title: r.name, description: r.description };
}

export default async function RoadmapPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const roadmap = ROADMAPS.find((x) => x.slug === slug);
  if (!roadmap) notFound();

  const isDsa = slug === "dsa-for-frontend";

  const dsaQuestions = isDsa ? await listDsaQuestions() : [];

  const topicSections = isDsa
    ? undefined
    : await Promise.all(
        roadmap.topics.map(async (t) => {
          try {
            const qs = await repository.listByCategory(t.slug as never);
            return { topic: t, questions: qs };
          } catch {
            return { topic: t, questions: [] };
          }
        }),
      );

  const totalQuestions = isDsa
    ? dsaQuestions.filter((q) => q.inGrind75).length
    : (topicSections ?? []).reduce((acc, s) => acc + s.questions.length, 0);

  return (
    <div className="container-page space-y-8 py-10">
      <Link
        href="/roadmaps"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All roadmaps
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={roadmap.status === "active" ? "success" : "warning"}>
            {roadmap.status}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> {roadmap.estimatedHours}h estimated
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            {isDsa ? `${totalQuestions} problems` : `${totalQuestions} questions`}
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{roadmap.name}</h1>
        <p className="max-w-2xl text-muted-foreground">{roadmap.description}</p>
      </header>

      <RoadmapClient isDsa={isDsa} topicSections={topicSections} dsaQuestions={dsaQuestions} />
    </div>
  );
}
