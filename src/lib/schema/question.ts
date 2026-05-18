import { z } from "zod";

export const CATEGORIES = [
  "react",
  "javascript",
  "nextjs",
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
  "behavioral",
  "dsa-algorithms",
  "dsa-algorithms-75",
  "dsa-algorithms-169",
] as const;

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const FREQUENCIES = ["low", "medium", "high", "very-high"] as const;
export const SENIORITY = ["junior", "mid", "senior", "staff"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type Frequency = (typeof FREQUENCIES)[number];
type Seniority = (typeof SENIORITY)[number];

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

export type Question = z.infer<typeof QuestionSchema>;

/** Lean meta — what list pages, search, and dashboards consume. */
export interface QuestionMeta {
  id: string;
  slug: string;
  title: string;
  category: Category;
  tags: string[];
  difficulty: Difficulty;
  frequency: Frequency;
  seniority: Seniority;
  shortDescription: string;
  estimatedReadingMinutes: number;
  estimatedSolvingMinutes: number;
}

export interface CategoryMeta {
  slug: Category;
  name: string;
  description: string;
  icon: string;
  accent: string;
}
