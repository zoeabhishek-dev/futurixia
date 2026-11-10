-- =====================================================================
-- Futurixia Phase 1: Daily Missions, XP, Learning Streaks and Badges
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to run again.
-- Nothing here changes your existing tables. It only adds new tables, functions and triggers.
-- =====================================================================

-- ---------- Tables ----------

create table if not exists user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  timezone text not null default 'UTC',
  backfilled boolean not null default false,
  updated_at timestamp with time zone not null default now()
);

create table if not exists xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount > 0),
  reason text not null,
  ref text not null,
  created_at timestamp with time zone not null default now(),
  unique (user_id, reason, ref)
);
create index if not exists xp_events_user_time on xp_events (user_id, created_at desc);

create table if not exists mission_templates (
  id text primary key,
  title text not null,
  description text not null,
  kind text not null check (kind in ('steps', 'new_career', 'reflection', 'report')),
  target integer not null check (target > 0),
  xp_reward integer not null check (xp_reward > 0),
  sort_order integer not null default 0
);

create table if not exists user_missions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_date date not null,
  template_id text not null references mission_templates(id),
  slot smallint not null,
  progress integer not null default 0,
  completed_at timestamp with time zone,
  unique (user_id, mission_date, template_id)
);
create index if not exists user_missions_user_date on user_missions (user_id, mission_date);

create table if not exists badge_definitions (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  tier text not null check (tier in ('bronze', 'silver', 'gold')),
  metric text not null check (metric in ('steps', 'roadmaps', 'careers_viewed', 'reflections', 'missions', 'streak', 'certificates', 'xp')),
  threshold integer not null check (threshold > 0),
  xp_reward integer not null default 0 check (xp_reward >= 0),
  sort_order integer not null default 0
);

create table if not exists user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null references badge_definitions(id),
  earned_at timestamp with time zone not null default now(),
  primary key (user_id, badge_id)
);

create table if not exists activity_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('career_viewed', 'report_viewed')),
  ref_id uuid references careers(id) on delete cascade,
  event_date date not null,
  created_at timestamp with time zone not null default now()
);
create unique index if not exists activity_career_once on activity_events (user_id, ref_id) where kind = 'career_viewed';
create unique index if not exists activity_report_daily on activity_events (user_id, event_date) where kind = 'report_viewed';

-- ---------- Security: students can only READ their own rows; every write goes through the functions below ----------

alter table user_stats enable row level security;
alter table xp_events enable row level security;
alter table user_missions enable row level security;
alter table user_badges enable row level security;
alter table activity_events enable row level security;
alter table mission_templates enable row level security;
alter table badge_definitions enable row level security;

drop policy if exists "own stats" on user_stats;
create policy "own stats" on user_stats for select to authenticated using (user_id = auth.uid());
drop policy if exists "own xp" on xp_events;
create policy "own xp" on xp_events for select to authenticated using (user_id = auth.uid());
drop policy if exists "own missions" on user_missions;
create policy "own missions" on user_missions for select to authenticated using (user_id = auth.uid());
drop policy if exists "own badges" on user_badges;
create policy "own badges" on user_badges for select to authenticated using (user_id = auth.uid());
drop policy if exists "own events" on activity_events;
create policy "own events" on activity_events for select to authenticated using (user_id = auth.uid());
drop policy if exists "read templates" on mission_templates;
create policy "read templates" on mission_templates for select to authenticated using (true);
drop policy if exists "read badge list" on badge_definitions;
create policy "read badge list" on badge_definitions for select to authenticated using (true);

revoke all on user_stats, xp_events, user_missions, user_badges, activity_events, mission_templates, badge_definitions from anon, authenticated;
grant select on user_stats, xp_events, user_missions, user_badges, activity_events, mission_templates, badge_definitions to authenticated;

-- ---------- Predefined content ----------

insert into mission_templates (id, title, description, kind, target, xp_reward, sort_order) values
  ('steps_1',    'Take one step',            'Complete 1 roadmap step today.',                                   'steps',      1, 20, 1),
  ('steps_3',    'Triple progress',          'Complete 3 roadmap steps today.',                                  'steps',      3, 40, 2),
  ('new_career', 'Discover something new',   'Open a career page you have never opened before.',                 'new_career', 1, 20, 3),
  ('reflect',    'Walk a day in their shoes','Answer the reflection questions in A Day in This Career.',          'reflection', 1, 25, 4),
  ('report',     'See the big picture',      'Open your Personal Career Report.',                                'report',     1, 15, 5)
on conflict (id) do update set
  title = excluded.title, description = excluded.description, kind = excluded.kind,
  target = excluded.target, xp_reward = excluded.xp_reward, sort_order = excluded.sort_order;

insert into badge_definitions (id, name, description, icon, tier, metric, threshold, xp_reward, sort_order) values
  ('first_step',   'First Step',        'Complete your first roadmap step.',          'Footprints', 'bronze', 'steps',          1,   10, 1),
  ('steps_10',     'Getting Going',     'Complete 10 roadmap steps.',                 'Footprints', 'bronze', 'steps',          10,  20, 2),
  ('steps_50',     'On a Roll',         'Complete 50 roadmap steps.',                 'Rocket',     'silver', 'steps',          50,  50, 3),
  ('steps_100',    'Century',           'Complete 100 roadmap steps.',                'Rocket',     'gold',   'steps',          100, 100, 4),
  ('steps_250',    'Unstoppable',       'Complete 250 roadmap steps.',                'Trophy',     'gold',   'steps',          250, 200, 5),
  ('streak_3',     'Warming Up',        'Learn on 3 days in a row.',                  'Flame',      'bronze', 'streak',         3,   15, 6),
  ('streak_7',     'One Week Strong',   'Learn on 7 days in a row.',                  'Flame',      'silver', 'streak',         7,   40, 7),
  ('streak_14',    'Fortnight Focus',   'Learn on 14 days in a row.',                 'Flame',      'silver', 'streak',         14,  80, 8),
  ('streak_30',    'Month of Mastery',  'Learn on 30 days in a row.',                 'Flame',      'gold',   'streak',         30,  200, 9),
  ('roadmap_1',    'Roadmap Complete',  'Finish every step of a career roadmap.',     'Route',      'silver', 'roadmaps',       1,   50, 10),
  ('roadmap_3',    'Triple Crown',      'Finish 3 career roadmaps.',                  'Route',      'gold',   'roadmaps',       3,   150, 11),
  ('explorer_5',   'Curious Mind',      'Open 5 different career pages.',             'Compass',    'bronze', 'careers_viewed', 5,   15, 12),
  ('explorer_20',  'Career Explorer',   'Open 20 different career pages.',            'Compass',    'silver', 'careers_viewed', 20,  40, 13),
  ('explorer_50',  'Wide Horizons',     'Open 50 different career pages.',            'Compass',    'gold',   'careers_viewed', 50,  100, 14),
  ('reflector_1',  'First Reflection',  'Complete a reflection in A Day in This Career.', 'BookOpen', 'bronze', 'reflections', 1,   20, 15),
  ('reflector_5',  'Thoughtful',        'Complete 5 reflections.',                    'BookOpen',   'silver', 'reflections',    5,   50, 16),
  ('reflector_15', 'Deep Thinker',       'Complete 15 reflections.',                   'BookOpen',   'gold',   'reflections',    15,  100, 17),
  ('missions_5',   'Mission Rookie',    'Complete 5 daily missions.',                 'Target',     'bronze', 'missions',       5,   20, 18),
  ('missions_25',  'Mission Pro',       'Complete 25 daily missions.',                'Target',     'silver', 'missions',       25,  60, 19),
  ('missions_100', 'Mission Legend',    'Complete 100 daily missions.',               'Target',     'gold',   'missions',       100, 150, 20),
  ('certified_1',  'Certified',         'Earn a Futurixia certificate.',              'Award',      'gold',   'certificates',   1,   25, 21),
  ('xp_500',       'Rising Star',       'Reach 500 XP.',                              'Zap',        'bronze', 'xp',             500, 0,  22),
  ('xp_2000',      'Powerhouse',        'Reach 2,000 XP.',                            'Zap',        'silver', 'xp',             2000, 0, 23),
  ('xp_5000',      'XP Master',         'Reach 5,000 XP.',                            'Zap',        'gold',   'xp',             5000, 0, 24)
on conflict (id) do update set
  name = excluded.name, description = excluded.description, icon = excluded.icon, tier = excluded.tier,
  metric = excluded.metric, threshold = excluded.threshold, xp_reward = excluded.xp_reward, sort_order = excluded.sort_order;

-- ---------- Small helpers (internal) ----------

create or replace function fx_level_from_xp(p_xp integer) returns integer
language sql immutable as $$
  select floor((1 + sqrt(1 + 4.0 * greatest(p_xp, 0) / 50)) / 2)::integer
$$;

create or replace function fx_xp_for_level(p_level integer) returns integer
language sql immutable as $$
  select 50 * p_level * (p_level - 1)
$$;

create or replace function fx_tz(p_user uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select timezone from user_stats where user_id = p_user), 'UTC')
$$;

create or replace function fx_today(p_user uuid) returns date
language sql stable security definer set search_path = public as $$
  select (now() at time zone fx_tz(p_user))::date
$$;

create or replace function fx_ensure_stats(p_user uuid, p_tz text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into user_stats (user_id) values (p_user) on conflict (user_id) do nothing;
  if p_tz is not null and exists (select 1 from pg_timezone_names where name = p_tz) then
    update user_stats set timezone = p_tz, updated_at = now() where user_id = p_user and timezone is distinct from p_tz;
  end if;
end;
$$;

-- Adds XP once per (reason, ref). Returns the XP actually added.
create or replace function fx_award_xp(p_user uuid, p_amount integer, p_reason text, p_ref text) returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_today_steps integer;
  v_tz text;
begin
  if p_amount is null or p_amount <= 0 then
    return 0;
  end if;

  perform fx_ensure_stats(p_user);

  -- Roadmap-step XP is capped at 100 XP per day
  if p_reason = 'step' then
    v_tz := fx_tz(p_user);
    select coalesce(sum(amount), 0) into v_today_steps from xp_events
     where user_id = p_user and reason = 'step'
       and (created_at at time zone v_tz)::date = (now() at time zone v_tz)::date;
    if v_today_steps >= 100 then
      return 0;
    end if;
  end if;

  insert into xp_events (user_id, amount, reason, ref) values (p_user, p_amount, p_reason, p_ref)
  on conflict (user_id, reason, ref) do nothing;

  if not found then
    return 0;
  end if;

  update user_stats set xp = xp + p_amount, updated_at = now() where user_id = p_user;
  return p_amount;
end;
$$;

-- Counts today as a learning day and updates the streak
create or replace function fx_touch_streak(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_today date;
  v_last date;
  v_cur integer;
  v_best integer;
begin
  perform fx_ensure_stats(p_user);
  v_today := fx_today(p_user);
  select last_active_date, current_streak, longest_streak into v_last, v_cur, v_best from user_stats where user_id = p_user;

  if v_last = v_today then
    return;
  elsif v_last = v_today - 1 then
    v_cur := v_cur + 1;
  else
    v_cur := 1;
  end if;

  update user_stats
     set last_active_date = v_today, current_streak = v_cur, longest_streak = greatest(v_best, v_cur), updated_at = now()
   where user_id = p_user;
end;
$$;

create or replace function fx_metric(p_user uuid, p_metric text) returns integer
language plpgsql security definer set search_path = public as $$
declare
  v integer := 0;
begin
  if p_metric = 'steps' then
    select count(*) into v from user_progress where user_id = p_user;
  elsif p_metric = 'roadmaps' then
    select count(*) into v from roadmap_completions where user_id = p_user;
  elsif p_metric = 'careers_viewed' then
    select count(*) into v from activity_events where user_id = p_user and kind = 'career_viewed';
  elsif p_metric = 'reflections' then
    select count(*) into v from career_day_responses
     where user_id = p_user and interest is not null and challenges_feeling is not null and next_action is not null;
  elsif p_metric = 'missions' then
    select count(*) into v from user_missions where user_id = p_user and completed_at is not null;
  elsif p_metric = 'streak' then
    select greatest(longest_streak, current_streak) into v from user_stats where user_id = p_user;
  elsif p_metric = 'certificates' then
    select count(*) into v from certificates where user_id = p_user;
  elsif p_metric = 'xp' then
    select xp into v from user_stats where user_id = p_user;
  end if;
  return coalesce(v, 0);
end;
$$;

create or replace function fx_check_badges(p_user uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_new jsonb := '[]'::jsonb;
  v_pass integer;
  rec record;
begin
  for v_pass in 1..2 loop
    for rec in
      select bd.* from badge_definitions bd
       where not exists (select 1 from user_badges ub where ub.user_id = p_user and ub.badge_id = bd.id)
       order by bd.sort_order
    loop
      if fx_metric(p_user, rec.metric) >= rec.threshold then
        insert into user_badges (user_id, badge_id) values (p_user, rec.id) on conflict do nothing;
        if found then
          perform fx_award_xp(p_user, rec.xp_reward, 'badge', rec.id);
          v_new := v_new || jsonb_build_object('id', rec.id, 'name', rec.name, 'description', rec.description, 'icon', rec.icon, 'tier', rec.tier);
        end if;
      end if;
    end loop;
  end loop;
  return v_new;
end;
$$;

-- One-time catch-up for students who already have progress
create or replace function fx_backfill(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform fx_ensure_stats(p_user);
  insert into xp_events (user_id, amount, reason, ref)
    select p_user, 10, 'step', step_id::text from user_progress where user_id = p_user
  on conflict (user_id, reason, ref) do nothing;
  insert into xp_events (user_id, amount, reason, ref)
    select p_user, 100, 'roadmap', career_id::text from roadmap_completions where user_id = p_user
  on conflict (user_id, reason, ref) do nothing;
  insert into xp_events (user_id, amount, reason, ref)
    select p_user, 15, 'reflection', career_id::text from career_day_responses
     where user_id = p_user and interest is not null and challenges_feeling is not null and next_action is not null
  on conflict (user_id, reason, ref) do nothing;
  insert into xp_events (user_id, amount, reason, ref)
    select p_user, 50, 'certificate', id::text from certificates where user_id = p_user
  on conflict (user_id, reason, ref) do nothing;
  update user_stats
     set xp = (select coalesce(sum(amount), 0) from xp_events where user_id = p_user), backfilled = true, updated_at = now()
   where user_id = p_user;
end;
$$;

-- Picks today's 3 missions with fixed rules (no AI, no randomness that changes during the day)
create or replace function fx_assign_missions(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_today date := fx_today(p_user);
  v_recent integer;
  v_viewed integer;
  v_total integer;
  v_pool text[] := array['reflect', 'report'];
  v_slot1 text;
  v_idx integer;
  v_n integer;
begin
  if exists (select 1 from user_missions where user_id = p_user and mission_date = v_today) then
    return;
  end if;

  -- Rule 1: if the student was active in the last 3 days, today's progress mission is the bigger one
  select count(*) into v_recent from user_progress where user_id = p_user and completed_at >= now() - interval '3 days';
  v_slot1 := case when v_recent >= 1 then 'steps_3' else 'steps_1' end;

  -- Rule 2: "discover a new career" is offered only while there are careers still to open
  select count(*) into v_viewed from activity_events where user_id = p_user and kind = 'career_viewed';
  select count(*) into v_total from careers;
  if v_viewed < v_total then
    v_pool := array['new_career'] || v_pool;
  end if;

  -- Rule 3: the other two missions rotate by day, the same way all day long
  v_n := array_length(v_pool, 1);
  v_idx := abs(hashtext(p_user::text || v_today::text)) % v_n;

  insert into user_missions (user_id, mission_date, template_id, slot) values
    (p_user, v_today, v_slot1, 1),
    (p_user, v_today, v_pool[v_idx + 1], 2),
    (p_user, v_today, v_pool[((v_idx + 1) % v_n) + 1], 3)
  on conflict do nothing;
end;
$$;

-- Measures today's progress from real activity, completes missions and pays XP once
create or replace function fx_sync_missions(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_today date;
  v_tz text;
  rec record;
  v_progress integer;
  v_done integer;
  v_total integer;
begin
  perform fx_ensure_stats(p_user);
  perform fx_assign_missions(p_user);
  v_today := fx_today(p_user);
  v_tz := fx_tz(p_user);

  for rec in
    select um.id, um.completed_at, t.kind, t.target, t.xp_reward
      from user_missions um join mission_templates t on t.id = um.template_id
     where um.user_id = p_user and um.mission_date = v_today
  loop
    if rec.completed_at is not null then
      continue;
    end if;

    if rec.kind = 'steps' then
      select count(*) into v_progress from user_progress
       where user_id = p_user and (completed_at at time zone v_tz)::date = v_today;
    elsif rec.kind = 'new_career' then
      select count(*) into v_progress from activity_events
       where user_id = p_user and kind = 'career_viewed' and event_date = v_today;
    elsif rec.kind = 'reflection' then
      select count(*) into v_progress from career_day_responses
       where user_id = p_user and (updated_at at time zone v_tz)::date = v_today
         and interest is not null and challenges_feeling is not null and next_action is not null;
    elsif rec.kind = 'report' then
      select count(*) into v_progress from activity_events
       where user_id = p_user and kind = 'report_viewed' and event_date = v_today;
    else
      v_progress := 0;
    end if;

    v_progress := least(v_progress, rec.target);
    update user_missions
       set progress = v_progress, completed_at = case when v_progress >= rec.target then now() else null end
     where id = rec.id;

    if v_progress >= rec.target then
      perform fx_award_xp(p_user, rec.xp_reward, 'mission', rec.id::text);
      perform fx_touch_streak(p_user);
    end if;
  end loop;

  select count(*) filter (where completed_at is not null), count(*) into v_done, v_total
    from user_missions where user_id = p_user and mission_date = v_today;
  if v_total > 0 and v_done = v_total then
    perform fx_award_xp(p_user, 30, 'daily_all', v_today::text);
  end if;
end;
$$;

-- ---------- Automatic XP from real actions (triggers) ----------
-- Every trigger catches its own errors, so a problem here can never stop a student from saving progress.

create or replace function fx_on_step_done() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    perform fx_award_xp(new.user_id, 10, 'step', new.step_id::text);
    perform fx_touch_streak(new.user_id);
  exception when others then
    raise warning 'fx_on_step_done: %', sqlerrm;
  end;
  return new;
end;
$$;

create or replace function fx_on_reflection() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    if new.interest is not null and new.challenges_feeling is not null and new.next_action is not null then
      perform fx_award_xp(new.user_id, 15, 'reflection', new.career_id::text);
      perform fx_touch_streak(new.user_id);
    end if;
  exception when others then
    raise warning 'fx_on_reflection: %', sqlerrm;
  end;
  return new;
end;
$$;

create or replace function fx_on_roadmap_done() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    perform fx_award_xp(new.user_id, 100, 'roadmap', new.career_id::text);
    perform fx_touch_streak(new.user_id);
  exception when others then
    raise warning 'fx_on_roadmap_done: %', sqlerrm;
  end;
  return new;
end;
$$;

create or replace function fx_on_certificate() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    perform fx_award_xp(new.user_id, 50, 'certificate', new.id::text);
  exception when others then
    raise warning 'fx_on_certificate: %', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists fx_user_progress_xp on user_progress;
create trigger fx_user_progress_xp after insert on user_progress
  for each row execute function fx_on_step_done();

drop trigger if exists fx_reflection_xp on career_day_responses;
create trigger fx_reflection_xp after insert or update on career_day_responses
  for each row execute function fx_on_reflection();

drop trigger if exists fx_roadmap_xp on roadmap_completions;
create trigger fx_roadmap_xp after insert on roadmap_completions
  for each row execute function fx_on_roadmap_done();

drop trigger if exists fx_certificate_xp on certificates;
create trigger fx_certificate_xp after insert on certificates
  for each row execute function fx_on_certificate();

-- ---------- The two functions the website calls ----------

create or replace function fx_log_event(p_kind text, p_ref uuid default null, p_timezone text default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Please log in first.';
  end if;
  if p_kind not in ('career_viewed', 'report_viewed') then
    raise exception 'Unknown event.';
  end if;

  perform fx_ensure_stats(v_user, p_timezone);

  if p_kind = 'career_viewed' then
    if p_ref is null or not exists (select 1 from careers where id = p_ref) then
      raise exception 'Unknown career.';
    end if;
    insert into activity_events (user_id, kind, ref_id, event_date)
      values (v_user, 'career_viewed', p_ref, fx_today(v_user))
    on conflict do nothing;
  else
    insert into activity_events (user_id, kind, ref_id, event_date)
      values (v_user, 'report_viewed', null, fx_today(v_user))
    on conflict do nothing;
  end if;
end;
$$;

create or replace function fx_get_overview(p_timezone text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_stats user_stats%rowtype;
  v_today date;
  v_new jsonb;
  v_level integer;
  v_streak integer;
  v_titles text[] := array['Curious Explorer', 'Path Finder', 'Skill Builder', 'Goal Setter', 'Career Climber', 'Rising Pro', 'Trailblazer', 'Career Champion', 'Legend'];
begin
  if v_user is null then
    raise exception 'Please log in first.';
  end if;

  perform fx_ensure_stats(v_user, p_timezone);

  select * into v_stats from user_stats where user_id = v_user;
  if not v_stats.backfilled then
    perform fx_backfill(v_user);
  end if;

  perform fx_sync_missions(v_user);
  v_new := fx_check_badges(v_user);

  select * into v_stats from user_stats where user_id = v_user;
  v_today := fx_today(v_user);
  v_level := fx_level_from_xp(v_stats.xp);
  v_streak := case when v_stats.last_active_date is not null and v_stats.last_active_date >= v_today - 1 then v_stats.current_streak else 0 end;

  return jsonb_build_object(
    'stats', jsonb_build_object(
      'user_id', v_user,
      'xp', v_stats.xp,
      'level', v_level,
      'level_title', v_titles[least(v_level, array_length(v_titles, 1))],
      'level_start_xp', fx_xp_for_level(v_level),
      'next_level_xp', fx_xp_for_level(v_level + 1),
      'streak', v_streak,
      'longest_streak', greatest(v_stats.longest_streak, v_streak),
      'active_today', coalesce(v_stats.last_active_date = v_today, false),
      'today', v_today,
      'timezone', v_stats.timezone
    ),
    'missions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', t.id, 'title', t.title, 'description', t.description, 'target', t.target,
               'progress', um.progress, 'xp', t.xp_reward, 'done', um.completed_at is not null
             ) order by um.slot)
        from user_missions um join mission_templates t on t.id = um.template_id
       where um.user_id = v_user and um.mission_date = v_today
    ), '[]'::jsonb),
    'badges', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', bd.id, 'name', bd.name, 'description', bd.description, 'icon', bd.icon, 'tier', bd.tier,
               'threshold', bd.threshold, 'value', least(fx_metric(v_user, bd.metric), bd.threshold),
               'xp', bd.xp_reward, 'earned_at', ub.earned_at
             ) order by bd.sort_order)
        from badge_definitions bd
        left join user_badges ub on ub.badge_id = bd.id and ub.user_id = v_user
    ), '[]'::jsonb),
    'new_badges', v_new
  );
end;
$$;

-- ---------- Permissions: the website may call only the two functions above ----------

revoke execute on function fx_level_from_xp(integer), fx_xp_for_level(integer), fx_tz(uuid), fx_today(uuid),
  fx_ensure_stats(uuid, text), fx_award_xp(uuid, integer, text, text), fx_touch_streak(uuid), fx_metric(uuid, text),
  fx_check_badges(uuid), fx_backfill(uuid), fx_assign_missions(uuid), fx_sync_missions(uuid),
  fx_on_step_done(), fx_on_reflection(), fx_on_roadmap_done(), fx_on_certificate()
  from public, anon, authenticated;

revoke execute on function fx_log_event(text, uuid, text), fx_get_overview(text) from public, anon;
grant execute on function fx_log_event(text, uuid, text), fx_get_overview(text) to authenticated;
