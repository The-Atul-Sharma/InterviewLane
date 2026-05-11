import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Construction, Code2, Play } from "lucide-react";
import { ROADMAPS } from "@/lib/roadmaps";
import { repository } from "@/lib/repository";
import { Badge } from "@/components/ui/badge";
import { QuestionCard } from "@/components/question-card";
import { Card } from "@/components/ui/card";

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

  const isDsa = roadmap.slug === "dsa-frontend";

  // For non-DSA roadmaps, pull the matching category questions.
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

      {isDsa ? <DsaPlaceholder /> : null}

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
              <Card className="p-6 text-sm text-muted-foreground">
                Questions for this topic will populate as content is added to{" "}
                <code className="font-mono">/content</code>.
              </Card>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

function DsaPlaceholder() {
  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/30 px-6 py-4">
        <div className="flex items-center gap-2">
          <Construction className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">DSA module — coming soon</span>
        </div>
      </div>
      <div className="space-y-6 p-6">
        <p className="text-sm leading-7 text-muted-foreground">
          The DSA roadmap launches with a Blind 75 / Grind 75 inspired track tuned for frontend
          interviews, paired with an in-browser practice editor. Write your solution, run it
          against test cases, then reveal the optimal answer with complexity analysis.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Feature
            icon={Code2}
            title="In-browser editor"
            desc="Monaco-powered editor with TypeScript types, autocompletion, and inline diagnostics."
          />
          <Feature
            icon={Play}
            title="Run & verify"
            desc="Execute your solution against hidden test cases, see pass/fail, then reveal the optimal pattern."
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed bg-background/50 p-4">
          <p className="text-sm text-muted-foreground">
            In the meantime, the foundations and senior roadmaps cover the conceptual prep.
          </p>
          <Link
            href="/roadmaps/senior-frontend"
            className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            Senior Frontend roadmap <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border bg-background/40 p-4">
      <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </div>
      <p className="text-xs leading-6 text-muted-foreground">{desc}</p>
    </div>
  );
}
