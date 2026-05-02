// Dual-mode tracker events adapter.
//
// When SUPABASE_SERVICE_ROLE_KEY is set, reads + writes go through the
// service-role Supabase client. Otherwise, everything falls through to
// the in-memory demo store in lib/event-store.ts.
//
// All functions are async to keep callers consistent across modes.
//
// EVENT-TYPE MAPPING DECISION
// ----------------------------
// The original 0001 schema constrained events.event_type to
//   ('feed','sleep','diaper_change','note','milestone')
// but lib/types.ts and the rest of the app use
//   "sleep" | "diaper" | "feed" | "note"
// — i.e. "diaper" not "diaper_change". Rather than remap on every read +
// write (and risk drift), 0004 widens the DB check constraint to allow
// BOTH "diaper" and "diaper_change". This adapter therefore does NO
// remapping: TrackerEvent.eventType is stored verbatim. When real auth
// lands, normalize to a single canonical value (probably "diaper_change"
// to match the original spec) and remove the alternate from 0001's enum.
//
// Column mapping (TrackerEvent ↔ public.events):
//   id              ↔ id (uuid)
//   eventType       ↔ event_type (literal — see note above)
//   payload         ↔ payload (jsonb)
//   occurredAt      ↔ occurred_at
//   durationMinutes ↔ duration_minutes
//   createdAt       ↔ created_at
//   babyName        ↔ demo_baby_name (added in 0004)
//
// baby_id and profile_id are left null in demo mode (allowed since 0004).
import {
  clearEvents as clearDemoEvents,
  deleteEvent as deleteDemoEvent,
  getEvent as getDemoEvent,
  listEvents as listDemoEvents,
  saveEvent as saveDemoEvent,
  seedDemoEvents as seedDemoEventsLocal,
  type ListEventsOptions,
} from "@/lib/event-store";
import { getAdminClient, isSupabaseEnabled } from "@/lib/supabase/admin";
import type {
  TrackerEvent,
  TrackerEventPayload,
  TrackerEventType,
} from "@/lib/types";

export type { ListEventsOptions };

type EventRow = {
  id: string;
  event_type: string;
  payload: TrackerEventPayload | null;
  occurred_at: string;
  duration_minutes: number | null;
  created_at: string;
  demo_baby_name: string | null;
};

function rowToEvent(row: EventRow): TrackerEvent {
  // Normalize 'diaper_change' → 'diaper' on read so the rest of the app
  // (which uses TrackerEventType = "sleep"|"diaper"|"feed"|"note") doesn't
  // have to deal with the wider DB enum. New rows from this adapter are
  // always written with "diaper" — see header note.
  const rawType = row.event_type === "diaper_change" ? "diaper" : row.event_type;
  return {
    id: row.id,
    babyName: row.demo_baby_name ?? "Baby",
    eventType: rawType as TrackerEventType,
    payload: (row.payload ?? { type: "note", data: { text: "" } }) as TrackerEventPayload,
    occurredAt: row.occurred_at,
    durationMinutes: row.duration_minutes ?? undefined,
    createdAt: row.created_at,
  };
}

export async function saveEvent(event: TrackerEvent): Promise<TrackerEvent> {
  if (!isSupabaseEnabled()) return saveDemoEvent(event);
  const sb = getAdminClient()!;
  const { error } = await sb.from("events").insert({
    id: event.id,
    event_type: event.eventType,
    payload: event.payload,
    occurred_at: event.occurredAt,
    duration_minutes: event.durationMinutes ?? null,
    created_at: event.createdAt,
    demo_baby_name: event.babyName,
  });
  if (error) {
    console.error(
      "[events.saveEvent] supabase insert failed; falling back to demo store",
      error
    );
    return saveDemoEvent(event);
  }
  return event;
}

export async function getEvent(id: string): Promise<TrackerEvent | undefined> {
  if (!isSupabaseEnabled()) return getDemoEvent(id);
  const sb = getAdminClient()!;
  const { data, error } = await sb
    .from("events")
    .select(
      "id, event_type, payload, occurred_at, duration_minutes, created_at, demo_baby_name"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error(
      "[events.getEvent] supabase select failed; falling back to demo store",
      error
    );
    return getDemoEvent(id);
  }
  if (!data) return undefined;
  return rowToEvent(data as unknown as EventRow);
}

export async function deleteEvent(id: string): Promise<void> {
  if (!isSupabaseEnabled()) {
    deleteDemoEvent(id);
    return;
  }
  const sb = getAdminClient()!;
  const { error } = await sb.from("events").delete().eq("id", id);
  if (error) {
    console.error(
      "[events.deleteEvent] supabase delete failed; falling back to demo store",
      error
    );
    deleteDemoEvent(id);
  }
}

export async function listEvents(
  opts: ListEventsOptions = {}
): Promise<TrackerEvent[]> {
  if (!isSupabaseEnabled()) return listDemoEvents(opts);
  const sb = getAdminClient()!;
  const { type, since, until, limit = 500 } = opts;
  let q = sb
    .from("events")
    .select(
      "id, event_type, payload, occurred_at, duration_minutes, created_at, demo_baby_name"
    )
    .order("occurred_at", { ascending: false })
    .limit(Math.min(limit, 1000));
  if (type) {
    // Match both "diaper" and "diaper_change" if caller asked for "diaper".
    if (type === "diaper") {
      q = q.in("event_type", ["diaper", "diaper_change"]);
    } else {
      q = q.eq("event_type", type);
    }
  }
  if (since) q = q.gte("occurred_at", since.toISOString());
  if (until) q = q.lte("occurred_at", until.toISOString());

  const { data, error } = await q;
  if (error) {
    console.error(
      "[events.listEvents] supabase select failed; falling back to demo store",
      error
    );
    return listDemoEvents(opts);
  }
  return ((data as unknown as EventRow[]) ?? []).map(rowToEvent);
}

export async function clearEvents(): Promise<void> {
  if (!isSupabaseEnabled()) {
    clearDemoEvents();
    return;
  }
  const sb = getAdminClient()!;
  // Delete only demo rows (those with demo_baby_name set), to keep this
  // safe to call once real auth lands.
  const { error } = await sb
    .from("events")
    .delete()
    .not("demo_baby_name", "is", null);
  if (error) {
    console.error("[events.clearEvents] supabase delete failed", error);
  }
}

// Demo seeding — uses the in-memory store's seeder when running in demo
// mode. In Supabase mode, we replay the same generated events through the
// adapter so the DB ends up populated. Returns the number of events
// seeded (0 if there were already events).
export async function seedDemoEvents(babyName = "Baby"): Promise<number> {
  if (!isSupabaseEnabled()) return seedDemoEventsLocal(babyName);

  const existing = await listEvents({ limit: 1 });
  if (existing.length > 0) return 0;

  // Reuse the generator from the demo store by seeding into a private
  // in-memory store, reading the events out, then clearing.
  // Simpler approach: borrow the same generation logic by calling the
  // local seeder (which writes to the globalThis Map), reading, then
  // wiping. This keeps the seed shape in one place.
  const before = listDemoEvents({ limit: 1 });
  if (before.length === 0) {
    seedDemoEventsLocal(babyName);
  }
  const generated = listDemoEvents({ limit: 1000 });
  // Insert each generated event into Supabase.
  const sb = getAdminClient()!;
  const rows = generated.map((e) => ({
    id: e.id,
    event_type: e.eventType,
    payload: e.payload,
    occurred_at: e.occurredAt,
    duration_minutes: e.durationMinutes ?? null,
    created_at: e.createdAt,
    demo_baby_name: e.babyName,
  }));
  if (rows.length > 0) {
    const { error } = await sb.from("events").insert(rows);
    if (error) {
      console.error("[events.seedDemoEvents] bulk insert failed", error);
    }
  }
  // Tidy up the local store so we don't double-count on future reads —
  // listEvents in supabase mode no longer touches it.
  clearDemoEvents();
  return rows.length;
}
