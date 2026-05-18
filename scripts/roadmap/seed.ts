/**
 * Roadmap seed script.
 *
 *   Reads content/roadmap.generated.json (produced by build.ts) and upserts
 *   stages → topics → topic_questions → plans → plan_days into Supabase
 *   using the service-role key.
 *
 * Usage:
 *   npm run roadmap:seed
 *
 *   Requires the 0004_roadmap.sql migration to be applied first.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal, requireEnv } from "./_env";

loadEnvLocal();

interface Generated {
  stages: Array<{
    slug: string;
    name: string;
    description: string;
    position: number;
    skills: string[];
    estHours: number;
    readinessLevel: string;
    difficultyBand: string;
  }>;
  topics: Array<{
    slug: string;
    stageSlug: string;
    name: string;
    description: string;
    whyAsked: string;
    realWorld: string;
    commonPatterns: string[];
    commonMistakes: string[];
    followUps: string[];
    difficulty: "easy" | "medium" | "hard";
    frequency: "low" | "medium" | "high" | "very-high";
    masteryMinutes: number;
    position: number;
    prereqTopicSlugs: string[];
    questionSlugs: string[];
  }>;
  plans: Array<{
    slug: string;
    name: string;
    tagline: string;
    description: string;
    days: number;
    questionsPerDay: number;
    revisionStrategy: string;
    milestoneCadence: Array<{ day: number; label: string }>;
    focus: string[];
    difficulty: string;
    position: number;
    daysList: Array<{
      dayNum: number;
      focus: string;
      goals: string[];
      questionSlugs: string[];
      isMock: boolean;
      isRevision: boolean;
    }>;
  }>;
}

async function main() {
  const file = path.resolve(process.cwd(), "content/roadmap.generated.json");
  if (!existsSync(file)) {
    console.error(`Missing ${file}. Run \`npm run roadmap:build\` first.`);
    process.exit(1);
  }
  const gen = JSON.parse(readFileSync(file, "utf8")) as Generated;

  const sb = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
  );

  console.log(`→ Upserting ${gen.stages.length} stages…`);
  {
    const rows = gen.stages.map((s) => ({
      slug: s.slug,
      name: s.name,
      description: s.description,
      position: s.position,
      skills: s.skills,
      est_hours: s.estHours,
      readiness_level: s.readinessLevel,
      difficulty_band: s.difficultyBand,
    }));
    const { error } = await sb.from("roadmap_stages").upsert(rows, { onConflict: "slug" });
    if (error) throw new Error(`stages: ${error.message}`);
  }

  console.log(`→ Upserting ${gen.topics.length} topics…`);
  {
    const rows = gen.topics.map((t) => ({
      slug: t.slug,
      stage_slug: t.stageSlug,
      name: t.name,
      description: t.description,
      why_asked: t.whyAsked,
      real_world: t.realWorld,
      common_patterns: t.commonPatterns,
      common_mistakes: t.commonMistakes,
      follow_ups: t.followUps,
      difficulty: t.difficulty,
      frequency: t.frequency,
      mastery_minutes: t.masteryMinutes,
      position: t.position,
      prereq_topic_slugs: t.prereqTopicSlugs,
    }));
    const { error } = await sb.from("roadmap_topics").upsert(rows, { onConflict: "slug" });
    if (error) throw new Error(`topics: ${error.message}`);
  }

  console.log("→ Replacing topic ↔ question bridge…");
  {
    // Wipe and re-insert per topic so removed questions actually disappear.
    for (const t of gen.topics) {
      const { error: delErr } = await sb
        .from("roadmap_topic_questions")
        .delete()
        .eq("topic_slug", t.slug);
      if (delErr) throw new Error(`rtq.delete(${t.slug}): ${delErr.message}`);

      if (t.questionSlugs.length === 0) continue;
      const rows = t.questionSlugs.map((slug, i) => ({
        topic_slug: t.slug,
        question_slug: slug,
        position: i,
      }));
      const { error: insErr } = await sb
        .from("roadmap_topic_questions")
        .upsert(rows, { onConflict: "topic_slug,question_slug" });
      if (insErr) throw new Error(`rtq.insert(${t.slug}): ${insErr.message}`);
    }
  }

  console.log(`→ Upserting ${gen.plans.length} plans…`);
  {
    const rows = gen.plans.map((p) => ({
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      days: p.days,
      questions_per_day: p.questionsPerDay,
      revision_strategy: p.revisionStrategy,
      milestone_cadence: p.milestoneCadence,
      focus: p.focus,
      difficulty: p.difficulty,
      position: p.position,
    }));
    const { error } = await sb.from("prep_plans").upsert(rows, { onConflict: "slug" });
    if (error) throw new Error(`plans: ${error.message}`);
  }

  console.log("→ Replacing plan day rotations…");
  {
    for (const p of gen.plans) {
      const { error: delErr } = await sb
        .from("prep_plan_days")
        .delete()
        .eq("plan_slug", p.slug);
      if (delErr) throw new Error(`plan_days.delete(${p.slug}): ${delErr.message}`);

      const rows = p.daysList.map((d) => ({
        plan_slug: p.slug,
        day_num: d.dayNum,
        focus: d.focus,
        goals: d.goals,
        question_slugs: d.questionSlugs,
        is_mock: d.isMock,
        is_revision: d.isRevision,
      }));
      // chunk inserts to keep payload modest
      for (let i = 0; i < rows.length; i += 100) {
        const slice = rows.slice(i, i + 100);
        const { error: insErr } = await sb.from("prep_plan_days").insert(slice);
        if (insErr) throw new Error(`plan_days.insert(${p.slug}): ${insErr.message}`);
      }
    }
  }

  console.log("\n✓ Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
