"use client";

// Pippa Today — the USP screen.
// Anticipatory AI brief that reads the parent's day in real-time and
// tells them what's likely happening RIGHT NOW, what the day looks
// like so far, and what to expect tomorrow. Re-fetches whenever the
// page mounts so the read stays fresh.
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  ClipboardList,
  Eye,
  Lightbulb,
  Moon,
  RefreshCw,
  Sparkles,
  Sun,
} from "lucide-react";
import { NavBar } from "@/components/primitives/nav-bar";
import { TrackerIcon } from "@/components/icons/tracker-icon";
import { readProfile } from "@/components/onboarding/profile-store";
import { cn } from "@/lib/utils";

type Brief = {
  rightNow: { headline: string; detail: string; suggestion: string };
  todayShape: { summary: string; watchFor: string };
  tomorrow: { expect: string };
};

type BriefResponse = {
  brief: Brief;
  context: {
    feedsToday: number;
    diapersToday: number;
    sleepMinToday: number;
    hasEvents: boolean;
  };
};

const EASE = [0.16, 1, 0.3, 1] as const;
const FADE: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

function weeksSince(birthDate?: string): number | undefined {
  if (!birthDate) return undefined;
  const t = Date.parse(`${birthDate}T00:00:00`);
  if (!Number.isFinite(t)) return undefined;
  const ms = Date.now() - t;
  if (ms <= 0) return 0;
  return Math.floor(ms / (7 * 86_400_000));
}

function fmtSleep(min: number): string {
  if (min <= 0) return "0h";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function TodayPage() {
  const [babyName, setBabyName] = useState<string>("Baby");
  const [data, setData] = useState<BriefResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const reduce = useReducedMotion();

  const fetchBrief = async (
    name: string,
    ageWeeks: number | undefined,
  ) => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/today/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ babyName: name, babyAgeWeeks: ageWeeks }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Pippa couldn't read today right now.");
      }
      setData((await res.json()) as BriefResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const profile = readProfile();
    const name = profile.name?.trim() || "Baby";
    setBabyName(name);
    const weeks = weeksSince(profile.birthDate);
    void fetchBrief(name, weeks);
  }, []);

  const handleRefresh = () => {
    const profile = readProfile();
    const weeks = weeksSince(profile.birthDate);
    void fetchBrief(profile.name?.trim() || "Baby", weeks);
  };

  return (
    <div className="flex-1 flex flex-col bg-cream pb-32">
      <NavBar
        title="Today"
        showBack
        backHref="/home"
        rightAction={
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Refresh today's brief"
            className="size-10 rounded-pill grid place-items-center text-stone hover:text-ink hover:bg-bone/40 transition-colors disabled:opacity-50"
            disabled={refreshing}
          >
            <RefreshCw
              className={cn("size-4", refreshing && "animate-spin")}
              aria-hidden
            />
          </button>
        }
      />

      <main className="container-app pt-6 flex flex-col gap-5">
        {/* HERO — Right now */}
        <motion.section
          variants={FADE}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-vivid-peach to-vivid-peach/85 text-cream p-6 shadow-[var(--shadow-pop)]"
        >
          <div
            className="absolute -right-8 -top-8 size-32 rounded-full bg-amber/30 blur-3xl"
            aria-hidden
          />
          <div className="relative flex items-center gap-2">
            <Sun className="size-5 text-amber" aria-hidden />
            <p className="text-micro uppercase tracking-wider">Right now</p>
          </div>
          <h1 className="relative font-display text-h1 leading-tight mt-2">
            {data
              ? data.brief.rightNow.headline
              : refreshing
                ? "Reading the room…"
                : error
                  ? "Couldn't read today"
                  : "Setting up Pippa…"}
          </h1>
          <p className="relative text-body text-cream/85 leading-relaxed mt-3">
            {data
              ? data.brief.rightNow.detail
              : error ?? "Hang on, the brief is on its way."}
          </p>
          {data && (
            <div className="relative mt-5 flex items-center gap-2">
              <span className="rounded-pill bg-cream/15 px-3 py-1.5 text-small font-medium inline-flex items-center gap-2">
                <Lightbulb className="size-4 text-amber" aria-hidden />
                Try this
              </span>
              <p className="text-small text-cream/95 leading-snug flex-1">
                {data.brief.rightNow.suggestion}
              </p>
            </div>
          )}
        </motion.section>

        {/* QUICK STATS — counts to anchor the brief */}
        <motion.ul
          variants={FADE}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="grid grid-cols-3 gap-3"
        >
          <StatChip
            variant="feed"
            label="Feeds"
            value={data ? String(data.context.feedsToday) : "—"}
          />
          <StatChip
            variant="sleep"
            label="Sleep"
            value={data ? fmtSleep(data.context.sleepMinToday) : "—"}
          />
          <StatChip
            variant="diaper"
            label="Diapers"
            value={data ? String(data.context.diapersToday) : "—"}
          />
        </motion.ul>

        {/* TODAY'S SHAPE */}
        <motion.section
          variants={FADE}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-5 flex flex-col gap-3"
        >
          <header className="flex items-center gap-2">
            <Sparkles className="size-5 text-plum" aria-hidden />
            <h2 className="font-display text-h2 text-plum">Today&rsquo;s shape</h2>
          </header>
          <p className="text-body text-ink leading-relaxed">
            {data
              ? data.brief.todayShape.summary
              : "Pippa is summarizing the day so far…"}
          </p>
          {data && (
            <div className="rounded-xl bg-amber-soft p-4 flex items-start gap-3">
              <Eye className="size-5 text-clay shrink-0 mt-0.5" aria-hidden />
              <div className="flex flex-col gap-1">
                <p className="text-micro uppercase tracking-wider text-clay font-medium">
                  Watch for
                </p>
                <p className="text-small text-ink leading-relaxed">
                  {data.brief.todayShape.watchFor}
                </p>
              </div>
            </div>
          )}
        </motion.section>

        {/* TOMORROW */}
        <motion.section
          variants={FADE}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="rounded-2xl bg-soft-blue-soft p-5 flex flex-col gap-2"
        >
          <header className="flex items-center gap-2">
            <Moon className="size-5 text-vivid-blue" aria-hidden />
            <h2 className="font-display text-h2 text-ink">
              What tomorrow looks like
            </h2>
          </header>
          <p className="text-body text-ink/85 leading-relaxed">
            {data
              ? data.brief.tomorrow.expect
              : "After a few logged days, Pippa projects tomorrow's likely rhythm."}
          </p>
        </motion.section>

        {/* QUICK ACTIONS */}
        <motion.div
          variants={FADE}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="grid grid-cols-2 gap-3"
        >
          <Link
            href="/trackers"
            className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-4 flex items-center justify-between gap-3 hover:bg-bone/30 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <ClipboardList className="size-5 text-plum shrink-0" aria-hidden />
              <span className="text-small font-medium text-ink truncate">
                Log routine
              </span>
            </div>
            <ArrowRight className="size-4 text-stone shrink-0" aria-hidden />
          </Link>
          <Link
            href="/scan/cry"
            className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-4 flex items-center justify-between gap-3 hover:bg-bone/30 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <TrackerIcon variant="cry" size={32} />
              <span className="text-small font-medium text-ink truncate">
                Translate cry
              </span>
            </div>
            <ArrowRight className="size-4 text-stone shrink-0" aria-hidden />
          </Link>
        </motion.div>

        <p className="text-micro uppercase tracking-wider text-stone text-center pt-3">
          {babyName === "Baby"
            ? "Educational support, not medical diagnosis."
            : `Reading from ${babyName}'s last 24h.`}
        </p>
      </main>
    </div>
  );
}

function StatChip({
  variant,
  label,
  value,
}: {
  variant: "feed" | "sleep" | "diaper";
  label: string;
  value: string;
}) {
  const bg =
    variant === "sleep"
      ? "bg-amber-soft"
      : variant === "feed"
        ? "bg-soft-blue-soft"
        : "bg-clay-soft";
  return (
    <li
      className={cn(
        "rounded-2xl p-3 flex flex-col items-start gap-1.5 shadow-[var(--shadow-soft)]",
        bg,
      )}
    >
      <TrackerIcon variant={variant} size={28} />
      <span className="font-display text-h3 text-ink leading-none">
        {value}
      </span>
      <span className="text-micro uppercase tracking-wider text-stone">
        {label}
      </span>
    </li>
  );
}
