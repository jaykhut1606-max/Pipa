"use client";

// Trackers hub. Three-tab pill (Track / Summary / Details). The Track tab
// is a kid-readable picker: Sleep / Diaper / Feeding cards plus a stubbed
// Voice Entry section. Summary surfaces today's totals; Details renders
// a 7-day timeline. On first mount we GET /api/tracker/event?limit=1 and,
// if empty, POST /api/tracker/seed?babyName=… so the demo is alive.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { ChevronRight, Mic } from "lucide-react";
import { TrackerIcon } from "@/components/icons/tracker-icon";
import { TimelineItem } from "@/components/primitives/timeline-item";
import { TrackerTabs, type TrackerTab } from "@/components/trackers/tracker-tabs";
import {
  dayLabel,
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

const TIMELINE_COLOR: Record<TrackerEventType, "soft-blue" | "amber" | "peach" | "sage"> = {
  sleep: "soft-blue",
  feed: "amber",
  diaper: "peach",
  note: "sage",
};

const TIMELINE_TITLE: Record<TrackerEventType, string> = {
  sleep: "Sleep",
  feed: "Feed",
  diaper: "Diaper",
  note: "Note",
};

type GroupedDay = {
  key: string;
  label: string;
  events: TrackerEvent[];
};

function groupByDay(events: TrackerEvent[]): GroupedDay[] {
  const map = new Map<string, TrackerEvent[]>();
  for (const evt of events) {
    const d = new Date(evt.occurredAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const list = map.get(key) ?? [];
    list.push(evt);
    map.set(key, list);
  }
  const out: GroupedDay[] = [];
  for (const [key, list] of map) {
    const first = new Date(list[0].occurredAt);
    out.push({ key, label: dayLabel(first), events: list });
  }
  out.sort((a, b) =>
    new Date(b.events[0].occurredAt).getTime() -
    new Date(a.events[0].occurredAt).getTime()
  );
  return out;
}

export default function TrackersHubPage() {
  const [tab, setTab] = useState<TrackerTab>("track");
  const [babyName, setBabyName] = useState<string | null>(null);
  const [events, setEvents] = useState<TrackerEvent[] | null>(null);
  const [todayEvents, setTodayEvents] = useState<TrackerEvent[] | null>(null);

  // Read profile after mount so SSR/CSR markup matches.
  useEffect(() => {
    const profile = readProfile();
    if (typeof profile.name === "string" && profile.name.length > 0) {
      setBabyName(profile.name);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const todayStart = startOfDay().toISOString();

    try {
      const [allRes, todayRes] = await Promise.all([
        fetch(`/api/tracker/event?since=${encodeURIComponent(since)}&limit=200`),
        fetch(`/api/tracker/event?since=${encodeURIComponent(todayStart)}&limit=200`),
      ]);
      const allData = (await allRes.json()) as { events: TrackerEvent[] };
      const todayData = (await todayRes.json()) as { events: TrackerEvent[] };
      setEvents(allData.events ?? []);
      setTodayEvents(todayData.events ?? []);
      return allData.events ?? [];
    } catch {
      setEvents([]);
      setTodayEvents([]);
      return [];
    }
  }, []);

  // First-mount: ensure demo data exists, then load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const probe = await fetch("/api/tracker/event?limit=1");
        const probeData = (await probe.json()) as { events: TrackerEvent[] };
        if (cancelled) return;
        if ((probeData.events ?? []).length === 0) {
          const seedName =
            (typeof window !== "undefined"
              ? readProfile().name
              : undefined) || "Baby";
          await fetch(
            `/api/tracker/seed?babyName=${encodeURIComponent(seedName)}`,
            { method: "POST" }
          );
        }
        if (!cancelled) await fetchAll();
      } catch {
        // Network hiccup — render empty state silently.
        if (!cancelled) {
          setEvents([]);
          setTodayEvents([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  const summary = useMemo(() => {
    const list = todayEvents ?? [];
    let sleepMinutes = 0;
    let feeds = 0;
    let diapers = 0;
    for (const e of list) {
      if (e.eventType === "sleep") sleepMinutes += e.durationMinutes ?? 0;
      if (e.eventType === "feed") feeds += 1;
      if (e.eventType === "diaper") diapers += 1;
    }
    return { sleepMinutes, feeds, diapers };
  }, [todayEvents]);

  const grouped = useMemo(() => groupByDay(events ?? []), [events]);

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

              <section className="flex flex-col gap-3">
                <h2 className="font-display text-h2 text-ink">Voice Entry</h2>
                <div className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-6 flex flex-col items-center gap-4 text-center">
                  <div className="relative size-44 grid place-items-center">
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-pill bg-vivid-peach-soft motion-safe:animate-[listenPulse_2.2s_ease-out_infinite]"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-4 rounded-pill bg-peach-soft motion-safe:animate-[listenPulse_2.2s_ease-out_infinite]"
                      style={{ animationDelay: "0.6s" }}
                    />
                    <span className="relative size-20 rounded-pill bg-peach grid place-items-center shadow-[var(--shadow-pop)]">
                      <Mic
                        className="size-8 text-cream"
                        strokeWidth={2.2}
                        aria-hidden
                      />
                    </span>
                  </div>
                  <p className="text-small text-stone max-w-xs">
                    Voice entry coming soon — for now, tap a card above.
                  </p>
                </div>
              </section>
            </motion.div>
          )}

          {tab === "summary" && (
            <motion.div
              key="summary"
              variants={fadePanel}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex flex-col gap-5"
            >
              <SummaryRow
                loading={todayEvents === null}
                sleepMinutes={summary.sleepMinutes}
                feeds={summary.feeds}
                diapers={summary.diapers}
              />
              <Link
                href="/trackers/insights"
                className="self-start text-small text-plum font-medium hover:underline"
              >
                See full insights →
              </Link>
            </motion.div>
          )}

          {tab === "details" && (
            <motion.div
              key="details"
              variants={fadePanel}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex flex-col gap-6"
            >
              {events === null && (
                <p className="text-small text-stone">Loading recent activity…</p>
              )}
              {events && events.length === 0 && (
                <p className="text-small text-stone">
                  Nothing logged yet. Tap a card on the Track tab to start.
                </p>
              )}
              {grouped.map((group) => (
                <section key={group.key} className="flex flex-col gap-3">
                  <h3 className="text-micro uppercase tracking-wider text-stone">
                    {group.label}
                  </h3>
                  <div className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-5">
                    <ul className="flex flex-col">
                      {group.events.map((evt, i) => (
                        <li key={evt.id}>
                          <TimelineItem
                            color={TIMELINE_COLOR[evt.eventType]}
                            title={`${TIMELINE_TITLE[evt.eventType]} · ${eventOneLiner(evt)}`}
                            subtitle={formatTime(evt.occurredAt)}
                            isLast={i === group.events.length - 1}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function SummaryRow({
  loading,
  sleepMinutes,
  feeds,
  diapers,
}: {
  loading: boolean;
  sleepMinutes: number;
  feeds: number;
  diapers: number;
}) {
  const cards: { label: string; value: string; tone: string; iconBg: string; variant: "sleep" | "feed" | "diaper" }[] = [
    {
      label: "Slept today",
      value: sleepMinutes > 0 ? formatDuration(sleepMinutes) : "0h 0m",
      tone: "bg-soft-blue-soft",
      iconBg: "bg-soft-blue-soft",
      variant: "sleep",
    },
    {
      label: "Feeds today",
      value: `${feeds}`,
      tone: "bg-amber-soft",
      iconBg: "bg-amber-soft",
      variant: "feed",
    },
    {
      label: "Diapers today",
      value: `${diapers}`,
      tone: "bg-peach-soft",
      iconBg: "bg-peach-soft",
      variant: "diaper",
    },
  ];

  return (
    <div className="-mx-6 px-6 overflow-x-auto">
      <ul className="flex gap-3 snap-x snap-mandatory pb-1">
        {cards.map((card) => (
          <li
            key={card.label}
            className={cn(
              "snap-start shrink-0 w-[180px] rounded-2xl shadow-[var(--shadow-soft)] p-4 flex flex-col gap-3",
              card.tone
            )}
          >
            <TrackerIcon variant={card.variant} size={48} />
            <div className="flex flex-col gap-0.5">
              <p className="text-small text-ink/80">{card.label}</p>
              <p className="font-display text-h2 text-ink">
                {loading ? "—" : card.value}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

