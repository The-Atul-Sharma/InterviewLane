import type { Metadata } from "next";
import { Shuffle } from "lucide-react";
import { repository } from "@/lib/repository";
import { Badge } from "@/components/ui/badge";
import { RandomInterviewClient } from "./client";

export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "Random Interview Mode",
  description: "Five random questions across categories — simulate a frontend interview round.",
};

export default async function RandomPage() {
  const all = await repository.listAll();
  return (
    <div className="container-page py-12 space-y-8">
      <header className="space-y-2">
        <Badge variant="muted" className="gap-1">
          <Shuffle className="h-3 w-3" /> Random round
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Random Interview Mode
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Five questions, sampled across categories and difficulty. Click reroll for a new set.
          Simulates the surface area of a typical 60-minute round.
        </p>
      </header>
      <RandomInterviewClient pool={all} />
    </div>
  );
}
