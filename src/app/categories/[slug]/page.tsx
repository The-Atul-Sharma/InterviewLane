import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CATEGORIES, type Category } from "@/lib/schema/question";
import { CATEGORY_META } from "@/lib/categories";
import { CategoryQuestions } from "@/components/categoryQuestions";
import { DsaGrindList } from "@/components/dsaGrindList";
import { UserStateBoot } from "@/components/userStateBoot";
import { listDsaQuestions } from "@/lib/dsaRepository";
import { repository } from "@/lib/repository";
import { siteUrl } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = CATEGORY_META[slug];
  if (!meta) return {};
  return {
    title: meta.name,
    description: meta.description,
    alternates: { canonical: siteUrl(`/categories/${slug}`) },
    openGraph: {
      title: `${meta.name} interview questions`,
      description: meta.description,
      url: siteUrl(`/categories/${slug}`),
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!CATEGORIES.includes(slug as Category)) notFound();
  const meta = CATEGORY_META[slug];
  const isDsa = slug === "dsa-algorithms-75" || slug === "dsa-algorithms-169";
  const dsaQuestions = isDsa ? await listDsaQuestions() : [];
  const questions = isDsa ? [] : await repository.listByCategory(slug as Category);
  const count = isDsa ? 0 : questions.length;

  return (
    <div className="container-page py-10">
      <UserStateBoot />
      <Link
        href="/categories"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All categories
      </Link>
      <header className="mb-8 flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Category
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{meta.name}</h1>
        <p className="max-w-2xl text-muted-foreground">{meta.description}</p>
        {!isDsa && (
          <p className="text-sm text-muted-foreground">
            {count} {count === 1 ? "question" : "questions"}
          </p>
        )}
      </header>

      {isDsa ? (
        <DsaGrindList questions={dsaQuestions} showAll={slug === "dsa-algorithms-169"} />
      ) : questions.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
          <p>No questions in this category yet.</p>
          <p className="mt-1 text-sm">Check back soon. New questions are added regularly.</p>
        </div>
      ) : (
        <CategoryQuestions questions={questions} />
      )}
    </div>
  );
}
