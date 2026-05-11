import { z } from "zod";

export const CATEGORIES = [
  "frontend",
  "react",
  "javascript",
  "typescript",
  "css",
  "html",
  "browser-internals",
  "performance",
  "accessibility",
  "system-design",
  "machine-coding",
  "testing",
  "security",
  "networking",
  "architecture",
  "behavioral",
  "dsa-algorithms",
] as const;

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const FREQUENCIES = ["low", "medium", "high", "very-high"] as const;
export const SENIORITY = ["junior", "mid", "senior", "staff"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type Frequency = (typeof FREQUENCIES)[number];
export type Seniority = (typeof SENIORITY)[number];

export const CodeSnippetSchema = z.object({
  language: z.string(),
  code: z.string(),
  caption: z.string().optional(),
});

/** Full question — only loaded on detail pages. */
export const QuestionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  category: z.enum(CATEGORIES),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(DIFFICULTIES),
  frequency: z.enum(FREQUENCIES),
  seniority: z.enum(SENIORITY),
  shortDescription: z.string(),
  answer: z.string(),
  codeSnippets: z.array(CodeSnippetSchema).default([]),
  followUps: z.array(z.string()).default([]),
  commonMistakes: z.array(z.string()).default([]),
  performanceConsiderations: z.array(z.string()).default([]),
  edgeCases: z.array(z.string()).default([]),
  realWorldExamples: z.array(z.string()).default([]),
  seniorDiscussion: z.string().optional(),
  relatedSlugs: z.array(z.string()).default([]),
  companyTags: z.array(z.string()).default([]),
  estimatedReadingMinutes: z.number().int().positive(),
  estimatedSolvingMinutes: z.number().int().positive(),
  sourceFile: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Lean meta — what list pages, search, and dashboards consume.
 * ~250 bytes per question; an index of 3000 questions is ~750KB.
 */
export const QuestionMetaSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  category: z.enum(CATEGORIES),
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(DIFFICULTIES),
  frequency: z.enum(FREQUENCIES),
  seniority: z.enum(SENIORITY),
  shortDescription: z.string(),
  estimatedReadingMinutes: z.number().int().positive(),
  estimatedSolvingMinutes: z.number().int().positive(),
});

export type Question = z.infer<typeof QuestionSchema>;
export type QuestionMeta = z.infer<typeof QuestionMetaSchema>;
export type CodeSnippet = z.infer<typeof CodeSnippetSchema>;

export function toMeta(q: Question): QuestionMeta {
  return {
    id: q.id,
    slug: q.slug,
    title: q.title,
    category: q.category,
    tags: q.tags,
    difficulty: q.difficulty,
    frequency: q.frequency,
    seniority: q.seniority,
    shortDescription: q.shortDescription,
    estimatedReadingMinutes: q.estimatedReadingMinutes,
    estimatedSolvingMinutes: q.estimatedSolvingMinutes,
  };
}

export const CategoryMetaSchema = z.object({
  slug: z.enum(CATEGORIES),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  accent: z.string(),
});
export type CategoryMeta = z.infer<typeof CategoryMetaSchema>;
