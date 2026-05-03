// Home dashboard — top of the app. Composition follows the reference IA:
// avatar header, Cry translation card, Baby Tracker card, promo banner,
// Milestone Tracker card, Rash check card, floating dual CTA. Existing
// scan flows live behind the cards (/scan/cry, /scan/rash) and the tracker
// hub (/trackers) is reached via the Add and Tracker history links.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ClipboardList,
  FileText,
  Mic,
  Moon,
  Plus,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { TrackerEvent } from "@/lib/types";
import { TrackerIcon } from "@/components/icons/tracker-icon";
import { readProfile } from "@/components/onboarding/profile-store";
import {
  DEFAULT_AVATAR,
  avatarAlt,
  avatarSrc,
  avatarStyle,
  readAvatar,
  type AvatarSelection,
} from "@/components/onboarding/avatar";
import { cn } from "@/lib/utils";

function InsightStat({
  variant,
  label,
  value,
}: {
  variant: "sleep" | "feed" | "diaper";
  label: string;
  value: string;
}) {
  const tone =
    variant === "sleep"
      ? "bg-amber-soft"
      : variant === "feed"
        ? "bg-soft-blue-soft"
        : "bg-clay-soft";
  return (
    <li className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-3 flex flex-col gap-1.5 items-start">
      <TrackerIcon variant={variant} size={28} />
      <span
        className={cn(
          "self-start rounded-pill px-2 py-0.5 text-small font-medium text-ink",
          tone
        )}
      >
        {value}
      </span>
      <span className="text-micro uppercase tracking-wider text-stone">
        {label}
      </span>
    </li>
  );
}

function weeksSince(iso?: string): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  return Math.max(1, Math.floor(ms / (7 * 86_400_000)));
}

const TRACKER_TILES = [
  { variant: "sleep" as const, label: "Sleep", href: "/trackers/sleep/log" },
  { variant: "diaper" as const, label: "Diaper", href: "/trackers/diaper/log" },
  { variant: "feed" as const, label: "Feeding", href: "/trackers/feed/log" },
];

const MILESTONE_BARS = [
  { color: "bg-clay", fill: "w-3/12" },
  { color: "bg-sage", fill: "w-5/12" },
  { color: "bg-soft-blue", fill: "w-2/12" },
  { color: "bg-rose", fill: "w-4/12" },
] as const;

const CRY_HINTS = [
  { v: "cry" as const, dot: "bg-soft-blue" },
  { v: "sleep" as const, dot: "bg-sage" },
  { v: "diaper" as const, dot: "bg-amber" },
  { v: "feed" as const, dot: "bg-clay" },
];

type Insights = {
  sleepHrPerDay: number;
  feedsPerDay: number;
  diapersPerDay: number;
  hasData: boolean;
};

function computeInsights(events: TrackerEvent[]): Insights {
  let sleepMin = 0;
  let feeds = 0;
  let diapers = 0;
  for (const e of events) {
    if (e.eventType === "sleep") sleepMin += e.durationMinutes ?? 0;
    if (e.eventType === "feed") feeds += 1;
    if (e.eventType === "diaper") diapers += 1;
  }
  return {
    sleepHrPerDay: sleepMin / 60 / 7,
    feedsPerDay: feeds / 7,
    diapersPerDay: diapers / 7,
    hasData: events.length > 0,
  };
}

function insightNarrative(i: Insights, name: string | null): string {
  const who = name?.trim() || "your baby";
  if (!i.hasData) {
    return "Log a few days and patterns show up here — sleep streaks, feed gaps, and what's working.";
  }
  if (i.sleepHrPerDay >= 12) {
    return `${who} is sleeping ~${i.sleepHrPerDay.toFixed(1)}h a day on average — a settled rhythm. Keep the wind-down routine going.`;
  }
  if (i.feedsPerDay >= 6) {
    return `Lots of feeds (${i.feedsPerDay.toFixed(1)}/day). Could be a growth spurt — extra cuddles welcomed.`;
  }
  return `Steady week. ${i.feedsPerDay.toFixed(1)} feeds a day, ${i.diapersPerDay.toFixed(1)} diapers. Pippa is watching for changes.`;
}

export default function HomePage() {
  const [name, setName] = useState<string | null>(null);
  const [weeks, setWeeks] = useState<number | null>(null);
  const [avatar, setAvatar] = useState<AvatarSelection>(DEFAULT_AVATAR);
  const [insights, setInsights] = useState<Insights | null>(null);

  useEffect(() => {
    const p = readProfile();
    if (typeof p.name === "string" && p.name.length > 0) setName(p.name);
    setWeeks(weeksSince(p.birthDate));
    setAvatar(readAvatar());

    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
    fetch(`/api/tracker/event?since=${encodeURIComponent(since)}&limit=500`)
      .then((r) => r.json() as Promise<{ events: TrackerEvent[] }>)
      .then((d) => setInsights(computeInsights(d.events ?? [])))
      .catch(() =>
        setInsights({
          sleepHrPerDay: 0,
          feedsPerDay: 0,
          diapersPerDay: 0,
          hasData: false,
        })
      );
  }, []);

  return (
    <main className="flex-1 bg-cream pb-40">
      <section className="relative bg-gradient-to-b from-vivid-peach-soft via-peach-soft to-cream pt-10 pb-8">
        <div className="container-app flex items-start gap-4">
          <Link
            href="/profile"
            aria-label={avatarAlt(avatar, name)}
            className="relative size-20 shrink-0 rounded-full bg-cream shadow-[var(--shadow-soft)] overflow-hidden ring-2 ring-cream/80"
            style={avatarStyle(avatar) ?? undefined}
          >
            {avatarSrc(avatar) && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarSrc(avatar) as string}
                alt=""
                width={80}
                height={80}
                className="size-full object-cover"
              />
            )}
          </Link>
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <p className="font-display text-h1 text-ink leading-none">
              {name ?? "Your baby"}
            </p>
            {weeks !== null && (
              <p className="text-small text-ink/70">{weeks} weeks</p>
            )}
            <Link
              href="/profile"
              className="self-start mt-1 inline-flex items-center gap-1 rounded-pill bg-cream/80 backdrop-blur px-3 h-8 text-small text-plum shadow-[var(--shadow-soft)]"
            >
              Profile
              <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <Link
            href="/paywall"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-pill bg-cream/80 backdrop-blur px-3 h-9 text-small text-plum shadow-[var(--shadow-soft)]"
          >
            <Trophy className="size-4" aria-hidden />
            Refer & Earn
          </Link>
        </div>
      </section>

      <div className="container-app -mt-4 flex flex-col gap-4">
        <article className="rounded-2xl bg-cream p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-h2 text-plum">Cry translation</h2>
          <ul className="grid grid-cols-4 mt-4 mb-3" aria-hidden>
            {CRY_HINTS.map((c) => (
              <li key={c.v} className="flex flex-col items-center gap-1.5">
                <TrackerIcon variant={c.v} size={40} />
                <span className={cn("size-1.5 rounded-pill", c.dot)} />
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-small text-stone max-w-[18ch]">
              Translate your baby&rsquo;s cry with AI
            </p>
            <Link
              href="/scan/cry"
              className="rounded-pill bg-cream border border-bone h-11 px-5 inline-flex items-center gap-2 text-small text-clay font-medium shadow-[var(--shadow-soft)]"
            >
              Record
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        </article>

        {/* INSIGHTS — the USP. Lives high on the page so the value of the
            tracker investment is visible before the parent decides whether
            to log anything. The plum-on-cream hero treatment + double CTA
            make it unmissable. */}
        <article className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-plum to-plum/90 text-cream p-5 shadow-[var(--shadow-pop)]">
          <div className="absolute -right-6 -top-6 size-24 rounded-full bg-amber/30 blur-2xl" aria-hidden />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-amber" aria-hidden />
              <h2 className="font-display text-h2">Insights</h2>
            </div>
            <span className="text-micro uppercase tracking-wider rounded-pill bg-cream/15 px-2 py-1">
              7-day report
            </span>
          </div>
          <p className="relative text-small text-cream/80 mt-1">
            What Pippa is seeing in {name ? `${name}'s` : "your baby's"} routines.
          </p>
          <ul className="relative grid grid-cols-3 gap-3 mt-4">
            <InsightStat
              variant="sleep"
              label="Sleep"
              value={
                insights ? `${insights.sleepHrPerDay.toFixed(1)}h/d` : "—"
              }
            />
            <InsightStat
              variant="feed"
              label="Feeds"
              value={
                insights ? `${insights.feedsPerDay.toFixed(1)}/d` : "—"
              }
            />
            <InsightStat
              variant="diaper"
              label="Diapers"
              value={
                insights ? `${insights.diapersPerDay.toFixed(1)}/d` : "—"
              }
            />
          </ul>
          <p className="relative text-small text-cream/85 leading-relaxed mt-4">
            {insights
              ? insightNarrative(insights, name)
              : "Crunching the numbers…"}
          </p>
          <div className="relative flex items-center gap-2 mt-4">
            <Link
              href="/trackers/insights"
              className="rounded-pill bg-amber text-ink h-12 px-5 inline-flex items-center gap-2 text-small font-semibold hover:bg-amber/90 transition-colors shadow-[var(--shadow-pop)]"
            >
              <Sparkles className="size-4" aria-hidden />
              Open full report
            </Link>
            <Link
              href="/trackers/insights?print=1"
              className="rounded-pill bg-cream/15 text-cream h-12 px-4 inline-flex items-center gap-2 text-small font-medium hover:bg-cream/25 transition-colors"
            >
              <FileText className="size-4" aria-hidden />
              For pediatrician
            </Link>
          </div>
        </article>

        <article className="rounded-2xl bg-cream p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-h2 text-plum">Baby Tracker</h2>
            <Link
              href="/trackers"
              className="inline-flex items-center gap-1 text-small text-stone hover:text-ink"
            >
              Tracker history
              <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="grid grid-cols-3 mt-5">
            {TRACKER_TILES.map((t) => (
              <li key={t.variant} className="flex justify-center">
                <Link href={t.href} className="flex flex-col items-center gap-2">
                  <TrackerIcon variant={t.variant} size={56} />
                  <span className="text-small text-ink">{t.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 mt-5">
            <p className="text-small text-stone">
              {name
                ? `Add an entry to track ${name}'s daily routines`
                : "Add an entry to track daily routines"}
            </p>
            <Link
              href="/trackers"
              className="rounded-pill bg-cream border border-bone h-11 px-4 inline-flex items-center gap-1 text-small text-clay font-medium shadow-[var(--shadow-soft)]"
            >
              Add
              <Plus className="size-4" aria-hidden />
            </Link>
          </div>
        </article>

        <Link
          href="/paywall"
          className="rounded-2xl bg-plum text-cream px-5 py-4 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="size-10 shrink-0 rounded-pill bg-amber-soft text-plum grid place-items-center"
              aria-hidden
            >
              <Moon className="size-5" />
            </span>
            <p className="font-display text-h3 leading-tight">
              Optimize your baby&rsquo;s sleep
            </p>
          </div>
          <ChevronRight className="size-5 shrink-0" aria-hidden />
        </Link>

        <article className="rounded-2xl bg-cream p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-h2 text-plum">Milestone Tracker</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="size-20 rounded-2xl bg-amber-soft grid place-items-center shrink-0">
              <TrackerIcon variant="milestone" size={56} />
            </div>
            <ul className="flex-1 flex flex-col gap-2">
              {MILESTONE_BARS.map((m, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-pill shrink-0", m.color)} aria-hidden />
                  <span className="h-1.5 flex-1 rounded-pill bg-bone overflow-hidden">
                    <span className={cn("block h-full", m.color, m.fill)} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between gap-3 mt-5">
            <p className="text-small text-stone">
              {name
                ? `Track ${name}'s critical development milestones`
                : "Track critical development milestones"}
            </p>
            <Link
              href="/milestones"
              className="rounded-pill bg-cream border border-bone h-11 px-5 inline-flex items-center gap-1 text-small text-clay font-medium shadow-[var(--shadow-soft)]"
            >
              Start
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        </article>

        <article className="rounded-2xl bg-cream p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-h2 text-plum">Rash check</h2>
          <div className="mt-4 flex items-center gap-4">
            <TrackerIcon variant="rash" size={64} />
            <p className="text-small text-stone flex-1">
              A photo and a couple of details. Pippa triages — eczema, heat
              rash, or call the pediatrician.
            </p>
          </div>
          <div className="flex justify-end mt-4">
            <Link
              href="/scan/rash"
              className="rounded-pill bg-cream border border-bone h-11 px-5 inline-flex items-center gap-2 text-small text-clay font-medium shadow-[var(--shadow-soft)]"
            >
              Check
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        </article>

        <p className="text-micro uppercase tracking-wider text-stone text-center pt-2">
          Educational support, not medical diagnosis.
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-20 z-30 px-6 pointer-events-none print:hidden">
        <div className="container-app pointer-events-auto">
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/scan/cry"
              className="h-12 rounded-pill bg-vivid-peach text-cream font-medium inline-flex items-center justify-center gap-2 shadow-[var(--shadow-pop)]"
            >
              <Mic className="size-4" aria-hidden />
              Translate cry
            </Link>
            <Link
              href="/trackers"
              className="h-12 rounded-pill bg-vivid-peach text-cream font-medium inline-flex items-center justify-center gap-2 shadow-[var(--shadow-pop)]"
            >
              <ClipboardList className="size-4" aria-hidden />
              Log routine
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
