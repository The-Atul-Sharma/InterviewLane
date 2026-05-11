import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Zap, Target, Trophy } from "lucide-react";
import { PREP_PLANS } from "@/lib/roadmaps";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Preparation Plans",
  description:
    "7-day refresher, 30-day deep prep, or 90-day mastery — pick the plan that matches your timeline.",
};

const PLAN_META: Record<string, { icon: React.ElementType; accent: string; badgeVariant: "muted" | "warning" | "success" }> = {
  "7-day": { icon: Zap, accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400", badgeVariant: "warning" },
  "30-day": { icon: Target, accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400", badgeVariant: "muted" },
  "90-day": { icon: Trophy, accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400", badgeVariant: "success" },
};

export default function PlansPage() {
  return (
    <div className="container-page py-12 space-y-10">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Plans</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Pick your timeline
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Each plan generates a daily question rotation across high-frequency interview surfaces.
          Mark complete as you go — your streak compounds.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {PREP_PLANS.map((p) => {
          const meta = PLAN_META[p.slug] ?? { icon: Calendar, accent: "bg-foreground/5", badgeVariant: "muted" as const };
          const Icon = meta.icon;
          return (
            <Card key={p.slug} className="group relative flex flex-col p-6 transition-shadow hover:shadow-md">
              <div className="mb-5 flex items-start justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-lg ${meta.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant={meta.badgeVariant} className="gap-1">
                  <Calendar className="h-3 w-3" /> {p.days} days
                </Badge>
              </div>

              <p className="text-xs font-medium text-muted-foreground">{p.tagline}</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">{p.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.description}</p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-muted p-2.5">
                  <p className="font-semibold text-foreground">{p.questionsPerDay}/day</p>
                  <p className="text-muted-foreground">questions</p>
                </div>
                <div className="rounded-md bg-muted p-2.5">
                  <p className="font-semibold text-foreground">{p.totalQuestions}</p>
                  <p className="text-muted-foreground">total</p>
                </div>
              </div>

              <ul className="mt-4 flex flex-wrap gap-1.5">
                {p.focus.map((f) => (
                  <span
                    key={f}
                    className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    {f}
                  </span>
                ))}
              </ul>

              <div className="mt-auto pt-6">
                <Link
                  href={`/plans/${p.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-medium hover:underline group-hover:gap-1.5 transition-all"
                >
                  Start plan <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
