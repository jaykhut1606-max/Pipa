# Supabase persistence setup

Pippa now has a dual-mode persistence layer:

- **Demo mode (default)** — scans + tracker events live in memory
  (`lib/scan-store.ts` and `lib/event-store.ts`). They reset on every
  server restart. This is what runs out of the box.
- **Real DB mode** — when `SUPABASE_SERVICE_ROLE_KEY` is set, the
  adapters in `lib/data/scans.ts` and `lib/data/events.ts` read and
  write `public.scans` and `public.events` in your Supabase project,
  bypassing RLS via the service-role client.

The switch is the presence of `SUPABASE_SERVICE_ROLE_KEY` in the
environment. Nothing else in the app changes.

---

## One-time setup

### 1. Apply the base schema (once per project)

If you haven't already applied the Phase-1 schema, open the SQL editor:

<https://supabase.com/dashboard/project/aoggfrsofkctkebwsvsg/sql/new>

Paste the entire contents of
[`supabase/migrations/_combined.sql`](../supabase/migrations/_combined.sql)
and run it. This creates `profiles`, `babies`, `scans`, `events`,
`chat_messages`, plus RLS policies and indexes.

You can verify with:

```sql
select count(*) from public.scans;     -- should return 0
select count(*) from public.events;    -- should return 0
```

### 2. Apply the demo-mode relaxations

In the same SQL editor, paste and run
[`supabase/migrations/0004_demo_mode_relaxations.sql`](../supabase/migrations/0004_demo_mode_relaxations.sql).

This:

- Drops `NOT NULL` on `scans.baby_id`, `scans.profile_id`,
  `events.baby_id`, `events.profile_id` (demo mode has no
  profile/baby rows yet).
- Adds a nullable `demo_baby_name text` column to `scans` and
  `events` so the UI's baby-name string survives a write.
- Widens the `events.event_type` check to allow both `'diaper'`
  (the wire value the rest of the app uses) and `'diaper_change'`
  (the original spec value), so the adapter doesn't have to remap.

The migration is idempotent — re-running it is a no-op.

### 3. Get the service-role key

Supabase Dashboard → Project Settings → API → `service_role`
**(secret)**. Copy the JWT.

### 4. Add it to `.env.local`

```dotenv
SUPABASE_SERVICE_ROLE_KEY=<paste the JWT here>
```

> Do NOT commit this key. `.env.local` is gitignored.
> The `service_role` key bypasses RLS — keep it server-side only.

### 5. Restart the dev server

```sh
# stop the existing dev server, then:
npm run dev
```

(In this repo, `npm run dev` is on port 3001 by default.)

---

## Verifying it works

Open the app, run a scan, log a tracker event. Then in the SQL
editor:

```sql
select id, scan_type, demo_baby_name, status, created_at
from public.scans order by created_at desc limit 5;

select id, event_type, demo_baby_name, occurred_at
from public.events order by occurred_at desc limit 10;
```

You should see your test rows. The `demo_baby_name` column carries
the UI's baby-name string; `baby_id` and `profile_id` will be
`null` until real auth lands.

If the insert fails (network, schema mismatch, etc.), the adapter
logs to the server console and falls back to the in-memory store
so the UI keeps working.

---

## Going back to demo mode

Comment out `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and restart.
The adapters will route everything back to the in-memory stores.

---

## What lives where

| File | Role |
|---|---|
| `lib/supabase/admin.ts` | `getAdminClient()` (service-role) and `isSupabaseEnabled()` flag |
| `lib/data/scans.ts` | Dual-mode adapter for scans (`saveScan`, `getScan`, `listScans`) |
| `lib/data/events.ts` | Dual-mode adapter for events (`saveEvent`, `getEvent`, `listEvents`, `deleteEvent`, `clearEvents`, `seedDemoEvents`) |
| `lib/scan-store.ts` | In-memory demo backend — referenced by the adapter only when the service-role key is missing |
| `lib/event-store.ts` | Same, for events |

All adapter functions are `async` regardless of mode, so callers
work the same way whether or not Supabase is enabled.

---

## When real auth lands

Phase 5+ will populate `auth.users` → `profiles` → `babies`. At
that point:

1. Replace the service-role admin client with the per-request
   server client (`lib/supabase/server.ts`) so RLS does the
   tenant scoping.
2. Set `baby_id` + `profile_id` on every insert (the columns are
   already there).
3. Drop the `demo_baby_name` columns and the `'diaper'` check
   value once existing rows are migrated.
4. Restore the `NOT NULL` constraints in a follow-up migration.
