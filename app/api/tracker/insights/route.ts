// GET /api/tracker/insights — interpreted aggregates over tracker events.
// Thin handler; all computation lives in lib/insights.ts.
//
// Query params:
//   granularity: "day" | "week" | "month"  (default "week")
//   range: "7d" | "30d" | "90d" | "180d"   (default depends on granularity)
//   babyName: string                       (default "Baby" — used in copy)
//   babyAgeWeeks: integer                  (optional — unlocks norm benchmarks)
import { NextResponse } from "next/server";
import { listEvents } from "@/lib/data/events";
import {
  computeInsights,
  defaultRangeFor,
  rangeWindow,
  type RangeToken,
} from "@/lib/insights";
import { openai } from "@/lib/openai/client";
import { INSIGHTS_NARRATIVE_SYSTEM_PROMPT } from "@/lib/openai/prompts/insights";
import type { InsightGranularity, InsightsResponse } from "@/lib/types";

const GRANULARITIES = new Set<InsightGranularity>(["day", "week", "month"]);
const RANGES = new Set<RangeToken>(["7d", "30d", "90d", "180d"]);

function parseGranularity(raw: string | null): InsightGranularity {
  if (raw && GRANULARITIES.has(raw as InsightGranularity)) {
    return raw as InsightGranularity;
  }
  return "week";
}

function parseRange(raw: string | null, granularity: InsightGranularity): RangeToken {
  if (raw && RANGES.has(raw as RangeToken)) return raw as RangeToken;
  return defaultRangeFor(granularity);
}

function parseAgeWeeks(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0 || n > 520) return undefined;
  return n;
}

async function generateAiNarrative({
  response,
  babyName,
  babyAgeWeeks,
}: {
  response: InsightsResponse;
  babyName: string;
  babyAgeWeeks?: number;
}): Promise<string | undefined> {
  const userPayload = {
    granularity: response.granularity,
    rangeStart: response.rangeStart,
    rangeEnd: response.rangeEnd,
    babyName,
    babyAgeWeeks: babyAgeWeeks ?? null,
    cards: response.cards.map((c) => ({
      id: c.id,
      title: c.title,
      metric: c.metric,
      delta: c.delta ?? null,
    })),
  };

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: INSIGHTS_NARRATIVE_SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(userPayload) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.6,
  });
  const content = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content) as { narrative?: string };
    const text = parsed.narrative?.trim();
    return text && text.length > 0 ? text : undefined;
  } catch {
    return undefined;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const granularity = parseGranularity(url.searchParams.get("granularity"));
    const range = parseRange(url.searchParams.get("range"), granularity);
    const babyName = (url.searchParams.get("babyName") ?? "Baby").slice(0, 60) || "Baby";
    const babyAgeWeeks = parseAgeWeeks(url.searchParams.get("babyAgeWeeks"));

    const { start, end } = rangeWindow(range);
    const events = await listEvents({ since: start, until: end, limit: 1000 });

    const response: InsightsResponse = computeInsights({
      events,
      granularity,
      range,
      rangeStart: start,
      rangeEnd: end,
      babyName,
      babyAgeWeeks,
    });

    // AI fallback narrative — only if the heuristic produced nothing
    // AND we have at least a few events to talk about. Cheap (mini)
    // and gracefully fails to "no narrative" on any error.
    if (!response.narrative && events.length >= 3) {
      try {
        const aiNarrative = await generateAiNarrative({
          response,
          babyName,
          babyAgeWeeks,
        });
        if (aiNarrative) response.narrative = aiNarrative;
      } catch (err) {
        console.warn("[insights] AI narrative skipped:", err);
      }
    }

    return NextResponse.json(response, {
      headers: {
        // Insights aggregates change once a day at most; let the
        // browser cache for 5 minutes. Visibility-refresh on the
        // page handles "tab back" freshness.
        "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to compute insights";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
