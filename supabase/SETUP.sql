-- ┌────────────────────────────────────────────────────────────────────────┐
-- │ Pippa — Supabase setup, single-paste edition.                          │
-- │                                                                        │
-- │ How to run:                                                            │
-- │   1. Open your Supabase project's SQL editor:                          │
-- │      https://supabase.com/dashboard/project/aoggfrsofkctkebwsvsg/sql/new│
-- │   2. Paste this whole file. Hit Run.                                   │
-- │   3. Verify all 5 tables show up: profiles, babies, scans, events,     │
-- │      chat_messages.                                                    │
-- │   4. Copy your service_role JWT (Project Settings → API → service_role)│
-- │      into .env.local as SUPABASE_SERVICE_ROLE_KEY=eyJ…                 │
-- │   5. Restart `npm run dev` so Next.js picks up the new env var.        │
-- │                                                                        │
-- │ Five tables, what each holds:                                          │
-- │                                                                        │
-- │   profiles       one row per user (auth-linked). Holds onboarding flag │
-- │                  + Stripe customer/subscription state + soft prefs.    │
-- │                  Auto-created via trigger when a new auth user signs   │
-- │                  up.                                                   │
-- │                                                                        │
-- │   babies         one row per baby a parent tracks. Holds name, birth   │
-- │                  date, feeding type[], concerns[], avatar color.       │
-- │                  Created at the end of onboarding.                     │
-- │                                                                        │
-- │   scans          one row per AI scan (diaper/cry/rash). Stores the     │
-- │                  structured `result` jsonb plus a quick-access status  │
-- │                  + primary_label for filtering. Photos and audio are   │
-- │                  NEVER stored — only the model's structured output.    │
-- │                                                                        │
-- │   events         one row per tracker log (sleep/diaper/feed/note).     │
-- │                  Holds payload jsonb + occurred_at + duration_minutes. │
-- │                  Insights are computed from this table on the fly.    │
-- │                                                                        │
-- │   chat_messages  one row per chat turn (user or assistant). Powers     │
-- │                  conversation history and could be used for context-   │
-- │                  aware re-prompting later.                             │
-- │                                                                        │
-- │ Idempotency: this file is safe to re-run on a fresh project. On a      │
-- │ project where _combined.sql was already applied, Postgres will error   │
-- │ on `create table` for existing tables — that's expected and fine,      │
-- │ skip past those errors. The block at the bottom (demo-mode             │
-- │ relaxations) is idempotent.                                            │
-- └────────────────────────────────────────────────────────────────────────┘

-- ============================================================================
-- 1. SCHEMA — tables, triggers, functions
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  onboarded_at timestamptz,
  stripe_customer_id text unique,
  subscription_status text check (subscription_status in ('none', 'trialing', 'active', 'past_due', 'canceled', 'lifetime')),
  subscription_tier text check (subscription_tier in ('weekly', 'yearly', 'lifetime')),
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
    feeding_type <@ array['breast', 'formula', 'mixed', 'solids']
  ),
  concerns text[] check (
    concerns <@ array['sleep', 'crying', 'feeding', 'poop', 'health', 'development', 'coordinating']
  ),
  avatar_color text default 'rose',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid references public.babies(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  scan_type text not null check (scan_type in ('diaper', 'cry', 'rash')),
  input_metadata jsonb default '{}'::jsonb,
  result jsonb not null,
  status text check (status in ('healthy', 'monitor', 'urgent', 'unclear')),
  primary_label text,
  safety_override_applied boolean default false,
  safety_override_reason text,
  demo_baby_name text,
  created_at timestamptz default now() not null
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid references public.babies(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  event_type text not null,
  payload jsonb default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  duration_minutes int,
  demo_baby_name text,
  created_at timestamptz default now() not null
);

-- Drop and recreate the events.event_type check so reruns stay clean.
alter table public.events drop constraint if exists events_event_type_check;
alter table public.events add constraint events_event_type_check
  check (event_type in ('feed', 'sleep', 'diaper_change', 'diaper', 'note', 'milestone'));

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  baby_id uuid references public.babies(id) on delete set null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  "references" jsonb,
  created_at timestamptz default now() not null
);

-- updated_at trigger — keeps timestamps honest on row edits.
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists handle_babies_updated_at on public.babies;
create trigger handle_babies_updated_at
  before update on public.babies
  for each row execute function public.handle_updated_at();

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 2. ROW LEVEL SECURITY — every user only sees their own data
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.babies enable row level security;
alter table public.scans enable row level security;
alter table public.events enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Users read own babies" on public.babies;
create policy "Users read own babies" on public.babies
  for select using (auth.uid() = profile_id);
drop policy if exists "Users insert own babies" on public.babies;
create policy "Users insert own babies" on public.babies
  for insert with check (auth.uid() = profile_id);
drop policy if exists "Users update own babies" on public.babies;
create policy "Users update own babies" on public.babies
  for update using (auth.uid() = profile_id);
drop policy if exists "Users delete own babies" on public.babies;
create policy "Users delete own babies" on public.babies
  for delete using (auth.uid() = profile_id);

drop policy if exists "Users read own scans" on public.scans;
create policy "Users read own scans" on public.scans
  for select using (auth.uid() = profile_id);
drop policy if exists "Users insert own scans" on public.scans;
create policy "Users insert own scans" on public.scans
  for insert with check (auth.uid() = profile_id or profile_id is null);
drop policy if exists "Users delete own scans" on public.scans;
create policy "Users delete own scans" on public.scans
  for delete using (auth.uid() = profile_id);

drop policy if exists "Users read own events" on public.events;
create policy "Users read own events" on public.events
  for select using (auth.uid() = profile_id);
drop policy if exists "Users insert own events" on public.events;
create policy "Users insert own events" on public.events
  for insert with check (auth.uid() = profile_id or profile_id is null);
drop policy if exists "Users update own events" on public.events;
create policy "Users update own events" on public.events
  for update using (auth.uid() = profile_id);
drop policy if exists "Users delete own events" on public.events;
create policy "Users delete own events" on public.events
  for delete using (auth.uid() = profile_id);

drop policy if exists "Users read own messages" on public.chat_messages;
create policy "Users read own messages" on public.chat_messages
  for select using (auth.uid() = profile_id);
drop policy if exists "Users insert own messages" on public.chat_messages;
create policy "Users insert own messages" on public.chat_messages
  for insert with check (auth.uid() = profile_id);

-- ============================================================================
-- 3. INDEXES — keep timeline + history queries snappy
-- ============================================================================

create index if not exists idx_babies_profile_id on public.babies(profile_id);
create index if not exists idx_scans_baby_id_created_at on public.scans(baby_id, created_at desc);
create index if not exists idx_scans_profile_id_created_at on public.scans(profile_id, created_at desc);
create index if not exists idx_events_baby_id_occurred_at on public.events(baby_id, occurred_at desc);
create index if not exists idx_events_profile_id_occurred_at on public.events(profile_id, occurred_at desc);
create index if not exists idx_chat_messages_profile_id_created_at on public.chat_messages(profile_id, created_at desc);
create index if not exists idx_profiles_stripe_customer_id on public.profiles(stripe_customer_id);

-- Demo-mode helper indexes — let scans + events sort by demo_baby_name fast
-- when the dual-mode adapter writes without a real baby_id/profile_id.
create index if not exists idx_scans_demo_baby_name_created_at on public.scans(demo_baby_name, created_at desc);
create index if not exists idx_events_demo_baby_name_occurred_at on public.events(demo_baby_name, occurred_at desc);

-- ============================================================================
-- Done. Sanity check by running:
--   select count(*) from public.profiles;  -- should be 0 on a fresh project
--   select count(*) from public.events;
-- After SUPABASE_SERVICE_ROLE_KEY is in .env.local and the dev server is
-- restarted, log a sleep on /trackers and re-run:
--   select * from public.events order by created_at desc limit 5;
-- ============================================================================
