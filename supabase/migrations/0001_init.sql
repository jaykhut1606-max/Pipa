-- Pippa schema — spec Part 4.1
-- Run via: supabase db push (after `supabase link`)

-- Users are managed by Supabase Auth, we extend with profile.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Onboarding completion
  onboarded_at timestamptz,

  -- Subscription state (synced from Stripe webhook)
  stripe_customer_id text unique,
  subscription_status text check (subscription_status in ('none', 'trialing', 'active', 'past_due', 'canceled', 'lifetime')),
  subscription_tier text check (subscription_tier in ('weekly', 'yearly', 'lifetime')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,

  -- Soft prefs
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

  -- Input metadata (we don't store the actual photo/audio)
  input_metadata jsonb default '{}'::jsonb,

  -- AI result (full structured output)
  result jsonb not null,

  -- Quick access fields for filtering/display
  status text check (status in ('healthy', 'monitor', 'urgent', 'unclear')),
  primary_label text,

  -- Safety tracking
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

  -- For RAG: which sources/scans this message references
  references jsonb,

  created_at timestamptz default now() not null
);

-- Updated_at trigger
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

-- Auto-create profile on signup
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
