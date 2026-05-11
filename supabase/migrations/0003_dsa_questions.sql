-- =============================================================================
-- FrontendAce — DSA & Algorithms LeetCode question list
-- Idempotent: safe to re-run. Public read; service-role writes.
-- =============================================================================

create table if not exists public.dsa_questions (
  slug         text primary key,
  leetcode_id  int  not null,
  title        text not null,
  url          text not null,
  difficulty   text not null check (difficulty in ('easy','medium','hard')),
  topic        text not null,
  duration     int  not null check (duration > 0),
  in_grind75   boolean not null default false,
  position     int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists dsa_questions_in_grind75_idx
  on public.dsa_questions (in_grind75, position);
create index if not exists dsa_questions_topic_idx on public.dsa_questions (topic);
create index if not exists dsa_questions_difficulty_idx on public.dsa_questions (difficulty);

alter table public.dsa_questions enable row level security;

drop policy if exists "dsa_questions: public read" on public.dsa_questions;
create policy "dsa_questions: public read" on public.dsa_questions
  for select using (true);

drop trigger if exists dsa_questions_touch_updated on public.dsa_questions;
create trigger dsa_questions_touch_updated
  before update on public.dsa_questions
  for each row execute function public.touch_updated_at();
