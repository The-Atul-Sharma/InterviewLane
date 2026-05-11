/**
 * Fallback heuristic provider — produces a minimal, valid Question
 * from raw extracted text alone, no LLM call. Used when no curated seed
 * matches, so the pipeline never drops content silently.
 */
import type { Question } from "../../../src/lib/schema/question";
import type { EnrichmentProvider, ExtractedQuestion } from "../types";
import { CATEGORIES } from "../../../src/lib/schema/question";
import { slugify } from "../slug";

const KEYWORD_TO_CATEGORY: { keywords: RegExp; category: (typeof CATEGORIES)[number] }[] = [
  { keywords: /\b(react|hook|fiber|jsx|hydration|strictmode)\b/i, category: "react" },
  { keywords: /\b(typescript|generic|infer)\b/i, category: "typescript" },
  { keywords: /\b(css|flex|grid|layout|specificity)\b/i, category: "css" },
  { keywords: /\b(html|semantic)\b/i, category: "html" },
  {
    keywords: /\b(event loop|garbage collection|v8|memory leak|microtask|macrotask)\b/i,
    category: "browser-internals",
  },
  {
    keywords: /\b(performance|bundle|web vital|lazy|prefetch|virtualization|caching)\b/i,
    category: "performance",
  },
  { keywords: /\b(accessibility|aria|a11y)\b/i, category: "accessibility" },
  {
    keywords: /\b(architecture|micro[- ]frontend|monorepo|module|scalable)\b/i,
    category: "system-design",
  },
  { keywords: /\b(xss|csrf|cookie|csp|auth|security)\b/i, category: "security" },
  { keywords: /\b(test|jest|playwright|cypress|rtl)\b/i, category: "testing" },
  { keywords: /\b(http|cors|websocket|fetch)\b/i, category: "networking" },
  { keywords: /\b(closure|prototype|promise|async|js|javascript)\b/i, category: "javascript" },
  {
    // Narrow: only flag titles that are clearly behavioral. The earlier
    // `round|interview` keywords swept up machine-coding/stacks/closures
    // questions whose context just mentioned an interview round.
    keywords:
      /\b(behavio(u)?ral|star (method|story|stories)|leadership principle|tell me about a time|teammate|disagreement|stakeholder|motivation)\b/i,
    category: "behavioral",
  },
];

function inferCategory(title: string, context?: string): (typeof CATEGORIES)[number] {
  const text = `${context ?? ""} ${title}`;
  for (const { keywords, category } of KEYWORD_TO_CATEGORY) {
    if (keywords.test(text)) return category;
  }
  return "frontend";
}

function inferDifficulty(title: string): "easy" | "medium" | "hard" {
  if (/\b(deeply|internal|fiber|architecture|design|scal)\b/i.test(title)) return "hard";
  if (/\b(explain|how|why|when|prevent|optimize)\b/i.test(title)) return "medium";
  return "easy";
}

export const heuristicProvider: EnrichmentProvider = {
  name: "heuristic",
  async enrich(extracted: ExtractedQuestion): Promise<Question> {
    const title = normalizeTitle(extracted.rawTitle);
    const category = inferCategory(title, extracted.context);
    const slug = slugify(title);
    const now = new Date().toISOString();
    return {
      id: slug,
      slug,
      title,
      category,
      tags: [],
      difficulty: inferDifficulty(title),
      frequency: "medium",
      seniority: "mid",
      shortDescription: title,
      answer: `> This question was imported from \`${extracted.sourceFile}\` and is awaiting an authored answer. Re-run the ingestion pipeline with an AI provider configured to auto-generate the deep explanation.`,
      codeSnippets: [],
      followUps: [],
      commonMistakes: [],
      performanceConsiderations: [],
      edgeCases: [],
      realWorldExamples: [],
      relatedSlugs: [],
      companyTags: [],
      estimatedReadingMinutes: 3,
      estimatedSolvingMinutes: 10,
      sourceFile: extracted.sourceFile,
      createdAt: now,
      updatedAt: now,
    };
  },
};

function normalizeTitle(s: string) {
  let t = s.trim();
  if (t.endsWith("?")) t = t.slice(0, -1);
  return t.charAt(0).toUpperCase() + t.slice(1);
}
