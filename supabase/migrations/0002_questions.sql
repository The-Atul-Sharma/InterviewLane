-- =============================================================================
-- FrontendPrep — questions / categories / tags 
-- Idempotent: safe to re-run. Adds content tables on top of 0001_init.sql.
-- Reads (questions, categories, tags) are public; writes are
-- service-role only.
-- =============================================================================

-- ---------- categories -------------------------------------------------------
create table if not exists public.categories (
  slug         text primary key,
  name         text not null,
  description  text,
  accent       text,
  icon         text,
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "categories: public read" on public.categories;
create policy "categories: public read" on public.categories
  for select using (true);


-- ---------- tags -------------------------------------------------------------
create table if not exists public.tags (
  slug        text primary key,
  name        text not null,
  created_at  timestamptz not null default now()
);

alter table public.tags enable row level security;

drop policy if exists "tags: public read" on public.tags;
create policy "tags: public read" on public.tags for select using (true);


-- ---------- questions --------------------------------------------------------
-- The slug is the public identifier and is unique. Soft-deleted via deleted_at
-- so historical bookmarks/completed rows keep referential meaning.
create table if not exists public.questions (
  slug                          text primary key,
  title                         text not null,
  category                      text not null references public.categories(slug),
  subcategory                   text,
  difficulty                    text not null check (difficulty in ('easy','medium','hard')),
  frequency                     text not null check (frequency in ('low','medium','high','very-high')),
  seniority                     text not null check (seniority in ('junior','mid','senior','staff')),
  short_description             text not null,
  answer                        text not null,
  code_snippets                 jsonb not null default '[]'::jsonb,
  follow_ups                    jsonb not null default '[]'::jsonb,
  common_mistakes               jsonb not null default '[]'::jsonb,
  performance_considerations    jsonb not null default '[]'::jsonb,
  edge_cases                    jsonb not null default '[]'::jsonb,
  real_world_examples           jsonb not null default '[]'::jsonb,
  senior_discussion             text,
  related_slugs                 jsonb not null default '[]'::jsonb,
  estimated_reading_minutes     int not null check (estimated_reading_minutes > 0),
  estimated_solving_minutes     int not null check (estimated_solving_minutes > 0),
  source_file                   text,
  -- Generated tsvector for full-text search. Title + short desc are weighted
  -- highest, then the answer body, then the senior-discussion notes.
  search_doc                    tsvector
    generated always as (
      setweight(to_tsvector('english', coalesce(title, '')), 'A')
      || setweight(to_tsvector('english', coalesce(short_description, '')), 'B')
      || setweight(to_tsvector('english', coalesce(answer, '')), 'C')
      || setweight(to_tsvector('english', coalesce(senior_discussion, '')), 'D')
    ) stored,
  -- Reserved for future pgvector embeddings. Add the extension and column type
  -- in a follow-up migration when semantic search is wired up.
  -- embedding                  vector(1536),
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),
  deleted_at                    timestamptz
);

create index if not exists questions_search_idx on public.questions using gin (search_doc);
create index if not exists questions_category_idx on public.questions (category) where deleted_at is null;
create index if not exists questions_difficulty_idx on public.questions (difficulty) where deleted_at is null;
create index if not exists questions_frequency_idx on public.questions (frequency) where deleted_at is null;
-- Trigram index for fuzzy title matching (used by dedupe + typo-tolerant search).
create extension if not exists pg_trgm;
create index if not exists questions_title_trgm_idx on public.questions using gin (title gin_trgm_ops);

alter table public.questions enable row level security;

drop policy if exists "questions: public read non-deleted" on public.questions;
create policy "questions: public read non-deleted" on public.questions
  for select using (deleted_at is null);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists questions_touch_updated on public.questions;
create trigger questions_touch_updated
  before update on public.questions
  for each row execute function public.touch_updated_at();


-- ---------- junctions --------------------------------------------------------
create table if not exists public.question_tags (
  question_slug text not null references public.questions(slug) on delete cascade,
  tag_slug      text not null references public.tags(slug) on delete cascade,
  primary key (question_slug, tag_slug)
);
create index if not exists question_tags_tag_idx on public.question_tags (tag_slug);

alter table public.question_tags enable row level security;

drop policy if exists "question_tags: public read" on public.question_tags;
create policy "question_tags: public read" on public.question_tags for select using (true);


-- ---------- search RPC -------------------------------------------------------
-- Ranked FTS query, with optional category and difficulty filters.
-- Falls back to trigram similarity when the websearch query has no matches,
-- so typos like "clousres" still find "closures".
create or replace function public.search_questions(
  q              text,
  in_category    text default null,
  in_difficulty  text default null,
  lim            int  default 30
)
returns table (
  slug              text,
  title             text,
  category          text,
  difficulty        text,
  short_description text,
  rank              real
)
language sql stable as $$
  with fts as (
    select
      q1.slug, q1.title, q1.category, q1.difficulty, q1.short_description,
      ts_rank(q1.search_doc, websearch_to_tsquery('english', q)) as rank
    from public.questions q1
    where q1.deleted_at is null
      and (in_category   is null or q1.category   = in_category)
      and (in_difficulty is null or q1.difficulty = in_difficulty)
      and q1.search_doc @@ websearch_to_tsquery('english', q)
  ),
  trgm as (
    select
      q1.slug, q1.title, q1.category, q1.difficulty, q1.short_description,
      similarity(q1.title, q) as rank
    from public.questions q1
    where q1.deleted_at is null
      and (in_category   is null or q1.category   = in_category)
      and (in_difficulty is null or q1.difficulty = in_difficulty)
      and q1.title % q
  )
  select * from fts
  union all
  select * from trgm where not exists (select 1 from fts)
  order by rank desc
  limit lim;
$$;

grant execute on function public.search_questions(text, text, text, int) to anon, authenticated;
