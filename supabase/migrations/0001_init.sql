-- =============================================================================
-- InterviewLane - initial schema
-- Run this in the Supabase SQL editor (or `supabase db push` with the CLI).
-- =============================================================================

-- ---------- profiles ---------------------------------------------------------
-- One row per auth user. Holds streak + future user settings.
create table if not exists public.profiles (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  display_name     text,
  streak_days      int  not null default 0,
  streak_last_date date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- Auto-create a profile row on every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------- bookmarks --------------------------------------------------------
create table if not exists public.bookmarks (
  user_id    uuid not null references auth.users(id) on delete cascade,
  slug       text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, slug)
);

create index if not exists bookmarks_user_idx on public.bookmarks (user_id, created_at desc);

alter table public.bookmarks enable row level security;

create policy "bookmarks: own rows" on public.bookmarks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ---------- completed --------------------------------------------------------
create table if not exists public.completed (
  user_id      uuid not null references auth.users(id) on delete cascade,
  slug         text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, slug)
);

create index if not exists completed_user_idx on public.completed (user_id, completed_at desc);

alter table public.completed enable row level security;

create policy "completed: own rows" on public.completed
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ---------- recently_viewed --------------------------------------------------
-- Soft-capped to ~24 most recent rows per user via the helper function below.
create table if not exists public.recently_viewed (
  user_id   uuid not null references auth.users(id) on delete cascade,
  slug      text not null,
  viewed_at timestamptz not null default now(),
  primary key (user_id, slug)
);

create index if not exists recently_viewed_user_idx
  on public.recently_viewed (user_id, viewed_at desc);

alter table public.recently_viewed enable row level security;

create policy "recently_viewed: own rows" on public.recently_viewed
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ---------- helper: track view (upsert + trim) -------------------------------
-- Single round-trip: bumps viewed_at, inserts if missing, then prunes old rows.
create or replace function public.track_view(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.recently_viewed (user_id, slug, viewed_at)
  values (uid, p_slug, now())
  on conflict (user_id, slug) do update set viewed_at = excluded.viewed_at;

  delete from public.recently_viewed
  where user_id = uid
    and ctid in (
      select ctid from public.recently_viewed
      where user_id = uid
      order by viewed_at desc
      offset 24
    );
end;
$$;

grant execute on function public.track_view(text) to authenticated;


-- ---------- helper: record_study_day (streak math) ---------------------------
-- Atomically advances the streak. Same-day = no-op. Consecutive day = +1.
-- Gap = reset to 1.
create or replace function public.record_study_day()
returns table (streak_days int, streak_last_date date)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid     uuid := auth.uid();
  today   date := (now() at time zone 'utc')::date;
  prev    date;
  newdays int;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.profiles (user_id)
  values (uid)
  on conflict (user_id) do nothing;

  select streak_last_date into prev from public.profiles where user_id = uid;

  if prev = today then
    select profiles.streak_days, profiles.streak_last_date
      into streak_days, streak_last_date
      from public.profiles where user_id = uid;
    return next;
    return;
  end if;

  if prev is null or (today - prev) > 1 then
    newdays := 1;
  else
    newdays := (select profiles.streak_days from public.profiles where user_id = uid) + 1;
  end if;

  update public.profiles
     set streak_days      = newdays,
         streak_last_date = today,
         updated_at       = now()
   where user_id = uid
   returning profiles.streak_days, profiles.streak_last_date
        into streak_days, streak_last_date;

  return next;
end;
$$;

grant execute on function public.record_study_day() to authenticated;
