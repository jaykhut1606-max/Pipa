// POST /api/letters/generate
//
// Body: { babyName, babyAgeWeeks?, weekStart? } (weekStart defaults to
// the most-recent past Monday; pass an ISO date YYYY-MM-DD to backfill).
//
// Pulls the week's events from public.events, builds a compact summary
// payload, asks gpt-4o-mini for a warm short letter, upserts to
// public.letters, returns the row.
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { openai } from "@/lib/openai/client";
import { listEvents } from "@/lib/data/events";
import { upsertLetter, type LetterHighlights } from "@/lib/data/letters";
import { LETTER_SYSTEM_PROMPT } from "@/lib/openai/prompts/letter";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  babyName: z.string().min(1).max(60),
  babyAgeWeeks: z.number().int().min(0).max(520).optional(),
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD")
    .optional(),
});

type LetterGenerated = {
  title: string;
  prose: string;
  closing: string;
  highlights: LetterHighlights;
};

// Most recent past Monday (00:00 local). If today IS Monday, returns
// today; the journal then represents an in-progress week.
function mostRecentMonday(now = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  // getDay: 0 = Sun, 1 = Mon ... 6 = Sat. Distance back to Monday:
  const dow = d.getDay();
  const back = dow === 0 ? 6 : dow - 1;
  d.setDate(d.getDate() - back);
  return d;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function POST(request: Request) {
  let body;
  try {
    body = Body.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid body", details: String(err) },
      { status: 400 },
    );
  }

  // Resolve the week window.
  const weekStart = body.weekStart
    ? new Date(`${body.weekStart}T00:00:00`)
    : mostRecentMonday();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Pull the week's events. listEvents already paginates.
  const events = await listEvents({
    since: weekStart,
    until: weekEnd,
    limit: 500,
  });

  // Compact stats for the prompt — the model never sees the raw
  // 500-row list, just the rolled-up shape.
  let feedsCount = 0;
  let diapersCount = 0;
  let sleepMinutes = 0;
  let longestSleep = 0;
  for (const e of events) {
    if (e.eventType === "feed") feedsCount += 1;
    else if (e.eventType === "diaper") diapersCount += 1;
    else if (e.eventType === "sleep") {
      sleepMinutes += e.durationMinutes ?? 0;
      if ((e.durationMinutes ?? 0) > longestSleep) {
        longestSleep = e.durationMinutes ?? 0;
      }
    }
  }

  const userPayload = {
    babyName: body.babyName,
    babyAgeWeeks: body.babyAgeWeeks ?? null,
    weekStart: isoDate(weekStart),
    weekEnd: isoDate(weekEnd),
    eventCount: events.length,
    feedsCount,
    diapersCount,
    sleepMinutes,
    longestSleepMinutes: longestSleep,
    totalSleepHours: Math.round((sleepMinutes / 60) * 10) / 10,
    sampleEvents: events.slice(0, 12).map((e) => ({
      type: e.eventType,
      when: e.occurredAt,
      durationMinutes: e.durationMinutes,
    })),
  };

  let generated: LetterGenerated;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: LETTER_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    const content = completion.choices[0]?.message?.content ?? "{}";
    generated = JSON.parse(content) as LetterGenerated;
  } catch (err) {
    console.error("Letter generation error:", err);
    return NextResponse.json(
      { error: "Pippa couldn't write this week's letter. Try again in a moment." },
      { status: 502 },
    );
  }

  const letter = await upsertLetter({
    id: randomUUID(),
    babyName: body.babyName,
    weekStart: isoDate(weekStart),
    weekEnd: isoDate(weekEnd),
    title: generated.title,
    prose: generated.prose,
    closing: generated.closing,
    highlights: generated.highlights ?? { feedsCount, diapersCount },
    generatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ letter });
}
