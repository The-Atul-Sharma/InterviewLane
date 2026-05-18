-- =============================================================================
-- Add `position` to public.questions for per-category practice ordering.
-- Idempotent: safe to re-run.
-- =============================================================================

alter table public.questions
  add column if not exists position int not null default 0;

create index if not exists questions_category_position_idx
  on public.questions (category, position)
  where deleted_at is null;
