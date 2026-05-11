import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PREP_PLANS } from "@/lib/roadmaps";
import { repository } from "@/lib/repository";
import { Badge } from "@/components/ui/badge";
import { PlanDayList } from "./plan-day-list";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = PREP_PLANS.find((x) => x.slug === slug);
  return p ? { title: p.name, description: p.description } : {};
}

/**
 * Deterministic seeded shuffle so the same plan always produces the same
 * day-by-day rotation across reloads — without server-side state.
 */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const seedFromSlug = (s: string) =>
  [...s].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);

export default async function PlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const plan = PREP_PLANS.find((x) => x.slug === slug);
  if (!plan) notFound();

  const all = await repository.listAll();
  const sorted = seededShuffle(all, seedFromSlug(plan.slug));
  const days = Array.from({ length: plan.days }, (_, i) => {
    const start = (i * plan.questionsPerDay) % sorted.length;
    return {
      day: i + 1,
      questions: Array.from({ length: plan.questionsPerDay }, (_, k) => {
        const q = sorted[(start + k) % sorted.length];
        return {
          slug: q.slug,
          title: q.title,
          category: q.category,
          difficulty: q.difficulty,
        };
      }),
    };
  });

  return (
    <div className="container-page py-10 space-y-8">
      <Link
        href="/plans"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All plans
      </Link>
      <header className="space-y-2">
        <Badge variant="muted">{plan.days}-day plan</Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{plan.name}</h1>
        <p className="max-w-2xl text-muted-foreground">{plan.description}</p>
      </header>

      <PlanDayList days={days} />
    </div>
  );
}
