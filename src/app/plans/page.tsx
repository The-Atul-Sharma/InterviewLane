import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { PREP_PLANS } from "@/lib/roadmaps";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "Preparation Plans",
  description: "7-day refresher, 30-day deep prep, or 90-day mastery — pick the plan that matches your timeline.",
};

export default function PlansPage() {
  return (
    <div className="container-page py-12 space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Plans</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          Pick your timeline
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Each plan generates a daily question rotation across high-frequency interview surfaces.
          Mark complete as you go — your streak compounds.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PREP_PLANS.map((p) => (
          <Card key={p.slug} className="flex flex-col p-6">
            <div className="flex items-center gap-2">
              <Badge variant="muted" className="gap-1">
                <Calendar className="h-3 w-3" /> {p.days} days
              </Badge>
              <span className="text-xs text-muted-foreground">{p.questionsPerDay}/day</span>
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight">{p.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
            <Link
              href={`/plans/${p.slug}`}
              className="mt-6 inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              Start plan <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
