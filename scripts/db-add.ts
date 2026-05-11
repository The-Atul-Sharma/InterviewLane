/**
 * Add or update a single question in Supabase from a draft TS file.
 *
 * Usage:
 *   npm run db:add                       # reads scripts/draft.question.ts
 *   npm run db:add path/to/file.ts       # reads a custom path
 *
 * The draft file must `export default` a Question (or partial — defaults are
 * filled). Slug is the upsert key. Re-running with the same slug updates.
 *
 * Supabase is the source of truth. Drafts are gitignored scratchpads — once
 * the row is upserted, the draft can be deleted or overwritten with the next.
 */
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { QuestionSchema, type Question } from "../src/lib/schema/question";

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SECRET = process.env.SUPABASE_SECRET_KEY ?? "";
if (!SUPABASE_URL || !SECRET) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

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
  const draftPath = path.resolve(process.cwd(), arg ?? "scripts/draft.question.ts");
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

  const supabase = createClient(SUPABASE_URL, SECRET, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

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
