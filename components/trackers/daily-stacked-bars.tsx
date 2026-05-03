"use client";

// Replaces the dense hour×day heatmap with a per-day stacked-bar view:
// for each day in the week, a vertical stack of feed minutes, sleep
// hours (scaled), and diaper-event height. Reads at-a-glance, scales
// to phone widths, and animates in on render.
import { useMemo } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { startOfDay } from "@/components/trackers/event-format";
import type { TrackerEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Tone = "sleep" | "feed" | "diaper";

// Each bar segment is (minutes for time-based) or (count × 30 for
// counts) so all three render on the same y-axis without dwarfing each
// other. Sleep dominates if you don't normalize.
const COLOR: Record<Tone, string> = {
  sleep: "bg-amber",
  feed: "bg-soft-blue",
  diaper: "bg-clay",
};

const SOFT: Record<Tone, string> = {
  sleep: "bg-amber-soft",
  feed: "bg-soft-blue-soft",
  diaper: "bg-clay-soft",
};

const LABEL: Record<Tone, string> = {
  sleep: "Sleep",
  feed: "Feed",
  diaper: "Diaper",
};

type DayCol = {
  date: Date;
  sleepMin: number;
  feedCount: number;
  diaperCount: number;
};

type Props = {
  weekStart: Date;
  events: TrackerEvent[] | null;
  filter: "all" | "sleep" | "diaper" | "feed";
};

export function DailyStackedBars({ weekStart, events, filter }: Props) {
  const reduce = useReducedMotion();

  const cols = useMemo<DayCol[] | null>(() => {
    if (!events) return null;
    const out: DayCol[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      out.push({
        date: d,
        sleepMin: 0,
        feedCount: 0,
        diaperCount: 0,
      });
    }
    for (const e of events) {
      const t = new Date(e.occurredAt);
      const idx = Math.floor(
        (startOfDay(t).getTime() - weekStart.getTime()) / 86_400_000,
      );
      if (idx < 0 || idx > 6) continue;
      const col = out[idx];
      if (e.eventType === "sleep") col.sleepMin += e.durationMinutes ?? 0;
      else if (e.eventType === "feed") col.feedCount += 1;
      else if (e.eventType === "diaper") col.diaperCount += 1;
    }
    return out;
  }, [events, weekStart]);

  // Normalize so a typical day (~14h sleep + 7 feeds + 8 diapers) fills
  // most of the bar. We translate counts into "minutes-equivalent"
  // weights for visual parity.
  const FEED_WEIGHT = 30; // each feed counts as 30 min visually
  const DIAPER_WEIGHT = 18; // each diaper as 18 min visually

  const max = useMemo(() => {
    if (!cols) return 1;
    let m = 0;
    for (const c of cols) {
      const total =
        (filter === "all" || filter === "sleep" ? c.sleepMin : 0) +
        (filter === "all" || filter === "feed" ? c.feedCount * FEED_WEIGHT : 0) +
        (filter === "all" || filter === "diaper" ? c.diaperCount * DIAPER_WEIGHT : 0);
      if (total > m) m = total;
    }
    // Floor so empty days still show a baseline rail.
    return Math.max(m, 600); // 10h-equivalent baseline
  }, [cols, filter]);

  const today = startOfDay();

  const containerV: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
  };
  const colV: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Legend */}
      <ul className="flex items-center gap-4 text-micro tracking-wider text-stone">
        {(["sleep", "feed", "diaper"] as const).map((tone) => (
          <li
            key={tone}
            className={cn(
              "inline-flex items-center gap-1.5 transition-opacity",
              filter !== "all" && filter !== tone && "opacity-30",
            )}
          >
            <span className={cn("size-2 rounded-pill", COLOR[tone])} />
            {LABEL[tone]}
          </li>
        ))}
      </ul>

      {cols === null ? (
        <p className="text-small text-stone py-12 text-center">Loading…</p>
      ) : (
        <motion.div
          variants={containerV}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="grid grid-cols-7 gap-1.5 items-end"
        >
          {cols.map((c, i) => {
            const isToday = startOfDay(c.date).getTime() === today.getTime();
            const showSleep = filter === "all" || filter === "sleep";
            const showFeed = filter === "all" || filter === "feed";
            const showDiaper = filter === "all" || filter === "diaper";

            const sleepH = showSleep ? c.sleepMin : 0;
            const feedH = showFeed ? c.feedCount * FEED_WEIGHT : 0;
            const diaperH = showDiaper ? c.diaperCount * DIAPER_WEIGHT : 0;
            const total = sleepH + feedH + diaperH;
            const pct = (n: number) => (n / max) * 100;

            return (
              <motion.div
                key={i}
                variants={colV}
                className="flex flex-col items-center gap-2"
              >
                {/* Bar */}
                <div className="relative w-full h-32 rounded-md bg-bone/40 overflow-hidden flex flex-col-reverse">
                  {sleepH > 0 && (
                    <span
                      className={cn("w-full", SOFT.sleep)}
                      style={{ height: `${pct(sleepH)}%` }}
                    >
                      <span
                        className={cn(
                          "block w-full h-full",
                          showSleep ? COLOR.sleep : SOFT.sleep,
                          "opacity-90",
                        )}
                      />
                    </span>
                  )}
                  {feedH > 0 && (
                    <span
                      className={cn("w-full", COLOR.feed, "opacity-95")}
                      style={{ height: `${pct(feedH)}%` }}
                    />
                  )}
                  {diaperH > 0 && (
                    <span
                      className={cn("w-full", COLOR.diaper, "opacity-95")}
                      style={{ height: `${pct(diaperH)}%` }}
                    />
                  )}
                  {total === 0 && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-bone" aria-hidden />
                  )}
                </div>
                {/* Day label */}
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "text-micro tracking-wider",
                      isToday ? "text-plum font-semibold" : "text-stone",
                    )}
                  >
                    {DAY_SHORT[i]}
                  </span>
                  <span
                    className={cn(
                      "text-small leading-none mt-0.5",
                      isToday ? "text-plum font-semibold" : "text-ink",
                    )}
                  >
                    {c.date.getDate()}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
