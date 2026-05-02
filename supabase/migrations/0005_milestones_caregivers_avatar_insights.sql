-- Pippa schema additions: milestone progress, caregivers, avatar fields,
-- and an insights view. This script is idempotent (safe to re-run) so it
-- can be pasted into the Supabase SQL editor as a single block.
--
-- It assumes the existing tables from 0001_init.sql are in place:
--   public.profiles, public.babies, public.scans, public.events,
--   public.chat_messages.

------------------------------------------------------------
-- 1. Avatar columns on babies
------------------------------------------------------------
alter table public.babies
  add column if not exists avatar_kind text
    check (avatar_kind in ('logo', 'sheet', 'dicebear')) default 'logo',
  add column if not exists avatar_seed text,        -- dicebear seed
  add column if not exists avatar_index smallint;   -- sheet index 0..7

------------------------------------------------------------
-- 2. Milestone completions
------------------------------------------------------------
create table if not exists public.milestone_completions (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  milestone_id text not null,           -- e.g. "0-2.cognitive.0"
  completed_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  unique (baby_id, milestone_id)
);

create index if not exists milestone_completions_baby_idx
  on public.milestone_completions (baby_id, completed_at desc);

------------------------------------------------------------
-- 3. Caregivers (multi-parent / shared access)
------------------------------------------------------------
create table if not exists public.caregivers (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  caregiver_profile_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  role text default 'caregiver' check (role in ('owner', 'caregiver')),
  accepted_at timestamptz,
  created_at timestamptz default now() not null,
  unique (baby_id, caregiver_profile_id)
);

create index if not exists caregivers_caregiver_idx
  on public.caregivers (caregiver_profile_id);

create table if not exists public.caregiver_codes (
  code text primary key,                -- 6-char share code
  baby_id uuid not null references public.babies(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz default now() not null
);

------------------------------------------------------------
-- 4. Pediatrician contact (for PDF export "from" field)
------------------------------------------------------------
create table if not exists public.pediatricians (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create trigger if not exists handle_pediatricians_updated_at
  before update on public.pediatricians
  for each row execute function public.handle_updated_at();

------------------------------------------------------------
-- 5. Insights view — daily rollup per baby
------------------------------------------------------------
create or replace view public.daily_event_rollup as
select
  baby_id,
  profile_id,
  date_trunc('day', occurred_at) as day,
  event_type,
  count(*) as event_count,
  coalesce(sum(duration_minutes), 0) as total_minutes,
  jsonb_agg(payload order by occurred_at) as payloads
from public.events
group by baby_id, profile_id, date_trunc('day', occurred_at), event_type;

------------------------------------------------------------
-- 6. RLS for new tables
------------------------------------------------------------
alter table public.milestone_completions enable row level security;
alter table public.caregivers enable row level security;
alter table public.caregiver_codes enable row level security;
alter table public.pediatricians enable row level security;

drop policy if exists "milestones_self_select" on public.milestone_completions;
drop policy if exists "milestones_self_insert" on public.milestone_completions;
drop policy if exists "milestones_self_delete" on public.milestone_completions;
create policy "milestones_self_select" on public.milestone_completions
  for select using (auth.uid() = profile_id);
create policy "milestones_self_insert" on public.milestone_completions
  for insert with check (auth.uid() = profile_id);
create policy "milestones_self_delete" on public.milestone_completions
  for delete using (auth.uid() = profile_id);

drop policy if exists "caregivers_self_select" on public.caregivers;
drop policy if exists "caregivers_owner_insert" on public.caregivers;
drop policy if exists "caregivers_owner_delete" on public.caregivers;
create policy "caregivers_self_select" on public.caregivers
  for select using (auth.uid() = caregiver_profile_id or auth.uid() = invited_by);
create policy "caregivers_owner_insert" on public.caregivers
  for insert with check (auth.uid() = invited_by);
create policy "caregivers_owner_delete" on public.caregivers
  for delete using (auth.uid() = invited_by);

drop policy if exists "caregiver_codes_owner" on public.caregiver_codes;
create policy "caregiver_codes_owner" on public.caregiver_codes
  for all using (auth.uid() = invited_by) with check (auth.uid() = invited_by);

drop policy if exists "pediatricians_self_all" on public.pediatricians;
create policy "pediatricians_self_all" on public.pediatricians
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

------------------------------------------------------------
-- 7. Helper RPCs
------------------------------------------------------------
-- Toggle a milestone for the current user.
create or replace function public.toggle_milestone(
  p_baby_id uuid,
  p_milestone_id text,
  p_completed boolean
) returns void as $$
begin
  if p_completed then
    insert into public.milestone_completions (baby_id, profile_id, milestone_id)
    values (p_baby_id, auth.uid(), p_milestone_id)
    on conflict (baby_id, milestone_id) do nothing;
  else
    delete from public.milestone_completions
    where baby_id = p_baby_id
      and milestone_id = p_milestone_id
      and profile_id = auth.uid();
  end if;
end;
$$ language plpgsql security definer;

-- 7-day insights snapshot for a baby (used by Insights card + PDF export).
create or replace function public.baby_insights_7d(p_baby_id uuid)
returns table (
  total_sleep_minutes int,
  avg_sleep_minutes_per_day numeric,
  feed_count int,
  diaper_count int,
  longest_sleep_minutes int,
  last_feed_at timestamptz,
  last_diaper_at timestamptz
) as $$
  with window_events as (
    select * from public.events
    where baby_id = p_baby_id
      and profile_id = auth.uid()
      and occurred_at >= now() - interval '7 days'
  )
  select
    coalesce(sum(duration_minutes) filter (where event_type = 'sleep'), 0)::int,
    coalesce(sum(duration_minutes) filter (where event_type = 'sleep'), 0) / 7.0,
    count(*) filter (where event_type = 'feed')::int,
    count(*) filter (where event_type = 'diaper_change')::int,
    coalesce(max(duration_minutes) filter (where event_type = 'sleep'), 0)::int,
    max(occurred_at) filter (where event_type = 'feed'),
    max(occurred_at) filter (where event_type = 'diaper_change')
  from window_events;
$$ language sql security definer;
