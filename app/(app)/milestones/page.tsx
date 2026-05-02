"use client";

// Milestones — list of age buckets. Each row shows the bucket label, a
// completed/total ratio, and a progress bar. Tapping a row drops into
// /milestones/[bucket] for the per-category checklist.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import {
  BUCKETS,
  type MilestoneBucket,
} from "@/lib/milestones";
import {
  readMilestones,
  type MilestoneState,
} from "@/components/milestones/milestone-store";
import { cn } from "@/lib/utils";

export default function MilestonesPage() {
  const router = useRouter();
  const [completed, setCompleted] = useState<MilestoneState>({});

  useEffect(() => {
    setCompleted(readMilestones());
  }, []);

  return (
    <main className="flex-1 bg-cream pb-32">
      <header className="container-app pt-10 flex items-center gap-3">
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.back()}
          className="size-10 rounded-pill bg-bone/60 grid place-items-center text-stone hover:text-ink"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <h1 className="font-display text-h2 text-plum">All Milestones</h1>
      </header>

      <section className="container-app pt-6 flex flex-col gap-4">
        <p className="text-small text-stone leading-relaxed">
          From their first smile to their first word, your baby&rsquo;s
          milestones are important markers of their magical growth journey.
        </p>

        <ul className="flex flex-col gap-3 pt-2">
          {BUCKETS.map((bucket) => (
            <li key={bucket.key}>
              <BucketRow bucket={bucket} completed={completed} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function BucketRow({
  bucket,
  completed,
}: {
  bucket: MilestoneBucket;
  completed: MilestoneState;
}) {
  const total = bucket.milestones.length;
  const done = useMemo(
    () => bucket.milestones.filter((m) => completed[m.id]).length,
    [bucket, completed]
  );
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <Link
      href={`/milestones/${bucket.key}`}
      className="group rounded-2xl bg-cream shadow-[var(--shadow-soft)] p-3 flex items-center gap-4 hover:bg-bone/30 transition-colors"
    >
      <div
        className={cn(
          "size-20 shrink-0 rounded-2xl grid place-items-center",
          bucket.bg
        )}
        aria-hidden
      >
        <Sparkles className="size-9 text-plum" strokeWidth={1.6} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 pr-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-display text-h3 text-ink">{bucket.label}</p>
          <p className="text-small text-stone">
            {done} / {total}
          </p>
        </div>
        <span className="h-1 rounded-pill bg-bone overflow-hidden">
          <span
            className="block h-full bg-plum transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </span>
      </div>
      <ChevronRight
        className="size-5 text-stone shrink-0 group-hover:translate-x-0.5 transition-transform"
        aria-hidden
      />
    </Link>
  );
}
