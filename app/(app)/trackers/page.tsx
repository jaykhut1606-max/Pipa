"use client";

// Trackers hub. Three sub-tabs:
//   Track   — quick-pick rows (Sleep/Diaper/Feeding) + Voice Entry.
//   Summary — week heatmap (hours × days) with All/Sleep/Diaper/Feed chips.
//   Details — today/week/month stat cards + entry list.
//
// No auto-seeding: every parent starts at zero. Empty timeline is the
// honest, encouraging state — it gets populated as they log entries
// (manually via /trackers/{type}/log or by voice via the mic card).
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { TrackerIcon } from "@/components/icons/tracker-icon";
import {
  TrackerTabs,
  type TrackerTab,
} from "@/components/trackers/tracker-tabs";
import { VoiceEntry } from "@/components/trackers/voice-entry";
import { VoiceTips } from "@/components/trackers/voice-tips";
import {
  eventOneLiner,
  formatDuration,
  formatTime,
  startOfDay,
} from "@/components/trackers/event-format";
import { readProfile } from "@/components/onboarding/profile-store";
import type { TrackerEvent, TrackerEventType } from "@/lib/types";
import { cn } from "@/lib/utils";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT_EXPO },
  },
};

const fadePanel: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.18, ease: EASE_OUT_EXPO },
  },
};

type CardSpec = {
  href: string;
  title: string;
  subtitle: string;
  variant: "sleep" | "diaper" | "feed";
};

const CARDS: CardSpec[] = [
  {
    href: "/trackers/sleep/log",
    title: "Sleep",
    subtitle: "Log a nap or night sleep",
    variant: "sleep",
  },
  {
    href: "/trackers/diaper/log",
    title: "Diaper",
    subtitle: "Wet, dirty, or both",
    variant: "diaper",
  },
  {
    href: "/trackers/feed/log",
    title: "Feeding",
    subtitle: "Breast, bottle, or solids",
    variant: "feed",
  },
];

const TYPE_BLOCK_COLOR: Record<TrackerEventType, string> = {
  sleep: "bg-amber",
  diaper: "bg-clay",
  feed: "bg-soft-blue",
  note: "bg-sage",
};

const EVENT_TITLE: Record<TrackerEventType, string> = {
  sleep: "Sleeping",
  diaper: "Diaper",
  feed: "Feeding",
  note: "Note",
};

export default function TrackersHubPage() {
  // useSearchParams suspends during prerender — wrap the inner client
  // page that reads it so static export still works.
  return (
    <Suspense fallback={<TrackersHubInner loggedKey="" />}>
      <TrackersHubWithSearch />
    </Suspense>
  );
}

function TrackersHubWithSearch() {
  const searchParams = useSearchParams();
  // /trackers/{type}/log and the voice flow push back here with
  // ?logged=<timestamp> so this page knows to refetch instead of
  // serving the prior render's stale events state.
  const loggedKey = searchParams.get("logged") ?? "";
  return <TrackersHubInner loggedKey={loggedKey} />;
}

function TrackersHubInner({ loggedKey }: { loggedKey: string }) {
  const [tab, setTab] = useState<TrackerTab>("track");
  const [babyName, setBabyName] = useState<string | null>(null);
  const [events, setEvents] = useState<TrackerEvent[] | null>(null);
  // The id of the most-recently-saved event, used to flash a glow ring
  // on the corresponding row in the Details tab so the parent has zero
  // ambiguity about what just landed. Cleared after the highlight runs.
  const [newEventId, setNewEventId] = useState<string | null>(null);

  useEffect(() => {
    const profile = readProfile();
    if (typeof profile.name === "string" && profile.name.length > 0) {
      setBabyName(profile.name);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    // Last 14 days is enough for the Day/Week/Month tabs. 200 cap keeps
    // the JSON small and the Details list snappy without virtualization.
    const since = new Date(Date.now() - 14 * 86_400_000).toISOString();
    try {
      // cache: 'no-store' belt-and-braces with the no-store header on
      // the API — the user expects logs to show up the instant they save.
      const res = await fetch(
        `/api/tracker/event?since=${encodeURIComponent(since)}&limit=200`,
        { cache: "no-store" },
      );
      const data = (await res.json()) as { events: TrackerEvent[] };
      setEvents(data.events ?? []);
      return data.events ?? [];
    } catch {
      setEvents([]);
      return [];
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchAll();
    })();
    return () => {
      cancelled = true;
    };
    // loggedKey changes whenever a manual log redirects back here with
    // ?logged=<ts>; depending on it forces this effect to re-run and
    // pull the freshly-saved event into Summary + Details.
  }, [fetchAll, loggedKey]);

  // Refetch when the parent comes back to this tab — same pattern as
  // /home and /today. Catches the case where they log on /scan/cry
  // (which auto-routes to /result) then come back to /trackers.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") void fetchAll();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [fetchAll]);

  const greeting = babyName ? `Hi, ${babyName}'s parent` : "Hi there";

  return (
    <main className="flex-1 bg-cream pb-32">
      <div className="container-app pt-8 flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-small text-stone">{greeting}</p>
          <h1 className="font-display text-h1 text-ink">
            Keep track of daily routines
          </h1>
        </header>

        <TrackerTabs value={tab} onChange={setTab} />

        <AnimatePresence mode="wait" initial={false}>
          {tab === "track" && (
            <motion.div
              key="track"
              variants={fadePanel}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex flex-col gap-8"
            >
              <motion.ul
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-3"
              >
                {CARDS.map((card) => (
                  <motion.li key={card.href} variants={itemVariants}>
                    <Link
                      href={card.href}
                      className="group flex items-center gap-4 rounded-2xl bg-cream px-4 py-4 shadow-[var(--shadow-soft)] hover:bg-bone/30 transition-colors"
                    >
                      <TrackerIcon variant={card.variant} size={56} />
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <p className="font-display text-h3 text-plum">
                          {card.title}
                        </p>
                        <p className="text-small text-stone">{card.subtitle}</p>
                      </div>
                      <ChevronRight
                        className="size-5 text-stone shrink-0 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>

              <VoiceEntry
                onLogged={async (data) => {
                  await fetchAll();
                  if (data?.event?.id) {
                    setNewEventId(data.event.id);
                    // Clear the highlight after a few seconds so it
                    // doesn't keep glowing forever.
                    window.setTimeout(() => setNewEventId(null), 3500);
                  }
                  // Let the user see the green-check + summary, then jump
                  // to Details where their new entry sits at the top
                  // with a soft glow ring.
                  setTimeout(() => setTab("details"), 1200);
                }}
              />
              <VoiceTips />
            </motion.div>
          )}

          {tab === "summary" && (
            <motion.div
              key="summary"
              variants={fadePanel}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <SummaryView events={events} />
            </motion.div>
          )}

          {tab === "details" && (
            <motion.div
              key="details"
              variants={fadePanel}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <DetailsView events={events} highlightId={newEventId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

// --- Summary --------------------------------------------------------------

type FilterKey = "all" | "sleep" | "diaper" | "feed";

const FILTER_OPTIONS: { key: FilterKey; label: string; chip: string }[] = [
  { key: "all", label: "All", chip: "bg-sage" },
  { key: "sleep", label: "Sleep", chip: "bg-amber" },
  { key: "diaper", label: "Diaper", chip: "bg-clay" },
  { key: "feed", label: "Feed", chip: "bg-soft-blue" },
];

function SummaryView({ events }: { events: TrackerEvent[] | null }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => {
    const today = startOfDay();
    const dow = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dow + weekOffset * 7);
    return monday;
  }, [weekOffset]);

  const weekEnd = useMemo(() => {
    const e = new Date(weekStart);
    e.setDate(weekStart.getDate() + 7);
    return e;
  }, [weekStart]);

  const filtered = useMemo(() => {
    if (!events) return null;
    return events.filter((e) => {
      const t = new Date(e.occurredAt);
      if (t < weekStart || t >= weekEnd) return false;
      if (filter === "all") return true;
      return e.eventType === filter;
    });
  }, [events, filter, weekStart, weekEnd]);

  return (
    <div className="flex flex-col gap-5">
      <ul
        role="tablist"
        aria-label="Filter events"
        className="flex gap-2 overflow-x-auto -mx-6 px-6 pb-1"
      >
        {FILTER_OPTIONS.map((f) => {
          const isActive = filter === f.key;
          return (
            <li key={f.key}>
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "h-11 px-4 rounded-pill border text-small font-medium inline-flex items-center gap-2 whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-cream border-plum text-ink shadow-[var(--shadow-soft)]"
                    : "bg-cream border-bone text-stone hover:text-ink"
                )}
              >
                <span
                  className={cn("size-2 rounded-pill", f.chip)}
                  aria-hidden
                />
                {f.label}
              </button>
            </li>
          );
        })}
      </ul>

      <section className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-5">
        <header className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setWeekOffset((n) => n - 1)}
            aria-label="Previous week"
            className="size-9 rounded-pill grid place-items-center text-stone hover:text-ink hover:bg-bone/40"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <p className="font-display text-h3 text-ink">
            {formatRange(weekStart, weekEnd)}
          </p>
          <button
            type="button"
            onClick={() => setWeekOffset((n) => Math.min(0, n + 1))}
            aria-label="Next week"
            disabled={weekOffset >= 0}
            className="size-9 rounded-pill grid place-items-center text-stone hover:text-ink hover:bg-bone/40 disabled:opacity-40"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </header>
        <Heatmap weekStart={weekStart} events={filtered} />
      </section>

      <Link
        href="/trackers/insights"
        className="self-center text-small text-plum font-medium hover:underline"
      >
        See full insights →
      </Link>
    </div>
  );
}

const HOUR_ROWS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Heatmap({
  weekStart,
  events,
}: {
  weekStart: Date;
  events: TrackerEvent[] | null;
}) {
  const cells = useMemo(() => {
    const out = new Map<string, TrackerEventType>();
    for (const e of events ?? []) {
      const t = new Date(e.occurredAt);
      const dayIndex = Math.floor(
        (startOfDay(t).getTime() - weekStart.getTime()) / 86_400_000
      );
      if (dayIndex < 0 || dayIndex > 6) continue;
      const rowIndex = Math.floor(t.getHours() / 2);
      out.set(`${rowIndex}:${dayIndex}`, e.eventType);
    }
    return out;
  }, [events, weekStart]);

  const today = startOfDay();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return (
    <div className="grid grid-cols-[44px_1fr] gap-x-2">
      <ul className="flex flex-col">
        {HOUR_ROWS.map((h) => (
          <li
            key={h}
            className="h-7 text-micro tracking-wider text-stone leading-none flex items-center"
          >
            {formatHour(h)}
          </li>
        ))}
        <li className="h-7 text-micro tracking-wider text-stone leading-none flex items-center">
          12 AM
        </li>
      </ul>
      <div>
        <div className="grid grid-cols-7 gap-px bg-bone/40 rounded-md overflow-hidden">
          {Array.from({ length: 7 * 12 }, (_, i) => {
            const rowIndex = Math.floor(i / 7);
            const dayIndex = i % 7;
            const type = cells.get(`${rowIndex}:${dayIndex}`);
            return (
              <span
                key={i}
                className={cn("h-7 bg-cream", type && TYPE_BLOCK_COLOR[type])}
                aria-hidden
              />
            );
          })}
        </div>
        <ul className="grid grid-cols-7 mt-2">
          {dates.map((d, i) => {
            const isToday =
              startOfDay(d).getTime() === today.getTime();
            return (
              <li key={i} className="text-center">
                <p
                  className={cn(
                    "text-micro tracking-wider",
                    isToday ? "text-plum font-medium" : "text-stone"
                  )}
                >
                  {DAY_SHORT[i]}
                </p>
                <p
                  className={cn(
                    "text-small",
                    isToday ? "text-plum font-medium" : "text-ink"
                  )}
                >
                  {d.getDate()}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}

function formatRange(start: Date, endExclusive: Date): string {
  const last = new Date(endExclusive.getTime() - 86_400_000);
  const sameMonth = start.getMonth() === last.getMonth();
  const month = start.toLocaleDateString(undefined, { month: "long" });
  if (sameMonth) {
    return `${month} ${start.getDate()}-${last.getDate()}, ${last.getFullYear()}`;
  }
  const a = start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const b = last.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return `${a} – ${b}, ${last.getFullYear()}`;
}

// --- Details --------------------------------------------------------------

type Granularity = "daily" | "weekly" | "monthly";

const GRANULARITY: { key: Granularity; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

function DetailsView({
  events,
  highlightId,
}: {
  events: TrackerEvent[] | null;
  highlightId?: string | null;
}) {
  const [granularity, setGranularity] = useState<Granularity>("daily");

  const range = useMemo(() => rangeFor(granularity), [granularity]);

  const inRange = useMemo(() => {
    if (!events) return null;
    return events.filter((e) => {
      const t = new Date(e.occurredAt);
      return t >= range.start && t < range.end;
    });
  }, [events, range]);

  const stats = useMemo(() => {
    const days = Math.max(1, daysBetween(range.start, range.end));
    let sleepMins = 0;
    let diapers = 0;
    let feeds = 0;
    for (const e of inRange ?? []) {
      if (e.eventType === "sleep") sleepMins += e.durationMinutes ?? 0;
      if (e.eventType === "diaper") diapers += 1;
      if (e.eventType === "feed") feeds += 1;
    }
    return {
      sleepHrPerDay: sleepMins / 60 / days,
      diapersPerDay: diapers / days,
      feedsPerDay: feeds / days,
    };
  }, [inRange, range]);

  const sortedEntries = useMemo(() => {
    return [...(inRange ?? [])].sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
  }, [inRange]);

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl bg-bone/40 px-4 pt-5 pb-4 flex flex-col gap-4 items-center">
        <p className="font-display text-h3 text-ink">{rangeLabel(range)}</p>
        <ul className="grid grid-cols-3 gap-3 w-full">
          <StatCard
            variant="sleep"
            value={`${stats.sleepHrPerDay.toFixed(1)}h/d`}
          />
          <StatCard
            variant="diaper"
            value={`${stats.diapersPerDay.toFixed(1)}x/d`}
          />
          <StatCard
            variant="feed"
            value={`${stats.feedsPerDay.toFixed(1)}x/d`}
          />
        </ul>
        <div
          role="tablist"
          aria-label="Granularity"
          className="grid grid-cols-3 w-full"
        >
          {GRANULARITY.map((g) => {
            const isActive = g.key === granularity;
            return (
              <button
                key={g.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setGranularity(g.key)}
                className={cn(
                  "h-10 rounded-pill text-small font-medium transition-colors",
                  isActive
                    ? "bg-plum text-cream shadow-[var(--shadow-soft)]"
                    : "text-stone hover:text-ink"
                )}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </section>

      <ul className="flex flex-col gap-3">
        {events === null && (
          <li className="text-small text-stone text-center py-6">Loading…</li>
        )}
        {events !== null && sortedEntries.length === 0 && (
          <li className="text-small text-stone text-center py-6">
            Nothing logged in this window yet.
          </li>
        )}
        {sortedEntries.map((evt) => (
          <li key={evt.id}>
            <EntryRow event={evt} highlight={evt.id === highlightId} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatCard({
  variant,
  value,
}: {
  variant: "sleep" | "diaper" | "feed";
  value: string;
}) {
  const pillTone =
    variant === "sleep"
      ? "bg-amber-soft"
      : variant === "diaper"
        ? "bg-clay-soft"
        : "bg-soft-blue-soft";
  return (
    <li className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-3 flex flex-col gap-2 relative">
      <TrackerIcon variant={variant} size={32} />
      <span
        className={cn(
          "self-start rounded-pill px-2.5 py-0.5 text-small font-medium text-ink",
          pillTone
        )}
      >
        {value}
      </span>
      <Maximize2
        className="absolute top-2 right-2 size-3.5 text-stone"
        aria-hidden
      />
    </li>
  );
}

function EntryRow({
  event,
  highlight = false,
}: {
  event: TrackerEvent;
  highlight?: boolean;
}) {
  const dateText = new Date(event.occurredAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const time = formatTime(event.occurredAt);
  const duration = event.durationMinutes
    ? formatDuration(event.durationMinutes)
    : null;
  const detail = eventOneLiner(event);
  return (
    <article
      className={cn(
        "relative rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-4 flex items-center gap-4 transition-shadow",
        highlight &&
          "ring-2 ring-vivid-peach ring-offset-2 ring-offset-cream motion-safe:animate-[entryGlow_2.4s_ease-out_1]",
      )}
    >
      {highlight && (
        <span
          aria-hidden
          className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-pill bg-vivid-peach text-cream px-2.5 py-0.5 text-micro uppercase tracking-wider font-semibold shadow-[var(--shadow-soft)]"
        >
          Just logged
        </span>
      )}
      <TrackerIcon variant={event.eventType} size={48} />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <p className="font-display text-h3 text-plum truncate">
          {EVENT_TITLE[event.eventType]}
        </p>
        <p className="text-small text-stone truncate">
          {dateText} · {time}
          {detail ? ` · ${detail}` : ""}
        </p>
      </div>
      {duration && (
        <p className="text-small text-stone shrink-0">{duration}</p>
      )}
    </article>
  );
}

function rangeFor(g: Granularity): { start: Date; end: Date } {
  const today = startOfDay();
  if (g === "daily") {
    const end = new Date(today);
    end.setDate(today.getDate() + 1);
    return { start: today, end };
  }
  if (g === "weekly") {
    const dow = (today.getDay() + 6) % 7;
    const start = new Date(today);
    start.setDate(today.getDate() - dow);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return { start, end };
}

function rangeLabel(r: { start: Date; end: Date }): string {
  const last = new Date(r.end.getTime() - 1);
  const sameDay =
    r.start.getFullYear() === last.getFullYear() &&
    r.start.getMonth() === last.getMonth() &&
    r.start.getDate() === last.getDate();
  if (sameDay) {
    return r.start.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }
  const sameMonth = r.start.getMonth() === last.getMonth();
  if (sameMonth) {
    const month = r.start.toLocaleDateString(undefined, { month: "long" });
    return `${month} ${r.start.getDate()}–${last.getDate()}, ${last.getFullYear()}`;
  }
  const a = r.start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const b = last.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return `${a} – ${b}, ${last.getFullYear()}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}
