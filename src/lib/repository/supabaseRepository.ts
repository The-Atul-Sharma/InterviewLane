/**
 * Supabase-backed repository.
 *
 * Reads `public.questions` via a session-less publishable client. Public-read
 * RLS lets us skip cookies and avoid the `cookies()`-not-available error
 * during static generation.
 */
import { cache } from "react";
import { asStringArray } from "../utils";
import { createPublicReadClient } from "../supabase/publicRead";
import {
  type Question,
  type QuestionMeta,
  type Category,
} from "../schema/question";
import type {
  QuestionFilters,
  QuestionRepository,
  RepoStats,
} from "./types";

async function createClient() {
  return createPublicReadClient();
}

const META_COLUMNS =
  "slug,title,category,difficulty,frequency,seniority,short_description,estimated_reading_minutes,estimated_solving_minutes";

const FULL_COLUMNS =
  "slug,title,category,subcategory,difficulty,frequency,seniority,short_description,answer,code_snippets,follow_ups,common_mistakes,performance_considerations,edge_cases,real_world_examples,senior_discussion,related_slugs,estimated_reading_minutes,estimated_solving_minutes,source_file,created_at,updated_at";

interface MetaRow {
  slug: string;
  title: string;
  category: Category;
  difficulty: Question["difficulty"];
  frequency: Question["frequency"];
  seniority: Question["seniority"];
  short_description: string;
  estimated_reading_minutes: number;
  estimated_solving_minutes: number;
}

interface FullRow extends MetaRow {
  subcategory: string | null;
  answer: string;
  code_snippets: Question["codeSnippets"];
  follow_ups: string[];
  common_mistakes: string[];
  performance_considerations: string[];
  edge_cases: string[];
  real_world_examples: string[];
  senior_discussion: string | null;
  related_slugs: string[];
  source_file: string | null;
  created_at: string;
  updated_at: string;
}

function metaFromRow(r: MetaRow): QuestionMeta {
  return {
    id: r.slug,
    slug: r.slug,
    title: r.title,
    category: r.category,
    tags: [],
    difficulty: r.difficulty,
    frequency: r.frequency,
    seniority: r.seniority,
    shortDescription: r.short_description,
    estimatedReadingMinutes: r.estimated_reading_minutes,
    estimatedSolvingMinutes: r.estimated_solving_minutes,
  };
}

function questionFromRow(r: FullRow): Question {
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
    answer: r.answer,
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

const allMetas = cache(async (): Promise<QuestionMeta[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select(META_COLUMNS)
    .is("deleted_at", null)
    .order("title");
  if (error) throw new Error(`questions.listAll: ${error.message}`);
  return (data as unknown as MetaRow[]).map(metaFromRow);
});

export const supabaseRepository: QuestionRepository = {
  listAll: () => allMetas(),

  async getBySlug(slug) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("questions")
      .select(FULL_COLUMNS)
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw new Error(`questions.getBySlug(${slug}): ${error.message}`);
    if (!data) return null;
    return questionFromRow(data as unknown as FullRow);
  },

  async listByCategory(category: Category) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("questions")
      .select(META_COLUMNS)
      .eq("category", category)
      .is("deleted_at", null)
      .order("position", { ascending: true })
      .order("title", { ascending: true });
    if (error) throw new Error(`questions.listByCategory: ${error.message}`);
    return (data as unknown as MetaRow[]).map(metaFromRow);
  },

  async getStats() {
    const metas = await allMetas();
    const stats: RepoStats = {
      total: metas.length,
      byCategory: {},
      byDifficulty: {},
      byFrequency: {},
      bySeniority: {},
      generatedAt: new Date().toISOString(),
      sources: ["supabase"],
    };
    for (const m of metas) {
      stats.byCategory[m.category] = (stats.byCategory[m.category] ?? 0) + 1;
      stats.byDifficulty[m.difficulty] = (stats.byDifficulty[m.difficulty] ?? 0) + 1;
      stats.byFrequency[m.frequency] = (stats.byFrequency[m.frequency] ?? 0) + 1;
      stats.bySeniority[m.seniority] = (stats.bySeniority[m.seniority] ?? 0) + 1;
    }
    return stats;
  },

  async filter(filters: QuestionFilters) {
    let arr = await allMetas();
    if (filters.category) arr = arr.filter((q) => q.category === filters.category);
    if (filters.difficulty) arr = arr.filter((q) => q.difficulty === filters.difficulty);
    if (filters.query) {
      const q = filters.query.toLowerCase();
      arr = arr.filter(
        (x) =>
          x.title.toLowerCase().includes(q) ||
          x.shortDescription.toLowerCase().includes(q),
      );
    }
    return arr;
  },
};
