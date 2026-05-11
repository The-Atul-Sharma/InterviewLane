import type { Metadata } from "next";
import { repository } from "@/lib/repository";
import { listDsaQuestions } from "@/lib/dsa-repository";
import { CATEGORY_LIST } from "@/lib/categories";
import { DashboardClient } from "./client";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your interview prep progress, streak, bookmarks, and recent activity.",
};

export default async function DashboardPage() {
  const [all, stats, dsa] = await Promise.all([
    repository.listAll(),
    repository.getStats(),
    listDsaQuestions(),
  ]);
  const grind75Count = dsa.filter((q) => q.inGrind75).length;
  stats.byCategory["dsa-algorithms-75"] = grind75Count;
  stats.byCategory["dsa-algorithms-169"] = dsa.length;
  stats.total += grind75Count;
  return (
    <div className="container-page py-12">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Dashboard
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Your prep</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          All progress is stored locally to your browser. Switch device → start fresh; clearing
          browser data wipes it.
        </p>
      </header>
      <DashboardClient pool={all} stats={stats} categories={CATEGORY_LIST} dsaPool={dsa} />
    </div>
  );
}
