import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Repeat } from "lucide-react";
import { getPlanBySlug, getPlans } from "@/lib/repository/roadmapRepository";
import { repository } from "@/lib/repository";
import { Badge } from "@/components/ui/badge";
import { UserStateBoot } from "@/components/userStateBoot";
import { PlanDayList } from "./planDayList";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const plans = await getPlans();
  const p = plans.find((x) => x.slug === slug);
  return p ? { title: p.name, description: p.description } : {};
}

export default async function PlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const plan = await getPlanBySlug(slug);
  if (!plan) notFound();

  // Resolve question titles in one round trip.
  const allSlugs = Array.from(new Set(plan.daysList.flatMap((d) => d.questionSlugs)));
  const allMeta = await repository.listAll();
  const metaBySlug = new Map(allMeta.map((m) => [m.slug, m]));

  const days = plan.daysList.map((d) => ({
    dayNum: d.dayNum,
    focus: d.focus,
    goals: d.goals,
    isMock: d.isMock,
    isRevision: d.isRevision,
    questions: d.questionSlugs
      .map((s) => metaBySlug.get(s))
      .filter((m): m is NonNullable<typeof m> => !!m)
      .map((m) => ({
        slug: m.slug,
        title: m.title,
        category: m.category,
        difficulty: m.difficulty,
      })),
  }));

  return (
    <div className="container-page py-10 space-y-8">
      <UserStateBoot />
      <Link
        href="/plans"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All plans
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="muted">{plan.days}-day plan</Badge>
          <Badge variant="muted">{plan.questionsPerDay} questions/day</Badge>
          <Badge variant="muted">{plan.difficulty}</Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{plan.name}</h1>
        <p className="max-w-2xl text-muted-foreground">{plan.description}</p>
      </header>

      {plan.milestoneCadence.length > 0 && (
        <section className="rounded-lg border bg-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Milestones
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {plan.milestoneCadence.map((m) => (
              <li key={m.day} className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="text-foreground/90">
                  <span className="font-medium">Day {m.day}:</span> {m.label}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border bg-muted/30 p-5">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Repeat className="h-3.5 w-3.5" /> Revision strategy
        </p>
        <p className="mt-1.5 text-sm text-foreground/90 leading-relaxed">{plan.revisionStrategy}</p>
      </section>

      <PlanDayList planSlug={plan.slug} days={days} />
    </div>
  );
}
