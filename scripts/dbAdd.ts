/**
 * Add or update a single question in Supabase from a draft TS file.
 *
 * Usage:
 *   npm run db:add                       # reads scripts/draftQuestion.ts
 *   npm run db:add path/to/file.ts       # reads a custom path
 *
 * The draft file must `export default` a Question (or partial - defaults are
 * filled). Slug is the upsert key. Re-running with the same slug updates.
 *
 * Supabase is the source of truth. Drafts are gitignored scratchpads - once
 * the row is upserted, the draft can be deleted or overwritten with the next.
 */
import path from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal, requireEnv } from "./_env";
import { QuestionSchema, type Question } from "../src/lib/schema/question";

loadEnvLocal();

function toRow(q: Question) {
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
    code_snippets: q.codeSnippets ?? [],
    follow_ups: q.followUps ?? [],
    common_mistakes: q.commonMistakes ?? [],
    performance_considerations: q.performanceConsiderations ?? [],
    edge_cases: q.edgeCases ?? [],
    real_world_examples: q.realWorldExamples ?? [],
    senior_discussion: q.seniorDiscussion ?? null,
    related_slugs: q.relatedSlugs ?? [],
    estimated_reading_minutes: q.estimatedReadingMinutes,
    estimated_solving_minutes: q.estimatedSolvingMinutes,
    source_file: q.sourceFile ?? null,
    updated_at: new Date().toISOString(),
  };
}

async function main() {
  const arg = process.argv[2];
  const draftPath = path.resolve(process.cwd(), arg ?? "scripts/draftQuestion.ts");
  if (!existsSync(draftPath)) {
    console.error(`Draft not found: ${draftPath}`);
    console.error(`Create it (export default a Question) or pass a path.`);
    process.exit(1);
  }

  const mod = await import(pathToFileURL(draftPath).href);
  const raw = mod.default ?? mod.question;
  if (!raw) {
    console.error(`${draftPath}: must \`export default\` a Question object.`);
    process.exit(1);
  }

  const now = new Date().toISOString();
  const withDefaults: Question = QuestionSchema.parse({
    id: raw.slug ?? raw.id,
    tags: [],
    companyTags: [],
    codeSnippets: [],
    followUps: [],
    commonMistakes: [],
    performanceConsiderations: [],
    edgeCases: [],
    realWorldExamples: [],
    relatedSlugs: [],
    createdAt: now,
    updatedAt: now,
    ...raw,
  });

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { error } = await supabase
    .from("questions")
    .upsert(toRow(withDefaults), { onConflict: "slug" });

  if (error) {
    console.error(`upsert failed: ${error.message}`);
    process.exit(1);
  }
  console.log(`✓ upserted ${withDefaults.slug} (${withDefaults.category})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
