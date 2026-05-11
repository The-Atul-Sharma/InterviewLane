"use client";
import * as React from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { QuestionMeta } from "@/lib/schema/question";
import { Badge } from "@/components/ui/badge";

const ROUND_SIZE = 5;

function pickRandom<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export function RandomInterviewClient({ pool }: { pool: QuestionMeta[] }) {
  const [round, setRound] = React.useState<QuestionMeta[]>(() => pickRandom(pool, ROUND_SIZE));
  const reroll = React.useCallback(() => setRound(pickRandom(pool, ROUND_SIZE)), [pool]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{round.length} questions selected</p>
        <Button variant="outline" size="sm" onClick={reroll} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Reroll
        </Button>
      </div>
      <div className="space-y-3">
        {round.map((q, i) => (
          <Link key={q.slug} href={`/questions/${q.slug}`}>
            <Card className="p-5 transition-colors hover:bg-accent/40">
              <div className="flex items-start gap-4">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-foreground/5 text-sm font-semibold">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{q.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {q.shortDescription}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="muted" className="capitalize">
                      {q.category}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {q.difficulty}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ~{q.estimatedSolvingMinutes} min
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
