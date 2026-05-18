import type { Metadata } from "next";
import { repository } from "@/lib/repository";
import { listDsaQuestions } from "@/lib/dsaRepository";
import { CATEGORY_LIST } from "@/lib/categories";
import { getPlans } from "@/lib/repository/roadmapRepository";
import { UserStateBoot } from "@/components/userStateBoot";
import { DashboardClient } from "./client";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your interview prep progress, streak, bookmarks, and recent activity.",
};

export default async function DashboardPage() {
  const [all, stats, dsa, plans] = await Promise.all([
    repository.listAll(),
    repository.getStats(),
    listDsaQuestions(),
    getPlans(),
  ]);
  const grind75Count = dsa.filter((q) => q.inGrind75).length;
  stats.byCategory["dsa-algorithms-75"] = grind75Count;
  stats.byCategory["dsa-algorithms-169"] = dsa.length;
  stats.total += grind75Count;
  return (
    <div className="container-page py-10">
      <UserStateBoot />
      <DashboardClient
        pool={all}
        stats={stats}
        categories={CATEGORY_LIST}
        dsaPool={dsa}
        plans={plans}
      />
    </div>
  );
}
