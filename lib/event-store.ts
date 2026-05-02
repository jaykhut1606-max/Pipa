// In-memory tracker event log. Mirrors lib/scan-store.ts for the demo —
// globalThis-backed Map so it survives Turbopack hot reloads, resets on
// server restart. When auth + DB come back, swap callers to insert into
// the `events` table; the shape is intentionally identical.
import type { TrackerEvent, TrackerEventType } from "@/lib/types";

declare global {
  // eslint-disable-next-line no-var
  var __pippa_event_store: Map<string, TrackerEvent> | undefined;
}

const store: Map<string, TrackerEvent> =
  globalThis.__pippa_event_store ??
  (globalThis.__pippa_event_store = new Map());

export function saveEvent(event: TrackerEvent) {
  store.set(event.id, event);
  return event;
}

export function getEvent(id: string): TrackerEvent | undefined {
  return store.get(id);
}

export function deleteEvent(id: string) {
  store.delete(id);
}

export type ListEventsOptions = {
  type?: TrackerEventType;
  since?: Date;
  until?: Date;
  limit?: number;
};

export function listEvents(opts: ListEventsOptions = {}): TrackerEvent[] {
  const { type, since, until, limit = 500 } = opts;
  const out: TrackerEvent[] = [];
  for (const e of store.values()) {
    if (type && e.eventType !== type) continue;
    const t = new Date(e.occurredAt).getTime();
    if (since && t < since.getTime()) continue;
    if (until && t > until.getTime()) continue;
    out.push(e);
  }
  // Newest first.
  out.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  return out.slice(0, limit);
}

export function clearEvents() {
  store.clear();
}

// Demo seeding — call from a route handler if you want a populated app to
// click around in. Generates ~7 days of plausible events for a fictional baby.
export function seedDemoEvents(babyName = "Baby"): number {
  if (store.size > 0) return store.size;
  const now = Date.now();
  const ms = (mins: number) => mins * 60_000;
  const iso = (t: number) => new Date(t).toISOString();
  const uid = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  const seed: TrackerEvent[] = [];

  for (let day = 0; day < 7; day++) {
    const base = now - day * 24 * 60 * 60_000;
    // 6 feeds spaced ~3.5h apart
    for (let f = 0; f < 6; f++) {
      const t = base - f * ms(210) - ms(Math.random() * 30);
      seed.push({
        id: uid(),
        babyName,
        eventType: "feed",
        payload: {
          type: "feed",
          data: {
            method: f % 3 === 0 ? "bottle" : "breast",
            breastSide: f % 2 === 0 ? "left" : "right",
            breastLeftMinutes: f % 2 === 0 ? 12 : undefined,
            breastRightMinutes: f % 2 === 1 ? 14 : undefined,
            bottleMl: f % 3 === 0 ? 90 + Math.round(Math.random() * 30) : undefined,
            bottleContents: f % 3 === 0 ? "breast_milk" : undefined,
          },
        },
        occurredAt: iso(t),
        durationMinutes: 15 + Math.round(Math.random() * 15),
        createdAt: iso(t),
      });
    }
    // 4 diapers
    for (let d = 0; d < 4; d++) {
      const t = base - d * ms(360) - ms(Math.random() * 60);
      seed.push({
        id: uid(),
        babyName,
        eventType: "diaper",
        payload: {
          type: "diaper",
          data: {
            kind: d % 3 === 0 ? "dirty" : d % 3 === 1 ? "wet" : "mixed",
            color: d % 3 === 0 ? "mustard yellow" : undefined,
            consistency: d % 3 === 0 ? "soft" : undefined,
          },
        },
        occurredAt: iso(t),
        createdAt: iso(t),
      });
    }
    // 3 sleeps
    const sleepBlocks = [
      { offset: ms(60), duration: 90 + Math.round(Math.random() * 90) },
      { offset: ms(360), duration: 45 + Math.round(Math.random() * 60) },
      { offset: ms(720), duration: 120 + Math.round(Math.random() * 90) },
    ];
    for (const b of sleepBlocks) {
      const t = base - b.offset;
      seed.push({
        id: uid(),
        babyName,
        eventType: "sleep",
        payload: {
          type: "sleep",
          data: {
            endedAt: iso(t + b.duration * 60_000),
            location: "crib",
            quality: "settled",
          },
        },
        occurredAt: iso(t),
        durationMinutes: b.duration,
        createdAt: iso(t),
      });
    }
  }

  for (const e of seed) store.set(e.id, e);
  return seed.length;
}
