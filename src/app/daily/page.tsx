import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { repository } from "@/lib/repository";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Daily Challenge",
  description: "One frontend interview question, fresh every day. Build a streak.",
};

/**
 * Deterministic daily pick: hash today's date → pick an index in the sorted
 * question list. Same answer per UTC date for every viewer, no server needed.
 */
export default async function DailyPage() {
  const all = await repository.listAll();
  const today = new Date();
  const utcKey = `${today.getUTCFullYear()}-${today.getUTCMonth()}-${today.getUTCDate()}`;
  const seed = [...utcKey].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
  const pick = all[seed % all.length];

  return (
    <div className="container-page py-12 space-y-10">
      <header className="space-y-2">
        <Badge variant="muted" className="gap-1">
          <Calendar className="h-3 w-3" /> {today.toUTCString().slice(0, 16)}
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Daily Challenge</h1>
        <p className="max-w-2xl text-muted-foreground">
          One question, deterministic per UTC date. Read it, think it through, mark it complete to
          extend your streak.
        </p>
      </header>

      {pick ? (
        <Card className="p-8">
          <Badge variant="muted" className="capitalize">
            {pick.category} · {pick.difficulty}
          </Badge>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">{pick.title}</h2>
          <p className="mt-2 text-muted-foreground">{pick.shortDescription}</p>
          <Link
            href={`/questions/${pick.slug}`}
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            Open question <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      ) : (
        <Card className="p-8 text-muted-foreground">No questions available yet.</Card>
      )}
    </div>
  );
}
