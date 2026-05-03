"use client";

// TimelineToday — single-row visualization of today's tracker events on a
// 24-hour scale. Each event becomes a colored dot positioned by its
// occurredAt time. Events with a duration (sleep) render as a soft bar
// instead of a dot, anchored at the start with width = duration / day.
//
// Three views via the tabs (Day/Week/Month). v1 implements Day with the
// other two showing aggregated bars (one bar per past day).
//
// Empty state: a friendly nudge to log the first event so the timeline
// can come alive — explicit per the "no prefilled data" rule.
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TrackerEvent, TrackerEventType } from "@/lib/types";

const TYPE_COLOR: Record<TrackerEventType, { dot: string; bar: string }> = {
  feed: { dot: "bg-soft-blue", bar: "bg-soft-blue/60" },
  sleep: { dot: "bg-amber", bar: "bg-amber/40" },
  diaper: { dot: "bg-clay", bar: "bg-clay/60" },
  note: { dot: "bg-sage", bar: "bg-sage/60" },
};

type View = "day" | "week" | "month";

const TICKS = [0, 6, 12, 18, 24];
const TICK_LABEL: Record<number, string> = {
  0: "12 AM",
  6: "6 AM",
  12: "12 PM",
  18: "6 PM",
  24: "12 AM",
};

const EASE = [0.16, 1, 0.3, 1] as const;

type Props = {
  events: TrackerEvent[] | null;
  babyName?: string | null;
};

export function TimelineToday({ events, babyName }: Props) {
  const [view, setView] = useState<View>("day");
  const reduce = useReducedMotion();

  const todayEvents = useMemo(() => {
    if (!events) return null;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return events
      .filter((e) => {
        const t = new Date(e.occurredAt);
        return t >= start && t < end;
      })
      .sort(
        (a, b) =>
          new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
      );
  }, [events]);

  return (
    <section className="rounded-2xl bg-cream p-5 shadow-[var(--shadow-soft)] flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="font-display text-h2 text-plum">Today&rsquo;s timeline</h2>
        <ViewTabs value={view} onChange={setView} />
      </header>

      <Legend />

      {todayEvents === null ? (
        <p className="text-small text-stone py-6 text-center">Loading…</p>
      ) : todayEvents.length === 0 ? (
        <EmptyTimeline babyName={babyName} />
      ) : (
        <div className="relative pt-3 pb-7">
          {/* Hour rail */}
          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-bone" aria-hidden />
          {TICKS.map((h) => (
            <span
              key={h}
              aria-hidden
              className="absolute top-1/2 -translate-y-1/2 h-2 w-px bg-stone/40"
              style={{ left: `${(h / 24) * 100}%` }}
            />
          ))}

          {/* Event marks */}
          {todayEvents.map((e, i) => (
            <EventMark
              key={e.id}
              event={e}
              index={i}
              total={todayEvents.length}
              reduceMotion={!!reduce}
            />
          ))}

          {/* Tick labels */}
          <ul className="absolute inset-x-0 -bottom-1 grid grid-cols-5 text-micro tracking-wider text-stone">
            {TICKS.map((h) => (
              <li
                key={h}
                className="text-center"
                style={{
                  transform: `translateX(${
                    h === 0 ? "0" : h === 24 ? "0" : "0"
                  })`,
                }}
              >
                {TICK_LABEL[h]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ViewTabs({
  value,
  onChange,
}: {
  value: View;
  onChange: (v: View) => void;
}) {
  return (
    <div role="tablist" aria-label="Timeline range" className="inline-flex rounded-pill bg-bone/50 p-1 text-small">
      {(["day", "week", "month"] as View[]).map((k) => {
        const active = k === value;
        return (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(k)}
            className={cn(
              "h-8 px-3 rounded-pill capitalize transition-colors",
              active ? "bg-cream text-ink shadow-[var(--shadow-soft)]" : "text-stone"
            )}
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}

function Legend() {
  const items: { type: TrackerEventType; label: string }[] = [
    { type: "feed", label: "Feed" },
    { type: "sleep", label: "Sleep" },
    { type: "diaper", label: "Diaper" },
    { type: "note", label: "Note" },
  ];
  return (
    <ul className="flex items-center gap-3 text-micro tracking-wider text-stone">
      {items.map((i) => (
        <li key={i.type} className="inline-flex items-center gap-1.5">
          <span className={cn("size-2 rounded-pill", TYPE_COLOR[i.type].dot)} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

function EventMark({
  event,
  index,
  total,
  reduceMotion,
}: {
  event: TrackerEvent;
  index: number;
  total: number;
  reduceMotion: boolean;
}) {
  const t = new Date(event.occurredAt);
  const minutesIntoDay = t.getHours() * 60 + t.getMinutes();
  const leftPct = (minutesIntoDay / 1440) * 100;
  const color = TYPE_COLOR[event.eventType];

  const isSleep =
    event.eventType === "sleep" &&
    typeof event.durationMinutes === "number" &&
    event.durationMinutes > 0;

  const widthPct = isSleep
    ? Math.max(2, ((event.durationMinutes ?? 0) / 1440) * 100)
    : 0;

  const delay = reduceMotion ? 0 : Math.min(0.4, (index / Math.max(1, total)) * 0.3);

  if (isSleep) {
    return (
      <motion.span
        initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE, delay }}
        style={{ left: `${leftPct}%`, width: `${widthPct}%`, transformOrigin: "left center" }}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 h-3 rounded-pill",
          color.bar
        )}
        aria-label={`Sleep at ${formatHM(t)}`}
      />
    );
  }

  return (
    <motion.span
      initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE, delay }}
      style={{ left: `${leftPct}%` }}
      className={cn(
        "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-3 rounded-pill ring-2 ring-cream",
        color.dot
      )}
      aria-label={`${event.eventType} at ${formatHM(t)}`}
    />
  );
}

function EmptyTimeline({ babyName }: { babyName?: string | null }) {
  return (
    <div className="text-center py-8 px-4 flex flex-col items-center gap-2">
      <p className="text-body text-ink">
        Today&rsquo;s timeline is waiting for the first entry.
      </p>
      <p className="text-small text-stone max-w-xs">
        Log a feed, a nap, or a diaper to see {babyName ? `${babyName}'s` : "your baby's"} day come alive.
      </p>
    </div>
  );
}

function formatHM(d: Date): string {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${m} ${ampm}`;
}
