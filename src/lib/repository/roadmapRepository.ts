/**
 * Roadmap repository - reads `roadmap_stages`, `roadmap_topics`,
 * `roadmap_topic_questions`, `prep_plans`, and `prep_plan_days` via the
 * session-less publishable client. Public-read RLS lets us skip cookies
 * during static generation.
 */
import { cache } from "react";
import { createPublicReadClient } from "../supabase/publicRead";
import { asStringArray } from "../utils";
import type {
  PrepPlan,
  PrepPlanDay,
  PrepPlanWithDays,
  RoadmapStage,
  RoadmapStageWithTopics,
  RoadmapTopic,
  RoadmapTopicQuestion,
  RoadmapTopicWithQuestions,
  StageSlug,
} from "../schema/roadmap";

export type { RoadmapTopicWithQuestions };

interface StageRow {
  slug: string;
  name: string;
  description: string;
  position: number;
  skills: unknown;
  est_hours: number;
  readiness_level: string;
  difficulty_band: string;
}
interface TopicRow {
  slug: string;
  stage_slug: string;
  name: string;
  description: string;
  why_asked: string;
  real_world: string;
  common_patterns: unknown;
  common_mistakes: unknown;
  follow_ups: unknown;
  difficulty: "easy" | "medium" | "hard";
  frequency: "low" | "medium" | "high" | "very-high";
  mastery_minutes: number;
  position: number;
  prereq_topic_slugs: unknown;
}
interface PlanRow {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  days: number;
  questions_per_day: number;
  revision_strategy: string;
  milestone_cadence: unknown;
  focus: unknown;
  difficulty: string;
  position: number;
}
interface PlanDayRow {
  plan_slug: string;
  day_num: number;
  focus: string;
  goals: unknown;
  question_slugs: unknown;
  is_mock: boolean;
  is_revision: boolean;
}

function stageFromRow(r: StageRow): RoadmapStage {
  return {
    slug: r.slug as StageSlug,
    name: r.name,
    description: r.description,
    position: r.position,
    skills: asStringArray(r.skills),
    estHours: r.est_hours,
    readinessLevel: r.readiness_level,
    difficultyBand: r.difficulty_band,
  };
}
function topicFromRow(r: TopicRow): RoadmapTopic {
  return {
    slug: r.slug,
    stageSlug: r.stage_slug as StageSlug,
    name: r.name,
    description: r.description,
    whyAsked: r.why_asked,
    realWorld: r.real_world,
    commonPatterns: asStringArray(r.common_patterns),
    commonMistakes: asStringArray(r.common_mistakes),
    followUps: asStringArray(r.follow_ups),
    difficulty: r.difficulty,
    frequency: r.frequency,
    masteryMinutes: r.mastery_minutes,
    position: r.position,
    prereqTopicSlugs: asStringArray(r.prereq_topic_slugs),
  };
}
function planFromRow(r: PlanRow): PrepPlan {
  return {
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    description: r.description,
    days: r.days,
    questionsPerDay: r.questions_per_day,
    revisionStrategy: r.revision_strategy,
    milestoneCadence: (r.milestone_cadence as { day: number; label: string }[]) ?? [],
    focus: asStringArray(r.focus),
    difficulty: r.difficulty,
    position: r.position,
  };
}

export const getStages = cache(async (): Promise<RoadmapStage[]> => {
  const sb = createPublicReadClient();
  const { data, error } = await sb
    .from("roadmap_stages")
    .select("*")
    .order("position");
  if (error) throw new Error(`roadmap.stages: ${error.message}`);
  return (data as StageRow[]).map(stageFromRow);
});

interface BridgeRow {
  topic_slug: string;
  question_slug: string;
  position: number;
  questions: {
    title: string;
    difficulty: "easy" | "medium" | "hard";
    frequency: "low" | "medium" | "high" | "very-high";
    estimated_reading_minutes: number;
  } | null;
}

export const getStagesWithTopics = cache(
  async (): Promise<RoadmapStageWithTopics[]> => {
    const sb = createPublicReadClient();
    const [stagesRes, topicsRes, bridgeRes] = await Promise.all([
      sb.from("roadmap_stages").select("*").order("position"),
      sb.from("roadmap_topics").select("*").order("position"),
      sb
        .from("roadmap_topic_questions")
        .select(
          "topic_slug, question_slug, position, questions(title, difficulty, frequency, estimated_reading_minutes)",
        )
        .order("position"),
    ]);
    if (stagesRes.error) throw new Error(`stages: ${stagesRes.error.message}`);
    if (topicsRes.error) throw new Error(`topics: ${topicsRes.error.message}`);
    if (bridgeRes.error) throw new Error(`bridge: ${bridgeRes.error.message}`);

    const bridge = bridgeRes.data as unknown as BridgeRow[];
    const byTopic = new Map<string, RoadmapTopicQuestion[]>();
    for (const b of bridge) {
      if (!b.questions) continue;
      const list = byTopic.get(b.topic_slug) ?? [];
      list.push({
        slug: b.question_slug,
        title: b.questions.title,
        difficulty: b.questions.difficulty,
        frequency: b.questions.frequency,
        estimatedReadingMinutes: b.questions.estimated_reading_minutes,
      });
      byTopic.set(b.topic_slug, list);
    }

    const topicsByStage = new Map<string, RoadmapTopicWithQuestions[]>();
    for (const t of (topicsRes.data as TopicRow[]).map(topicFromRow)) {
      const enriched: RoadmapTopicWithQuestions = {
        ...t,
        questions: byTopic.get(t.slug) ?? [],
      };
      const list = topicsByStage.get(t.stageSlug) ?? [];
      list.push(enriched);
      topicsByStage.set(t.stageSlug, list);
    }

    return (stagesRes.data as StageRow[]).map(stageFromRow).map((s) => {
      const topics = (topicsByStage.get(s.slug) ?? []).sort(
        (a, b) => a.position - b.position,
      );
      return {
        ...s,
        topics,
        questionCount: topics.reduce((n, t) => n + t.questions.length, 0),
      };
    });
  },
);

export const getStageBySlug = cache(
  async (slug: string): Promise<RoadmapStageWithTopics | null> => {
    const all = await getStagesWithTopics();
    return all.find((s) => s.slug === slug) ?? null;
  },
);

export const getPlans = cache(async (): Promise<PrepPlan[]> => {
  const sb = createPublicReadClient();
  const { data, error } = await sb.from("prep_plans").select("*").order("position");
  if (error) throw new Error(`plans: ${error.message}`);
  return (data as PlanRow[]).map(planFromRow);
});

export const getPlanBySlug = cache(
  async (slug: string): Promise<PrepPlanWithDays | null> => {
    const sb = createPublicReadClient();
    const [planRes, daysRes] = await Promise.all([
      sb.from("prep_plans").select("*").eq("slug", slug).maybeSingle(),
      sb
        .from("prep_plan_days")
        .select("*")
        .eq("plan_slug", slug)
        .order("day_num"),
    ]);
    if (planRes.error) throw new Error(`plan: ${planRes.error.message}`);
    if (!planRes.data) return null;
    if (daysRes.error) throw new Error(`plan_days: ${daysRes.error.message}`);

    const plan = planFromRow(planRes.data as PlanRow);
    const daysList: PrepPlanDay[] = (daysRes.data as PlanDayRow[]).map((d) => ({
      dayNum: d.day_num,
      focus: d.focus,
      goals: asStringArray(d.goals),
      questionSlugs: asStringArray(d.question_slugs),
      isMock: d.is_mock,
      isRevision: d.is_revision,
    }));
    return { ...plan, daysList };
  },
);
