import "server-only";
import { asStringArray } from "@/lib/utils";
import { repository } from "@/lib/repository";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import type { Category, Question } from "@/lib/schema/question";

const ROW_SELECT =
  "slug,title,category,subcategory,difficulty,frequency,seniority,short_description,answer,code_snippets,follow_ups,common_mistakes,performance_considerations,edge_cases,real_world_examples,senior_discussion,related_slugs,estimated_reading_minutes,estimated_solving_minutes,source_file,created_at,updated_at,deleted_at";

type DbRow = {
  slug: string;
  title: string;
  category: Category;
  subcategory: string | null;
  difficulty: Question["difficulty"];
  frequency: Question["frequency"];
  seniority: Question["seniority"];
  short_description: string;
  answer: string | null;
  code_snippets: Question["codeSnippets"] | null;
  follow_ups: string[] | null;
  common_mistakes: string[] | null;
  performance_considerations: string[] | null;
  edge_cases: string[] | null;
  real_world_examples: string[] | null;
  senior_discussion: string | null;
  related_slugs: string[] | null;
  source_file: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  estimated_reading_minutes: number;
  estimated_solving_minutes: number;
};

function rowToQuestion(r: DbRow): Question {
  return {
    id: r.slug,
    slug: r.slug,
    title: r.title,
    category: r.category,
    subcategory: r.subcategory ?? undefined,
    tags: [],
    difficulty: r.difficulty,
    frequency: r.frequency,
    seniority: r.seniority,
    shortDescription: r.short_description,
    answer: r.answer ?? "",
    codeSnippets: r.code_snippets ?? [],
    followUps: asStringArray(r.follow_ups),
    commonMistakes: asStringArray(r.common_mistakes),
    performanceConsiderations: asStringArray(r.performance_considerations),
    edgeCases: asStringArray(r.edge_cases),
    realWorldExamples: asStringArray(r.real_world_examples),
    seniorDiscussion: r.senior_discussion ?? undefined,
    relatedSlugs: asStringArray(r.related_slugs),
    companyTags: [],
    estimatedReadingMinutes: r.estimated_reading_minutes,
    estimatedSolvingMinutes: r.estimated_solving_minutes,
    sourceFile: r.source_file ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function resolveQuestionForPage(
  slug: string,
): Promise<{ question: Question; isDeleted: boolean } | null> {
  const live = await repository.getBySlug(slug);
  if (live) return { question: live, isDeleted: false };

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("questions")
    .select(ROW_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as DbRow;
  if (!row.deleted_at) return null;
  return { question: rowToQuestion(row), isDeleted: true };
}
