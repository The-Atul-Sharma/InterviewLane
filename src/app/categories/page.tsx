import type { Metadata } from "next";
import { CATEGORY_LIST } from "@/lib/categories";
import { CategoryCard } from "@/components/category-card";
import { listDsaQuestions } from "@/lib/dsa-repository";
import { repository } from "@/lib/repository";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Categories",
  description:
    "All frontend interview categories — React, JavaScript, Performance, System Design, and more.",
};

export default async function CategoriesPage() {
  const [stats, dsaQuestions] = await Promise.all([repository.getStats(), listDsaQuestions()]);
  stats.byCategory["dsa-algorithms-75"] = dsaQuestions.filter((q) => q.inGrind75).length;
  stats.byCategory["dsa-algorithms-169"] = dsaQuestions.length;
  return (
    <div className="container-page py-12">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Categories
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          {CATEGORY_LIST.length} interview surfaces
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Each category groups questions by interview surface. Pick one and drill in — every
          question is answered with depth, code, and trade-offs.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...CATEGORY_LIST]
          .sort(
            (a, b) =>
              (stats.byCategory[b.slug] ?? 0) - (stats.byCategory[a.slug] ?? 0) ||
              a.name.localeCompare(b.name),
          )
          .map((c) => (
            <CategoryCard key={c.slug} cat={c} count={stats.byCategory[c.slug] ?? 0} />
          ))}
      </div>
    </div>
  );
}
