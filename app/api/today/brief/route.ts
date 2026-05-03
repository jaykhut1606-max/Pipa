// Pippa Today — anticipatory daily brief.
//
// Pulls the last 24h of tracker events, builds a compact context payload,
// asks gpt-4o-mini for a baby-specific brief (right now / today / tomorrow).
// Cheap (4o-mini), fast, and the cache control is short — every page load
// gets a fresh read because the user's context changes minute-to-minute.
import { NextResponse } from "next/server";
import { openai } from "@/lib/openai/client";
import { listEvents } from "@/lib/data/events";
import { TODAY_BRIEF_SYSTEM_PROMPT } from "@/lib/openai/prompts/today";

export const runtime = "nodejs";
export const maxDuration = 30;

type Brief = {
  rightNow: { headline: string; detail: string; suggestion: string };
  todayShape: { summary: string; watchFor: string };
  tomorrow: { expect: string };
};

export async function POST(request: Request) {
  let body: { babyName?: string; babyAgeWeeks?: number };
  try {
    body = (await request.json()) as { babyName?: string; babyAgeWeeks?: number };
  } catch {
    body = {};
  }
  const babyName = body.babyName?.trim() || "Baby";
  const babyAgeWeeks =
    typeof body.babyAgeWeeks === "number" && body.babyAgeWeeks >= 0
      ? body.babyAgeWeeks
      : 4;

  // Last 24h of events. listEvents is cheap and already paginated.
  const since = new Date(Date.now() - 86_400_000);
  const events = await listEvents({ since, limit: 200 });

  const now = Date.now();
  // Find the most recent of each type so the model can be specific.
  const lastFeed = events.find((e) => e.eventType === "feed");
  const lastSleep = events.find((e) => e.eventType === "sleep");
  const lastDiaper = events.find((e) => e.eventType === "diaper");

  const minutesAgo = (iso?: string) =>
    iso
      ? Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000))
      : null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  let feedsToday = 0;
  let diapersToday = 0;
  let sleepMinToday = 0;
  for (const e of events) {
    if (new Date(e.occurredAt) < todayStart) continue;
    if (e.eventType === "feed") feedsToday += 1;
    else if (e.eventType === "diaper") diapersToday += 1;
    else if (e.eventType === "sleep") sleepMinToday += e.durationMinutes ?? 0;
  }

  const userPayload = {
    babyName,
    babyAgeWeeks,
    nowIso: new Date().toISOString(),
    today: { feeds: feedsToday, diapers: diapersToday, sleepMinutes: sleepMinToday },
    last24h: {
      eventCount: events.length,
      lastFeedMinutesAgo: minutesAgo(lastFeed?.occurredAt),
      lastSleepEndedMinutesAgo:
        lastSleep
          ? minutesAgo(
              new Date(
                new Date(lastSleep.occurredAt).getTime() +
                  (lastSleep.durationMinutes ?? 0) * 60_000,
              ).toISOString(),
            )
          : null,
      lastSleepDurationMinutes: lastSleep?.durationMinutes ?? null,
      lastDiaperMinutesAgo: minutesAgo(lastDiaper?.occurredAt),
    },
  };

  let brief: Brief;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: TODAY_BRIEF_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });
    const content = completion.choices[0]?.message?.content ?? "{}";
    brief = JSON.parse(content) as Brief;
  } catch (err) {
    console.error("Today brief error:", err);
    return NextResponse.json(
      { error: "Pippa couldn't draft today's brief. Try again in a moment." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    brief,
    context: {
      feedsToday,
      diapersToday,
      sleepMinToday,
      hasEvents: events.length > 0,
    },
  });
}
