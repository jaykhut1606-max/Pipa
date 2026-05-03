"use client";

// Pippa Journal — the killer surface.
//
// A list of weekly "Letters from Pippa" generated from the baby's real
// log history. The compounding artifact: at month 3 the parent has
// 12 letters they can scroll through, share, and eventually export
// as a year-end PDF baby book. Generation is on-demand (button) for
// v1; a scheduled job will fire on Sundays in v2.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Mail,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { NavBar } from "@/components/primitives/nav-bar";
import { Skeleton } from "@/components/primitives/skeleton";
import { readProfile } from "@/components/onboarding/profile-store";
import { cn } from "@/lib/utils";

type LetterHighlights = {
  longestSleepMinutes?: number;
  totalSleepHours?: number;
  feedsCount?: number;
  diapersCount?: number;
  milestoneHit?: string;
  moodWord?: "settled" | "steady" | "watchful" | "rough";
};

type Letter = {
  id: string;
  babyName: string;
  weekStart: string;
  weekEnd: string;
  title: string;
  prose: string;
  closing: string;
  highlights: LetterHighlights;
  generatedAt: string;
};

const EASE = [0.16, 1, 0.3, 1] as const;
const FADE: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

const MOOD_TONE: Record<NonNullable<LetterHighlights["moodWord"]>, string> = {
  settled: "bg-sage-soft text-sage",
  steady: "bg-peach-soft text-clay",
  watchful: "bg-amber-soft text-clay",
  rough: "bg-clay-soft text-clay",
};

function weeksSince(birthDate?: string): number | undefined {
  if (!birthDate) return undefined;
  const t = Date.parse(`${birthDate}T00:00:00`);
  if (!Number.isFinite(t)) return undefined;
  const ms = Date.now() - t;
  if (ms <= 0) return 0;
  return Math.floor(ms / (7 * 86_400_000));
}

function fmtRange(startIso: string, endIso: string): string {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  // Week range minus the exclusive day → display the inclusive last day.
  const lastDay = new Date(end);
  lastDay.setDate(lastDay.getDate() - 1);
  const sameMonth = start.getMonth() === lastDay.getMonth();
  if (sameMonth) {
    const month = start.toLocaleDateString(undefined, { month: "long" });
    return `${month} ${start.getDate()}–${lastDay.getDate()}`;
  }
  return `${start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} – ${lastDay.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

export default function JournalPage() {
  const [babyName, setBabyName] = useState<string>("Baby");
  const [babyAgeWeeks, setBabyAgeWeeks] = useState<number | undefined>();
  const [letters, setLetters] = useState<Letter[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const fetchAll = useCallback(async (name: string) => {
    try {
      const res = await fetch(
        `/api/letters?babyName=${encodeURIComponent(name)}`,
      );
      if (!res.ok) throw new Error("Could not load letters");
      const data = (await res.json()) as { letters: Letter[] };
      setLetters(data.letters ?? []);
    } catch (e) {
      setLetters([]);
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }, []);

  useEffect(() => {
    const profile = readProfile();
    const name = profile.name?.trim() || "Baby";
    setBabyName(name);
    setBabyAgeWeeks(weeksSince(profile.birthDate));
    void fetchAll(name);
  }, [fetchAll]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/letters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ babyName, babyAgeWeeks }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Could not write this week's letter.");
      }
      await fetchAll(babyName);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-cream pb-32">
      <NavBar
        title="Letters"
        showBack
        backHref="/home"
        rightAction={
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            aria-label="Write this week's letter"
            className="size-10 rounded-pill grid place-items-center text-stone hover:text-ink hover:bg-bone/40 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={cn("size-4", generating && "animate-spin")}
              aria-hidden
            />
          </button>
        }
      />

      <main className="container-app pt-6 flex flex-col gap-5">
        {/* HERO — explains the artifact */}
        <motion.section
          variants={FADE}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-plum to-plum/90 text-cream p-6 shadow-[var(--shadow-pop)]"
        >
          <div
            className="absolute -right-8 -top-8 size-32 rounded-full bg-amber/30 blur-3xl"
            aria-hidden
          />
          <div className="relative flex items-center gap-2">
            <Mail className="size-5 text-amber" aria-hidden />
            <p className="text-micro uppercase tracking-wider">
              Pippa Letters
            </p>
          </div>
          <h1 className="relative font-display text-h1 leading-tight mt-2">
            A letter back for every week you log.
          </h1>
          <p className="relative text-body text-cream/85 leading-relaxed mt-3">
            Every Sunday Pippa reads {babyName === "Baby" ? "your baby's" : `${babyName}'s`} week — feeds, sleeps, milestones, the small
            wins — and writes you a short letter. Months from now you'll
            have a journal you didn't have to write.
          </p>
          <div className="relative mt-5">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-pill bg-amber text-ink h-12 px-5 inline-flex items-center gap-2 text-small font-semibold hover:bg-amber/90 transition-colors shadow-[var(--shadow-pop)] disabled:opacity-50"
            >
              <Sparkles className="size-4" aria-hidden />
              {generating ? "Pippa is writing…" : "Write this week's letter"}
            </button>
          </div>
        </motion.section>

        {error && (
          <p className="text-small text-clay px-1">{error}</p>
        )}

        {letters === null && (
          <ul className="flex flex-col gap-4" aria-hidden>
            {Array.from({ length: 2 }).map((_, i) => (
              <li
                key={i}
                className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-5 flex flex-col gap-3"
              >
                <Skeleton className="h-3 w-24" shape="pill" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </li>
            ))}
          </ul>
        )}

        {letters !== null && letters.length === 0 && !generating && (
          <motion.div
            variants={FADE}
            initial={reduce ? false : "hidden"}
            animate="show"
            className="rounded-2xl border-2 border-dashed border-bone p-8 flex flex-col items-center text-center gap-4"
          >
            <BookOpen className="size-10 text-stone" strokeWidth={1.5} aria-hidden />
            <div className="flex flex-col gap-1">
              <p className="font-display text-h3 text-ink">
                Your first letter is one tap away.
              </p>
              <p className="text-small text-stone max-w-xs">
                Pippa needs the week&rsquo;s logs to write something honest.
                Generate now and the letter will use whatever you&rsquo;ve
                logged so far.
              </p>
            </div>
          </motion.div>
        )}

        {letters && letters.length > 0 && (
          <ul className="flex flex-col gap-4">
            {letters.map((letter, i) => (
              <motion.li
                key={letter.id}
                variants={FADE}
                initial={reduce ? false : "hidden"}
                animate="show"
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/journal/${letter.id}`}
                  className="block rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-5 hover:shadow-[var(--shadow-pop)] transition-shadow"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-micro uppercase tracking-wider text-stone">
                      {fmtRange(letter.weekStart, letter.weekEnd)}
                    </span>
                    {letter.highlights.moodWord && (
                      <span
                        className={cn(
                          "rounded-pill px-2.5 py-0.5 text-micro uppercase tracking-wider font-semibold",
                          MOOD_TONE[letter.highlights.moodWord],
                        )}
                      >
                        {letter.highlights.moodWord}
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-h2 text-plum leading-snug">
                    {letter.title}
                  </h2>
                  <p className="text-small text-stone leading-relaxed mt-2 line-clamp-3">
                    {letter.prose}
                  </p>
                  <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-bone">
                    <p className="text-small text-clay italic line-clamp-1 flex-1 min-w-0">
                      &ldquo;{letter.closing}&rdquo;
                    </p>
                    <ArrowRight className="size-4 text-stone shrink-0" aria-hidden />
                  </div>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}

        <p className="text-micro uppercase tracking-wider text-stone text-center pt-3">
          Letters live forever. Year-end PDF coming soon.
        </p>
      </main>
    </div>
  );
}
