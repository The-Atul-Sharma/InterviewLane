import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ROADMAPS } from "@/lib/roadmaps";
import { repository } from "@/lib/repository";
import { Badge } from "@/components/ui/badge";
import { QuestionCard } from "@/components/question-card";

export const dynamic = "force-static";

export function generateStaticParams() {
  return ROADMAPS.map((r) => ({ slug: r.slug }));
}

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

  const topicQuestions = await Promise.all(
    roadmap.topics.map(async (t) => {
      try {
        const qs = await repository.listByCategory(t.slug as never);
        return { topic: t, questions: qs };
      } catch {
        return { topic: t, questions: [] };
      }
    }),
  );

  return (
    <div className="container-page py-10 space-y-10">
      <Link
        href="/roadmaps"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All roadmaps
      </Link>

      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant={roadmap.status === "active" ? "success" : "warning"}>
            {roadmap.status}
          </Badge>
          <span className="text-xs text-muted-foreground">{roadmap.estimatedHours}h estimated</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{roadmap.name}</h1>
        <p className="max-w-2xl text-muted-foreground">{roadmap.description}</p>
      </header>

      <section className="space-y-8">
        {topicQuestions.map(({ topic, questions }) => (
          <div key={topic.slug}>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-xl font-semibold tracking-tight">{topic.name}</h2>
              <span className="text-xs text-muted-foreground">
                {questions.length} {questions.length === 1 ? "question" : "questions"}
              </span>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">{topic.description}</p>
            {questions.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {questions.map((q) => (
                  <QuestionCard key={q.slug} q={q} compact />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Questions for this topic will populate as content is added to{" "}
                <code className="font-mono">/content</code>.
              </p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

