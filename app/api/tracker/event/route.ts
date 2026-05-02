// Tracker event log — POST a new event, GET a list.
// Demo persistence via lib/event-store.ts. The Zod schema mirrors the spec
// Part 7.1 contract; production swap to public.events is mechanical.
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listEvents,
  saveEvent,
  type ListEventsOptions,
} from "@/lib/event-store";
import type {
  TrackerEvent,
  TrackerEventType,
} from "@/lib/types";

const SLEEP = z.object({
  type: z.literal("sleep"),
  data: z.object({
    endedAt: z.string().datetime().optional(),
    location: z
      .enum(["crib", "bassinet", "stroller", "contact", "car", "other"])
      .optional(),
    quality: z.enum(["settled", "restless", "broken"]).optional(),
    notes: z.string().max(500).optional(),
  }),
});

const DIAPER = z.object({
  type: z.literal("diaper"),
  data: z.object({
    kind: z.enum(["wet", "dirty", "mixed"]),
    consistency: z
      .enum(["watery", "loose", "soft", "formed", "hard", "pellets"])
      .optional(),
    color: z.string().max(60).optional(),
    notes: z.string().max(500).optional(),
  }),
});

const FEED = z.object({
  type: z.literal("feed"),
  data: z.object({
    method: z.enum(["breast", "bottle", "solids"]),
    breastSide: z.enum(["left", "right", "both"]).optional(),
    breastLeftMinutes: z.number().int().min(0).max(120).optional(),
    breastRightMinutes: z.number().int().min(0).max(120).optional(),
    bottleMl: z.number().int().min(0).max(500).optional(),
    bottleContents: z.enum(["breast_milk", "formula", "mixed"]).optional(),
    solidsItems: z.array(z.string().max(60)).max(20).optional(),
    notes: z.string().max(500).optional(),
  }),
});

const NOTE = z.object({
  type: z.literal("note"),
  data: z.object({
    text: z.string().min(1).max(1000),
    mood: z.enum(["good", "okay", "rough"]).optional(),
  }),
});

const PAYLOAD = z.discriminatedUnion("type", [SLEEP, DIAPER, FEED, NOTE]);

const POST_BODY = z.object({
  babyName: z.string().min(1).max(60).default("Baby"),
  occurredAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(0).max(1440).optional(),
  payload: PAYLOAD,
});

function uuid(): string {
  // crypto.randomUUID is available in Node 18+ and modern browsers.
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `evt_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = POST_BODY.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.format() },
      { status: 400 }
    );
  }

  const occurredAt = parsed.data.occurredAt ?? new Date().toISOString();
  const event: TrackerEvent = {
    id: uuid(),
    babyName: parsed.data.babyName,
    eventType: parsed.data.payload.type,
    payload: parsed.data.payload,
    occurredAt,
    durationMinutes: parsed.data.durationMinutes,
    createdAt: new Date().toISOString(),
  };
  saveEvent(event);
  return NextResponse.json({ event });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const opts: ListEventsOptions = {};
  const type = url.searchParams.get("type");
  if (type === "sleep" || type === "diaper" || type === "feed" || type === "note") {
    opts.type = type as TrackerEventType;
  }
  const since = url.searchParams.get("since");
  if (since) opts.since = new Date(since);
  const until = url.searchParams.get("until");
  if (until) opts.until = new Date(until);
  const limit = url.searchParams.get("limit");
  if (limit) {
    const n = Number.parseInt(limit, 10);
    if (Number.isFinite(n) && n > 0) opts.limit = Math.min(n, 1000);
  }
  return NextResponse.json({ events: listEvents(opts) });
}
