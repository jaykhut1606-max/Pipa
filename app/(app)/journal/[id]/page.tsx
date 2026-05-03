// Single letter view — server-rendered so the letter URL is shareable
// and the prose hydrates instantly. Client-side hydration only handles
// the print/share buttons.
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Sparkles } from "lucide-react";
import { getLetter } from "@/lib/data/letters";

type Params = { params: Promise<{ id: string }> };

const MOOD_LABEL: Record<string, string> = {
  settled: "Settled",
  steady: "Steady",
  watchful: "Watchful",
  rough: "Rough",
};

const MOOD_TONE: Record<string, string> = {
  settled: "bg-sage-soft text-sage",
  steady: "bg-peach-soft text-clay",
  watchful: "bg-amber-soft text-clay",
  rough: "bg-clay-soft text-clay",
};

function fmtMonthRange(startIso: string, endIso: string): string {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  const lastDay = new Date(end);
  lastDay.setDate(lastDay.getDate() - 1);
  const sameMonth = start.getMonth() === lastDay.getMonth();
  const yr = lastDay.getFullYear();
  if (sameMonth) {
    const month = start.toLocaleDateString(undefined, { month: "long" });
    return `${month} ${start.getDate()}–${lastDay.getDate()}, ${yr}`;
  }
  return `${start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} – ${lastDay.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}, ${yr}`;
}

function fmtSleep(min: number | undefined): string | null {
  if (typeof min !== "number" || min <= 0) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default async function LetterPage({ params }: Params) {
  const { id } = await params;
  const letter = await getLetter(id);
  if (!letter) notFound();

  const h = letter.highlights ?? {};
  const sleepStr = fmtSleep(h.longestSleepMinutes);

  return (
    <div className="flex-1 flex flex-col bg-cream pb-32">
      <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-bone">
        <div className="container-app h-14 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Link
            href="/journal"
            className="justify-self-start inline-flex items-center gap-1 text-small text-stone hover:text-ink h-10 px-2 -ml-2 rounded-pill hover:bg-bone/40 transition-colors"
            aria-label="Back to letters"
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span>Letters</span>
          </Link>
          <h1 className="font-display text-h3 text-ink truncate text-center">
            Letter
          </h1>
          <div aria-hidden />
        </div>
      </header>

      <main className="container-app pt-6 flex flex-col gap-5">
        {/* META row */}
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 text-stone">
            <Mail className="size-4 text-clay" aria-hidden />
            <p className="text-micro uppercase tracking-wider">
              {fmtMonthRange(letter.weekStart, letter.weekEnd)}
            </p>
          </div>
          {h.moodWord && MOOD_TONE[h.moodWord] && (
            <span
              className={`rounded-pill px-2.5 py-0.5 text-micro uppercase tracking-wider font-semibold ${MOOD_TONE[h.moodWord]}`}
            >
              {MOOD_LABEL[h.moodWord] ?? h.moodWord}
            </span>
          )}
        </div>

        {/* TITLE + PROSE — the artifact */}
        <article className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-6 sm:p-8 flex flex-col gap-5">
          <h2 className="font-display text-h1 text-plum leading-tight">
            {letter.title}
          </h2>
          <div className="prose prose-sm max-w-none text-ink">
            {letter.prose.split("\n").map((line, i) =>
              line.trim() ? (
                <p
                  key={i}
                  className="text-body leading-relaxed text-ink mb-3 last:mb-0"
                >
                  {line}
                </p>
              ) : null,
            )}
          </div>
          <p className="text-body italic text-clay border-l-2 border-peach pl-4 mt-2">
            {letter.closing}
          </p>
        </article>

        {/* HIGHLIGHTS — small stat strip */}
        {(h.feedsCount !== undefined ||
          h.diapersCount !== undefined ||
          h.totalSleepHours !== undefined ||
          sleepStr ||
          h.milestoneHit) && (
          <section className="rounded-2xl bg-bone/40 p-5 flex flex-col gap-3">
            <header className="flex items-center gap-2">
              <Sparkles className="size-4 text-plum" aria-hidden />
              <p className="text-micro uppercase tracking-wider text-stone font-semibold">
                What this week looked like
              </p>
            </header>
            <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {h.totalSleepHours !== undefined && (
                <Highlight label="Total sleep" value={`${h.totalSleepHours}h`} />
              )}
              {sleepStr && (
                <Highlight label="Longest sleep" value={sleepStr} />
              )}
              {h.feedsCount !== undefined && (
                <Highlight label="Feeds" value={String(h.feedsCount)} />
              )}
              {h.diapersCount !== undefined && (
                <Highlight label="Diapers" value={String(h.diapersCount)} />
              )}
            </ul>
            {h.milestoneHit && (
              <p className="text-small text-ink leading-relaxed pt-1">
                <span className="font-semibold text-plum">Milestone:</span>{" "}
                {h.milestoneHit}
              </p>
            )}
          </section>
        )}

        <Link
          href="/journal"
          className="self-center text-small text-plum font-medium hover:underline"
        >
          ← All letters
        </Link>
      </main>
    </div>
  );
}

function Highlight({ label, value }: { label: string; value: string }) {
  return (
    <li className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-3 flex flex-col items-start gap-1">
      <span className="font-display text-h2 text-ink leading-none">
        {value}
      </span>
      <span className="text-micro uppercase tracking-wider text-stone">
        {label}
      </span>
    </li>
  );
}
