"use client";

// Insights page — visualizes the demo store's sleep / diaper / feed history.
// The page is a thin shell: it owns the granularity state, fetches from
// /api/tracker/insights when that changes, and renders one card per
// InsightCard returned by the API. The chart components in
// components/charts handle all the SVG work; this file is mostly about
// orchestration, animation, and the loading/error/empty states.
import { useCallback, useEffect, useMemo, useState } from "react";
import { differenceInWeeks, format, parseISO } from "date-fns";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from "lucide-react";
import { NavBar } from "@/components/primitives/nav-bar";
import { Character } from "@/components/primitives/character";
import { PrimaryCTA } from "@/components/primitives/primary-cta";
import { StatusPill } from "@/components/primitives/status-pill";
import { TrackerIcon } from "@/components/icons/tracker-icon";
import { GranularityToggle } from "@/components/charts/granularity-toggle";
import { BarChart } from "@/components/charts/bar-chart";
import { Sparkline } from "@/components/charts/sparkline";
import { readProfile } from "@/components/onboarding/profile-store";
import type {
  InsightCard,
  InsightGranularity,
  InsightsResponse,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type FetchState =
  | { status: "loading" }
  | { status: "ready"; data: InsightsResponse }
  | { status: "error"; message: string };

const RANGE_DAYS: Record<InsightGranularity, number> = {
  day: 7,
  week: 30,
  month: 180,
};

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE_OUT_EXPO },
  },
};

export default function InsightsPage() {
  const [granularity, setGranularity] = useState<InsightGranularity>("week");
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [profile, setProfile] = useState<{
    name?: string;
    birthDate?: string;
  }>({});

  // Read the demo profile once on mount so the page knows the baby's name and
  // approximate age. localStorage is only available client-side.
  useEffect(() => {
    const p = readProfile();
    setProfile({ name: p.name, birthDate: p.birthDate });
  }, []);

  const babyName = profile.name?.trim() || "Baby";
  const babyAgeWeeks = useMemo(() => {
    if (!profile.birthDate) return undefined;
    try {
      return differenceInWeeks(new Date(), new Date(profile.birthDate));
    } catch {
      return undefined;
    }
  }, [profile.birthDate]);

  const fetchInsights = useCallback(
    async (signal?: AbortSignal) => {
      setState({ status: "loading" });
      const params = new URLSearchParams({
        granularity,
        babyName,
      });
      if (typeof babyAgeWeeks === "number" && Number.isFinite(babyAgeWeeks)) {
        params.set("babyAgeWeeks", String(babyAgeWeeks));
      }
      try {
        const res = await fetch(`/api/tracker/insights?${params.toString()}`, {
          signal,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as InsightsResponse;
        if (!signal?.aborted) {
          setState({ status: "ready", data });
        }
      } catch (err) {
        if (signal?.aborted) return;
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong loading insights.";
        setState({ status: "error", message });
      }
    },
    [granularity, babyName, babyAgeWeeks]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    fetchInsights(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchInsights]);

  return (
    <main className="flex-1 flex flex-col bg-cream pb-32">
      <NavBar showBack backHref="/trackers" title="Insights" />

      <div className="container-app pt-5 flex flex-col gap-5">
        <GranularityToggle
          value={granularity}
          setValue={setGranularity}
        />

        <p className="text-small text-stone">
          Pippa is reading the last {RANGE_DAYS[granularity]} days of {babyName}
          &apos;s logs.
        </p>

        {state.status === "loading" && <LoadingState />}
        {state.status === "error" && (
          <ErrorState message={state.message} onRetry={() => fetchInsights()} />
        )}
        {state.status === "ready" && (
          <ReadyState data={state.data} granularity={granularity} />
        )}
      </div>
    </main>
  );
}

function ReadyState({
  data,
  granularity,
}: {
  data: InsightsResponse;
  granularity: InsightGranularity;
}) {
  const cards = data.cards;
  const isEmpty =
    cards.length === 0 ||
    cards.every((c) => !c.series || c.series.buckets.length === 0);

  if (isEmpty) {
    return <EmptyState />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-4"
    >
      {data.narrative && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl bg-peach-soft shadow-[var(--shadow-soft)] p-5 flex items-start gap-3"
        >
          <span className="shrink-0 size-9 rounded-pill bg-cream grid place-items-center text-peach">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <p className="text-body text-ink leading-snug">{data.narrative}</p>
        </motion.div>
      )}

      {cards.map((card) => (
        <motion.article
          key={card.id}
          variants={itemVariants}
          className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-5 flex flex-col gap-3"
        >
          <CardHeader card={card} />
          <p className="font-display text-h2 text-ink leading-none">
            {card.metric}
          </p>
          <CardChart card={card} granularity={granularity} />
          {card.interpretation && <Interpretation card={card} />}
        </motion.article>
      ))}
    </motion.div>
  );
}

function CardHeader({ card }: { card: InsightCard }) {
  const variant = iconVariantFor(card.id);
  return (
    <header className="flex items-center gap-3">
      <TrackerIcon variant={variant} size={48} />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <h3 className="font-display text-h3 text-plum leading-tight truncate">
          {card.title}
        </h3>
        {card.delta && (
          <DeltaPill
            direction={card.delta.direction}
            label={card.delta.label}
          />
        )}
      </div>
    </header>
  );
}

function DeltaPill({
  direction,
  label,
}: {
  direction: "up" | "down" | "flat";
  label: string;
}) {
  const map = {
    up: { Icon: TrendingUp, classes: "bg-sage-soft text-sage" },
    down: { Icon: TrendingDown, classes: "bg-clay-soft text-clay" },
    flat: { Icon: Minus, classes: "bg-bone text-stone" },
  } as const;
  const { Icon, classes } = map[direction];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-micro font-medium self-start max-w-full",
        classes
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}

function CardChart({
  card,
  granularity,
}: {
  card: InsightCard;
  granularity: InsightGranularity;
}) {
  const series = card.series;
  if (!series || series.buckets.length === 0) {
    return (
      <div className="h-32 rounded-xl bg-bone/40 grid place-items-center text-small text-stone">
        Not enough data yet.
      </div>
    );
  }

  const formatLabel = makeLabelFormatter(granularity);
  const ariaLabel = `${card.title} chart`;

  switch (card.id) {
    case "sleep-total":
      return (
        <BarChart
          buckets={series.buckets}
          color="soft-blue"
          height={140}
          ariaLabel={ariaLabel}
          formatLabel={formatLabel}
        />
      );
    case "feeds-per-day":
      return (
        <Sparkline
          buckets={series.buckets}
          color="amber"
          height={120}
          ariaLabel={ariaLabel}
          formatLabel={formatLabel}
        />
      );
    case "diaper-rhythm":
      return (
        <BarChart
          buckets={series.buckets}
          color="peach"
          secondaryColor="sage"
          height={140}
          ariaLabel={ariaLabel}
          formatLabel={formatLabel}
        />
      );
    case "sleep-longest-stretch":
      return (
        <Sparkline
          buckets={series.buckets}
          color="soft-blue"
          height={120}
          ariaLabel={ariaLabel}
          formatLabel={formatLabel}
        />
      );
    default:
      // Sensible fallback — bar chart in plum so it's visually distinct from
      // the four canonical cards.
      return (
        <BarChart
          buckets={series.buckets}
          color="plum"
          height={140}
          ariaLabel={ariaLabel}
          formatLabel={formatLabel}
        />
      );
  }
}

function Interpretation({ card }: { card: InsightCard }) {
  const interp = card.interpretation;
  if (!interp) return null;
  return (
    <div className="flex flex-col gap-2 pt-1">
      {interp.bullets.length > 0 && (
        <ul className="flex flex-col gap-1">
          {interp.bullets.map((bullet, i) => (
            <li
              key={i}
              className="text-small text-ink leading-relaxed flex gap-2"
            >
              <span aria-hidden className="text-stone">
                &bull;
              </span>
              <span className="flex-1">{bullet}</span>
            </li>
          ))}
        </ul>
      )}
      {interp.benchmark && (
        <StatusPill color="sage" className="self-start">
          {interp.benchmark}
        </StatusPill>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading insights…</span>
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-2xl bg-bone/70 motion-safe:animate-[pulseSoft_2.5s_ease-in-out_infinite]" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-4 w-1/2 rounded-pill bg-bone/70 motion-safe:animate-[pulseSoft_2.5s_ease-in-out_infinite]" />
          <div className="h-3 w-1/4 rounded-pill bg-bone/50 motion-safe:animate-[pulseSoft_2.5s_ease-in-out_infinite]" />
        </div>
      </div>
      <div className="h-7 w-2/5 rounded-pill bg-bone/70 motion-safe:animate-[pulseSoft_2.5s_ease-in-out_infinite]" />
      <div className="h-32 rounded-xl bg-bone/50 motion-safe:animate-[pulseSoft_2.5s_ease-in-out_infinite]" />
      <div className="h-3 w-3/4 rounded-pill bg-bone/50 motion-safe:animate-[pulseSoft_2.5s_ease-in-out_infinite]" />
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-5 flex flex-col gap-3 items-start">
      <h3 className="font-display text-h3 text-ink">
        We couldn&apos;t load insights right now.
      </h3>
      <p className="text-small text-stone">
        {message ? `(${message})` : "Hang tight — let's try again."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 h-11 px-5 rounded-pill bg-peach text-ink text-small font-medium hover:bg-peach/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-peach/40"
      >
        <RefreshCw
          className={cn("size-4", !reduceMotion && "")}
          aria-hidden
        />
        <span>Try again</span>
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-6 flex flex-col items-center text-center gap-4">
      <Character variant="thinking" bg="lavender" size="md" />
      <div className="flex flex-col gap-2 max-w-xs">
        <h3 className="font-display text-h3 text-ink">
          Not much to read yet.
        </h3>
        <p className="text-small text-stone">
          Log a few days first and the patterns will show up here.
        </p>
      </div>
      <PrimaryCTA href="/trackers" showArrow>
        Open trackers
      </PrimaryCTA>
    </div>
  );
}

// --- helpers --------------------------------------------------------------

function iconVariantFor(
  cardId: string
): React.ComponentProps<typeof TrackerIcon>["variant"] {
  if (cardId.startsWith("sleep")) return "sleep";
  if (cardId.startsWith("feed")) return "feed";
  if (cardId.startsWith("diaper")) return "diaper";
  return "insights";
}

function makeLabelFormatter(granularity: InsightGranularity) {
  return (key: string) => {
    try {
      switch (granularity) {
        case "day":
          return format(parseISO(key), "EEE");
        case "week": {
          // Bucket keys for week are typically ISO week strings like
          // "2026-W12" or a Monday date. Be defensive.
          if (/^\d{4}-W\d{1,2}$/.test(key)) {
            const [, week] = key.split("-W");
            return `W${week}`;
          }
          return format(parseISO(key), "MMM d");
        }
        case "month":
          if (/^\d{4}-\d{2}$/.test(key)) {
            // Append a day so parseISO reads it as a date.
            return format(parseISO(`${key}-01`), "MMM");
          }
          return format(parseISO(key), "MMM");
      }
    } catch {
      return key;
    }
  };
}
