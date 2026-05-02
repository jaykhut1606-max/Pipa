-- 0004_demo_mode_relaxations.sql
--
-- Demo mode doesn't have real auth or a `babies` row — but the rest of the
-- schema (0001) requires baby_id and profile_id on scans + events. Rather
-- than fabricate a placeholder profile/baby, we relax those columns to
-- nullable and add a `demo_baby_name` text column. When real auth lands,
-- baby_id + profile_id get populated and demo_baby_name can be ignored
-- (or backfilled from babies.name).
--
-- We also extend the events.event_type check constraint to allow both
-- 'diaper' (the Pippa app's wire value) and 'diaper_change' (the original
-- enum). Keeping both means the adapter doesn't have to remap on write
-- and reads can stay literal. When real auth lands, normalize to one
-- canonical value.
--
-- Run this in the Supabase SQL editor AFTER _combined.sql has been applied.
-- Idempotent: safe to re-run.

-- ----- scans -----
alter table public.scans alter column baby_id drop not null;
alter table public.scans alter column profile_id drop not null;
alter table public.scans add column if not exists demo_baby_name text;

-- ----- events -----
alter table public.events alter column baby_id drop not null;
alter table public.events alter column profile_id drop not null;
alter table public.events add column if not exists demo_baby_name text;

-- Allow both 'diaper' (Pippa wire value) and 'diaper_change' (original enum)
-- so the adapter doesn't need to remap. Drop-then-add keeps it idempotent.
alter table public.events drop constraint if exists events_event_type_check;
alter table public.events add constraint events_event_type_check
  check (event_type in ('feed', 'sleep', 'diaper_change', 'diaper', 'note', 'milestone'));
