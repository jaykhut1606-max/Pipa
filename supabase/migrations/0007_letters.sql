-- 0007_letters.sql
--
-- Pippa Letters: every Sunday Pippa generates a short, warm "letter
-- about your week" from the baby's actual log history (events, scans,
-- milestones). The letter compounds non-linearly — at 12 months the
-- parent has 52 letters they can scroll, share, or export as a baby
-- book. This is what makes Pippa more than an AI wrapper.
--
-- Demo mode uses demo_baby_name for matching (same pattern as events
-- and scans). Real-auth rows use baby_id + profile_id and are gated by
-- the RLS policy below.
--
-- Idempotent: safe to re-run.

create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid references public.babies(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  demo_baby_name text,
  week_start date not null,
  week_end date not null,
  prose text not null,
  highlights jsonb default '{}'::jsonb,
  generated_at timestamptz default now() not null
);

-- One letter per (baby, week) so re-generation upserts cleanly.
-- Demo rows (baby_id null) are deduped on (demo_baby_name, week_start).
create unique index if not exists letters_baby_week_uq
  on public.letters (baby_id, week_start)
  where baby_id is not null;

create unique index if not exists letters_demo_week_uq
  on public.letters (demo_baby_name, week_start)
  where baby_id is null and demo_baby_name is not null;

create index if not exists letters_week_idx
  on public.letters (week_start desc);

create index if not exists letters_demo_idx
  on public.letters (demo_baby_name);

alter table public.letters enable row level security;

drop policy if exists "letters_self_all" on public.letters;
create policy "letters_self_all" on public.letters
  for all using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
