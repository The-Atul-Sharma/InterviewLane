import type { Metadata } from "next";
import { CATEGORY_LIST } from "@/lib/categories";
import { CategoryCard } from "@/components/categoryCard";
import { PageHero } from "@/components/pageHero";
import { listDsaQuestions } from "@/lib/dsaRepository";
import { repository } from "@/lib/repository";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Categories",
  description:
    "All frontend interview categories. React, JavaScript, Performance, System Design, and more.",
};

export default async function CategoriesPage() {
  const [stats, dsaQuestions] = await Promise.all([repository.getStats(), listDsaQuestions()]);
  stats.byCategory["dsa-algorithms-75"] = dsaQuestions.filter((q) => q.inGrind75).length;
  stats.byCategory["dsa-algorithms-169"] = dsaQuestions.length;

  const sorted = [...CATEGORY_LIST].sort(
    (a, b) =>
      (stats.byCategory[b.slug] ?? 0) - (stats.byCategory[a.slug] ?? 0) ||
      a.name.localeCompare(b.name),
  );

  return (
    <div className="pb-20">
      <PageHero
        eyebrow={`${CATEGORY_LIST.length} interview surfaces`}
        title="Practice what they ask,"
        titleDim="not what's trendy."
        sub="Every category groups questions by interview surface. Pick one and drill in. Every answer comes with depth, code, and trade-offs."
      />
      <section className="container-page py-12">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((c) => (
            <CategoryCard key={c.slug} cat={c} count={stats.byCategory[c.slug] ?? 0} />
          ))}
        </div>
      </section>
    </div>
  );
}
