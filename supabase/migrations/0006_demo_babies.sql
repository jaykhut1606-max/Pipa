-- 0006_demo_babies.sql
--
-- Demo mode persists baby profiles into public.babies so the data lives
-- in the DB (not just localStorage). The original 0001 schema requires
-- profile_id NOT NULL because it foreign-keys to public.profiles, which
-- itself references auth.users. Demo mode has no real auth.uid(), so we
-- relax those constraints. When real auth lands, populate profile_id and
-- consider re-tightening.
--
-- Idempotent: safe to re-run.

alter table public.babies alter column profile_id drop not null;
-- birth_date can be unknown if a parent skips it during onboarding —
-- keep the column there so future updates can fill it in.
alter table public.babies alter column birth_date drop not null;
