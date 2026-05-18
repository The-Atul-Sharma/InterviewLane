-- =============================================================================
-- Streak math: derive from completed rows, don't increment a counter.
--
-- The original record_study_day() incremented profiles.streak_days by +1 per
-- call. A single missed call (expired session, race, network blip) leaves
-- the streak permanently desynced. This version computes the streak by
-- counting consecutive UTC days backwards from today in `public.completed`,
-- so every call self-heals to the correct value.
-- =============================================================================

create or replace function public.record_study_day()
returns table (streak_days int, streak_last_date date)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid          uuid := auth.uid();
  today        date := (now() at time zone 'utc')::date;
  ran          int  := 0;
  cursor_date  date;
  has_today    boolean;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.profiles (user_id)
  values (uid)
  on conflict (user_id) do nothing;

  -- Walk backwards from today; count while consecutive completed days exist.
  cursor_date := today;
  loop
    select exists (
      select 1 from public.completed
      where user_id = uid
        and (completed_at at time zone 'utc')::date = cursor_date
    ) into has_today;

    exit when not has_today;
    ran := ran + 1;
    cursor_date := cursor_date - 1;
  end loop;

  update public.profiles
     set streak_days      = ran,
         streak_last_date = case when ran > 0 then today else null end,
         updated_at       = now()
   where user_id = uid
   returning profiles.streak_days, profiles.streak_last_date
        into streak_days, streak_last_date;

  return next;
end;
$$;

grant execute on function public.record_study_day() to authenticated;


-- Clients call record_study_day() once on hydrate to self-heal any drift
-- from the previous increment-based implementation.
