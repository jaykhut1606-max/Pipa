// GET /api/tracker/insights — interpreted aggregates over tracker events.
// Thin handler; all computation lives in lib/insights.ts.
//
// Query params:
//   granularity: "day" | "week" | "month"  (default "week")
//   range: "7d" | "30d" | "90d" | "180d"   (default depends on granularity)
//   babyName: string                       (default "Baby" — used in copy)
//   babyAgeWeeks: integer                  (optional — unlocks norm benchmarks)
import { NextResponse } from "next/server";
import { listEvents } from "@/lib/event-store";
import {
  computeInsights,
  defaultRangeFor,
  rangeWindow,
  type RangeToken,
} from "@/lib/insights";
import type { InsightGranularity } from "@/lib/types";

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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const granularity = parseGranularity(url.searchParams.get("granularity"));
    const range = parseRange(url.searchParams.get("range"), granularity);
    const babyName = (url.searchParams.get("babyName") ?? "Baby").slice(0, 60) || "Baby";
    const babyAgeWeeks = parseAgeWeeks(url.searchParams.get("babyAgeWeeks"));

    const { start, end } = rangeWindow(range);
    const events = listEvents({ since: start, until: end, limit: 1000 });

    const response = computeInsights({
      events,
      granularity,
      range,
      rangeStart: start,
      rangeEnd: end,
      babyName,
      babyAgeWeeks,
    });

    return NextResponse.json(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to compute insights";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
