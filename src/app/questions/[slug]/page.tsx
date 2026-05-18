import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Flame,
  Layers,
  TriangleAlert,
  Lightbulb,
  Building2,
  ChevronRight,
} from "lucide-react";
import { repository } from "@/lib/repository";
import { resolveQuestionForPage } from "@/lib/resolveQuestionPage";
import { CATEGORY_META } from "@/lib/categories";
import { renderMarkdown } from "@/lib/markdown";
import { siteUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CodeBlock } from "@/components/codeBlock";
import { TableOfContents } from "@/components/toc";
import { BookmarkAndCompleteButtons } from "@/components/bookmarkButton";
import { UserStateBoot } from "@/components/userStateBoot";
import { AdminAnswerEditorLazy } from "@/components/admin/adminAnswerEditorLazy";
import { AdminRestoreQuestionLazy } from "@/components/admin/adminRestoreQuestionLazy";
import { ReadingProgress } from "@/components/readingProgress";
import { QuestionCard } from "@/components/questionCard";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveQuestionForPage(slug);
  if (!resolved) return {};
  const { question: q, isDeleted } = resolved;
  return {
    title: isDeleted ? `${q.title} (removed)` : q.title,
    description: q.shortDescription,
    alternates: { canonical: siteUrl(`/questions/${q.slug}`) },
    robots: isDeleted ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title: q.title,
      description: q.shortDescription,
      url: siteUrl(`/questions/${q.slug}`),
    },
    twitter: {
      card: "summary_large_image",
      title: q.title,
      description: q.shortDescription,
    },
  };
}

const DIFFICULTY_VARIANT = { easy: "success", medium: "warning", hard: "danger" } as const;

export default async function QuestionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await resolveQuestionForPage(slug);
  if (!resolved) notFound();
  const { question: q, isDeleted } = resolved;

  const cat = CATEGORY_META[q.category];
  const [{ html, headings }, related] = await Promise.all([
    renderMarkdown(q.answer),
    isDeleted ? Promise.resolve([]) : repository.listBySlugs(q.relatedSlugs.slice(0, 6)),
  ]);
  const toc = headings
    .filter((h) => h.level <= 3)
    .map((h) => ({ id: h.id, text: h.text, level: h.level }));

  const qaJsonLd = !isDeleted
    ? {
        "@context": "https://schema.org",
        "@type": "QAPage",
        mainEntity: {
          "@type": "Question",
          name: q.title,
          text: q.shortDescription,
          answerCount: 1,
          acceptedAnswer: {
            "@type": "Answer",
            text: answerSnippetForSeo(q.answer, q.shortDescription),
            url: siteUrl(`/questions/${q.slug}`),
          },
        },
      }
    : null;

  const breadcrumbJsonLd = !isDeleted
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl(),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Categories",
            item: siteUrl("/categories"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: cat?.name ?? q.category,
            item: siteUrl(`/categories/${q.category}`),
          },
          {
            "@type": "ListItem",
            position: 4,
            name: q.title,
            item: siteUrl(`/questions/${q.slug}`),
          },
        ],
      }
    : null;

  const jsonLds = [qaJsonLd, breadcrumbJsonLd].filter(Boolean);

  return (
    <>
      <UserStateBoot />
      <ReadingProgress />
      {jsonLds.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLds) }}
        />
      )}

      <div className="container-page py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
        <article className="min-w-0">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/categories" className="hover:text-foreground">
              Categories
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/categories/${q.category}`} className="hover:text-foreground">
              {cat?.name ?? q.category}
            </Link>
          </nav>

          <Link
            href={`/categories/${q.category}`}
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to {cat?.name}
          </Link>

          {isDeleted && (
            <div className="mb-4">
              <AdminRestoreQuestionLazy slug={q.slug} />
            </div>
          )}

          {/* Header */}
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted" className="capitalize">
                {cat?.name}
              </Badge>
              <Badge variant={DIFFICULTY_VARIANT[q.difficulty]} className="capitalize">
                {q.difficulty}
              </Badge>
              {q.frequency === "very-high" && (
                <Badge variant="info" className="gap-1">
                  <Flame className="h-3 w-3" /> very high
                </Badge>
              )}
              <Badge variant="outline" className="capitalize">
                {q.seniority}
              </Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{q.title}</h1>
            <p className="max-w-3xl text-base text-muted-foreground sm:text-lg">
              {q.shortDescription}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {q.estimatedReadingMinutes} min read
              </span>
              <span>·</span>
              <span>~{q.estimatedSolvingMinutes} min to think through</span>
              {q.companyTags.length > 0 && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> Asked at {q.companyTags.join(", ")}
                  </span>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isDeleted && <BookmarkAndCompleteButtons slug={q.slug} />}
              <AdminAnswerEditorLazy question={q} isDeleted={isDeleted} />
            </div>
          </header>

          <Separator className="my-8" />

          {/* Answer */}
          <section
            id="answer"
            className="prose-q"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* Code */}
          {q.codeSnippets.length > 0 && (
            <section id="code" className="mt-10">
              <h2 className="mb-2 text-xl font-semibold tracking-tight">Code</h2>
              {q.codeSnippets.map((c, i) => (
                <CodeBlock
                  key={i}
                  code={c.code}
                  language={c.language}
                  caption={c.caption}
                />
              ))}
            </section>
          )}

          {/* Follow-ups */}
          {q.followUps.length > 0 && (
            <SectionList
              id="follow-ups"
              icon={Lightbulb}
              title="Follow-up questions"
              items={q.followUps}
            />
          )}

          {/* Common mistakes */}
          {q.commonMistakes.length > 0 && (
            <SectionList
              id="common-mistakes"
              icon={TriangleAlert}
              title="Common mistakes"
              items={q.commonMistakes}
            />
          )}

          {/* Performance considerations */}
          {q.performanceConsiderations.length > 0 && (
            <SectionList
              id="performance"
              icon={Layers}
              title="Performance considerations"
              items={q.performanceConsiderations}
            />
          )}

          {/* Edge cases */}
          {q.edgeCases.length > 0 && (
            <SectionList id="edge-cases" icon={TriangleAlert} title="Edge cases" items={q.edgeCases} />
          )}

          {/* Real-world examples */}
          {q.realWorldExamples.length > 0 && (
            <SectionList
              id="real-world"
              icon={Building2}
              title="Real-world examples"
              items={q.realWorldExamples}
            />
          )}

          {/* Senior discussion */}
          {q.seniorDiscussion && (
            <section id="senior-discussion" className="mt-10">
              <h2 className="mb-2 text-xl font-semibold tracking-tight">Senior engineer discussion</h2>
              <div className="rounded-lg border bg-card p-5 text-sm leading-7 text-muted-foreground">
                {q.seniorDiscussion}
              </div>
            </section>
          )}

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-xl font-semibold tracking-tight">Related questions</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <QuestionCard key={r.slug} q={r} compact />
                ))}
              </div>
            </section>
          )}
        </article>

        {/* TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-6">
            <TableOfContents items={toc} />
            <Separator />
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="font-semibold uppercase tracking-wider">Estimated</p>
              <p>{q.estimatedReadingMinutes} min read</p>
              <p>{q.estimatedSolvingMinutes} min to solve</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function answerSnippetForSeo(answer: string, fallback: string): string {
  const stripped = answer
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_~\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped.length < 40) return fallback;
  if (stripped.length <= 300) return stripped;
  return stripped.slice(0, 297).replace(/\s+\S*$/, "") + "…";
}

function SectionList({
  id,
  icon: Icon,
  title,
  items,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
}) {
  return (
    <section id={id} className="mt-10">
      <h2 className="mb-3 inline-flex items-center gap-2 text-xl font-semibold tracking-tight">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </h2>
      <ul className="space-y-2 rounded-lg border bg-card p-5 text-sm leading-7">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-foreground/90">
            <span className="text-muted-foreground">•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

