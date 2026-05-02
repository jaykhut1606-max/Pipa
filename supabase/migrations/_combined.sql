-- Combined migrations 0001 + 0002 + 0003.
-- Easiest path: paste this whole file into Supabase Dashboard
-- → SQL Editor → New query → Run. Idempotent re-runs require
-- dropping the tables first; this is meant for a fresh project.
--
-- Alternative path (Supabase CLI):
--   supabase login
--   supabase link --project-ref aoggfrsofkctkebwsvsg
--   supabase db push

------------------------------
-- 0001_init.sql — schema
------------------------------

create table public.profiles (
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

create table public.babies (
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

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  scan_type text not null check (scan_type in ('diaper', 'cry', 'rash')),
  input_metadata jsonb default '{}'::jsonb,
  result jsonb not null,
  status text check (status in ('healthy', 'monitor', 'urgent', 'unclear')),
  primary_label text,
  safety_override_applied boolean default false,
  safety_override_reason text,
  created_at timestamptz default now() not null
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('feed', 'sleep', 'diaper_change', 'note', 'milestone')),
  payload jsonb default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  duration_minutes int,
  created_at timestamptz default now() not null
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  baby_id uuid references public.babies(id) on delete set null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  references jsonb,
  created_at timestamptz default now() not null
);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger handle_babies_updated_at
  before update on public.babies
  for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------
-- 0002_rls.sql — row-level security
------------------------------

alter table public.profiles enable row level security;
alter table public.babies enable row level security;
alter table public.scans enable row level security;
alter table public.events enable row level security;
alter table public.chat_messages enable row level security;

create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users read own babies" on public.babies
  for select using (auth.uid() = profile_id);
create policy "Users insert own babies" on public.babies
  for insert with check (auth.uid() = profile_id);
create policy "Users update own babies" on public.babies
  for update using (auth.uid() = profile_id);
create policy "Users delete own babies" on public.babies
  for delete using (auth.uid() = profile_id);

create policy "Users read own scans" on public.scans
  for select using (auth.uid() = profile_id);
create policy "Users insert own scans" on public.scans
  for insert with check (auth.uid() = profile_id);
create policy "Users delete own scans" on public.scans
  for delete using (auth.uid() = profile_id);

create policy "Users read own events" on public.events
  for select using (auth.uid() = profile_id);
create policy "Users insert own events" on public.events
  for insert with check (auth.uid() = profile_id);
create policy "Users update own events" on public.events
  for update using (auth.uid() = profile_id);
create policy "Users delete own events" on public.events
  for delete using (auth.uid() = profile_id);

create policy "Users read own messages" on public.chat_messages
  for select using (auth.uid() = profile_id);
create policy "Users insert own messages" on public.chat_messages
  for insert with check (auth.uid() = profile_id);

------------------------------
-- 0003_indexes.sql — indexes
------------------------------

create index idx_babies_profile_id on public.babies(profile_id);
create index idx_scans_baby_id_created_at on public.scans(baby_id, created_at desc);
create index idx_scans_profile_id_created_at on public.scans(profile_id, created_at desc);
create index idx_events_baby_id_occurred_at on public.events(baby_id, occurred_at desc);
create index idx_events_profile_id_occurred_at on public.events(profile_id, occurred_at desc);
create index idx_chat_messages_profile_id_created_at on public.chat_messages(profile_id, created_at desc);
create index idx_profiles_stripe_customer_id on public.profiles(stripe_customer_id);
