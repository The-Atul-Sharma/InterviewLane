/**
 * Roadmap build script.
 *
 *   Pulls all questions from Supabase, buckets each into exactly one topic
 *   using the routing rules in topic-metadata.ts, and writes a single JSON
 *   artifact at content/roadmap.generated.json that `seed.ts` upserts.
 *
 * Usage:
 *   npm run roadmap:build
 *
 *   Optional flag:  --report   prints unbucketed / low-score questions
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal, requireEnv } from "./_env";
import { STAGES } from "./stage-metadata";
import { TOPICS, TOPIC_BY_SLUG, topicScore, type AuthoredTopic } from "./topic-metadata";
import { PLANS } from "./plan-metadata";

loadEnvLocal();

interface Q {
  slug: string;
  title: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  frequency: "low" | "medium" | "high" | "very-high";
  seniority: "junior" | "mid" | "senior" | "staff";
  estimated_reading_minutes: number;
}

const REPORT = process.argv.includes("--report");

function rankWeight(q: Q): number {
  const f = { low: 1, medium: 2, high: 3, "very-high": 4 }[q.frequency];
  const d = { easy: 1, medium: 2, hard: 3 }[q.difficulty];
  return f * 10 + d;
}

function bucket(questions: Q[]): {
  byTopic: Record<string, Q[]>;
  unbucketed: Q[];
} {
  const byTopic: Record<string, Q[]> = Object.fromEntries(TOPICS.map((t) => [t.slug, [] as Q[]]));
  const unbucketed: Q[] = [];

  for (const q of questions) {
    let best: { topic: AuthoredTopic; score: number } | null = null;
    for (const t of TOPICS) {
      const s = topicScore(t, q);
      if (s <= 0) continue;
      if (
        !best ||
        s > best.score ||
        (s === best.score && t.routing.priority > best.topic.routing.priority)
      ) {
        best = { topic: t, score: s };
      }
    }
    if (best) byTopic[best.topic.slug].push(q);
    else unbucketed.push(q);
  }

  // Sort each topic bucket by frequency × difficulty, then by title for stability.
  for (const slug of Object.keys(byTopic)) {
    byTopic[slug].sort((a, b) => {
      const r = rankWeight(b) - rankWeight(a);
      return r !== 0 ? r : a.title.localeCompare(b.title);
    });
  }

  return { byTopic, unbucketed };
}

function seededPick(slugs: string[], seed: number, count: number, exclude: Set<string>): string[] {
  if (slugs.length === 0) return [];
  const out: string[] = [];
  const offset = Math.floor(((seed % 1000) / 1000) * slugs.length);
  // First pass: prefer slugs not in exclude.
  for (let i = 0; i < slugs.length && out.length < count; i++) {
    const slug = slugs[(offset + i) % slugs.length];
    if (exclude.has(slug)) continue;
    out.push(slug);
  }
  return out;
}

const seedFromString = (s: string) =>
  [...s].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);

async function main() {
  const sb = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
  );

  console.log("→ Pulling questions from Supabase…");
  const { data, error } = await sb
    .from("questions")
    .select("slug,title,category,difficulty,frequency,seniority,estimated_reading_minutes")
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  const questions = data as Q[];
  console.log(`  ${questions.length} questions loaded`);

  console.log("→ Bucketing into topics…");
  const { byTopic, unbucketed } = bucket(questions);

  // ----- emit topics -----
  const topicsOut = TOPICS.map((t, idxAcrossAll) => {
    const stageTopics = TOPICS.filter((x) => x.stageSlug === t.stageSlug);
    const position = stageTopics.indexOf(t) + 1;
    const qs = byTopic[t.slug];
    const { routing: _routing, ...rest } = t;
    return {
      ...rest,
      position,
      questionSlugs: qs.map((q) => q.slug),
      questionCount: qs.length,
      _globalPosition: idxAcrossAll,
    };
  });

  // ----- emit stages -----
  const stagesOut = STAGES.map((s) => ({
    ...s,
    topicCount: topicsOut.filter((t) => t.stageSlug === s.slug).length,
    questionCount: topicsOut
      .filter((t) => t.stageSlug === s.slug)
      .reduce((n, t) => n + t.questionCount, 0),
  }));

  // ----- emit plans with deterministic question fills -----
  const plansOut = PLANS.map((p, idx) => {
    const daysList = p.template.map((d, di) => {
      const dayNum = di + 1;
      const seed = seedFromString(`${p.slug}:${dayNum}`);
      const slugs: string[] = [];
      const exclude = new Set<string>(); // day-scoped: no dupes within a day
      // pull questionsPerDay slugs, rotating through the day's topics
      for (let i = 0; i < p.questionsPerDay; i++) {
        const topicSlug = d.topics[i % d.topics.length];
        const topic = TOPIC_BY_SLUG[topicSlug];
        if (!topic) continue;
        const pool = byTopic[topicSlug];
        if (!pool || pool.length === 0) continue;
        const pick = seededPick(
          pool.map((q) => q.slug),
          seed + i * 17,
          1,
          exclude,
        )[0];
        if (pick) {
          slugs.push(pick);
          exclude.add(pick);
        }
      }
      return {
        dayNum,
        focus: d.focus,
        goals: d.goals,
        questionSlugs: slugs,
        isMock: !!d.isMock,
        isRevision: !!d.isRevision,
      };
    });
    const { template: _template, ...rest } = p;
    return { ...rest, position: idx + 1, daysList };
  });

  const out = {
    generatedAt: new Date().toISOString(),
    stages: stagesOut,
    topics: topicsOut,
    plans: plansOut,
    report: {
      totalQuestions: questions.length,
      bucketed: questions.length - unbucketed.length,
      unbucketedCount: unbucketed.length,
      perTopicCounts: Object.fromEntries(
        TOPICS.map((t) => [t.slug, byTopic[t.slug].length]),
      ),
      unbucketed: unbucketed.map((q) => ({ slug: q.slug, title: q.title, category: q.category })),
    },
  };

  const outDir = path.resolve(process.cwd(), "content");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "roadmap.generated.json");
  writeFileSync(outPath, JSON.stringify(out, null, 2));

  console.log(`\n→ Wrote ${outPath}`);
  console.log(`  bucketed:   ${out.report.bucketed} / ${out.report.totalQuestions}`);
  console.log(`  unbucketed: ${out.report.unbucketedCount}`);
  console.log("\nPer-topic counts:");
  for (const t of TOPICS) {
    console.log(`  ${String(out.report.perTopicCounts[t.slug]).padStart(4)}  ${t.slug}`);
  }

  if (REPORT && unbucketed.length) {
    console.log("\nUnbucketed:");
    for (const q of unbucketed) console.log(`  [${q.category}] ${q.title}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
