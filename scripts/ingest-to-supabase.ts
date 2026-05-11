/**
 * One-shot ingest → Supabase.
 *
 * Reads `content/*.txt`, extracts and synthesizes prompts, runs them through
 * the provider chain (curated → heuristic), dedupes, and upserts every
 * resulting question into Supabase. No JSON files are written.
 *
 * This replaces the "ingest → JSON → push" two-step. The file-based pipeline
 * still works (`npm run ingest`) for static builds, but Supabase is now the
 * authoritative content store.
 *
 * Idempotent: re-running upserts by slug; re-running without source changes
 * just bumps `updated_at`.
 *
 * Usage:
 *   npm run db:sync                      # ingest + push every question
 *   npm run db:sync -- --skip-placeholders   # only push curated answers
 *   npm run db:sync -- --dry-run             # report counts, no writes
 */
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  QuestionSchema,
  CATEGORIES,
  type Question,
} from "../src/lib/schema/question";
import { CATEGORY_META } from "../src/lib/categories";
import { readContentFolder } from "./ingest/reader";
import { extractQuestions } from "./ingest/extractor";
import { synthesizeFromContext } from "./ingest/synthesizer";
import { manualExtractedQuestions } from "./ingest/manual-prompts";
import { dedupe } from "./ingest/dedupe";
import { curatedProvider } from "./ingest/providers/curated";
import { CURATED_QUESTIONS } from "./ingest/seed/curated-seed";

// -- env loader ---------------------------------------------------------------
(function loadEnvLocal() {
  const file = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = v;
  }
})();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SECRET = process.env.SUPABASE_SECRET_KEY ?? "";

const PLACEHOLDER_PREFIX = "> This question was imported from";

interface Args {
  dryRun: boolean;
  skipPlaceholders: boolean;
}
function parseArgs(): Args {
  const out: Args = { dryRun: false, skipPlaceholders: false };
  for (const a of process.argv.slice(2)) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--skip-placeholders") out.skipPlaceholders = true;
  }
  return out;
}

function isPlaceholder(q: Question): boolean {
  return q.answer.trim().startsWith(PLACEHOLDER_PREFIX);
}

function questionRow(q: Question) {
  return {
    slug: q.slug,
    title: q.title,
    category: q.category,
    subcategory: q.subcategory ?? null,
    difficulty: q.difficulty,
    frequency: q.frequency,
    seniority: q.seniority,
    short_description: q.shortDescription,
    answer: q.answer,
    code_snippets: q.codeSnippets,
    follow_ups: q.followUps,
    common_mistakes: q.commonMistakes,
    performance_considerations: q.performanceConsiderations,
    edge_cases: q.edgeCases,
    real_world_examples: q.realWorldExamples,
    senior_discussion: q.seniorDiscussion ?? null,
    related_slugs: q.relatedSlugs,
    estimated_reading_minutes: q.estimatedReadingMinutes,
    estimated_solving_minutes: q.estimatedSolvingMinutes,
    source_file: q.sourceFile ?? null,
    deleted_at: null,
  };
}

async function main() {
  const args = parseArgs();
  if (!URL || !SECRET) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local.");
    process.exit(1);
  }

  // 1. Extract from txt files.
  const ROOT = path.resolve(process.cwd());
  const docs = await readContentFolder(path.join(ROOT, "content"));
  const direct = docs.flatMap(extractQuestions);
  const synthesized = synthesizeFromContext(docs);
  const manual = manualExtractedQuestions();
  console.log(
    `[sync] ${docs.length} files → ${direct.length} direct + ${synthesized.length} synthesized + ${manual.length} manual`,
  );

  // 2. Enrich via provider chain (curated → heuristic).
  const enriched: Question[] = [];
  for (const e of [...direct, ...synthesized, ...manual]) {
    try {
      const q = await curatedProvider.enrich(e);
      enriched.push(QuestionSchema.parse(q));
    } catch (err) {
      console.warn(`[sync] enrichment failed for "${e.rawTitle}":`, (err as Error).message);
    }
  }

  // 3. Add seed entries that don't match any source-file prompt directly so
  //    they're still pushed (e.g. curated answers authored without a matching
  //    raw prompt).
  const slugsSoFar = new Set(enriched.map((q) => q.slug));
  const now = new Date().toISOString();
  for (const seed of CURATED_QUESTIONS) {
    const slug = seed.question.slug;
    if (slugsSoFar.has(slug)) continue;
    enriched.push(
      QuestionSchema.parse({
        ...seed.question,
        sourceFile: seed.question.sourceFile ?? "curated-seed.ts",
        createdAt: now,
        updatedAt: now,
      } as Question),
    );
    slugsSoFar.add(slug);
  }

  // 4. Dedupe near-identical titles, then drop exact slug collisions
  //    (two distinct titles can normalize to the same slug after slugify).
  let questions = dedupe(enriched);
  const bySlug = new Map<string, Question>();
  for (const q of questions) {
    const prev = bySlug.get(q.slug);
    if (!prev) bySlug.set(q.slug, q);
    else {
      // Prefer the richer answer when slugs collide.
      bySlug.set(q.slug, prev.answer.length >= q.answer.length ? prev : q);
    }
  }
  questions = [...bySlug.values()];
  console.log(`[sync] ${questions.length} unique questions after dedupe`);

  if (args.skipPlaceholders) {
    const before = questions.length;
    questions = questions.filter((q) => !isPlaceholder(q));
    console.log(`[sync] ${before - questions.length} placeholders skipped (--skip-placeholders)`);
  }

  // 5. Aggregate categories. Tags are intentionally not synced anymore —
  //    the feature was removed from the UI/repository.
  const usedCategories = new Set<string>(questions.map((q) => q.category));

  console.log(
    `[sync] ${questions.length} questions, ${usedCategories.size} categories` +
      `${args.dryRun ? " (dry run)" : ""}`,
  );
  if (args.dryRun) return;

  // 6. Push.
  const client: SupabaseClient = createClient(URL, SECRET, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // categories
  const catRows = CATEGORIES.filter((c) => usedCategories.has(c)).map((slug, position) => {
    const meta = CATEGORY_META[slug];
    return {
      slug,
      name: meta?.name ?? slug,
      description: meta?.description ?? null,
      accent: meta?.accent ?? null,
      icon: meta?.icon ?? null,
      position,
    };
  });
  if (catRows.length) {
    const { error } = await client.from("categories").upsert(catRows, { onConflict: "slug" });
    if (error) throw new Error(`categories upsert: ${error.message}`);
  }

  // questions in chunks
  const CHUNK = 50;
  for (let i = 0; i < questions.length; i += CHUNK) {
    const chunk = questions.slice(i, i + CHUNK).map(questionRow);
    const { error } = await client.from("questions").upsert(chunk, { onConflict: "slug" });
    if (error) throw new Error(`questions upsert: ${error.message}`);
    console.log(`[sync] questions ${i + chunk.length}/${questions.length}`);
  }

  console.log(`[sync] done — ${questions.length} questions live in Supabase.`);
}

main().catch((err) => {
  console.error("[sync] failed:", err);
  process.exit(1);
});
