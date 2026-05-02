// Pure insights computation for the tracker. The route handler is thin —
// everything below is testable in isolation against any TrackerEvent[].
//
// Shape returned: see InsightsResponse in lib/types.ts (the contract).
//
// Tone rules baked in here (Pippa voice):
//   - warm, never alarmist or clinical
//   - mention "varies a lot at this age" when below norm
//   - never recommend medications or diagnose
//   - no exclamation marks
//   - use baby's name when given
import type {
  InsightCard,
  InsightGranularity,
  InsightInterpretation,
  InsightSeries,
  InsightsResponse,
  TrackerEvent,
} from "@/lib/types";
import {
  FEED_NORM,
  SLEEP_NORM,
  WET_DIAPER_NORM,
  ageBand,
  classify,
  formatHourBand,
} from "@/lib/age-norms";

// Range tokens accepted from the route. Default chosen by the route based on
// granularity (day → 7d, week → 30d, month → 180d).
export type RangeToken = "7d" | "30d" | "90d" | "180d";

export type ComputeArgs = {
  events: TrackerEvent[];
  granularity: InsightGranularity;
  range: RangeToken;
  rangeStart: Date;
  rangeEnd: Date;
  babyName: string;
  babyAgeWeeks?: number;
};

// ---------- date / bucket helpers ----------

const DAY_MS = 24 * 60 * 60_000;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

// ISO week per ISO-8601: week containing Thursday belongs to that year.
function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
  return `${date.getUTCFullYear()}-W${pad2(weekNo)}`;
}

export function formatBucketKey(d: Date, g: InsightGranularity): string {
  if (g === "day") return dayKey(d);
  if (g === "week") return isoWeekKey(d);
  return monthKey(d);
}

// Build the ordered list of bucket keys spanning [start, end]. Used to ensure
// empty buckets still render zeros instead of getting dropped.
function bucketKeysBetween(
  start: Date,
  end: Date,
  g: InsightGranularity
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  // Step a single day at a time and dedupe — handles week/month rollover.
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cursor.getTime() <= last.getTime()) {
    const k = formatBucketKey(cursor, g);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(k);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

// ---------- formatters ----------

export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}

export function pctChange(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function deltaFor(
  current: number,
  previous: number,
  comparisonLabel: string,
  format: (n: number) => string
): InsightCard["delta"] | undefined {
  if (!Number.isFinite(previous)) return undefined;
  const diff = current - previous;
  const direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
  const label =
    direction === "flat"
      ? `Steady vs ${comparisonLabel}`
      : `${sign}${format(Math.abs(diff))} vs ${comparisonLabel}`;
  return { direction, label };
}

function granularityLabel(g: InsightGranularity, current: boolean): string {
  if (g === "day") return current ? "today" : "yesterday";
  if (g === "week") return current ? "this week" : "last week";
  return current ? "this month" : "last month";
}

function comparisonLabel(g: InsightGranularity): string {
  if (g === "day") return "yesterday";
  if (g === "week") return "last week";
  return "last month";
}

// ---------- bucketing ----------

export type Bucket = {
  key: string;
  start: Date;
  end: Date;
  events: TrackerEvent[];
};

export function bucketEvents(
  events: TrackerEvent[],
  granularity: InsightGranularity,
  rangeStart: Date,
  rangeEnd: Date
): Bucket[] {
  const keys = bucketKeysBetween(rangeStart, rangeEnd, granularity);
  const map = new Map<string, Bucket>();
  for (const k of keys) {
    map.set(k, { key: k, start: rangeStart, end: rangeEnd, events: [] });
  }
  for (const e of events) {
    const d = new Date(e.occurredAt);
    if (d.getTime() < rangeStart.getTime() || d.getTime() > rangeEnd.getTime()) continue;
    const k = formatBucketKey(d, granularity);
    const b = map.get(k);
    if (b) b.events.push(e);
  }
  return Array.from(map.values());
}

// Per-day buckets regardless of selected granularity — used by feed/diaper
// cards which always show daily resolution for the last N days.
function dayBuckets(
  events: TrackerEvent[],
  rangeStart: Date,
  rangeEnd: Date,
  maxDays?: number
): Bucket[] {
  const all = bucketEvents(events, "day", rangeStart, rangeEnd);
  if (!maxDays || all.length <= maxDays) return all;
  return all.slice(-maxDays);
}

// ---------- domain helpers ----------

function sumSleepMinutes(b: Bucket): number {
  let total = 0;
  for (const e of b.events) {
    if (e.eventType === "sleep" && typeof e.durationMinutes === "number") {
      total += e.durationMinutes;
    }
  }
  return total;
}

function maxSleepStretch(b: Bucket): number {
  let max = 0;
  for (const e of b.events) {
    if (e.eventType === "sleep" && typeof e.durationMinutes === "number") {
      if (e.durationMinutes > max) max = e.durationMinutes;
    }
  }
  return max;
}

function countEvents(b: Bucket, type: TrackerEvent["eventType"]): number {
  let c = 0;
  for (const e of b.events) if (e.eventType === type) c++;
  return c;
}

function countDiapers(b: Bucket): { wet: number; dirty: number } {
  let wet = 0;
  let dirty = 0;
  for (const e of b.events) {
    if (e.eventType !== "diaper") continue;
    if (e.payload.type !== "diaper") continue;
    const kind = e.payload.data.kind;
    if (kind === "wet") wet++;
    else if (kind === "dirty") dirty++;
    else if (kind === "mixed") {
      wet++;
      dirty++;
    }
  }
  return { wet, dirty };
}

function feedMethodCounts(events: TrackerEvent[]): {
  breast: number;
  bottle: number;
  solids: number;
  total: number;
} {
  let breast = 0;
  let bottle = 0;
  let solids = 0;
  for (const e of events) {
    if (e.eventType !== "feed" || e.payload.type !== "feed") continue;
    const m = e.payload.data.method;
    if (m === "breast") breast++;
    else if (m === "bottle") bottle++;
    else if (m === "solids") solids++;
  }
  return { breast, bottle, solids, total: breast + bottle + solids };
}

// Day-of-week label for a bucket key (used when granularity is "day").
function weekdayLabel(key: string): string {
  // key: "YYYY-MM-DD"
  const [y, m, d] = key.split("-").map((s) => Number.parseInt(s, 10));
  if (!y || !m || !d) return key;
  const date = new Date(y, m - 1, d);
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
    date.getDay()
  ];
}

// ---------- card builders ----------

function buildSleepTotalCard(
  buckets: Bucket[],
  granularity: InsightGranularity,
  babyName: string,
  babyAgeWeeks?: number
): InsightCard {
  const series: InsightSeries = {
    label: "Sleep total",
    unit: "min",
    buckets: buckets.map((b) => ({ key: b.key, value: sumSleepMinutes(b) })),
  };
  const last = buckets[buckets.length - 1];
  const prev = buckets[buckets.length - 2];
  const lastVal = last ? sumSleepMinutes(last) : 0;
  const prevVal = prev ? sumSleepMinutes(prev) : Number.NaN;

  const bullets: string[] = [];

  // Longest single stretch within the most recent bucket.
  if (last) {
    let longest = 0;
    let longestEvent: TrackerEvent | undefined;
    for (const e of last.events) {
      if (e.eventType === "sleep" && typeof e.durationMinutes === "number") {
        if (e.durationMinutes > longest) {
          longest = e.durationMinutes;
          longestEvent = e;
        }
      }
    }
    if (longest > 0 && longestEvent) {
      const day = weekdayLabel(dayKey(new Date(longestEvent.occurredAt)));
      bullets.push(`Longest stretch was ${formatDuration(longest)} on ${day}.`);
    }
  }

  // Trend bullet vs previous bucket.
  const change = pctChange(lastVal, prevVal);
  if (change !== null) {
    const abs = Math.round(Math.abs(change));
    if (abs >= 5) {
      const dir = change > 0 ? "up" : "down";
      const ctxLast = comparisonLabel(granularity);
      if (dir === "up") {
        bullets.push(`${babyName} slept ~${abs}% more than ${ctxLast} — nice rhythm.`);
      } else {
        bullets.push(
          `Down ~${abs}% from ${ctxLast} — totally normal during a growth-spurt window, and varies a lot at this age.`
        );
      }
    } else {
      bullets.push(`Sleep totals are steady compared to ${comparisonLabel(granularity)}.`);
    }
  }

  // Benchmark against age norm — only when we have age + at least one full bucket.
  let benchmark: string | undefined;
  if (typeof babyAgeWeeks === "number" && buckets.length > 0) {
    // Use a daily average across the populated portion of the range.
    const populated = buckets.filter((b) => sumSleepMinutes(b) > 0);
    if (populated.length > 0) {
      const totalMins = populated.reduce((s, b) => s + sumSleepMinutes(b), 0);
      // Convert bucket totals to daily averages via the number of days each
      // bucket nominally covers. For simplicity assume day=1, week=7, month=30.
      const daysPerBucket = granularity === "day" ? 1 : granularity === "week" ? 7 : 30;
      const dailyAvg = totalMins / (populated.length * daysPerBucket);
      const band = ageBand(babyAgeWeeks);
      const norm = SLEEP_NORM[band];
      const c = classify(dailyAvg, norm.dailyMinutes);
      const bandLabel = `${norm.label} (${formatHourBand(norm.dailyMinutes)})`;
      if (c === "typical") {
        benchmark = `Within typical range for ${bandLabel}.`;
      } else if (c === "low") {
        benchmark = `A bit below typical for ${bandLabel} — varies a lot at this age.`;
      } else {
        benchmark = `Above typical for ${bandLabel} — extra rest while it lasts.`;
      }
    }
  }

  const interpretation: InsightInterpretation | undefined =
    bullets.length > 0 || benchmark
      ? { bullets: bullets.slice(0, 3), benchmark }
      : undefined;

  return {
    id: "sleep-total",
    title: granularity === "day" ? "Sleep today" : granularity === "week" ? "Sleep this week" : "Sleep this month",
    metric: formatDuration(lastVal),
    delta: deltaFor(lastVal, prevVal, comparisonLabel(granularity), formatDuration),
    series,
    interpretation,
  };
}

function buildFeedsPerDayCard(
  events: TrackerEvent[],
  rangeStart: Date,
  rangeEnd: Date,
  babyName: string,
  babyAgeWeeks?: number
): InsightCard {
  const days = dayBuckets(events, rangeStart, rangeEnd, 14);
  const series: InsightSeries = {
    label: "Feeds per day",
    unit: "feeds",
    buckets: days.map((b) => ({ key: b.key, value: countEvents(b, "feed") })),
  };

  // Average across populated days (avoid penalising for a quiet first day).
  const populated = days.filter((b) => countEvents(b, "feed") > 0);
  const totalFeeds = populated.reduce((s, b) => s + countEvents(b, "feed"), 0);
  const avg = populated.length > 0 ? totalFeeds / populated.length : 0;
  const metric = `${avg.toFixed(1)} feeds/day`;

  // Compare last-half vs first-half of the window for a soft trend signal.
  const half = Math.floor(days.length / 2);
  const recent = days.slice(half);
  const earlier = days.slice(0, half);
  const recentAvg = avgFeedsPerDay(recent);
  const earlierAvg = avgFeedsPerDay(earlier);

  const delta = deltaFor(
    Number.parseFloat(recentAvg.toFixed(1)),
    Number.parseFloat(earlierAvg.toFixed(1)),
    "the prior period",
    (n) => `${n.toFixed(1)}/day`
  );

  const bullets: string[] = [];

  // Consistency: stdev of per-day counts.
  if (populated.length >= 3) {
    const counts = populated.map((b) => countEvents(b, "feed"));
    const mean = counts.reduce((s, n) => s + n, 0) / counts.length;
    const variance =
      counts.reduce((s, n) => s + (n - mean) ** 2, 0) / counts.length;
    const stdev = Math.sqrt(variance);
    if (stdev <= 1) {
      bullets.push(`Feed schedule has been remarkably consistent.`);
    } else if (stdev >= 2.5) {
      bullets.push(`Feed counts varied day-to-day — that often tracks growth and naps.`);
    }
  }

  // Method mix.
  const mix = feedMethodCounts(events.filter((e) => isInRange(e, rangeStart, rangeEnd)));
  if (mix.total > 0 && mix.breast > 0 && mix.bottle > 0) {
    const breastPct = Math.round((mix.breast / mix.total) * 100);
    bullets.push(
      `Roughly ${breastPct}% breast / ${100 - breastPct}% bottle in the mix — a common combo.`
    );
  }

  // Average gap between feeds.
  const gap = avgFeedGapMinutes(events, rangeStart, rangeEnd);
  if (gap !== null && gap > 0) {
    bullets.push(`${babyName} averages ${formatDuration(gap)} between feeds.`);
  }

  // Benchmark.
  let benchmark: string | undefined;
  if (typeof babyAgeWeeks === "number" && avg > 0) {
    const norm = FEED_NORM[ageBand(babyAgeWeeks)];
    const c = classify(avg, norm.perDay);
    const bandLabel = `${norm.label} (${norm.perDay.low}–${norm.perDay.high}/day)`;
    if (c === "typical") {
      benchmark = `Within typical range for ${bandLabel}.`;
    } else if (c === "low") {
      benchmark = `A touch under the typical band for ${bandLabel} — varies a lot at this age.`;
    } else {
      benchmark = `On the higher end for ${bandLabel}, often a growth-spurt sign.`;
    }
  }

  const interpretation: InsightInterpretation | undefined =
    bullets.length > 0 || benchmark
      ? { bullets: bullets.slice(0, 3), benchmark }
      : undefined;

  return {
    id: "feeds-per-day",
    title: "Feeds per day",
    metric,
    delta,
    series,
    interpretation,
  };
}

function avgFeedsPerDay(days: Bucket[]): number {
  const populated = days.filter((b) => countEvents(b, "feed") > 0);
  if (populated.length === 0) return 0;
  const total = populated.reduce((s, b) => s + countEvents(b, "feed"), 0);
  return total / populated.length;
}

function avgFeedGapMinutes(
  events: TrackerEvent[],
  rangeStart: Date,
  rangeEnd: Date
): number | null {
  const feeds = events
    .filter((e) => e.eventType === "feed" && isInRange(e, rangeStart, rangeEnd))
    .map((e) => new Date(e.occurredAt).getTime())
    .sort((a, b) => a - b);
  if (feeds.length < 2) return null;
  const gaps: number[] = [];
  for (let i = 1; i < feeds.length; i++) {
    const gap = (feeds[i] - feeds[i - 1]) / 60_000;
    // Skip gaps over 12h — those usually span an overnight stretch.
    if (gap > 0 && gap < 12 * 60) gaps.push(gap);
  }
  if (gaps.length === 0) return null;
  return gaps.reduce((s, n) => s + n, 0) / gaps.length;
}

function isInRange(e: TrackerEvent, start: Date, end: Date): boolean {
  const t = new Date(e.occurredAt).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function buildDiaperRhythmCard(
  events: TrackerEvent[],
  rangeStart: Date,
  rangeEnd: Date,
  babyName: string,
  babyAgeWeeks?: number
): InsightCard {
  const days = dayBuckets(events, rangeStart, rangeEnd, 14);
  const series: InsightSeries = {
    label: "Diapers per day",
    unit: "diapers",
    buckets: days.map((b) => {
      const c = countDiapers(b);
      return { key: b.key, value: c.wet, secondary: c.dirty };
    }),
  };

  const lastDay = days[days.length - 1];
  const lastCounts = lastDay ? countDiapers(lastDay) : { wet: 0, dirty: 0 };

  const bullets: string[] = [];

  // Hydration cue — only for younger babies (< 16 weeks).
  if (typeof babyAgeWeeks === "number" && babyAgeWeeks < 16) {
    const populated = days.filter((b) => {
      const c = countDiapers(b);
      return c.wet + c.dirty > 0;
    });
    const avgWet =
      populated.length > 0
        ? populated.reduce((s, b) => s + countDiapers(b).wet, 0) / populated.length
        : 0;
    if (avgWet >= 6) {
      bullets.push(
        `Averaging ${avgWet.toFixed(1)} wet diapers/day — 6+ is a good hydration sign for breastfed newborns.`
      );
    } else if (avgWet > 0) {
      bullets.push(
        `Wet count is averaging ${avgWet.toFixed(1)}/day — varies a lot at this age, worth keeping an eye on.`
      );
    }
  }

  // Dirty trend across the window.
  const dirties = days.map((b) => countDiapers(b).dirty);
  const dirtyTotal = dirties.reduce((s, n) => s + n, 0);
  const dirtyDays = dirties.filter((n) => n > 0).length;
  if (dirtyTotal > 0) {
    bullets.push(
      `${dirtyTotal} dirty diapers across ${dirtyDays} of the last ${days.length} days — within an ordinary rhythm.`
    );
  } else if (days.length >= 2) {
    bullets.push(
      `No dirty diapers logged yet in this window — older babies often stretch to several days, especially when breastfed.`
    );
  }

  // Benchmark (separate from hydration bullet so both can fire).
  let benchmark: string | undefined;
  if (typeof babyAgeWeeks === "number") {
    const populated = days.filter((b) => {
      const c = countDiapers(b);
      return c.wet + c.dirty > 0;
    });
    const avgWet =
      populated.length > 0
        ? populated.reduce((s, b) => s + countDiapers(b).wet, 0) / populated.length
        : 0;
    if (avgWet > 0) {
      const norm = WET_DIAPER_NORM[ageBand(babyAgeWeeks)];
      const c = classify(avgWet, norm.perDay);
      const bandLabel = `${norm.label} (${norm.perDay.low}–${norm.perDay.high} wets/day)`;
      if (c === "typical") {
        benchmark = `Within typical range for ${bandLabel}.`;
      } else if (c === "low") {
        benchmark = `A bit below typical for ${bandLabel} — varies a lot at this age.`;
      } else {
        benchmark = `Slightly above typical for ${bandLabel} — usually nothing to worry about.`;
      }
    }
  }

  const interpretation: InsightInterpretation | undefined =
    bullets.length > 0 || benchmark
      ? { bullets: bullets.slice(0, 3), benchmark }
      : undefined;

  // Suppress unused-name warning while keeping the param for future copy.
  void babyName;

  return {
    id: "diaper-rhythm",
    title: "Diaper rhythm",
    metric: `${lastCounts.wet} wet today`,
    series,
    interpretation,
  };
}

function buildLongestStretchCard(
  events: TrackerEvent[],
  rangeStart: Date,
  rangeEnd: Date,
  babyName: string
): InsightCard {
  const days = dayBuckets(events, rangeStart, rangeEnd);
  const perDayMax = days.map((b) => ({ key: b.key, value: maxSleepStretch(b) }));
  const overallMax = perDayMax.reduce((m, b) => Math.max(m, b.value), 0);

  const series: InsightSeries = {
    label: "Longest stretch per day",
    unit: "min",
    buckets: perDayMax,
  };

  const bullets: string[] = [];

  // Compare last 3 days vs prior 3 days for a softer trend.
  if (perDayMax.length >= 6) {
    const recent = perDayMax.slice(-3).map((b) => b.value);
    const earlier = perDayMax.slice(-6, -3).map((b) => b.value);
    const recentAvg = recent.reduce((s, n) => s + n, 0) / recent.length;
    const earlierAvg = earlier.reduce((s, n) => s + n, 0) / earlier.length;
    const diff = Math.round(recentAvg - earlierAvg);
    if (diff >= 10) {
      bullets.push(
        `Longest stretch grew by ${formatDuration(diff)} across the last few days — a good sign of consolidating sleep.`
      );
    } else if (diff <= -10) {
      bullets.push(
        `Longest stretch shortened by ${formatDuration(Math.abs(diff))} — varies a lot at this age, especially around regressions.`
      );
    } else {
      bullets.push(`${babyName}'s longest stretch has held steady this stretch.`);
    }
  }

  // Pinpoint the day of the overall max.
  if (overallMax > 0) {
    const top = perDayMax.find((b) => b.value === overallMax);
    if (top) {
      bullets.push(
        `Best night was ${formatDuration(overallMax)} on ${weekdayLabel(top.key)}.`
      );
    }
  }

  const interpretation: InsightInterpretation | undefined =
    bullets.length > 0 ? { bullets: bullets.slice(0, 3) } : undefined;

  return {
    id: "sleep-longest-stretch",
    title: "Longest sleep stretch",
    metric: formatDuration(overallMax),
    series,
    interpretation,
  };
}

// ---------- narrative ----------

function buildNarrative(
  cards: InsightCard[],
  events: TrackerEvent[],
  rangeStart: Date,
  rangeEnd: Date,
  babyName: string
): string | undefined {
  const days = dayBuckets(events, rangeStart, rangeEnd);
  const populatedDays = days.filter((b) => b.events.length > 0).length;
  if (populatedDays < 3) return undefined;

  const sleep = cards.find((c) => c.id === "sleep-total");
  const feeds = cards.find((c) => c.id === "feeds-per-day");
  if (!sleep?.series || !feeds?.series) return undefined;

  const sleepBuckets = sleep.series.buckets;
  if (sleepBuckets.length < 2) return undefined;
  const lastSleep = sleepBuckets[sleepBuckets.length - 1].value;
  const prevSleep = sleepBuckets[sleepBuckets.length - 2].value;
  const sleepChange = pctChange(lastSleep, prevSleep);

  // Feed gap shortening: compare avg gap of last half vs first half of range.
  const half = Math.floor(days.length / 2);
  const recentGap = avgFeedGapMinutes(
    events.filter((e) => isInRange(e, days[half]?.start ?? rangeStart, rangeEnd)),
    days[half]?.start ?? rangeStart,
    rangeEnd
  );
  const earlierGap = avgFeedGapMinutes(
    events.filter((e) => isInRange(e, rangeStart, days[half]?.start ?? rangeEnd)),
    rangeStart,
    days[half]?.start ?? rangeEnd
  );

  if (
    sleepChange !== null &&
    sleepChange < -15 &&
    recentGap !== null &&
    earlierGap !== null &&
    recentGap < earlierGap * 0.9
  ) {
    return `Sleep dipped and feeds shortened across the window — that's a classic growth-spurt window. ${babyName} is likely working through it.`;
  }

  if (sleepChange !== null && sleepChange > 15) {
    return `Sleep totals climbed nicely — good week for ${babyName}.`;
  }

  if (sleepChange !== null && sleepChange < -15) {
    return `Sleep dipped vs the prior period — varies a lot at this age, often tied to teeth, leaps, or a stretch of short naps.`;
  }

  return undefined;
}

// ---------- top-level ----------

export function defaultRangeFor(g: InsightGranularity): RangeToken {
  if (g === "day") return "7d";
  if (g === "week") return "30d";
  return "180d";
}

export function rangeWindow(range: RangeToken, end = new Date()): { start: Date; end: Date } {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 180;
  const start = new Date(end.getTime() - (days - 1) * DAY_MS);
  // Normalise start to midnight of that day so day-buckets are full.
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export function computeInsights(args: ComputeArgs): InsightsResponse {
  const { events, granularity, rangeStart, rangeEnd, babyName, babyAgeWeeks } = args;
  const inRange = events.filter((e) => isInRange(e, rangeStart, rangeEnd));

  const granularBuckets = bucketEvents(inRange, granularity, rangeStart, rangeEnd);

  const cards: InsightCard[] = [
    buildSleepTotalCard(granularBuckets, granularity, babyName, babyAgeWeeks),
    buildFeedsPerDayCard(inRange, rangeStart, rangeEnd, babyName, babyAgeWeeks),
    buildDiaperRhythmCard(inRange, rangeStart, rangeEnd, babyName, babyAgeWeeks),
    buildLongestStretchCard(inRange, rangeStart, rangeEnd, babyName),
  ];

  const narrative = buildNarrative(cards, inRange, rangeStart, rangeEnd, babyName);

  return {
    granularity,
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    cards,
    narrative,
  };
}
