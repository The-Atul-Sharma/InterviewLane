-- =============================================================================
-- InterviewLane - roadmap, topics, plans, and per-user progress
-- Idempotent: safe to re-run. Adds the structured-learning layer on top of
-- the existing question bank from 0002_questions.sql.
--
-- Public read for stage/topic/plan tables; owner-only RLS for user progress.
-- =============================================================================

-- ---------- stages -----------------------------------------------------------
create table if not exists public.roadmap_stages (
  slug              text primary key,
  name              text not null,
  description       text not null,
  position          int  not null,
  skills            jsonb not null default '[]'::jsonb,
  est_hours         int  not null,
  readiness_level   text not null,
  difficulty_band   text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists roadmap_stages_position_idx on public.roadmap_stages (position);
alter table public.roadmap_stages enable row level security;
drop policy if exists "roadmap_stages: public read" on public.roadmap_stages;
create policy "roadmap_stages: public read" on public.roadmap_stages for select using (true);


-- ---------- topics -----------------------------------------------------------
create table if not exists public.roadmap_topics (
  slug                text primary key,
  stage_slug          text not null references public.roadmap_stages(slug) on delete cascade,
  name                text not null,
  description         text not null,
  why_asked           text not null,
  real_world          text not null,
  common_patterns     jsonb not null default '[]'::jsonb,
  common_mistakes     jsonb not null default '[]'::jsonb,
  follow_ups          jsonb not null default '[]'::jsonb,
  difficulty          text not null check (difficulty in ('easy','medium','hard')),
  frequency           text not null check (frequency in ('low','medium','high','very-high')),
  mastery_minutes     int  not null,
  position            int  not null,
  prereq_topic_slugs  jsonb not null default '[]'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists roadmap_topics_stage_idx    on public.roadmap_topics (stage_slug, position);
alter table public.roadmap_topics enable row level security;
drop policy if exists "roadmap_topics: public read" on public.roadmap_topics;
create policy "roadmap_topics: public read" on public.roadmap_topics for select using (true);


-- ---------- topic ↔ question bridge -----------------------------------------
create table if not exists public.roadmap_topic_questions (
  topic_slug     text not null references public.roadmap_topics(slug) on delete cascade,
  question_slug  text not null references public.questions(slug)      on delete cascade,
  position       int  not null default 0,
  primary key (topic_slug, question_slug)
);
create index if not exists rtq_topic_idx    on public.roadmap_topic_questions (topic_slug, position);
create index if not exists rtq_question_idx on public.roadmap_topic_questions (question_slug);
alter table public.roadmap_topic_questions enable row level security;
drop policy if exists "rtq: public read" on public.roadmap_topic_questions;
create policy "rtq: public read" on public.roadmap_topic_questions for select using (true);


-- ---------- prep plans -------------------------------------------------------
create table if not exists public.prep_plans (
  slug                text primary key,
  name                text not null,
  tagline             text not null,
  description         text not null,
  days                int  not null,
  questions_per_day   int  not null,
  revision_strategy   text not null,
  milestone_cadence   jsonb not null default '[]'::jsonb,
  focus               jsonb not null default '[]'::jsonb,
  difficulty          text not null,
  position            int  not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists prep_plans_position_idx on public.prep_plans (position);
alter table public.prep_plans enable row level security;
drop policy if exists "prep_plans: public read" on public.prep_plans;
create policy "prep_plans: public read" on public.prep_plans for select using (true);


-- ---------- plan day rotation -----------------------------------------------
create table if not exists public.prep_plan_days (
  plan_slug         text not null references public.prep_plans(slug) on delete cascade,
  day_num           int  not null,
  focus             text not null,
  goals             jsonb not null default '[]'::jsonb,
  question_slugs    jsonb not null default '[]'::jsonb,
  is_mock           boolean not null default false,
  is_revision       boolean not null default false,
  primary key (plan_slug, day_num)
);
create index if not exists prep_plan_days_plan_idx on public.prep_plan_days (plan_slug, day_num);
alter table public.prep_plan_days enable row level security;
drop policy if exists "prep_plan_days: public read" on public.prep_plan_days;
create policy "prep_plan_days: public read" on public.prep_plan_days for select using (true);


-- ---------- user topic progress ---------------------------------------------
create table if not exists public.user_topic_progress (
  user_id       uuid not null references auth.users(id) on delete cascade,
  topic_slug    text not null,
  status        text not null check (status in ('started','completed')) default 'completed',
  completed_at  timestamptz not null default now(),
  primary key (user_id, topic_slug)
);
create index if not exists utp_user_idx on public.user_topic_progress (user_id, completed_at desc);
alter table public.user_topic_progress enable row level security;
drop policy if exists "utp: own rows" on public.user_topic_progress;
create policy "utp: own rows" on public.user_topic_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ---------- user plan progress ----------------------------------------------
create table if not exists public.user_plan_progress (
  user_id       uuid not null references auth.users(id) on delete cascade,
  plan_slug     text not null,
  day_num       int  not null,
  completed_at  timestamptz not null default now(),
  primary key (user_id, plan_slug, day_num)
);
create index if not exists upp_user_idx on public.user_plan_progress (user_id, plan_slug, day_num);
alter table public.user_plan_progress enable row level security;
drop policy if exists "upp: own rows" on public.user_plan_progress;
create policy "upp: own rows" on public.user_plan_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ---------- touch_updated_at triggers ---------------------------------------
drop trigger if exists roadmap_stages_touch on public.roadmap_stages;
create trigger roadmap_stages_touch before update on public.roadmap_stages
  for each row execute function public.touch_updated_at();

drop trigger if exists roadmap_topics_touch on public.roadmap_topics;
create trigger roadmap_topics_touch before update on public.roadmap_topics
  for each row execute function public.touch_updated_at();

drop trigger if exists prep_plans_touch on public.prep_plans;
create trigger prep_plans_touch before update on public.prep_plans
  for each row execute function public.touch_updated_at();
