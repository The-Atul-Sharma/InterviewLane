import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Target, Trophy, Zap, Clock } from "lucide-react";
import { getPlans } from "@/lib/repository/roadmap-repository";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Preparation Plans",
  description:
    "7-day crash plan, 30-day plan, 60-day deep plan, or 90-day senior plan — pick the timeline that matches your interview.",
};

const PLAN_ICON: Record<string, React.ElementType> = {
  "7-day": Zap,
  "30-day": Target,
  "60-day": Clock,
  "90-day": Trophy,
};
const PLAN_ACCENT: Record<string, string> = {
  "7-day": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "30-day": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "60-day": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "90-day": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

export default async function PlansPage() {
  const plans = await getPlans();
  return (
    <div className="container-page py-12 space-y-10">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Plans</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pick your timeline</h1>
        <p className="max-w-2xl text-muted-foreground">
          Each plan generates a daily question rotation across the highest-frequency interview
          surfaces, with mock checkpoints and revision days built in. Mark days complete as you go.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => {
          const Icon = PLAN_ICON[p.slug] ?? Calendar;
          const accent = PLAN_ACCENT[p.slug] ?? "bg-foreground/5";
          return (
            <Card key={p.slug} className="group relative flex flex-col p-6 transition-shadow hover:shadow-md">
              <div className="mb-5 flex items-start justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-lg ${accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant="muted" className="gap-1">
                  <Calendar className="h-3 w-3" /> {p.days} days
                </Badge>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{p.tagline}</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">{p.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-4">
                {p.description}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-muted p-2.5">
                  <p className="font-semibold text-foreground">{p.questionsPerDay}/day</p>
                  <p className="text-muted-foreground">questions</p>
                </div>
                <div className="rounded-md bg-muted p-2.5">
                  <p className="font-semibold text-foreground">{p.days * p.questionsPerDay}</p>
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
