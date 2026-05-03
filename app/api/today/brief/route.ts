// Pippa Today — anticipatory daily brief.
//
// Pulls the last 24h of tracker events, builds a compact context payload,
// asks gpt-4o-mini for the qualitative bits (vibe, narrative, patterns,
// tomorrow). Predictive next-feed/next-nap windows are computed
// algorithmically from age norms × the most-recent event so they don't
// drift with the model's mood.
import { NextResponse } from "next/server";
import { openai } from "@/lib/openai/client";
import { listEvents } from "@/lib/data/events";
import { TODAY_BRIEF_SYSTEM_PROMPT } from "@/lib/openai/prompts/today";
import {
  nextFeedWindow,
  nextSleepWindow,
  type Window,
} from "@/lib/today/predict";

export const runtime = "nodejs";
export const maxDuration = 30;

type Brief = {
  vibe: { tone: "settled" | "steady" | "watchful" | "rough"; headline: string };
  rightNow: { headline: string; detail: string; suggestion: string };
  todayShape: { summary: string; watchFor: string };
  patterns?: Array<{
    kind: "good" | "neutral" | "watch";
    headline: string;
    detail: string;
  }>;
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
  const lastFeed = events.find((e) => e.eventType === "feed");
  const lastSleep = events.find((e) => e.eventType === "sleep");
  const lastDiaper = events.find((e) => e.eventType === "diaper");

  const minutesAgo = (iso?: string) =>
    iso
      ? Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000))
      : null;

  // For sleep "wake time" = occurredAt + duration. If we don't know the
  // duration we assume the sleep just ended at occurredAt (best-effort).
  const lastSleepEndIso = lastSleep
    ? new Date(
        new Date(lastSleep.occurredAt).getTime() +
          (lastSleep.durationMinutes ?? 0) * 60_000,
      ).toISOString()
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

  // Predictive windows — algorithmic, not AI.
  const nextFeed: Window | null = nextFeedWindow(
    babyAgeWeeks,
    lastFeed?.occurredAt ?? null,
  );
  const nextSleep: Window | null = nextSleepWindow(babyAgeWeeks, lastSleepEndIso);

  const userPayload = {
    babyName,
    babyAgeWeeks,
    nowIso: new Date().toISOString(),
    today: { feeds: feedsToday, diapers: diapersToday, sleepMinutes: sleepMinToday },
    last24h: {
      eventCount: events.length,
      lastFeedMinutesAgo: minutesAgo(lastFeed?.occurredAt),
      lastSleepEndedMinutesAgo: minutesAgo(lastSleepEndIso ?? undefined),
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

  return NextResponse.json(
    {
      brief,
      predictions: { nextFeed, nextSleep },
      context: {
        feedsToday,
        diapersToday,
        sleepMinToday,
        hasEvents: events.length > 0,
      },
    },
    {
      headers: {
        // 60s private cache — quick re-navigation between Today and other
        // tabs replays the same brief instead of re-hitting OpenAI. The
        // "Refresh" button bypasses by mounting fresh.
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    },
  );
}
