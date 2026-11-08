-- Futurixia: adds the Aurora theme and makes it the Free plan theme.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to run again.

alter table profiles drop constraint if exists profiles_theme_check;
alter table profiles add constraint profiles_theme_check
  check (theme is null or theme in ('aurora', 'forest_emerald', 'charcoal_orange', 'plum_rose', 'black_gold'));

create or replace function get_my_plan()
returns table (plan text, theme text, expires_at timestamp with time zone)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row profiles%rowtype;
  v_plan text;
begin
  if auth.uid() is null then
    return;
  end if;

  select * into v_row from profiles where id = auth.uid();
  if not found then
    return;
  end if;

  v_plan := coalesce(v_row.subscription_tier, 'free');
  if v_plan not in ('pro', 'pro_max') then
    v_plan := 'free';
  end if;

  if v_plan <> 'free'
     and v_row.subscription_expires_at is not null
     and v_row.subscription_expires_at <= now() then
    perform set_config('fx.plan_write', '1', true);
    update profiles set subscription_tier = 'free' where id = auth.uid();
    v_plan := 'free';
  end if;

  return query
  select
    v_plan,
    case v_plan
      when 'pro_max' then coalesce(v_row.theme, 'black_gold')
      when 'pro' then coalesce(v_row.theme, 'charcoal_orange')
      else 'aurora'
    end,
    v_row.subscription_expires_at;
end;
$$;

create or replace function set_my_theme(p_theme text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
begin
  if auth.uid() is null then
    raise exception 'Please log in first.';
  end if;

  if p_theme not in ('aurora', 'forest_emerald', 'charcoal_orange', 'plum_rose', 'black_gold') then
    raise exception 'Unknown theme.';
  end if;

  select case
           when subscription_tier in ('pro', 'pro_max')
            and (subscription_expires_at is null or subscription_expires_at > now())
           then subscription_tier else 'free' end
    into v_plan
  from profiles where id = auth.uid();

  if v_plan not in ('pro', 'pro_max') then
    raise exception 'Choosing a theme is part of the Pro and Pro Max plans.';
  end if;

  update profiles set theme = p_theme where id = auth.uid();
  return p_theme;
end;
$$;
