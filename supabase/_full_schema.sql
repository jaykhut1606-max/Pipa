-- =========================================================================
-- Pippa — full schema, one paste-ready script.
-- Idempotent: safe to re-run; uses `if not exists` / `create or replace` /
-- drop-then-create for policies. Run in Supabase SQL Editor.
--
-- Combines 0001_init + 0002_rls + 0003_indexes + 0004_demo_mode_relaxations
-- + 0005_milestones_caregivers_avatar_insights into a single block.
-- =========================================================================

-- ===== EXTENSIONS ========================================================
create extension if not exists pgcrypto; -- gen_random_uuid()

-- ===== TRIGGERS / HELPERS ================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- ===== TABLES ============================================================

-- Mirror of auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  onboarded_at timestamptz,
  stripe_customer_id text unique,
  subscription_status text check (
    subscription_status in ('none','trialing','active','past_due','canceled','lifetime')
  ),
  subscription_tier text check (
    subscription_tier in ('weekly','yearly','lifetime')
  ),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  reduced_motion boolean default false,
  notifications_enabled boolean default true
);

create table if not exists public.babies (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  birth_date date not null,
  feeding_type text[] check (
    feeding_type <@ array['breast','formula','mixed','solids']
  ),
  concerns text[] check (
    concerns <@ array['sleep','crying','feeding','poop','health','development','coordinating']
  ),
  avatar_color text default 'rose',
  avatar_kind text default 'logo' check (avatar_kind in ('logo','sheet','dicebear')),
  avatar_seed text,
  avatar_index smallint,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Scans: diaper / cry / rash AI results. We never persist photo or audio bytes.
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid references public.babies(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  scan_type text not null check (scan_type in ('diaper','cry','rash')),
  input_metadata jsonb default '{}'::jsonb,
  result jsonb not null,
  status text check (status in ('healthy','monitor','urgent','unclear')),
  primary_label text,
  safety_override_applied boolean default false,
  safety_override_reason text,
  demo_baby_name text,
  created_at timestamptz default now() not null
);

-- Tracker events: sleep / feed / diaper / note / milestone.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid references public.babies(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  event_type text not null check (
    event_type in ('feed','sleep','diaper_change','diaper','note','milestone')
  ),
  payload jsonb default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  duration_minutes int,
  demo_baby_name text,
  created_at timestamptz default now() not null
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  baby_id uuid references public.babies(id) on delete set null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  references jsonb,
  created_at timestamptz default now() not null
);

create table if not exists public.milestone_completions (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  milestone_id text not null,
  completed_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  unique (baby_id, milestone_id)
);

create table if not exists public.caregivers (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  caregiver_profile_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  role text default 'caregiver' check (role in ('owner','caregiver')),
  accepted_at timestamptz,
  created_at timestamptz default now() not null,
  unique (baby_id, caregiver_profile_id)
);

create table if not exists public.caregiver_codes (
  code text primary key,
  baby_id uuid not null references public.babies(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz default now() not null
);

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

-- ===== TRIGGERS ON TABLES ================================================
drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists handle_babies_updated_at on public.babies;
create trigger handle_babies_updated_at
  before update on public.babies
  for each row execute function public.handle_updated_at();

drop trigger if exists handle_pediatricians_updated_at on public.pediatricians;
create trigger handle_pediatricians_updated_at
  before update on public.pediatricians
  for each row execute function public.handle_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== INDEXES ===========================================================
create index if not exists idx_babies_profile_id
  on public.babies(profile_id);
create index if not exists idx_scans_baby_id_created_at
  on public.scans(baby_id, created_at desc);
create index if not exists idx_scans_profile_id_created_at
  on public.scans(profile_id, created_at desc);
create index if not exists idx_events_baby_id_occurred_at
  on public.events(baby_id, occurred_at desc);
create index if not exists idx_events_profile_id_occurred_at
  on public.events(profile_id, occurred_at desc);
create index if not exists idx_chat_messages_profile_id_created_at
  on public.chat_messages(profile_id, created_at desc);
create index if not exists idx_profiles_stripe_customer_id
  on public.profiles(stripe_customer_id);
create index if not exists idx_milestones_baby_completed_at
  on public.milestone_completions(baby_id, completed_at desc);
create index if not exists idx_caregivers_caregiver
  on public.caregivers(caregiver_profile_id);

-- ===== VIEWS =============================================================
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

-- ===== RPCs ==============================================================
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
    count(*) filter (where event_type in ('diaper','diaper_change'))::int,
    coalesce(max(duration_minutes) filter (where event_type = 'sleep'), 0)::int,
    max(occurred_at) filter (where event_type = 'feed'),
    max(occurred_at) filter (where event_type in ('diaper','diaper_change'))
  from window_events;
$$ language sql security definer;

-- ===== ROW LEVEL SECURITY ================================================
alter table public.profiles enable row level security;
alter table public.babies enable row level security;
alter table public.scans enable row level security;
alter table public.events enable row level security;
alter table public.chat_messages enable row level security;
alter table public.milestone_completions enable row level security;
alter table public.caregivers enable row level security;
alter table public.caregiver_codes enable row level security;
alter table public.pediatricians enable row level security;

-- profiles
drop policy if exists "profiles_self_select" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

-- babies
drop policy if exists "babies_self_select" on public.babies;
drop policy if exists "babies_self_insert" on public.babies;
drop policy if exists "babies_self_update" on public.babies;
drop policy if exists "babies_self_delete" on public.babies;
create policy "babies_self_select" on public.babies
  for select using (auth.uid() = profile_id);
create policy "babies_self_insert" on public.babies
  for insert with check (auth.uid() = profile_id);
create policy "babies_self_update" on public.babies
  for update using (auth.uid() = profile_id);
create policy "babies_self_delete" on public.babies
  for delete using (auth.uid() = profile_id);

-- scans
drop policy if exists "scans_self_select" on public.scans;
drop policy if exists "scans_self_insert" on public.scans;
drop policy if exists "scans_self_delete" on public.scans;
create policy "scans_self_select" on public.scans
  for select using (auth.uid() = profile_id);
create policy "scans_self_insert" on public.scans
  for insert with check (auth.uid() = profile_id);
create policy "scans_self_delete" on public.scans
  for delete using (auth.uid() = profile_id);

-- events
drop policy if exists "events_self_select" on public.events;
drop policy if exists "events_self_insert" on public.events;
drop policy if exists "events_self_update" on public.events;
drop policy if exists "events_self_delete" on public.events;
create policy "events_self_select" on public.events
  for select using (auth.uid() = profile_id);
create policy "events_self_insert" on public.events
  for insert with check (auth.uid() = profile_id);
create policy "events_self_update" on public.events
  for update using (auth.uid() = profile_id);
create policy "events_self_delete" on public.events
  for delete using (auth.uid() = profile_id);

-- chat_messages
drop policy if exists "chat_self_select" on public.chat_messages;
drop policy if exists "chat_self_insert" on public.chat_messages;
create policy "chat_self_select" on public.chat_messages
  for select using (auth.uid() = profile_id);
create policy "chat_self_insert" on public.chat_messages
  for insert with check (auth.uid() = profile_id);

-- milestone_completions
drop policy if exists "milestones_self_select" on public.milestone_completions;
drop policy if exists "milestones_self_insert" on public.milestone_completions;
drop policy if exists "milestones_self_delete" on public.milestone_completions;
create policy "milestones_self_select" on public.milestone_completions
  for select using (auth.uid() = profile_id);
create policy "milestones_self_insert" on public.milestone_completions
  for insert with check (auth.uid() = profile_id);
create policy "milestones_self_delete" on public.milestone_completions
  for delete using (auth.uid() = profile_id);

-- caregivers
drop policy if exists "caregivers_self_select" on public.caregivers;
drop policy if exists "caregivers_owner_insert" on public.caregivers;
drop policy if exists "caregivers_owner_delete" on public.caregivers;
create policy "caregivers_self_select" on public.caregivers
  for select using (
    auth.uid() = caregiver_profile_id or auth.uid() = invited_by
  );
create policy "caregivers_owner_insert" on public.caregivers
  for insert with check (auth.uid() = invited_by);
create policy "caregivers_owner_delete" on public.caregivers
  for delete using (auth.uid() = invited_by);

-- caregiver_codes
drop policy if exists "caregiver_codes_owner" on public.caregiver_codes;
create policy "caregiver_codes_owner" on public.caregiver_codes
  for all
  using (auth.uid() = invited_by)
  with check (auth.uid() = invited_by);

-- pediatricians
drop policy if exists "pediatricians_self_all" on public.pediatricians;
create policy "pediatricians_self_all" on public.pediatricians
  for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- =========================================================================
-- DONE. Verify with:
--   select count(*) from information_schema.tables where table_schema='public';
-- Should return 10 user tables.
-- =========================================================================
