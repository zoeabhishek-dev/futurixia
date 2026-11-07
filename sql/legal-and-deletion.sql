-- Futurixia: consent records for the terms and for students under 18.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to run again.

alter table profiles add column if not exists terms_version text;
alter table profiles add column if not exists terms_accepted_at timestamp with time zone;
alter table profiles add column if not exists guardian_consent_at timestamp with time zone;

create or replace function record_consent(p_version text, p_guardian_confirmed boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_age int;
begin
  if auth.uid() is null then
    raise exception 'Please log in first.';
  end if;

  select age into v_age from profiles where id = auth.uid();
  if not found then
    raise exception 'Create your profile first.';
  end if;

  -- Keep this number the same as minimumAge in src/lib/legalInfo.js
  if v_age is not null and v_age < 13 then
    raise exception 'Futurixia is for people aged 13 and above.';
  end if;

  if (v_age is null or v_age < 18) and not coalesce(p_guardian_confirmed, false) then
    raise exception 'A parent or guardian must agree before you continue.';
  end if;

  update profiles
  set terms_version = p_version,
      terms_accepted_at = now(),
      guardian_consent_at = case when v_age is not null and v_age < 18 then now() else guardian_consent_at end
  where id = auth.uid();
end;
$$;

revoke execute on function record_consent(text, boolean) from public, anon;
grant execute on function record_consent(text, boolean) to authenticated;
